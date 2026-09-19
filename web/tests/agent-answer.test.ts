import { afterAll, describe, expect, it, vi } from "vitest";

import { answer } from "@/lib/agent";
import { routeIntent } from "@/lib/intent";

/**
 * What the agent answers, against the shipped corpus in public/data.
 *
 * The shortlist runs for every question now that the router offers its destinations
 * alongside it, so a question the corpus cannot answer must say so rather than name a
 * confident "start here" dataset. Relative relevance cannot make that call: it scores a
 * query against its own best hit, so any wording produces a perfect match. A record is
 * ranked only when its own absolute relevance clears the floor, and these cases pin
 * both sides of that floor.
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

  it("applies the needs stated alongside the subject", async () => {
    const a = await answer("lung adenocarcinoma with RNA sequencing");
    expect(a.needs).toContain("transcriptomics");
    expect(a.picks.length).toBeGreaterThan(0);
    const met = a.picks.filter((p) => p.why.some((w) => /RNA sequencing is available/.test(w)));
    expect(met.length).toBeGreaterThan(0);
  });

  it("never returns the same dataset twice", async () => {
    const a = await answer("acute myeloid leukemia");
    expect(new Set(a.picks.map((p) => p.id)).size).toBe(a.picks.length);
  });
});

/**
 * The answer page prints the shortlist beneath the router's cards. A question that
 * names a dataset must never get both a card for it and a sentence denying that
 * anything matched, so wherever the shortlist is empty the router has a destination
 * and AskAnswer renders nothing.
 */
describe("the shortlist and the router cannot disagree", () => {
  it.each(["TCGA-BRCA", "compare TCGA-BRCA and TCGA-GBM", "what did award P30CA008748 pay for"])(
    "offers a route for %j whenever the shortlist denies a match",
    async (q) => {
      const a = await answer(q);
      if (a.picks.length > 0) return;
      expect(routeIntent(q).routes.length).toBeGreaterThan(0);
    },
  );
});
