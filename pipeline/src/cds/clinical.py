"""One clinical vocabulary for every repository.

The six analysis verdicts on a dataset page are graded from measured field
completeness. That only works across repositories if "vital status" means the same
thing in each of them, so every adapter reports its own native field name *and* a
harmonized name drawn from the vocabulary below.

GDC's clinical model is the vocabulary, for two reasons: it is the model NCI harmonizes
its own data to, and it is the one the executed audit workbook reads. A PDC field called
`vital_status` and a cBioPortal attribute called `OS_STATUS` both carry
`harmonized_name="demographic.vital_status"`, so one set of verdict rules covers the
whole corpus while each page still shows the field its repository actually serves.

Nothing here invents coverage. A repository that does not serve a field simply has no
variable for it, and the verdict for that analysis stays "not measured".
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import Literal

from cds.model import ClinicalVariable, Evidence

Category = Literal[
    "demographic",
    "diagnosis",
    "staging",
    "treatment",
    "outcome",
    "followup",
    "exposure",
    "pathology",
    "molecular_marker",
    "other",
]

# --------------------------------------------------------------------------------------
# the harmonized names the verdicts read
# --------------------------------------------------------------------------------------

VITAL_STATUS = "demographic.vital_status"
DAYS_TO_DEATH = "demographic.days_to_death"
CAUSE_OF_DEATH = "demographic.cause_of_death"
RACE = "demographic.race"
ETHNICITY = "demographic.ethnicity"
SEX = "demographic.sex_at_birth"
POPULATION_GROUP = "demographic.population_group"
COUNTRY = "demographic.country_of_residence_at_enrollment"

AGE_AT_DIAGNOSIS = "diagnoses.age_at_diagnosis"
DAYS_TO_LAST_FOLLOW_UP = "diagnoses.days_to_last_follow_up"
PRIMARY_DIAGNOSIS = "diagnoses.primary_diagnosis"
MORPHOLOGY = "diagnoses.morphology"
TISSUE_OR_ORGAN = "diagnoses.tissue_or_organ_of_origin"
AJCC_PATHOLOGIC_STAGE = "diagnoses.ajcc_pathologic_stage"
AJCC_CLINICAL_STAGE = "diagnoses.ajcc_clinical_stage"
TUMOR_GRADE = "diagnoses.tumor_grade"
PRIOR_TREATMENT = "diagnoses.prior_treatment"
PRIOR_MALIGNANCY = "diagnoses.prior_malignancy"
SYNCHRONOUS_MALIGNANCY = "diagnoses.synchronous_malignancy"
PROGRESSION_OR_RECURRENCE = "diagnoses.progression_or_recurrence"
DAYS_TO_RECURRENCE = "diagnoses.days_to_recurrence"
LAST_KNOWN_DISEASE_STATUS = "diagnoses.last_known_disease_status"
CLASSIFICATION_OF_TUMOR = "diagnoses.classification_of_tumor"

TREATMENT_TYPE = "diagnoses.treatments.treatment_type"
TREATMENT_OR_THERAPY = "diagnoses.treatments.treatment_or_therapy"
THERAPEUTIC_AGENTS = "diagnoses.treatments.therapeutic_agents"
TREATMENT_OUTCOME = "diagnoses.treatments.treatment_outcome"
REGIMEN_OR_LINE = "diagnoses.treatments.regimen_or_line_of_therapy"
DAYS_TO_TREATMENT_START = "diagnoses.treatments.days_to_treatment_start"

FU_DISEASE_RESPONSE = "follow_ups.disease_response"
FU_PROGRESSION = "follow_ups.progression_or_recurrence"
FU_ECOG = "follow_ups.ecog_performance_status"
FU_DAYS = "follow_ups.days_to_follow_up"
FU_DAYS_TO_PROGRESSION = "follow_ups.days_to_progression"

EXPOSURE_TOBACCO = "exposures.tobacco_smoking_status"
EXPOSURE_ALCOHOL = "exposures.alcohol_history"

#: Harmonized name -> (display label, category). The single place a harmonized field is
#: described, so a page and an export cannot disagree about what a field is.
HARMONIZED_FIELDS: dict[str, tuple[str, Category]] = {
    VITAL_STATUS: ("Vital status", "outcome"),
    DAYS_TO_DEATH: ("Days to death", "outcome"),
    CAUSE_OF_DEATH: ("Cause of death", "outcome"),
    RACE: ("Race", "demographic"),
    ETHNICITY: ("Ethnicity", "demographic"),
    SEX: ("Sex at birth", "demographic"),
    POPULATION_GROUP: ("Population group", "demographic"),
    COUNTRY: ("Country of residence", "demographic"),
    AGE_AT_DIAGNOSIS: ("Age at diagnosis", "demographic"),
    DAYS_TO_LAST_FOLLOW_UP: ("Days to last follow-up", "followup"),
    PRIMARY_DIAGNOSIS: ("Primary diagnosis", "diagnosis"),
    MORPHOLOGY: ("Morphology (ICD-O)", "pathology"),
    TISSUE_OR_ORGAN: ("Tissue or organ of origin", "diagnosis"),
    AJCC_PATHOLOGIC_STAGE: ("AJCC pathologic stage", "staging"),
    AJCC_CLINICAL_STAGE: ("AJCC clinical stage", "staging"),
    TUMOR_GRADE: ("Tumor grade", "pathology"),
    PRIOR_TREATMENT: ("Prior treatment", "treatment"),
    PRIOR_MALIGNANCY: ("Prior malignancy", "diagnosis"),
    SYNCHRONOUS_MALIGNANCY: ("Synchronous malignancy", "diagnosis"),
    PROGRESSION_OR_RECURRENCE: ("Progression or recurrence", "outcome"),
    DAYS_TO_RECURRENCE: ("Days to recurrence", "outcome"),
    LAST_KNOWN_DISEASE_STATUS: ("Last known disease status", "outcome"),
    CLASSIFICATION_OF_TUMOR: ("Classification of tumor", "pathology"),
    TREATMENT_TYPE: ("Treatment type", "treatment"),
    TREATMENT_OR_THERAPY: ("Treatment given", "treatment"),
    THERAPEUTIC_AGENTS: ("Therapeutic agents", "treatment"),
    TREATMENT_OUTCOME: ("Treatment outcome", "treatment"),
    REGIMEN_OR_LINE: ("Regimen or line of therapy", "treatment"),
    DAYS_TO_TREATMENT_START: ("Days to treatment start", "treatment"),
    FU_DISEASE_RESPONSE: ("Disease response at follow-up", "followup"),
    FU_PROGRESSION: ("Progression at follow-up", "followup"),
    FU_ECOG: ("ECOG performance status", "followup"),
    FU_DAYS: ("Days to follow-up", "followup"),
    FU_DAYS_TO_PROGRESSION: ("Days to progression at follow-up", "followup"),
    EXPOSURE_TOBACCO: ("Tobacco smoking status", "exposure"),
    EXPOSURE_ALCOHOL: ("Alcohol history", "exposure"),
}

#: The fields the six verdicts read. Kept beside the vocabulary so a repository adapter
#: can be checked against what the verdicts actually need.
VERDICT_FIELDS: dict[str, tuple[str, ...]] = {
    "survival": (VITAL_STATUS, DAYS_TO_DEATH, DAYS_TO_LAST_FOLLOW_UP),
    "progression": (PROGRESSION_OR_RECURRENCE, FU_PROGRESSION),
    "treatment": (TREATMENT_OUTCOME, FU_DISEASE_RESPONSE),
    "agents": (THERAPEUTIC_AGENTS,),
    "stage": (AJCC_PATHOLOGIC_STAGE, AJCC_CLINICAL_STAGE),
    "race": (RACE, ETHNICITY),
}


# --------------------------------------------------------------------------------------
# what counts as an answer
# --------------------------------------------------------------------------------------

#: Values that occupy a field without answering it. Spellings are pooled across all five
#: repositories, because the same non-answer is written differently in each: GDC says
#: "not reported", cBioPortal says "No Value Entered" or "NA", PDC says "Not Reported".
NON_ANSWERS = {
    "",
    "-",
    "--",
    "n/a",
    "na",
    "nan",
    "none",
    "null",
    "not reported",
    "notreported",
    "unknown",
    "not allowed to collect",
    "unspecified",
    "not otherwise specified",
    "indeterminate",
    "not applicable",
    "data not available",
    "not available",
    "not evaluated",
    "not performed",
    "missing",
    "no value entered",
    "pt refused to answer",
    "patient refused",
    "refused",
    "declined to answer",
    "not collected",
    "cannot be determined",
    "unk",
    "unknown/not reported",
}


#: Patterns that make a value a non-answer whatever follows. Registries spell refusal and
#: ignorance a dozen ways - "Unknown whether Spanish or not", "Pt Refused To Answer",
#: "I choose not to answer", "unknown_other" - and an exhaustive list of spellings is a
#: list that is always one registry out of date. These are the shapes, not the strings.
_NON_ANSWER_PREFIXES = ("unknown", "not reported", "notreported", "no value")
_NON_ANSWER_SUBSTRINGS = (
    "refus",  # refused, pt refused to answer, patient refuses
    "declin",  # declined, declined to answer
    "choose not to answer",
    "prefer not to",
    "not disclosed",
    "withheld",
)


def is_non_answer(value: str | None) -> bool:
    """True when a value is present but says nothing.

    A field filled entirely with non-answers is not the same as an absent one - both
    block an analysis, for different reasons - so this decides which side of that line a
    value falls on. Getting it wrong in the lenient direction is the expensive mistake:
    it reports a cohort as usable for population analysis when every answer is "unknown".
    """
    v = (value or "").strip().lower()
    if v in NON_ANSWERS:
        return True
    if v.startswith(_NON_ANSWER_PREFIXES):
        return True
    return any(marker in v for marker in _NON_ANSWER_SUBSTRINGS)


#: Values that genuinely describe response to therapy. The response-bearing fields in
#: several repositories also carry disease-status codes - "tf-tumor free", "wt-with
#: tumor", "pdm-persistent distant metastasis" - which describe the state of the disease,
#: not how it responded to treatment. Counting those as treatment response marks cohorts
#: as usable for resistance work when they are not: WCDT-MCRPC records "persistent
#: distant metastasis" for every case and has no treatment field populated at all.
RESPONSE_VOCABULARY = (
    "complete response",
    "partial response",
    "progressive disease",
    "stable disease",
    "cr-complete response",
    "pr-partial response",
    "pd-progressive disease",
    "sd-stable disease",
    "complete remission",
    "partial remission",
    "no measurable disease",
    "persistent disease",
    "pathologic complete response",
    "treatment ongoing",
    "mixed response",
    "no response",
)

#: RECIST abbreviations, which cBioPortal studies use bare. Matched only as whole
#: values, and only inside a field already known to record response, because "PD" on its
#: own is ambiguous everywhere else.
RESPONSE_ABBREVIATIONS = {"cr", "pr", "sd", "pd", "mr", "pcr", "por", "ne"} - {"ne"}


def is_response_value(value: str) -> bool:
    """True when a value names a response to treatment rather than a disease state."""
    v = value.strip().lower()
    if v in NON_ANSWERS:
        return False
    if v in RESPONSE_ABBREVIATIONS:
        return True
    return any(v == term or v.startswith(term) for term in RESPONSE_VOCABULARY)


# --------------------------------------------------------------------------------------
# building a measured variable
# --------------------------------------------------------------------------------------


def default_label(name: str, harmonized_name: str | None) -> str:
    """A label that names the concept and, where they differ, the field behind it.

    Two source fields can carry the same concept - PDC serves both `ajcc_pathologic_stage`
    and a legacy `tumor_stage` - and labelling both "AJCC pathologic stage" put two rows
    with different numbers and the same name on one page. The concept stays first because
    that is what a reader is looking for; the field follows when it is not obvious.
    """
    meta = HARMONIZED_FIELDS.get(harmonized_name or "")
    native = (name.split(":", 1)[-1]).split(".")[-1]
    if meta is None:
        return native
    concept = (harmonized_name or "").split(".")[-1]
    return meta[0] if native == concept else f"{meta[0]} ({native})"


def from_value_counts(
    *,
    name: str,
    harmonized_name: str | None,
    n_total: int,
    values: Mapping[str, int],
    n_missing: int | None = None,
    evidence: Iterable[Evidence] = (),
    label: str | None = None,
    category: Category | None = None,
    is_repeated: bool = False,
) -> ClinicalVariable | None:
    """Turn a value histogram into a measured variable.

    `values` excludes whatever the source uses for "no record at all"; `n_missing` is
    that count when the source reports it, otherwise it is inferred from the total. The
    three quantities that matter are kept apart throughout: absent, populated but
    uninformative, and informative. Returns None when there is nothing to measure.
    """
    counts = {str(k): int(v) for k, v in values.items() if v}
    if n_total <= 0:
        return None
    if n_missing is None:
        n_missing = max(n_total - sum(counts.values()), 0)
    populated = max(n_total - n_missing, 0)
    if populated == 0 and not counts:
        # The field is absent from every record. That is a measurement, not a blank:
        # "blocked" is exactly what a researcher needs to know.
        populated = 0

    meta = HARMONIZED_FIELDS.get(harmonized_name or "", (None, "other"))
    if is_repeated:
        not_reported: int | None = None
        informative: int | None = None
        coverage: float | None = None
    else:
        not_reported = sum(v for k, v in counts.items() if is_non_answer(k))
        informative = max(populated - not_reported, 0)
        coverage = round(100.0 * informative / n_total, 1)

    return ClinicalVariable(
        name=name,
        harmonized_name=harmonized_name,
        label=label or default_label(name, harmonized_name),
        category=category or meta[1],
        n_nonmissing=populated,
        n_not_reported=not_reported,
        n_informative=informative,
        n_total=n_total,
        coverage_pct=coverage,
        populated_pct=round(100.0 * populated / n_total, 1),
        is_repeated=is_repeated,
        example_values=sorted(counts, key=lambda k: -counts[k])[:6],
        evidence=list(evidence),
    )


def from_populated_count(
    *,
    name: str,
    harmonized_name: str | None,
    n_total: int,
    n_populated: int,
    evidence: Iterable[Evidence] = (),
    label: str | None = None,
    category: Category | None = None,
    unit: str | None = None,
    is_repeated: bool = False,
) -> ClinicalVariable | None:
    """A variable we can count but not classify - a numeric field, or a one-to-many table.

    No informative/uninformative split is claimed, because without the values there is
    no way to tell one from the other.
    """
    if n_total <= 0:
        return None
    meta = HARMONIZED_FIELDS.get(harmonized_name or "", (None, "other"))
    n_populated = max(min(n_populated, n_total if not is_repeated else n_populated), 0)
    return ClinicalVariable(
        name=name,
        harmonized_name=harmonized_name,
        label=label or default_label(name, harmonized_name),
        category=category or meta[1],
        n_nonmissing=n_populated,
        n_total=n_total,
        populated_pct=round(100.0 * min(n_populated, n_total) / n_total, 1),
        is_repeated=is_repeated,
        unit=unit,
        evidence=list(evidence),
    )


# --------------------------------------------------------------------------------------
# when an endpoint is real
# --------------------------------------------------------------------------------------

#: Cases that must carry a time before a time-to-event model is worth starting.
MIN_CASES_WITH_TIME = 20

#: Events that must be observed. Below this the confidence interval on any estimate is
#: wider than the difference anyone is looking for.
MIN_EVENTS = 10

#: The canonical endpoint names, so a page and an export cannot disagree about them.
OVERALL_SURVIVAL = "overall survival"
RECURRENCE_FREE = "recurrence-free interval"
PROGRESSION_FREE = "progression-free interval"
DISEASE_FREE = "disease-free interval"

#: Endpoints that answer "did the disease come back", as opposed to "did the patient die".
PROGRESSION_ENDPOINTS = (RECURRENCE_FREE, PROGRESSION_FREE, DISEASE_FREE)


def has_time_to_event(*, n_with_time: int, n_events: int) -> bool:
    """Whether a time-to-event analysis is possible at all.

    One rule, applied by every adapter, because the alternative is three rules that
    disagree. It is the rule the executed audit workbook applies, stated in terms of what
    the analysis needs rather than of any repository's field names: a time for enough
    cases, and enough observed events.

    The failure this prevents is specific. An adapter that claimed an endpoint whenever
    any case was recorded as dead put "overall survival: supported" on five GDC projects
    for which no follow-up time is derivable for a single case - a survival analysis that
    cannot be started, advertised as possible.
    """
    return n_with_time >= MIN_CASES_WITH_TIME and n_events >= MIN_EVENTS


def by_harmonized(variables: Iterable[ClinicalVariable]) -> dict[str, ClinicalVariable]:
    """Best measured variable per harmonized name, preferring the one with more coverage."""
    out: dict[str, ClinicalVariable] = {}
    for v in variables:
        key = v.harmonized_name
        if not key:
            continue
        cur = out.get(key)
        if cur is None:
            out[key] = v
            continue
        best = lambda x: (  # noqa: E731 - local comparison key
            x.coverage_pct if x.coverage_pct is not None else (x.populated_pct or 0.0)
        )
        if best(v) > best(cur):
            out[key] = v
    return out
