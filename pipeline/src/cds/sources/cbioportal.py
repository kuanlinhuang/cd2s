"""cBioPortal adapter - the discovery channel for investigator-generated datasets.

The major programs are easy to enumerate because they have their own portals. The
long tail is not: a single lab publishes a cohort, deposits it, and it is thereafter
findable only by someone who already knows it exists. Roughly half of the value of NCI's
data investment sits in that tail.

cBioPortal is a good place to find it, because its curators have already done the hard
part - taking published cohorts and harmonising them into a comparable form - and they
record the PMID of the paper each study came from. That gives us a route the major
portals cannot: take every cBioPortal study, resolve its publication through NIH
RePORTER, and keep the ones an NCI award actually paid for. The result is a list of
NCI-supported investigator cohorts that no NCI catalog enumerates.

A caveat we carry on every record: cBioPortal hosts processed data. Presence here means
the cohort has been harmonized for reuse, which is a genuine signal of reusability, but
the record points back to the originating repository for the primary data.
"""

from __future__ import annotations

import re
import statistics
from datetime import UTC, datetime
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
    Publication,
    RepositoryNode,
)
from cds.sources import reporter as rp

API = "https://www.cbioportal.org/api"
PORTAL = "https://www.cbioportal.org"

CBIO_NODE = RepositoryNode(
    name="cBioPortal for Cancer Genomics",
    short_name="cBioPortal",
    url="https://www.cbioportal.org",
    is_nci_crdc_node=False,
    is_nih_repository=False,
)

# cBioPortal sample-count field -> (modality, label)
COUNT_MODALITY: list[tuple[str, Modality, str]] = [
    ("sequencedSampleCount", Modality.TARGETED_DNA, "Mutation calls (panel, exome or genome)"),
    ("cnaSampleCount", Modality.COPY_NUMBER, "Copy number alterations"),
    ("mrnaRnaSeqV2SampleCount", Modality.RNA_SEQ, "RNA sequencing expression"),
    ("mrnaRnaSeqSampleCount", Modality.RNA_SEQ, "RNA sequencing expression"),
    ("mrnaMicroarraySampleCount", Modality.RNA_SEQ, "Microarray expression"),
    ("miRnaSampleCount", Modality.MICRORNA, "microRNA expression"),
    ("methylationHm27SampleCount", Modality.METHYLATION, "DNA methylation (HM27)"),
    ("rppaSampleCount", Modality.PROTEIN_ARRAY, "Reverse phase protein array"),
    ("massSpectrometrySampleCount", Modality.PROTEOME, "Mass spectrometry proteomics"),
]

# Studies already represented by a primary-repository record; we link rather than duplicate.
AGGREGATE_PATTERNS = re.compile(
    r"(^|_)(tcga|pan_can_atlas|msk_impact_50k|metastatic_solid_tumors|pancan|"
    r"mixed_allen_2018|genie)($|_)",
    re.I,
)


def _slug(text: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-"))[:70]


_TAG = re.compile(r"<[^>]+>")
_ENTITIES = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " "}


def _plain(text: str | None) -> str | None:
    """cBioPortal descriptions contain raw HTML anchors, which the site renders as text.

    The site shows a description as prose, not as markup, so the tags are removed and the
    link text kept: "<a href=...>Creative Commons BY-NC-ND 4.0 license</a>" becomes
    "Creative Commons BY-NC-ND 4.0 license" rather than appearing verbatim on the page.
    """
    if not text:
        return None
    out = _TAG.sub("", text)
    for entity, char in _ENTITIES.items():
        out = out.replace(entity, char)
    return re.sub(r"\s{2,}", " ", out).strip() or None


def fetch_studies(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    r = client.get(f"{API}/studies", params={"projection": "DETAILED"})
    return (r.json() if r.ok else []), r.retrieved_at


def _ev(
    at: datetime, study_id: str, locator: str | None = None, conf: Confidence = Confidence.HIGH
) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=f"{API}/studies/{study_id}",
        source_label="cBioPortal API /studies",
        retrieved_at=at,
        locator=locator,
        confidence=conf,
    )


