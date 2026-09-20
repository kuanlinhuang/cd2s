"""Core data model for the Cancer Data Showcase.

Design principle: every statement the site makes about a dataset is either (a) pulled
directly from a machine-readable source, (b) extracted from a document, or (c) asserted
by a human reviewer - and in all three cases it carries an `Evidence` record saying
where it came from, when, and how confident we are. Nothing renders on the site without
provenance. This is what lets a reader verify any claim independently.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# --------------------------------------------------------------------------------------
# Provenance primitives
# --------------------------------------------------------------------------------------


class CDSModel(BaseModel):
    """Base for every model here.

    `validate_assignment` is the point. Records are built by assignment, not only by
    construction: source adapters set fields as they discover them, the merge folds one
    record into another, the reuse model writes its index back, and curation overlays
    patch fields straight from YAML. Without this, a mistyped value in a hand-written
    overlay lands in the published JSON and only surfaces as a serializer warning nobody
    reads. With it, the pipeline fails where the bad value was introduced.
    """

    model_config = ConfigDict(validate_assignment=True)


class Method(str, Enum):
    """How a claim came to be."""

    API = "api"  # read from a structured API response
    FILE = "file"  # parsed from a published file (manifest, data dictionary)
    FULLTEXT = "fulltext"  # extracted from article or documentation prose
    DERIVED = "derived"  # computed from other fields in this repository
    CURATED = "curated"  # asserted by a named human reviewer
    LLM_EXTRACTED = "llm_extracted"  # proposed by a model, awaiting or holding review


class Confidence(str, Enum):
    HIGH = "high"  # structured source, or human-verified
    MEDIUM = "medium"  # consistent across sources, or unambiguous prose
    LOW = "low"  # single weak source, or inference
    UNVERIFIED = "unverified"  # model-proposed, not yet reviewed


class Evidence(CDSModel):
    """Where a claim came from. Rendered as a citation chip next to the claim."""

    method: Method
    source_url: str | None = None
    source_label: str | None = Field(
        default=None, description="Human-readable source name, e.g. 'GDC API /projects'"
    )
    retrieved_at: datetime | None = None
    snippet: str | None = Field(
        default=None, max_length=2000, description="Verbatim supporting text, if extracted"
    )
    locator: str | None = Field(
        default=None,
        description="Where in the source, e.g. 'Methods, para 3' or 'field: cases_count'",
    )
    confidence: Confidence = Confidence.MEDIUM
    reviewer: str | None = None
    reviewed_at: date | None = None
    note: str | None = None

    @field_validator("snippet")
    @classmethod
    def _strip(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class SubjectScope(str, Enum):
    SINGLE = "single"
    SEVERAL = "several"
    PAN_CANCER = "pan_cancer"
    NON_CANCER = "non_cancer"
    NOT_STATED = "not_stated"
    TITLE_DERIVED = "title_derived"


class Subject(CDSModel):
    scope: SubjectScope = SubjectScope.NOT_STATED
    tissues: list[str] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# Identity and provenance
# --------------------------------------------------------------------------------------


class IdScheme(str, Enum):
    GDC_PROJECT = "gdc_project_id"
    GDC_PROGRAM = "gdc_program"
    PDC_STUDY = "pdc_study_id"
    PDC_STUDY_UUID = "pdc_study_uuid"
    DBGAP = "dbgap_phs"
    SRA_BIOPROJECT = "bioproject"
    GEO_SERIES = "geo_series"
    SYNAPSE = "synapse_id"
    IDC_COLLECTION = "idc_collection_id"
    TCIA_COLLECTION = "tcia_collection"
    CBIOPORTAL_STUDY = "cbioportal_study_id"
    CDS_STUDY = "cds_study"
    ICDC_STUDY = "icdc_study"
    CCDI_STUDY = "ccdi_study"
    DOI = "doi"
    ACCESSION_OTHER = "accession_other"
    ZENODO = "zenodo"
    EGA = "ega"
    ARRAYEXPRESS = "arrayexpress"
    PRIDE = "pride"
    MASSIVE = "massive"
    METABOLOMICS_WB = "metabolomics_workbench"
    IMMPORT = "immport"
    GTEX = "gtex"


class Identifier(CDSModel):
    scheme: IdScheme
    value: str
    url: str | None = None
    is_primary: bool = False
    evidence: list[Evidence] = Field(default_factory=list)


class RepositoryNode(CDSModel):
    """The archive that actually serves the bytes."""

    name: str  # "Genomic Data Commons"
    short_name: str  # "GDC"
    url: str
    is_nci_crdc_node: bool = False
    is_nih_repository: bool = False


class FundingRole(str, Enum):
    """The distinction the challenge explicitly asks us to make explicit."""

    GENERATION = "generation"  # NCI funds created these data
    REUSE = "reuse"  # NCI funds paid for analysis of data generated elsewhere
    INFRASTRUCTURE = "infrastructure"  # NCI funds the repository / harmonization
    UNKNOWN = "unknown"


class Grant(CDSModel):
    core_project_num: str | None = None
    project_num: str | None = None
    title: str | None = None
    pi_names: list[str] = Field(default_factory=list)
    agency_ic: str | None = None
    activity_code: str | None = None
    fiscal_years: list[int] = Field(default_factory=list)
    award_amount_usd: int | None = None
    org_name: str | None = None
    reporter_url: str | None = None
    role: FundingRole = FundingRole.UNKNOWN
    evidence: list[Evidence] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# At a glance
# --------------------------------------------------------------------------------------


class OntologyTerm(CDSModel):
    label: str
    ontology: str | None = None  # "NCIt", "OncoTree", "ICD-O-3", "MONDO", "UBERON"
    code: str | None = None
    url: str | None = None


class Modality(str, Enum):
    WGS = "wgs"
    WXS = "wxs"
    BULK_DNA = "bulk_dna"  # bulk DNA sequencing where the capture strategy is unstated
    TARGETED_DNA = "targeted_dna"
    RNA_SEQ = "rna_seq"
    SC_RNA_SEQ = "scrna_seq"
    SC_ATAC = "scatac_seq"
    SPATIAL_TRANSCRIPTOMICS = "spatial_transcriptomics"
    SPATIAL_PROTEOMICS = "spatial_proteomics"
    METHYLATION = "methylation"
    ATAC_SEQ = "atac_seq"
    CHIP_SEQ = "chip_seq"
    HIC = "hic"
    MICRORNA = "mirna"
    PROTEOME = "proteome"
    PHOSPHOPROTEOME = "phosphoproteome"
    ACETYLPROTEOME = "acetylproteome"
    GLYCOPROTEOME = "glycoproteome"
    UBIQUITYLOME = "ubiquitylome"
    METABOLOME = "metabolome"
    LIPIDOME = "lipidome"
    PROTEIN_ARRAY = "protein_array"
    FLOW_CYTOMETRY = "flow_cytometry"
    CYTOF = "cytof"
    IMMUNE_REPERTOIRE = "immune_repertoire"
    RADIOLOGY = "radiology"
    HISTOPATHOLOGY = "histopathology"
    IMAGING_MASS_CYTOMETRY = "imaging_mass_cytometry"
    ELECTRON_MICROSCOPY = "electron_microscopy"
    CLINICAL = "clinical"
    OUTCOME = "outcome"
    TREATMENT = "treatment"
    GERMLINE = "germline"
    COPY_NUMBER = "copy_number"
    STRUCTURAL_VARIANT = "structural_variant"
    PHARMACOLOGY = "pharmacology"
    FUNCTIONAL_SCREEN = "functional_screen"
    MODEL_SYSTEM = "model_system"
    EPIDEMIOLOGY = "epidemiology"
    PATIENT_REPORTED = "patient_reported"
    OTHER = "other"


class Assay(CDSModel):
    modality: Modality
    label: str  # human-facing, e.g. "Whole exome sequencing (Illumina)"
    platform: str | None = None
    n_cases: int | None = None
    n_samples: int | None = None
    n_files: int | None = None
    data_levels: list[str] = Field(default_factory=list)  # "raw", "aligned", "called", "matrix"
    access_tier: AccessTier | None = None
    evidence: list[Evidence] = Field(default_factory=list)


class Demographics(CDSModel):
    """Population coverage. Deliberately explicit, because 'who is in this cohort' is
    one of the most common reasons a reuse plan fails."""

    sex: dict[str, int] = Field(default_factory=dict)
    race: dict[str, int] = Field(default_factory=dict)
    ethnicity: dict[str, int] = Field(default_factory=dict)
    age_at_diagnosis_years: dict[str, float] = Field(
        default_factory=dict, description="min/q1/median/q3/max where available"
    )
    vital_status: dict[str, int] = Field(default_factory=dict)
    country_or_region: dict[str, int] = Field(default_factory=dict)
    evidence: list[Evidence] = Field(default_factory=list)


class Cohort(CDSModel):
    n_cases: int | None = None
    n_samples: int | None = None
    n_aliquots: int | None = None
    n_files: int | None = None
    total_bytes: int | None = None
    n_tumor_cases: int | None = None
    n_normal_cases: int | None = None
    has_matched_normal: bool | None = None
    demographics: Demographics = Field(default_factory=Demographics)
    evidence: list[Evidence] = Field(default_factory=list)


class ClinicalVariable(CDSModel):
    """A clinical field with its actual completeness - not just 'clinical data available'."""

    name: str
    harmonized_name: str | None = Field(
        default=None,
        description="The same concept's name in the shared vocabulary (cds.clinical), so "
        "completeness is comparable across repositories that spell the field "
        "differently. None when the source field has no harmonized equivalent.",
    )
    label: str | None = None
    category: Literal[
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
    ] = "other"
    n_nonmissing: int | None = Field(
        default=None, description="Cases where the field is populated with any value"
    )
    n_not_reported: int | None = Field(
        default=None,
        description="Cases where the field is present but says 'not reported' / 'unknown'. "
        "Tracked separately because a populated-but-uninformative field is a different "
        "problem from an absent one.",
    )
    n_informative: int | None = Field(
        default=None, description="Populated and not an explicit non-answer"
    )
    n_total: int | None = None
    coverage_pct: float | None = Field(
        default=None, description="Percent of cases with an informative value"
    )
    populated_pct: float | None = Field(
        default=None, description="Percent of cases where the field is populated at all"
    )
    is_repeated: bool = Field(
        default=False,
        description="True for one-to-many fields (e.g. treatments per diagnosis), where "
        "value counts are per record and cannot be read as per-case percentages.",
    )
    example_values: list[str] = Field(default_factory=list)
    unit: str | None = None
    evidence: list[Evidence] = Field(default_factory=list)


class LongitudinalCoverage(CDSModel):
    has_followup: bool | None = None
    has_survival_endpoint: bool | None = None
    survival_endpoints: list[str] = Field(default_factory=list)  # OS, PFS, DFS, RFS
    median_followup_months: float | None = None
    max_followup_months: float | None = None
    n_cases_with_followup: int | None = Field(
        default=None,
        description="Cases with a derivable follow-up time. Reported alongside the "
        "median because a median computed from one patient is not a median.",
    )
    has_serial_samples: bool | None = None
    timepoints: list[str] = Field(default_factory=list)  # "pre-treatment", "on-treatment", ...
    n_cases_with_serial: int | None = None
    has_treatment_response: bool | None = None
    response_criteria: list[str] = Field(default_factory=list)  # RECIST, pCR, ...
    evidence: list[Evidence] = Field(default_factory=list)


class AccessTier(str, Enum):
    OPEN = "open"  # download without registration
    REGISTERED = "registered"  # free account, click-through terms
    CONTROLLED = "controlled"  # dbGaP / DAC approval required
    MIXED = "mixed"
    REQUEST = "request"  # bespoke request to the generating team
    UNKNOWN = "unknown"


class Access(CDSModel):
    tier: AccessTier = AccessTier.UNKNOWN
    open_components: list[str] = Field(default_factory=list)
    controlled_components: list[str] = Field(default_factory=list)
    mechanism: str | None = None  # "dbGaP DAR via eRA Commons", "Synapse certified user", ...
    dua_url: str | None = None
    data_access_committee: str | None = None
    typical_turnaround: str | None = None
    embargo_until: date | None = None
    login_required: bool | None = None
    citation_requirement: str | None = None
    license: str | None = None
    publication_policy_url: str | None = None
    evidence: list[Evidence] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# Interpretation: the "what can I do with this" layer
# --------------------------------------------------------------------------------------


class QuestionFeasibility(str, Enum):
    DIRECT = "direct"  # answerable with the shipped data as-is
    NEEDS_LINKAGE = "needs_linkage"  # needs another dataset joined in
    NEEDS_ACCESS = "needs_access"  # needs controlled-access approval
    EXPLORATORY = "exploratory"  # underpowered; hypothesis-generating only


class ResearchQuestion(CDSModel):
    """A concrete question the dataset can support, with the fields that make it possible."""

    question: str
    rationale: str  # why the data support it
    required_fields: list[str] = Field(default_factory=list)
    required_modalities: list[Modality] = Field(default_factory=list)
    feasibility: QuestionFeasibility = QuestionFeasibility.DIRECT
    approx_n: int | None = None
    statistical_note: str | None = None
    exemplar_pmid: str | None = None  # a study that did something like this
    topics: list[str] = Field(default_factory=list)
    evidence: list[Evidence] = Field(default_factory=list)


class LimitationKind(str, Enum):
    MISSING_DATA = "missing_data"
    POPULATION_COVERAGE = "population_coverage"
    TREATMENT_CONTEXT = "treatment_context"
    STATISTICAL_POWER = "statistical_power"
    BATCH_TECHNICAL = "batch_technical"
    ANNOTATION_QUALITY = "annotation_quality"
    ASCERTAINMENT_BIAS = "ascertainment_bias"
    ACCESS_CONSTRAINT = "access_constraint"
    HARMONIZATION = "harmonization"
    CONSENT_SCOPE = "consent_scope"
    PLATFORM_OBSOLESCENCE = "platform_obsolescence"
    OTHER = "other"


class Severity(str, Enum):
    BLOCKING = "blocking"  # invalidates a class of analysis outright
    MAJOR = "major"  # requires explicit mitigation
    MINOR = "minor"  # worth knowing, manageable


class Limitation(CDSModel):
    kind: LimitationKind
    statement: str
    severity: Severity = Severity.MAJOR
    affected_analyses: list[str] = Field(default_factory=list)
    mitigation: str | None = None
    evidence: list[Evidence] = Field(default_factory=list)


class InappropriateUse(CDSModel):
    statement: str
    reason: str
    evidence: list[Evidence] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# Reuse tracing
# --------------------------------------------------------------------------------------


class ReuseTier(str, Enum):
    """Graded evidence ladder. The central methodological commitment of this project:
    'cited the paper' is not 'used the data', and we refuse to conflate them."""

    T0_MENTION = "t0_mention"  # names the program/dataset, no accession, no analysis
    T1_ACCESSION = "t1_accession"  # accession appears in the full text
    T2_DECLARED = "t2_declared"  # accession in a data-availability or methods statement
    T3_ANALYZED = "t3_analyzed"  # methods describe analysis of these data; results depend on it
    T4_CONFIRMED = "t4_confirmed"  # T3 plus human adjudication, or author/repository confirmation


class ReuseKind(str, Enum):
    PRIMARY = "primary"  # the marker paper for the dataset itself
    SECONDARY_ANALYSIS = "secondary_analysis"
    METHOD_BENCHMARK = "method_benchmark"
    VALIDATION_COHORT = "validation_cohort"
    PAN_CANCER_INTEGRATION = "pan_cancer_integration"
    RESOURCE_DERIVATIVE = "resource_derivative"  # built a tool/atlas/database on it
    AI_TRAINING = "ai_training"
    META_ANALYSIS = "meta_analysis"
    CLINICAL_TRANSLATION = "clinical_translation"
    EDUCATION = "education"
    OTHER = "other"


class Publication(CDSModel):
    pmid: str | None = None
    pmcid: str | None = None
    doi: str | None = None
    title: str | None = None
    journal: str | None = None
    year: int | None = None
    authors_short: str | None = None  # "Smith et al."
    n_authors: int | None = None
    url: str | None = None
    is_open_access: bool | None = None
    citation_count: int | None = None
    evidence: list[Evidence] = Field(default_factory=list)


class ReuseRecord(CDSModel):
    """A verified instance of someone reusing the dataset."""

    publication: Publication
    tier: ReuseTier
    kind: ReuseKind = ReuseKind.OTHER
    independent_of_generators: bool | None = Field(
        default=None,
        description="True when no author overlaps the dataset's generating team - the strongest "
        "signal of genuine external reuse.",
    )
    what_they_analyzed: str | None = None
    what_they_found: str | None = None
    methods_summary: str | None = None
    modalities_used: list[Modality] = Field(default_factory=list)
    accession_snippet: str | None = None  # verbatim text where the accession appears
    accession_locator: str | None = None  # "Data Availability Statement"
    nci_funded_reuse: bool | None = None
    linked_grants: list[str] = Field(default_factory=list)
    adjudicated_by: str | None = None
    adjudicated_at: date | None = None
    evidence: list[Evidence] = Field(default_factory=list)


class ReuseMetrics(CDSModel):
    """Counts plus the Reuse Gap Index. Everything here is recomputable from the record
    store, so the 'underexplored' label is a measurement, not an opinion."""

    n_candidates_screened: int = 0
    n_by_tier: dict[str, int] = Field(default_factory=dict)
    # Citations to the dataset's own publication. This measures attention to the paper,
    # not reuse of the data, and the two diverge sharply. Kept as a separate number so
    # the page can show the gap rather than let a citation count stand in for reuse.
    n_citations_to_primary_publication: int | None = None
    citation_to_reuse_ratio: float | None = Field(
        default=None,
        description="Citations to the primary publication divided by articles that "
        "actually analyzed the data. High values mark datasets that are well known but "
        "little reused.",
    )
    has_citable_accession: bool | None = Field(
        default=None,
        description="False when the dataset has no accession specific enough to search "
        "for, which makes citation-based reuse tracing impossible rather than negative.",
    )
    n_verified_reuse: int = 0  # T3 + T4
    n_independent_reuse: int = 0  # T3+ with no author overlap
    first_reuse_year: int | None = None
    latest_reuse_year: int | None = None
    years_since_release: float | None = None
    # Reuse Gap Index
    expected_reuse: float | None = None
    reuse_gap_index: float | None = Field(
        default=None,
        description="log2((observed independent reuse + 1) / (expected reuse + 1)). "
        "Negative means reused less than comparable datasets of similar size, age, "
        "modality breadth, and access tier.",
    )
    reuse_gap_percentile: float | None = None
    search_strategy_id: str | None = None
    searched_at: datetime | None = None
    no_reuse_identified: bool = False  # shown transparently on the page
    evidence: list[Evidence] = Field(default_factory=list)


class UnderexploredLabel(CDSModel):
    is_underexplored: bool = False
    basis: list[str] = Field(default_factory=list)
    index_value: float | None = None
    percentile: float | None = None
    comparator_set: str | None = None
    evidence: list[Evidence] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# Onboarding: start here
# --------------------------------------------------------------------------------------


class AccessStep(CDSModel):
    order: int
    action: str
    detail: str | None = None
    url: str | None = None
    requires: list[str] = Field(default_factory=list)
    est_time: str | None = None
    cli_snippet: str | None = None


class WorkbookLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class ExecutionReceipt(CDSModel):
    """Proof the workbook actually ran, so 'independently executed' is checkable."""

    executed: bool = False
    executed_at: datetime | None = None
    runtime_seconds: float | None = None
    executor: str | None = None  # "nbclient 0.10 / python 3.12.4 / macOS 15"
    package_versions: dict[str, str] = Field(default_factory=dict)
    n_cells: int | None = None
    n_cells_executed: int | None = None
    output_hash: str | None = None
    data_retrieved_at: datetime | None = None
    error: str | None = None


class AnalysisExample(CDSModel):
    """A 'way to use it' entry: may be a shipped workbook or a described recipe."""

    level: WorkbookLevel
    title: str
    question: str
    inputs: list[str] = Field(default_factory=list)
    outputs: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    language: Literal["python", "r", "either", "none"] = "python"
    est_runtime: str | None = None
    est_compute: str | None = None
    workbook_path: str | None = None
    workbook_url: str | None = None
    colab_url: str | None = None
    binder_url: str | None = None
    receipt: ExecutionReceipt | None = None
    template_source: str | None = None  # which approved template it adapts
    evidence: list[Evidence] = Field(default_factory=list)


class AgentPackage(CDSModel):
    """The machine-readable half of every page."""

    json_url: str | None = None
    jsonld_url: str | None = None  # schema.org/Dataset + DCAT
    croissant_url: str | None = None  # MLCommons Croissant, for AI-readiness
    instructions_url: str | None = None  # natural-language task brief for an agent
    bundle_url: str | None = None  # zip of all of the above
    mcp_resource_uri: str | None = None


# --------------------------------------------------------------------------------------
# Verification and review
# --------------------------------------------------------------------------------------


class ReviewStatus(str, Enum):
    MACHINE_ONLY = "machine_only"  # nothing human-reviewed yet
    NEEDS_REVIEW = "needs_review"  # queued for a human
    IN_REVIEW = "in_review"
    # Written and checked by the project team against source documentation and measured
    # field coverage, but not signed off by a named external domain expert. Kept distinct
    # from EXPERT_REVIEWED so the site never implies an endorsement nobody has given.
    PROJECT_CURATED = "project_curated"
    EXPERT_REVIEWED = "expert_reviewed"  # a named domain expert signed off
    FLAGGED = "flagged"  # a reviewer disputed something


class Review(CDSModel):
    status: ReviewStatus = ReviewStatus.MACHINE_ONLY
    reviewer: str | None = None
    reviewer_affiliation: str | None = None
    reviewed_at: date | None = None
    sections_reviewed: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    notes: str | None = None


class LinkCheck(CDSModel):
    url: str
    status: int | None = None
    ok: bool = False
    checked_at: datetime | None = None
    redirect_to: str | None = None
    note: str | None = None


class Verification(CDSModel):
    last_verified_at: datetime | None = None
    link_checks: list[LinkCheck] = Field(default_factory=list)
    n_links_ok: int = 0
    n_links_broken: int = 0
    upstream_version_seen: str | None = None
    upstream_version_changed: bool = False
    upstream_counts_seen: dict[str, int] = Field(default_factory=dict)
    upstream_drift: dict[str, Any] = Field(default_factory=dict)
    notes: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------------------
# The record
# --------------------------------------------------------------------------------------


class DatasetRecord(CDSModel):
    """One dataset. Programs like TCGA are not records; their individual studies are."""

    # identity
    id: str = Field(description="Stable slug, e.g. 'gdc-tcga-brca'")
    title: str
    short_title: str | None = None
    aliases: list[str] = Field(default_factory=list)
    summary: str | None = Field(default=None, description="One paragraph, plain language")
    one_liner: str | None = Field(default=None, description="<=140 chars, for search results")

    # provenance
    identifiers: list[Identifier] = Field(default_factory=list)
    repository: RepositoryNode | None = None
    additional_repositories: list[RepositoryNode] = Field(default_factory=list)
    program_name: str | None = None
    program_url: str | None = None
    nci_program: str | None = None
    generating_institutions: list[str] = Field(default_factory=list)
    data_generation_funding_role: FundingRole = FundingRole.UNKNOWN
    version: str | None = None
    release_date: date | None = None
    last_upstream_update: date | None = None
    retrieved_at: datetime | None = None
    landing_page_url: str | None = None

    # at a glance
    cancer_types: list[OntologyTerm] = Field(default_factory=list)
    primary_sites: list[str] = Field(default_factory=list)
    subject: Subject = Field(default_factory=Subject)
    is_pediatric: bool | None = None
    model_systems: list[str] = Field(default_factory=list)  # PDX, organoid, cell line
    cohort: Cohort = Field(default_factory=Cohort)
    assays: list[Assay] = Field(default_factory=list)
    clinical_variables: list[ClinicalVariable] = Field(default_factory=list)
    longitudinal: LongitudinalCoverage = Field(default_factory=LongitudinalCoverage)
    access: Access = Field(default_factory=Access)

    # interpretation
    useful_for: list[ResearchQuestion] = Field(default_factory=list)
    limitations: list[Limitation] = Field(default_factory=list)
    inappropriate_uses: list[InappropriateUse] = Field(default_factory=list)

    # reuse
    primary_publications: list[Publication] = Field(default_factory=list)
    reuse: list[ReuseRecord] = Field(default_factory=list)
    reuse_metrics: ReuseMetrics = Field(default_factory=ReuseMetrics)
    underexplored: UnderexploredLabel = Field(default_factory=UnderexploredLabel)

    # funding
    grants: list[Grant] = Field(default_factory=list)

    # start here
    access_steps: list[AccessStep] = Field(default_factory=list)
    analysis_examples: list[AnalysisExample] = Field(default_factory=list)
    agent_package: AgentPackage = Field(default_factory=AgentPackage)
    related_dataset_ids: list[str] = Field(default_factory=list)
    related_underexplored_ids: list[str] = Field(default_factory=list)

    # governance
    review: Review = Field(default_factory=Review)
    verification: Verification = Field(default_factory=Verification)
    is_showcase: bool = False
    completeness_score: float | None = None
    tags: list[str] = Field(default_factory=list)
    search_text: str | None = None


class RecordStore(CDSModel):
    """The whole corpus, plus build metadata."""

    generated_at: datetime
    pipeline_version: str = "0.1.0"
    n_records: int = 0
    records: list[DatasetRecord] = Field(default_factory=list)
    source_manifest: dict[str, Any] = Field(default_factory=dict)
