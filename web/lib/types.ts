/**
 * Types mirroring the pipeline's pydantic model. Kept hand-written rather than
 * generated so the site can be read without running the pipeline; the shapes are
 * validated at build time by `lib/data.ts`, which fails loudly on a mismatch.
 */

export type Method =
  | "api"
  | "file"
  | "fulltext"
  | "derived"
  | "curated"
  | "llm_extracted";

export type Confidence = "high" | "medium" | "low" | "unverified";

export interface Evidence {
  method: Method;
  source_url?: string | null;
  source_label?: string | null;
  retrieved_at?: string | null;
  snippet?: string | null;
  locator?: string | null;
  confidence: Confidence;
  reviewer?: string | null;
  reviewed_at?: string | null;
  note?: string | null;
}

export interface Identifier {
  scheme: string;
  value: string;
  url?: string | null;
  is_primary: boolean;
  evidence: Evidence[];
}

export interface RepositoryNode {
  name: string;
  short_name: string;
  url: string;
  is_nci_crdc_node: boolean;
  is_nih_repository: boolean;
}

export type FundingRole = "generation" | "reuse" | "infrastructure" | "unknown";

export interface Grant {
  core_project_num?: string | null;
  project_num?: string | null;
  title?: string | null;
  pi_names: string[];
  agency_ic?: string | null;
  activity_code?: string | null;
  fiscal_years: number[];
  award_amount_usd?: number | null;
  org_name?: string | null;
  reporter_url?: string | null;
  role: FundingRole;
  evidence: Evidence[];
}

export interface OntologyTerm {
  label: string;
  ontology?: string | null;
  code?: string | null;
  url?: string | null;
}

export type AccessTier =
  | "open"
  | "registered"
  | "controlled"
  | "mixed"
  | "request"
  | "unknown";

export interface Assay {
  modality: string;
  label: string;
  platform?: string | null;
  n_cases?: number | null;
  n_samples?: number | null;
  n_files?: number | null;
  data_levels: string[];
  access_tier?: AccessTier | null;
  evidence: Evidence[];
}

export interface Demographics {
  sex: Record<string, number>;
  race: Record<string, number>;
  ethnicity: Record<string, number>;
  age_at_diagnosis_years: Record<string, number>;
  vital_status: Record<string, number>;
  country_or_region: Record<string, number>;
  evidence: Evidence[];
}

export interface Cohort {
  n_cases?: number | null;
  n_samples?: number | null;
  n_aliquots?: number | null;
  n_files?: number | null;
  total_bytes?: number | null;
  n_tumor_cases?: number | null;
  n_normal_cases?: number | null;
  has_matched_normal?: boolean | null;
  demographics: Demographics;
  evidence: Evidence[];
}

export interface ClinicalVariable {
  name: string;
  /** The same concept's name in the shared vocabulary, when the field has one. */
  harmonized_name?: string | null;
  label?: string | null;
  category: string;
  n_nonmissing?: number | null;
  n_not_reported?: number | null;
  n_informative?: number | null;
  n_total?: number | null;
  coverage_pct?: number | null;
  populated_pct?: number | null;
  is_repeated: boolean;
  example_values: string[];
  unit?: string | null;
  evidence: Evidence[];
}

export interface LongitudinalCoverage {
  has_followup?: boolean | null;
  has_survival_endpoint?: boolean | null;
  survival_endpoints: string[];
  median_followup_months?: number | null;
  max_followup_months?: number | null;
  n_cases_with_followup?: number | null;
  has_serial_samples?: boolean | null;
  timepoints: string[];
  n_cases_with_serial?: number | null;
  has_treatment_response?: boolean | null;
  response_criteria: string[];
  evidence: Evidence[];
}

export interface Access {
  tier: AccessTier;
  open_components: string[];
  controlled_components: string[];
  mechanism?: string | null;
  dua_url?: string | null;
  data_access_committee?: string | null;
  typical_turnaround?: string | null;
  embargo_until?: string | null;
  login_required?: boolean | null;
  citation_requirement?: string | null;
  license?: string | null;
  publication_policy_url?: string | null;
  evidence: Evidence[];
}

export type QuestionFeasibility =
  | "direct"
  | "needs_linkage"
  | "needs_access"
  | "exploratory";