def to_record(
    study: dict[str, Any],
    at: datetime,
    nci_grants: list[Any],
    grant_at: datetime | None,
    clinical: list[ClinicalVariable] | None = None,
    n_patients: int | None = None,
    longitudinal: LongitudinalCoverage | None = None,
    demographics: Demographics | None = None,
    n_treated_patients: int | None = None,
) -> DatasetRecord:
    sid = study["studyId"]
    ev = _ev(at, sid)
    name = study.get("name") or sid
    ct = study.get("cancerType") or {}
    pmid = str(study.get("pmid") or "").split(",")[0].strip() or None

    assays: list[Assay] = []
    seen: set[Modality] = set()
    for field, mod, label in COUNT_MODALITY:
        n = study.get(field) or 0
        if not n:
            continue
        if mod in seen:
            continue
        seen.add(mod)
        assays.append(
            Assay(
                modality=mod,
                label=label,
                n_samples=int(n),
                data_levels=["processed matrix"],
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator=f"field: {field}")],
            )
        )
    n_sv = study.get("structuralVariantCount") or 0
    if n_sv:
        assays.append(
            Assay(
                modality=Modality.STRUCTURAL_VARIANT,
                label="Structural variants / fusions",
                n_files=int(n_sv),
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator="field: structuralVariantCount")],
            )
        )
    n_tx = study.get("treatmentCount") or 0
    if n_tx:
        # `treatmentCount` counts treatment *records*, not patients, so it goes in the
        # file column rather than the case column. The patient count comes from the
        # treatments endpoint and is reported as a clinical variable instead.
        assays.append(
            Assay(
                modality=Modality.TREATMENT,
                label="Structured treatment records",
                n_files=int(n_tx),
                n_cases=n_treated_patients or None,
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator="field: treatmentCount")],
            )
        )

    pubs: list[Publication] = []
    if pmid:
        pubs.append(
            Publication(
                pmid=pmid,
                title=None,
                authors_short=study.get("citation"),
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                evidence=[_ev(at, sid, locator="field: pmid")],
            )
        )

    tags = ["cbioportal", "investigator-cohort", "harmonized-for-reuse"]
    if n_tx:
        tags.append("treatment-annotated")
    if nci_grants:
        tags.append("nci-funded")

    return DatasetRecord(
        id=f"cbio-{_slug(sid)}",
        title=name,
        short_title=sid,
        aliases=[sid],
        summary=_plain(study.get("description")),
        identifiers=[
            Identifier(
                scheme=IdScheme.CBIOPORTAL_STUDY,
                value=sid,
                url=f"{PORTAL}/study/summary?id={sid}",
                is_primary=True,
                evidence=[ev],
            )
        ],
        repository=CBIO_NODE,
        program_name="Investigator-initiated cohort (harmonized in cBioPortal)",
        nci_program=None,
        program_url=f"{PORTAL}/study/summary?id={sid}",
        data_generation_funding_role=(
            FundingRole.GENERATION if nci_grants else FundingRole.UNKNOWN
        ),
        landing_page_url=f"{PORTAL}/study/summary?id={sid}",
        retrieved_at=at,
        cancer_types=[OntologyTerm(label=ct.get("name"), ontology="cBioPortal", code=ct.get("id"))]
        if ct.get("name")
        else [],
        primary_sites=[ct["parent"]] if ct.get("parent") else [],
        cohort=Cohort(
            n_cases=n_patients,
            n_samples=study.get("allSampleCount"),
            demographics=demographics or Demographics(),
            evidence=[_ev(at, sid, locator="field: allSampleCount")],
        ),
        assays=assays,
        clinical_variables=clinical or [],
        longitudinal=longitudinal
        or LongitudinalCoverage(
            has_treatment_response=bool(n_tx) or None,
            evidence=[_ev(at, sid, locator="field: treatmentCount", conf=Confidence.MEDIUM)],
        ),
        access=Access(
            tier=AccessTier.OPEN,
            mechanism=(
                "Processed data download from the cBioPortal study page or its public "
                "REST API; no account required. Primary raw data remain wherever the "
                "original investigators deposited them."
            ),
            license="Per-study terms; cBioPortal asks that the original study be cited",
            citation_requirement=(
                "Cite the original publication, and cite cBioPortal if the portal's "
                "harmonized files were used."
            ),
            publication_policy_url="https://www.cbioportal.org/faq",
            login_required=False,
            open_components=["harmonized mutation, copy-number, expression and clinical files"],
            evidence=[_ev(at, sid, conf=Confidence.MEDIUM)],
        ),
        primary_publications=pubs,
        grants=nci_grants,
        tags=tags,
    )


