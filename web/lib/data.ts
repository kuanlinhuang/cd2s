/**
 * Build-time data access.
 *
 * The pipeline writes its output into `public/data`, so the site reads plain files
 * rather than talking to a database. That keeps the deployment trivial and means the
 * whole corpus is archivable as a directory of JSON - which matters for a resource that
 * should still resolve in five years.
 *
 * Reads are memoised per process because Next renders hundreds of dataset pages in one
 * build and re-parsing a 600-record index each time is wasteful.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { num } from "./format";
import { starterAccess } from "./starter";
import type {
  BrowseRow,
  CorpusStats,
  DatasetRecord,
  Evidence,
  Facets,
  FundingRole,
  Grant,
  IndexRow,
  NetworkData,
  NetworkEdge,
  NetworkLane,
  NetworkNode,
  NotebookGuide,
  Publication,
  QuestionRow,
  FieldCalibration,
  ReuseGapModel,
  ScatterPoint,
  SubjectVocabulary,
} from "./types";

const DATA_DIR = join(process.cwd(), "public", "data");

function readJson<T>(relativePath: string, fallback: T): T {
  const path = join(DATA_DIR, relativePath);
  if (!existsSync(path)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing generated data file: ${relativePath}. ` +
          `Run \`cds export\` in ../pipeline before building the site.`,
      );
    }
    return fallback;
  }
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

let _index: IndexRow[] | null = null;
export function getIndex(): IndexRow[] {
  if (_index === null) {
    _index = readJson<IndexRow[]>("index.json", []);
  }
  return _index;
}

/** Fields the browse UI reads. Anything not listed here never reaches the browser. */
const BROWSE_FIELDS = [
  "id",
  "title",
  "short_title",
  "one_liner",
  "repositories",
  "cancer_types",
  "primary_sites",
  "subjects",
  "subject_scope",
  "modalities",
  "n_modalities",
  "n_cases",
  "n_samples",
  "access_tier",
  "has_followup",
  "has_survival_endpoint",
  "median_followup_months",
  "has_treatment_response",
  "population_flags",
  "n_verified_reuse",
  "n_citations_to_primary_publication",
  "reuse_gap_index",
  "has_citable_accession",
  "is_underexplored",
  "n_workbooks",
  "review_status",
] as const satisfies readonly (keyof BrowseRow)[];

let _browseRows: BrowseRow[] | null = null;

/**
 * The index projected down to what the browse page renders.
 *
 * Props handed to a client component are serialized into the page's payload, so every
 * field on the row is bytes over the wire for every visitor. The full row carries
 * `search_text`, `summary`, `tags` and program names that the browse UI never reads -
 * about half of a 1.16 MB file. `/data/index.json` itself is untouched: it is the
 * published API surface and agents rely on those fields.
 */
export function getBrowseRows(): BrowseRow[] {
  if (_browseRows === null) {
    _browseRows = getIndex().map((row) => {
      const out = {} as Record<string, unknown>;
      for (const key of BROWSE_FIELDS) out[key] = row[key];
      return out as BrowseRow;
    });
  }
  return _browseRows;
}

let _facets: Facets | null = null;
export function getFacets(): Facets {
  if (_facets === null) {
    _facets = readJson<Facets>("facets.json", {});
  }
  return _facets;
}

let _subjects: SubjectVocabulary | null = null;
export function getSubjects(): SubjectVocabulary {
  if (_subjects === null) {
    _subjects = readJson<SubjectVocabulary>("subjects.json", {
      version: "unknown",
      release_date: "unknown",
      subjects: [],
      states: [],
    });
  }
  return _subjects;
}

let _stats: CorpusStats | null = null;
export function getStats(): CorpusStats {
  if (_stats === null) {
    _stats = readJson<CorpusStats>("stats.json", {
      generated_at: new Date().toISOString(),
      pipeline_version: "0.0.0",
      n_datasets: 0,
      n_showcase: 0,
      n_underexplored: 0,
      n_expert_reviewed: 0,
      n_cases_total: 0,
      n_repositories: 0,
      n_distinct_modalities: 0,
      n_with_survival: 0,
      n_with_treatment_response: 0,
      n_reuse_assessed: 0,
      n_without_citable_accession: 0,
      n_with_publication_citations: 0,
      median_citation_to_reuse_ratio: null,
      n_grants_linked: 0,
      n_reuse_studies_verified: 0,
    });
  }
  return _stats;
}

let _questions: QuestionRow[] | null = null;
export function getQuestions(): QuestionRow[] {
  if (_questions === null) {
    _questions = readJson<QuestionRow[]>("questions.json", []);
  }
  return _questions;
}

const _records = new Map<string, DatasetRecord | null>();

export function getRecord(id: string): DatasetRecord | null {
  if (_records.has(id)) return _records.get(id) ?? null;
  const path = join(DATA_DIR, "datasets", `${id}.json`);
  const record = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as DatasetRecord)
    : null;
  _records.set(id, record);
  return record;
}

let _notebooks: NotebookGuide[] | null = null;

/**
 * The executed workbook catalog, reconstructed from the dataset attachments written by
 * the pipeline. This keeps the human-facing gallery on the same source of truth as the
 * badges and walkthroughs on each dataset page.
 */
