import type { IndexRow } from "@/lib/types";

/**
 * What a research question needs from a dataset, and how to read it from wording.
 *
 * Pure functions over the index row, with no file system or search index behind them,
 * so the same rules run on the server (the agent, the router) and in the browser (the
 * answer page linking each line to its evidence). A missed need is silent - the agent
 * simply stops checking for it - so the wording researchers use is pinned in tests.
 */

export type Need = {
  key: string;
  label: string;
  test: RegExp;
  /** true = satisfied, false = ruled out, null = unknown from the record. */
  check: (r: IndexRow) => boolean | null;
  fit: string;
  fail: string;
};

const PROTEOMIC = new Set(["proteome", "phosphoproteome", "acetylproteome", "glycoproteome", "ubiquitylome", "metabolome", "lipidome"]);

const NEEDS: Need[] = [
  {
    key: "survival",
    label: "a survival endpoint",
    test: /surviv|prognos|progression.?free|kaplan|hazard|mortalit|death|time.to.event|outcome/i,
    check: (r) => r.has_survival_endpoint ?? null,
    fit: "vital status and follow-up time are populated, so a survival endpoint can be derived",
    fail: "no usable survival endpoint: vital status or follow-up is missing or uninformative",
  },
  {
    key: "treatment",
    label: "recorded treatment and response",
    test: /treat|therap|drug|respon|resist|chemo|immunother|inhibitor|regimen|relapse/i,
    check: (r) => r.has_treatment_response ?? null,
    fit: "treatment given and a response or outcome field are recorded",
    fail: "no treatment response is recorded",
  },
  {
    key: "imaging",
    label: "imaging",
    test: /\bimag|radiol|\bCT\b|\bMRI\b|\bPET\b|histopath|slide|whole.slide|patholog|H&E/i,
    check: (r) => r.modalities.some((m) => m === "radiology" || m === "histopathology"),
    fit: "radiology or whole-slide images are available",
    fail: "no imaging",
  },
  {
    key: "expression",
    label: "transcriptomics",
    test: /rna|expression|transcript/i,
    check: (r) => r.modalities.some((m) => m === "rna_seq" || m === "scrna_seq"),
    fit: "RNA sequencing is available",
    fail: "no RNA sequencing",
  },
  {
    key: "methylation",
    label: "DNA methylation",
    test: /methylat|epigen/i,
    check: (r) => r.modalities.includes("methylation"),
    fit: "DNA methylation arrays are available",
    fail: "no methylation data",
  },
  {
    key: "genome",
    label: "whole genome or exome sequencing",
    test: /whole.genome|\bWGS\b|exome|\bWES\b|germline|mutation|variant|somatic/i,
    check: (r) => r.modalities.some((m) => ["wgs", "wxs", "targeted_dna", "bulk_dna"].includes(m)),
    fit: "DNA sequencing is available",
    fail: "no DNA sequencing",
  },
  {
    key: "proteomics",
    label: "proteomics",
    test: /proteom|phospho|mass.spec|acetyl|glyco|ubiquit|metabolom|lipidom/i,
    check: (r) => r.modalities.some((m) => PROTEOMIC.has(m)),
    fit: "mass-spectrometry proteomics is available",
    fail: "no proteomics",
  },
  {
    key: "singlecell",
    label: "single-cell or spatial data",
    test: /single.?cell|scrna|spatial|multiplex|imaging mass/i,
    check: (r) => r.modalities.some((m) => m.startsWith("sc") || m.startsWith("spatial") || m === "imaging_mass_cytometry"),
    fit: "single-cell or spatial measurements are available",
    fail: "no single-cell or spatial data",
  },
  {
    key: "multimodal",
    label: "several measurement types on the same patients",
    test: /multi.?omic|multi.?modal|integrat|proteogenom|combine|pair/i,
    check: (r) => r.n_modalities >= 3,
    fit: "three or more measurement types on the same cohort",
    fail: "fewer than three measurement types",
  },
  {
    key: "pediatric",
    label: "a pediatric cohort",
    test: /p(a)?ediatric|child|adolescent|young adult|infant/i,
    check: (r) =>
      r.is_pediatric ??
      (/p(a)?ediatric|childhood|children|adolescent|young adult|\bTARGET\b|Kids First/i.test(
        `${r.title} ${r.summary ?? ""} ${r.program ?? ""} ${r.tags.join(" ")}`,
      )
        ? true
        : null),
    fit: "a pediatric cohort",
    fail: "not a pediatric cohort",
  },
  {
    key: "population",
    label: "a diverse or non-US population",
    test: /black|african|hispanic|latino|asian|non.?white|dispar|equity|ancestr|diverse|underrepresent/i,
    check: (r) => (r.population_flags.length > 0 ? true : null),
    fit: "the cohort has recorded non-white or non-US representation",
    fail: "race or ethnicity is not recorded, so no analysis by population is possible",
  },
  {
    key: "large",
    label: "a large cohort",
    test: /large|largest|big|thousand|well.powered|statistical power|many (patients|cases)/i,
    check: (r) => (r.n_cases ?? r.n_samples ?? 0) >= 1000,
    fit: "a cohort of a thousand cases or more",
    fail: "fewer than a thousand cases",
  },
  {
    key: "open",
    label: "open access",
    test: /open.access|without (an )?approval|no dbgap|download(able)? (directly|now)|openly/i,
    check: (r) => r.access_tier === "open",
    fit: "fully open access, nothing to apply for",
    fail: "needs an access request first",
  },
  {
    key: "underexplored",
    label: "a dataset reused less than comparable ones",
    test: /under.?explored|under.?used|less (often )?used|few(er)? (people|articles|studies) have/i,
    // The label is only ever assigned where reuse could be measured, so a dataset
    // without it is either reused as expected or not measurable; the fail text says so.
    check: (r) => r.is_underexplored,
    fit: "reused far less than datasets of similar size, age, breadth and access",
    fail: "not labelled underexplored: reused about as expected, or reuse not measurable",
  },
];

