import type { ReactNode } from "react";

import { pctOf } from "@/lib/chart";

/**
 * Horizontal bars for comparing magnitudes across a handful of named rows.
 *
 * One colour per job, never per row: nominal categories all take the primary hue, and
 * bar length alone carries the value. `emphasis` and `warn` exist for the two meanings
 * the site reserves colour for - "underexplored" and "recorded but uninformative".
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
}) {
  const ceiling = max ?? (Math.max(0, ...rows.map((r) => r.value)) || 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const w = Math.max(0, Math.min(100, (100 * r.value) / ceiling));
        return (
          <li
            key={r.key}
            className="grid items-center gap-3"
            style={{
              gridTemplateColumns: `minmax(72px, ${labelWidth}px) minmax(0, 1fr) ${valueWidth}px`,
            }}
            title={r.title}
          >
            <span className="viz-label truncate">{r.label}</span>
            <span className="bar-track" style={{ height }}>
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
  );
}
