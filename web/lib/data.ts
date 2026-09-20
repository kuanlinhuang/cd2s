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

import type {
  BrowseRow,
  CorpusStats,
  DatasetRecord,
  Evidence,
  Facets,
  FundingRole,
  IndexRow,
  NetworkData,
  NetworkEdge,
  NetworkNode,
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

export function getRowById(id: string): IndexRow | undefined {
  return getIndex().find((r) => r.id === id);
}

/**
 * Datasets that pair well with a given one: a different modality on a comparable
 * cohort, or the same disease seen through another measurement. The panel exists to
 * push people out of the dataset they already knew about, so an underexplored
 * candidate is preferred when the fit is otherwise equal.
 */
export function getRelated(id: string, limit = 6): IndexRow[] {
  const index = getIndex();
  const self = index.find((r) => r.id === id);
  if (!self) return [];

  const siteSet = new Set(self.primary_sites.map((s) => s.toLowerCase()));
  const cancerSet = new Set(self.cancer_types.map((s) => s.toLowerCase()));
  const modSet = new Set(self.modalities);

  const scored = index
    .filter((r) => r.id !== id)
    .map((r) => {
      const siteOverlap = r.primary_sites.filter((s) =>
        siteSet.has(s.toLowerCase()),
      ).length;
      const cancerOverlap = r.cancer_types.filter((s) =>
        cancerSet.has(s.toLowerCase()),
      ).length;
      const newModalities = r.modalities.filter((m) => !modSet.has(m)).length;
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
          label: num,
          sub: [g.title ? shortTitle(g.title, 80) : null, g.pi_names.slice(0, 2).join(", ") || null]
            .filter(Boolean)
            .join(" \u00b7 "),
          href: g.reporter_url ?? null,
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

  return { nodes: [...nodes.values()], edges };
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
