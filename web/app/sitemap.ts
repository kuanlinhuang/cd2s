import type { MetadataRoute } from "next";

import { getAllRecordIds, getStats } from "@/lib/data";
import { siteUrlOrPlaceholder } from "@/lib/site";

const SITE_URL = siteUrlOrPlaceholder();

const PAGES = ["", "/datasets", "/questions", "/underexplored", "/compare", "/network", "/agents", "/methods"];

export default function sitemap(): MetadataRoute.Sitemap {
  const built = new Date(getStats().generated_at);
  return [
    ...PAGES.map((p) => ({ url: `${SITE_URL}${p}`, lastModified: built, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...getAllRecordIds().map((id) => ({
      url: `${SITE_URL}/datasets/${id}`,
      lastModified: built,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
