/**
 * The human framing each workbook is meant to teach: the mistake it stops you making, and
 * what you are left holding afterwards. Keyed by workbook slug, and covered by
 * tests/notebook-notes.test.ts so a renamed or added workbook fails the suite rather than
 * silently dropping its framing from the gallery.
 */
export const NOTEBOOK_NOTES: Record<string, { problem: string; lesson: string }> = {
  "01_can_i_answer_this": {
    problem: "A portal can list a field even when every value is an unusable non-answer.",
    lesson: "Decide whether the analysis is possible before requesting data or writing a protocol.",
  },
  "02_survival_tcga_brca": {
    problem: "Survival time is split across three fields and includes sentinel values that look numeric.",
    lesson: "Derive a defensible endpoint, account for exclusions, then fit and interpret the model.",
  },
  "03_treatment_response_cervical": {
    problem: "Disease-status codes and true response categories are easy to mix into one misleading outcome.",
    lesson: "Validate the response field, collapse repeated records, and state what the observational result cannot prove.",
  },
  "04_scarce_modality_cptac": {
    problem: "Rare proteomic layers are scattered across study records and may cover different patients.",
    lesson: "Find genuinely scarce measurements and bound the complete-case cohort before designing the study.",
  },
  "05_cross_repository_linkage": {
    problem: "Molecular and imaging data for the same cohort live in separate NCI repositories.",
    lesson: "Join shared patient identifiers and quantify the real multimodal overlap, not the advertised totals.",
  },
  "06_agent_dataset_selection": {
    problem: "Ranking by size or fame can select a large dataset that cannot answer the question.",
    lesson: "Filter on measured capability, rank on fit, and carry blocking limitations into the analysis brief.",
  },
};
