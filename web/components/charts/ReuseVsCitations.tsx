import Link from "next/link";

import { num } from "@/lib/format";
import type { ReuseChartRow, UntraceableRow } from "@/lib/reuse-chart";

/**
 * Citations against data reuse, one dataset per row, one shared scale.
 *
 * The grey bar is attention to the finding: articles citing the dataset's original
 * paper. The teal bar is use of the data: articles whose methods, results, tables or
 * figures name the accession. Both are counts of articles, so they share an axis, and
 * every bar carries its number because the largest row dwarfs the rest.
 *
 * A funder is named only when the record marks an award as having generated the data.
 * Rows whose awards are all infrastructure or reuse link to the funding list instead of
 * putting the wrong grant in the funder's place.
 */

const SHOWN = 8;
const MIN_BAR_PX = 3;

export function ReuseVsCitations({
  rows,
  untraceable,
  nDatasets,
  nNoAccession,
}: {
  rows: ReuseChartRow[];
  untraceable: UntraceableRow[];
  nDatasets: number;
  nNoAccession: number;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.cites, r.reuse]));
  const head = rows.slice(0, SHOWN);
  const tail = rows.slice(SHOWN);

  return (
    <div className="rounded-lg border" style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-b px-5 py-3 text-[12px] t-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-mute)" }} />
          Cited the paper (attention to the finding)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--viz-1)" }} />
          Analysed the data (accession in methods, results, a table or a figure)
        </span>
      </div>

      <ol className="divide-y px-5">
        {head.map((r) => (
          <Row key={r.id} row={r} max={max} />
        ))}
      </ol>
      {tail.length > 0 && (
        <details className="border-t px-5">
          <summary className="cursor-pointer py-2.5 text-[13px] font-medium">
            Show all {num(rows.length)} datasets with both numbers
          </summary>
          <ol className="divide-y border-t">
            {tail.map((r) => (
              <Row key={r.id} row={r} max={max} />
            ))}
          </ol>
        </details>
      )}

      {untraceable.length > 0 && (
        <div className="border-t px-5 py-3">
          <h3 className="text-[13px] font-medium">Cited thousands of times, reuse not traceable</h3>
          <p className="mt-1 text-[13px] t-muted">
            {untraceable.map((u, i) => (
              <span key={u.id}>
                {i > 0 && " · "}
                <Link href={`/datasets/${u.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                  {u.title}
                </Link>{" "}
                <span className="tnum">{num(u.cites)}</span>
              </span>
            ))}
          </p>
          <p className="mt-1 text-[12px] t-faint">
            No accession that articles quote, so data reuse cannot be measured. This is a limit
            of the measurement, not a finding about the dataset.
          </p>
        </div>
      )}

      <div className="border-t px-5 py-2.5 text-[12px] t-muted">
        A cited paper does not mean the data were reused.{" "}
        {num(nNoAccession)} of {num(nDatasets)} datasets have no accession that articles quote, so
        their use cannot be traced.{" "}
        <Link href="/methods#reuse" className="underline">
          Full method
        </Link>
        .
      </div>
    </div>
  );
}

function Row({ row: r, max }: { row: ReuseChartRow; max: number }) {
  return (
    <li className="grid gap-x-5 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <div className="min-w-0">
        <Link href={`/datasets/${r.id}`} className="text-[13px] font-medium hover:underline" style={{ color: "var(--accent)" }}>
          {r.title}
        </Link>
        {r.short && <div className="font-mono text-[10px] t-faint">{r.short}</div>}
      </div>
      <div className="min-w-0">
        <Bar value={r.cites} max={max} color="var(--viz-mute)" label="citations to the original paper" />
        <Bar value={r.reuse} max={max} color="var(--viz-1)" label="articles that analysed the data" strong />
        <p className="mt-1 text-[11px] t-faint">
          {r.awards.length > 0 ? (
            <>
              Generated with{" "}
              {r.awards.map((a, i) => (
                <span key={a.num}>
                  {i > 0 && ", "}
                  <Link
                    href={`/network?award=${encodeURIComponent(a.num)}`}
                    className="font-mono underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {a.num}
                  </Link>
                </span>
              ))}
            </>
          ) : r.nAwards > 0 ? (
            <>
              Awards on record: {num(r.nAwards)}, none marked as generating these data ·{" "}
              <Link href={`/datasets/${r.id}#provenance`} className="underline">
                funding list
              </Link>
            </>
          ) : (
            <>No NCI award linked to this record</>
          )}
        </p>
      </div>
    </li>
  );
}

function Bar({
  value,
  max,
  color,
  label,
  strong = false,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  strong?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (100 * value) / max));
  return (
    <span className="flex items-center gap-2" title={`${num(value)} ${label}`}>
      <span className="bar-track min-w-0 flex-1" style={{ height: 9 }}>
        <i style={{ width: `${pct}%`, minWidth: value > 0 ? MIN_BAR_PX : 0, background: color }} />
      </span>
      <span className={`viz-value w-16 text-right ${strong ? "font-semibold" : "t-muted"}`}>{num(value)}</span>
    </span>
  );
}
