import { describe, expect, it } from "vitest";

import { getNotebookGuides } from "@/lib/data";
import { NOTEBOOK_NOTES } from "@/lib/notebook-notes";

describe("notebook notes", () => {
  it("covers every workbook the exported corpus publishes", () => {
    const slugs = getNotebookGuides().map((guide) => guide.slug);
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.filter((slug) => !NOTEBOOK_NOTES[slug])).toEqual([]);
  });

  it("carries no note for a workbook the corpus no longer publishes", () => {
    const slugs = new Set(getNotebookGuides().map((guide) => guide.slug));
    expect(Object.keys(NOTEBOOK_NOTES).filter((slug) => !slugs.has(slug))).toEqual([]);
  });
});
