"""NCI Proteomic Data Commons adapter (CPTAC, ICPC, APOLLO, CBTN, HCMI proteogenomics).

PDC organises data as one *study* per analytical fraction: "CPTAC LUAD Discovery Study -
Proteome" and "... - Phosphoproteome" are separate studies over the same tumors. A
researcher does not think of those as two datasets, so we group fractions back into one
record per biological cohort and expose the fractions as assays.

This is also where the most genuinely underexplored measurements in the NCI portfolio
live. Beyond proteome and phosphoproteome, PDC holds acetylome, intact glycoproteome,
ubiquitylome, lipidome, metabolome and protein-protein interaction studies - data types
with very few reuse publications relative to the effort that produced them.
"""

from __future__ import annotations

import re
import statistics
from collections import Counter, defaultdict
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

GRAPHQL = "https://proteomic.datacommons.cancer.gov/graphql"
PORTAL = "https://pdc.cancer.gov"

PDC_NODE = RepositoryNode(
    name="NCI Proteomic Data Commons",
    short_name="PDC",
    url="https://pdc.cancer.gov",
    is_nci_crdc_node=True,
    is_nih_repository=True,
)

FRACTION_MODALITY: dict[str, Modality] = {
    "Phosphotyrosine": Modality.PHOSPHOPROTEOME,
    "Proteome": Modality.PROTEOME,
    "Phosphoproteome": Modality.PHOSPHOPROTEOME,
    "Acetylome": Modality.ACETYLPROTEOME,
    "Glycoproteome": Modality.GLYCOPROTEOME,
    "Ubiquitylome": Modality.UBIQUITYLOME,
    "Metabolome": Modality.METABOLOME,
    "Lipidome": Modality.LIPIDOME,
    "Protein-Protein interaction": Modality.OTHER,
}

# Fractions that are rare across the whole NCI portfolio. Used to tag records for the
# "unusual measurements" discovery axis; the actual underexplored label is computed later
# from reuse evidence, not from this list.
RARE_FRACTIONS = {
    "Acetylome",
    "Glycoproteome",
    "Ubiquitylome",
    "Metabolome",
    "Lipidome",
    "Protein-Protein interaction",
}

STUDIES_QUERY = """
{
  allPrograms {
    program_id
    name
    projects {
      project_id
      name
      studies {
        study_id
        pdc_study_id
        study_name
        study_submitter_id
        submitter_id_name
        analytical_fraction
        experiment_type
        acquisition_type
        disease_type
        primary_site
        cases_count
        aliquots_count
        embargo_date
      }
    }
  }
}
"""

# Suffixes that name the fraction rather than the cohort, stripped to recover the cohort.
_FRACTION_SUFFIX = re.compile(
    r"\s*[-–]\s*(?:"
    r"(?:DIA\s+|TMT\s+|Label\s*Free\s+|LFQ\s+)?"
    r"(?:Intact\s+|N-linked\s+|Cyst\s+Fluid\s+|Whole\s+)?"
    r"(?:CompRef\s+)?"
    r"(?:Proteome|Phosphoproteome|Phosphoproteomics|Phosphotyrosine|Phosphopeptide"
    r"|Acetylome|Acetylproteome|Glycoproteome|Glycoproteomics"
    r"|Glycosite-containing\s+peptide|Ubiquitylome|Ubiquitinome|Metabolome"
    r"|Metabolomics|Lipidome|Lipidomics"
    r"|Protein-protein\s+Interaction|Proteomics|Peptidome)"
    r")\s*$",
    re.IGNORECASE,
)


def _cohort_key(study_name: str) -> str:
    """Strip the analytical-fraction suffix to recover the biological cohort name."""
    name = study_name.strip()
    for _ in range(3):  # names occasionally stack qualifiers
        stripped = _FRACTION_SUFFIX.sub("", name).strip(" -–")
        if stripped == name:
            break
        name = stripped
    return name or study_name


