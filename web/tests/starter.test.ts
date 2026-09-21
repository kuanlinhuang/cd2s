import { describe, expect, it } from "vitest";

import { starterAccess, starterSnippets } from "@/lib/starter";
import { record } from "./factories";

/**
 * The "Start here" section is the site's broadest claim: every dataset page carries
 * code a reader can run. These tests pin the API shapes that were verified live against
 * the four public endpoints on 2026-09-20, because each one had already drifted once
 * and the failure is silent - a snippet that 400s or raises AttributeError still
 * renders perfectly.
 *
 * They are deliberately assertions about the emitted text, not network calls: a test
 * that hits Europe PMC or the GDC would make the suite fail on a train. Anything that
 * needs the live API is re-checked by running the snippets, which is a manual step
 * recorded in AGENTS.md.
 */

function withId(scheme: string, value: string) {
  return record({
    identifiers: [{ scheme, value, url: null, is_primary: true, evidence: [] }],
  } as never);
}

/** Every identifier scheme the generator handles, and what it produces for it. */
const REPOSITORIES = [
  { scheme: "gdc_project_id", key: "gdc", access: "open" },
  { scheme: "pdc_study_id", key: "pdc", access: "open" },
  { scheme: "idc_collection_id", key: "idc", access: "open" },
  { scheme: "cbioportal_study_id", key: "cbio", access: "open" },
  { scheme: "synapse_id", key: "htan", access: "account" },
] as const;

describe("starterSnippets", () => {
  // One table for both, so a new repository cannot get a snippet and be left out of
  // the coverage count the home page publishes - or the other way round.
  it.each(REPOSITORIES)(
    "$scheme gets its own snippet, the record fallback, and an access tier",
    ({ scheme, key, access }) => {
      const keys = starterSnippets(withId(scheme, "X-1")).map((s) => s.key);
      expect(keys).toContain(key);
      expect(keys).toContain("record");
      expect(starterAccess(withId(scheme, "X-1"))).toBe(access);
    },
  );

  it("a record with no known identifier still gets the JSON fallback", () => {
    expect(starterSnippets(record()).map((s) => s.key)).toEqual(["record"]);
  });

  it("resolves the PDC study UUID before asking for files", () => {
    const code = starterSnippets(withId("pdc_study_id", "PDC000622")).find(
      (s) => s.key === "pdc",
    )!.code;
    // filesPerStudy returns the right row count with every column null when it is
    // given the pdc_study_id, so the snippet has to look the UUID up first.
    expect(code).toContain("study(pdc_study_id:");
    expect(code).toContain("filesPerStudy(study_id:");
    expect(code).not.toContain("filesPerStudy(pdc_study_id");
    // pdc.cancer.gov serves the portal; the API is on the proteomic subdomain.
    expect(code).toContain("https://proteomic.datacommons.cancer.gov/graphql");
    expect(code).not.toContain("https://pdc.cancer.gov/graphql");
  });

  it("uses idc-index methods that exist", () => {
    const code = starterSnippets(withId("idc_collection_id", "nsclc_radiogenomics")).find(
      (s) => s.key === "idc",
    )!.code;
    expect(code).toContain("client.index");
    // IDCClient has no get_series; the collection is filtered out of the index frame.
    expect(code).not.toMatch(/\.get_series\(/);
  });

  it("keeps the GDC filter JSON balanced", () => {
    const code = starterSnippets(withId("gdc_project_id", "TCGA-BRCA")).find(
      (s) => s.key === "gdc",
    )!.code;
    const filters = code.slice(code.indexOf("filters = "), code.indexOf("params = "));
    expect(filters.split("{").length).toBe(filters.split("}").length);
  });
});

describe("starterAccess", () => {
  it("is none when nothing in the record is recognised", () => {
    expect(starterAccess(record())).toBe("none");
  });

  it("prefers the open route when a record carries both", () => {
    const both = record({
      identifiers: [
        { scheme: "synapse_id", value: "syn1", url: null, is_primary: false, evidence: [] },
        { scheme: "gdc_project_id", value: "X", url: null, is_primary: true, evidence: [] },
      ],
    } as never);
    expect(starterAccess(both)).toBe("open");
  });
});
