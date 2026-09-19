import Link from "next/link";
import type { ReactNode } from "react";

import { num } from "@/lib/format";

/**
 * A ranked list with a bar per row. Rank, name and value are all text, so the bar is a
 * second reading of the number rather than the only one.
 */

export type LeaderRow = {
  id: string;
  short: string;
  title: string;
  value: number;
};

export function Leaderboard({
  title,
  lede,
  rows,
  unit,
  tone = "primary",
  footer,
}: {
  title: string;
  lede: string;
  rows: LeaderRow[];
  unit: string;
  tone?: "primary" | "muted";
  footer?: ReactNode;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const color = tone === "primary" ? "var(--viz-1)" : "var(--viz-mute)";
  return (
    <div className="rounded-lg border" style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-card)" }}>
      <div className="border-b px-5 py-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="text-[12px] t-muted">{lede}</p>
      </div>
      <ol className="px-5 py-3">
        {rows.map((r, i) => (
          <li key={r.id} className="grid items-center gap-x-4 gap-y-0.5 py-2" style={{ gridTemplateColumns: "26px minmax(0, 1fr) 72px" }}>
            <span
              className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold tnum"
              style={{ background: i === 0 ? color : "var(--bg-sunken)", color: i === 0 ? "var(--bg-raised)" : "var(--text-muted)" }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-baseline gap-2">
                <Link href={`/datasets/${r.id}`} className="truncate text-[13px] font-medium hover:underline" style={{ color: "var(--accent)" }}>
                  {r.title}
                </Link>
                <span className="shrink-0 font-mono text-[10px] t-faint">{r.short}</span>
              </div>
              <span className="bar-track mt-1" style={{ height: 10 }}>
                <i style={{ width: `${(100 * r.value) / max}%`, background: color }} />
              </span>
            </div>
            <span className="text-right">
              <span className="block text-[15px] font-semibold tnum">{num(r.value)}</span>
              <span className="block text-[10px] uppercase tracking-wide t-faint">{unit}</span>
            </span>
          </li>
        ))}
      </ol>
      {footer && <div className="border-t px-5 py-2.5 text-[12px] t-muted">{footer}</div>}
    </div>
  );
}
