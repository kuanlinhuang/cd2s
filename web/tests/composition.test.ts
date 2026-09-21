import { describe, expect, it } from "vitest";

import {
  compositionFromCoverage,
  compositionFromValues,
  compositionFromVariable,
} from "@/components/charts/Composition";
import { assayCoverage, byCoverage, coveringWhole } from "@/lib/assays";
import { pctLabel, pctOf } from "@/lib/chart";
import type { Assay, Cohort } from "@/lib/types";

import { variable } from "./factories";

function assay(over: Partial<Assay> = {}): Assay {
  return {
    modality: "wgs",
    label: "Whole genome sequencing",
    platform: null,
    n_cases: null,
    n_samples: null,
    n_files: null,
    data_levels: [],
    access_tier: null,
    evidence: [],
    ...over,
  };
}

function cohort(over: Partial<Cohort> = {}): Cohort {
  return {
    n_cases: null,
    n_samples: null,
    demographics: { sex: {}, race: {}, ethnicity: {}, vital_status: {}, age_at_diagnosis_years: {}, country_or_region: {}, evidence: [] },
    evidence: [],
    ...over,
  } as Cohort;
}

describe("pctLabel", () => {
  it("never rounds a partial share up to a whole one", () => {
    // 211 of 212 cases have a slide. Printing "100%" there is the one claim a
    // coverage figure must not make.
    expect(pctOf(211, 212)).toBe(">99%");
    expect(pctLabel(99.5)).toBe(">99%");
  });

  it("keeps 100% for a share that really is whole", () => {
    expect(pctOf(212, 212)).toBe("100%");
    expect(pctLabel(100)).toBe("100%");
  });

  it("never rounds a present minority down to nothing", () => {
    expect(pctOf(1, 5000)).toBe("<1%");
    expect(pctOf(0, 5000)).toBe("0%");
  });
});