export interface ResearchQuestion {
  question: string;
  rationale: string;
  required_fields: string[];
  required_modalities: string[];
  feasibility: QuestionFeasibility;
  approx_n?: number | null;
  statistical_note?: string | null;
  exemplar_pmid?: string | null;
  topics: string[];
  evidence: Evidence[];
}

export type Severity = "blocking" | "major" | "minor";

export interface Limitation {
  kind: string;
  statement: string;
  severity: Severity;
  affected_analyses: string[];
  mitigation?: string | null;
  evidence: Evidence[];
}

export interface InappropriateUse {
  statement: string;
  reason: string;
  evidence: Evidence[];
}

export interface Publication {
  pmid?: string | null;
  pmcid?: string | null;
  doi?: string | null;
  title?: string | null;
  journal?: string | null;
  year?: number | null;
  authors_short?: string | null;
  n_authors?: number | null;
  url?: string | null;
  is_open_access?: boolean | null;
  citation_count?: number | null;
  evidence: Evidence[];
}

export type ReuseTier =
  | "t0_mention"
  | "t1_accession"
  | "t2_declared"
  | "t3_analyzed"
  | "t4_confirmed";

export interface ReuseRecord {
  publication: Publication;
  tier: ReuseTier;
  kind: string;
  independent_of_generators?: boolean | null;
  what_they_analyzed?: string | null;
  what_they_found?: string | null;
  methods_summary?: string | null;
  modalities_used: string[];
  accession_snippet?: string | null;
  accession_locator?: string | null;
  nci_funded_reuse?: boolean | null;
  linked_grants: string[];
  adjudicated_by?: string | null;
  adjudicated_at?: string | null;
  evidence: Evidence[];
}

/**
 * How much of a Europe PMC hit count is really about this dataset.
 *
 * Europe PMC splits a hyphenated accession into separate indexed words, so a search
 * for TARGET-RT also matches "target RT". The pipeline samples the hits and checks the
 * full text for the literal accession; this is the receipt.
 */
export interface AccessionPrecision {
  token: string;
  query: string;
  strategy_id: string;
  needs_correction: boolean;
  precision?: number | null;
  precision_low?: number | null;
  precision_high?: number | null;
  n_sampled: number;
  n_checked: number;
  n_literal: number;
  note?: string | null;
}

export interface ReuseMetrics {
  n_candidates_screened: number;
  /** Corrected counts. A tier is ABSENT, not zero, when it could not be measured. */
  n_by_tier: Record<string, number>;
  /** The same counts as Europe PMC returned them, before correction. */
  n_by_tier_raw?: Record<string, number>;
  accession_precision?: AccessionPrecision | null;
  n_citations_to_primary_publication?: number | null;
  citation_to_reuse_ratio?: number | null;
  has_citable_accession?: boolean | null;
  /** Null when reuse could not be measured. Never render null as zero. */
  n_verified_reuse?: number | null;
  /**
   * Articles the deep pass actually read. Larger than the retained exemplar list, and
   * NOT the denominator for the two counts below: author overlap and funding are
   * resolved only for the exemplars in `reuse`, so those are what may be published.
   */
  n_reuse_examined: number;
  n_independent_reuse: number;
  n_nci_funded_reuse?: number;
  first_reuse_year?: number | null;
  latest_reuse_year?: number | null;
  years_since_release?: number | null;
  expected_reuse?: number | null;
  reuse_gap_index?: number | null;
  reuse_gap_percentile?: number | null;
  search_strategy_id?: string | null;
  searched_at?: string | null;
  no_reuse_identified: boolean;
  evidence: Evidence[];
}

export interface UnderexploredLabel {
  is_underexplored: boolean;
  basis: string[];
  index_value?: number | null;
  percentile?: number | null;
  comparator_set?: string | null;
  evidence: Evidence[];
}

export interface AccessStep {
  order: number;
  action: string;
  detail?: string | null;
  url?: string | null;
  requires: string[];
  est_time?: string | null;
  cli_snippet?: string | null;
  audience?: "human" | "agent";
  evidence: Evidence[];
}

