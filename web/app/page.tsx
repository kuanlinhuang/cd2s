import Link from "next/link";

import { PairedDots } from "@/components/charts/PairedDots";
import DatasetAgent from "@/components/DatasetAgent";
import { Card, Chip, DatasetLink, UnderexploredBadge } from "@/components/ui";
import { getIndex, getQuestions, getShowcase, getStats } from "@/lib/data";
import { modalityLabel, num, SCARCE_MODALITIES } from "@/lib/format";

/**
 * The landing page is a front door: one headline, the dataset agent, a hub of the
 * site's sections, a leaderboard of the most cited and the most reused datasets with
 * how reuse is determined, and the reviewed datasets. Measurements and their
 * diagnostics live on the pages they belong to.
 */

export default function Home() {
  const stats = getStats();
  const index = getIndex();
  const showcase = getShowcase().slice(0, 3);
  const nQuestions = getQuestions().length;
  const nMultimodal = index.filter((r) => r.n_modalities >= 3).length;
  const nScarce = index.filter((r) => r.modalities.some((m) => SCARCE_MODALITIES.has(m))).length;

  // Both bars have to be measurable for the comparison to mean anything, so this is
  // ranked among the datasets that carry both numbers. A dataset with no citable
  // accession has untraceable reuse, and drawing that as a short bar beside a long
  // citation bar would read as "barely used" when the truth is "cannot be counted".
  const citedAndUsed = [...index]
    .filter((r) => (r.n_citations_to_primary_publication ?? 0) > 0 && (r.n_verified_reuse ?? 0) > 0)
    .sort((a, b) => (b.n_verified_reuse ?? 0) - (a.n_verified_reuse ?? 0))
    .slice(0, 28)
    .map((r) => ({
      id: r.id,
      label: r.short_title ?? r.title,
      sub: r.short_title ? r.title : null,
      href: `/datasets/${r.id}`,
      values: {
        cited: r.n_citations_to_primary_publication ?? 0,
        used: r.n_verified_reuse ?? 0,
      },
    }));

  const sections = [
    { href: "/datasets", title: "Browse datasets", count: num(stats.n_datasets), body: "Filter by what you need to do: survival, treatment response, imaging with molecular data, open access." },
    { href: "/questions", title: "Start from a question", count: num(nQuestions), body: "Reviewed research questions, each with the dataset that can answer it and the usable sample size." },
    { href: "/underexplored", title: "Underexplored datasets", count: num(stats.n_underexplored), body: "Reused far less than comparable datasets, with the chart and the model behind the label." },
    { href: "/network", title: "Funding to findings", count: num(stats.n_grants_linked), body: "For any dataset: the award that paid to create it, and the awards its reuse went on to fund." },
    { href: "/compare", title: "Compare side by side", count: "4 at a time", body: "Pick candidates on the browse page and see only where they differ." },
    { href: "/agents", title: "For agents", count: "JSON, Croissant, briefs", body: "Every page as structured data, constraints first, with open search and agent endpoints." },
  ];

  const capabilities = [
    { href: "/datasets?capability=survival", label: "Survival analysis", n: stats.n_with_survival },
    { href: "/datasets?capability=treatment", label: "Treatment response", n: stats.n_with_treatment_response },
    { href: "/datasets?capability=multimodal", label: "Three or more measurement types", n: nMultimodal },
    { href: "/datasets?capability=scarce", label: "A scarce measurement", n: nScarce },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      {/* Centred, because the question box is the one thing to do here and a centre
          line is the only place a single control does not read as the left-hand edge of
          a form with more fields further right. Everything below the fold goes back to
          the left margin, where prose belongs. */}
      <section className="pt-14 pb-12 text-center">
        <p className="mb-3 text-meta font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--accent)" }}>
          Cancer Data Showcase
        </p>
        <h1 className="mx-auto max-w-[26ch] text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Find NCI-funded datasets for your research.
        </h1>
        <p className="mx-auto mt-5 max-w-[62ch] text-title leading-relaxed t-muted">
          {num(stats.n_datasets)} datasets from {stats.n_repositories} repositories, each
          described by what it can support, what it cannot, who has already used it, and
          how to start. Every claim links to its source.
        </p>

        <div className="mt-8">
          <DatasetAgent />
        </div>

        <p className="mt-10 mb-3 text-meta font-medium uppercase tracking-wider t-faint">
          Or start from what the data has to support
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-body">
          {capabilities.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              {c.label}
              <span className="tnum font-semibold" style={{ color: "var(--accent)" }}>
                {num(c.n)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ cited vs used */}
      <section className="border-t py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Cited, and actually used</h2>
          <Link href="/methods#reuse" className="text-body underline">
            How data use is determined
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
            figures; the line between the dots is the gap between a paper being cited and
            its data being used. The {num(stats.n_without_citable_accession)} datasets with
            no citable accession are absent here rather than at zero.
          </p>
        </Card>
      </section>

      {/* ----------------------------------------------------------- section hub */}
      <section className="border-t py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-colors group-hover:border-[var(--accent)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-title font-semibold">{s.title}</h2>
                  <span className="tnum shrink-0 text-meta font-semibold" style={{ color: "var(--accent)" }}>
                    {s.count}
                  </span>
                </div>
                <p className="mt-2 text-body t-muted">{s.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- reviewed in depth */}
      <section className="border-t py-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Reviewed in depth</h2>
          <Link href="/datasets?capability=reviewed" className="text-body underline">
            All {stats.n_showcase}
          </Link>
        </div>
        <p className="mt-1 mb-4 text-body t-muted">
          Research questions, limitations and reuse checked against the source. Each has a
          runnable starting point.
        </p>
        <div className="grid gap-3 lg:grid-cols-3">
          {showcase.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <DatasetLink id={r.id}>{r.title}</DatasetLink>
                {r.is_underexplored && <UnderexploredBadge />}
              </div>
              <p className="mt-1.5 line-clamp-3 text-body t-muted">{r.one_liner ?? r.summary?.slice(0, 150)}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.modalities.slice(0, 4).map((m) => (
                  <Chip key={m} tone={SCARCE_MODALITIES.has(m) ? "scarce" : "neutral"}>
                    {modalityLabel(m)}
                  </Chip>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
