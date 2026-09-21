import type { ReactNode } from "react";

import { BarAxis, exactScale } from "@/components/charts/BarAxis";
import { pctOf } from "@/lib/chart";
import { isNonAnswer, num } from "@/lib/format";
import type { ClinicalVariable } from "@/lib/types";

/**
 * What a field actually holds, drawn as one full-width bar per field.
 *
 * `CoverageChart` answers "how much of this field is usable"; this answers "and what
 * is in it". The two are the same bar read at different resolutions, so the encoding
 * is deliberately the same one: the teal run is the usable part, amber is a value that
 * was recorded and says nothing, and the gridded gap is a case with no value at all.
 * The difference is that each usable category gets its own segment, so a reader sees
 * 116 deaths against 96 survivors rather than "vital status: 100%" - which is the
 * number an outcome analysis actually needs.
 *
 * Every bar is the same cohort, so they all run the full width and the boundary
 * between two segments can be compared from row to row against one 0-100% scale.
 */

export type SegmentKind = "informative" | "nonanswer" | "absent";

export type Segment = {
  key: string;
  label: string;
  n: number;
  kind: SegmentKind;
};

export type CompositionRow = {
  key: string;
  label: string;
  /** The whole the segments are parts of: the cohort, not the sum of known values. */
  total: number;
  segments: Segment[];
  /** Rendered after the field name, for a `1:n` marker or an evidence chip. */
  chip?: ReactNode;
  /**
   * The full breakdown for the tooltip, when folding the tail left the visible
   * readout shorter than the data. A reader who wants the eleventh race category
   * can still reach it without leaving the page.
   */
  tip?: string;
  /**
   * What to print beside the field name, when naming each segment would be worse than
   * one phrase. A measurement's two segments are "covered" and "not covered", which is
   * three words to say "124 of 212".
   */
  readout?: string;
  /**
   * Set when the repository publishes no count, so there is no share to draw. The row
   * prints its name and says so, and no bar appears: an empty track already means "no
   * case has a value", which is a measured claim and the opposite of not knowing.
   */
  unmeasured?: boolean;
  /**
   * What the total counts, for the tooltip and the accessible label. Defaults to
   * cases; a measurement reported in samples must say so everywhere, not only in the
   * visible readout, or the screen-reader text reintroduces the exact cases-for-samples
   * conflation `lib/assays.ts` exists to remove.
   */
  unit?: string;
};

/**
 * Successive categories of the same kind step down in lightness rather than changing
 * hue.
 *
 * The site's palette spends hue on meaning - teal is "usable", amber is "recorded but
 * uninformative", violet is "underexplored" - so a fourth and fifth hue for "alive"
 * and "dead" would spend the one channel a reader has learned to trust. A lightness
 * step is the weaker cue, which is why every segment is also named with its count in
 * the readout beside the field, and why the 2px gaps the `.seg-bar` rule already
 * draws are what separate adjacent segments rather than the colour alone.
 */
const RAMP: Record<SegmentKind, string[]> = {
  informative: [
    "var(--viz-1)",
    "color-mix(in srgb, var(--viz-1) 58%, var(--bg-raised))",
    "color-mix(in srgb, var(--viz-1) 32%, var(--bg-raised))",
  ],
  nonanswer: ["var(--viz-3)", "color-mix(in srgb, var(--viz-3) 52%, var(--bg-raised))"],
  // Transparent, not a fill: the gridded track shows through, so a reader can see
  // where the unrecorded share ends on the scale.
  absent: ["transparent"],
};

function fill(kind: SegmentKind, rank: number): string {
  const ramp = RAMP[kind];
  return ramp[Math.min(rank, ramp.length - 1)];
}

/** Two intervals, not four: these bars sit in a card column where four tick labels collide. */
const PCT_SCALE = exactScale(100, 2);

/** Segments in reading order: what is usable first, then non-answers, then nothing at all. */
const KIND_ORDER: Record<SegmentKind, number> = { informative: 0, nonanswer: 1, absent: 2 };

function order(segments: Segment[]): Segment[] {
  return [...segments].sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.n - a.n,
  );
}