export interface ExecutionReceipt {
  executed: boolean;
  executed_at?: string | null;
  runtime_seconds?: number | null;
  executor?: string | null;
  package_versions: Record<string, string>;
  n_cells?: number | null;
  n_cells_executed?: number | null;
  output_hash?: string | null;
  data_retrieved_at?: string | null;
  error?: string | null;
}

export interface AnalysisExample {
  level: "beginner" | "intermediate" | "advanced";
  title: string;
  question: string;
  problem?: string | null;
  lesson?: string | null;
  figure?: string | null;
  featured?: boolean;
  inputs: string[];
  outputs: string[];
  steps: string[];
  /**
   * What the notebook printed when it last ran, with the numbers. `outputs` names the
   * kinds of result the code produces; a finding is a result, true only of the run the
   * receipt dates, so it is always rendered next to that date.
   */
  findings: string[];
  /**
   * Who contributed this example, when it came from outside the project. Unset for
   * the project's own workbooks, which the gallery credits to CD2S.
   */
  contributor?: string | null;
  contributor_url?: string | null;
  language: "python" | "r" | "either" | "none";
  est_runtime?: string | null;
  est_compute?: string | null;
  workbook_path?: string | null;
  workbook_url?: string | null;
  notebook_download_url?: string | null;
  notebook_preview_url?: string | null;
  notebook_preview_width?: number | null;
  notebook_preview_height?: number | null;
  colab_url?: string | null;
  binder_url?: string | null;
  receipt?: ExecutionReceipt | null;
  template_source?: string | null;
  evidence: Evidence[];
}

export interface NotebookGuide extends AnalysisExample {
  slug: string;
  datasets: Array<{
    id: string;
    title: string;
    short_title?: string | null;
  }>;
}

export interface AgentPackage {
  json_url?: string | null;
  jsonld_url?: string | null;
  croissant_url?: string | null;
  instructions_url?: string | null;
  bundle_url?: string | null;
  mcp_resource_uri?: string | null;
}

export type ReviewStatus =
  | "machine_only"
  | "needs_review"
  | "in_review"
  | "project_curated"
  | "expert_reviewed"
  | "flagged";

export interface Review {
  status: ReviewStatus;
  reviewer?: string | null;
  reviewer_affiliation?: string | null;
  reviewed_at?: string | null;
  sections_reviewed: string[];
  open_questions: string[];
  notes?: string | null;
}

export interface LinkCheck {
  url: string;
  status?: number | null;
  ok: boolean;
  checked_at?: string | null;
  redirect_to?: string | null;
  note?: string | null;
}

export interface Verification {
  last_verified_at?: string | null;
  link_checks: LinkCheck[];
  n_links_ok: number;
  n_links_broken: number;
  upstream_version_seen?: string | null;
  upstream_version_changed: boolean;
  upstream_counts_seen: Record<string, number>;
  upstream_drift: Record<string, unknown>;
  notes: string[];
}

export interface DatasetRecord {
  id: string;
  title: string;
  short_title?: string | null;
  aliases: string[];
  summary?: string | null;
  one_liner?: string | null;
  identifiers: Identifier[];
  repository?: RepositoryNode | null;
  additional_repositories: RepositoryNode[];
  program_name?: string | null;
  program_url?: string | null;
  nci_program?: string | null;
  generating_institutions: string[];
  data_generation_funding_role: FundingRole;
  version?: string | null;
  release_date?: string | null;
  last_upstream_update?: string | null;
  retrieved_at?: string | null;
  landing_page_url?: string | null;
  cancer_types: OntologyTerm[];
  primary_sites: string[];
  subject: Subject;
  is_pediatric?: boolean | null;
  model_systems: string[];
  cohort: Cohort;
  assays: Assay[];
  clinical_variables: ClinicalVariable[];
  longitudinal: LongitudinalCoverage;
  access: Access;
  useful_for: ResearchQuestion[];
  limitations: Limitation[];
  inappropriate_uses: InappropriateUse[];
  primary_publications: Publication[];
  reuse: ReuseRecord[];
  reuse_metrics: ReuseMetrics;
  underexplored: UnderexploredLabel;
  grants: Grant[];
  access_steps: AccessStep[];
  analysis_examples: AnalysisExample[];
  agent_package: AgentPackage;
  related_dataset_ids: string[];
  related_underexplored_ids: string[];
  review: Review;
  verification: Verification;
  is_showcase: boolean;
  completeness_score?: number | null;
  tags: string[];
  search_text?: string | null;
}

