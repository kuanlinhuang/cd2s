import { NextResponse } from "next/server";

import { getIndex } from "@/lib/data";
import type { IndexRow } from "@/lib/types";

// Must be server-rendered per request: a statically prerendered route is built once with
// no query string, so every filter would be silently ignored and the same full result set
// returned for every query.
export const dynamic = "force-dynamic";

/**
 * Capability-first dataset search.
 *
 * The filters an agent most needs are not free text - they are "does this dataset
 * actually record treatment response" and "is a survival endpoint derivable". Those are
 * measured fields on every record, so they are first-class query parameters here rather
 * than something a caller has to infer from a description.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 25) || 25, 200);

  const wants = (key: string): boolean | null => {
    const v = searchParams.get(key);
    if (v === null) return null;
    return v !== "false" && v !== "0";
  };

  const modality = searchParams.get("modality");
  const site = searchParams.get("site");
  const access = searchParams.get("access");
  const repository = searchParams.get("repository");
  const survival = wants("survival");
  const treatment = wants("treatment_response");
  const underexplored = wants("underexplored");
  const showcase = wants("showcase");
  const minCases = Number(searchParams.get("min_cases") ?? 0) || 0;
  const minModalities = Number(searchParams.get("min_modalities") ?? 0) || 0;

  let rows: IndexRow[] = getIndex();

  if (q) rows = rows.filter((r) => r.search_text.toLowerCase().includes(q));
  if (modality) rows = rows.filter((r) => r.modalities.includes(modality));
  if (site) rows = rows.filter((r) => r.primary_sites.includes(site));
  if (access) rows = rows.filter((r) => r.access_tier === access);
  if (repository) rows = rows.filter((r) => r.repositories.includes(repository));
  if (survival !== null) rows = rows.filter((r) => (r.has_survival_endpoint === true) === survival);
  if (treatment !== null)
    rows = rows.filter((r) => (r.has_treatment_response === true) === treatment);
  if (underexplored !== null) rows = rows.filter((r) => r.is_underexplored === underexplored);
  if (showcase !== null) rows = rows.filter((r) => r.is_showcase === showcase);
  if (minCases) rows = rows.filter((r) => (r.n_cases ?? r.n_samples ?? 0) >= minCases);
  if (minModalities) rows = rows.filter((r) => r.n_modalities >= minModalities);

  const total = rows.length;
  // Copy before sorting: when no filter narrowed the set, `rows` is still the memoised
  // array `getIndex()` hands out, and Array.prototype.sort mutates in place - so a single
  // unfiltered request would permanently reorder the index for every other page in this
  // process.
  const results = [...rows]
    .sort((a, b) => (b.n_cases ?? b.n_samples ?? 0) - (a.n_cases ?? a.n_samples ?? 0))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      short_title: r.short_title,
      one_liner: r.one_liner,
      n_cases: r.n_cases,
      n_samples: r.n_samples,
      modalities: r.modalities,
      access_tier: r.access_tier,
      has_survival_endpoint: r.has_survival_endpoint,
      has_treatment_response: r.has_treatment_response,
      median_followup_months: r.median_followup_months,
      is_underexplored: r.is_underexplored,
      reuse_gap_index: r.reuse_gap_index,
      n_verified_reuse: r.n_verified_reuse,
      has_citable_accession: r.has_citable_accession,
      review_status: r.review_status,
      record: `/data/datasets/${r.id}.json`,
      agent_brief: `/data/agent/${r.id}.md`,
    }));

  return NextResponse.json(
    {
      total,
      returned: results.length,
      caveat:
        "has_survival_endpoint and has_treatment_response are measured from actual " +
        "field completeness, not from dataset descriptions. has_citable_accession=false " +
        "means reuse could not be traced, not that the dataset is unused.",
      results,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
