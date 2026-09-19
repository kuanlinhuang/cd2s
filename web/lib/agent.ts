import MiniSearch from "minisearch";
import { z } from "zod";

import { getIndex, getRecord } from "@/lib/data";
import { fitVerdicts } from "@/lib/fit";
import { modalityLabel, num } from "@/lib/format";
import type { IndexRow } from "@/lib/types";

/**
 * The dataset agent.
 *
 * A researcher describes the analysis they want to run. The agent reads the request for
 * what it needs (a survival endpoint, recorded treatment response, imaging, and so on),
 * searches the corpus, checks each candidate's measured capabilities against those
 * needs, and returns a short ranked list with the reasons and the blockers.
 *
 * Two stages. Retrieval and the capability checks are deterministic and always run,
 * because "vital status is populated for every case and informative for none" is a
 * fact about the data that no language model should be asked to guess. When an
 * OpenRouter API key is configured, a language model (DeepSeek V4 Flash by default)
 * then ranks the shortlist and writes the explanation in the researcher's own terms.
 * Without a key, the same shortlist is returned with rule-based explanations, and the
 * response says so.
 */

export type Verdict = "best" | "good" | "caution";

export interface AgentPick {
  id: string;
  title: string;
  short_title: string | null;
  verdict: Verdict;
  why: string[];
  watch_out: string[];
  n_cases: number | null;
  modalities: string[];
  access_tier: string;
  is_underexplored: boolean;
  n_research_questions: number;
}

export interface AgentAnswer {
  query: string;
  mode: "llm" | "rules";
  /** The model that ranked the shortlist, when one did. */
  model: string | null;
  note: string | null;
  needs: string[];
  summary: string;
  picks: AgentPick[];
}

// ------------------------------------------------------------------------------------
// what the request needs
// ------------------------------------------------------------------------------------

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
];

// ------------------------------------------------------------------------------------
// retrieval
// ------------------------------------------------------------------------------------

type Doc = { id: string; title: string; short: string; text: string };
let _search: MiniSearch<Doc> | null = null;

function search(): MiniSearch<Doc> {
  if (_search) return _search;
  const ms = new MiniSearch<Doc>({
    fields: ["title", "short", "text"],
    storeFields: ["id"],
    idField: "id",
    searchOptions: { boost: { title: 3, short: 2 }, prefix: true, fuzzy: 0.15 },
  });
  ms.addAll(
    getIndex().map((r) => ({
      id: r.id,
      title: r.title,
      short: r.short_title ?? "",
      text: [r.summary ?? "", r.cancer_types.join(" "), r.primary_sites.join(" "), r.search_text ?? ""].join(" "),
    })),
  );
  _search = ms;
  return ms;
}

type Scored = { row: IndexRow; score: number; met: Need[]; failed: Need[]; unknown: Need[] };

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

function shortlist(query: string, k: number): { needs: Need[]; scored: Scored[] } {
  const needs = readNeeds(query);
  const index = getIndex();
  const hits = new Map<string, number>();
  let max = 0;
  const topic = topicOf(query, needs);
  if (topic) {
    for (const h of search().search(topic)) {
      hits.set(h.id as string, h.score);
      max = Math.max(max, h.score);
    }
  }
  const scored: Scored[] = index.map((row) => {
    const text = max > 0 ? (hits.get(row.id) ?? 0) / max : 0;
    const met: Need[] = [];
    const failed: Need[] = [];
    const unknown: Need[] = [];
    for (const n of needs) {
      const v = n.check(row);
      if (v === true) met.push(n);
      else if (v === false) failed.push(n);
      else unknown.push(n);
    }
    // Topic relevance is weighted above any single capability, because a researcher who
    // names a disease is not negotiating about it: a gastric cohort meeting two of three
    // needs should outrank a leukaemia cohort meeting three. It is never decisive on its
    // own - failing a stated need still costs more than the best possible text match.
    let score = text * 3.5 + met.length * 1.5 - failed.length * 2 - unknown.length * 0.4;
    if (row.is_showcase) score += 0.4;
    if (row.n_research_questions > 0) score += 0.2;
    if (row.n_cases && row.n_cases >= 200) score += 0.2;
    // A dataset that matched nothing in the text and satisfies no need is noise.
    if (text === 0 && met.length === 0) score -= 5;
    return { row, score, met, failed, unknown };
  });
  scored.sort((a, b) => b.score - a.score);
  return { needs, scored: scored.slice(0, k) };
}