# --------------------------------------------------------------------------------------
# clinical completeness
# --------------------------------------------------------------------------------------

# cBioPortal's documented standard clinical attributes, mapped onto the shared
# vocabulary. Only the standard names are mapped: a study that invents
# "CRDB_SURVIVAL_STATUS" is not claiming the same thing as OS_STATUS, and guessing from
# the spelling would manufacture coverage that is not there. Everything else is still
# reported on the page as a measured field, just without a harmonized name, so it counts
# toward nothing it should not.
# https://docs.cbioportal.org/file-formats/#clinical-data
STANDARD_ATTRIBUTES: dict[str, str] = {
    "OS_STATUS": cl.VITAL_STATUS,
    "VITAL_STATUS": cl.VITAL_STATUS,
    "DSS_STATUS": cl.VITAL_STATUS,
    "CAUSE_OF_DEATH": cl.CAUSE_OF_DEATH,
    "RACE": cl.RACE,
    "ETHNICITY": cl.ETHNICITY,
    "SEX": cl.SEX,
    "GENDER": cl.SEX,
    "PFS_STATUS": cl.PROGRESSION_OR_RECURRENCE,
    "DFS_STATUS": cl.PROGRESSION_OR_RECURRENCE,
    "RFS_STATUS": cl.PROGRESSION_OR_RECURRENCE,
    "AJCC_PATHOLOGIC_TUMOR_STAGE": cl.AJCC_PATHOLOGIC_STAGE,
    "PATH_STAGE": cl.AJCC_PATHOLOGIC_STAGE,
    "PATHOLOGIC_STAGE": cl.AJCC_PATHOLOGIC_STAGE,
    "TUMOR_STAGE": cl.AJCC_PATHOLOGIC_STAGE,
    "STAGE": cl.AJCC_PATHOLOGIC_STAGE,
    "CLINICAL_STAGE": cl.AJCC_CLINICAL_STAGE,
    "AJCC_CLINICAL_TUMOR_STAGE": cl.AJCC_CLINICAL_STAGE,
    "GRADE": cl.TUMOR_GRADE,
    "TUMOR_GRADE": cl.TUMOR_GRADE,
    "HISTOLOGICAL_GRADE": cl.TUMOR_GRADE,
    "PRIOR_TREATMENT": cl.PRIOR_TREATMENT,
    "SMOKING_STATUS": cl.EXPOSURE_TOBACCO,
    "SMOKING_HISTORY": cl.EXPOSURE_TOBACCO,
    "ONCOTREE_CODE": cl.PRIMARY_DIAGNOSIS,
    "PRIMARY_SITE": cl.TISSUE_OR_ORGAN,
    "AGE": cl.AGE_AT_DIAGNOSIS,
    "AGE_AT_DIAGNOSIS": cl.AGE_AT_DIAGNOSIS,
    # Response to therapy, which is a different claim from "a treatment is recorded".
    # Only these carry a RECIST-style judgement; a drug name does not.
    "RESPONSE": cl.TREATMENT_OUTCOME,
    "BEST_RESPONSE": cl.TREATMENT_OUTCOME,
    "BEST_OVERALL_RESPONSE": cl.TREATMENT_OUTCOME,
    "TREATMENT_BEST_RESPONSE": cl.TREATMENT_OUTCOME,
    "TREATMENT_RESPONSE": cl.TREATMENT_OUTCOME,
    "RECIST": cl.TREATMENT_OUTCOME,
    "CLINICAL_BENEFIT": cl.TREATMENT_OUTCOME,
    "DURABLE_CLINICAL_BENEFIT": cl.TREATMENT_OUTCOME,
}

#: The subset of the above that records response to therapy rather than a covariate.
RESPONSE_ATTRIBUTES = frozenset(
    a for a, h in STANDARD_ATTRIBUTES.items() if h == cl.TREATMENT_OUTCOME
)