export function getNotebookGuides(): NotebookGuide[] {
  if (_notebooks !== null) return _notebooks;

  const bySlug = new Map<string, NotebookGuide>();
  for (const row of getIndex().filter((r) => r.n_workbooks > 0)) {
    const record = getRecord(row.id);
    if (!record) continue;
    for (const example of record.analysis_examples) {
      if (!example.workbook_path) continue;
      const slug =
        example.template_source ??
        example.workbook_path.split("/").pop()?.replace(/\.(py|ipynb)$/, "") ??
        row.id;
      const existing = bySlug.get(slug);
      const dataset = {
        id: row.id,
        title: row.title,
        short_title: row.short_title,
      };
      if (existing) {
        if (!existing.datasets.some((d) => d.id === row.id)) existing.datasets.push(dataset);
      } else {
        bySlug.set(slug, { ...example, slug, datasets: [dataset] });
      }
    }
  }

  _notebooks = [...bySlug.values()]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((guide) => ({
      ...guide,
      datasets: guide.datasets.sort((a, b) => a.title.localeCompare(b.title)),
    }));
  return _notebooks;
}

/**
 * The schema.org/DCAT description of one dataset, as the pipeline wrote it.
 *
 * Read from the generated file rather than rebuilt here, so the document a crawler
 * finds in the page and the one served at /data/jsonld/{id}.jsonld are the same
 * document. Returned as a string because it is inlined verbatim; nothing on the site
 * reads its fields.
 *
 * Inlining is the point. Google Dataset Search and the other harvesters read JSON-LD
 * embedded in the page and do not follow a link to a .jsonld file, so a dataset
 * resource that only offered the file was invisible to exactly the discovery surface
 * it was generated for.
 */
const _jsonLd = new Map<string, string | null>();

export function getJsonLd(id: string): string | null {
  const hit = _jsonLd.get(id);
  if (hit !== undefined) return hit;
  const path = join(DATA_DIR, "jsonld", `${id}.jsonld`);
  let doc: string | null = null;
  if (existsSync(path)) {
    // Reserialized compactly: the file is indented for reading and the page is not.
    // Parsing also means a malformed document fails the build rather than shipping
    // broken structured data to a crawler.
    try {
      doc = JSON.stringify(JSON.parse(readFileSync(path, "utf8")));
    } catch {
      doc = null;
    }
  }
  _jsonLd.set(id, doc);
  return doc;
}

export function getAllRecordIds(): string[] {
  const dir = join(DATA_DIR, "datasets");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5));
}

let _byId: Map<string, IndexRow> | null = null;

export function getRowById(id: string): IndexRow | undefined {
  if (_byId === null) _byId = new Map(getIndex().map((r) => [r.id, r]));
  return _byId.get(id);
}

/**
 * Lower-cased sites and cancer types per row, built once for the whole index.
 *
 * `getRelated` runs for each of the six hundred dataset pages and compared against
 * every other row, lower-casing both sides on every comparison: a third of a million
 * comparisons and some two million throwaway strings per build, all of them the same
 * few hundred values. The corpus is immutable within a process, so the folded form is
 * computed once and the comparison becomes a set lookup.
 */
interface FoldedRow {
  sites: Set<string>;
  cancers: Set<string>;
  modalities: Set<string>;
}

let _folded: Map<string, FoldedRow> | null = null;

function folded(): Map<string, FoldedRow> {
  if (_folded === null) {
    _folded = new Map(
      getIndex().map((r) => [
        r.id,
        {
          sites: new Set(r.primary_sites.map((x) => x.toLowerCase())),
          cancers: new Set(r.cancer_types.map((x) => x.toLowerCase())),
          modalities: new Set(r.modalities),
        },
      ]),
    );
  }
  return _folded;
}

function overlap(a: Set<string>, b: Set<string>): number {
  // Walk the smaller set: the cost is min(|a|, |b|) lookups rather than |a|.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let n = 0;
  for (const v of small) if (large.has(v)) n += 1;
  return n;
}

/**
 * Datasets that pair well with a given one: a different modality on a comparable
 * cohort, or the same disease seen through another measurement. The panel exists to
 * push people out of the dataset they already knew about, so an underexplored
 * candidate is preferred when the fit is otherwise equal.
 */