function rulesPick(s: Scored, rank: number): AgentPick {
  const r = s.row;
  const rec = getRecord(r.id);
  const blocking = (rec?.limitations ?? []).filter((l) => l.severity === "blocking").slice(0, 2);
  const why: string[] = [];
  for (const n of s.met) why.push(n.fit);
  const descr = [
    r.n_cases ? `${num(r.n_cases)} cases` : r.n_samples ? `${num(r.n_samples)} samples` : null,
    `${r.n_modalities} measurement type${r.n_modalities === 1 ? "" : "s"}`,
    r.median_followup_months ? `median follow-up ${(r.median_followup_months / 12).toFixed(1)} years` : null,
  ].filter(Boolean);
  if (descr.length) why.push(descr.join(", "));
  if (r.n_research_questions > 0) why.push(`${r.n_research_questions} reviewed research questions on its page`);
  const watch: string[] = [];
  for (const n of s.failed) watch.push(n.fail);
  for (const n of s.unknown) watch.push(`whether it has ${n.label} has not been measured for this record`);
  for (const l of blocking) watch.push(l.statement);
  if (r.access_tier !== "open") watch.push("some or all files need an approved access request");
  if (r.has_citable_accession === false) watch.push("no citable accession, so prior reuse cannot be traced");
  // A reviewer's blocking limitation is surfaced under "check first" but does not by
  // itself demote a dataset that meets every stated need: it is why the page exists.
  const verdict: Verdict = s.failed.length > 0 ? "caution" : rank === 0 ? "best" : "good";
  return {
    id: r.id,
    title: r.title,
    short_title: r.short_title ?? null,
    verdict,
    why,
    watch_out: watch,
    n_cases: r.n_cases ?? r.n_samples ?? null,
    modalities: r.modalities,
    access_tier: r.access_tier,
    is_underexplored: r.is_underexplored,
    n_research_questions: r.n_research_questions,
  };
}

// ------------------------------------------------------------------------------------
// a language model ranks the shortlist, through OpenRouter
// ------------------------------------------------------------------------------------

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

export function agentModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

const RankSchema = z.object({
  summary: z.string(),
  picks: z
    .array(
      z.object({
        id: z.string(),
        verdict: z.enum(["best", "good", "caution"]),
        why: z.array(z.string()).max(4),
        watch_out: z.array(z.string()).max(3),
      }),
    )
    .min(1)
    .max(4),
});

const SYSTEM = `You help cancer researchers choose an NCI-supported dataset for an analysis they describe.

You are given a shortlist of candidate datasets with measured facts: cohort size, measurement types, whether a survival endpoint can be derived, whether treatment response is recorded, access tier, population notes, blocking limitations written by a reviewer, six analysis verdicts measured from clinical field completeness (supported, limited, blocked, or unknown when not measured), and which of the researcher's needs each dataset meets or fails.

Rules:
- Use only the facts provided. Do not invent fields, counts or capabilities.
- An analysis verdict of "unknown" means the field was not measured for that record. Say so; never present it as absent.
- Constraints come first. A dataset that fails a need the analysis depends on cannot be "best" or "good"; mark it "caution" and say why, or leave it out.
- Prefer datasets that meet every stated need, then larger cohorts, then ones with reviewed research questions.
- Rank at most four. Put the strongest first and mark exactly one "best" unless nothing qualifies.
- Write for a researcher: short, concrete sentences, no marketing.
- In prose, name datasets by their title, never by their id. Use ids only in the "id" field.
- Keep the whole response under 250 words.

Respond with JSON only, matching exactly:
{"summary": "two or three plain sentences: which dataset to start with and why, and the main thing that could block them",
 "picks": [{"id": "dataset id exactly as given", "verdict": "best" | "good" | "caution",
            "why": ["two to four short reasons, each grounded in a stated fact"],
            "watch_out": ["zero to three short blockers or caveats, each grounded in a stated fact"]}]}`;