/** Slim row used for search, browse and comparison. */
export interface IndexRow {
  id: string;
  title: string;
  short_title?: string | null;
  one_liner?: string | null;
  summary?: string | null;
  repository?: string | null;
  repositories: string[];
  program?: string | null;
  nci_program?: string | null;
  cancer_types: string[];
  primary_sites: string[];
  subjects: string[];
  subject_scope: SubjectScope;
  modalities: string[];
  n_modalities: number;
  n_cases?: number | null;
  n_samples?: number | null;
  access_tier: AccessTier;
  has_followup?: boolean | null;
  has_survival_endpoint?: boolean | null;
  median_followup_months?: number | null;
  has_treatment_response?: boolean | null;
  is_pediatric?: boolean | null;
  population_flags: string[];
  n_verified_reuse?: number | null;
  n_reuse_examined?: number | null;
  n_citations_to_primary_publication?: number | null;
  reuse_gap_index?: number | null;
  expected_reuse?: number | null;
  reuse_gap_percentile?: number | null;
  has_citable_accession?: boolean | null;
  is_underexplored: boolean;
  is_showcase: boolean;
  n_research_questions: number;
  n_limitations: number;
  n_workbooks: number;
  review_status: ReviewStatus;
  tags: string[];
  search_text: string;
}

/**
 * The subset of an `IndexRow` the browse UI actually reads.
 *
 * `IndexRow` is the published API shape and carries fields the browser never renders -
 * `search_text` alone is 40% of index.json. Props passed to a client component are
 * serialized into the page, so shipping the full row made the browse page 1.4 MB of
 * HTML. The projection lives in `lib/data.ts`; the published file is unchanged.
 */
export type BrowseRow = Pick<
  IndexRow,
  | "id"
  | "title"
  | "short_title"
  | "one_liner"
  | "repositories"
  | "cancer_types"
  | "primary_sites"
  | "subjects"
  | "subject_scope"
  | "modalities"
  | "n_modalities"
  | "n_cases"
  | "n_samples"
  | "access_tier"
  | "has_followup"
  | "has_survival_endpoint"
  | "median_followup_months"
  | "has_treatment_response"
  | "population_flags"
  | "n_verified_reuse"
  | "n_citations_to_primary_publication"
  | "reuse_gap_index"
  | "has_citable_accession"
  | "is_underexplored"
  | "n_workbooks"
  | "review_status"
>;

/** One row of `/data/search.json`: the free-text half of the index, fetched on demand. */
export interface SearchDoc {
  id: string;
  text: string;
}

export interface FacetValue {
  value: string;
  count: number;
}

export type Facets = Record<string, FacetValue[]>;

export type SubjectScope =
  | "single"
  | "several"
  | "pan_cancer"
  | "non_cancer"
  | "not_stated"
  | "title_derived";

export interface Subject {
  scope: SubjectScope;
  tissues: string[];
  evidence: Evidence[];
}

export interface SubjectVocabularyEntry {
  code: string;
  name: string;
  label: string;
  nci: string;
  synonyms: string[];
}

export interface SubjectVocabulary {
  version: string;
  release_date: string;
  subjects: SubjectVocabularyEntry[];
  states: string[];
}

export interface CorpusStats {
  generated_at: string;
  pipeline_version: string;
  n_datasets: number;
  n_showcase: number;
  n_underexplored: number;
  n_expert_reviewed: number;
  /** Records whose clinical fields have been measured against the shared vocabulary. */
  n_clinically_measured?: number;
  clinically_measured_by_repository?: Record<string, { measured: number; total: number }>;
  n_datasets_with_case_count?: number;
  n_cases_total: number;
  n_repositories: number;
  n_distinct_modalities: number;
  n_with_survival: number;
  n_with_treatment_response: number;
  n_reuse_assessed: number;
  n_without_citable_accession: number;
  /** Has an accession, but the tokenization correction could not be estimated for it. */
  n_reuse_unmeasurable?: number;
  n_with_publication_citations: number;
  median_citation_to_reuse_ratio?: number | null;
  /** One per (dataset, workbook) pair - a workbook attached to three pages counts three times. */
  n_workbook_attachments?: number;
  /** Dataset pages that carry at least one workbook. */
  n_datasets_with_workbook?: number;
  /** Distinct workbooks, however many pages they appear on. */
  n_distinct_workbooks?: number;
  /** Dataset pages with at least one human or agent access step. */
  n_datasets_with_access_routes?: number;
  /** Generated steps whose policy evidence is marked derived. */
  n_derived_access_steps?: number;
  n_grants_linked: number;
  n_reuse_studies_verified: number;
}

