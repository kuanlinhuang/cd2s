import type { DatasetRecord, Grant, IndexRow } from "@/lib/types";

/**
 * Rows for the home page's "Data reuse" chart: citations to a dataset's paper next to
 * the articles that analysed its data, one dataset per row on one scale.
 *
 * Only datasets with both numbers measured are rows. A dataset whose reuse could not
 * be measured, or which has no citation count, is not a comparison, and drawing the
 * missing side as zero would be a false statement; the most cited of those are listed
 * separately with the reason the measurement is missing. A measured zero is a number,
 * not a gap: a dataset cited and never reused is drawn as a labelled zero, because it
 * is the sharpest form of the point the chart makes.
 *
 * Rows lead with the most cited dataset, so the reuse count sits beside the attention
 * the dataset already has. Ordering by reuse instead would put every measured zero
 * last, hiding exactly the rows that make the point.
 */

export interface ChartAward {
  num: string;
  url: string | null;
}

export interface ReuseChartRow {
  id: string;
  title: string;
  short: string | null;
  cites: number;
  reuse: number;
  /** Awards the record marks as having generated these data. Never any other role. */
  awards: ChartAward[];
  /** Every award linked to the record, whatever its role. */
  nAwards: number;
}

/**
 * The awards that paid to produce the data, most fiscal years first.
 *
 * An infrastructure or reuse award is never returned here: a cancer centre's core grant
 * that later harmonised TCGA did not generate TCGA, and naming it as the funder would
 * be false attribution.
 */
export function generatingAwards(grants: Grant[], max = 2): ChartAward[] {
  return grants
    .filter((g) => g.role === "generation" && g.core_project_num)
    .sort((a, b) => b.fiscal_years.length - a.fiscal_years.length)
    .slice(0, max)
    .map((g) => ({ num: g.core_project_num as string, url: g.reporter_url ?? null }));
}

export function reuseChartRows(
  index: IndexRow[],
  getRecord: (id: string) => DatasetRecord | null,
): ReuseChartRow[] {
  return index
    .filter(
      (r): r is IndexRow & { n_verified_reuse: number } =>
        (r.n_citations_to_primary_publication ?? 0) > 0 &&
        r.has_citable_accession === true &&
        r.n_verified_reuse != null,
    )
    .sort(
      (a, b) =>
        (b.n_citations_to_primary_publication ?? 0) - (a.n_citations_to_primary_publication ?? 0) ||
        b.n_verified_reuse - a.n_verified_reuse,
    )
    .map((r) => {
      const grants = getRecord(r.id)?.grants ?? [];
      return {
        id: r.id,
        title: r.title,
        short: r.short_title ?? null,
        cites: r.n_citations_to_primary_publication ?? 0,
        reuse: r.n_verified_reuse,
        awards: generatingAwards(grants),
        nAwards: grants.length,
      };
    });
}

export interface UntraceableRow {
  id: string;
  title: string;
  short: string | null;
  cites: number;
}

/** The most cited datasets whose reuse cannot be traced, because nothing quotes an accession. */
export function untraceableTopCited(index: IndexRow[], limit = 5): UntraceableRow[] {
  return index
    .filter((r) => (r.n_citations_to_primary_publication ?? 0) > 0 && r.has_citable_accession === false)
    .sort((a, b) => (b.n_citations_to_primary_publication ?? 0) - (a.n_citations_to_primary_publication ?? 0))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      title: r.title,
      short: r.short_title ?? null,
      cites: r.n_citations_to_primary_publication ?? 0,
    }));
}
