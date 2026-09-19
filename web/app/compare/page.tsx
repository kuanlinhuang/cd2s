import type { Metadata } from "next";
import Link from "next/link";

import CompareTable from "@/components/CompareTable";
import { EmptyState } from "@/components/ui";
import { getIndex, getRecord } from "@/lib/data";
import { type FitVerdictSlim, fitVerdicts, slimVerdict } from "@/lib/fit";

export const metadata: Metadata = {
  title: "Compare datasets",
  description:
    "Compare candidate NCI-supported datasets side by side, with differences surfaced " +
    "rather than buried.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ids) ? sp.ids[0] : sp.ids;
  const ids = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const index = getIndex();
  const rows = ids
    .map((id) => index.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  // The six analysis verdicts per column. Evidence is dropped: the compare table has
  // no room for chips, and every verdict links back to the page that carries them.
  const fits: Record<string, FitVerdictSlim[]> = {};
  for (const r of rows) {
    const rec = getRecord(r.id);
    if (rec) fits[r.id] = fitVerdicts(rec).map(slimVerdict);
  }

  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Compare datasets</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Choosing between cohorts usually comes down to two or three differences. This
          view hides what they share and stars the measurements unique to each. Pick up
          to four datasets on the{" "}
          <Link href="/datasets" className="underline">
            browse page
          </Link>
          .
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState>
          No datasets selected. Tick the boxes on the{" "}
          <Link href="/datasets" className="underline">
            browse page
          </Link>{" "}
          and choose &ldquo;Compare side by side&rdquo;, or pass ids directly as{" "}
          <code className="font-mono text-[12px]">?ids=a,b,c</code>.
        </EmptyState>
      ) : rows.length === 1 ? (
        <EmptyState>
          Only one dataset selected. Add another to compare, or open{" "}
          <Link href={`/datasets/${rows[0].id}`} className="underline">
            {rows[0].title}
          </Link>{" "}
          on its own page.
        </EmptyState>
      ) : (
        <CompareTable rows={rows} fits={fits} />
      )}
    </>
  );
}
