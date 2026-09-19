import { describe, expect, it } from "vitest";

import { fitSummary, fitVerdicts, type FitStatus } from "@/lib/fit";

import { record, variable } from "./factories";

/**
 * The six analysis verdicts.
 *
 * These decide what every dataset page tells a researcher they can and cannot do, and a
 * wrong one sends somebody to request controlled access for an analysis the data cannot
 * carry. The cases below are the ones that have actually gone wrong: a field populated
 * for every case and informative for none, a repository that spells its fields
 * differently, and the difference between "no" and "we did not look".
 */

const statusOf = (r: Parameters<typeof fitVerdicts>[0], key: string): FitStatus =>
  fitVerdicts(r).find((v) => v.key === key)!.status;

describe("populated is not informative", () => {
  it("blocks survival when vital status is filled for every case and informative for none", () => {
    const r = record({
      clinical_variables: [
        variable("demographic.vital_status", {
          n_total: 18004,
          n_nonmissing: 18004,
          n_not_reported: 18004,
          n_informative: 0,
          coverage_pct: 0,
          populated_pct: 100,
          example_values: ["not reported"],
        }),
      ],
      longitudinal: { ...record().longitudinal, has_survival_endpoint: false },
    });
    const survival = fitVerdicts(r).find((v) => v.key === "survival")!;
    expect(survival.status).toBe("blocked");
    expect(survival.reason).toMatch(/informative for none/);
  });

  it("blocks analysis by race when race is recorded but never informative", () => {
    const r = record({
      clinical_variables: [
        variable("demographic.race", {
          n_total: 100,
          n_nonmissing: 100,
          n_not_reported: 100,
          n_informative: 0,
          coverage_pct: 0,
          populated_pct: 100,
        }),
      ],
    });
    expect(statusOf(r, "race")).toBe("blocked");
  });
});

describe("not measured is not a no", () => {
  it("reports unknown, never blocked, when nothing was probed", () => {
    const verdicts = fitVerdicts(record());
    expect(verdicts).toHaveLength(6);
    expect(verdicts.every((v) => v.status === "unknown")).toBe(true);
  });

  it("keeps a field unknown when other fields were measured but that one was not", () => {
    const r = record({
      clinical_variables: [
        variable("demographic.race", { coverage_pct: 90, populated_pct: 90 }),
      ],
    });
    expect(statusOf(r, "race")).toBe("supported");
    expect(statusOf(r, "agents")).toBe("unknown");
  });
});

describe("one rule across repositories", () => {
  it("grades a cBioPortal field by its harmonized name", () => {
    const r = record({
      clinical_variables: [
        variable("cbioportal:AJCC_PATHOLOGIC_TUMOR_STAGE", {
          harmonized: "diagnoses.ajcc_pathologic_stage",
          coverage_pct: 82,
          populated_pct: 82,
        }),
      ],
    });
    expect(statusOf(r, "stage")).toBe("supported");
  });

  it("grades a PDC field by its harmonized name and names the field without its prefix", () => {
    const r = record({
      clinical_variables: [
        variable("pdc:progression_or_recurrence", {
          harmonized: "diagnoses.progression_or_recurrence",
          coverage_pct: 0,
          populated_pct: 0,
        }),
      ],
    });
    const v = fitVerdicts(r).find((x) => x.key === "progression")!;
    expect(v.status).toBe("blocked");
    expect(v.reason.startsWith("progression_or_recurrence")).toBe(true);
    expect(v.reason).not.toMatch(/pdc:/);
  });

  it("prefers the better-covered of two fields claiming the same concept", () => {
    const r = record({
      clinical_variables: [
        variable("pdc:tumor_stage", {
          harmonized: "diagnoses.ajcc_pathologic_stage",
          coverage_pct: 0,
          populated_pct: 100,
        }),
        variable("pdc:ajcc_pathologic_stage", {
          harmonized: "diagnoses.ajcc_pathologic_stage",
          coverage_pct: 97,
          populated_pct: 97,
        }),
      ],
    });
    const v = fitVerdicts(r).find((x) => x.key === "stage")!;
    expect(v.status).toBe("supported");
    expect(v.pct).toBe(97);
  });
});

describe("thresholds", () => {
  it.each([
    [35, "supported"],
    [20, "limited"],
    [3, "blocked"],
  ])("grades progression at %i%% as %s", (pct, expected) => {
    const r = record({
      clinical_variables: [
        variable("diagnoses.progression_or_recurrence", {
          coverage_pct: pct,
          populated_pct: pct,
        }),
      ],
    });
    expect(statusOf(r, "progression")).toBe(expected);
  });

  it("does not let a treatment record stand in for a response", () => {
    const r = record({
      clinical_variables: [
        variable("diagnoses.treatments.therapeutic_agents", {
          populated_pct: 86,
          coverage_pct: null,
        }),
      ],
      longitudinal: { ...record().longitudinal, has_treatment_response: false },
    });
    expect(statusOf(r, "agents")).toBe("supported");
    expect(statusOf(r, "treatment")).toBe("blocked");
  });
});

describe("HTAN table-level coverage", () => {
  it("reaches limited at most, and says the fields were not measured", () => {
    const r = record({
      clinical_variables: [
        variable("htan:FollowUp", { harmonized: undefined, populated_pct: 100 }),
        variable("htan:Therapy", { harmonized: undefined, populated_pct: 100 }),
      ],
    });
    const v = fitVerdicts(r).find((x) => x.key === "progression")!;
    expect(v.status).toBe("limited");
    expect(v.reason).toMatch(/individual fields were not measured/);
  });
});

describe("the summary sentence", () => {
  it("reads as a sentence when only limited verdicts exist", () => {
    const r = record({
      clinical_variables: [variable("htan:FollowUp", { harmonized: undefined, populated_pct: 100 })],
    });
    const s = fitSummary(fitVerdicts(r)).sentence;
    expect(s.startsWith("This dataset can support ")).toBe(true);
    expect(s).not.toMatch(/This dataset overall survival/);
  });

  it("says plainly when nothing was measured", () => {
    expect(fitSummary(fitVerdicts(record())).sentence).toMatch(/has not been measured/);
  });
});
