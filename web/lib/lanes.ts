/**
 * What each stage of the funding flow is, and the accent its cards carry.
 *
 * Neither side of the chart can own this. `FundingFlow` is a client component, so a
 * server page importing a value from it gets a client reference rather than the value;
 * `lib/data.ts` reads the file system, so the chart cannot import from there. Kept here
 * for the same reason `lib/needs.ts` exists: shared facts with nothing behind them, so
 * the same definition runs in both places.
 */

export type LaneKey = "generation" | "dataset" | "article" | "enabled";

/**
 * Which accent each kind of card takes for its left rule.
 *
 * The one definition. The stage preview on /network shows these four rules before a
 * dataset is chosen, and read its colours from a parallel array of literals until a
 * reviewer noticed nothing made the two agree.
 */
export const LANE_RULE: Record<LaneKey, string> = {
  generation: "var(--viz-1)",
  dataset: "var(--accent)",
  article: "var(--border-strong)",
  enabled: "var(--viz-mute)",
};

/** The dataset view's lanes, in order, as the kinds `LANE_RULE` is keyed by. */
export const DATASET_VIEW_LANE_KEYS: readonly LaneKey[] = [
  "generation",
  "dataset",
  "article",
  "enabled",
];
