import { describe, expect, it } from "vitest";

import { bulletAnchor } from "@/lib/anchors";
import { routeIntent } from "@/lib/intent";

import { indexRow } from "./factories";

/**
 * Where a question takes the visitor.
 *
 * The router decides which pages are offered alongside the dataset shortlist, which
 * always runs. A missed route sends an award number to a dataset search and nothing
 * else; a name shared by two records must not become a comparison nobody asked for.
 */

const INDEX = [
  indexRow({
    id: "gdc-tcga-brca",
    title: "Breast Invasive Carcinoma",
    short_title: "TCGA-BRCA",
    cancer_types: ["Breast Invasive Carcinoma"],
    primary_sites: ["Breast"],
    modalities: ["rna_seq", "wxs"],
  }),
  indexRow({
    id: "gdc-tcga-gbm",
    title: "Glioblastoma Multiforme",
    short_title: "TCGA-GBM",
    cancer_types: ["Glioblastoma Multiforme"],
    primary_sites: ["Brain"],
  }),
  indexRow({
    id: "pdc-cptac-gbm",
    title: "Glioblastoma Multiforme",
    short_title: "CPTAC-GBM",
    cancer_types: ["Glioblastoma Multiforme"],
    primary_sites: ["Brain"],
  }),
  indexRow({
    id: "gdc-fm-ad",
    title: "Foundation Medicine Adult Cancer Clinical Dataset (FM-AD)",
    short_title: "FM-AD",
    cancer_types: ["Mixed Cancer Types"],
  }),
  indexRow({
    id: "gdc-cgci-htmcp-cc",
    title: "HIV+ Tumor Molecular Characterization Project - Cervical Cancer",
    short_title: "CGCI-HTMCP-CC",
    cancer_types: ["Cervical Squamous Cell Carcinoma"],
    primary_sites: ["Cervix uteri"],
  }),
];

const kinds = (q: string) => routeIntent(q, INDEX).routes.map((r) => r.kind);
const hrefs = (q: string) => routeIntent(q, INDEX).routes.map((r) => r.href);

describe("routing a question", () => {
  it("sends an award number to its funding network", () => {
    const intent = routeIntent("R01CA097096", INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "award", href: "/network?award=R01CA097096" })]);
  });

  it("reads an award number out of a sentence", () => {
    expect(hrefs("what did award p30ca008748 pay for")).toContain("/network?award=P30CA008748");
  });

  it.each([
    ["TCGA-BRCA", "/datasets/gdc-tcga-brca"],
    ["tcga brca", "/datasets/gdc-tcga-brca"],
    ["fm-ad", "/datasets/gdc-fm-ad"],
    ["gdc-tcga-gbm", "/datasets/gdc-tcga-gbm"],
    ["TCGA-GBM survival by subtype", "/datasets/gdc-tcga-gbm"],
  ])("sends %j straight to its dataset page", (q, href) => {
    const intent = routeIntent(q, INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "dataset", href })]);
  });

  it("does not read a gene name as a dataset", () => {
    expect(kinds("BRCA1 carriers with treatment records")).toEqual([]);
  });

  it("compares two distinct named datasets", () => {
    const intent = routeIntent("compare TCGA-BRCA and TCGA-GBM", INDEX);
    expect(intent.routes).toEqual([
      expect.objectContaining({ kind: "compare", href: "/compare?ids=gdc-tcga-brca,gdc-tcga-gbm" }),
    ]);
  });

  it("offers one name held by several records as candidates, not as a comparison", () => {
    const intent = routeIntent("Glioblastoma Multiforme", INDEX);
    expect(intent.routes.map((r) => r.kind)).toEqual(["dataset", "dataset"]);
    expect(intent.routes.map((r) => r.href)).toEqual(["/datasets/gdc-tcga-gbm", "/datasets/pdc-cptac-gbm"]);
    expect(intent.routes.map((r) => r.label)).toEqual([
      "Glioblastoma Multiforme (TCGA-GBM)",
      "Glioblastoma Multiforme (CPTAC-GBM)",
    ]);
  });

  it.each([
    ["how is reuse measured", "/methods#reuse"],
    ["what does not measured mean", "/methods#fit"],
    ["why is a dataset underexplored", "/methods#reuse-gap"],
    ["how do you know a field is informative", "/methods#clinical"],
    ["where does the evidence come from", "/methods#principle"],
    ["how are the same cohort's records merged", "/methods#merging"],
    ["what is weak about this", "/methods#limitations"],
  ])("sends %j to the Methods section %s", (q, href) => {
    expect(hrefs(q)).toContain(href);
  });

  it("routes underexplored requests to the reuse page", () => {
    const intent = routeIntent("underexplored proteomics datasets", INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "underexplored", href: "/underexplored" })]);
  });

  it("sends requests for files to the software page", () => {
    expect(kinds("bulk download JSON")).toEqual(["software"]);
  });

  it.each([
    "Survival analysis in a cervical cancer cohort from sub-Saharan Africa",
    "survival in cervical cancer",
    "show me something interesting",
  ])("offers no route for %j, leaving the shortlist to answer it", (q) => {
    expect(routeIntent(q, INDEX).routes).toEqual([]);
  });
});

describe("linking a line of the answer to its evidence", () => {
  it.each([
    ["vital status and follow-up time are populated, so a survival endpoint can be derived", "#fit"],
    ["no treatment response is recorded", "#fit"],
    ["whether it has imaging has not been measured for this record", "#fit"],
    ["212 cases, 10 measurement types, median follow-up 1.1 years", "#glance"],
    ["5 reviewed research questions on its page", "#useful-for"],
    ["some or all files need an approved access request", "#start"],
    ["no citable accession, so prior reuse cannot be traced", "#reuse"],
  ] as const)("anchors %j to %s", (text, anchor) => {
    expect(bulletAnchor(text)).toBe(anchor);
  });

  it.each([
    "Tumor stage is not populated for any case in the GDC harmonized clinical records.",
    "A large, well-annotated cohort with treatment records.",
  ])("gives free prose no anchor rather than a guessed one: %j", (text) => {
    expect(bulletAnchor(text)).toBeNull();
  });
});
