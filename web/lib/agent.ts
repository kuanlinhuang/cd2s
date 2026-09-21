import { z } from "zod";

import { getIndex, getRecord } from "@/lib/data";
import { fitVerdicts } from "@/lib/fit";
import { modalityLabel, num } from "@/lib/format";
import { type Need, readNeeds } from "@/lib/needs";
import { subjectsNamedIn } from "@/lib/subjects";
import type { IndexRow } from "@/lib/types";

// The need definitions live in lib/needs.ts so the browser can share them; the agent's
// public surface is unchanged.
export { NEED_KEYS, NEED_PHRASES, readNeeds } from "@/lib/needs";
export type { Need } from "@/lib/needs";

/**
 * The dataset agent.
 *
 * A researcher describes the analysis they want to run. The agent reads the request for
 * what it needs (a survival endpoint, recorded treatment response, imaging, and so on),
 * reads it for the subject it names, checks each record filed under that subject
 * against those needs, and returns a short ranked list with the reasons and the
 * blockers.
 *
 * The deterministic pass is the answer, not a first draft of one. Retrieval and the
 * capability checks always run, because "vital status is populated for every case and
 * informative for none" is a fact about the data that no language model should be asked
 * to guess. When they settle the request on their own, that answer is returned as it
 * stands and no model is called: a model given the same facts and the same bar can only
 * agree a round trip later.
 *
 * A language model (DeepSeek V4.1 Flash by default, through OpenRouter) runs on the
 * requests the rules cannot settle - see `resolvedByRules` for exactly which - where the
 * order among near-misses turns on which caveat matters most to the analysis described.
 * It ranks and rewrites the same shortlist and can never add to it. Without a key, or
 * when the call fails, those requests fall back to rule-based wording; `mode` says which
 * wrote the wording and `note` says why.
 *
 * THE CLAIM INVARIANT, which every part of this site obeys and which is written down
 * only here. Every function that produces a label, a verdict, a ranking or a link a
 * visitor will read takes an ABSOLUTE bar on a measured quantity, and has a NO-CLAIM
 * return that some real input reaches. Not a position in a sorted list, not a
 * comparison against whatever else this query happened to return, not the mere presence
 * of a field: a stated bar, applied to something measured, with "nothing here qualifies"
 * as an outcome the code can actually produce and a test actually pins. Ranking by
 * position makes the first row a recommendation however bad it is; scoring against the
 * best hit of the moment makes every query produce a perfect match; both are ways of
 * claiming something the data does not say. Here the bar is membership: the request
 * must name a subject in the exported vocabulary, and a record's repository-stated
 * controlled subject must contain it. The verdicts below, the router's name matching in lib/intent.ts and the
 * provenance anchors in lib/anchors.ts conform to this rather than restating it.
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
  pan_cancer_count: number;
}

// ------------------------------------------------------------------------------------
// retrieval
// ------------------------------------------------------------------------------------

type Scored = { row: IndexRow; score: number; met: Need[]; failed: Need[]; unknown: Need[] };

/**
 * The candidates worth ranking.
 *
 * A dataset is ranked only when the request names a subject the corpus holds and the
 * record is filed under it. That membership is the absolute bar this module applies
 * before it labels anything: it is a fact about the record, not a score relative to
 * whatever else the query happened to return, and a request naming no such subject - a
 * question about the method, a request for the files, a bare award number, a request
 * stated only as capabilities - reaches no record at all and is answered by the route
 * cards beside the shortlist and by the honest sentence in `answer`.
 *
 * The needs read from the wording then decide the order and the verdict among records
 * that are equally on the subject; they cannot admit one on their own, because
 * "survival" is a word a question about the method uses as readily as a request for
 * data. Ordering below that runs on measured facts - a reviewed showcase record, then
 * reviewed research questions, then cohort size - and never on the strength of a word.
 */
function shortlist(query: string, k: number): { needs: Need[]; scored: Scored[] } {
  const needs = readNeeds(query);
  const named = subjectsNamedIn(query);
  if (named.size === 0) return { needs, scored: [] };
  const scored: Scored[] = getIndex()
    .filter(
      (row) =>
        (row.subject_scope === "single" || row.subject_scope === "several") &&
        row.subjects.some((subject) => named.has(subject)),
    )
    .map((row) => {
      const met: Need[] = [];
      const failed: Need[] = [];
      const unknown: Need[] = [];
      for (const n of needs) {
        const v = n.check(row);
        if (v === true) met.push(n);
        else if (v === false) failed.push(n);
        else unknown.push(n);
      }
      let score = met.length * 1.5 - failed.length * 2 - unknown.length * 0.4;
      if (row.is_showcase) score += 0.4;
      if (row.n_research_questions > 0) score += 0.2;
      score += Math.min((row.n_cases ?? row.n_samples ?? 0) / 1000, 1) * 0.3;
      return { row, score, met, failed, unknown };
    });
  scored.sort((a, b) => b.score - a.score);
  return { needs, scored: scored.slice(0, k) };
}