def _is_compref(study_name: str) -> bool:
    """CompRef studies are inter-laboratory reference materials, not patient cohorts."""
    return "compref" in study_name.lower()


def _ev(at: datetime, locator: str | None = None) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=GRAPHQL,
        source_label="PDC GraphQL allPrograms",
        retrieved_at=at,
        locator=locator,
        confidence=Confidence.HIGH,
    )


def fetch_studies(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    data, at = client.graphql(GRAPHQL, STUDIES_QUERY)
    rows: list[dict[str, Any]] = []
    for prog in (data or {}).get("allPrograms") or []:
        for proj in prog.get("projects") or []:
            for st in proj.get("studies") or []:
                rows.append(
                    {
                        **st,
                        "program_id": prog.get("program_id"),
                        "program_name": prog.get("name"),
                        "project_id": proj.get("project_id"),
                        "project_name": proj.get("name"),
                    }
                )
    return rows, at


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:70]


def group_studies(rows: list[dict[str, Any]]) -> dict[tuple[str, str], list[dict[str, Any]]]:
    """Group per-fraction studies into one entry per (project, cohort)."""
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        name = r.get("submitter_id_name") or r.get("study_name") or ""
        if not name:
            continue
        if _is_compref(name):
            continue
        key = (r.get("project_name") or "", _cohort_key(name))
        groups[key].append(r)
    return groups


def to_record(
    project_name: str,
    cohort_name: str,
    studies: list[dict[str, Any]],
    at: datetime,
    clinical: list[ClinicalVariable] | None = None,
    demographics: Demographics | None = None,
    longitudinal: LongitudinalCoverage | None = None,
    n_clinical_cases: int | None = None,
    diseases: dict[str, Counter[str]] | None = None,
) -> DatasetRecord:
    program = studies[0].get("program_name")
    ev = _ev(at, locator=f"{len(studies)} fraction studies grouped by cohort name")

    # The cohort size is the largest per-study case count; fractions are subsets of it.
    n_cases = max((s.get("cases_count") or 0) for s in studies) or None
    if n_clinical_cases and (not n_cases or n_clinical_cases > n_cases):
        # The clinical endpoint enumerates cases directly, so when it sees more of them
        # than the study summary reports, it is the better count.
        n_cases = n_clinical_cases
    n_aliquots = sum((s.get("aliquots_count") or 0) for s in studies) or None

    assays: list[Assay] = []
    fractions_present: set[str] = set()
    for s in studies:
        frac = s.get("analytical_fraction") or "Proteome"
        fractions_present.add(frac)
        mod = FRACTION_MODALITY.get(frac, Modality.PROTEOME)
        exp = s.get("experiment_type")
        acq = s.get("acquisition_type")
        label = frac if frac != "Protein-Protein interaction" else "Protein-protein interaction"
        detail = " / ".join(x for x in (exp, acq) if x)
        assays.append(
            Assay(
                modality=mod,
                label=f"{label} mass spectrometry" + (f" ({detail})" if detail else ""),
                platform=exp,
                n_cases=s.get("cases_count"),
                n_samples=s.get("aliquots_count"),
                data_levels=["raw", "peptide/protein matrix"],
                access_tier=AccessTier.OPEN,
                evidence=[ev],
            )
        )

    # Study metadata first, then the clinical records, which are where PDC now keeps
    # these. Ordered by how many cases carry each value so the commonest reads first.
    measured = diseases or {}
    disease_labels = (
        sorted({s["disease_type"] for s in studies if s.get("disease_type")})
        or [
            label
            for label, _ in measured.get("disease_type", Counter()).most_common(9)
            # "Other" is a real value in the records and names no disease, so it earns a row
            # in the coverage chart but not a term in a browse facet.
            if label.strip().lower() != "other"
        ][:8]
    )
    sites = sorted({s["primary_site"] for s in studies if s.get("primary_site")}) or [
        label for label, _ in measured.get("primary_site", Counter()).most_common(8)
    ]

    embargoes = [s["embargo_date"] for s in studies if s.get("embargo_date")]
    embargo = None
    if embargoes:
        try:
            embargo = max(date.fromisoformat(e[:10]) for e in embargoes)
        except ValueError:
            embargo = None

    idents: list[Identifier] = []
    for s in studies:
        if s.get("pdc_study_id"):
            idents.append(
                Identifier(
                    scheme=IdScheme.PDC_STUDY,
                    value=s["pdc_study_id"],
                    url=f"{PORTAL}/pdc/study/{s['pdc_study_id']}",
                    is_primary=len(idents) == 0,
                    evidence=[ev],
                )
            )
    primary_pdc = idents[0].value if idents else _slug(cohort_name)

    rare = sorted(fractions_present & RARE_FRACTIONS)
    tags = ["pdc", "proteogenomics"]
    if rare:
        tags.append("rare-modality")
    tags.extend(_slug(f) for f in rare)

    return DatasetRecord(
        id=f"pdc-{_slug(cohort_name)}",
        title=cohort_name,
        short_title=primary_pdc,
        aliases=sorted({s.get("submitter_id_name") or "" for s in studies} - {""}),
        summary=None,
        identifiers=idents,
        repository=PDC_NODE,
        program_name=program,
        nci_program=program,
        program_url=f"{PORTAL}/pdc/browse",
        data_generation_funding_role=FundingRole.GENERATION,
        landing_page_url=f"{PORTAL}/pdc/study/{primary_pdc}",
        retrieved_at=at,
        cancer_types=[OntologyTerm(label=d) for d in disease_labels],
        primary_sites=sites,
        cohort=Cohort(
            n_cases=n_cases,
            n_aliquots=n_aliquots,
            demographics=demographics or Demographics(),
            evidence=[ev],
        ),
        assays=assays,
        clinical_variables=clinical or [],
        longitudinal=longitudinal or LongitudinalCoverage(),
        access=Access(
            tier=AccessTier.OPEN,
            mechanism="Direct download from the PDC portal or its API; no account required",
            license="Open access under the PDC data use terms",
            citation_requirement=(
                "Cite the PDC study identifier and the study's primary publication; "
                "PDC asks that the consortium be acknowledged."
            ),
            publication_policy_url="https://pdc.cancer.gov/pdc/data-use-guidelines",
            embargo_until=embargo,
            login_required=False,
            open_components=[f"{len(studies)} analytical fraction studies"],
            evidence=[ev],
        ),
        tags=tags,
    )


