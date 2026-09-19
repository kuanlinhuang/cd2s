import { getIndex } from "@/lib/data";
import type { IndexRow } from "@/lib/types";

/**
 * Where a question should take the visitor.
 *
 * The dataset agent answers one kind of question: "which dataset can support this
 * analysis?" The front door receives every kind. This router reads the wording and
 * adds the page that answers the other kinds - an award's funding network, a dataset
 * named outright, a comparison of two, the reuse page, the exact Methods section, or
 * the software page. The routes are offered alongside the dataset shortlist, never
 * instead of it.
 *
 * Deterministic and cheap: regular expressions and a title lookup. It chooses pages;
 * it never states a fact about a dataset, so it cannot state a wrong one.
 */

export type RouteKind = "award" | "dataset" | "compare" | "underexplored" | "method" | "software";

export interface RouteCard {
  kind: RouteKind;
  href: string;
  label: string;
  detail: string;
}

export interface Intent {
  routes: RouteCard[];
}

const AWARD = /\b[A-Z]\d{2}[A-Z]{2}\d{6}\b/g;
const UNDEREXPLORED =
  /under.?explored|under.?used|less (?:often )?used|few(?:er)? (?:people|articles|studies)|nobody has/i;
const SOFTWARE = /\bAPI\b|\bJSON\b|croissant|json-?ld|bulk download|llms\.txt|openapi|for (?:my|an) agent\b/i;
const METHOD_OPENER = /^\s*(?:how|why|what (?:does|is|counts|do)|where do(?:es)?|when (?:is|was|did))\b/i;

/** Methods anchors, most specific first; the first match wins. */
const METHOD_ANCHORS: { test: RegExp; anchor: string; label: string }[] = [
  { test: /under.?explored|reuse gap|gap index|expected reuse/i, anchor: "#reuse-gap", label: "The reuse gap index" },
  { test: /reuse|reused|citation|cited/i, anchor: "#reuse", label: "Grading reuse: citation is not use" },
  { test: /not reported|informative|complete/i, anchor: "#clinical", label: "Measuring clinical completeness" },
  { test: /verdict|supported|measured/i, anchor: "#fit", label: "The six analysis verdicts" },
  { test: /evidence|provenance|source|chip/i, anchor: "#principle", label: "One rule: no claim without provenance" },
  { test: /merge|duplicate|same cohort/i, anchor: "#merging", label: "Merging the same cohort across repositories" },
  { test: /weak|bias|limit|wrong|miss/i, anchor: "#limitations", label: "Where this is weak" },
  { test: /available|dated|dating|since|first year/i, anchor: "#dating", label: "Dating when data became available" },
];

/** Letters and digits only, lower case, so "CPTAC STAD" and "cptac-stad" compare equal. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

type NameHit = { row: IndexRow; token: string };

/**
 * Datasets named in the query by short title, id or full title.
 *
 * Names are matched against whole words and runs of up to three words, so "TCGA-BRCA",
 * "tcga brca" and "gdc-tcga-brca" all name one dataset while "brca" inside a sentence
 * about BRCA1 does not. A name must normalise to at least four characters.
 */
function namedDatasets(query: string, index: IndexRow[]): NameHit[] {
  const words = query.split(/[\s,;/]+/).filter(Boolean);
  const phrases = new Set<string>();
  for (let i = 0; i < words.length; i++) {
    for (let len = 1; len <= 3 && i + len <= words.length; len++) {
      const p = normalizeName(words.slice(i, i + len).join(" "));
      if (p.length >= 4) phrases.add(p);
    }
  }
  if (phrases.size === 0) return [];
  const hits: NameHit[] = [];
  for (const row of index) {
    for (const token of [row.short_title, row.id, row.title]) {
      if (!token) continue;
      const n = normalizeName(token);
      if (n.length >= 4 && phrases.has(n)) {
        hits.push({ row, token });
        break;
      }
    }
  }
  return hits;
}

export function routeIntent(rawQuery: string, index: IndexRow[] = getIndex()): Intent {
  const query = rawQuery.trim().slice(0, 600);
  const routes: RouteCard[] = [];

  for (const num of new Set(query.toUpperCase().match(AWARD) ?? [])) {
    routes.push({
      kind: "award",
      href: `/network?award=${encodeURIComponent(num)}`,
      label: `Funding to findings for ${num}`,
      detail: "The datasets this NCI award paid for and the articles that analysed them.",
    });
  }

  // Grouped by the name the visitor typed, because one name can belong to several
  // records. A comparison needs every typed name to resolve to exactly one record;
  // any name held by several records is ambiguous, so every record that matched is
  // offered as a candidate rather than one of them chosen by position.
  const byName = new Map<string, IndexRow[]>();
  for (const hit of namedDatasets(query, index)) {
    const key = normalizeName(hit.token);
    const rows = byName.get(key) ?? [];
    rows.push(hit.row);
    byName.set(key, rows);
  }
  const groups = [...byName.values()];
  if (groups.length >= 2 && groups.every((rows) => rows.length === 1)) {
    const rows = groups.map((r) => r[0]).slice(0, 4);
    routes.push({
      kind: "compare",
      href: `/compare?ids=${rows.map((r) => r.id).join(",")}`,
      label: `Compare ${rows.map((r) => r.short_title ?? r.title).join(", ")} side by side`,
      detail: "Only the rows where they differ, with the measurement unique to each starred.",
    });
  } else {
    for (const rows of groups) {
      for (const row of rows.slice(0, 4)) {
        routes.push({
          kind: "dataset",
          href: `/datasets/${row.id}`,
          label: rows.length > 1 && row.short_title ? `${row.title} (${row.short_title})` : row.title,
          detail: row.one_liner ?? "Can it answer your question, what it cannot tell you, who has used it, how to start.",
        });
      }
    }
  }

  if (UNDEREXPLORED.test(query)) {
    routes.push({
      kind: "underexplored",
      href: "/underexplored",
      label: "Underexplored datasets",
      detail: "Where every dataset stands on reuse, and the ones reused far less than comparable datasets.",
    });
  }

  if (METHOD_OPENER.test(query)) {
    const hit = METHOD_ANCHORS.find((m) => m.test.test(query));
    if (hit) {
      routes.push({
        kind: "method",
        href: `/methods${hit.anchor}`,
        label: hit.label,
        detail: "How this was built: the method behind that part of the site, and where it is weak.",
      });
    }
  }

  if (SOFTWARE.test(query)) {
    routes.push({
      kind: "software",
      href: "/agents",
      label: "For software",
      detail: "JSON records, agent briefs, Croissant, JSON-LD, and the search and agent endpoints.",
    });
  }

  return { routes };
}
