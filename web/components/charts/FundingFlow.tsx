"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { NetworkData, NetworkEdge, NetworkNode } from "@/lib/types";

/**
 * Money in, the data, what was published from it, and the money that paid for that -
 * four columns, read left to right.
 *
 * The nodes are real HTML cards and the connectors are an SVG drawn behind them from
 * their measured positions. The obvious alternative, and what this replaced, was an
 * all-SVG graph of circles with labels that appeared only past a zoom threshold. That
 * shape has three costs a funding graph cannot afford: an award number is unreadable
 * until you have already found it, nothing in it is selectable or linkable without
 * bespoke handlers, and at the fitted zoom a busy dataset renders as a grey haze with
 * one legible column. Cards give real text at a real size, links that behave like
 * links, keyboard focus for free, and a layout that reflows at phone width.
 *
 * Below `lg` the columns stack and the connectors are dropped rather than redrawn
 * vertically: a four-stage flow folded into one column is a list, and a list with
 * curves drawn over it is a worse list.
 */

type LaneKey = "generation" | "dataset" | "article" | "enabled";

/**
 * Which accent a card's left rule takes.
 *
 * Position alone is not enough: in the four-lane dataset view an award in the first
 * column paid to create the data and one in the last was paid out of it, while in the
 * three-lane award view the first column is the award and the last is articles. The kind
 * settles what a node is and the position settles which side of the flow it sits on.
 */
function laneKeyFor(node: NetworkNode, lane: number, laneCount: number): LaneKey {
  if (node.kind === "dataset") return "dataset";
  if (node.kind === "paper") return "article";
  return lane >= laneCount - 1 ? "enabled" : "generation";
}

/** The width at which the four lanes sit side by side. Matches Tailwind's `lg`. */
const SIDE_BY_SIDE = "(min-width: 1024px)";

/** Edge kinds whose evidence is direct rather than circumstantial. */
const STRONG: ReadonlySet<NetworkEdge["kind"]> = new Set([
  "generation",
  "primary",
  "analyzed",
]);

const EDGE_LABEL: Record<NetworkEdge["kind"], string> = {
  generation: "paid to create this data",
  reuse_funding: "funded this article",
  infrastructure: "funds the infrastructure that holds it",
  primary: "the dataset's own paper",
  analyzed: "analyzed the data",
  weaker: "mentioned or declared use",
};

type Box = { x: number; y: number; w: number; h: number };

