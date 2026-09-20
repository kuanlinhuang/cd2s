import type { DatasetRecord, ReuseRecord } from "@/lib/types";

/** Articles the deep pass read and graded as having analyzed the data. */
export function analyzedArticles(reuse: ReuseRecord[]): ReuseRecord[] {
  return reuse.filter((x) => x.tier === "t3_analyzed" || x.tier === "t4_confirmed");
}

/** How the headline analyzed-reuse count relates to the articles listed beneath it. */
export interface AnalyzedReuse {
  /** The comparable index count, or null where it could not be measured. */
  counted: number | null;
  /** Articles in the exemplar list that were graded as analyzing the data. */
  listed: number;
  /** The count is bigger than the list, so the list is a set of examples. */
  listIsPartial: boolean;
  /** The list is bigger than the count, so the count is a demonstrated undercount. */
  listExceedsCount: boolean;
}

/**
 * Reconcile the two passes that both say "analyzed the data".
 *
 * The index pass counts one section field of one accession (`METHODS:"phs002005"`), so
 * that every dataset in the corpus is counted the same way and the numbers compare. The
 * deep pass retrieves articles individually and grades one as having analyzed the data
 * wherever the accession sits in the analysis - results, tables, figures, supplement -
 * and under any of the dataset's accessions. The second is the stronger evidence about
 * an article; the first is the only one that is comparable across datasets.
 *
 * So the list can legitimately be longer than the count, and on a handful of datasets it
 * is longer than a count of zero. A reader is owed the reason: an unexplained "0" above
 * six articles badged "Data analyzed" reads as the page contradicting itself, and the
 * zero is the number the underused-opportunity claim rests on.
 */
export function analyzedReuse(r: DatasetRecord): AnalyzedReuse {
  const m = r.reuse_metrics;
  const tiers = m.n_by_tier ?? {};
  // A tier is absent, not zero, when the accession-precision correction could not be
  // estimated. `?? 0` here would turn "we could not measure this" into "nobody used
  // this", which is the opposite claim and the more damaging one for a dataset.
  const counted = tiers.t3_analyzed ?? m.n_verified_reuse ?? null;
  const listed = analyzedArticles(r.reuse).length;
  return {
    counted,
    listed,
    listIsPartial: m.n_reuse_examined > r.reuse.length || (counted ?? 0) > r.reuse.length,
    listExceedsCount: counted !== null && listed > counted,
  };
}