async function rankWithModel(
  query: string,
  needs: Need[],
  shortlisted: Scored[],
): Promise<z.infer<typeof RankSchema> | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const cards = shortlisted.map((s) => {
    const r = s.row;
    const rec = getRecord(r.id);
    return {
      id: r.id,
      title: r.title,
      cases: r.n_cases ?? r.n_samples ?? null,
      one_liner: r.one_liner ?? r.summary?.slice(0, 240) ?? null,
      measurement_types: r.modalities.map(modalityLabel),
      survival_endpoint_derivable: r.has_survival_endpoint ?? "not measured",
      treatment_response_recorded: r.has_treatment_response ?? "not measured",
      median_followup_months: r.median_followup_months ?? null,
      access: r.access_tier,
      population_notes: r.population_flags,
      underexplored: r.is_underexplored,
      reviewed_research_questions: r.n_research_questions,
      blocking_limitations: (rec?.limitations ?? []).filter((l) => l.severity === "blocking").map((l) => l.statement),
      // Six analysis verdicts measured from field completeness. "unknown" means not
      // measured for this record and must not be read as "no".
      analysis_fit: rec ? fitVerdicts(rec).map((v) => `${v.label}: ${v.status} (${v.reason})`) : [],
      needs_met: s.met.map((n) => n.label),
      needs_failed: s.failed.map((n) => n.label),
      needs_unknown: s.unknown.map((n) => n.label),
    };
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://cancer-data-showcase.local",
        "X-Title": "Cancer Data Showcase",
      },
      body: JSON.stringify({
        model: agentModel(),
        temperature: 0.2,
        // Reasoning tokens count against this budget on DeepSeek, so it is generous; the
        // prompt itself caps the visible answer at 250 words.
        max_tokens: 6000,
        // The shortlist is small and the facts are given; deep reasoning only adds latency.
        reasoning: { effort: "low" },
        // Several providers serve this model; latency varies widely between them.
        provider: { sort: "latency" },
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `The researcher wants to: ${query}\n\n` +
              `Needs read from the request: ${needs.length ? needs.map((n) => n.label).join("; ") : "none stated explicitly"}\n\n` +
              `Candidates (JSON):\n${JSON.stringify(cards)}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("dataset agent: OpenRouter returned", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string | null }; finish_reason?: string }[];
    };
    const choice = body.choices?.[0];
    const content = choice?.message?.content;
    if (!content) {
      console.error("dataset agent: model returned no content", choice?.finish_reason ?? "no choices");
      return null;
    }
    // Some models wrap JSON in a code fence despite json_object mode.
    const text = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("dataset agent: model output was not valid JSON", choice?.finish_reason, text.length, "chars");
      return null;
    }
    const parsed = RankSchema.safeParse(json);
    if (!parsed.success) {
      console.error("dataset agent: model output did not match the schema", parsed.error.issues.slice(0, 3));
      return null;
    }
    return parsed.data;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------------------------
// entry point
// ------------------------------------------------------------------------------------

export async function answer(rawQuery: string): Promise<AgentAnswer> {
  const query = rawQuery.trim().slice(0, 600);
  const { needs, scored } = shortlist(query, 6);
  const needLabels = needs.map((n) => n.label);
  const byId = new Map(scored.map((s) => [s.row.id, s]));

  if (process.env.OPENROUTER_API_KEY && scored.length > 0) {
    try {
      const ranked = await rankWithModel(query, needs, scored);
      if (ranked) {
        const picks = ranked.picks
          .filter((p) => byId.has(p.id))
          .map((p) => ({ ...rulesPick(byId.get(p.id)!, 1), verdict: p.verdict, why: p.why, watch_out: p.watch_out }));
        if (picks.length > 0) {
          return { query, mode: "llm", model: agentModel(), note: null, needs: needLabels, summary: ranked.summary, picks };
        }
      }
    } catch (err) {
      console.error("dataset agent: model ranking failed, using rules", err);
    }
  }

  const top = scored.filter((s) => s.score > -3).slice(0, 4);
  const picks = top.map((s, i) => rulesPick(s, i));
  const best = picks.find((p) => p.verdict === "best");
  const summary =
    picks.length === 0
      ? "Nothing in the corpus matches that description. Try naming the cancer type or the measurement you need."
      : best
        ? `Start with ${best.title}. ${best.why[0] ? best.why[0][0].toUpperCase() + best.why[0].slice(1) + "." : ""}${
            best.watch_out[0] ? ` Check first: ${best.watch_out[0]}.` : ""
          }`
        : `No dataset meets every need as stated. ${picks[0].title} is the closest; ${picks[0].watch_out[0] ?? "read its limitations"}.`;
  return {
    query,
    mode: "rules",
    model: null,
    note: process.env.OPENROUTER_API_KEY
      ? "Ranked by rules this time because the model call failed."
      : "Ranked by rules. Set OPENROUTER_API_KEY on the server to have a language model rank and explain the shortlist.",
    needs: needLabels,
    summary,
    picks,
  };
}
