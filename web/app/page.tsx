import Link from "next/link";

import { Leaderboard } from "@/components/charts/Leaderboard";
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

  const mostCited = [...index]
    .filter((r) => r.n_citations_to_primary_publication)
    .sort((a, b) => (b.n_citations_to_primary_publication ?? 0) - (a.n_citations_to_primary_publication ?? 0))
    .slice(0, 6);
  const mostReused = [...index]
    .filter((r) => r.has_citable_accession && r.n_verified_reuse)
    .sort((a, b) => (b.n_verified_reuse ?? 0) - (a.n_verified_reuse ?? 0))
    .slice(0, 6);
  const leader = (rows: typeof index, value: (r: (typeof index)[number]) => number) =>
    rows.map((r) => ({ id: r.id, short: r.short_title ?? "", title: r.title, value: value(r) }));

  const sections = [
    { href: "/datasets", title: "Browse datasets", count: num(stats.n_datasets), body: "Filter by what you need to do: survival, treatment response, imaging with molecular data, open access." },
    { href: "/questions", title: "Start from a question", count: num(nQuestions), body: "Reviewed research questions, each with the dataset that can answer it and the usable sample size." },
    { href: "/underexplored", title: "Underexplored datasets", count: num(stats.n_underexplored), body: "Reused far less than comparable datasets, with the chart and the model behind the label." },
    { href: "/network", title: "Funding to findings", count: num(stats.n_grants_linked), body: "Pick an NCI award and see the datasets it paid for and the articles that used them." },
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
      <section className="pt-14 pb-10">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Cancer Data Showcase
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl">
          Find NCI-funded datasets for your research.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed t-muted">
          {num(stats.n_datasets)} datasets from {stats.n_repositories} repositories, each
          described by what it can support, what it cannot, who has already used it, and
          how to start. Every claim links to its source.
        </p>

        <div className="mt-6">
          <DatasetAgent />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="t-faint">Datasets with</span>
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
        </div>
      </section>

      {/* ------------------------------------------------------------ leaderboard */}
      <section className="border-t py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Most cited, most used</h2>
          <Link href="/methods#reuse" className="text-[13px] underline">
            How data use is determined
          </Link>
        </div>
        <p className="mt-1 mb-5 max-w-3xl text-[13px] t-muted">
          Two different things. Citing a dataset&rsquo;s paper is attention to the finding.
          Using the data is what the right column counts: the accession appears in an
          article&rsquo;s methods, results, a table or a figure. A mention in the
          introduction or the reference list is a citation, not use.
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <Leaderboard
            title="Most cited publications"
            lede="Citations to the dataset's original paper, from Europe PMC."
            rows={leader(mostCited, (r) => r.n_citations_to_primary_publication ?? 0)}
            unit="citations"
            tone="muted"
            footer={<>Attention to the finding. A cited paper does not mean the data were reused.</>}
          />
          <Leaderboard
            title="Most confirmed data reuse"
            lede="Articles whose methods, results, tables or figures name the dataset's accession."
            rows={leader(mostReused, (r) => r.n_verified_reuse ?? 0)}
            unit="articles"
            footer={
              <>
                {num(stats.n_without_citable_accession)} of {num(stats.n_datasets)} datasets have no
                accession that articles quote, so their use cannot be traced.{" "}
                <Link href="/methods#reuse" className="underline">
                  Full method
                </Link>
                .
              </>
            }
          />
        </div>
      </section>

      {/* ----------------------------------------------------------- section hub */}
      <section className="border-t py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-colors group-hover:border-[var(--accent)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-medium">{s.title}</h2>
                  <span className="tnum shrink-0 text-[12px] font-medium" style={{ color: "var(--accent)" }}>
                    {s.count}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] t-muted">{s.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- reviewed in depth */}
      <section className="border-t py-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Reviewed in depth</h2>
          <Link href="/datasets?capability=reviewed" className="text-[13px] underline">
            All {stats.n_showcase}
          </Link>
        </div>
        <p className="mt-1 mb-4 text-[13px] t-muted">
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
              <p className="mt-1.5 line-clamp-3 text-[13px] t-muted">{r.one_liner ?? r.summary?.slice(0, 150)}</p>
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