# Numeric attributes that carry a time. Each is fetched value by value, because the
# median of a follow-up distribution is the number a researcher needs and a histogram
# cannot give it exactly.
TIME_ATTRIBUTES: dict[str, tuple[str, str]] = {
    "OS_MONTHS": ("overall survival", cl.DAYS_TO_LAST_FOLLOW_UP),
    "PFS_MONTHS": ("progression-free interval", cl.DAYS_TO_RECURRENCE),
    "DFS_MONTHS": ("disease-free interval", cl.DAYS_TO_RECURRENCE),
    "RFS_MONTHS": ("recurrence-free interval", cl.DAYS_TO_RECURRENCE),
}

# cBioPortal writes event status as "1:DECEASED" / "0:LIVING". The prefix is the event
# indicator and the label is what a reader sees, so we read the label.
_CODED = re.compile(r"^\s*[01]\s*:\s*")

# Labels that mean the event happened.
_EVENT_WORDS = ("deceased", "dead", "recurred", "recurrence", "progression", "progressed", "event")

#: Patients per page when pulling a numeric attribute. The fetch pages to the end rather
#: than stopping at a cap: a truncated read would report "20,000 cases with follow-up"
#: for a cohort of 25,000 and compute the median from whichever patients came back
#: first, which is exactly the plausible-looking wrong number this project exists to
#: catch.
PAGE_SIZE = 10000
MAX_PAGES = 20


def _strip_code(value: str) -> str:
    return _CODED.sub("", str(value)).strip()


def fetch_patient_count(client: Client, study_id: str) -> tuple[int | None, datetime, str]:
    """Patients, not samples. MSK cohorts routinely carry several samples per patient."""
    url = f"{API}/studies/{study_id}/patients"
    r = client.get(url, params={"projection": "META"})
    if not r.ok:
        return None, r.retrieved_at, r.url
    raw = r.headers.get("total-count")
    try:
        return int(raw), r.retrieved_at, r.url
    except (TypeError, ValueError):
        return None, r.retrieved_at, r.url


def fetch_attributes(client: Client, study_id: str) -> tuple[list[dict[str, Any]], datetime, str]:
    r = client.get(f"{API}/studies/{study_id}/clinical-attributes")
    return (r.json() if r.ok else []), r.retrieved_at, r.url


def fetch_category_counts(
    client: Client, study_id: str, attribute_ids: list[str]
) -> tuple[dict[str, dict[str, int]], datetime, str]:
    """Value histograms for categorical attributes, in one request.

    The API returns one bucket per distinct value, including an explicit `NA` bucket for
    patients the attribute is absent for, so absent and uninformative stay separable.
    """
    if not attribute_ids:
        return {}, datetime.now(UTC), f"{API}/clinical-data-counts/fetch"
    url = f"{API}/clinical-data-counts/fetch"
    body = {
        "attributes": [{"attributeId": a} for a in sorted(attribute_ids)],
        "studyViewFilter": {"studyIds": [study_id]},
    }
    r = client.post(url, body=body)
    if not r.ok:
        return {}, r.retrieved_at, url
    out: dict[str, dict[str, int]] = {}
    for item in r.json() or []:
        out[str(item.get("attributeId"))] = {
            str(c.get("value")): int(c.get("count") or 0) for c in item.get("counts") or []
        }
    return out, r.retrieved_at, url


def fetch_numeric_values(
    client: Client, study_id: str, attribute_id: str
) -> tuple[list[float], int, datetime, str]:
    """Every recorded value of one numeric patient attribute, and how many rows it had."""
    url = f"{API}/studies/{study_id}/clinical-data"
    values: list[float] = []
    n_rows = 0
    at = datetime.now(UTC)
    for page in range(MAX_PAGES):
        r = client.get(
            url,
            params={
                "attributeId": attribute_id,
                "clinicalDataType": "PATIENT",
                "projection": "SUMMARY",
                "pageSize": str(PAGE_SIZE),
                "pageNumber": str(page),
            },
        )
        at = r.retrieved_at
        if not r.ok:
            break
        rows = r.json() or []
        n_rows += len(rows)
        for row in rows:
            raw = str(row.get("value") or "").strip()
            if not raw or cl.is_non_answer(raw):
                continue
            try:
                values.append(float(raw))
            except ValueError:
                continue
        if len(rows) < PAGE_SIZE:
            break
    return values, n_rows, at, url