describe("assayCoverage", () => {
  it("divides samples by samples, never by the case count", () => {
    // cBioPortal lists 444 sequenced samples for 429 patients. The old division
    // printed 103%, or a clamped 100%, on 88 dataset pages.
    const c = cohort({ n_cases: 429, n_samples: 444 });
    expect(assayCoverage(assay({ n_samples: 444 }), c)).toEqual({
      n: 444,
      of: 444,
      unit: "samples",
    });
  });

  it("prefers the case count when the assay reports one", () => {
    const c = cohort({ n_cases: 212, n_samples: 500 });
    expect(assayCoverage(assay({ n_cases: 124 }), c)).toEqual({
      n: 124,
      of: 212,
      unit: "cases",
    });
  });

  it("reports no count rather than zero when the repository publishes none", () => {
    expect(assayCoverage(assay(), cohort({ n_cases: 212 })).n).toBeNull();
  });

  it("offers no whole when the cohort does not publish the assay's unit", () => {
    expect(assayCoverage(assay({ n_samples: 40 }), cohort({ n_cases: 100 })).of).toBeNull();
  });

  it("counts a measurement as whole-cohort only against its own unit", () => {
    const c = cohort({ n_cases: 429, n_samples: 444 });
    expect(coveringWhole([assay({ n_samples: 444 }), assay({ n_cases: 400 })], c)).toBe(1);
  });

  it("orders by share covered, not by raw count", () => {
    const c = cohort({ n_cases: 100, n_samples: 1000 });
    const partialSamples = assay({ modality: "a", n_samples: 500 });
    const wholeCases = assay({ modality: "b", n_cases: 100 });
    const uncounted = assay({ modality: "c" });
    expect(byCoverage([partialSamples, uncounted, wholeCases], c).map((a) => a.modality)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});

describe("compositionFromValues", () => {
  it("splits the real values, keeping non-answers on their own side of the bar", () => {
    const row = compositionFromValues("Race", { "black or african american": 207, unknown: 4, "not reported": 1 }, 212);
    expect(row?.segments.map((s) => [s.label, s.n, s.kind])).toEqual([
      ["black or african american", 207, "informative"],
      ["unknown", 4, "nonanswer"],
      ["not reported", 1, "nonanswer"],
    ]);
  });

  it("draws the cases the repository filed no row for", () => {
    const row = compositionFromValues("Vital status", { dead: 60, alive: 20 }, 100);
    expect(row?.segments.at(-1)).toMatchObject({ kind: "absent", n: 20 });
  });

  it("folds the tail without moving a count across the usable boundary", () => {
    const row = compositionFromValues(
      "Race",
      { a: 10, b: 8, c: 6, d: 4, e: 2, unknown: 5, "not reported": 3, "not allowed to collect": 1 },
      39,
      { limit: 2 },
    );
    const usable = row!.segments.filter((s) => s.kind === "informative");
    const unusable = row!.segments.filter((s) => s.kind === "nonanswer");
    expect(usable.reduce((a, s) => a + s.n, 0)).toBe(30);
    expect(unusable.reduce((a, s) => a + s.n, 0)).toBe(9);
    expect(usable.at(-1)?.label).toBe("3 other");
    // The fold hides categories, so the whole breakdown moves into the tooltip.
    expect(row?.tip).toContain("not allowed to collect");
  });

  it("has nothing to draw when the repository published no values", () => {
    expect(compositionFromValues("Sex", {}, 100)).toBeNull();
  });
});

describe("compositionFromVariable", () => {
  it("separates a usable value from a recorded non-answer and from nothing at all", () => {
    const row = compositionFromVariable(
      variable("demographic.race", {
        n_total: 212,
        n_informative: 207,
        n_not_reported: 5,
        n_nonmissing: 212,
      }),
    );
    expect(row?.segments.map((s) => [s.kind, s.n])).toEqual([
      ["informative", 207],
      ["nonanswer", 5],
      ["absent", 0],
    ]);
  });

  it("shows a one-to-many field only as the share of cases with any record", () => {
    const row = compositionFromVariable(
      variable("treatments.treatment_type", { n_total: 212, is_repeated: true, populated_pct: 100 }),
    );
    expect(row?.segments.map((s) => [s.kind, s.n])).toEqual([
      ["informative", 212],
      ["absent", 0],
    ]);
  });
});

describe("compositionFromCoverage", () => {
  it("says the count is unpublished rather than drawing a bar of zero", () => {
    const row = compositionFromCoverage("Multiplexed tissue imaging", null, 0);
    expect(row.unmeasured).toBe(true);
    expect(row.segments).toEqual([]);
    expect(row.readout).toBe("count not published");
  });

  it("gives a count with no share when the cohort publishes no whole", () => {
    const row = compositionFromCoverage("Bulk RNA sequencing", 40, 0);
    expect(row.unmeasured).toBe(true);
    expect(row.readout).toContain("share of cohort unknown");
  });

  it("names the unit when it is not the cohort's patients", () => {
    expect(compositionFromCoverage("Mutation calls", 444, 444, { unit: "samples" }).readout).toBe(
      "444 of 444 samples · 100%",
    );
    expect(compositionFromCoverage("Clinical", 212, 212).readout).toBe("212 of 212 · 100%");
  });
});

describe("compositionFromCoverage, when the numbers disagree", () => {
  it("gives both counts rather than a share above 100%", () => {
    // assayCoverage is what prevents the usual cause; this is the backstop.
    const row = compositionFromCoverage("Mutation calls", 444, 429);
    expect(row.readout).toBe("444, against 429 in the cohort");
    expect(row.segments.every((s) => s.n >= 0)).toBe(true);
  });
});

describe("the accessible label", () => {
  it("names the same unit the visible readout does", () => {
    // The screen-reader text is where a cases-for-samples slip hides, because
    // nobody sees it.
    const row = compositionFromCoverage("Mutation calls", 444, 444, { unit: "samples" });
    expect(row.unit).toBe("samples");
  });

  it("leaves a cohort field counted in cases", () => {
    expect(compositionFromValues("Sex", { female: 212 }, 212)?.unit).toBeUndefined();
  });
});
