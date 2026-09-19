"""NCI Genomic Data Commons adapter.

GDC is the backbone: every released project, spanning TCGA, TARGET, CPTAC, CGCI, HCMI,
MMRF, BEATAML, APOLLO, NCI-MATCH and more. We treat each *project* as one dataset
record, not each program, because that is the unit a researcher actually downloads and
analyses. How many there are is whatever the API returns, and is reported in the ingest
manifest.

The interesting work here is not copying counts. It is computing, per project, how
complete the clinical variables actually are - because "clinical data available" is
useless to someone deciding whether they can run a survival model or a treatment-
response analysis. We use GDC's `_missing` facet buckets to derive real coverage
percentages for the fields those analyses depend on.
"""

from __future__ import annotations

import json
import statistics
from datetime import UTC, date, datetime
from typing import Any

from cds import clinical as cl
from cds.http import Client
from cds.model import (
    Access,
    AccessTier,
    Assay,
    ClinicalVariable,
    Cohort,
    Confidence,
    DatasetRecord,
    Demographics,
    Evidence,
    FundingRole,
    Identifier,
    IdScheme,
    LongitudinalCoverage,
    Method,
    Modality,
    OntologyTerm,
    RepositoryNode,
)

API = "https://api.gdc.cancer.gov"
PORTAL = "https://portal.gdc.cancer.gov"

GDC_NODE = RepositoryNode(
    name="NCI Genomic Data Commons",
    short_name="GDC",
    url="https://portal.gdc.cancer.gov",
    is_nci_crdc_node=True,
    is_nih_repository=True,
)

# GDC experimental_strategy -> our modality vocabulary.
STRATEGY_MODALITY: dict[str, Modality] = {
    "WXS": Modality.WXS,
    "WGS": Modality.WGS,
    "RNA-Seq": Modality.RNA_SEQ,
    "scRNA-Seq": Modality.SC_RNA_SEQ,
    "miRNA-Seq": Modality.MICRORNA,
    "Genotyping Array": Modality.COPY_NUMBER,
    "Targeted Sequencing": Modality.TARGETED_DNA,
    "Methylation Array": Modality.METHYLATION,
    "Expression Array": Modality.RNA_SEQ,
    "ATAC-Seq": Modality.ATAC_SEQ,
    "Tissue Slide": Modality.HISTOPATHOLOGY,
    "Diagnostic Slide": Modality.HISTOPATHOLOGY,
    "Reverse Phase Protein Array": Modality.PROTEIN_ARRAY,
}

STRATEGY_LABEL: dict[str, str] = {
    "WXS": "Whole exome sequencing",
    "WGS": "Whole genome sequencing",
    "RNA-Seq": "Bulk RNA sequencing",
    "scRNA-Seq": "Single-cell RNA sequencing",
    "miRNA-Seq": "microRNA sequencing",
    "Genotyping Array": "SNP genotyping array (copy number, germline)",
    "Targeted Sequencing": "Targeted DNA panel sequencing",
    "Methylation Array": "DNA methylation array",
    "Expression Array": "Gene expression microarray",
    "ATAC-Seq": "ATAC sequencing (chromatin accessibility)",
    "Tissue Slide": "Whole-slide tissue images",
    "Diagnostic Slide": "Whole-slide diagnostic images",
    "Reverse Phase Protein Array": "Reverse phase protein array",
}

# data_category -> modality, for categories that carry information the strategy list misses.
CATEGORY_MODALITY: dict[str, Modality] = {
    "clinical": Modality.CLINICAL,
    "proteome profiling": Modality.PROTEIN_ARRAY,
    "structural variation": Modality.STRUCTURAL_VARIANT,
    "somatic structural variation": Modality.STRUCTURAL_VARIANT,
    "copy number variation": Modality.COPY_NUMBER,
    "dna methylation": Modality.METHYLATION,
}

