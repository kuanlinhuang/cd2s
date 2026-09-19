/**
 * Age at diagnosis as a box-and-whisker strip on a fixed 0 to 100 year axis.
 *
 * The axis is fixed so two datasets can be compared by eye: a paediatric cohort sits
 * on the left, an adult cohort on the right, without reading a single number.
 */

export type AgeSummary = {
  n?: number;
  min?: number;
  q1?: number;
  median?: number;
  q3?: number;
  max?: number;
};

const DOMAIN: [number, number] = [0, 100];
const TICKS = [0, 25, 50, 75, 100];

function x(v: number): string {
  const p = ((v - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

export function AgeBox({ stats }: { stats: AgeSummary }) {
  const { min, q1, median, q3, max, n } = stats;
  if (median === undefined || q1 === undefined || q3 === undefined) return null;
  const lo = min ?? q1;
  const hi = max ?? q3;
  const label =
    `median ${median.toFixed(0)}, middle half ${q1.toFixed(0)} to ${q3.toFixed(0)}, ` +
    `range ${lo.toFixed(0)} to ${hi.toFixed(0)} years` +
    (n ? `, ${Math.round(n).toLocaleString("en-US")} cases with an age` : "");
  return (
    <div>
      <div className="relative h-[46px]" role="img" aria-label={label} title={label}>
        {/* median value above the box */}
        <span
          className="viz-value absolute -translate-x-1/2 font-semibold"
          style={{ left: x(median), top: 0 }}
        >
          {median.toFixed(0)}
        </span>
        {/* whisker */}
        <span
          className="absolute"
          style={{
            left: x(lo),
            width: `calc(${x(hi)} - ${x(lo)})`,
            top: 27,
            height: 1,
            background: "var(--viz-axis)",
          }}
        />
        {/* box */}
        <span
          className="absolute"
          style={{
            left: x(q1),
            width: `calc(${x(q3)} - ${x(q1)})`,
            top: 20,
            height: 14,
            borderRadius: 3,
            background: "var(--viz-1-wash)",
            boxShadow: "inset 0 0 0 1px var(--viz-1)",
          }}
        />
        {/* median */}
        <span
          className="absolute"
          style={{ left: x(median), top: 18, width: 2, height: 18, marginLeft: -1, background: "var(--viz-1)" }}
        />
        {/* whisker ends */}
        {[lo, hi].map((v, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: x(v), top: 23, width: 1, height: 9, background: "var(--viz-axis)" }}
          />
        ))}
        {/* axis */}
        <span className="absolute inset-x-0" style={{ top: 40, height: 1, background: "var(--viz-grid)" }} />
        {TICKS.map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2 text-[10px] t-faint tnum"
            style={{ left: x(t), top: 36, lineHeight: "10px" }}
          >
            {t === 0 || t === 100 ? "" : t}
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] t-muted">
        Median <span className="viz-value">{median.toFixed(0)}</span>, middle half{" "}
        <span className="viz-value">
          {q1.toFixed(0)}&ndash;{q3.toFixed(0)}
        </span>
        , range{" "}
        <span className="viz-value">
          {lo.toFixed(0)}&ndash;{hi.toFixed(0)}
        </span>{" "}
        years{n ? <> across {Math.round(n).toLocaleString("en-US")} cases</> : null}.
      </p>
    </div>
  );
}
