import { describe, expect, it } from "vitest";

import { NEED_KEYS, readNeeds } from "@/lib/agent";

import { indexRow } from "./factories";

/**
 * What the dataset agent reads out of a request.
 *
 * A missed need is silent - the agent simply stops checking for it and can recommend a
 * cohort that cannot answer the question - so the wording that researchers actually use
 * is pinned here.
 */

const keys = (q: string) => readNeeds(q).map((n) => n.key).sort();

describe("reading the request", () => {
  it.each([
    ["I want to compare overall survival between subtypes", "survival"],
    ["does immunotherapy response differ by ancestry", "treatment"],
    ["CT scans matched to expression data", "imaging"],
    ["single-cell and spatial profiling of the tumour margin", "singlecell"],
    ["phosphoproteomics of resistant tumours", "proteomics"],
    ["DNA methylation subtypes", "methylation"],
    ["somatic mutation frequencies", "genome"],
    ["a pediatric leukaemia cohort", "pediatric"],
    ["disparities in outcomes for Black patients", "population"],
    ["proteogenomic integration across layers", "multimodal"],
  ])("reads %j as needing %s", (query, key) => {
    expect(keys(query)).toContain(key);
  });

  it("reads nothing from a request that states no requirement", () => {
    expect(readNeeds("show me something interesting")).toHaveLength(0);
  });

  it("knows every need key exactly once", () => {
    expect(new Set(NEED_KEYS).size).toBe(NEED_KEYS.length);
  });
});

describe("checking a need against a record", () => {
  const need = (key: string) => readNeeds("survival treatment imaging large open").find((n) => n.key === key)!;

  it("returns null, not false, when a capability was never measured", () => {
    expect(need("survival").check(indexRow({ has_survival_endpoint: null }))).toBeNull();
    expect(need("treatment").check(indexRow({ has_treatment_response: null }))).toBeNull();
  });

  it("returns false only when the capability was measured and is absent", () => {
    expect(need("survival").check(indexRow({ has_survival_endpoint: false }))).toBe(false);
    expect(need("survival").check(indexRow({ has_survival_endpoint: true }))).toBe(true);
  });

  it("counts samples toward cohort size when patients were not counted", () => {
    expect(need("large").check(indexRow({ n_cases: null, n_samples: 4000 }))).toBe(true);
    expect(need("large").check(indexRow({ n_cases: null, n_samples: 40 }))).toBe(false);
  });
});