# --------------------------------------------------------------------------------------
# clinical completeness
# --------------------------------------------------------------------------------------

# PDC serves clinical records in the GDC's harmonized vocabulary, which is the whole
# reason a proteomic cohort can be graded by the same six rules as a genomic one. The
# mapping is therefore near-identity; it is written out rather than assumed so that a
# rename upstream shows up as a missing field instead of a silent zero.
CLINICAL_FIELDS: dict[str, str] = {
    "vital_status": cl.VITAL_STATUS,
    "cause_of_death": cl.CAUSE_OF_DEATH,
    "race": cl.RACE,
    "ethnicity": cl.ETHNICITY,
    "gender": cl.SEX,
    "morphology": cl.MORPHOLOGY,
    "primary_diagnosis": cl.PRIMARY_DIAGNOSIS,
    "tissue_or_organ_of_origin": cl.TISSUE_OR_ORGAN,
    "tumor_grade": cl.TUMOR_GRADE,
    "ajcc_pathologic_stage": cl.AJCC_PATHOLOGIC_STAGE,
    "ajcc_clinical_stage": cl.AJCC_CLINICAL_STAGE,
    "tumor_stage": cl.AJCC_PATHOLOGIC_STAGE,
    "progression_or_recurrence": cl.PROGRESSION_OR_RECURRENCE,
    "last_known_disease_status": cl.LAST_KNOWN_DISEASE_STATUS,
    "prior_treatment": cl.PRIOR_TREATMENT,
    "prior_malignancy": cl.PRIOR_MALIGNANCY,
    "synchronous_malignancy": cl.SYNCHRONOUS_MALIGNANCY,
    "classification_of_tumor": cl.CLASSIFICATION_OF_TUMOR,
}