/**
 * What the card claims about a candidate.
 *
 * "Start here" is a recommendation, so it takes more than leading the list: every need
 * the request stated must be measured for this record and met by it. A need the record
 * fails makes it "check first"; a need nobody has measured for it leaves it "good fit",
 * because the page cannot recommend a dataset on a field that was never read. When no
 * candidate clears that bar the shortlist still shows what it found and no row claims
 * to be the place to start.
 */
function verdictFor(s: Scored, rank: number): Verdict {
  if (s.failed.length > 0) return "caution";
  return rank === 0 && clearsBar(s) ? "best" : "good";
}

/**
 * Whether a candidate clears the absolute bar: every need read from the request is
 * measured for this record and met by it.
 *
 * The verdicts, the decision to call a model and the note explaining a rules answer all
 * read this one predicate, so that "the rules settled it" and "the card says Start here"
 * cannot drift apart as the scoring weights are tuned. It is a fact about the record and
 * the request - never a position in the sorted list, and never a display string parsed
 * back out of a function that exists to label a card.
 */
function clearsBar(s: Scored): boolean {
  return s.failed.length === 0 && s.unknown.length === 0;
}

const VERDICT_STRENGTH: Record<Verdict, number> = { caution: 0, good: 1, best: 2 };

/**
 * The verdict a model-written card is allowed to carry.
 *
 * A model may agree with the measured verdict or weaken it; it may never strengthen it.
 * The claim invariant says the code enforces what a visitor reads, so the prompt asking
 * the model not to over-claim is a courtesy and this is the guarantee. It matters most
 * on exactly the requests the model now sees: every one of them has a candidate that
 * fails or lacks a stated need, and "good fit" on a dataset that fails one is the claim
 * this whole module exists to refuse.
 */