def fetch_treatment_counts(client: Client, study_id: str) -> tuple[int, list[str], datetime, str]:
    """Patients with at least one named therapeutic agent, and the agents themselves."""
    url = f"{API}/treatments/patient-counts/fetch"
    r = client.post(url, body={"studyIds": [study_id]})
    if not r.ok:
        return 0, [], r.retrieved_at, url
    payload = r.json() or {}
    agents = [
        str(t.get("treatment"))
        for t in sorted(
            payload.get("patientTreatments") or [],
            key=lambda t: -(t.get("count") or 0),
        )
        if t.get("treatment")
    ]
    return int(payload.get("totalPatients") or 0), agents, r.retrieved_at, url


def _median(xs: list[float]) -> float | None:
    return round(statistics.median(xs), 1) if xs else None


def _demographics(counts: dict[str, dict[str, int]], at: datetime, study_id: str) -> Demographics:
    """The demographic histograms the browse facets and the race verdict read.

    They are the same numbers already measured as clinical variables; without them the
    page said "the repository's harmonized records carry no demographics" directly above
    a chart showing race for 96% of the cohort.
    """

    def bucket(*attribute_ids: str) -> dict[str, int]:
        for aid in attribute_ids:
            raw = counts.get(aid)
            if raw:
                return {_strip_code(k): v for k, v in raw.items() if k != "NA" and v}
        return {}

    return Demographics(
        sex=bucket("SEX", "GENDER"),
        race=bucket("RACE"),
        ethnicity=bucket("ETHNICITY"),
        vital_status=bucket("OS_STATUS", "VITAL_STATUS"),
        evidence=[_ev(at, study_id, locator="POST /clinical-data-counts/fetch")],
    )


def fetch_clinical_profile(
    client: Client, study: dict[str, Any]
) -> tuple[list[ClinicalVariable], int | None, LongitudinalCoverage, Demographics, int, datetime]:
    """Measure one cBioPortal study the same way the GDC projects are measured.

    cBioPortal harmonizes published cohorts into a common schema, which is exactly what
    makes this possible: the counts come back per patient for patient-level attributes,
    with an explicit bucket for patients the attribute is absent for.
    """
    sid = study["studyId"]
    n_patients, at_p, url_p = fetch_patient_count(client, sid)
    attrs, at_a, url_a = fetch_attributes(client, sid)
    n_samples = study.get("allSampleCount") or 0
    at = max(at_p, at_a)

    patient_attrs = {
        str(a["clinicalAttributeId"]): a
        for a in attrs
        if a.get("clinicalAttributeId") and a.get("patientAttribute")
    }
    sample_attrs = {
        str(a["clinicalAttributeId"]): a
        for a in attrs
        if a.get("clinicalAttributeId") and not a.get("patientAttribute")
    }

    # Only attributes that map onto the shared vocabulary are worth a request: the rest
    # cannot feed a verdict and would triple the payload for no gain.
    categorical = [
        aid
        for aid, a in {**patient_attrs, **sample_attrs}.items()
        if aid in STANDARD_ATTRIBUTES and str(a.get("datatype", "")).upper() == "STRING"
    ]
    counts, at_c, url_c = fetch_category_counts(client, sid, categorical)
    at = max(at, at_c)

    variables: list[ClinicalVariable] = []
    for aid in sorted(categorical):
        buckets = counts.get(aid)
        if buckets is None:
            continue
        total = sum(buckets.values())
        if total <= 0:
            continue
        # "NA" is cBioPortal's marker for a patient the attribute has no row for.
        n_missing = buckets.pop("NA", 0)
        attr = patient_attrs.get(aid) or sample_attrs.get(aid) or {}
        unit = "patients" if aid in patient_attrs else "samples"
        values = {_strip_code(k): v for k, v in buckets.items()}
        var = cl.from_value_counts(
            name=f"cbioportal:{aid}",
            harmonized_name=STANDARD_ATTRIBUTES[aid],
            n_total=total,
            values=values,
            n_missing=n_missing,
            label=str(attr.get("displayName") or aid),
            evidence=[
                _ev(
                    at_c,
                    sid,
                    locator=f"POST /clinical-data-counts/fetch, attribute {aid}; "
                    f"denominator is {total:,} {unit}",
                )
            ],
        )
        if var is not None:
            var.unit = unit
            variables.append(var)

    # Numeric time fields: the count is exact and the median is the number that decides
    # whether a survival analysis is worth starting.
    times: dict[str, tuple[list[float], int]] = {}
    for aid in sorted(TIME_ATTRIBUTES):
        if aid not in patient_attrs:
            continue
        values, n_rows, at_n, url_n = fetch_numeric_values(client, sid, aid)
        at = max(at, at_n)
        if not n_rows:
            continue
        times[aid] = (values, n_rows)
        denom = n_patients or n_rows
        var = cl.from_populated_count(
            name=f"cbioportal:{aid}",
            harmonized_name=TIME_ATTRIBUTES[aid][1],
            n_total=denom,
            n_populated=len(values),
            unit="months",
            label=str(patient_attrs[aid].get("displayName") or aid),
            evidence=[
                _ev(
                    at_n,
                    sid,
                    locator=f"GET /studies/{sid}/clinical-data?attributeId={aid}; "
                    f"{len(values):,} of {denom:,} patients carry a value",
                )
            ],
        )
        if var is not None:
            variables.append(var)

    # Treatments are a separate resource, and the one that answers "which drug".
    n_treated, agents, at_t, url_t = fetch_treatment_counts(client, sid)
    at = max(at, at_t)
    if study.get("treatmentCount") or n_treated:
        denom = n_patients or n_samples or n_treated
        var = cl.from_populated_count(
            name="cbioportal:therapeutic_agents",
            harmonized_name=cl.THERAPEUTIC_AGENTS,
            n_total=denom,
            n_populated=n_treated,
            label="Named therapeutic agents",
            evidence=[
                _ev(
                    at_t,
                    sid,
                    locator=f"POST /treatments/patient-counts/fetch; {n_treated:,} of "
                    f"{denom:,} patients have at least one named agent",
                )
            ],
        )
        if var is not None:
            var.example_values = agents[:6]
            variables.append(var)

    longi = _longitudinal(times, counts, at, sid, n_treated=n_treated)
    return variables, n_patients, longi, _demographics(counts, at, sid), n_treated, at