#: Disease classification. PDC used to serve these on the study record; it now returns
#: null for every study and carries them on the clinical records instead. Reading only
#: the study record left all 130 PDC cohorts with no cancer type and no primary site,
#: unfindable by the two facets researchers browse by, and nothing failed.
DISEASE_FIELDS = ("disease_type", "primary_site")

# Numeric fields, read per case so the distributions are real rather than asserted.
TIME_FIELDS = ("age_at_diagnosis", "days_to_death", "days_to_last_follow_up", "days_to_recurrence")

CLINICAL_QUERY = """
query ClinicalPerStudy($pdc_study_id: String!) {
  clinicalPerStudy(pdc_study_id: $pdc_study_id acceptDUA: true) {
    case_id
    vital_status
    cause_of_death
    race
    ethnicity
    gender
    morphology
    primary_diagnosis
    tissue_or_organ_of_origin
    disease_type
    primary_site
    tumor_grade
    tumor_stage
    ajcc_pathologic_stage
    ajcc_clinical_stage
    progression_or_recurrence
    last_known_disease_status
    prior_treatment
    prior_malignancy
    synchronous_malignancy
    classification_of_tumor
    age_at_diagnosis
    days_to_death
    days_to_last_follow_up
    days_to_recurrence
  }
}
"""

TREATMENT_QUERY = """
query Treatments($pdc_study_id: String!, $offset: Int!, $limit: Int!) {
  paginatedCaseTreatmentsPerStudy(
    pdc_study_id: $pdc_study_id offset: $offset limit: $limit acceptDUA: true
  ) {
    total
    caseTreatmentsPerStudy {
      case_id
      treatments {
        treatment_type
        therapeutic_agents
        treatment_outcome
        regimen_or_line_of_therapy
        treatment_or_therapy
        days_to_treatment_start
      }
    }
  }
}
"""

TREATMENT_PAGE = 500
MAX_TREATMENT_PAGES = 60

_DAYS_PER_MONTH = 30.44
_DAYS_PER_YEAR = 365.25


def _clinical_evidence(at: datetime, pdc_study_id: str, locator: str) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=GRAPHQL,
        source_label="PDC GraphQL clinicalPerStudy",
        retrieved_at=at,
        locator=f"{pdc_study_id}: {locator}",
        confidence=Confidence.HIGH,
    )


def _num(value: Any) -> float | None:
    """PDC returns numbers as strings, and writes 'N/A' where GDC writes null."""
    text = str(value or "").strip()
    if not text or cl.is_non_answer(text):
        return None
    try:
        return float(text)
    except ValueError:
        return None


def fetch_clinical_rows(client: Client, pdc_study_id: str) -> tuple[list[dict[str, Any]], datetime]:
    """One coalesced clinical record per case.

    Two things have to be handled here or the measurement is wrong rather than merely
    incomplete. `clinicalPerStudy` returns more rows than the study has cases when a
    case's record is split across several rows, so rows are folded together by case and
    the first non-null value of each field kept. And for a few studies it returns the
    right number of rows with every field - including `case_id` - null, which is the
    endpoint declining to answer. Rows with no case identifier are dropped, so a study
    that answers with nothing measures as "not measured" rather than as zero coverage.
    """
    data, at = client.graphql(GRAPHQL, CLINICAL_QUERY, {"pdc_study_id": pdc_study_id})
    raw = list((data or {}).get("clinicalPerStudy") or [])
    by_case: dict[str, dict[str, Any]] = {}
    for row in raw:
        cid = str(row.get("case_id") or "").strip()
        if not cid:
            continue
        cur = by_case.setdefault(cid, {"case_id": cid})
        for field, value in row.items():
            if field == "case_id":
                continue
            if cur.get(field) in (None, "") and value not in (None, ""):
                cur[field] = value
            cur.setdefault(field, None)
    return list(by_case.values()), at


