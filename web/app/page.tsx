import Link from "next/link";

import AskBox from "@/components/AskBox";
import NotebookGallery from "@/components/NotebookGallery";
import { PairedDots } from "@/components/charts/PairedDots";
import { Card } from "@/components/ui";
import {
  getFacets,
  getIndex,
  getNotebookGuides,
  getQuestions,
  getRecord,
  getStats,
  getUnderexplored,
} from "@/lib/data";
import { SCARCE_MODALITIES, num } from "@/lib/format";
import { mostReused, reuseChartRows, untraceableTopCited } from "@/lib/reuse-chart";

function ArrowIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden focusable="false">
      <path d="M1 6h14M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BridgeStep({
  number,
  title,
  body,
  last = false,
}: {
  number: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div className="bridge-step relative p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-meta font-bold"
          style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
        >
          {number}
        </span>
        {!last && (
          <span className="ml-auto hidden md:block t-faint">
            <ArrowIcon />
          </span>
        )}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-meta t-muted">{body}</p>
    </div>
  );
}

export default function Home() {
  const stats = getStats();
  const index = getIndex();
  const nQuestions = getQuestions().length;
  const nMultimodal = index.filter((r) => r.n_modalities >= 3).length;
  const nScarce = index.filter((r) => r.modalities.some((m) => SCARCE_MODALITIES.has(m))).length;
  const notebooks = getNotebookGuides();
  const repositories = (getFacets().repository ?? []).map((f) => f.value);

  const capabilities = [
    { href: "/datasets?capability=survival", label: "Survival analysis", n: stats.n_with_survival },
    { href: "/datasets?capability=treatment", label: "Treatment response", n: stats.n_with_treatment_response },
    { href: "/datasets?capability=multimodal", label: "3+ data types", n: nMultimodal },
    { href: "/datasets?capability=scarce", label: "Rare measurements", n: nScarce },
  ];

  const reuseRows = reuseChartRows(index, getRecord);
  const successStories = mostReused(index, 3);
  const opportunities = getUnderexplored(3);
  const citedAndUsed = [...reuseRows]
    .sort((a, b) => b.reuse - a.reuse || b.cites - a.cites)
    .slice(0, 14)
    .map((r) => ({
      id: r.id,
      label: r.short ?? r.title,
      sub: [
        r.short ? r.title : null,
        r.awards.length > 0 ? `funded by ${r.awards.map((a) => a.num).join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" \u00b7 "),
      href: `/datasets/${r.id}`,
      values: { cited: r.cites, used: r.reuse },
    }));
  const untraceable = untraceableTopCited(index, 3);
  const featuredNotebooks = notebooks.filter((guide) => guide.featured);

  return (
    <>
      <section className="home-hero relative -mx-4 overflow-hidden border-b px-4 pb-14 pt-12 sm:-mx-6 sm:px-6 sm:pb-16 sm:pt-16">
        <div className="relative z-10 mx-auto max-w-[970px] text-center">
          <p className="text-meta font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
            A research layer for NIH and NCI cancer data
          </p>
          <h1 className="mx-auto mt-3 max-w-[23ch] text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From a research question to the right cancer data
          </h1>
          <p className="mx-auto mt-5 max-w-[70ch] text-lede leading-relaxed t-muted">
            Public repositories make hundreds of cancer datasets available. Cancer Data
            Showcase helps you decide which dataset, or combination of datasets, can answer
            your question, what will block the analysis, and how to turn the data into a
            reproducible starting point.
          </p>

          <div className="mx-auto mt-8 max-w-[790px] text-left">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
              <p className="font-medium">Describe the analysis you want to run</p>
              <p className="text-meta t-muted">Start with the question, not the repository</p>
            </div>
            <AskBox examples />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-body">
            <span className="mr-1 text-meta t-faint">Explore by capability</span>
            {capabilities.map((capability) => (
              <Link
                key={capability.href}
                href={capability.href}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:border-[var(--accent)]"
                style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
              >
                {capability.label}
                <span className="tnum font-medium" style={{ color: "var(--accent)" }}>
                  {num(capability.n)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              Built on what already exists
            </p>
            <h2 className="mt-2 max-w-[22ch] text-2xl font-semibold tracking-tight">
              NIH makes data available. CDS makes it easier to use well.
            </h2>
          </div>
          <p className="max-w-[68ch] text-lede t-muted">
            This is not another repository. It connects records from existing resources,
            measures whether the fields needed for an analysis are truly informative, traces
            real reuse, and gives researchers an executable route into the data.
          </p>
        </div>

        <div className="mt-7 overflow-hidden rounded-xl border" style={{ background: "var(--bg-raised)" }}>
          <div className="border-b px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-meta font-medium t-muted">Connected resources</span>
              {repositories.map((repository) => (
                <span
                  key={repository}
                  className="rounded-full border px-2.5 py-1 font-mono text-micro font-semibold"
                  style={{ borderColor: "var(--border-strong)", background: "var(--bg-sunken)" }}
                >
                  {repository}
                </span>
              ))}
              <span className="ml-auto text-meta t-muted">
                {num(stats.n_datasets)} datasets, one decision layer
              </span>
            </div>
          </div>
          <div className="grid md:grid-cols-4 md:divide-x">
            <BridgeStep number="01" title="Ask a research question" body="State the disease, analysis, measurements, population and access constraints." />
            <BridgeStep number="02" title="Find the right data" body="Search across repositories and combine cohorts when one source is not enough." />
            <BridgeStep number="03" title="Check what is usable" body="See informative field coverage, sample overlap, access, limitations and unsupported uses." />
            <BridgeStep number="04" title="Start from working code" body="Follow an executed notebook for retrieval, cleaning, joining and analysis." last />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [num(stats.n_datasets), "datasets connected"],
            [num(stats.n_clinically_measured ?? 0), "datasets with measured clinical fields"],
            [num(nQuestions), "reviewed research questions"],
            [num(stats.n_distinct_workbooks ?? 0), "executed analysis notebooks"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border px-4 py-3" style={{ background: "var(--bg-raised)" }}>
              <div className="tnum text-xl font-semibold">{value}</div>
              <div className="text-meta t-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t py-12 sm:py-14">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              Portfolio impact
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              See what is heavily used, and what the field may be missing
            </h2>
          </div>
          <p className="max-w-[68ch] text-lede t-muted">
            A citation shows attention to a paper. Verified reuse means an article actually
            analyzed the data. CDS keeps those signals separate, then compares each dataset
            with similar resources to identify unusually underused opportunities.
          </p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <Card className="impact-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--strong)" }}>
                  Proven reach
                </p>
                <h3 className="mt-1 text-title font-semibold">Most reused datasets</h3>
              </div>
              <span className="rounded-full px-2.5 py-1 text-micro" style={{ background: "var(--strong-bg)", color: "var(--strong)" }}>
                measured in articles
              </span>
            </div>
            <ol className="mt-5 space-y-4">
              {successStories.map((story, index) => (
                <li key={story.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="font-mono text-meta t-faint">{index + 1}</span>
                  <div className="min-w-0">
                    <Link href={`/datasets/${story.id}`} className="block truncate font-medium hover:underline" style={{ color: "var(--accent)" }}>
                      {story.short ?? story.title}
                    </Link>
                    <div className="truncate text-meta t-muted">{story.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="tnum font-semibold">{num(story.reuse)}</div>
                    <div className="text-micro t-faint">articles using data</div>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="#reuse-evidence" className="mt-5 inline-flex items-center gap-1.5 text-meta font-medium" style={{ color: "var(--accent)" }}>
              Compare citations with real reuse <ArrowIcon />
            </Link>
          </Card>

          <Card className="impact-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--mixed)" }}>
                  Untapped potential
                </p>
                <h3 className="mt-1 text-title font-semibold">Largest measured reuse gaps</h3>
              </div>
              <span className="rounded-full px-2.5 py-1 text-micro" style={{ background: "var(--mixed-bg)", color: "var(--mixed)" }}>
                model adjusted
              </span>
            </div>
            <ol className="mt-5 space-y-4">
              {opportunities.map((dataset, index) => (
                <li key={dataset.id} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="font-mono text-meta t-faint">{index + 1}</span>
                  <div className="min-w-0">
                    <Link href={`/datasets/${dataset.id}`} className="block truncate font-medium hover:underline" style={{ color: "var(--accent)" }}>
                      {dataset.short_title ?? dataset.title}
                    </Link>
                    <div className="truncate text-meta t-muted">
                      {num(dataset.n_cases ?? dataset.n_samples)} {dataset.n_cases ? "people" : "samples"} · {dataset.n_modalities} data types
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum font-semibold">
                      {num(dataset.n_verified_reuse)} / {num(dataset.expected_reuse === null || dataset.expected_reuse === undefined ? null : Math.round(dataset.expected_reuse))}
                    </div>
                    <div className="text-micro t-faint">used / expected</div>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/underexplored" className="mt-5 inline-flex items-center gap-1.5 text-meta font-medium" style={{ color: "var(--accent)" }}>
              Explore all {num(stats.n_underexplored)} opportunities <ArrowIcon />
            </Link>
          </Card>
        </div>
      </section>

      <section className="border-t py-12 sm:py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
              Analysis notebooks
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              The download is only the beginning
            </h2>
            <p className="mt-3 text-lede t-muted">
              Follow end-to-end examples that expose the hard parts: misleading clinical
              fields, cross-repository patient joins, cohort loss, endpoint derivation and
              the limits of the resulting analysis.
            </p>
          </div>
          <Link
            href="/notebooks"
            className="rounded-md border px-4 py-2 text-body font-medium"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}
          >
            View all {num(notebooks.length)} notebooks
          </Link>
        </div>
        <NotebookGallery guides={featuredNotebooks} compact />
      </section>

      <section id="reuse-evidence" className="scroll-mt-20 border-t py-12 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider t-faint">Evidence behind the signal</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Citation is not the same as data reuse</h2>
          </div>
          <Link href="/methods#reuse" className="text-body underline">
            How reuse is measured
          </Link>
        </div>
        <p className="mt-3 max-w-3xl text-body t-muted">
          These are the most reused datasets whose accession can be traced. The distance
          between the two dots shows how often attention to the paper becomes use of the data.
        </p>
        <Card className="mt-5">
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
                note: "the accession appears in the methods section",
              },
            ]}
            unit="articles"
          />
          <p className="mt-4 border-t pt-3 text-meta t-muted">
            A dataset appears here only when both numbers were measured. Reuse cannot be
            measured without a citable accession, and a citation count is only published
            where a repository or a reviewer has named the dataset&rsquo;s own marker
            paper - counting citations to a paper we merely guessed at would not be the
            quantity the label claims. Either way the dataset is left out rather than
            drawn at zero. {num(stats.n_without_citable_accession)} of{" "}
            {num(stats.n_datasets)} have no citable accession at all; highly cited
            examples include{" "}
            {untraceable.map((dataset, index) => (
              <span key={dataset.id}>
                {index > 0 ? ", " : ""}
                <Link href={`/datasets/${dataset.id}`} className="underline">
                  {dataset.short ?? dataset.title}
                </Link>{" "}
                <span className="tnum t-faint">({num(dataset.cites)} citations)</span>
              </span>
            ))}
            .
          </p>
        </Card>
      </section>

      <section className="border-t py-12 text-center sm:py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Start with the question you want to answer</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lede t-muted">
          Search all {num(stats.n_datasets)} records, or begin with a reviewed question and see
          the usable sample size, required measurements and caveats before you commit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/ask" className="rounded-md px-4 py-2 font-medium" style={{ background: "var(--accent)", color: "var(--bg-raised)" }}>
            Ask about an analysis
          </Link>
          <Link href="/datasets" className="rounded-md border px-4 py-2 font-medium" style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}>
            Browse all datasets
          </Link>
          <Link href="/questions" className="rounded-md border px-4 py-2 font-medium" style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}>
            Explore {num(nQuestions)} questions
          </Link>
        </div>
      </section>
    </>
  );
}