export default function FundingFlow({ data }: { data: NetworkData }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLElement>());
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map());
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [stacked, setStacked] = useState(false);

  const lanes = data.lanes;
  const byLane = useMemo(
    () => lanes.map((_, i) => data.nodes.filter((n) => n.lane === i)),
    [data.nodes, lanes],
  );

  /** Every node reachable in one hop, so hovering one card dims the unrelated ones. */
  const neighbours = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of data.edges) {
      if (!m.has(e.source)) m.set(e.source, new Set());
      if (!m.has(e.target)) m.set(e.target, new Set());
      m.get(e.source)!.add(e.target);
      m.get(e.target)!.add(e.source);
    }
    return m;
  }, [data.edges]);

  const measure = useCallback(() => {
    const root = wrap.current;
    if (!root) return;
    const base = root.getBoundingClientRect();
    setSize({ w: base.width, h: base.height });
    // Below `lg` the lanes stack, and a connector drawn between stacked cards would run
    // straight down the page through the text. Same breakpoint as the grid below.
    setStacked(!window.matchMedia(SIDE_BY_SIDE).matches);
    const next = new Map<string, Box>();
    for (const [id, el] of cards.current) {
      const r = el.getBoundingClientRect();
      next.set(id, { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
    }
    setBoxes(next);
  }, []);

  useLayoutEffect(measure, [measure, data]);

  useEffect(() => {
    const root = wrap.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    for (const el of cards.current.values()) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) cards.current.set(id, el);
    else cards.current.delete(id);
  };

  const active = hover;
  const near = active ? (neighbours.get(active) ?? new Set<string>()) : null;
  const dim = (id: string) => Boolean(active) && id !== active && !near?.has(id);

  return (
    <div>
      {/* Column headings. A grid with the same template as the flow, so a heading always
          sits over the column it names - including when the browser has not yet
          measured anything. */}
      <div
        className="mb-3 hidden gap-x-12 lg:grid"
        style={{ gridTemplateColumns: laneTemplate(lanes.length) }}
      >
        {lanes.map((lane, i) => (
          <div key={lane.label}>
            <div className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-micro font-bold tnum"
                style={{ background: "var(--bg-sunken)", color: "var(--text-muted)" }}
              >
                {i + 1}
              </span>
              <h3 className="text-body font-semibold leading-snug">
                {lane.label}
                {byLane[i].length > 1 && (
                  <span className="tnum t-faint"> ({byLane[i].length})</span>
                )}
              </h3>
            </div>
            {lane.hint && <p className="mt-1 pl-8 text-meta t-muted">{lane.hint}</p>}
          </div>
        ))}
      </div>

      <div ref={wrap} className="relative" onPointerLeave={() => setHover(null)}>
        {/* Connectors, behind the cards. */}
        {!stacked && size.w > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            width={size.w}
            height={size.h}
            aria-hidden
            focusable="false"
          >
            <defs>
              <marker id="ff-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0.5 7 4 0 7.5Z" fill="var(--viz-1)" />
              </marker>
              <marker id="ff-arrow-mute" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0.5 7 4 0 7.5Z" fill="var(--viz-mute)" />
              </marker>
            </defs>
            {data.edges.map((e, i) => {
              const a = boxes.get(e.source);
              const b = boxes.get(e.target);
              if (!a || !b) return null;
              const on = active ? e.source === active || e.target === active : false;
              const off = Boolean(active) && !on;
              const strong = STRONG.has(e.kind);
              const x1 = a.x + a.w;
              const y1 = a.y + a.h / 2;
              const x2 = b.x;
              const y2 = b.y + b.h / 2;
              const mid = x1 + (x2 - x1) / 2;
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2 - 7},${y2}`}
                  fill="none"
                  stroke={on ? "var(--viz-1)" : "var(--viz-mute)"}
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeDasharray={strong ? undefined : "5 4"}
                  markerEnd={`url(#${on ? "ff-arrow" : "ff-arrow-mute"})`}
                  opacity={off ? 0.12 : on ? 0.95 : strong ? 0.6 : 0.3}
                />
              );
            })}
          </svg>
        )}

        <div
          className="relative grid gap-y-10 lg:gap-x-12"
          style={stacked ? undefined : { gridTemplateColumns: laneTemplate(lanes.length) }}
        >
          {byLane.map((laneNodes, i) => (
            <section
              key={lanes[i].label}
              aria-labelledby={`flow-lane-${i}`}
              className={
                laneNodes.length === 1 && laneNodes[0].focus ? "lg:self-center" : undefined
              }
            >
                {/* The heading above is hidden below `lg`, where the columns stack and
                    each one needs its own. */}
              {/* Hidden above `lg`, where the column headings outside the flow name
                  each lane once. Below it, the columns stack and each needs its own. */}
              <h3 id={`flow-lane-${i}`} className="mb-2.5 text-body font-semibold lg:sr-only">
                <span className="t-faint">{i + 1}. </span>
                {lanes[i].label}
                {laneNodes.length > 1 && (
                  <span className="tnum t-faint"> ({laneNodes.length})</span>
                )}
              </h3>
              {laneNodes.length === 0 ? (
                <p
                  className="rounded-lg border border-dashed px-3.5 py-3 text-meta t-muted"
                  style={{ borderColor: "var(--border-strong)" }}
                >
                  {lanes[i].empty ?? "Nothing recorded."}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {laneNodes.map((n) => (
                    <li key={n.id}>
                      <NodeCard
                        node={n}
                        laneKey={laneKeyFor(n, i, lanes.length)}
                        innerRef={register(n.id)}
                        dimmed={dim(n.id)}
                        activeSelf={active === n.id}
                        onEnter={() => setHover(n.id)}
                        onLeave={() => setHover(null)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {lanes[i].more ? (
                <p className="mt-2.5 text-meta t-faint">
                  and {lanes[i].more?.toLocaleString("en-US")} more, not drawn. The most
                  connected are shown first.
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </div>

      <div className="viz-legend mt-5 border-t pt-3">
        <span>
          <span className="viz-swatch line" style={{ color: "var(--viz-mute)" }} />
          Direct evidence: the award is on the paper, or the accession is in the article
        </span>
        <span>
          <span className="viz-swatch line dashed" style={{ color: "var(--viz-mute)" }} />
          Weaker: infrastructure support, or use declared but not shown
        </span>
        <span className="t-faint">Hover any card to follow its chain</span>
      </div>
    </div>
  );
}

/** `repeat(n, minmax(0,1fr))`, spelled out so a lane never collapses below zero width. */
function laneTemplate(n: number): string {
  return `repeat(${n}, minmax(0, 1fr))`;
}

function NodeCard({
  node,
  laneKey,
  innerRef,
  dimmed,
  activeSelf,
  onEnter,
  onLeave,
}: {
  node: NetworkNode;
  laneKey: LaneKey;
  innerRef: (el: HTMLElement | null) => void;
  dimmed: boolean;
  activeSelf: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const focus = node.focus === true;
  const external = Boolean(node.href && !node.href.startsWith("/"));
  const body = (
    <>
      <span
        className={`block font-semibold ${
          node.kind === "award" ? "font-mono " : ""
        }${focus ? "text-title" : "text-body"}`}
        style={{ color: node.kind === "dataset" ? "var(--accent)" : "var(--text)" }}
      >
        {node.label}
      </span>
      {node.sub && (
        <span className="mt-1 block text-meta leading-snug t-muted" style={{ overflowWrap: "anywhere" }}>
          {node.sub}
        </span>
      )}
      {node.meta && <span className="mt-1 block text-micro t-faint">{node.meta}</span>}
    </>
  );

  const rule =
    laneKey === "dataset"
      ? "var(--accent)"
      : laneKey === "generation"
        ? "var(--viz-1)"
        : laneKey === "enabled"
          ? "var(--viz-mute)"
          : "var(--border-strong)";

  const style: React.CSSProperties = {
    background: focus ? "var(--accent-bg)" : "var(--bg-raised)",
    borderColor: activeSelf ? "var(--viz-1)" : "var(--border)",
    borderLeftColor: rule,
    boxShadow: focus ? "var(--shadow-card)" : undefined,
    opacity: dimmed ? 0.35 : 1,
  };

  const shared = {
    ref: innerRef as never,
    className: "block rounded-lg border border-l-4 px-3.5 py-3 transition-opacity",
    style,
    onPointerEnter: onEnter,
    onPointerLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
  };

  if (!node.href) {
    return <div {...shared}>{body}</div>;
  }
  if (external) {
    return (
      <a {...shared} href={node.href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    );
  }
  return (
    <Link {...shared} href={node.href}>
      {body}
    </Link>
  );
}

export { EDGE_LABEL };
