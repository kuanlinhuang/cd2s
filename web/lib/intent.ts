import { getIndex } from "@/lib/data";
import { readNeeds } from "@/lib/needs";
import type { IndexRow } from "@/lib/types";

/**
 * Where a question should take the visitor.
 *
 * The dataset agent answers one kind of question: "which dataset can support this
 * analysis?" The front door receives every kind. This router reads the wording and
 * adds the page that answers the other kinds - an award's funding network, a dataset
 * named outright, a comparison of two, the reuse page, the exact Methods section, or
 * the software page - and decides whether the dataset shortlist should run at all.
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
  /** Whether the dataset shortlist should run for this query. */
  shortlist: boolean;
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

const _vocabulary = new WeakMap<IndexRow[], Set<string>>();

/**
 * Words that name a disease or a site anywhere in the corpus. Measurements are not
 * listed here because `readNeeds` already recognises them; the two together decide
 * whether a lookup-shaped question still has something to search for.
 */
function vocabulary(index: IndexRow[]): Set<string> {
  const cached = _vocabulary.get(index);
  if (cached) return cached;
  const words = new Set<string>();
  const add = (s: string) =>
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4)
      .forEach((w) => words.add(w));
  for (const row of index) {
    row.cancer_types.forEach(add);
    row.primary_sites.forEach(add);
  }
  for (const generic of ["cancer", "cancers", "tumor", "tumour", "tumors", "tumours", "types", "type", "other", "reported", "mixed", "unknown", "cell", "cells", "disease", "primary"]) {
    words.delete(generic);
  }
  _vocabulary.set(index, words);
  return words;
}

function mentionsSubject(query: string, index: IndexRow[]): boolean {
  const vocab = vocabulary(index);
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((w) => vocab.has(w));
}

export function routeIntent(rawQuery: string, index: IndexRow[] = getIndex()): Intent {
  const query = rawQuery.trim().slice(0, 600);
  const routes: RouteCard[] = [];
  let rest = query;

  for (const num of new Set(query.toUpperCase().match(AWARD) ?? [])) {
    routes.push({
      kind: "award",
      href: `/network?award=${encodeURIComponent(num)}`,
      label: `Funding to findings for ${num}`,
      detail: "The datasets this NCI award paid for and the articles that analysed them.",
    });
    rest = rest.replace(new RegExp(num, "gi"), " ");
  }

  const named = namedDatasets(query, index);
  if (named.length >= 2) {
    const ids = named.slice(0, 4).map((h) => h.row.id);
    routes.push({
      kind: "compare",
      href: `/compare?ids=${ids.join(",")}`,
      label: `Compare ${named
        .slice(0, 4)
        .map((h) => h.row.short_title ?? h.row.title)
        .join(", ")} side by side`,
      detail: "Only the rows where they differ, with the measurement unique to each starred.",
    });
  } else if (named.length === 1) {
    const { row } = named[0];
    routes.push({
      kind: "dataset",
      href: `/datasets/${row.id}`,
      label: row.title,
      detail: row.one_liner ?? "Can it answer your question, what it cannot tell you, who has used it, how to start.",
    });
  }
  for (const h of named) {
    rest = rest.replace(new RegExp(h.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
  }

  if (UNDEREXPLORED.test(query)) {
    routes.push({
      kind: "underexplored",
      href: "/underexplored",
      label: "Underexplored datasets",
      detail: "Where every dataset stands on reuse, and the ones reused far less than comparable datasets.",
    });
    rest = rest.replace(new RegExp(UNDEREXPLORED.source, "gi"), " ");
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
    rest = rest.replace(new RegExp(SOFTWARE.source, "gi"), " ");
  }

  // The shortlist runs unless the query is only a lookup - an award, a dataset name, a
  // how or why question, or a request for files - with no disease, site, measurement
  // or analysis need left over to search for. "Why is a dataset underexplored" is a
  // question about the method; "underexplored datasets" is a request for a shortlist.
  const isQuestion = METHOD_OPENER.test(query);
  const lookupOnly =
    routes.length > 0 && routes.every((r) => r.kind !== "underexplored" || isQuestion);
  const hasNeed = readNeeds(rest).length > 0;
  const hasSubject = mentionsSubject(rest, index);
  const shortlist = !lookupOnly || hasNeed || hasSubject;

  return { routes, shortlist };
}
