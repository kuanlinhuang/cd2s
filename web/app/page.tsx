import Link from "next/link";

import AskBox from "@/components/AskBox";
import { PairedDots } from "@/components/charts/PairedDots";
import { Card } from "@/components/ui";
import { getIndex, getQuestions, getRecord, getStats } from "@/lib/data";
import { SCARCE_MODALITIES, num } from "@/lib/format";
import { reuseChartRows, untraceableTopCited } from "@/lib/reuse-chart";

/**
 * The front door is the question box. Above the fold: one headline, the box, and the
 * needs a visitor can start from instead. Below it, one section on data reuse. The
 * other pages are destinations the answer routes to, not a menu to decode here.
 */

export default function Home() {
  const stats = getStats();
  const index = getIndex();
  const nQuestions = getQuestions().length;
  const nMultimodal = index.filter((r) => r.n_modalities >= 3).length;
  const nScarce = index.filter((r) => r.modalities.some((m) => SCARCE_MODALITIES.has(m))).length;

  const capabilities = [
    { href: "/datasets?capability=survival", label: "Survival analysis", n: stats.n_with_survival },
    { href: "/datasets?capability=treatment", label: "Treatment response", n: stats.n_with_treatment_response },
    { href: "/datasets?capability=multimodal", label: "Three or more measurement types", n: nMultimodal },
    { href: "/datasets?capability=scarce", label: "A scarce measurement", n: nScarce },
  ];

  // Rows come from `reuseChartRows`, which decides what counts as a comparison: both
  // numbers measured, a citable accession, and a measured zero kept rather than dropped -
  // a dataset cited and never reused is the sharpest form of the point, and excluding it
  // would quietly remove the rows that make it. Ordered here by use rather than by
  // citations, so the chart answers "most used" and the citation dot shows what that
  // attention was worth.
  const citedAndUsed = reuseChartRows(index, getRecord)
    .sort((a, b) => b.reuse - a.reuse || b.cites - a.cites)
    .slice(0, 28)
    .map((r) => ({
      id: r.id,
      label: r.short ?? r.title,
      sub: [r.short ? r.title : null, r.awards.length > 0 ? `funded by ${r.awards.map((a) => a.num).join(", ")}` : null]
        .filter(Boolean)
        .join(" \u00b7 "),
      href: `/datasets/${r.id}`,
      values: { cited: r.cites, used: r.reuse },
    }));
  const untraceable = untraceableTopCited(index, 5);

  return (
    <>
      {/* ---------------------------------------------------------------- ask */}
      {/* Centred, because the question box is the one thing to do here and a centre line
          is the only place a single control does not read as the left-hand edge of a form
          with more fields further right. Everything below the fold goes back to the left
          margin, where prose belongs. */}
      <section className="pt-14 pb-12 text-center">
        <h1 className="mx-auto max-w-[26ch] text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Which NCI dataset can answer your question?
        </h1>
        <p className="mx-auto mt-5 max-w-[62ch] text-title leading-relaxed t-muted">
          {num(stats.n_datasets)} datasets from {stats.n_repositories} repositories. Every
          answer says what a dataset can support, what it cannot, and where that claim comes
          from.
        </p>

        <div className="mx-auto mt-8 max-w-[760px] text-left">
          <AskBox examples />
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5 text-body">
          <span className="t-faint">Or start from</span>
          {capabilities.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              {c.label}
              <span className="tnum font-medium" style={{ color: "var(--accent)" }}>
                {num(c.n)}
              </span>
            </Link>
          ))}
          <Link href="/datasets" className="underline">
            All {num(stats.n_datasets)} datasets
          </Link>
          <Link href="/questions" className="underline">
            {num(nQuestions)} reviewed questions
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- reuse */}
      <section className="border-t py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Data reuse</h2>
          <Link href="/methods#reuse" className="text-body underline">
            How reuse is measured
          </Link>
        </div>
        <Card className="mt-4">
          <PairedDots
            rows={citedAndUsed}
            series={[
              {
                key: "cited",
                label: "Citations to its paper",
                shortLabel: "Cited",
                color: "var(--viz-mute)",
                note: "attention to the finding",
              },
              {
                key: "used",
                label: "Articles that used the data",
                shortLabel: "Used",
                color: "var(--viz-1)",
                note: "the accession appears in their methods, results, a table or a figure",
              },
            ]}
            unit="articles"
          />
          <p className="mt-4 border-t pt-3 text-meta t-muted">
            The {num(citedAndUsed.length)} most used datasets whose reuse can be counted at
            all. The axis steps by decade, because these counts run from thousands to single
            figures; the line between the dots is the gap between a paper being cited and its
            data being used.
          </p>
          <p className="mt-2 text-meta t-muted">
            {num(stats.n_without_citable_accession)} of {num(stats.n_datasets)} datasets
            quote no accession an article could cite, so their reuse cannot be measured and
            they are absent here rather than at zero - the most cited of them being{" "}
            {untraceable.map((u, i) => (
              <span key={u.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/datasets/${u.id}`} className="underline">
                  {u.short ?? u.title}
                </Link>{" "}
                <span className="tnum t-faint">{num(u.cites)}</span>
              </span>
            ))}
            .
          </p>
        </Card>
      </section>
    </>
  );
}