/** The wording the rule-based explanations use, so the answer page can link each line to its evidence. */
export const NEED_PHRASES: string[] = NEEDS.flatMap((n) => [n.fit, n.fail]);

/**
 * What the request asks for, read from its wording.
 *
 * Exported because it is the step that decides which datasets can be ruled out, and a
 * missed need is silent: the agent simply stops checking for it. Tested directly.
 */
export function readNeeds(query: string): Need[] {
  return NEEDS.filter((n) => n.test.test(query));
}

/**
 * Words that carry no topic, so their presence should not make a dataset relevant.
 *
 * Two kinds: ordinary function words, and the words that describe a dataset in general
 * rather than a subject - "cohort", "open", "records". The second kind matters more,
 * because almost every page contains them and a query that leans on them would rank by
 * page length.
 */
const STOPWORDS = new Set([
  "a", "access", "all", "an", "and", "any", "are", "as", "at", "available", "be", "by",
  "can", "cohort", "cohorts", "data", "dataset", "datasets", "do", "does", "find", "for",
  "from", "get", "have", "how", "i", "in", "into", "is", "it", "its", "large", "like",
  "looking", "me", "my", "need", "of", "on", "open", "or", "patients", "public",
  "records", "samples", "show", "small", "some", "study", "studies", "that", "the",
  "their", "then", "there", "this", "to", "use", "using", "want", "was", "were", "what",
  "which", "with", "would",
]);

/**
 * What the request is *about*, with the words that already became needs removed.
 *
 * Those words are counted once as a capability check, which is the reliable measurement.
 * Leaving them in the text query counted them a second time, and because well-curated
 * pages discuss survival and treatment at length it made every well-annotated cohort
 * look textually relevant to every clinical question: "proteogenomic gastric cancer
 * survival with treatment records" ranked a paediatric leukaemia trial above the gastric
 * cohort that answers it.
 *
 * Returns null when nothing but capability words is left. There is then no topic, and
 * text relevance is not used at all rather than being read out of noise.
 */
export function topicOf(query: string, needs: Need[]): string | null {
  const words = query.split(/[^A-Za-z0-9+-]+/).filter(Boolean);
  const kept = words.filter(
    (w) => !STOPWORDS.has(w.toLowerCase()) && !needs.some((n) => n.test.test(w)),
  );
  return kept.some((w) => w.length >= 3) ? kept.join(" ") : null;
}

/** Every need the agent knows how to check, for tests and for documentation. */
export const NEED_KEYS = NEEDS.map((n) => n.key);