# The clinical fields that decide whether common reuse analyses are possible at all.
# Each entry: (GDC field, display label, category, why it matters)
CLINICAL_PROBES: list[tuple[str, str, str]] = [
    ("demographic.sex_at_birth", "Sex at birth", "demographic"),
    ("demographic.race", "Race", "demographic"),
    ("demographic.ethnicity", "Ethnicity", "demographic"),
    ("demographic.vital_status", "Vital status", "outcome"),
    ("demographic.cause_of_death", "Cause of death", "outcome"),
    ("demographic.population_group", "Population group", "demographic"),
    ("demographic.country_of_residence_at_enrollment", "Country of residence", "demographic"),
    ("diagnoses.primary_diagnosis", "Primary diagnosis", "diagnosis"),
    ("diagnoses.morphology", "Morphology (ICD-O)", "pathology"),
    ("diagnoses.tissue_or_organ_of_origin", "Tissue or organ of origin", "diagnosis"),
    ("diagnoses.ajcc_pathologic_stage", "AJCC pathologic stage", "staging"),
    ("diagnoses.ajcc_clinical_stage", "AJCC clinical stage", "staging"),
    ("diagnoses.tumor_grade", "Tumor grade", "pathology"),
    ("diagnoses.prior_treatment", "Prior treatment", "treatment"),
    ("diagnoses.prior_malignancy", "Prior malignancy", "diagnosis"),
    ("diagnoses.synchronous_malignancy", "Synchronous malignancy", "diagnosis"),
    ("diagnoses.progression_or_recurrence", "Progression or recurrence", "outcome"),
    ("diagnoses.last_known_disease_status", "Last known disease status", "outcome"),
    ("diagnoses.classification_of_tumor", "Classification of tumor", "pathology"),
    ("diagnoses.treatments.treatment_type", "Treatment type", "treatment"),
    ("diagnoses.treatments.treatment_or_therapy", "Treatment given", "treatment"),
    ("diagnoses.treatments.therapeutic_agents", "Therapeutic agents", "treatment"),
    ("diagnoses.treatments.treatment_outcome", "Treatment outcome", "treatment"),
    ("diagnoses.treatments.regimen_or_line_of_therapy", "Regimen or line of therapy", "treatment"),
    ("follow_ups.disease_response", "Disease response at follow-up", "followup"),
    ("follow_ups.progression_or_recurrence", "Progression at follow-up", "followup"),
    ("follow_ups.ecog_performance_status", "ECOG performance status", "followup"),
    ("exposures.tobacco_smoking_status", "Tobacco smoking status", "exposure"),
    ("exposures.alcohol_history", "Alcohol history", "exposure"),
]

# Continuous fields we pull case-by-case to compute real distributions.
#
# Follow-up time is deliberately gathered from three places. GDC stores it inconsistently
# across projects: for TCGA-BRCA `diagnoses.days_to_last_follow_up` is null for 1,097 of
# 1,098 cases while `follow_ups.days_to_follow_up` is populated for 1,096. Reading only
# the first field produced a "median follow-up" computed from a single patient, which is
# exactly the kind of plausible-looking number this project exists to catch.
CONTINUOUS_FIELDS = [
    "diagnoses.age_at_diagnosis",
    "diagnoses.days_to_last_follow_up",
    "diagnoses.days_to_recurrence",
    "demographic.days_to_death",
    "demographic.vital_status",
    "follow_ups.days_to_follow_up",
    "follow_ups.days_to_progression",
    "diagnoses.treatments.days_to_treatment_start",
]

PROJECT_EXPAND = "summary,summary.data_categories,summary.experimental_strategies,program"


def _ev(
    url: str,
    label: str,
    at: datetime,
    locator: str | None = None,
    conf: Confidence = Confidence.HIGH,
) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=url,
        source_label=label,
        retrieved_at=at,
        locator=locator,
        confidence=conf,
    )


