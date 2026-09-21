import Link from "next/link";

import { BarAxis, logScale, type BarScale } from "@/components/charts/BarAxis";
import { num } from "@/lib/format";

/**
 * Two measures per dataset as two dots on one shared axis, joined by the gap between
 * them. One row per dataset, so a couple of dozen fit in the space four bars used to
 * take.
 *
 * This is the form the data forced. The obvious chart is two bars per row, and it works
 * beautifully for eight rows and not at all for fourteen: the two series span 641 to
 * 9,914, so on a linear axis scaled to the larger every reuse mark crowds into the left
 * quarter of the track. A log axis rescues the stubs and ruins the bars - length is
 * supposed to be proportional to value, and on a decade scale a dataset with seven
 * articles draws a bar a quarter as long as one with 2,831, four hundred times its
 * reuse. On the front page of a site whose whole argument is that catalogs mislead,
 * that is not a trade worth making.
 *
 * A dot encodes *position*, not length, and position on a log axis is honest - it is how
 * the reuse scatter already plots these same two measures. So the long tail keeps a
 * readable place on the axis, the ordering stays visible, and the thing a reader most
 * wants is now the most visible thing in the chart: the length of the connector is the
 * gap between being cited and being used.
 *
 * A measured zero sits on the axis origin, with its printed 0 beside it. The decade
 * scale has no position for it - log 0 is undefined, and giving zero its own step below
 * the first decade is what costs the even spacing that makes the gridlines line up with
 * their labels. A dataset cited and never reused is the sharpest row this chart has, so
 * it is drawn at the origin rather than dropped, and the figure is what states the value.
 *
 * Colour: grey is the softer signal, teal the measured one, the same meaning those two
 * tokens carry site-wide. Validated as a pair - CVD separation dE 14.1 light and 20.5
 * dark against a target of 8, normal vision 19.8 and 22.7 against a floor of 15 - and
 * the grey's sub-3:1 contrast against the card obliges visible labels, which is why
 * every row prints both numbers.
 */

export interface DotSeries {
  key: string;
  label: string;
  color: string;
  /** One word, to head the column of figures. Falls back to `label`. */
  shortLabel?: string;
  /** One clause on what the number counts, shown in the legend. */
  note?: string;
}

export interface DotRow {
  id: string;
  /** Short identity. An accession where there is one. */
  label: string;
  /** The full name, for the row's tooltip. */
  sub?: string | null;
  href?: string;
  values: Record<string, number>;
}

export function PairedDots({
  rows,
  series,
  unit,
  labelWidth = 180,
  valueWidth = 112,
}: {
  rows: DotRow[];
  series: DotSeries[];
  unit?: string;
  labelWidth?: number;
  valueWidth?: number;
}) {
  const peak = Math.max(1, ...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0)));
  const scale = logScale(peak);
  // The label column clamps rather than sitting at a fixed width: on a phone it was
  // taking 180px of a 450px row and leaving the plot about a hundred, which squeezed
  // every connector to a stub. The floor is set by the longest accession that has to stay
  // distinguishable - TARGET-ALL-P1 and TARGET-ALL-P2 are both in this chart, and a label
  // clipped to "TARGET-A..." identifies neither.
  const columns = `clamp(118px, 20vw, ${labelWidth}px) minmax(0, 1fr) ${valueWidth}px`;

  return (
    <div>
      <div className="viz-legend mb-3.5">
        {series.map((s) => (
          <span key={s.key}>
            <span className="viz-swatch dot" style={{ background: s.color }} />
            {s.label}
            {s.note && <span className="t-faint"> - {s.note}</span>}
          </span>
        ))}
      </div>

      {/* The two numbers are in legend order, but a column of bare figures does not say
          which is which, and colouring them would put a series hue on text. Headed
          instead. */}
      <div className="mb-1 grid gap-x-4" style={{ gridTemplateColumns: columns }}>
        <span />
        <span />
        <span className="flex items-baseline justify-end gap-2.5">
          {series.map((s) => (
            <span
              key={s.key}
              className="text-micro uppercase tracking-wide t-faint"
              style={{ minWidth: "3.1em", textAlign: "right" }}
            >
              {s.shortLabel ?? s.label}
            </span>
          ))}
        </span>
      </div>

      <ul>
        {rows.map((r) => {
          const tip = [
            r.sub,
            ...series.map((s) => `${s.label}: ${num(r.values[s.key] ?? 0)}`),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={r.id}
              className="grid items-center gap-x-4 py-[3px]"
              style={{ gridTemplateColumns: columns }}
              title={tip}
            >
              <div className="min-w-0">
                {r.href ? (
                  <Link
                    href={r.href}
                    className="block truncate font-mono text-meta font-medium hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {r.label}
                  </Link>
                ) : (
                  <span className="block truncate font-mono text-meta font-medium">
                    {r.label}
                  </span>
                )}
              </div>

              <DotTrack row={r} series={series} scale={scale} unit={unit} />

              <span className="flex items-baseline justify-end gap-2.5 text-right">
                {series.map((s) => (
                  <span
                    key={s.key}
                    className="viz-value tnum"
                    style={{ minWidth: "3.1em", color: "var(--text-muted)" }}
                  >
                    {num(r.values[s.key] ?? 0)}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-1.5 grid gap-x-4" style={{ gridTemplateColumns: columns }}>
        <span />
        <BarAxis scale={scale} unit={unit} />
        <span />
      </div>
    </div>
  );
}

/**
 * One row's plot: a hairline rule with a decade grid, the gap drawn as a connector, and
 * one dot per measure. The dots carry a 2px surface ring so a pair that nearly coincides
 * still reads as two.
 */
function DotTrack({
  row,
  series,
  scale,
  unit,
}: {
  row: DotRow;
  series: DotSeries[];
  scale: BarScale;
  unit?: string;
}) {
  const points = series.map((s) => ({
    s,
    v: row.values[s.key] ?? 0,
    pct: scale.pct(row.values[s.key] ?? 0),
  }));
  const lo = Math.min(...points.map((p) => p.pct));
  const hi = Math.max(...points.map((p) => p.pct));

  return (
    <span
      className="dot-track scaled"
      style={{ ["--bar-tick" as string]: scale.interval }}
      role="img"
      aria-label={points
        .map((p) => `${p.s.label}: ${num(p.v)}${unit ? ` ${unit}` : ""}`)
        .join("; ")}
    >
      {/* The gap between the two, which is the finding. */}
      <i className="dot-link" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
      {points.map((p) => (
        <b key={p.s.key} className="dot-mark" style={{ left: `${p.pct}%`, background: p.s.color }} />
      ))}
    </span>
  );
}
