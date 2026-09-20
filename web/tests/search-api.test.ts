import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/v1/search/route";

describe("published search subject filter", () => {
  it("filters by controlled subject and includes title-derived records for browsing", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/search?subject=LUNG&limit=200"),
    );
    const body = (await response.json()) as {
      total: number;
      results: { id: string; subjects: string[] }[];
    };
    expect(body.total).toBeGreaterThan(0);
    expect(body.results.every((row) => row.subjects.includes("LUNG"))).toBe(true);
    expect(body.results.map((row) => row.id)).toContain("gdc-alchemist-alch");
  });

  it("keeps the published raw site filter unchanged", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/search?site=Stomach&limit=200"),
    );
    const body = (await response.json()) as { total: number };
    expect(body.total).toBeGreaterThan(0);
  });

  it("represents an empty controlled subject result", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/search?subject=PENIS"),
    );
    const body = (await response.json()) as { total: number; results: unknown[] };
    expect(body.total).toBe(0);
    expect(body.results).toEqual([]);
  });
});
