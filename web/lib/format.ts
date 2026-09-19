/**
 * Display vocabulary.
 *
 * The pipeline stores machine tokens (`scrna_seq`, `t3_analyzed`, `ajcc_pathologic_stage`).
 * Researchers read English. This module is the single place that translation happens, so
 * a label never drifts between the browse page and the dataset page.
 */

import type { AccessTier, Confidence, Method, ReuseTier, Severity } from "./types";

export const MODALITY_LABELS: Record<string, string> = {
  wgs: "Whole genome sequencing",
  wxs: "Whole exome sequencing",
  bulk_dna: "Bulk DNA sequencing",
  targeted_dna: "Targeted DNA panel",
  rna_seq: "Bulk RNA sequencing",
  scrna_seq: "Single-cell RNA sequencing",
  scatac_seq: "Single-cell ATAC sequencing",
  spatial_transcriptomics: "Spatial transcriptomics",
  spatial_proteomics: "Multiplexed tissue imaging",
  methylation: "DNA methylation",
  atac_seq: "ATAC sequencing",
  chip_seq: "ChIP sequencing",
  hic: "Hi-C chromatin conformation",
  mirna: "microRNA",
  proteome: "Proteome (mass spectrometry)",
  phosphoproteome: "Phosphoproteome",
  acetylproteome: "Acetylome",
  glycoproteome: "Glycoproteome",
  ubiquitylome: "Ubiquitylome",
  metabolome: "Metabolome",
  lipidome: "Lipidome",
  protein_array: "Reverse phase protein array",
  flow_cytometry: "Flow cytometry",
  cytof: "Mass cytometry (CyTOF)",
  immune_repertoire: "Immune repertoire",
  radiology: "Radiology imaging",
  histopathology: "Histopathology slides",
  imaging_mass_cytometry: "Imaging mass cytometry",
  electron_microscopy: "Electron microscopy",
  clinical: "Clinical data",
  outcome: "Outcome data",
  treatment: "Treatment records",
  germline: "Germline variants",
  copy_number: "Copy number",
  structural_variant: "Structural variants",
  pharmacology: "Pharmacology",
  functional_screen: "Functional screen",
  model_system: "Model system",
  epidemiology: "Epidemiology",
  patient_reported: "Patient-reported outcomes",
  other: "Other",
};

/** Modalities that are scarce across the NCI portfolio and worth surfacing. */
export const SCARCE_MODALITIES = new Set([
  "spatial_transcriptomics",
  "spatial_proteomics",
  "electron_microscopy",
  "imaging_mass_cytometry",
  "acetylproteome",
  "glycoproteome",
  "ubiquitylome",
  "metabolome",
  "lipidome",
  "scatac_seq",
  "hic",
  "immune_repertoire",
  "cytof",
  "functional_screen",
]);

export function modalityLabel(m: string): string {
  return MODALITY_LABELS[m] ?? m.replace(/_/g, " ");
}

export const ACCESS_LABELS: Record<AccessTier, string> = {
  open: "Open",
  registered: "Registration",
  controlled: "Controlled",
  mixed: "Mixed",
  request: "By request",
  unknown: "Unknown",
};

export const ACCESS_DESCRIPTIONS: Record<AccessTier, string> = {
  open: "Download without an account.",
  registered: "Free account and click-through terms.",
  controlled: "Formal data access request and institutional approval.",
  mixed: "Some components are open; others need approval.",
  request: "Request directly from the generating team.",
  unknown: "Access conditions not yet established.",
};

export const REUSE_TIER_LABELS: Record<ReuseTier, string> = {
  t0_mention: "Mentioned only",
  t1_accession: "Accession found",
  t2_declared: "Use declared",
  t3_analyzed: "Data analyzed",
  t4_confirmed: "Confirmed by review",
};

export const REUSE_TIER_MEANING: Record<ReuseTier, string> = {
  t0_mention:
    "The dataset is named in framing text or the bibliography. This is a citation, not reuse, and is not counted as such.",
  t1_accession:
    "Europe PMC's text-mined accession index located the accession somewhere in the article.",
  t2_declared:
    "The authors named the accession in a data-availability statement, so they declared using it.",
  t3_analyzed:
    "The accession appears in the methods, results, a table or a figure, so the reported findings plausibly depend on these data.",
  t4_confirmed:
    "A reviewer read the article and confirmed the data were analyzed.",
};

export const METHOD_LABELS: Record<Method, string> = {
  api: "Read from a structured API",
  file: "Parsed from a published file",
  fulltext: "Extracted from document text",
  derived: "Computed in this pipeline",
  curated: "Asserted by a human reviewer",
  llm_extracted: "Proposed by a model, pending review",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  unverified: "Not yet verified",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  blocking: "Blocking",
  major: "Major",
  minor: "Minor",
};

export const SEVERITY_MEANING: Record<Severity, string> = {
  blocking: "Rules out a whole class of analysis.",
  major: "Requires explicit mitigation in the analysis plan.",
  minor: "Worth knowing; manageable.",
};

export const LIMITATION_KIND_LABELS: Record<string, string> = {
  missing_data: "Missing data",
  population_coverage: "Population coverage",
  treatment_context: "Treatment context",
  statistical_power: "Statistical power",
  batch_technical: "Batch and technical effects",
  annotation_quality: "Annotation quality",
  ascertainment_bias: "Ascertainment bias",
  access_constraint: "Access constraint",
  harmonization: "Harmonization",
  consent_scope: "Consent scope",
  platform_obsolescence: "Platform obsolescence",
  other: "Other",
};