export interface QuestionRow {
  qid: string;
  dataset_id: string;
  dataset_title: string;
  question: string;
  rationale: string;
  feasibility: QuestionFeasibility;
  approx_n?: number | null;
  modalities: string[];
  topics: string[];
  access_tier: AccessTier;
  is_underexplored: boolean;
}

/** One dataset on the reuse scatter: only fields the chart draws, so the payload stays small. */
export interface ScatterPoint {
  id: string;
  title: string;
  short: string;
  observed: number;
  expected: number;
  index: number | null;
  underexplored: boolean;
}

/** Diagnostics the pipeline writes with the fitted reuse gap model. */
/** Why the narrow availability field is used and the broad one is not, re-measured per build. */
export interface FieldCalibration {
  strategy_id: string;
  token: string;
  retrieved_at: string;
  n_mentioning_anywhere: number;
  by_field: Record<string, number>;
  rejected_field: string;
  used_field: string;
  sentinel_field: string;
  sentinel_hits: number;
  sentinel_passes: boolean;
  note: string;
}

export interface ReuseGapModel {
  model_id: string;
  n_records: number;
  n_eligible: number;
  n_excluded_no_citable_accession: number;
  rgi_threshold_log2: number;
  absolute_reuse_ceiling: number;
  status: string;
  family: string;
  ols_r_squared_for_reference?: number | null;
  n_downweighted_by_robust_fit?: number | null;
  residual_sd_log2?: number | null;
  coefficients: Record<string, number>;
  p_values: Record<string, number>;
  observed_reuse_median?: number | null;
  observed_reuse_max?: number | null;
  max_expected_reuse?: number | null;
  /** The corpus's worst over-prediction: the weakest point of the fit, published not described. */
  largest_over_prediction?: {
    id: string;
    n_cases: number;
    observed: number;
    expected: number;
    residual_log2: number;
    residual_in_sd?: number | null;
  } | null;
  upper_tail_note?: string | null;
  covariates: string[];
  deliberately_excluded_covariates: string[];
  response_note?: string | null;
  rejected_specification?: string | null;
}

/** Awards, datasets and articles as a graph. Only what the network view draws. */
export type NetworkNodeKind = "award" | "dataset" | "paper";

export interface NetworkNode {
  id: string;
  kind: NetworkNodeKind;
  /** Which column the node sits in. Indexes into `NetworkData.lanes`. */
  lane: number;
  label: string;
  sub?: string | null;
  href?: string | null;
  /** Datasets only. */
  underexplored?: boolean;
  repository?: string | null;
  /** One extra line for the detail panel: a PI, a fiscal-year span, a journal. */
  meta?: string | null;
  /** Drawn larger and labelled at every zoom: the node the view is about. */
  focus?: boolean;
}

export type NetworkEdgeKind =
  | "generation"
  | "reuse_funding"
  | "infrastructure"
  | "primary"
  | "analyzed"
  | "weaker";

export interface NetworkEdge {
  source: string;
  target: string;
  kind: NetworkEdgeKind;
}

/** A column of the layered graph: what it holds, and why a reader should care. */
export interface NetworkLane {
  label: string;
  hint: string;
  /** Shown under the hint when the lane is empty, instead of a blank column. */
  empty?: string;
  /** How many nodes this lane holds beyond the ones drawn. Never silently dropped. */
  more?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  /**
   * The columns, left to right, with what each holds and why it matters. A lane's
   * `more` is the only record of what the slice left undrawn, so a reader can always
   * recover the true size of a column as its drawn nodes plus that count.
   */
  lanes: NetworkLane[];
}
