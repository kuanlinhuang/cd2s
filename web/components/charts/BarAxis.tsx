import { compact, niceCeil } from "@/lib/chart";

/**
 * The tick labels under a column of horizontal bars.
 *
 * Bars on this site carried their value as text at the end of each row and nothing
 * else, which answers "how big is this one" and not "how big is this one compared with
 * that one" - the question a bar chart exists to answer. Four ticks and the matching
 * gridlines inside each track (`.bar-track.scaled`) make the length of a bar readable
 * as a quantity rather than only as a ranking.
 *
 * The scale is shared with the bars by construction: both take the same ceiling, and
 * `ticks` is what decides the gridline spacing through the `--bar-tick` custom property.
 */

export interface BarScale {
  /** The value the right-hand edge of the track represents. */
  ceiling: number;
  /** CSS length for one tick interval, for `--bar-tick`. */
  interval: string;
  /** Tick positions as percentages of the track, with their labels. */
  ticks: { pct: number; label: string }[];
  /** Where a value sits along the track, 0 to 100. */
  pct: (v: number) => number;
  /** True when length is not proportional to value, so the chart must say so. */
  log?: boolean;
}

/**
 * A clean ceiling at or above `max`, divided into `steps` intervals.
 *
 * Rounding up to 1, 2 or 5 times a power of ten is what makes the tick labels
 * readable - a ceiling of exactly the largest value gives ticks like 4,631 and 9,262.
 */
export function barScale(max: number, steps = 4): BarScale {
  return exactScale(niceCeil(Math.max(max, 0)) || 1, steps);
}

/**
 * A scale whose ceiling is exactly the value given, for a caller that already knows what
 * the full width of the track means: a total, or a ceiling shared with another chart.
 */
export function exactScale(ceiling: number, steps = 4): BarScale {
  const top = ceiling || 1;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => ({
    pct: (100 * i) / steps,
    label: compact((top * i) / steps),
  }));
  return {
    ceiling: top,
    interval: `${100 / steps}%`,
    ticks,
    pct: (v) => (100 * Math.max(0, v)) / top,
  };
}

/**
 * A decade scale, for marks positioned along an axis spanning orders of magnitude.
 *
 * Only for dots, never for bars. A bar's length is read as proportional to its value and
 * on a log axis it is not - a dataset with seven articles would draw a bar three fifths
 * as long as one with 2,463. A dot encodes a position, which a log axis renders
 * honestly, which is why `PairedDots` exists and why this does not feed `Bars`.
 *
 * The domain runs from 1, not 0, so that each decade takes an equal share of the width
 * and the gridlines drawn at `interval` land exactly on the tick labels. The reuse
 * scatter maps log(v + 1) instead, for the same two measures, because it must give a
 * dataset nobody has used a place on the chart; here every row has at least one of each
 * by construction, so the offset would buy nothing and cost the even spacing.
 */
export function logScale(max: number): BarScale {
  const decades = Math.max(1, Math.ceil(Math.log10(Math.max(max, 1) + 0.0001)));
  const top = Math.pow(10, decades);
  const span = Math.log10(top);
  const pos = (v: number) => (100 * Math.log10(Math.min(Math.max(v, 1), top))) / span;
  return {
    ceiling: top,
    interval: `${100 / decades}%`,
    ticks: Array.from({ length: decades + 1 }, (_, i) => {
      const value = Math.pow(10, i);
      return { pct: (100 * i) / decades, label: compact(value) };
    }),
    pct: pos,
    log: true,
  };
}

/**
 * Renders the labels. The caller places this in the bar column of its own grid, so the
 * ticks line up with the tracks above them without either knowing the column's width.
 */
export function BarAxis({ scale, unit }: { scale: BarScale; unit?: string }) {
  const tail = unit;
  return (
    <span className="bar-axis" aria-hidden>
      {scale.ticks.map((t, i) => (
        <span key={t.pct} style={{ left: `${t.pct}%` }}>
          {t.label}
          {tail && i === scale.ticks.length - 1 ? (
            tail === "%" ? (
              tail
            ) : (
              <span className="axis-unit"> {tail}</span>
            )
          ) : null}
        </span>
      ))}
    </span>
  );
}
