import { afterAll, describe, expect, it, vi } from "vitest";

import { answer } from "@/lib/agent";
import { getIndex } from "@/lib/data";
import { routeIntent, showsShortlist } from "@/lib/intent";

/**
 * What the agent answers, against the shipped corpus in public/data.
 *
 * These cases pin the claim invariant stated in lib/agent.ts: a record is ranked only
 * when the request names a complete cancer type or primary site the corpus files
 * records under - never a word taken out of one, so "a large open cohort" names no
 * subject and reaches nothing - and there is a no-claim answer that real questions
 * reach. Both sides are pinned here: the questions that must produce nothing, the
 * requests whose subject is wrapped in filler words and must still produce their
 * cohorts, and the verdict "Start here", withheld when a need the request stated was
 * never measured for the record.
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
    "banana bread recipe",
    "I need a large open cohort with survival data",
    "what is a normal control",
    "high grade tumors with early onset",
    "show me multiple datasets like this one",
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
    "diffuse large B-cell lymphoma",
    "neuroblastoma kids first",
    "melanoma checkpoint blockade trial cohorts",
    "glioblastoma dataset please",
  ])("finds the subject inside the wording of %j", async (q) => {
    const a = await answer(q);
    expect(a.picks.length).toBeGreaterThan(0);
  });

  it("keeps the subject the filler words surround", async () => {
    const bare = await answer("neuroblastoma");
    const padded = await answer("neuroblastoma kids first");
    expect(padded.picks.map((p) => p.id)).toEqual(expect.arrayContaining(bare.picks.map((p) => p.id)));
  });

  it.each([
    ["Survival analysis in a cervical cancer cohort from sub-Saharan Africa", /cervi/i],
    ["melanoma checkpoint blockade trial cohorts", /melanom/i],
  ])("ranks only records the corpus files under the subject named in %j", async (q, subject) => {
    const a = await answer(q);
    expect(a.picks.length).toBeGreaterThan(0);
    for (const p of a.picks) {
      const row = getIndex().find((r) => r.id === p.id)!;
      expect([...row.cancer_types, ...row.primary_sites].some((v) => subject.test(v))).toBe(true);
    }
  });

  it("leads with the subject, not with a record carrying one generic word of the request", async () => {
    const a = await answer("Pair radiology images with RNA sequencing in lung adenocarcinoma");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(`${a.picks[0].title} ${a.picks[0].short_title ?? ""}`).toMatch(/lung|luad/i);
  });

  /**
   * FAILS TODAY. The corpus files these diseases under category names - "Mesothelial
   * Neoplasms", "Mesothelium", "Paragangliomas and Glomus Tumors" - and whole-subject
   * matching cannot reach them from the word a researcher types. Left failing on
   * purpose: the branch is parked until the corpus carries one subject per record.
   */
  it("finds the disease the corpus files under an ICD-O category", async () => {
    for (const q of ["mesothelioma survival", "pheochromocytoma"]) {
      const a = await answer(q);
      expect(a.picks.length).toBeGreaterThan(0);
    }
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

  it("claims no place to start when a stated need was never measured for the record", async () => {
    const a = await answer("neuroblastoma in a diverse population");
    expect(a.needs).toContain("a diverse or non-US population");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(a.picks.some((p) => p.verdict === "best")).toBe(false);
    expect(a.summary).toMatch(/nothing here is a clear place to start/i);
  });

  it("claims no place to start when the leading candidate fails a stated need", async () => {
    const a = await answer("Ovary with proteomics, methylation, single-cell and radiology imaging");
    expect(a.picks.some((p) => p.verdict === "best")).toBe(false);
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
