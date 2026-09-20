import type { ReactNode } from "react";

import { BarAxis, barScale, exactScale } from "@/components/charts/BarAxis";
import { pctOf } from "@/lib/chart";

/**
 * Horizontal bars for comparing magnitudes across a handful of named rows.
 *
 * One colour per job, never per row: nominal categories all take the primary hue, and
 * bar length alone carries the value. `emphasis` and `warn` exist for the two meanings
 * the site reserves colour for - "underexplored" and "recorded but uninformative".
 *
 * Every chart carries a scale: gridlines inside each track and tick labels beneath the
 * bar column, both from the same rounded ceiling. Without one a reader can rank the
 * rows and nothing more, which wastes the only thing a bar is better at than a number.
 */

export type BarTone = "primary" | "emphasis" | "muted" | "warn";

export type BarRow = {
  key: string;
  label: ReactNode;
  value: number;
  /** Text at the end of the bar. Defaults to the formatted value. */
  display?: ReactNode;
  tone?: BarTone;
  /** Native tooltip for the whole row. */
  title?: string;
};

export const TONE_COLOR: Record<BarTone, string> = {
  primary: "var(--viz-1)",
  emphasis: "var(--viz-2)",
  muted: "var(--viz-mute)",
  warn: "var(--viz-3)",
};

export function Bars({
  rows,
  max,
  total,
  labelWidth = 150,
  valueWidth = 72,
  height = 8,
  format,
  unit,
  scale,
}: {
  rows: BarRow[];
  /** Scale ceiling. Defaults to the largest value present. */
  max?: number;
  /** When given, each value is also shown as a share of this total. */
  total?: number;
  labelWidth?: number;
  valueWidth?: number;
  height?: number;
  format?: (v: number) => string;
  /** Unit named once, at the end of the axis. */
  unit?: string;
  /** Drop the scale for a chart of one or two rows, where it says nothing. */
  scale?: boolean;
}) {
  // An explicit `max` is a caller saying what the full width of the track means - a
  // ceiling shared with another chart, or a known total - so it is used as given. With
  // no ceiling to honour, the largest value is rounded up to one that ticks cleanly.
  const s =
    max === undefined ? barScale(Math.max(0, ...rows.map((r) => r.value))) : exactScale(max);
  const showScale = scale ?? rows.length >= 3;
  const columns = `minmax(72px, ${labelWidth}px) minmax(0, 1fr) ${valueWidth}px`;
  return (
    <div>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const w = Math.max(0, Math.min(100, s.pct(r.value)));
          return (
            <li
              key={r.key}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: columns }}
              title={r.title}
            >
              <span className="viz-label truncate">{r.label}</span>
              <span
                className={`bar-track${showScale ? " scaled" : ""}`}
                style={{ height, ["--bar-tick" as string]: s.interval }}
              >
                <i
                  style={{
                    width: `${w}%`,
                    minWidth: r.value > 0 ? 2 : 0,
                    background: TONE_COLOR[r.tone ?? "primary"],
                  }}
                />
              </span>
              <span className="viz-value text-right">
                {r.display ?? (format ? format(r.value) : r.value.toLocaleString("en-US"))}
                {total ? <span className="t-faint"> {pctOf(r.value, total)}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      {showScale && (
        <div className="mt-1.5 grid gap-3" style={{ gridTemplateColumns: columns }}>
          <span />
          <BarAxis scale={s} unit={unit} />
          <span />
        </div>
      )}
    </div>
  );
}
