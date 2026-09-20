import { describe, expect, it } from "vitest";

import { subjectsNamedIn } from "@/lib/subjects";

describe("controlled subject vocabulary", () => {
  it.each([
    ["gastric cancer", ["STOMACH"]],
    ["breast cancer survival", ["BREAST"]],
    ["mesothelioma survival", ["PLEURA"]],
    ["pheochromocytoma", ["ADRENAL_GLAND"]],
    ["neuroblastoma kids first", ["PNS"]],
    ["leukemia", ["LYMPH", "MYELOID"]],
    ["sarcoma", ["BONE", "SOFT_TISSUE"]],
  ])("maps %j to controlled codes", (query, expected) => {
    expect([...subjectsNamedIn(query)].sort()).toEqual([...expected].sort());
  });

  it("uses the longest matched phrase", () => {
    expect([...subjectsNamedIn("uveal melanoma")]).toEqual(["EYE"]);
  });

  it.each([
    "banana bread recipe",
    "how is survival measured",
    "I need a large open cohort with survival data",
    "what other cohorts do you have",
    "what tissue types are covered",
    "is there an unknown primary cohort",
    "various imaging collections",
    "show me multiple datasets like this one",
    "high grade tumors with early onset",
    "bulk download JSON",
    "R01CA097096",
    "overall survival OS and PFS",
    "TCGA-BRCA",
  ])("does not invent a subject for %j", (query) => {
    expect(subjectsNamedIn(query).size).toBe(0);
  });
});