/**
 * A demographic field's real values, classified by whether they answer anything.
 *
 * `limit` folds the tail into one segment so a field with eleven race categories still
 * draws a bar a reader can take in; the fold keeps its kind, so folding never moves a
 * count between the usable and the unusable side of the bar.
 */
export function compositionFromValues(
  label: string,
  values: Record<string, number>,
  total: number,
  { key = label, limit = 3, chip }: { key?: string; limit?: number; chip?: ReactNode } = {},
): CompositionRow | null {
  const entries = Object.entries(values).filter(([, n]) => n > 0);
  if (entries.length === 0) return null;
  const known = entries.reduce((a, [, n]) => a + n, 0);
  const all: Segment[] = order(
    entries.map(([value, n]) => ({
      key: value,
      label: value,
      n,
      kind: isNonAnswer(value) ? ("nonanswer" as const) : ("informative" as const),
    })),
  );

  const segments: Segment[] = [];
  for (const kind of ["informative", "nonanswer"] as const) {
    const of = all.filter((s) => s.kind === kind);
    segments.push(...of.slice(0, limit));
    const rest = of.slice(limit);
    if (rest.length > 0) {
      segments.push({
        key: `${kind}-rest`,
        label: `${rest.length} other`,
        n: rest.reduce((a, s) => a + s.n, 0),
        kind,
      });
    }
  }
  // Demographics are tallied over the cases the repository filed a row for, which can
  // be fewer than the cohort. The remainder is a case with no value, and saying so is
  // the point of the chart, so it is drawn rather than scaled away.
  if (total > known) {
    segments.push({ key: "absent", label: "no value recorded", n: total - known, kind: "absent" });
  }
  const whole = Math.max(total, known);
  const tip =
    all.length > segments.filter((s) => s.kind !== "absent").length
      ? all.map((s) => `${num(s.n)} ${s.label}`).join(" · ")
      : undefined;
  return { key, label, total: whole, segments, chip, tip };
}

/**
 * A clinical field at the only resolution the repository publishes it: how many cases
 * carry a usable value, how many carry a non-answer, and how many carry nothing.
 *
 * A one-to-many field can only report the share of cases with at least one record, so
 * it draws two segments and the caller is expected to mark it `1:n`.
 */
export function compositionFromVariable(
  v: ClinicalVariable,
  { chip }: { chip?: ReactNode } = {},
): CompositionRow | null {
  const total = v.n_total ?? 0;
  const label = v.label ?? v.name;
  if (total <= 0) return null;

  if (v.is_repeated) {
    const withRecord = Math.round((total * (v.populated_pct ?? 0)) / 100);
    return {
      key: v.name,
      label,
      total,
      segments: [
        { key: "any", label: "with a record", n: withRecord, kind: "informative" },
        { key: "absent", label: "no record", n: total - withRecord, kind: "absent" },
      ],
      chip,
    };
  }

  const informative = v.n_informative ?? 0;
  const nonanswer = v.n_not_reported ?? 0;
  const absent = Math.max(0, total - (v.n_nonmissing ?? informative + nonanswer));
  return {
    key: v.name,
    label,
    total,
    segments: [
      { key: "informative", label: "usable value", n: informative, kind: "informative" },
      { key: "nonanswer", label: "not reported", n: nonanswer, kind: "nonanswer" },
      { key: "absent", label: "no value recorded", n: absent, kind: "absent" },
    ],
    chip,
  };
}

/**
 * How much of the cohort one measurement was run on.
 *
 * The same bar as a field's composition, because it is the same question - what share
 * of these patients does this cover - and drawing a measurement's coverage in one
 * grammar and a field's in another makes a reader translate between them to compare
 * the two things the card is actually about.
 */