def fetch_treatment_rows(
    client: Client, pdc_study_id: str
) -> tuple[list[dict[str, Any]], datetime]:
    """Every case's treatment records, paged to the end.

    A partial read here would understate how much treatment annotation a cohort has,
    which is the opposite of the error this project is willing to make.
    """
    rows: list[dict[str, Any]] = []
    at = datetime.now(UTC)
    for page in range(MAX_TREATMENT_PAGES):
        data, at = client.graphql(
            GRAPHQL,
            TREATMENT_QUERY,
            {
                "pdc_study_id": pdc_study_id,
                "offset": page * TREATMENT_PAGE,
                "limit": TREATMENT_PAGE,
            },
        )
        node = (data or {}).get("paginatedCaseTreatmentsPerStudy") or {}
        batch = node.get("caseTreatmentsPerStudy") or []
        rows.extend(r for r in batch if str(r.get("case_id") or "").strip())
        total = int(node.get("total") or 0)
        if len(batch) < TREATMENT_PAGE or len(rows) >= total:
            break
    return rows, at


def _treatment_variables(
    rows: list[dict[str, Any]], n_cases: int, at: datetime, pdc_study_id: str
) -> tuple[list[ClinicalVariable], list[str]]:
    """Per-case coverage of the treatment fields, plus any response values seen."""
    if not rows or n_cases <= 0:
        return [], []
    fields = {
        "treatment_type": cl.TREATMENT_TYPE,
        "therapeutic_agents": cl.THERAPEUTIC_AGENTS,
        "treatment_outcome": cl.TREATMENT_OUTCOME,
        "regimen_or_line_of_therapy": cl.REGIMEN_OR_LINE,
        "treatment_or_therapy": cl.TREATMENT_OR_THERAPY,
    }
    # A case may carry several treatment records, so coverage is counted per case.
    cases_with: dict[str, set[str]] = {f: set() for f in fields}
    values: dict[str, Counter[str]] = {f: Counter() for f in fields}
    for row in rows:
        cid = str(row.get("case_id") or "")
        for tx in row.get("treatments") or []:
            for field in fields:
                raw = str(tx.get(field) or "").strip()
                if not raw or cl.is_non_answer(raw):
                    continue
                cases_with[field].add(cid)
                values[field][raw] += 1

    out: list[ClinicalVariable] = []
    for field, harmonized in fields.items():
        n_pop = len(cases_with[field])
        var = cl.from_populated_count(
            name=f"pdc:treatments.{field}",
            harmonized_name=harmonized,
            n_total=n_cases,
            n_populated=n_pop,
            evidence=[
                _clinical_evidence(
                    at,
                    pdc_study_id,
                    f"paginatedCaseTreatmentsPerStudy, field {field}; informative for "
                    f"{n_pop:,} of {n_cases:,} cases",
                )
            ],
        )
        if var is not None:
            var.example_values = [v for v, _ in values[field].most_common(6)]
            out.append(var)

    responses = sorted({v for v in values["treatment_outcome"] if cl.is_response_value(v)})
    return out, responses[:8]


