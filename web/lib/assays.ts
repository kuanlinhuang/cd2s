import type { Assay, Cohort } from "@/lib/types";

/**
 * What share of the cohort a measurement covers, in a unit the division is valid in.
 *
 * A repository may report a measurement in cases or in samples, and the two are not
 * interchangeable: cBioPortal lists 444 sequenced samples for a 429-patient cohort,
 * because some patients gave more than one. Dividing the first by the second printed
 * "444 of 429 - 103%" on 88 dataset pages, or a clamped "100%" before that, both of
 * which assert a completeness the record does not contain.
 *
 * So the denominator is chosen to match the numerator, and a share is only offered
 * when the cohort publishes the same unit the assay was counted in.
 */
export type AssayCoverage = {
  /** How many of `unit` this measurement covers, or null when no count is published. */
  n: number | null;
  /** The whole, in the same unit, or null when the cohort does not publish it. */
  of: number | null;
  unit: "cases" | "samples";
};

export function assayCoverage(assay: Assay, cohort: Cohort): AssayCoverage {
  if (assay.n_cases !== null && assay.n_cases !== undefined) {
    return { n: assay.n_cases, of: cohort.n_cases ?? null, unit: "cases" };
  }
  if (assay.n_samples !== null && assay.n_samples !== undefined) {
    return { n: assay.n_samples, of: cohort.n_samples ?? null, unit: "samples" };
  }
  return { n: null, of: null, unit: "cases" };
}

/** Measurements that cover every case or sample the cohort has, counted like for like. */
export function coveringWhole(assays: Assay[], cohort: Cohort): number {
  return assays.filter((a) => {
    const { n, of } = assayCoverage(a, cohort);
    return n !== null && of !== null && of > 0 && n >= of;
  }).length;
}

/**
 * Measurements ordered by the share of the cohort they cover, widest first.
 *
 * Ordering on the raw count would put a 444-sample assay above a 429-case one, which
 * is the same unit mismatch that broke the percentages, applied to the reading order.
 * A measurement with no published count sorts last: it is not zero, but it is the one
 * row a reader can do nothing with.
 */
export function byCoverage(assays: Assay[], cohort: Cohort): Assay[] {
  const share = (a: Assay): number => {
    const { n, of } = assayCoverage(a, cohort);
    if (n === null) return -1;
    return of && of > 0 ? n / of : 0;
  };
  return [...assays].sort((a, b) => share(b) - share(a));
}
