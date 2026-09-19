"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NetworkData, NetworkEdge, NetworkNode } from "@/lib/types";

/**
 * Awards, datasets and articles as three columns, left to right, in the direction the
 * money and the findings flow. Zoom with the wheel or the buttons, drag to pan, hover
 * for a node's details, click to pin it and see everything it connects to.
 *
 * A fixed three-column layout was chosen over a force simulation on purpose: the
 * question a reader brings is "what did this award fund, and what came of it", and a
 * layered layout answers it by reading across. Rows are ordered by barycentre so most
 * edges run short.
 */

const COL_X = [0, 620, 1240];
const ROW = 18;
const PAD = 40;

const EDGE_LABEL: Record<NetworkEdge["kind"], string> = {
  generation: "funded data generation",
  reuse_funding: "funded reuse of the data",
  infrastructure: "funded infrastructure or harmonization",
  primary: "original publication",
  analyzed: "analyzed the data",
  weaker: "mentioned or declared use",
};

type Placed = NetworkNode & { x: number; y: number; r: number; degree: number };

function layout(data: NetworkData) {
  const degree = new Map<string, number>();
  for (const e of data.edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const byKind = { award: [] as NetworkNode[], dataset: [] as NetworkNode[], paper: [] as NetworkNode[] };
  for (const n of data.nodes) byKind[n.kind].push(n);

  // Datasets: grouped by repository, then by degree so the busiest sit together.
  byKind.dataset.sort(
    (a, b) =>
      (a.repository ?? "").localeCompare(b.repository ?? "") ||
      (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) ||
      a.label.localeCompare(b.label),
  );
  const dIndex = new Map(byKind.dataset.map((n, i) => [n.id, i]));

  // Awards and papers: ordered by the mean position of the datasets they touch.
  const bary = (id: string, side: "source" | "target") => {
    const ys: number[] = [];
    for (const e of data.edges) {
      if (side === "source" && e.source === id) ys.push(dIndex.get(e.target) ?? 0);
      if (side === "target" && e.target === id) ys.push(dIndex.get(e.source) ?? 0);
    }
    return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
  };
  const aBary = new Map(byKind.award.map((n) => [n.id, bary(n.id, "source")]));
  const pBary = new Map(byKind.paper.map((n) => [n.id, bary(n.id, "target")]));
  byKind.award.sort((a, b) => (aBary.get(a.id) ?? 0) - (aBary.get(b.id) ?? 0));
  byKind.paper.sort((a, b) => (pBary.get(a.id) ?? 0) - (pBary.get(b.id) ?? 0));

  const tallest = Math.max(byKind.award.length, byKind.dataset.length, byKind.paper.length, 1);
  const height = tallest * ROW;
  const placed = new Map<string, Placed>();
  const cols: [NetworkNode[], number][] = [
    [byKind.award, COL_X[0]],
    [byKind.dataset, COL_X[1]],
    [byKind.paper, COL_X[2]],
  ];
  for (const [list, x] of cols) {
    const step = list.length > 1 ? height / (list.length - 1) : 0;
    list.forEach((n, i) => {
      const d = degree.get(n.id) ?? 0;
      placed.set(n.id, {
        ...n,
        x,
        y: list.length > 1 ? i * step : height / 2,
        r: n.kind === "dataset" ? 5 + Math.min(6, Math.sqrt(d)) : 3 + Math.min(4, Math.sqrt(d) * 0.8),
        degree: d,
      });
    });
  }
  return { placed, width: COL_X[2], height, counts: { award: byKind.award.length, dataset: byKind.dataset.length, paper: byKind.paper.length } };
}

function edgePath(a: Placed, b: Placed): string {
  const mx = (a.x + b.x) / 2;
  return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
}

export default function NetworkGraph({ data }: { data: NetworkData }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 960, h: 600 });
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.max(320, Math.floor(el.getBoundingClientRect().width));
      setSize({ w, h: Math.round(Math.min(720, Math.max(440, w * 0.6))) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const g = useMemo(() => layout(data), [data]);
  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of data.edges) {
      if (!m.has(e.source)) m.set(e.source, new Set());
      if (!m.has(e.target)) m.set(e.target, new Set());
      m.get(e.source)!.add(e.target);
      m.get(e.target)!.add(e.source);
    }
    return m;
  }, [data]);

  // View transform: screen = graph * k + t. The graph is far taller than it is wide, so
  // fitting it entirely would make every row a hairline. Start at a scale where rows
  // are still distinguishable, fit the width, and let the reader pan down.
  const fit = useMemo(() => {
    const fitW = (size.w - 2 * PAD) / (g.width || 1);
    const fitH = (size.h - 2 * PAD) / (g.height || 1);
    const k = Math.max(0.02, Math.min(3, Math.max(fitH, Math.min(fitW, 0.5))));
    const tall = g.height * k > size.h - 2 * PAD;
    return { k, tx: (size.w - g.width * k) / 2, ty: tall ? PAD : (size.h - g.height * k) / 2 };
  }, [size, g.width, g.height]);
  // The view is the fitted transform until the reader zooms or pans; then it is theirs
  // until they press Fit. Derived rather than synced so a resize refits untouched views.
  const [override, setOverride] = useState<typeof fit | null>(null);
  const view = override ?? fit;

  const zoomBy = useCallback(
    (factor: number, cx: number, cy: number) => {
      setOverride((o) => {
        const v = o ?? fit;
        const k = Math.max(0.02, Math.min(12, v.k * factor));
        const s = k / v.k;
        return { k, tx: cx - (cx - v.tx) * s, ty: cy - (cy - v.ty) * s };
      });
    },
    [fit],
  );

  // Wheel zoom needs a non-passive listener so the page does not scroll underneath.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState<Placed | null>(null);
  const [pinned, setPinned] = useState<Placed | null>(null);
  const active = pinned ?? hover;
  const activeSet = active ? neighbours.get(active.id) ?? new Set<string>() : null;

  const nodes = [...g.placed.values()];
  const showLabel = (n: Placed) => {
    if (active && (n.id === active.id || activeSet?.has(n.id))) return true;
    if (n.kind === "dataset") return view.k * ROW >= 9;
    return view.k * ROW >= 15;
  };
  const fontPx = 11 / view.k;

  const toScreen = (n: Placed) => ({ x: n.x * view.k + view.tx, y: n.y * view.k + view.ty });
  const tip = active ? toScreen(active) : null;

  return (
    <div ref={wrapRef} className="relative">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="viz-legend">
          <span>
            <span className="viz-swatch" style={{ background: "var(--viz-mute)", borderRadius: 1 }} />
            NCI award ({g.counts.award.toLocaleString("en-US")})
          </span>
          <span>
            <span className="viz-swatch dot" style={{ background: "var(--viz-1)" }} />
            Dataset ({g.counts.dataset.toLocaleString("en-US")})
          </span>
          <span>
            <span className="viz-swatch dot" style={{ background: "var(--viz-2)" }} />
            Underexplored dataset
          </span>
          <span>
            <span className="viz-swatch dot" style={{ background: "var(--viz-mute)", width: 7, height: 7 }} />
            Article ({g.counts.paper.toLocaleString("en-US")})
          </span>
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <button type="button" onClick={() => zoomBy(1.4, size.w / 2, size.h / 2)} className="rounded border px-2 py-0.5 hover:border-[var(--accent)]" style={{ borderColor: "var(--border-strong)" }} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomBy(1 / 1.4, size.w / 2, size.h / 2)} className="rounded border px-2 py-0.5 hover:border-[var(--accent)]" style={{ borderColor: "var(--border-strong)" }} aria-label="Zoom out">&minus;</button>
          <button
            type="button"
            onClick={() => {
              setOverride(null);
              setPinned(null);
            }}
            className="rounded border px-2 py-0.5 hover:border-[var(--accent)]"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Fit
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-3 text-[11px] font-medium uppercase tracking-wide t-faint">
        <span>NCI awards</span>
        <span className="text-center">Datasets</span>
        <span className="text-right">Articles</span>
      </div>
      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="block max-w-full select-none rounded-md border touch-none"
        style={{ background: "var(--bg-sunken)", cursor: dragging ? "grabbing" : "grab" }}
        role="img"
        aria-label={`Network of ${g.counts.award} NCI awards, ${g.counts.dataset} datasets and ${g.counts.paper} articles`}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
          setDragging(true);
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.abs(dx) + Math.abs(dy) > 2)
            setOverride((o) => ({ ...(o ?? fit), tx: d.tx + dx, ty: d.ty + dy }));
        }}
        onPointerUp={(e) => {
          drag.current = null;
          setDragging(false);
          (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
        }}
        onPointerLeave={() => {
          drag.current = null;
          setDragging(false);
          setHover(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPinned(null);
        }}
      >
        <g transform={`translate(${view.tx},${view.ty}) scale(${view.k})`}>
          {data.edges.map((e, i) => {
            const a = g.placed.get(e.source);
            const b = g.placed.get(e.target);
            if (!a || !b) return null;
            const on = active ? e.source === active.id || e.target === active.id : false;
            const strong = e.kind === "generation" || e.kind === "analyzed" || e.kind === "primary";
            return (
              <path
                key={i}
                d={edgePath(a, b)}
                fill="none"
                stroke={on ? "var(--viz-1)" : "var(--viz-mute)"}
                strokeWidth={(on ? 2 : strong ? 1 : 0.7) / view.k}
                strokeDasharray={e.kind === "reuse_funding" || e.kind === "weaker" ? `${4 / view.k} ${3 / view.k}` : undefined}
                opacity={active ? (on ? 0.95 : 0.06) : strong ? 0.35 : 0.22}
              />
            );
          })}
          {nodes.map((n) => {
            const isActive = active?.id === n.id;
            const isNear = activeSet?.has(n.id) ?? false;
            const dim = active ? !(isActive || isNear) : false;
            const fill =
              n.kind === "dataset" ? (n.underexplored ? "var(--viz-2)" : "var(--viz-1)") : "var(--viz-mute)";
            const rr = n.r + (isActive ? 3 : 0);
            return (
              <g
                key={n.id}
                opacity={dim ? 0.25 : 1}
                onPointerEnter={() => setHover(n)}
                onPointerLeave={() => setHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinned((p) => (p?.id === n.id ? null : n));
                }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={n.x} cy={n.y} r={Math.max(rr + 6, 12 / view.k)} fill="transparent" />
                {n.kind === "award" ? (
                  <rect x={n.x - rr} y={n.y - rr} width={rr * 2} height={rr * 2} rx={1.5} fill={fill} stroke="var(--bg-sunken)" strokeWidth={2 / view.k} />
                ) : (
                  <circle cx={n.x} cy={n.y} r={rr} fill={fill} stroke="var(--bg-sunken)" strokeWidth={2 / view.k} />
                )}
                {showLabel(n) && (
                  <text
                    x={n.kind === "award" ? n.x - rr - 5 / view.k : n.kind === "paper" ? n.x + rr + 5 / view.k : n.x}
                    y={n.kind === "dataset" ? n.y - rr - 4 / view.k : n.y + fontPx * 0.35}
                    textAnchor={n.kind === "award" ? "end" : n.kind === "paper" ? "start" : "middle"}
                    style={{
                      fontSize: fontPx,
                      fill: isActive ? "var(--text)" : "var(--text-muted)",
                      fontWeight: isActive || n.kind === "dataset" ? 500 : 400,
                      paintOrder: "stroke",
                      stroke: "var(--bg-sunken)",
                      strokeWidth: 3 / view.k,
                      strokeLinejoin: "round",
                      pointerEvents: "none",
                    }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {active && tip && !pinned && (
        <div
          className="viz-tip"
          style={{
            left: tip.x > size.w * 0.6 ? undefined : tip.x + 14,
            right: tip.x > size.w * 0.6 ? size.w - tip.x + 14 : undefined,
            top: Math.max(0, Math.min(size.h - 80, tip.y - 12)),
          }}
        >
          <div className="tip-title">{active.label}</div>
          {active.sub && <div>{active.sub}</div>}
          <div className="row">
            <span>{active.kind === "award" ? "Datasets funded" : active.kind === "dataset" ? "Connections" : "Datasets used"}</span>
            <b>{active.degree}</b>
          </div>
          <div className="mt-1 t-faint">Click to pin</div>
        </div>
      )}

      {pinned && (
        <div className="mt-3 rounded-md border p-3 text-[13px]" style={{ background: "var(--bg-raised)" }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide t-faint">
                {pinned.kind === "award" ? "NCI award" : pinned.kind === "dataset" ? "Dataset" : "Article"}
              </div>
              <div className="font-medium">{pinned.label}</div>
              {pinned.sub && <div className="t-muted">{pinned.sub}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {pinned.href && (
                <a
                  href={pinned.href}
                  target={pinned.href.startsWith("/") ? undefined : "_blank"}
                  rel={pinned.href.startsWith("/") ? undefined : "noopener noreferrer"}
                  className="rounded-md px-3 py-1.5 text-[12px] font-medium"
                  style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
                >
                  {pinned.kind === "award" ? "Open in RePORTER" : pinned.kind === "dataset" ? "Open dataset page" : "Open article"}
                </a>
              )}
              <button type="button" onClick={() => setPinned(null)} className="rounded-md border px-3 py-1.5 text-[12px]" style={{ borderColor: "var(--border-strong)" }}>
                Unpin
              </button>
            </div>
          </div>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {data.edges
              .filter((e) => e.source === pinned.id || e.target === pinned.id)
              .map((e, i) => {
                const otherId = e.source === pinned.id ? e.target : e.source;
                const other = g.placed.get(otherId);
                if (!other) return null;
                return (
                  <li key={i} className="flex items-baseline gap-2 text-[12px]">
                    <span className="viz-swatch dot shrink-0" style={{ background: other.kind === "dataset" ? (other.underexplored ? "var(--viz-2)" : "var(--viz-1)") : "var(--viz-mute)", borderRadius: other.kind === "award" ? 1 : 999, marginTop: 3 }} />
                    <span className="min-w-0">
                      <button type="button" className="truncate text-left hover:underline" style={{ color: "var(--accent)", maxWidth: "100%" }} onClick={() => setPinned(other)}>
                        {other.label}
                      </button>
                      <span className="t-faint"> {EDGE_LABEL[e.kind]}</span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}