def fetch_clinical_profile(
    client: Client, pdc_study_id: str
) -> tuple[
    list[ClinicalVariable],
    Demographics,
    LongitudinalCoverage,
    int | None,
    dict[str, Counter[str]],
    datetime,
]:
    """Measure one PDC cohort field by field, from its own case records.

    PDC is where the most genuinely underexplored NCI measurements live, and until now
    every one of them showed "not measured" for all six analysis verdicts. The records
    are there; they just had to be counted.
    """
    rows, at = fetch_clinical_rows(client, pdc_study_id)
    n_cases = len(rows)
    if not n_cases:
        # No case-level record came back. "Not measured" is the honest answer; reporting
        # zero coverage would claim a measurement that was never made.
        return [], Demographics(), LongitudinalCoverage(), None, {}, at

    counts: dict[str, Counter[str]] = {f: Counter() for f in CLINICAL_FIELDS}
    diseases: dict[str, Counter[str]] = {f: Counter() for f in DISEASE_FIELDS}
    missing: dict[str, int] = dict.fromkeys(CLINICAL_FIELDS, 0)
    numbers: dict[str, list[float]] = {f: [] for f in TIME_FIELDS}
    # Follow-up time is per case, taken as the latest contact that case can evidence.
    # Pooling the two time fields into one flat list instead would count a patient who
    # has both twice and make the median meaningless.
    followup_days: list[float] = []

    for row in rows:
        for field in CLINICAL_FIELDS:
            raw = row.get(field)
            text = str(raw or "").strip()
            if raw is None or text == "":
                missing[field] += 1
            else:
                counts[field][text] += 1
        for field in TIME_FIELDS:
            v = _num(row.get(field))
            if v is not None:
                numbers[field].append(v)
        for field in DISEASE_FIELDS:
            value = str(row.get(field) or "").strip()
            if value and not cl.is_non_answer(value):
                diseases[field][value] += 1
        candidates = [
            v
            for v in (_num(row.get("days_to_last_follow_up")), _num(row.get("days_to_death")))
            if v is not None and v >= 0
        ]
        if candidates:
            followup_days.append(max(candidates))

    variables: list[ClinicalVariable] = []
    for field, harmonized in CLINICAL_FIELDS.items():
        # A field absent from every case is still a measurement, and the one that blocks
        # work, so it is reported rather than skipped.
        var = cl.from_value_counts(
            name=f"pdc:{field}",
            harmonized_name=harmonized,
            n_total=n_cases,
            values=counts[field],
            n_missing=missing[field],
            evidence=[
                _clinical_evidence(
                    at, pdc_study_id, f"clinicalPerStudy, field {field} over {n_cases:,} cases"
                )
            ],
        )
        if var is not None:
            variables.append(var)

    for field, harmonized, unit in (
        ("age_at_diagnosis", cl.AGE_AT_DIAGNOSIS, "days"),
        ("days_to_death", cl.DAYS_TO_DEATH, "days"),
        ("days_to_last_follow_up", cl.DAYS_TO_LAST_FOLLOW_UP, "days"),
        ("days_to_recurrence", cl.DAYS_TO_RECURRENCE, "days"),
    ):
        var = cl.from_populated_count(
            name=f"pdc:{field}",
            harmonized_name=harmonized,
            n_total=n_cases,
            n_populated=len(numbers[field]),
            unit=unit,
            evidence=[
                _clinical_evidence(
                    at,
                    pdc_study_id,
                    f"clinicalPerStudy, field {field}; a value for "
                    f"{len(numbers[field]):,} of {n_cases:,} cases",
                )
            ],
        )
        if var is not None:
            variables.append(var)

    tx_rows, tx_at = fetch_treatment_rows(client, pdc_study_id)
    tx_vars, responses = _treatment_variables(tx_rows, n_cases, tx_at, pdc_study_id)
    variables.extend(tx_vars)
    at = max(at, tx_at)

    demo = Demographics(
        sex=dict(counts["gender"]),
        race=dict(counts["race"]),
        ethnicity=dict(counts["ethnicity"]),
        vital_status=dict(counts["vital_status"]),
        evidence=[_clinical_evidence(at, pdc_study_id, "clinicalPerStudy demographic fields")],
    )
    ages = [a / _DAYS_PER_YEAR for a in numbers["age_at_diagnosis"]]
    if ages:
        demo.age_at_diagnosis_years = {
            "n": float(len(ages)),
            "min": round(min(ages), 1),
            "median": round(statistics.median(ages), 1),
            "max": round(max(ages), 1),
        }

    longi = _longitudinal(counts, numbers, followup_days, responses, n_cases, at, pdc_study_id)
    return variables, demo, longi, n_cases, diseases, at


