import { describe, expect, it } from "vitest";

import { answer } from "@/lib/agent";

/**
 * What the agent answers, against the shipped corpus in public/data.
 *
 * The shortlist runs for every question now that the router offers its destinations
 * alongside it, so a question the corpus cannot answer must say so rather than name a
 * confident "start here" dataset. Retrieval alone cannot make that call: it scores a
 * query against its own best hit, so any wording produces a perfect relative match.
 */

describe("a question no dataset can answer", () => {
  it.each([
    "how is reuse measured",
    "bulk download JSON",
    "R01CA097096",
    "where does the evidence come from",
  ])("returns no picks for %j", async (q) => {
    const a = await answer(q);
    expect(a.picks).toEqual([]);
    expect(a.summary).toMatch(/nothing in the corpus matches/i);
  });
});

describe("a question the corpus can answer", () => {
  it("ranks datasets when the request names a disease", async () => {
    const a = await answer("glioblastoma");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(a.picks.some((p) => p.verdict === "best")).toBe(true);
  });

  it("ranks datasets when the request states a need without naming a disease", async () => {
    const a = await answer("an open cohort with treatment response recorded");
    expect(a.picks.length).toBeGreaterThan(0);
  });
});