export function getRelated(id: string, limit = 6): IndexRow[] {
  const index = getIndex();
  const self = getRowById(id);
  if (!self) return [];

  const fold = folded();
  const mine = fold.get(id) as FoldedRow;

  const scored = index
    .filter((r) => r.id !== id)
    .map((r) => {
      const theirs = fold.get(r.id) as FoldedRow;
      const siteOverlap = overlap(theirs.sites, mine.sites);
      const cancerOverlap = overlap(theirs.cancers, mine.cancers);
      let newModalities = 0;
      for (const m of theirs.modalities) if (!mine.modalities.has(m)) newModalities += 1;
      if (siteOverlap + cancerOverlap === 0) return { r, score: -1 };
      const score =
        cancerOverlap * 3 +
        siteOverlap * 2 +
        newModalities * 1.5 +
        (r.is_underexplored ? 2.5 : 0) +
        (r.is_showcase ? 1 : 0);
      return { r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.r);
}

/**
 * The largest cohort in the corpus whose vital status is recorded for every case and
 * informative for none.
 *
 * This is the concrete failure the resource exists to prevent - an agent ranking by
 * sample size picking a cohort that can answer nothing about outcome - and it is worth
 * naming on the page. It is looked up rather than written down, because the largest such
 * cohort changes as the corpus grows and a stale example would be exactly the kind of
 * unchecked claim this site criticises.
 */
export function getLargestUninformativeCohort(): {
  row: IndexRow;
  vitalStatusPct: number | null;
} | null {
  const candidates = getIndex()
    .filter((r) => r.has_survival_endpoint === false && (r.n_cases ?? 0) > 0)
    .sort((a, b) => (b.n_cases ?? 0) - (a.n_cases ?? 0));
  for (const row of candidates) {
    const rec = getRecord(row.id);
    if (!rec) continue;
    const vital = rec.clinical_variables.find(
      (v) => (v.harmonized_name ?? v.name) === "demographic.vital_status",
    );
    // Populated for effectively every case, informative for none: the exact trap.
    if (vital && (vital.populated_pct ?? 0) >= 99 && (vital.coverage_pct ?? 1) === 0) {
      return { row, vitalStatusPct: vital.populated_pct ?? null };
    }
  }
  return null;
}

/** The largest cohort in the corpus by recorded patient count, whatever it supports. */
export function getLargestCohort(): IndexRow | null {
  return (
    [...getIndex()]
      .filter((r) => (r.n_cases ?? 0) > 0)
      .sort((a, b) => (b.n_cases ?? 0) - (a.n_cases ?? 0))[0] ?? null
  );
}

export function getUnderexplored(limit?: number): IndexRow[] {
  const rows = getIndex()
    .filter((r) => r.is_underexplored)
    .sort((a, b) => (a.reuse_gap_index ?? 0) - (b.reuse_gap_index ?? 0));
  return limit ? rows.slice(0, limit) : rows;
}

export function getShowcase(): IndexRow[] {
  return getIndex()
    .filter((r) => r.is_showcase)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Every dataset the reuse model could assess, projected to what the scatter draws.
 * The full row is over 1 KB; the chart needs seven fields.
 */
export function getScatterPoints(): ScatterPoint[] {
  return getIndex()
    .filter(
      (r) =>
        r.expected_reuse !== null &&
        r.expected_reuse !== undefined &&
        r.n_verified_reuse !== null &&
        r.n_verified_reuse !== undefined,
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      short: r.short_title ?? r.title,
      observed: r.n_verified_reuse as number,
      expected: r.expected_reuse as number,
      index: r.reuse_gap_index ?? null,
      underexplored: r.is_underexplored,
    }));
}

let _calibration: FieldCalibration | null | undefined;

/**
 * The Europe PMC field comparison behind the reuse method, as measured on this build.
 * Null when `cds calibrate` has not been run, in which case the page says so rather
 * than quoting numbers from a previous corpus.
 */
export function getFieldCalibration(): FieldCalibration | null {
  if (_calibration === undefined) {
    _calibration = readJson<FieldCalibration | null>("field_calibration.json", null);
  }
  return _calibration;
}

let _model: ReuseGapModel | null | undefined;
export function getModel(): ReuseGapModel | null {
  if (_model === undefined) {
    _model = readJson<ReuseGapModel | null>("reuse_gap_model.json", null);
  }
  return _model;
}

export interface StarterCoverage {
  /** Records whose page carries repository-specific starter code. */
  total: number;
  /** Of those, the ones whose code runs with no account at all. */
  open: number;
  /** Of those, the ones needing a repository registration first. */
  account: number;
}

/**
 * How many dataset pages ship starter code a reader can run, and how many of those need
 * no account first. Counted from the records through the snippet generator's own rule,
 * so the number cannot outrun what `starterSnippets` actually emits.
 */
let _starter: StarterCoverage | null = null;

export function getStarterCoverage(): StarterCoverage {
  if (_starter) return _starter;
  let open = 0;
  let account = 0;
  for (const row of getIndex()) {
    const record = getRecord(row.id);
    if (!record) continue;
    const tier = starterAccess(record);
    if (tier === "open") open += 1;
    else if (tier === "account") account += 1;
  }
  _starter = { total: open + account, open, account };
  return _starter;
}

/**
 * Where every record stands on reuse measurement. Four exclusive groups that sum to
 * the corpus: untraceable, traceable but undatable, assessed and within expectation,
 * assessed and underexplored.
 */
export function getCorpusBreakdown() {
  const index = getIndex();
  let untraceable = 0;
  let undated = 0;
  let expected = 0;
  let under = 0;
  for (const r of index) {
    if (r.has_citable_accession === false) untraceable += 1;
    else if (r.expected_reuse === null || r.expected_reuse === undefined) undated += 1;
    else if (r.is_underexplored) under += 1;
    else expected += 1;
  }
  return { total: index.length, untraceable, undated, expected, under };
}

export function getRepositoryBreakdown() {
  const by = new Map<string, { traceable: number; untraceable: number }>();
  for (const r of getIndex()) {
    const key = r.repository ?? r.repositories[0] ?? "Other";
    const cur = by.get(key) ?? { traceable: 0, untraceable: 0 };
    if (r.has_citable_accession === false) cur.untraceable += 1;
    else cur.traceable += 1;
    by.set(key, cur);
  }
  return [...by.entries()].map(([repository, v]) => ({ repository, ...v }));
}

export type NetworkScope =
  | "showcase"
  | "underexplored"
  | "GDC"
  | "PDC"
  | "HTAN"
  | "cBioPortal"
  | "IDC"
  | "all"
  | `award:${string}`;

export interface AwardSummary {
  num: string;
  title: string | null;
  pi: string | null;
  n_datasets: number;
  n_articles: number;
}

let _awards: AwardSummary[] | null = null;

/** Every NCI award linked to at least one dataset, with how much it touches. */
export function getAwards(): AwardSummary[] {
  if (_awards) return _awards;
  const by = new Map<string, AwardSummary & { ids: Set<string> }>();
  for (const row of getIndex()) {
    const rec = getRecord(row.id);
    if (!rec || rec.grants.length === 0) continue;
    const nArticles = rec.primary_publications.length + rec.reuse.length;
    for (const g of rec.grants) {
      const num = g.core_project_num ?? g.project_num;
      if (!num) continue;
      const cur = by.get(num) ?? {
        num,
        title: g.title ?? null,
        pi: g.pi_names.slice(0, 2).join(", ") || null,
        n_datasets: 0,
        n_articles: 0,
        ids: new Set<string>(),
      };
      if (!cur.ids.has(rec.id)) {
        cur.ids.add(rec.id);
        cur.n_datasets += 1;
        cur.n_articles += nArticles;
      }
      by.set(num, cur);
    }
  }
  _awards = [...by.values()]
    .map((a) => ({ num: a.num, title: a.title, pi: a.pi, n_datasets: a.n_datasets, n_articles: a.n_articles }))
    .sort((a, b) => b.n_datasets - a.n_datasets || a.num.localeCompare(b.num));
  return _awards;
}

/**
 * The award to open the network on when none is chosen: the most connected one that is
 * still small enough to read without zooming. Cancer-centre core grants touch
 * hundreds of datasets and make a poor first picture.
 */
export function defaultAward(): AwardSummary | null {
  const awards = getAwards();
  return awards.find((a) => a.n_datasets <= 40 && a.n_datasets >= 3) ?? awards[0] ?? null;
}

export const NETWORK_SCOPES: { key: NetworkScope; label: string }[] = [
  { key: "showcase", label: "Reviewed datasets" },
  { key: "underexplored", label: "Underexplored" },
  { key: "GDC", label: "GDC" },
  { key: "PDC", label: "PDC" },
  { key: "HTAN", label: "HTAN" },
  { key: "cBioPortal", label: "cBioPortal" },
  { key: "IDC", label: "IDC" },
  { key: "all", label: "Everything" },
];

function shortTitle(t: string | null | undefined, max = 60): string {
  if (!t) return "Untitled";
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}\u2026` : t;
}

/**
 * The columns of the award-centred graph: one award's money, the cohorts it bought and
 * the articles that came out of them.
 */
const AWARD_VIEW_LANES: NetworkLane[] = [
  {
    label: "NCI awards",
    hint: "Resolved from each dataset's publications through NIH RePORTER",
    empty: "No award in this slice could be resolved through RePORTER.",
  },
  {
    label: "Datasets",
    hint: "Cohorts the award is credited on",
    empty: "No dataset in this slice carries a resolved award.",
  },
  {
    label: "Articles",
    hint: "The dataset's own paper plus the reuse studies it ships",
    empty: "None of these datasets has a traceable article.",
  },
];

/**
 * The columns of the dataset-centred graph: money in, the data, what was published, and
 * the money that paid for publishing it.
 *
 * Read left to right this is the whole argument for tracing funding at all. The first
 * column is the return NCI already counts - a grant produced a cohort. The last is the
 * one nothing counts, because it is spread across other people's grants: every award
 * that got a paper out of data it did not pay to create.
 */
export const DATASET_VIEW_LANES: NetworkLane[] = [
  {
    label: "Awards that paid to create this data",
    hint: "Credited on the dataset's own marker paper",
    empty:
      "No award can be attributed. Either no repository or reviewer names this dataset's marker paper, or RePORTER indexes no NCI award against it.",
  },
  { label: "The dataset", hint: "" },
  {
    label: "Articles that used it",
    hint: "The accession appears in their methods section",
    empty:
      "No article can be traced to this dataset, so nothing it enabled is visible here.",
  },
  {
    label: "Awards those articles were funded by",
    hint: "NCI money spent on data it did not pay to generate",
    empty: "None of the traced articles reports an NCI award.",
  },
];

/**
 * The funding-to-data-to-findings graph for a slice of the corpus.
 *
 * Awards come from NIH RePORTER links on each record; articles are the record's primary
 * publications plus the reuse exemplars it ships. Nodes shared between datasets (an award
 * that paid for two cohorts, an article that analyzed three) are what make the picture
 * worth drawing, so ids are global and deduplicated across the slice.
 */
export function getNetwork(scope: NetworkScope): NetworkData {
  const award = scope.startsWith("award:") ? scope.slice("award:".length) : null;
  const rows = getIndex().filter((r) => {
    if (award) {
      const rec = getRecord(r.id);
      return Boolean(rec?.grants.some((g) => (g.core_project_num ?? g.project_num) === award));
    }
    if (scope === "all") return true;
    if (scope === "showcase") return r.is_showcase;
    if (scope === "underexplored") return r.is_underexplored;
    return r.repositories.includes(scope) || r.repository === scope;
  });

  const nodes = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];
  const seenEdge = new Set<string>();
  const link = (source: string, target: string, kind: NetworkEdge["kind"]) => {
    const k = `${source}|${target}|${kind}`;
    if (seenEdge.has(k)) return;
    seenEdge.add(k);
    edges.push({ source, target, kind });
  };

  for (const row of rows) {
    const rec = getRecord(row.id);
    if (!rec) continue;
    const dId = `dataset:${rec.id}`;
    nodes.set(dId, {
      id: dId,
      kind: "dataset",
      lane: 1,
      label: rec.short_title ?? rec.title,
      sub: rec.title,
      href: `/datasets/${rec.id}`,
      underexplored: rec.underexplored.is_underexplored,
      repository: rec.repository?.short_name ?? null,
    });

    for (const g of rec.grants) {
      const num = g.core_project_num ?? g.project_num;
      if (!num) continue;
      if (award && num !== award) continue;
      const aId = `award:${num}`;
      if (!nodes.has(aId)) {
        nodes.set(aId, {
          id: aId,
          kind: "award",
          lane: 0,
          label: num,
          sub: [g.title ? shortTitle(g.title, 80) : null, g.pi_names.slice(0, 2).join(", ") || null]
            .filter(Boolean)
            .join(" \u00b7 "),
          href: g.reporter_url ?? null,
          // When the whole view is one award, that award is what the view is about.
          focus: award ? num === award : undefined,
        });
      }
      const kind =
        g.role === "generation" ? "generation" : g.role === "reuse" ? "reuse_funding" : "infrastructure";
      link(aId, dId, kind);
    }

    const paperId = (p: { pmid?: string | null; doi?: string | null; title?: string | null }) =>
      `paper:${p.pmid ?? p.doi ?? p.title ?? "untitled"}`;
    const addPaper = (p: DatasetRecord["primary_publications"][number]) => {
      const pId = paperId(p);
      if (!nodes.has(pId)) {
        nodes.set(pId, {
          id: pId,
          kind: "paper",
          lane: 2,
          label: shortTitle(p.title ?? p.doi ?? p.pmid, 70),
          sub: [p.authors_short, p.journal, p.year ? String(p.year) : null].filter(Boolean).join(" \u00b7 "),
          href: p.url ?? (p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : null),
        });
      }
      return pId;
    };
    for (const p of rec.primary_publications) link(dId, addPaper(p), "primary");
    for (const x of rec.reuse) {
      const pId = addPaper(x.publication);
      link(dId, pId, x.tier === "t3_analyzed" || x.tier === "t4_confirmed" ? "analyzed" : "weaker");
    }
  }

  return fitLanes([...nodes.values()], edges, awardViewLanes(award));
}

/**
 * The award view's columns. The middle label depends on whether one award is in
 * view: "Cohorts the award is credited on" is wrong for a whole-repository slice.
 */
function awardViewLanes(award: string | null): NetworkLane[] {
  const lanes = AWARD_VIEW_LANES.map((lane) => ({ ...lane }));
  if (!award) lanes[1].hint = "Cohorts these awards are credited on";
  return lanes;
}

/**
 * How many nodes one lane may draw.
 *
 * The page's claim is that you can take in a funding chain at a glance, and a column you
 * have to scroll is not a glance. Six of the compact cards FundingFlow draws is about
 * 500px, so every lane, its heading and the legend fit one laptop screen together.
 *
 * The cap is what makes the claim true for every slice rather than for the small ones.
 * Six is also about where a column stops being readable as a shape: past that the eye
 * is scanning a list, and the tables under the graph are a better list than the graph is.
 */
export const FLOW_LANE_CAP = 6;

/**
 * Keep each lane to the nodes worth drawing, and record how many were set aside.
 *
 * Which ones to keep is not a matter of taste. A node joined to several others is what
 * makes this a network rather than a list - an award on two datasets paid for both, an
 * article on two combined them - so a lane is ranked by degree and the best connected
 * are kept. They are then restored to their original order, because that order was
 * chosen to keep the connectors from crossing and ranking destroys it.
 *
 * Two details earn their lines. Lanes are cut left to right so that by the time the last
 * one is ranked, every lane it points back to is settled and its degree counts edges
 * that will really be drawn. And a node whose every neighbour was cut elsewhere is
 * dropped afterwards: a card wired to nothing is a claim the picture does not support.
 *
 * This replaced a rule that dropped only nodes touching exactly one dataset, above a
 * 600-node budget. It set aside the right nodes and still left 236 awards in one column
 * 27,000px tall, and did nothing at all to a four-lane dataset view already at 2,000px.
 */
export function fitLanes(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  lanes: NetworkLane[],
  cap = FLOW_LANE_CAP,
): NetworkData {
  const cut = new Set<string>();
  const out = lanes.map((lane) => ({ ...lane }));

  for (let i = 0; i < out.length; i++) {
    const inLane = nodes.filter((n) => n.lane === i);
    if (inLane.length <= cap) continue;
    const degree = new Map<string, number>();
    for (const e of edges) {
      if (!cut.has(e.target)) degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      if (!cut.has(e.source)) degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    const ranked = inLane
      .map((n, at) => ({ n, at }))
      .sort(
        (a, b) =>
          Number(Boolean(b.n.focus)) - Number(Boolean(a.n.focus)) ||
          (degree.get(b.n.id) ?? 0) - (degree.get(a.n.id) ?? 0) ||
          a.at - b.at,
      );
    for (const { n } of ranked.slice(cap)) cut.add(n.id);
    out[i].more = inLane.length - cap;
  }

  const hadEdge = new Set<string>();
  const stillLinked = new Set<string>();
  for (const e of edges) {
    hadEdge.add(e.source);
    hadEdge.add(e.target);
    if (cut.has(e.source) || cut.has(e.target)) continue;
    stillLinked.add(e.source);
    stillLinked.add(e.target);
  }
  for (const n of nodes) {
    // A node that was never joined to anything stays: that it stands alone is a true
    // thing about the corpus, not an artefact of the cap.
    if (cut.has(n.id) || n.focus || !hadEdge.has(n.id) || stillLinked.has(n.id)) continue;
    cut.add(n.id);
    out[n.lane].more = (out[n.lane].more ?? 0) + 1;
  }

  return {
    nodes: nodes.filter((n) => !cut.has(n.id)),
    edges: edges.filter((e) => !cut.has(e.source) && !cut.has(e.target)),
    lanes: out,
  };
}

export interface AwardConnection {
  dataset_id: string;
  dataset_title: string;
  dataset_short: string | null;
  role: FundingRole;
  org_name: string | null;
  pi_names: string[];
  fiscal_years: number[];
  award_amount_usd: number | null;
  evidence: Evidence[];
  n_articles: number;
}

/** Every dataset an award touches, with the role and the RePORTER evidence for each link. */
export function getAwardConnections(num: string): AwardConnection[] {
  const out: AwardConnection[] = [];
  for (const row of getIndex()) {
    const rec = getRecord(row.id);
    if (!rec) continue;
    const g = rec.grants.find((x) => (x.core_project_num ?? x.project_num) === num);
    if (!g) continue;
    out.push({
      dataset_id: rec.id,
      dataset_title: rec.title,
      dataset_short: rec.short_title ?? null,
      role: g.role,
      org_name: g.org_name ?? null,
      pi_names: g.pi_names,
      fiscal_years: g.fiscal_years,
      award_amount_usd: g.award_amount_usd ?? null,
      evidence: g.evidence,
      n_articles: rec.primary_publications.length + rec.reuse.length,
    });
  }
  const order: Record<FundingRole, number> = { generation: 0, reuse: 1, infrastructure: 2, unknown: 3 };
  return out.sort((a, b) => order[a.role] - order[b.role] || b.n_articles - a.n_articles);
}


// ------------------------------------------------------------------------------------
// The dataset-centred funding view
// ------------------------------------------------------------------------------------

/** One award as it appears on a dataset's funding page. */
export interface FundingAward {
  num: string;
  title: string | null;
  pi: string | null;
  org: string | null;
  activity_code: string | null;
  fiscal_years: number[];
  award_amount_usd: number | null;
  reporter_url: string | null;
  role: FundingRole;
  evidence: Evidence[];
  /** Reuse side only: the traced articles this award is credited on. */
  articles: { title: string; url: string | null; year: number | null }[];
  /**
   * Reuse side only: this award also paid to create the data, so it appears on both
   * sides. A lab reusing its own cohort is a real and common pattern, and reading it as
   * a duplicated row would be the wrong conclusion.
   */
  also_generation?: boolean;
}

export interface DatasetFunding {
  id: string;
  title: string;
  short_title: string | null;
  repository: string | null;
  /** Awards credited on the dataset's own marker paper. */
  generation: FundingAward[];
  /** Awards credited on an article that used the data. */
  enabled: FundingAward[];
  /** Awards that maintain or redistribute the data rather than create or reuse it. */
  infrastructure: FundingAward[];
  n_traced_articles: number;
  n_articles_with_award: number;
  has_citable_accession: boolean;
  /** True when a marker paper exists but only as this pipeline's own nomination. */
  marker_paper_inferred: boolean;
  has_marker_paper: boolean;
  graph: NetworkData;
}

const INFERRED_MARKER_LABEL = "Candidate primary publication (machine-inferred)";

/**
 * Whether a publication is the pipeline's own nomination rather than one a repository
 * or a reviewer supplied. Nothing may be counted from one, and no heading may call one
 * the dataset's original publication.
 */
export function isInferredMarker(pub: Publication): boolean {
  return (pub.evidence ?? []).some((e) => (e.source_label ?? "") === INFERRED_MARKER_LABEL);
}

function awardOf(g: Grant): FundingAward {
  return {
    num: (g.core_project_num ?? g.project_num) as string,
    title: g.title ?? null,
    pi: g.pi_names.slice(0, 2).join(", ") || null,
    org: g.org_name ?? null,
    activity_code: g.activity_code ?? null,
    fiscal_years: g.fiscal_years,
    award_amount_usd: g.award_amount_usd ?? null,
    reporter_url: g.reporter_url ?? null,
    role: g.role,
    evidence: g.evidence,
    articles: [],
  };
}

function yearSpan(years: number[]): string | null {
  if (years.length === 0) return null;
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? `FY${lo}` : `FY${lo}\u2013${hi}`;
}

/** The one-line summary under an award's number, wherever it is drawn. */
function awardSub(a: FundingAward): string {
  return [a.title ? shortTitle(a.title, 80) : null, a.pi, yearSpan(a.fiscal_years)]
    .filter(Boolean)
    .join(" \u00b7 ");
}

/**
 * Money in, the data, what was published from it, and the money that paid for that.
 *
 * The four lanes are the answer to a question the corpus could always have answered and
 * never showed in one place: which award paid to create this cohort, and which awards
 * got a paper out of it afterwards. Both sides come from the same RePORTER index and are
 * distinguished only by which paper the award is credited on - the dataset's own marker
 * paper, or an article that used the data later.
 *
 * Either side can be empty, and the lanes say why rather than rendering a blank column.
 * That is not a shortfall to hide: 378 of the corpus's records carry no accession an
 * article could quote, so nothing they enabled is traceable, and a record whose marker
 * paper nobody authoritative names has no attributable generation award at all.
 */
export function getDatasetFunding(id: string): DatasetFunding | null {
  const rec = getRecord(id);
  if (!rec) return null;

  const grants = rec.grants.filter((g) => g.core_project_num ?? g.project_num);
  const byNum = new Map<string, Grant>();
  for (const g of grants) {
    const key = (g.core_project_num ?? g.project_num) as string;
    if (!byNum.has(key)) byNum.set(key, g);
  }
  const generation = grants.filter((g) => g.role === "generation").map(awardOf);
  const infrastructure = grants.filter((g) => g.role === "infrastructure").map(awardOf);
  const generationNums = new Set(generation.map((a) => a.num));

  // The enabled side is derived from the articles, not from the grant roles.
  //
  // Those two are not the same set, and the difference is not cosmetic. A grant's role
  // records how it was first classified; `linked_grants` records which traced article it
  // is actually credited on. An award can be classified as infrastructure - or upgraded
  // to generation once its marker paper was known - and still be the award that paid for
  // a reuse study. Counting roles gave a lane of 18 nodes under a heading that said 10.
  // Deriving both the lane and the table from the articles makes the number on the page
  // the number in the graph, by construction.
  const traced = rec.reuse;
  const enabledByNum = new Map<string, FundingAward>();
  let nWithAward = 0;
  for (const x of traced) {
    if (x.linked_grants.length > 0) nWithAward += 1;
    for (const core of x.linked_grants) {
      let award = enabledByNum.get(core);
      if (!award) {
        const g = byNum.get(core);
        award = g
          ? { ...awardOf(g), articles: [] }
          : {
              num: core,
              title: null,
              pi: null,
              org: null,
              activity_code: null,
              fiscal_years: [],
              award_amount_usd: null,
              reporter_url: `https://reporter.nih.gov/search/results?text_criteria=${core}`,
              role: "reuse" as FundingRole,
              evidence: [],
              articles: [],
            };
        award.also_generation = generationNums.has(core);
        enabledByNum.set(core, award);
      }
      award.articles.push({
        title: shortTitle(x.publication.title ?? x.publication.doi ?? x.publication.pmid, 90),
        url:
          x.publication.url ??
          (x.publication.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${x.publication.pmid}/` : null),
        year: x.publication.year ?? null,
      });
    }
  }
  const articleOrder = new Map<string, number>();
  {
    let i = 0;
    for (const x of traced) {
      if (x.linked_grants.length === 0) continue;
      const key = x.publication.pmid ?? x.publication.doi ?? x.publication.title ?? "untitled";
      if (!articleOrder.has(key)) articleOrder.set(key, i++);
    }
  }
  const barycentre = new Map<string, number>();
  for (const x of traced) {
    const key = x.publication.pmid ?? x.publication.doi ?? x.publication.title ?? "untitled";
    const at = articleOrder.get(key);
    if (at === undefined) continue;
    for (const core of x.linked_grants) {
      const seen = barycentre.get(core);
      barycentre.set(core, seen === undefined ? at : (seen + at) / 2);
    }
  }
  const enabled = [...enabledByNum.values()].sort(
    (a, b) =>
      (barycentre.get(a.num) ?? 0) - (barycentre.get(b.num) ?? 0) ||
      b.articles.length - a.articles.length ||
      a.num.localeCompare(b.num),
  );
  generation.sort((a, b) => a.num.localeCompare(b.num));
  infrastructure.sort((a, b) => a.num.localeCompare(b.num));

  // ------------------------------------------------------------------------- the graph
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const dId = `dataset:${rec.id}`;

  for (const a of generation) {
    nodes.push({
      id: `gen:${a.num}`,
      kind: "award",
      lane: 0,
      label: a.num,
      sub: awardSub(a),
      // No organisation here. It is a second clamped line saying what the Project
      // column of the table directly below already spells out in full.
      href: a.reporter_url,
    });
    edges.push({ source: `gen:${a.num}`, target: dId, kind: "generation" });
  }
  nodes.push({
    id: dId,
    kind: "dataset",
    lane: 1,
    label: rec.short_title ?? rec.title,
    sub: rec.title,
    meta: rec.repository?.short_name ?? null,
    href: `/datasets/${rec.id}`,
    underexplored: rec.underexplored.is_underexplored,
    repository: rec.repository?.short_name ?? null,
    focus: true,
  });

  // Only articles that carry an award reach the graph. An article with no NCI money
  // behind it connects to nothing in the fourth lane, and a hundred such stubs would
  // bury the ones that make the chain readable. The full list stays on the dataset page.
  const articleId = (x: DatasetRecord["reuse"][number]) =>
    `paper:${x.publication.pmid ?? x.publication.doi ?? x.publication.title ?? "untitled"}`;
  const drawn = new Set<string>();
  for (const x of traced) {
    if (x.linked_grants.length === 0) continue;
    const pId = articleId(x);
    if (!drawn.has(pId)) {
      drawn.add(pId);
      nodes.push({
        id: pId,
        kind: "paper",
        lane: 2,
        label: shortTitle(x.publication.title ?? x.publication.doi ?? x.publication.pmid, 84),
        sub: [x.publication.authors_short, x.publication.journal, x.publication.year]
          .filter(Boolean)
          .join(" \u00b7 "),
        meta:
          x.publication.citation_count !== null && x.publication.citation_count !== undefined
            ? `${num(x.publication.citation_count)} citations`
            : null,
        href:
          x.publication.url ??
          (x.publication.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${x.publication.pmid}/` : null),
      });
      edges.push({
        source: dId,
        target: pId,
        kind: x.tier === "t3_analyzed" || x.tier === "t4_confirmed" ? "analyzed" : "weaker",
      });
    }
    for (const core of x.linked_grants) {
      edges.push({ source: pId, target: `reuse:${core}`, kind: "reuse_funding" });
    }
  }

  // The fourth lane is pushed in `enabled` order, not in the order the articles happened
  // to mention each award: a lane renders in array order, and that order is what decides
  // whether eighteen connectors read as a flow or as a hatched wall.
  const nDrawn = drawn.size;
  for (const a of enabled) {
    nodes.push({
      id: `reuse:${a.num}`,
      kind: "award",
      lane: 3,
      label: a.num,
      sub: awardSub(a) || null,
      meta:
        [
          a.articles.length > 0
            ? nDrawn === 1
              ? "funded this article"
              : `funded ${num(a.articles.length)} of these ${num(nDrawn)} articles`
            : null,
          a.also_generation ? "also paid to create this data" : null,
        ]
          .filter(Boolean)
          .join(" \u00b7 ") || null,
      href: a.reporter_url,
    });
  }

  const markerInferred =
    rec.primary_publications.length > 0 &&
    rec.primary_publications.every((pub) =>
      isInferredMarker(pub),
    );

  return {
    id: rec.id,
    title: rec.title,
    short_title: rec.short_title ?? null,
    repository: rec.repository?.short_name ?? null,
    generation,
    enabled,
    infrastructure,
    n_traced_articles: traced.length,
    n_articles_with_award: nWithAward,
    has_citable_accession: rec.reuse_metrics.has_citable_accession !== false,
    marker_paper_inferred: markerInferred,
    has_marker_paper: rec.primary_publications.length > 0,
    // Capped like every other slice. A well-documented cohort carries a dozen awards
    // a side, which is a 2,000px column; the tables below this graph list them all.
    graph: fitLanes(nodes, edges, DATASET_VIEW_LANES),
  };
}