def fetch_projects(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    """All GDC projects with summary rollups."""
    r = client.get(
        f"{API}/projects",
        params={"size": "1000", "expand": PROJECT_EXPAND, "format": "json"},
    )
    data = r.json()["data"]
    return data["hits"], r.retrieved_at


def _facet_query(
    client: Client, endpoint: str, project_id: str, facets: list[str], field: str
) -> tuple[dict[str, Any], datetime, str]:
    filt = json.dumps(
        {"op": "in", "content": {"field": field, "value": [project_id]}},
        sort_keys=True,
    )
    params = {"filters": filt, "facets": ",".join(facets), "size": "0"}
    r = client.get(f"{API}/{endpoint}", params=params)
    if not r.ok:
        return {}, r.retrieved_at, r.url
    return r.json().get("data", {}).get("aggregations", {}), r.retrieved_at, r.url


def _buckets(agg: dict[str, Any], key: str) -> tuple[dict[str, int], int]:
    """Return (value -> count) excluding _missing, plus the missing count."""
    node = agg.get(key) or {}
    out: dict[str, int] = {}
    missing = 0
    for b in node.get("buckets", []) or []:
        if b.get("key") == "_missing":
            missing = int(b.get("doc_count", 0))
        else:
            out[str(b.get("key"))] = int(b.get("doc_count", 0))
    return out, missing


# GDC's clinical fields are the shared vocabulary, so the harmonized name of a probe is
# the probe itself. The non-answer set and the response vocabulary live in cds.clinical
# because every repository needs the same ones; duplicating them here is how the GDC and
# the cBioPortal verdicts would drift apart.
NON_ANSWERS = cl.NON_ANSWERS

RESPONSE_FIELDS = {
    cl.FU_DISEASE_RESPONSE,
    cl.TREATMENT_OUTCOME,
}


def fetch_clinical_profile(
    client: Client, project_id: str, case_count: int
) -> tuple[list[ClinicalVariable], Demographics, dict[str, Any], datetime, str]:
    """Coverage for each clinical probe field, derived from facet `_missing` buckets.

    Two subtleties that matter for correctness:

    1. Nested one-to-many fields (a case can have several treatments) produce facet
       counts that sum to more than the case count. For these we can only read the
       `_missing` bucket as a per-case quantity, so we report how many cases are
       populated and flag the field as repeated rather than implying per-case shares.
    2. A field that is populated with "not reported" is not the same as a field that is
       absent. Both block an analysis, but for different reasons, so we count them
       separately and show both numbers.
    """
    facets = [f for f, _, _ in CLINICAL_PROBES]
    agg, at, url = _facet_query(client, "cases", project_id, facets, "project.project_id")

    variables: list[ClinicalVariable] = []
    for field, label, category in CLINICAL_PROBES:
        node = agg.get(field)
        if node is None:
            continue  # GDC drops fields absent from this project's node graph
        vals, missing = _buckets(agg, field)
        if not vals and not missing:
            continue  # continuous or unfaceted field; not measurable this way
        total = case_count or (sum(vals.values()) + missing)
        if not total:
            continue

        # Repeated fields: value counts are per record, so they can exceed the case count.
        is_repeated = (sum(vals.values()) + missing) > total * 1.05

        populated = max(total - missing, 0)
        not_reported = sum(v for k, v in vals.items() if k.lower() in NON_ANSWERS)
        if is_repeated:
            # Cannot attribute non-answers to distinct cases; report populated only.
            informative = None
            coverage = None
        else:
            informative = max(populated - not_reported, 0)
            coverage = round(100.0 * informative / total, 1)

        variables.append(
            ClinicalVariable(
                name=field,
                harmonized_name=field if field in cl.HARMONIZED_FIELDS else None,
                label=label,
                category=category,  # type: ignore[arg-type]
                n_nonmissing=populated,
                n_not_reported=None if is_repeated else not_reported,
                n_informative=informative,
                n_total=total,
                coverage_pct=coverage,
                populated_pct=round(100.0 * populated / total, 1),
                is_repeated=is_repeated,
                example_values=sorted(vals, key=lambda k: -vals[k])[:6],
                evidence=[
                    _ev(
                        url,
                        "GDC API /cases facets",
                        at,
                        locator=f"facet: {field}"
                        + (" (one-to-many; counts are per record)" if is_repeated else ""),
                    )
                ],
            )
        )

    sex, _ = _buckets(agg, "demographic.sex_at_birth")
    race, _ = _buckets(agg, "demographic.race")
    eth, _ = _buckets(agg, "demographic.ethnicity")
    vital, _ = _buckets(agg, "demographic.vital_status")
    country, _ = _buckets(agg, "demographic.country_of_residence_at_enrollment")
    demo = Demographics(
        sex=sex,
        race=race,
        ethnicity=eth,
        vital_status=vital,
        country_or_region=country,
        evidence=[_ev(url, "GDC API /cases facets", at, locator="demographic.*")],
    )
    return variables, demo, agg, at, url


def fetch_continuous_profile(
    client: Client, project_id: str, case_count: int
) -> tuple[LongitudinalCoverage, dict[str, float], datetime, str]:
    """Pull per-case continuous fields and compute real distributions.

    This is what turns 'has follow-up data' into 'median follow-up 31 months in 1,082 of
    1,098 cases' - the difference between a catalog entry and a usable answer.
    """
    filt = json.dumps(
        {"op": "in", "content": {"field": "project.project_id", "value": [project_id]}},
        sort_keys=True,
    )
    size = min(max(case_count, 1), 12000)
    r = client.get(
        f"{API}/cases",
        params={
            "filters": filt,
            "fields": ",".join(CONTINUOUS_FIELDS),
            "size": str(size),
            "format": "json",
        },
    )
    at, url = r.retrieved_at, r.url
    if not r.ok:
        return LongitudinalCoverage(), {}, at, url
    hits = r.json().get("data", {}).get("hits", []) or []

    ages: list[float] = []
    followups: list[float] = []
    deaths: list[float] = []
    recurrences: list[float] = []
    progressions: list[float] = []
    n_multi_followup = 0
    n_treat_timing = 0
    n_dead = 0

    def _num(x: Any) -> float | None:
        try:
            v = float(x)
        except (TypeError, ValueError):
            return None
        return v if v > -35000 else None  # GDC uses large negatives as sentinels

    for h in hits:
        dx = h.get("diagnoses") or []
        # Age and recurrence come from the diagnosis records; scan all of them, because
        # 182 of 1,098 TCGA-BRCA cases carry more than one diagnosis.
        for d in dx:
            a = _num(d.get("age_at_diagnosis"))
            if a is not None:
                ages.append(a / 365.25)
                break
        for d in dx:
            rec = _num(d.get("days_to_recurrence"))
            if rec is not None and rec >= 0:
                recurrences.append(rec / 30.44)
                break
        for d in dx:
            if any(
                _num(tx.get("days_to_treatment_start")) is not None
                for tx in (d.get("treatments") or [])
            ):
                n_treat_timing += 1
                break

        demo = h.get("demographic") or {}
        vital = str(demo.get("vital_status", "")).lower()
        if vital == "dead":
            n_dead += 1
        dd = _num(demo.get("days_to_death"))
        if dd is not None and dd >= 0:
            deaths.append(dd / 30.44)

        fus = h.get("follow_ups") or []
        if len(fus) > 1:
            n_multi_followup += 1
        for fu in fus:
            p = _num(fu.get("days_to_progression"))
            if p is not None and p >= 0:
                progressions.append(p / 30.44)

        # Follow-up time for this case: the latest contact we can evidence, from any of
        # the three places GDC records it.
        candidates: list[float] = []
        for d in dx:
            v = _num(d.get("days_to_last_follow_up"))
            if v is not None and v >= 0:
                candidates.append(v)
        for fu in fus:
            v = _num(fu.get("days_to_follow_up"))
            if v is not None and v >= 0:
                candidates.append(v)
        if dd is not None and dd >= 0:
            candidates.append(dd)
        if candidates:
            followups.append(max(candidates) / 30.44)

    def _stats(xs: list[float], prefix: str) -> dict[str, float]:
        if not xs:
            return {}
        xs = sorted(xs)
        q = (
            statistics.quantiles(xs, n=4)
            if len(xs) >= 4
            else [xs[0], statistics.median(xs), xs[-1]]
        )
        return {
            f"{prefix}_n": float(len(xs)),
            f"{prefix}_min": round(xs[0], 1),
            f"{prefix}_q1": round(q[0], 1),
            f"{prefix}_median": round(statistics.median(xs), 1),
            f"{prefix}_q3": round(q[2], 1),
            f"{prefix}_max": round(xs[-1], 1),
        }

    dist: dict[str, float] = {}
    dist.update(_stats(ages, "age_years"))
    dist.update(_stats(followups, "followup_months"))
    dist.update(_stats(deaths, "days_to_death_months"))
    dist.update(_stats(recurrences, "recurrence_months"))
    dist.update(_stats(progressions, "progression_months"))
    dist["n_cases_sampled"] = float(len(hits))
    dist["n_cases_with_followup"] = float(len(followups))
    dist["n_deceased"] = float(n_dead)
    dist["n_with_multiple_followups"] = float(n_multi_followup)
    dist["n_with_treatment_timing"] = float(n_treat_timing)

    endpoints: list[str] = []
    if n_dead > 0 or deaths:
        endpoints.append("overall survival")
    if recurrences:
        endpoints.append("recurrence-free interval")
    if progressions:
        endpoints.append("progression-free interval")

    ev = [
        _ev(
            url,
            "GDC API /cases (case-level fields)",
            at,
            locator=(
                f"computed from {len(hits)} cases; follow-up time derivable for "
                f"{len(followups)} of them"
            ),
            conf=Confidence.HIGH,
        )
    ]
    longi = LongitudinalCoverage(
        has_followup=bool(followups) or bool(deaths),
        has_survival_endpoint=bool(endpoints),
        survival_endpoints=endpoints,
        median_followup_months=round(statistics.median(followups), 1) if followups else None,
        max_followup_months=round(max(followups), 1) if followups else None,
        n_cases_with_followup=len(followups) or None,
        has_serial_samples=n_multi_followup > 0 or None,
        n_cases_with_serial=n_multi_followup or None,
        has_treatment_response=None,
        evidence=ev,
    )
    return longi, dist, at, url


def fetch_file_profile(
    client: Client, project_id: str
) -> tuple[dict[str, int], dict[str, dict[str, int]], datetime, str]:
    """Open vs controlled file split, plus platform and data-type breakdowns."""
    agg, at, url = _facet_query(
        client,
        "files",
        project_id,
        ["access", "data_category", "experimental_strategy", "data_type", "platform"],
        "cases.project.project_id",
    )
    access, _ = _buckets(agg, "access")
    others = {
        k: _buckets(agg, k)[0]
        for k in ("data_category", "experimental_strategy", "data_type", "platform")
    }
    return access, others, at, url


def _access_from_counts(access: dict[str, int], dbgap: str | None) -> Access:
    n_open = access.get("open", 0)
    n_ctrl = access.get("controlled", 0)
    if n_open and n_ctrl:
        tier = AccessTier.MIXED
    elif n_ctrl:
        tier = AccessTier.CONTROLLED
    elif n_open:
        tier = AccessTier.OPEN
    else:
        tier = AccessTier.UNKNOWN
    mechanism = None
    dua = None
    if n_ctrl:
        mechanism = (
            "Data Access Request through dbGaP using an eRA Commons account; "
            "institutional signing official approval required"
        )
        dua = (
            f"https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id={dbgap}"
            if dbgap
            else "https://gdc.cancer.gov/access-data/obtaining-access-controlled-data"
        )
    return Access(
        tier=tier,
        mechanism=mechanism,
        dua_url=dua,
        data_access_committee="NCI Data Access Committee" if n_ctrl else None,
        typical_turnaround="days to a few weeks after signing official approval"
        if n_ctrl
        else None,
        login_required=bool(n_ctrl),
        license="NIH Genomic Data Sharing Policy terms" if n_ctrl else "Open access",
        citation_requirement=(
            "Cite the dataset accession and the program's publication guidelines; "
            "see the GDC publication policy."
        ),
        publication_policy_url="https://gdc.cancer.gov/about-data/publications",
        open_components=[f"{n_open:,} open-access files"] if n_open else [],
        controlled_components=[f"{n_ctrl:,} controlled-access files"] if n_ctrl else [],
    )


def to_record(
    raw: dict[str, Any],
    projects_at: datetime,
    clinical: list[ClinicalVariable],
    demo: Demographics,
    longi: LongitudinalCoverage,
    dist: dict[str, float],
    access_counts: dict[str, int],
    file_breakdowns: dict[str, dict[str, int]],
    fetched_at: datetime,
) -> DatasetRecord:
    pid = raw["project_id"]
    program = (raw.get("program") or {}).get("name")
    summary = raw.get("summary") or {}
    projects_url = f"{API}/projects/{pid}?expand={PROJECT_EXPAND}"
    ev_project = _ev(projects_url, "GDC API /projects", projects_at)

    dbgap = raw.get("dbgap_accession_number") or (raw.get("program") or {}).get(
        "dbgap_accession_number"
    )

    idents = [
        Identifier(
            scheme=IdScheme.GDC_PROJECT,
            value=pid,
            url=f"{PORTAL}/projects/{pid}",
            is_primary=True,
            evidence=[ev_project],
        )
    ]
    if program:
        idents.append(Identifier(scheme=IdScheme.GDC_PROGRAM, value=program, evidence=[ev_project]))
    if dbgap:
        idents.append(
            Identifier(
                scheme=IdScheme.DBGAP,
                value=dbgap,
                url=f"https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id={dbgap}",
                evidence=[ev_project],
            )
        )

    # Assays: prefer experimental_strategies (specific), fall back to data_categories.
    assays: list[Assay] = []
    seen: set[Modality] = set()
    for es in summary.get("experimental_strategies") or []:
        strat = es.get("experimental_strategy")
        mod = STRATEGY_MODALITY.get(strat)
        if mod is None:
            continue
        platforms = file_breakdowns.get("platform", {})
        assays.append(
            Assay(
                modality=mod,
                label=STRATEGY_LABEL.get(strat, strat),
                platform=max(platforms, key=platforms.get) if platforms else None,  # type: ignore[arg-type]
                n_cases=es.get("case_count"),
                n_files=es.get("file_count"),
                evidence=[ev_project],
            )
        )
        seen.add(mod)
    for dc in summary.get("data_categories") or []:
        cat = str(dc.get("data_category", "")).lower()
        mod = CATEGORY_MODALITY.get(cat)
        if mod is None or mod in seen:
            continue
        assays.append(
            Assay(
                modality=mod,
                label=str(dc.get("data_category")),
                n_cases=dc.get("case_count"),
                n_files=dc.get("file_count"),
                evidence=[ev_project],
            )
        )
        seen.add(mod)

    if dist.get("age_years_n"):
        demo.age_at_diagnosis_years = {
            k.replace("age_years_", ""): v for k, v in dist.items() if k.startswith("age_years_")
        }

    cohort = Cohort(
        n_cases=summary.get("case_count"),
        n_files=summary.get("file_count"),
        total_bytes=summary.get("file_size"),
        demographics=demo,
        evidence=[ev_project],
    )

    disease_types = [d for d in (raw.get("disease_type") or []) if d]
    sites = [s for s in (raw.get("primary_site") or []) if s]

    released = raw.get("released")
    return DatasetRecord(
        id=f"gdc-{pid.lower()}",
        title=raw.get("name") or pid,
        short_title=pid,
        aliases=[pid],
        identifiers=idents,
        repository=GDC_NODE,
        program_name=program,
        nci_program=program,
        # GDC has no per-program page; link to the Projects explorer instead.
        program_url=f"{PORTAL}/analysis_page?app=Projects" if program else None,
        data_generation_funding_role=FundingRole.GENERATION,
        landing_page_url=f"{PORTAL}/projects/{pid}",
        release_date=date.fromisoformat(raw["intended_release_date"][:10])
        if raw.get("intended_release_date")
        else None,
        retrieved_at=fetched_at,
        cancer_types=[OntologyTerm(label=d) for d in disease_types],
        primary_sites=sites,
        cohort=cohort,
        assays=assays,
        clinical_variables=clinical,
        longitudinal=longi,
        access=_access_from_counts(access_counts, dbgap),
        tags=["gdc", (program or "").lower(), "released" if released else "unreleased"],
    )


def _apply_response_coverage(longi: LongitudinalCoverage, clinical: list[ClinicalVariable]) -> None:
    """Set treatment-response availability from the response-bearing clinical fields.

    'Can I study treatment response here?' is one of the highest-value questions a
    researcher brings, and one that no catalog currently answers. It is answerable from
    the coverage of a small number of specific fields, so we answer it.
    """
    criteria: list[str] = []
    for v in clinical:
        if v.name not in RESPONSE_FIELDS:
            continue
        if (v.n_nonmissing or 0) <= 0:
            continue
        criteria.extend(x for x in v.example_values if cl.is_response_value(x))
    if criteria:
        longi.has_treatment_response = True
        longi.response_criteria = sorted(set(criteria))[:8]
    else:
        longi.has_treatment_response = False


def build(
    client: Client, *, limit: int | None = None, deep: bool = True
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    """Fetch every GDC project and build records. `deep=False` skips per-project profiling."""
    hits, projects_at = fetch_projects(client)
    hits = [h for h in hits if h.get("project_id")]
    hits.sort(key=lambda h: -((h.get("summary") or {}).get("case_count") or 0))
    if limit:
        hits = hits[:limit]

    records: list[DatasetRecord] = []
    for h in hits:
        pid = h["project_id"]
        case_count = (h.get("summary") or {}).get("case_count") or 0
        if deep:
            clinical, demo, _agg, cl_at, _ = fetch_clinical_profile(client, pid, case_count)
            longi, dist, _, _ = fetch_continuous_profile(client, pid, case_count)
            access_counts, breakdowns, f_at, _ = fetch_file_profile(client, pid)
            fetched = max(projects_at, cl_at, f_at)
            _apply_response_coverage(longi, clinical)
        else:
            clinical, demo = [], Demographics()
            longi, dist = LongitudinalCoverage(), {}
            access_counts, breakdowns = {}, {}
            fetched = projects_at
        records.append(
            to_record(
                h, projects_at, clinical, demo, longi, dist, access_counts, breakdowns, fetched
            )
        )

    manifest = {
        "source": "GDC",
        "api": API,
        "n_projects": len(records),
        "fetched_at": datetime.now(UTC).isoformat(),
        "deep_profile": deep,
    }
    return records, manifest