def _event_share(buckets: dict[str, int] | None) -> tuple[int, int]:
    """(events, informative) from a coded status histogram."""
    if not buckets:
        return 0, 0
    events = 0
    informative = 0
    for raw, n in buckets.items():
        if raw == "NA":
            continue
        label = _strip_code(raw).lower()
        if cl.is_non_answer(label):
            continue
        informative += n
        if any(w in label for w in _EVENT_WORDS):
            events += n
    return events, informative


def _longitudinal(
    times: dict[str, tuple[list[float], int]],
    counts: dict[str, dict[str, int]],
    at: datetime,
    study_id: str,
    *,
    n_treated: int = 0,
) -> LongitudinalCoverage:
    """Survival and progression endpoints, from the status fields and their times.

    The rule is the workbook's rule, applied to cBioPortal's spellings: a survival
    endpoint exists when a status field is informative for at least twenty patients,
    carries at least ten events, and has a matching time.

    Treatment response is deliberately not inferred from `treatmentCount`. A study can
    record which drugs a patient received and never record whether the disease responded
    - that is the common case, not the exception - so response is claimed only where a
    response-bearing attribute holds RECIST-style values.
    """
    os_values = times.get("OS_MONTHS", ([], 0))[0]
    os_events, os_informative = _event_share(counts.get("OS_STATUS") or counts.get("VITAL_STATUS"))
    endpoints: list[str] = []
    if os_values and os_informative >= 20 and os_events >= 10:
        endpoints.append("overall survival")
    for aid in ("PFS_MONTHS", "DFS_MONTHS", "RFS_MONTHS"):
        values = times.get(aid, ([], 0))[0]
        status_id = aid.replace("_MONTHS", "_STATUS")
        events, informative = _event_share(counts.get(status_id))
        if values and informative >= 20 and events >= 10:
            endpoints.append(TIME_ATTRIBUTES[aid][0])

    response_values: list[str] = []
    saw_response_field = False
    for aid in RESPONSE_ATTRIBUTES:
        buckets = counts.get(aid)
        if buckets is None:
            continue
        saw_response_field = True
        response_values.extend(
            _strip_code(v) for v, n in buckets.items() if n and cl.is_response_value(_strip_code(v))
        )

    followups = os_values or next((v for v, _ in times.values() if v), [])
    return LongitudinalCoverage(
        has_followup=bool(followups) or None,
        has_survival_endpoint=bool(endpoints) if (times or counts) else None,
        survival_endpoints=endpoints,
        has_treatment_response=(
            bool(response_values) if (saw_response_field or n_treated or counts) else None
        ),
        response_criteria=sorted(set(response_values))[:8],
        median_followup_months=_median(followups),
        max_followup_months=round(max(followups), 1) if followups else None,
        n_cases_with_followup=len(followups) or None,
        evidence=[
            _ev(
                at,
                study_id,
                locator=(
                    f"derived from {', '.join(sorted(times)) or 'no time attribute'}"
                    + (f"; {os_events:,} deaths recorded" if os_events else "")
                ),
                conf=Confidence.HIGH,
            )
        ],
    )


