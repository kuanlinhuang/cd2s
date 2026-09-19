import { describe, expect, it } from "vitest";

import { NEED_KEYS, readNeeds, topicOf } from "@/lib/agent";

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
    ["underexplored proteomics datasets", "underexplored"],
    ["a cohort few people have worked on", "underexplored"],
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

describe("separating the topic from the capability words", () => {
  const topic = (q: string) => topicOf(q, readNeeds(q));

  it("removes the words that already became needs", () => {
    // "survival", "treatment" and "proteogenomic" each triggered a capability check;
    // leaving them in the text query counted them twice and made every well-annotated
    // cohort look relevant to every clinical question.
    const t = topic("proteogenomic gastric cancer survival with treatment records");
    expect(t).toBe("gastric cancer");
  });

  it("keeps the disease when the request is only about a disease", () => {
    expect(topic("nasopharyngeal carcinoma")).toBe("nasopharyngeal carcinoma");
  });

  it("returns null when the request states a capability and no topic", () => {
    expect(topic("I need a large open cohort with survival data")).toBeNull();
    expect(topic("treatment response")).toBeNull();
  });

  it("does not treat a one or two letter fragment as a topic", () => {
    expect(topic("survival in a cohort of 20")).toBeNull();
  });
});