export const FEASIBILITY_LABELS: Record<string, string> = {
  direct: "Answerable as shipped",
  needs_linkage: "Needs another dataset",
  needs_access: "Needs approved access",
  exploratory: "Hypothesis-generating only",
};

export const CLINICAL_CATEGORY_LABELS: Record<string, string> = {
  demographic: "Demographics",
  diagnosis: "Diagnosis",
  staging: "Staging",
  treatment: "Treatment",
  outcome: "Outcome",
  followup: "Follow-up",
  exposure: "Exposure",
  pathology: "Pathology",
  molecular_marker: "Molecular markers",
  other: "Other",
};

/**
 * Values that occupy a field without answering it.
 *
 * The same judgement the pipeline makes when it computes coverage, repeated here because
 * the page also has to decide whether to draw a bar as an answer or as a non-answer. The
 * two must agree: a cohort whose race is recorded entirely as "Pt Refused To Answer" is
 * not a cohort with recorded race, and a page that drew it as one would contradict the
 * verdict printed above it. The export-contract test fails if these drift apart from
 * `cds.clinical`.
 */
const NON_ANSWERS = new Set([
  "-",
  "--",
  "cannot be determined",
  "data not available",
  "declined to answer",
  "indeterminate",
  "missing",
  "n/a",
  "na",
  "nan",
  "no value entered",
  "none",
  "not allowed to collect",
  "not applicable",
  "not available",
  "not collected",
  "not evaluated",
  "not otherwise specified",
  "not performed",
  "not reported",
  "notreported",
  "null",
  "patient refused",
  "pt refused to answer",
  "refused",
  "unk",
  "unknown",
  "unknown/not reported",
  "unspecified",
]);

const NON_ANSWER_PREFIXES = [
  "unknown",
  "not reported",
  "notreported",
  "no value",
];

const NON_ANSWER_SUBSTRINGS = [
  "refus",
  "declin",
  "choose not to answer",
  "prefer not to",
  "not disclosed",
  "withheld",
];

export function isNonAnswer(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  if (NON_ANSWERS.has(v)) return true;
  if (NON_ANSWER_PREFIXES.some((p) => v.startsWith(p))) return true;
  return NON_ANSWER_SUBSTRINGS.some((m) => v.includes(m));
}

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  machine_only: "Machine-extracted",
  needs_review: "Queued for review",
  in_review: "Under review",
  project_curated: "Project-curated",
  expert_reviewed: "Expert reviewed",
  flagged: "Flagged by a reviewer",
};

export const ID_SCHEME_LABELS: Record<string, string> = {
  gdc_project_id: "GDC project",
  gdc_program: "GDC program",
  pdc_study_id: "PDC study",
  pdc_study_uuid: "PDC study UUID",
  dbgap_phs: "dbGaP study",
  bioproject: "BioProject",
  geo_series: "GEO series",
  synapse_id: "Synapse",
  idc_collection_id: "IDC collection",
  tcia_collection: "TCIA collection",
  cbioportal_study_id: "cBioPortal study",
  doi: "DOI",
  zenodo: "Zenodo",
  ega: "EGA",
  pride: "PRIDE",
  massive: "MassIVE",
  metabolomics_workbench: "Metabolomics Workbench",
  accession_other: "Identifier",
};

export function idSchemeLabel(s: string): string {
  return ID_SCHEME_LABELS[s] ?? s.replace(/_/g, " ");
}

export const FUNDING_ROLE_LABELS: Record<string, string> = {
  generation: "Funded data generation",
  reuse: "Funded reuse of existing data",
  infrastructure: "Funded infrastructure or harmonization",
  unknown: "Role not established",
};

// ------------------------------------------------------------------------------------
// numbers and dates
// ------------------------------------------------------------------------------------

export function num(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("en-US");
}

export function pct(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "-";
  return `${n.toFixed(digits)}%`;
}

export function bytes(n: number | null | undefined): string {
  if (!n) return "-";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function months(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  if (n >= 24) return `${(n / 12).toFixed(1)} years`;
  return `${n.toFixed(1)} months`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Coverage bands used for the clinical-completeness meters. */
export function coverageBand(p: number | null | undefined): {
  key: "strong" | "moderate" | "weak" | "none";
  label: string;
} {
  if (p === null || p === undefined) return { key: "none", label: "Not measured" };
  if (p >= 80) return { key: "strong", label: "Well covered" };
  if (p >= 40) return { key: "moderate", label: "Partly covered" };
  if (p > 0) return { key: "weak", label: "Sparse" };
  return { key: "weak", label: "Absent" };
}

/**
 * Human sentence describing a dataset's reuse against expectation.
 *
 * Deliberately phrased as observed-against-predicted rather than as a percentage. The
 * index is computed on log2(observed + 1), so a dataset with zero analyzing articles
 * still has a non-zero ratio - rendering that as "reused about 13% as often" would
 * describe a dataset nobody has used as though somebody had.
 */
export function describeReuse(
  observed: number | null | undefined,
  expected: number | null | undefined,
): string | null {
  if (expected === null || expected === undefined) return null;
  const exp = expected < 1 ? expected.toFixed(1) : Math.round(expected).toString();
  if (!observed) {
    return `no article found that analyzed these data, against about ${exp} predicted for comparable datasets`;
  }
  return `${observed} article${observed === 1 ? "" : "s"} analyzed these data, against about ${exp} predicted for comparable datasets`;
}