/** A dataset offered in the funding view's picker, with how much each side holds. */
export interface FundingCandidate {
  id: string;
  title: string;
  short_title: string | null;
  repository: string | null;
  n_generation: number;
  n_enabled: number;
  n_articles: number;
}

let _fundingCandidates: FundingCandidate[] | null = null;

/**
 * Every dataset with at least one award on either side, best-documented first.
 *
 * "Best documented" is deliberately both sides multiplied rather than added: a record
 * showing money in *and* money out demonstrates something no single-sided one can, and
 * is what the picker should offer first.
 */
export function getFundingCandidates(): FundingCandidate[] {
  if (_fundingCandidates) return _fundingCandidates;
  const out: FundingCandidate[] = [];
  for (const row of getIndex()) {
    const rec = getRecord(row.id);
    if (!rec || rec.grants.length === 0) continue;
    const gen = new Set<string>();
    for (const g of rec.grants) {
      const numId = g.core_project_num ?? g.project_num;
      if (numId && g.role === "generation") gen.add(numId);
    }
    // Same definition as the enabled lane: awards credited on a traced article.
    const reuse = new Set<string>();
    for (const x of rec.reuse) for (const core of x.linked_grants) reuse.add(core);
    if (gen.size === 0 && reuse.size === 0) continue;
    out.push({
      id: rec.id,
      title: rec.title,
      short_title: rec.short_title ?? null,
      repository: rec.repository?.short_name ?? null,
      n_generation: gen.size,
      n_enabled: reuse.size,
      n_articles: rec.reuse.filter((x) => x.linked_grants.length > 0).length,
    });
  }
  const score = (c: FundingCandidate) =>
    (c.n_generation > 0 && c.n_enabled > 0 ? 1000 : 0) +
    Math.min(c.n_generation, 25) * Math.min(c.n_enabled, 25) +
    c.n_articles;
  _fundingCandidates = out.sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  return _fundingCandidates;
}

/** Corpus-wide totals for the funding view's own caveats. */
export function getFundingCoverage() {
  const cands = getFundingCandidates();
  const total = getIndex().length;
  const bothSides = cands.filter((c) => c.n_generation > 0 && c.n_enabled > 0).length;
  return {
    total,
    with_any_award: cands.length,
    with_generation: cands.filter((c) => c.n_generation > 0).length,
    with_enabled: cands.filter((c) => c.n_enabled > 0).length,
    both_sides: bothSides,
  };
}