export function compositionFromCoverage(
  label: string,
  covered: number | null | undefined,
  total: number,
  {
    key = label,
    chip,
    unit,
  }: {
    key?: string;
    chip?: ReactNode;
    /**
     * Named in the readout when the count is not in the unit the surrounding block is
     * about. A row reading "444 of 444 samples" has to stand out from one reading
     * "212 of 212", because they are not counting the same thing.
     */
    unit?: string;
  } = {},
): CompositionRow {
  // A third of the corpus has at least one measurement the repository lists without a
  // count. Drawing that as a bar of zero would say every case lacks it, which is a
  // measurement nobody made; the row says the count is not published instead.
  if (covered === null || covered === undefined) {
    return {
      key,
      label,
      total,
      segments: [],
      readout: "count not published",
      unmeasured: true,
      chip,
    };
  }
  if (!total) {
    return {
      key,
      label,
      total: covered,
      segments: [],
      readout: `${num(covered)}${unit ? ` ${unit}` : ""}, share of cohort unknown`,
      unmeasured: true,
      unit,
      chip,
    };
  }
  // A count above its own whole is the two numbers disagreeing, not a measurement of
  // more than everything. `assayCoverage` is what stops the usual cause - a sample
  // count over a case count - and this is the backstop for any other: the bar fills,
  // and the readout gives both numbers instead of a percentage over 100.
  if (covered > total) {
    return {
      key,
      label,
      total: covered,
      segments: [{ key: "covered", label: "covered", n: covered, kind: "informative" }],
      readout: `${num(covered)}${unit ? ` ${unit}` : ""}, against ${num(total)} in the cohort`,
      unit,
      chip,
    };
  }
  return {
    key,
    label,
    total,
    segments: [
      { key: "covered", label: "covered", n: covered, kind: "informative" },
      { key: "absent", label: "not covered", n: total - covered, kind: "absent" },
    ],
    readout: `${num(covered)} of ${num(total)}${unit ? ` ${unit}` : ""} · ${pctOf(covered, total)}`,
    unit,
    chip,
  };
}

function readout(row: CompositionRow): string {
  if (row.readout) return row.readout;
  const shown = row.segments.filter((s) => s.n > 0);
  if (shown.length === 0) return "no cases";
  return shown.map((s) => `${num(s.n)} ${s.label}`).join(" · ");
}

export function CompositionLegend() {
  return (
    <div className="viz-legend">
      <span>
        <span className="viz-swatch" style={{ background: "var(--viz-1)" }} />
        A usable value
      </span>
      <span>
        <span className="viz-swatch" style={{ background: "var(--viz-3)" }} />
        &ldquo;Not reported&rdquo; or &ldquo;unknown&rdquo;
      </span>
      <span>
        <span
          className="viz-swatch"
          style={{ background: "var(--viz-track)", boxShadow: "inset 0 0 0 1px var(--border)" }}
        />
        No value recorded
      </span>
    </div>
  );
}

export function CompositionRows({ rows }: { rows: CompositionRow[] }) {
  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const text = readout(row);
          const tip = `${row.label}: ${row.tip ?? text}, of ${num(row.total)} ${row.unit ?? "cases"}`;
          // Ranks are counted per kind so the first usable category and the first
          // non-answer each take the full-strength end of their own ramp.
          const rank: Record<string, number> = {};
          return (
            <li key={row.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="flex min-w-0 items-center gap-1.5 text-body">
                  <span className="truncate">{row.label}</span>
                  {row.chip}
                </span>
                <span className={row.unmeasured ? "text-meta t-faint" : "viz-value t-muted"}>
                  {text}
                </span>
              </div>
              {row.unmeasured ? null : (
              <span
                className="seg-bar scaled mt-1"
                style={{ height: 10, ["--bar-tick" as string]: PCT_SCALE.interval }}
                role="img"
                aria-label={tip}
                title={tip}
              >
                {row.segments
                  .filter((s) => s.n > 0)
                  .map((s) => {
                    const r = rank[s.kind] ?? 0;
                    rank[s.kind] = r + 1;
                    return (
                      <span
                        key={s.key}
                        style={{
                          flex: `${(100 * s.n) / (row.total || 1)} 0 0`,
                          background: fill(s.kind, r),
                        }}
                      />
                    );
                  })}
              </span>
              )}
            </li>
          );
        })}
      </ul>
      {rows.some((row) => !row.unmeasured) && (
        <div className="mt-1.5">
          <BarAxis scale={PCT_SCALE} unit="%" />
        </div>
      )}
    </div>
  );
}