def _longitudinal(
    counts: dict[str, Counter[str]],
    numbers: dict[str, list[float]],
    followup_days: list[float],
    responses: list[str],
    n_cases: int,
    at: datetime,
    pdc_study_id: str,
) -> LongitudinalCoverage:
    """Survival and progression endpoints, on the same rule the workbook applies to GDC."""
    deaths = sum(
        n for v, n in counts["vital_status"].items() if v.strip().lower().startswith("dead")
    )
    informative_vital = sum(n for v, n in counts["vital_status"].items() if not cl.is_non_answer(v))
    times = sorted(t / _DAYS_PER_MONTH for t in followup_days)

    endpoints: list[str] = []
    if informative_vital >= 20 and deaths >= 10 and times:
        endpoints.append("overall survival")
    recurrences = [t for t in numbers["days_to_recurrence"] if t >= 0]
    if len(recurrences) >= 10:
        endpoints.append("recurrence-free interval")

    progression_informative = sum(
        n for v, n in counts["progression_or_recurrence"].items() if not cl.is_non_answer(v)
    )
    return LongitudinalCoverage(
        has_followup=bool(times) or None,
        has_survival_endpoint=bool(endpoints),
        survival_endpoints=endpoints,
        median_followup_months=round(statistics.median(times), 1) if times else None,
        max_followup_months=round(max(times), 1) if times else None,
        n_cases_with_followup=len(times) or None,
        has_treatment_response=bool(responses),
        response_criteria=responses,
        evidence=[
            _clinical_evidence(
                at,
                pdc_study_id,
                f"computed from {n_cases:,} cases: {deaths:,} deaths, {len(times):,} with a "
                f"follow-up time, progression informative for {progression_informative:,}",
            )
        ],
    )


def build(
    client: Client, *, limit: int | None = None, deep: bool = True
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    rows, at = fetch_studies(client)
    groups = group_studies(rows)
    ordered = sorted(
        groups.items(),
        key=lambda kv: -max((s.get("cases_count") or 0) for s in kv[1]),
    )
    if limit:
        ordered = ordered[:limit]

    records: list[DatasetRecord] = []
    n_profiled = 0
    n_with_clinical = 0
    for (proj, cohort), studies in ordered:
        clinical: list[ClinicalVariable] = []
        demo: Demographics | None = None
        longi: LongitudinalCoverage | None = None
        n_clinical_cases: int | None = None
        diseases: dict[str, Counter[str]] = {}
        if deep:
            # One clinical read per cohort, on the fraction study that sees the most
            # cases: the fractions share a cohort, so reading each one would be the same
            # patients several times over.
            best = max(studies, key=lambda s: s.get("cases_count") or 0)
            pdc_id = best.get("pdc_study_id")
            if pdc_id:
                clinical, demo, longi, n_clinical_cases, diseases, _ = fetch_clinical_profile(
                    client, str(pdc_id)
                )
                n_profiled += 1
                n_with_clinical += bool(clinical)
        records.append(
            to_record(
                proj,
                cohort,
                studies,
                at,
                clinical=clinical,
                demographics=demo,
                longitudinal=longi,
                n_clinical_cases=n_clinical_cases,
                diseases=diseases,
            )
        )
    records.sort(key=lambda r: -(r.cohort.n_cases or 0))
    manifest = {
        "source": "PDC",
        "api": GRAPHQL,
        "n_studies_seen": len(rows),
        "n_compref_excluded": sum(1 for r in rows if _is_compref(r.get("submitter_id_name") or "")),
        "n_cohort_records": len(records),
        "n_clinically_profiled": n_profiled,
        "n_with_clinical_records": n_with_clinical,
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
