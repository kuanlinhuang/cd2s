import { describe, expect, it } from "vitest";

import { bulletAnchor } from "@/lib/anchors";
import { routeIntent } from "@/lib/intent";

import { indexRow } from "./factories";

/**
 * Where a question takes the visitor.
 *
 * The router decides which page answers a question and whether the dataset shortlist
 * should run at all. A missed route sends an award number to a dataset search; a missed
 * "no shortlist" shows four cohorts under "how is reuse measured". Both are pinned here.
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
  it("sends an award number to its funding network and skips the shortlist", () => {
    const intent = routeIntent("R01CA097096", INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "award", href: "/network?award=R01CA097096" })]);
    expect(intent.shortlist).toBe(false);
  });

  it("reads an award number out of a sentence", () => {
    const intent = routeIntent("what did award p30ca008748 pay for", INDEX);
    expect(hrefs("what did award p30ca008748 pay for")).toContain("/network?award=P30CA008748");
    expect(intent.shortlist).toBe(false);
  });

  it.each([
    ["TCGA-BRCA", "/datasets/gdc-tcga-brca"],
    ["tcga brca", "/datasets/gdc-tcga-brca"],
    ["fm-ad", "/datasets/gdc-fm-ad"],
    ["gdc-tcga-gbm", "/datasets/gdc-tcga-gbm"],
    ["Glioblastoma Multiforme", "/datasets/gdc-tcga-gbm"],
  ])("sends %j straight to its dataset page", (q, href) => {
    const intent = routeIntent(q, INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "dataset", href })]);
    expect(intent.shortlist).toBe(false);
  });

  it("does not read a gene name as a dataset", () => {
    expect(kinds("BRCA1 carriers with treatment records")).toEqual([]);
  });

  it("compares two named datasets", () => {
    const intent = routeIntent("compare TCGA-BRCA and TCGA-GBM", INDEX);
    expect(intent.routes).toEqual([
      expect.objectContaining({ kind: "compare", href: "/compare?ids=gdc-tcga-brca,gdc-tcga-gbm" }),
    ]);
    expect(intent.shortlist).toBe(false);
  });

  it("keeps the shortlist when a named dataset comes with an analysis", () => {
    const intent = routeIntent("TCGA-BRCA survival by subtype", INDEX);
    expect(intent.routes.map((r) => r.kind)).toEqual(["dataset"]);
    expect(intent.shortlist).toBe(true);
  });

  it.each([
    ["how is reuse measured", "/methods#reuse"],
    ["what does not measured mean", "/methods#fit"],
    ["why is a dataset underexplored", "/methods#reuse-gap"],
    ["how do you know a field is informative", "/methods#clinical"],
    ["where does the evidence come from", "/methods#principle"],
    ["how are the same cohort's records merged", "/methods#merging"],
    ["what is weak about this", "/methods#limitations"],
  ])("sends %j to the Methods section %s without a shortlist", (q, href) => {
    const intent = routeIntent(q, INDEX);
    expect(intent.routes.map((r) => r.href)).toContain(href);
    expect(intent.shortlist).toBe(false);
  });

  it("routes underexplored requests to the reuse page and still runs the shortlist", () => {
    const intent = routeIntent("underexplored proteomics datasets", INDEX);
    expect(intent.routes).toEqual([expect.objectContaining({ kind: "underexplored", href: "/underexplored" })]);
    expect(intent.shortlist).toBe(true);
  });

  it("sends requests for files to the software page", () => {
    const intent = routeIntent("bulk download JSON", INDEX);
    expect(intent.routes.map((r) => r.kind)).toEqual(["software"]);
    expect(intent.shortlist).toBe(false);
  });

  it.each([
    "Survival analysis in a cervical cancer cohort from sub-Saharan Africa",
    "survival in cervical cancer",
    "show me something interesting",
  ])("runs only the shortlist for %j", (q) => {
    const intent = routeIntent(q, INDEX);
    expect(intent.routes).toEqual([]);
    expect(intent.shortlist).toBe(true);
  });

  it("runs the shortlist for a how-question that names a disease", () => {
    expect(routeIntent("how is survival measured in cervical cancer cohorts", INDEX).shortlist).toBe(true);
  });
});

describe("linking a line of the answer to its evidence", () => {
  it.each([
    ["vital status and follow-up time are populated, so a survival endpoint can be derived", "why", "#fit"],
    ["no treatment response is recorded", "watch_out", "#fit"],
    ["whether it has imaging has not been measured for this record", "watch_out", "#fit"],
    ["212 cases, 10 measurement types, median follow-up 1.1 years", "why", "#glance"],
    ["5 reviewed research questions on its page", "why", "#useful-for"],
    ["some or all files need an approved access request", "watch_out", "#start"],
    ["no citable accession, so prior reuse cannot be traced", "watch_out", "#reuse"],
    ["Tumor stage is not populated for any case in the GDC harmonized clinical records.", "watch_out", "#limitations"],
    ["A large, well-annotated cohort with treatment records.", "why", "#fit"],
  ] as const)("anchors %j to %s", (text, column, anchor) => {
    expect(bulletAnchor(text, column)).toBe(anchor);
  });
});
