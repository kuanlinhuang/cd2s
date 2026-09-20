import { describe, expect, it } from "vitest";

import { analyzedArticles, analyzedReuse } from "@/lib/reuse";
import type { DatasetRecord, ReuseMetrics, ReuseRecord } from "@/lib/types";

import { record } from "./factories";

/**
 * The dataset page's "Who has used it" numbers.
 *
 * Two passes both speak of articles that analyzed the data: a comparable, section-scoped
 * count and a list of individually graded articles. Either can be the larger, and the
 * page has to tell a reader which situation it is in rather than print a count that its
 * own list contradicts.
 */

const metrics = (over: Partial<ReuseMetrics>): ReuseMetrics =>
  ({
    n_candidates_screened: 0,
    n_by_tier: {},
    n_reuse_examined: 0,
    n_independent_reuse: 0,
    evidence: [],
    ...over,
  }) as unknown as ReuseMetrics;

const article = (tier: string): ReuseRecord =>
  ({
    publication: { title: "An article", evidence: [] },
    tier,
    kind: "secondary_analysis",
    independent_of_generators: null,
    evidence: [],
  }) as unknown as ReuseRecord;

const dataset = (m: Partial<ReuseMetrics>, reuse: ReuseRecord[]): DatasetRecord =>
  record({ reuse_metrics: metrics(m), reuse } as Partial<DatasetRecord>);

describe("which articles count as having analyzed the data", () => {
  it("counts confirmed reuse alongside graded analysis, and nothing weaker", () => {
    const reuse = [
      article("t3_analyzed"),
      article("t4_confirmed"),
      article("t2_declared"),
      article("t0_mention"),
    ];
    expect(analyzedArticles(reuse).map((x) => x.tier)).toEqual([
      "t3_analyzed",
      "t4_confirmed",
    ]);
  });
});

describe("the headline count against the list beneath it", () => {
  it("flags a count its own list contradicts", () => {
    // gdc-mp2prt-all: the index counted METHODS:"phs002005" and found nothing, while six
    // articles naming MP2PRT-ALL were read and graded as analyzing the data.
    const r = dataset(
      { n_by_tier: { t3_analyzed: 0, t2_declared: 1 }, n_verified_reuse: 0, n_reuse_examined: 6 },
      Array.from({ length: 6 }, () => article("t3_analyzed")),
    );
    expect(analyzedReuse(r)).toEqual({
      counted: 0,
      listed: 6,
      listIsPartial: false,
      listExceedsCount: true,
    });
  });

  it("calls the list partial when the count is the larger number", () => {
    const r = dataset(
      { n_by_tier: { t3_analyzed: 2463 }, n_verified_reuse: 2463, n_reuse_examined: 40 },
      Array.from({ length: 10 }, () => article("t3_analyzed")),
    );
    expect(analyzedReuse(r)).toMatchObject({
      counted: 2463,
      listed: 10,
      listIsPartial: true,
      listExceedsCount: false,
    });
  });

  it("never claims an undercount when nothing was counted", () => {
    // An absent tier means the correction could not be estimated. Comparing a list
    // against that would manufacture a count of zero the pipeline refused to publish.
    const r = dataset({ n_by_tier: {}, n_verified_reuse: null, n_reuse_examined: 3 }, [
      article("t3_analyzed"),
    ]);
    expect(analyzedReuse(r)).toMatchObject({ counted: null, listExceedsCount: false });
  });

  it("leaves an agreeing count and list unremarked", () => {
    const r = dataset(
      { n_by_tier: { t3_analyzed: 3 }, n_verified_reuse: 3, n_reuse_examined: 3 },
      Array.from({ length: 3 }, () => article("t3_analyzed")),
    );
    expect(analyzedReuse(r)).toMatchObject({ listIsPartial: false, listExceedsCount: false });
  });
});