def build(
    client: Client,
    *,
    limit: int | None = None,
    deep: bool = True,
    min_samples: int = 40,
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    studies, at = fetch_studies(client)
    kept = [
        s
        for s in studies
        if s.get("publicStudy")
        and (s.get("allSampleCount") or 0) >= min_samples
        and not AGGREGATE_PATTERNS.search(s.get("studyId") or "")
        and str(s.get("pmid") or "").strip()
    ]
    kept.sort(key=lambda s: -(s.get("allSampleCount") or 0))

    n_candidates = len(kept)
    grants_by_study: dict[str, list[Any]] = {}
    grant_at: datetime | None = None
    n_nci = 0
    if deep:
        pmids = [str(s["pmid"]).split(",")[0].strip() for s in kept]
        mapping, grant_at = rp.pmids_to_core_projects(client, pmids)
        all_nci_cores = sorted({c for cores in mapping.values() for c in cores if rp.is_nci(c)})
        details, _ = rp.fetch_project_details(client, all_nci_cores)
        for s in kept:
            pmid = str(s["pmid"]).split(",")[0].strip()
            cores = [c for c in mapping.get(pmid, []) if rp.is_nci(c)]
            if cores:
                n_nci += 1
            grants_by_study[s["studyId"]] = [
                rp.to_grant(
                    c,
                    details.get(c),
                    rp.infer_role(c, is_primary_publication=True),
                    pmid,
                    grant_at,
                )
                for c in cores
            ]

    # Keep NCI-supported cohorts. Without the grant lookup we cannot tell, so keep all.
    selected = [s for s in kept if (not deep) or grants_by_study.get(s["studyId"])]
    if limit:
        selected = selected[:limit]

    # Profile only the studies that survive selection: measuring a cohort we are about
    # to drop is four wasted requests each.
    records: list[DatasetRecord] = []
    n_profiled = 0
    n_with_verdict_field = 0
    for s in selected:
        clinical: list[ClinicalVariable] | None = None
        n_patients: int | None = None
        longi: LongitudinalCoverage | None = None
        demo: Demographics | None = None
        n_treated = 0
        if deep:
            clinical, n_patients, longi, demo, n_treated, _ = fetch_clinical_profile(client, s)
            n_profiled += 1
            harmonized = {v.harmonized_name for v in clinical if v.harmonized_name}
            if harmonized & {f for fs in cl.VERDICT_FIELDS.values() for f in fs}:
                n_with_verdict_field += 1
        records.append(
            to_record(
                s,
                at,
                grants_by_study.get(s["studyId"], []),
                grant_at,
                clinical=clinical,
                n_patients=n_patients,
                longitudinal=longi,
                demographics=demo,
                n_treated_patients=n_treated or None,
            )
        )

    manifest = {
        "source": "cBioPortal",
        "api": API,
        "n_public_studies": len(studies),
        "n_candidates_after_filters": n_candidates,
        "n_with_nci_award_on_publication": n_nci,
        "n_records": len(records),
        "n_clinically_profiled": n_profiled,
        "n_with_a_verdict_field_measured": n_with_verdict_field,
        "min_samples": min_samples,
        "filters": (
            "public studies with a PMID and at least min_samples samples, excluding "
            "TCGA/GENIE/pan-cancer aggregates already represented by primary-repository "
            "records; retained only where NIH RePORTER links the study's publication to "
            "an NCI (CA-series) award."
        ),
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