function clampVerdict(claimed: Verdict, measured: Verdict): Verdict {
  return VERDICT_STRENGTH[claimed] > VERDICT_STRENGTH[measured] ? measured : claimed;
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
  const verdict = verdictFor(s, rank);
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
/** The default the docs quote. Exported so a page can name it without resolving the override. */
export const AGENT_DEFAULT_MODEL = "deepseek/deepseek-v4.1-flash";

/**
 * How long the model gets before the rules answer instead.
 *
 * Deliberately shorter than the route's `maxDuration`: the point of the deadline is
 * that a slow model degrades to the deterministic shortlist, and that only happens if
 * the function is still alive to write it. At 60s - the whole budget - the platform
 * reached its own limit first and the visitor got a 504 rather than the fallback.
 */
export const AGENT_MODEL_TIMEOUT_MS = 45_000;

export function agentModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || AGENT_DEFAULT_MODEL;
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
- Constraints come first. A dataset that fails a need the analysis depends on cannot be "good"; mark it "caution" and say why, or leave it out.
- No dataset in this list meets every need the researcher stated - that is the only reason you are being asked. Never mark one "best", and never open with an unqualified recommendation. Say first what nothing here can do, then which comes closest and what that costs.
- Order the near-misses by which unmet need matters least to the analysis described, then by cohort size.
- Rank at most four, closest first.
- Write for a researcher: short, concrete sentences, no marketing.
- In prose, name datasets by their title, never by their id. Use ids only in the "id" field.
- Keep the whole response under 250 words.

Respond with JSON only, matching exactly:
{"summary": "two or three plain sentences: what no dataset here can do, which one comes closest and why, and what that choice costs",
 "picks": [{"id": "dataset id exactly as given", "verdict": "good" | "caution",
            "why": ["two to four short reasons, each grounded in a stated fact"],
            "watch_out": ["zero to three short blockers or caveats, each grounded in a stated fact"]}]}`;

async function rankWithModel(
  key: string,
  query: string,
  needs: Need[],
  shortlisted: Scored[],
): Promise<z.infer<typeof RankSchema> | null> {
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
  const timer = setTimeout(() => controller.abort(), AGENT_MODEL_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://cd2s.local",
        "X-Title": "CD2S",
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

/**
 * The opening sentence of a reviewer's statement, for the one-paragraph lede.
 *
 * A blocking limitation is written to be read in full, and the card below the summary
 * carries it in full. In the lede it is one clause among three, so quoting all of it -
 * they run to 345 characters - pushes the shortlist off the screen that the sentence
 * exists to introduce. The lookahead keeps "0.3% of cases" in one piece.
 */
function firstSentence(text: string): string {
  return text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
}

/** A clause as a sentence: capitalised, ending in exactly one full stop. */
function sentence(clause: string): string {
  const t = clause.trim().replace(/\.+$/, "");
  return t ? t[0].toUpperCase() + t.slice(1) + "." : "";
}

/**
 * Whether the deterministic pass answered the request on its own.
 *
 * It did when the leading candidate clears the absolute bar this module states: every
 * need read from the request is measured for that record and met by it, which is
 * exactly the condition `clearsBar` states. That answer names a place to start
 * on measured facts alone, and a model handed the same facts and the same bar has
 * nothing left to decide - it can only restate the answer, seconds later and through a
 * network call that may fail.
 *
 * It did not when candidates exist and none clears the bar. The order among near-misses
 * then turns on which failed need or unmeasured field matters most to the analysis this
 * researcher described, and that is a judgement about their words rather than a fact
 * about the data. It is the one thing here a model is better at, so it is the only thing
 * it is asked.
 *
 * A request naming no subject in the vocabulary reaches no candidate at all, and that is
 * not an unresolved request but a resolved empty one. Handing an empty shortlist to a
 * model could only invite it to invent the dataset the corpus does not hold, so that
 * case never calls one either.
 */
function resolvedByRules(scored: Scored[]): boolean {
  return scored.length === 0 || clearsBar(scored[0]);
}

/**
 * What a rules answer says about its own wording, for a caller reading the JSON.
 *
 * `mode` already says a model did not write it. The note says why, and only where the
 * answer to that changes what an identical second call would return: a model that was
 * asked and could not answer, or none configured for the requests that want one. When
 * nothing was ranked there is nothing to explain.
 */
function rulesNote(hasCandidates: boolean, keyed: boolean, resolved: boolean): string | null {
  if (!hasCandidates) return null;
  if (resolved) {
    // Said whether or not a key exists, because a key would not have changed this
    // answer. The keyless form still names the variable, since a self-hoster reading
    // this field is the one person who would otherwise never learn it exists.
    const settled = "Ranked by rules: the deterministic ranking settled this request, so no model was called.";
    return keyed
      ? settled
      : `${settled} Setting OPENROUTER_API_KEY would not change it; a model is asked only about requests the rules cannot settle.`;
  }
  if (!keyed) {
    return "Ranked by rules. Set OPENROUTER_API_KEY on the server to have a language model rank and explain the requests the rules cannot settle.";
  }
  // Reached only after a model was asked and gave back nothing usable. That covers a
  // refused or timed-out call and a well-formed answer naming datasets the shortlist
  // does not hold, which look identical from here and are equally not the model's work.
  return "Ranked by rules this time because the model did not return a usable answer.";
}

export async function answer(rawQuery: string): Promise<AgentAnswer> {
  const query = rawQuery.trim().slice(0, 600);
  const { needs, scored } = shortlist(query, 6);
  const needLabels = needs.map((n) => n.label);
  const byId = new Map(scored.map((s) => [s.row.id, s]));
  const panCancerCount = getIndex().filter((row) => row.subject_scope === "pan_cancer").length;

  const key = process.env.OPENROUTER_API_KEY?.trim();
  const resolved = resolvedByRules(scored);

  if (!resolved && key) {
    try {
      const ranked = await rankWithModel(key, query, needs, scored);
      if (ranked) {
        const seen = new Set<string>();
        const picks: AgentPick[] = [];
        for (const p of ranked.picks) {
          const s = byId.get(p.id);
          if (!s || seen.has(p.id)) continue;
          seen.add(p.id);
          const claimed = clampVerdict(p.verdict, verdictFor(s, 0));
          picks.push({ ...rulesPick(s, 1), verdict: claimed, why: p.why, watch_out: p.watch_out });
        }
        if (picks.length > 0) {
          return {
            query,
            mode: "llm",
            model: agentModel(),
            note: null,
            needs: needLabels,
            summary: ranked.summary,
            picks,
            pan_cancer_count: panCancerCount,
          };
        }
      }
    } catch (err) {
      console.error("dataset agent: model ranking failed, using rules", err);
    }
  }

  const top = scored.slice(0, 4);
  const picks = top.map((s, i) => rulesPick(s, i));
  const best = picks.find((p) => p.verdict === "best");
  const summary =
    picks.length === 0
      ? "Nothing in the corpus matches that description. Try naming the cancer type or the tissue you are studying."
      : best
        ? `Start with ${best.title}. ${best.why[0] ? sentence(best.why[0]) : ""}${
            best.watch_out[0] ? ` Check first: ${sentence(firstSentence(best.watch_out[0]))}` : ""
          }`
        : `Nothing here is a clear place to start. ${picks[0].title} is the closest; ${picks[0].watch_out[0] ?? "read its limitations"}.`;
  return {
    query,
    mode: "rules",
    model: null,
    note: rulesNote(scored.length > 0, Boolean(key), resolved),
    needs: needLabels,
    summary,
    picks,
    pan_cancer_count: panCancerCount,
  };
}
