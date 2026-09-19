import { describe, expect, it } from "vitest";

import { generatingAwards, reuseChartRows, untraceableTopCited } from "@/lib/reuse-chart";
import type { Grant } from "@/lib/types";

import { indexRow, record } from "./factories";

/**
 * The home page's data reuse chart.
 *
 * Three things here can mislead: a missing measurement drawn as zero, a measured zero
 * hidden because it looks like a missing one, and the wrong grant named as a dataset's
 * funder. All three are pinned.
 */

const grant = (over: Partial<Grant>): Grant =>
  ({ pi_names: [], fiscal_years: [], evidence: [], role: "unknown", ...over }) as Grant;

describe("which datasets are rows", () => {
  const index = [
    indexRow({ id: "both-big", n_citations_to_primary_publication: 9000, has_citable_accession: true, n_verified_reuse: 2000 }),
    indexRow({ id: "both-small", n_citations_to_primary_publication: 40, has_citable_accession: true, n_verified_reuse: 600 }),
    indexRow({ id: "cited-untraceable", n_citations_to_primary_publication: 6500, has_citable_accession: false, n_verified_reuse: null }),
    indexRow({ id: "reused-uncited", n_citations_to_primary_publication: null, has_citable_accession: true, n_verified_reuse: 3000 }),
    indexRow({ id: "reused-zero", n_citations_to_primary_publication: 12, has_citable_accession: true, n_verified_reuse: 0 }),
    indexRow({ id: "reuse-unmeasured", n_citations_to_primary_publication: 80, has_citable_accession: true, n_verified_reuse: null }),
  ];
  const rows = reuseChartRows(index, () => record({ grants: [] }));

  it("keeps only datasets with both numbers measured", () => {
    expect(rows.map((r) => r.id)).toEqual(["both-big", "both-small", "reused-zero"]);
  });

  it("never turns a missing measurement into a zero bar", () => {
    expect(rows.find((r) => r.id === "cited-untraceable")).toBeUndefined();
    expect(rows.find((r) => r.id === "reused-uncited")).toBeUndefined();
    expect(rows.find((r) => r.id === "reuse-unmeasured")).toBeUndefined();
  });

  it("shows a dataset cited but never reused as a measured zero", () => {
    expect(rows.find((r) => r.id === "reused-zero")).toEqual(
      expect.objectContaining({ cites: 12, reuse: 0 }),
    );
  });

  it("leads with the most cited dataset, whatever its reuse", () => {
    const shuffled = [index[4], index[1], index[0]];
    expect(reuseChartRows(shuffled, () => null).map((r) => r.id)).toEqual([
      "both-big",
      "both-small",
      "reused-zero",
    ]);
  });

  it("breaks a citation tie on reuse", () => {
    const tied = [
      indexRow({ id: "tied-low", n_citations_to_primary_publication: 100, has_citable_accession: true, n_verified_reuse: 1 }),
      indexRow({ id: "tied-high", n_citations_to_primary_publication: 100, has_citable_accession: true, n_verified_reuse: 9 }),
    ];
    expect(reuseChartRows(tied, () => null).map((r) => r.id)).toEqual(["tied-high", "tied-low"]);
  });

  it("lists the most cited untraceable datasets separately, with the reason implied by the flag", () => {
    expect(untraceableTopCited(index)).toEqual([
      expect.objectContaining({ id: "cited-untraceable", cites: 6500 }),
    ]);
  });
});

describe("naming a funder", () => {
  const infra = grant({ core_project_num: "P30CA008748", role: "infrastructure", fiscal_years: [2019, 2020, 2021, 2022] });
  const reuse = grant({ core_project_num: "R37CA229861", role: "reuse", fiscal_years: [2020] });
  const gen1 = grant({ core_project_num: "P50CA062924", role: "generation", fiscal_years: [2014] });
  const gen2 = grant({ core_project_num: "U10CA098543", role: "generation", fiscal_years: [2010, 2011, 2012] });
  const gen3 = grant({ core_project_num: "R01CA000001", role: "generation", fiscal_years: [] });

  it("never puts an infrastructure or reuse award in the funder's place", () => {
    expect(generatingAwards([infra, reuse])).toEqual([]);
  });

  it("names generating awards, most fiscal years first, at most two", () => {
    expect(generatingAwards([gen1, infra, gen2, gen3]).map((a) => a.num)).toEqual(["U10CA098543", "P50CA062924"]);
  });

  it("still counts every award on record so the row can point at the funding list", () => {
    const index = [indexRow({ id: "x", n_citations_to_primary_publication: 5, has_citable_accession: true, n_verified_reuse: 5 })];
    const [row] = reuseChartRows(index, () => record({ grants: [infra, reuse] }));
    expect(row.awards).toEqual([]);
    expect(row.nAwards).toBe(2);
  });
});
