import { afterAll, describe, expect, it, vi } from "vitest";

import { answer } from "@/lib/agent";
import { routeIntent, showsShortlist } from "@/lib/intent";

/**
 * What the agent answers, against the shipped corpus in public/data.
 *
 * The shortlist runs for every question now that the router offers its destinations
 * alongside it, so a question the corpus cannot answer must say so rather than name a
 * confident "start here" dataset. Relative relevance cannot make that call: it scores a
 * query against its own best hit, so any wording produces a perfect match. A record is
 * ranked only when one word of the request matches it strongly in absolute terms, and
 * these cases pin both sides of that floor - including requests that carry filler or
 * qualifier words around the subject, which a measure read over the whole topic would
 * dilute below it.
 *
 * The model path is an enhancement over the same shortlist; the rules path is the
 * guaranteed one, so the key is stubbed away and every assertion here is deterministic.
 */

vi.stubEnv("OPENROUTER_API_KEY", "");
afterAll(() => vi.unstubAllEnvs());

describe("a question no dataset can answer", () => {
  it.each([
    "how is reuse measured",
    "how is survival measured",
    "how is treatment response recorded",
    "bulk download JSON",
    "R01CA097096",
    "where does the evidence come from",
    "an open cohort with treatment response recorded",
  ])("returns no picks for %j", async (q) => {
    const a = await answer(q);
    expect(a.picks).toEqual([]);
    expect(a.summary).toMatch(/nothing in the corpus matches/i);
  });

  it("still reads the needs it recognises, so the page can offer them as filters", async () => {
    const a = await answer("how is survival measured");
    expect(a.needs).toContain("a survival endpoint");
  });
});

describe("a question the corpus can answer", () => {
  it.each(["glioblastoma", "lung adenocarcinoma", "neuroblastoma", "acute myeloid leukemia"])(
    "ranks datasets for %j",
    async (q) => {
      const a = await answer(q);
      expect(a.picks.length).toBeGreaterThan(0);
      expect(a.picks.some((p) => p.verdict === "best")).toBe(true);
    },
  );

  it.each([
    "neuroblastoma kids first",
    "melanoma checkpoint blockade trial cohorts",
    "glioblastoma dataset please",
    "Phosphoproteomics and outcomes in gastric cancer, open access only",
  ])("is not diluted by the words around the subject in %j", async (q) => {
    const a = await answer(q);
    expect(a.picks.length).toBeGreaterThan(0);
  });

  it("keeps the subject the filler words surround", async () => {
    const bare = await answer("neuroblastoma");
    const padded = await answer("neuroblastoma kids first");
    expect(padded.picks.map((p) => p.id)).toEqual(expect.arrayContaining(bare.picks.map((p) => p.id)));
  });

  it("leads with the subject, not with a record carrying one generic word of the request", async () => {
    const a = await answer("Pair radiology images with RNA sequencing in lung adenocarcinoma");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(`${a.picks[0].title} ${a.picks[0].short_title ?? ""}`).toMatch(/lung|luad/i);
  });

  it("applies the needs stated alongside the subject", async () => {
    const a = await answer("lung adenocarcinoma with RNA sequencing");
    expect(a.needs).toContain("transcriptomics");
    expect(a.picks.length).toBeGreaterThan(0);
    const met = a.picks.filter((p) => p.why.some((w) => /RNA sequencing is available/.test(w)));
    expect(met.length).toBeGreaterThan(0);
  });

  it("names what a candidate fails rather than denying that the subject exists", async () => {
    const a = await answer("Ovary with proteomics, methylation, single-cell and radiology imaging");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(a.summary).not.toMatch(/nothing in the corpus matches/i);
    expect(a.picks.every((p) => p.watch_out.length > 0)).toBe(true);
  });

  it("never returns the same dataset twice", async () => {
    const a = await answer("acute myeloid leukemia");
    expect(new Set(a.picks.map((p) => p.id)).size).toBe(a.picks.length);
  });
});

/**
 * The answer page prints the shortlist beneath the router's cards, and `showsShortlist`
 * is the condition it renders on. A question that names a dataset must never get both a
 * card for it and a sentence denying that anything matched.
 */
describe("the shortlist and the router cannot disagree", () => {
  it("says nothing when nothing matched and the router already offered a destination", () => {
    expect(showsShortlist(0, true)).toBe(false);
  });

  it("says nothing matched when there is nowhere else to go", () => {
    expect(showsShortlist(0, false)).toBe(true);
  });

  it("renders its picks whether or not the question was routed", () => {
    expect(showsShortlist(3, true)).toBe(true);
    expect(showsShortlist(3, false)).toBe(true);
  });

  it.each(["how is reuse measured", "bulk download JSON", "R01CA097096"])(
    "leaves %j to its route card alone",
    async (q) => {
      const a = await answer(q);
      expect(showsShortlist(a.picks.length, routeIntent(q).routes.length > 0)).toBe(false);
    },
  );
});
