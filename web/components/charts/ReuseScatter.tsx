"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { clamp, logPlusOne, logTicks } from "@/lib/chart";
import type { ScatterPoint } from "@/lib/types";

/**
 * Observed against expected reuse for every dataset the model could assess.
 *
 * This is the site's central picture. Each dot is a dataset; the diagonal is "reused
 * exactly as much as comparable datasets"; the shaded wedge below is the region where
 * a dataset earns the underexplored label. Both axes are log(count + 1) so a dataset
 * that nobody has used still has a place on the chart.
 *
 * Emphasis form: everything is grey except the datasets the chart is about. Hover or
 * focus any dot for its numbers; click through to the dataset. A table twin sits
 * beneath the full-size chart so no value depends on a pointer.
 */

/**
 * Label geometry, used to reserve space before drawing so two labels never land on each
 * other. The width is per character and has to over- rather than under-estimate: these
 * are accessions like BEATAML1.0-CRENOLANIB, nearly all capitals and digits, which run
 * a good deal wider per character than the lowercase text an average would suggest. At
 * 6.1 the reserved boxes were narrower than the drawn text and labels touched.
 */
const LABEL_FONT = 12;
const LABEL_CHAR_W = 7.4;
const LABEL_H = 16;

type Box = { x: number; y: number; w: number; h: number };

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(260, Math.floor(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export default function ReuseScatter({
  points,
  thresholdLog2 = -1.5,
  compact = false,
  labelCount,
}: {
  points: ScatterPoint[];
  /** Residual below which a dataset is labeled underexplored, in log2 units. */
  thresholdLog2?: number;
  /** Shorter, fewer labels, no table twin. For the landing page. */
  compact?: boolean;
  labelCount?: number;
}) {
  const { ref, width } = useWidth<HTMLDivElement>(compact ? 560 : 760);
  const height = compact ? 280 : Math.round(clamp(width * 0.52, 300, 440));
  const m = { top: 28, right: 20, bottom: 44, left: 52 };
  const narrow = width < 480;

  const maxV = useMemo(
    () => Math.max(10, ...points.map((p) => Math.max(p.observed, p.expected))),
    [points],
  );
  const x = useMemo(() => logPlusOne(0, maxV, m.left, width - m.right), [maxV, width, m.left, m.right]);
  const y = useMemo(() => logPlusOne(0, maxV, height - m.bottom, m.top), [maxV, height, m.bottom, m.top]);
  const ticks = logTicks(maxV);

  // The threshold observed + 1 = (expected + 1) * 2^t is a straight line in log space.
  // It meets the floor (observed = 0) where expected = 2^-t - 1.
  const k = Math.pow(2, thresholdLog2);
  const floorHit = 1 / k - 1;
  const thrAtMax = (maxV + 1) * k - 1;

  const ordered = useMemo(
    () => [...points].sort((a, b) => Number(a.underexplored) - Number(b.underexplored)),
    [points],
  );

  // Selective direct labels: the most underexplored datasets and the most reused one.
  const labels = useMemo(() => {
    // At phone widths labels collide with dots; the legend and tooltip carry identity.
    if (narrow) return [];
    const want = labelCount ?? (compact ? 3 : 6);
    const under = points
      .filter((p) => p.underexplored)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .slice(0, want);
    const top = [...points].sort((a, b) => b.observed - a.observed)[0];
    const chosen = top && !under.includes(top) ? [...under, top] : under;
    const placed: Box[] = [];
    const out: { p: ScatterPoint; bx: number; by: number; anchor: "start" | "end" }[] = [];
    for (const p of chosen) {
      const px = x(p.expected);
      const py = y(p.observed);
      const w = p.short.length * LABEL_CHAR_W + 6;
      const right: Box = { x: px + 9, y: py - LABEL_H / 2, w, h: LABEL_H };
      const left: Box = { x: px - 9 - w, y: py - LABEL_H / 2, w, h: LABEL_H };
      const candidates = [right, left, { ...right, y: right.y - 12 }, { ...right, y: right.y + 12 }];
      const fit = candidates.find(
        (b) => b.x >= m.left && b.x + b.w <= width - 4 && !placed.some((q) => overlaps(q, b)),
      );
      if (!fit) continue;
      placed.push(fit);
      const anchor = fit.x < px ? "end" : "start";
      out.push({ p, bx: anchor === "end" ? fit.x + fit.w : fit.x, by: fit.y + LABEL_H / 2 + 4, anchor });
    }
    return out;
  }, [points, labelCount, compact, narrow, x, y, width, m.left]);

  const [hover, setHover] = useState<ScatterPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function nearest(clientX: number, clientY: number): ScatterPoint | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best: ScatterPoint | null = null;
    let bestD = 26 * 26;
    for (const p of points) {
      const dx = x(p.expected) - px;
      const dy = y(p.observed) - py;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  }

  const nUnder = points.filter((p) => p.underexplored).length;
  const tipLeft = hover ? x(hover.expected) : 0;
  const tipTop = hover ? y(hover.observed) : 0;
  const flip = tipLeft > width * 0.6;

  return (
    <div ref={ref} className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block max-w-full select-none"
        role="img"
        aria-label={`Scatter of ${points.length} datasets: articles that analyzed the data against the number expected. ${nUnder} fall in the underexplored zone.`}
        onPointerMove={(e) => setHover(nearest(e.clientX, e.clientY))}
        onPointerLeave={() => setHover(null)}
      >
        {/* underexplored zone */}
        <polygon
          points={`${x(0)},${y(0)} ${x(Math.min(floorHit, maxV))},${y(0)} ${x(maxV)},${y(Math.max(0, thrAtMax))} ${x(maxV)},${y(0)}`}
          fill="var(--viz-2-wash)"
        />
        {/* grid */}
        {ticks.map((t) => (
          <g key={`g${t}`}>
            <line x1={x(t)} x2={x(t)} y1={m.top} y2={height - m.bottom} stroke="var(--viz-grid)" />
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke="var(--viz-grid)" />
          </g>
        ))}
        {/* axes */}
        <line x1={m.left} x2={width - m.right} y1={height - m.bottom} y2={height - m.bottom} stroke="var(--viz-axis)" />
        <line x1={m.left} x2={m.left} y1={m.top} y2={height - m.bottom} stroke="var(--viz-axis)" />
        {ticks.map((t) => (
          <g key={`t${t}`}>
            <text className="viz-axis-text" x={x(t)} y={height - m.bottom + 16} textAnchor="middle">
              {t.toLocaleString("en-US")}
            </text>
            <text className="viz-axis-text" x={m.left - 8} y={y(t) + 4} textAnchor="end">
              {t.toLocaleString("en-US")}
            </text>
          </g>
        ))}
        <text className="viz-axis-text" x={width - m.right} y={height - 6} textAnchor="end">
          Expected articles, from size, age, breadth and access
        </text>
        <text className="viz-axis-text" x={m.left} y={m.top - 12} textAnchor="start">
          Articles that analyzed the data
        </text>

        {/* as-expected diagonal and the threshold */}
        <line x1={x(0)} y1={y(0)} x2={x(maxV)} y2={y(maxV)} stroke="var(--viz-axis)" strokeWidth={1.5} />
        <line
          x1={x(Math.min(floorHit, maxV))}
          y1={y(0)}
          x2={x(maxV)}
          y2={y(Math.max(0, thrAtMax))}
          stroke="var(--viz-2)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.8}
        />
        {!narrow && (
          <text
            className="viz-axis-text"
            x={x(maxV) - 6}
            y={y(maxV) - 8}
            textAnchor="end"
            style={{ fill: "var(--text-muted)" }}
          >
            reused as expected
          </text>
        )}

        {/* dots */}
        {ordered.map((p) => {
          const active = hover?.id === p.id;
          const r = p.underexplored ? (active ? 7 : 5) : active ? 6.5 : 4;
          return (
            <a
              key={p.id}
              href={`/datasets/${p.id}`}
              className="viz-hit"
              aria-label={`${p.title}: ${p.observed} articles analyzed it, about ${Math.round(p.expected)} expected`}
              onFocus={() => setHover(p)}
              onBlur={() => setHover(null)}
            >
              <circle cx={x(p.expected)} cy={y(p.observed)} r={13} fill="transparent" />
              <circle
                className="viz-dot"
                cx={x(p.expected)}
                cy={y(p.observed)}
                r={r}
                fill={p.underexplored ? "var(--viz-2)" : "var(--viz-mute)"}
                stroke="var(--bg-raised)"
                strokeWidth={2}
                opacity={active || p.underexplored ? 1 : 0.9}
              />
            </a>
          );
        })}

        {/* direct labels */}
        {labels.map(({ p, bx, by, anchor }) => (
          <text
            key={`l${p.id}`}
            x={bx}
            y={by}
            textAnchor={anchor}
            style={{
              fontSize: LABEL_FONT,
              fill: "var(--text-muted)",
              paintOrder: "stroke",
              stroke: "var(--bg-raised)",
              strokeWidth: 3,
              strokeLinejoin: "round",
            }}
          >
            {p.short}
          </text>
        ))}
      </svg>

      {hover && (
        <div
          className="viz-tip"
          style={{
            left: flip ? undefined : tipLeft + 14,
            right: flip ? width - tipLeft + 14 : undefined,
            top: Math.max(0, tipTop - 12),
          }}
        >
          <div className="tip-title">{hover.title}</div>
          <div className="row">
            <span>Articles that analyzed it</span>
            <b>{hover.observed.toLocaleString("en-US")}</b>
          </div>
          <div className="row">
            <span>Expected for comparable datasets</span>
            <b>
              ~{hover.expected < 1 ? hover.expected.toFixed(1) : Math.round(hover.expected).toLocaleString("en-US")}
            </b>
          </div>
          {hover.index !== null && (
            <div className="row">
              <span>Reuse gap index</span>
              <b>{hover.index.toFixed(2)}</b>
            </div>
          )}
          {hover.underexplored && (
            <div className="mt-1 font-medium" style={{ color: "var(--viz-2)" }}>
              Underexplored
            </div>
          )}
        </div>
      )}

      <div className="viz-legend mt-2">
        <span>
          <span className="viz-swatch dot" style={{ background: "var(--viz-2)" }} />
          Underexplored ({nUnder})
        </span>
        <span>
          <span className="viz-swatch dot" style={{ background: "var(--viz-mute)" }} />
          Other assessed datasets ({points.length - nUnder})
        </span>
        <span style={{ color: "var(--viz-axis)" }}>
          <span className="viz-swatch line" />
          <span className="t-muted">Reused as expected</span>
        </span>
        <span style={{ color: "var(--viz-2)" }}>
          <span className="viz-swatch line dashed" />
          <span className="t-muted">Label threshold: below {Math.round((1 / k) * 10) / 10}&times; less than expected</span>
        </span>
      </div>

      {!compact && (
        <details className="mt-4">
          <summary className="cursor-pointer text-body font-medium">
            Show all {points.length} datasets as a table
          </summary>
          <div className="mt-2 max-h-[420px] overflow-auto rounded border">
            <table className="w-full text-meta">
              <thead className="sticky top-0" style={{ background: "var(--bg-raised)" }}>
                <tr className="border-b text-left t-faint">
                  <th className="py-1.5 pl-3 pr-3 font-medium">Dataset</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Analyzed it</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Expected</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Index</th>
                </tr>
              </thead>
              <tbody>
                {[...points]
                  .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                  .map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="py-1 pl-3 pr-3">
                        <a href={`/datasets/${p.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                          {p.title}
                        </a>
                        {p.underexplored && (
                          <span className="ml-1.5 text-micro" style={{ color: "var(--viz-2)" }}>
                            underexplored
                          </span>
                        )}
                      </td>
                      <td className="tnum py-1 pr-3 text-right">{p.observed.toLocaleString("en-US")}</td>
                      <td className="tnum py-1 pr-3 text-right">
                        {p.expected < 1 ? p.expected.toFixed(1) : Math.round(p.expected).toLocaleString("en-US")}
                      </td>
                      <td className="tnum py-1 pr-3 text-right">{p.index?.toFixed(2) ?? "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
