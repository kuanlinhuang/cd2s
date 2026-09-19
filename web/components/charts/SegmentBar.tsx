import { pctOf } from "@/lib/chart";

/**
 * One bar split into parts of a whole. Segments are separated by a 2px gap in the
 * surface colour rather than by strokes, and every segment is named in a legend below
 * with its count and share, so nothing depends on reading colour alone.
 */

export type Segment = {
  key: string;
  label: string;
  value: number;
  color: string;
  /** One short clause explaining the segment, shown under its legend entry. */
  note?: string;
};

export function SegmentBar({
  segments,
  total,
  height = 12,
  legendColumns = 4,
}: {
  segments: Segment[];
  total?: number;
  height?: number;
  legendColumns?: 2 | 3 | 4;
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0);
  const whole = total ?? sum;
  const shown = segments.filter((s) => s.value > 0);
  const cols =
    legendColumns === 2
      ? "sm:grid-cols-2"
      : legendColumns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div>
      <div
        className="seg-bar"
        style={{ height }}
        role="img"
        aria-label={shown
          .map((s) => `${s.label}: ${s.value.toLocaleString("en-US")} (${pctOf(s.value, whole)})`)
          .join("; ")}
      >
        {shown.map((s) => (
          <span
            key={s.key}
            style={{ flex: `${s.value} 0 0`, background: s.color }}
            title={`${s.label}: ${s.value.toLocaleString("en-US")} (${pctOf(s.value, whole)})`}
          />
        ))}
      </div>
      <ul className={`mt-3 grid gap-x-6 gap-y-2 ${cols}`}>
        {segments.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            <span className="viz-swatch mt-[3px]" style={{ background: s.color }} />
            <span className="min-w-0 text-[12px] leading-snug">
              <span className="viz-value font-semibold">{s.value.toLocaleString("en-US")}</span>
              <span className="t-faint"> {pctOf(s.value, whole)}</span>
              <span className="block" style={{ color: "var(--text)" }}>
                {s.label}
              </span>
              {s.note && <span className="block t-muted">{s.note}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
