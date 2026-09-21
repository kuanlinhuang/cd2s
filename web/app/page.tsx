import Link from "next/link";

import AskBox from "@/components/AskBox";
import { FitStrip } from "@/components/FitGrid";
import NotebookSpotlight from "@/components/NotebookSpotlight";
import ValueStack from "@/components/ValueStack";
import { Bars } from "@/components/charts/Bars";
import { CoverageLegend, CoverageRows } from "@/components/charts/CoverageChart";
import { PairedDots } from "@/components/charts/PairedDots";
import { Card } from "@/components/ui";
import {
  getFacets,
  getIndex,
  getNotebookGuides,
  getQuestions,
  getRecord,
  getStarterCoverage,
  getStats,
  getUnderexplored,
} from "@/lib/data";
import { fitSummary, fitVerdicts } from "@/lib/fit";
import { SCARCE_MODALITIES, num } from "@/lib/format";
import { mostReused, reuseChartRows, untraceableTopCited } from "@/lib/reuse-chart";
import { starterSnippets } from "@/lib/starter";

/**
 * The home page makes one argument: the data are already public, two things still cost
 * weeks, and this is what CD2S puts in each of those two places.
 *
 * It is deliberately short of prose. Everything that used to be explained in a
 * paragraph is either drawn - the value stack, the worked example, the reuse
 * comparison - or linked to the Methods page, which is where a reader who wants the
 * measurement rather than the claim is actually going.
 */

function ArrowIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden focusable="false">
      <path d="M1 6h14M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHead({
  eyebrow,
  title,
  method,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Where the measurement behind this section is written down. */
  method?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-[60ch]">
        <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {children}
        {method && (
          <Link href={method.href} className="text-body underline t-muted">
            {method.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** The dataset whose starter code the home page shows. Any record would do; this one is
 *  the most recognisable, and its snippet is short enough to read without scrolling. */
const STARTER_EXAMPLE_ID = "gdc-tcga-brca";

/** The four clinical fields that decide whether any outcome analysis is possible. */
const DECIDING_FIELDS = [
  "demographic.vital_status",
  "diagnoses.progression_or_recurrence",
  "diagnoses.treatments.treatment_type",
  "demographic.race",
];

export default function Home() {
  const stats = getStats();
  const index = getIndex();
  const nQuestions = getQuestions().length;
  const nMultimodal = index.filter((r) => r.n_modalities >= 3).length;
  const nScarce = index.filter((r) => r.modalities.some((m) => SCARCE_MODALITIES.has(m))).length;
  const nCrossRepository = index.filter((r) => r.repositories.length > 1).length;
  const notebooks = getNotebookGuides();
  const repositories = (getFacets().repository ?? []).map((f) => f.value);
  const byRepository = stats.clinically_measured_by_repository ?? {};

  const capabilities = [
    { href: "/datasets?capability=survival", label: "Survival analysis", n: stats.n_with_survival },
    { href: "/datasets?capability=treatment", label: "Treatment response", n: stats.n_with_treatment_response },
    { href: "/datasets?capability=multimodal", label: "3+ data types", n: nMultimodal },
    { href: "/datasets?capability=scarce", label: "Rare measurements", n: nScarce },
  ];

  // The worked example. The cohort that carries the analysis is the subject; the
  // larger one that cannot is the single line of context that makes the point that
  // size is not the signal. Both verdict rows are computed, not written down here.
  const fitting = getRecord("gdc-cgci-htmcp-cc");
  const largest = getRecord("gdc-fm-ad");
  const fittingFit = fitting ? fitVerdicts(fitting) : [];
  const largestFit = largest ? fitVerdicts(largest) : [];
  const fittingSummary = fitSummary(fittingFit);
  const largestSummary = fitSummary(largestFit);
  const decidingFields = (fitting?.clinical_variables ?? []).filter((v) =>
    DECIDING_FIELDS.includes(v.harmonized_name ?? v.name),
  );
  // "85 times larger" is the whole point of the comparison, so it is computed rather
  // than written down - and dropped entirely when either cohort has no case count,
  // where the arithmetic would print a confident 0.
  const fittingCases = fitting?.cohort?.n_cases ?? null;
  const largestCases = largest?.cohort?.n_cases ?? null;
  const timesLarger =
    fittingCases && largestCases ? Math.round(largestCases / fittingCases) : null;

  const reuseRows = reuseChartRows(index, getRecord);
  const successStories = mostReused(index, 5);
  const opportunities = getUnderexplored(5);
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
        .join(" · "),
      href: `/datasets/${r.id}`,
      values: { cited: r.cites, used: r.reuse },
    }));
  const untraceable = untraceableTopCited(index, 3);

  // A real snippet, taken from the generator rather than retyped, so the page cannot
  // advertise code that the dataset pages do not actually produce.
  const starter = getStarterCoverage();
  const starterRecord = getRecord(STARTER_EXAMPLE_ID);
  const starterExample = starterRecord ? starterSnippets(starterRecord)[0] : null;

  const featured = notebooks.filter((guide) => guide.featured);
  const hero = featured[0] ?? notebooks[0];
  const otherNotebooks = notebooks.filter((guide) => guide.slug !== hero?.slug);

  return (
    <>
      <section className="home-hero relative -mx-4 overflow-hidden border-b px-4 pb-14 pt-12 sm:-mx-6 sm:px-6 sm:pb-16 sm:pt-16">
        <div className="relative z-10 mx-auto max-w-[970px] text-center">
          <p className="text-meta font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
            CD2S &middot; Cancer Data to Science
          </p>
          <h1 className="mx-auto mt-3 max-w-[20ch] text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Which cancer dataset can answer your question?
          </h1>
          <div className="mx-auto mt-8 max-w-[790px] text-left">
            <p className="mb-2 px-1 font-medium">Describe the analysis you want to run</p>
            <AskBox examples />
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-body">
            <span className="mr-1 text-meta t-faint">Or browse by capability</span>
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
        <SectionHead
          eyebrow="Built on what NIH already shares"
          title="Finding the data was never the hard part"
          method={{ href: "/methods", label: "How this was built" }}
        />
        <ValueStack
          repositories={repositories.map((name) => ({
            name,
            count: byRepository[name]?.total ?? 0,
          }))}
          counts={{
            datasets: stats.n_datasets,
            measured: stats.n_clinically_measured ?? 0,
            questions: nQuestions,
            crossRepository: nCrossRepository,
            starters: starter.total,
            notebooks: stats.n_distinct_workbooks ?? 0,
          }}
        />
      </section>

      {fitting && largest && (
        <section className="border-t py-12 sm:py-14">
          <SectionHead
            eyebrow="What the answer looks like"
            // Every number in this heading is read off the record, so the headline
            // cannot outlive the verdicts it is summarising.
            title={`${num(fittingCases)} patients, and ${fittingSummary.supported} of the ${fittingFit.length} analyses check out`}
            method={{ href: "/methods#clinical", label: "How completeness is measured" }}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <Card className="flex h-full flex-col">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <Link
                  href={`/datasets/${fitting.id}`}
                  className="text-title font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  {fitting.short_title ?? fitting.title}
                </Link>
                <span className="tnum text-meta t-muted">{num(fittingCases)} patients</span>
              </div>
              <p className="mt-1 text-meta t-muted">
                Cervical cancer in an African cohort. The fields that decide an outcome
                analysis are filled in, so the work can start.
              </p>
              <div className="mt-4">
                <CoverageLegend />
                <div className="mt-3">
                  <CoverageRows variables={decidingFields} />
                </div>
              </div>
              <div className="mt-auto pt-5">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="text-micro font-semibold uppercase tracking-wider t-faint">
                    So the six verdicts read
                  </span>
                  <span className="tnum text-meta font-medium" style={{ color: "var(--strong)" }}>
                    {fittingSummary.supported} of {fittingFit.length} supported
                  </span>
                </div>
                <FitStrip verdicts={fittingFit} />
              </div>
            </Card>

            <div className="flex h-full flex-col gap-4">
              {/* The contrast earns its place in three lines, not in a second panel of
                  crosses: the point is that size is not the signal, and one number
                  makes it. */}
              <Card>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link
                    href={`/datasets/${largest.id}`}
                    className="text-title font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {largest.short_title ?? largest.title}
                  </Link>
                  <span className="tnum text-meta t-muted">
                    {num(largestCases)} patients
                    {timesLarger ? `, ${timesLarger} times larger` : ""}
                  </span>
                </div>
                <p className="mt-1 text-meta t-muted">
                  The largest cohort in the GDC lists all four of the same fields, and
                  every value in them reads &ldquo;not reported&rdquo;.
                </p>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="tnum text-title font-semibold" style={{ color: "var(--weak)" }}>
                    {largestSummary.supported} of {largestFit.length}
                  </span>
                  <span className="text-meta t-muted">of the six supported</span>
                </p>
              </Card>

              <p
                className="flex flex-1 items-center rounded-lg border-l-2 px-4 py-3 text-lede"
                style={{ borderLeftColor: "var(--accent)", background: "var(--accent-bg)" }}
              >
                Size does not predict this, and no catalog reports it. Every record on the
                site carries the same six verdicts, so you can tell before you download.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="border-t py-12 sm:py-14">
        <SectionHead
          eyebrow="From a page to data on your disk"
          title="Every dataset ships code that runs"
          method={{ href: "/agents", label: "The machine-readable side" }}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [num(starter.total), "dataset pages carry starter code, generated from that record's own identifiers"],
            [num(starter.open), "of them run with no account and no access request"],
            [num(stats.n_derived_access_steps ?? 0), "access steps written out, so nothing stops at a download link"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-xl border px-4 py-3.5"
              style={{ background: "var(--bg-raised)" }}
            >
              <div className="tnum text-2xl font-semibold" style={{ color: "var(--accent)" }}>
                {value}
              </div>
              <div className="mt-0.5 text-body t-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* A real snippet at full width: the longest line is about a hundred characters,
            which clips in a half-width column and turns the proof into a teaser. */}
        {starterRecord && starterExample && (
          <figure
            className="mt-4 mb-0 overflow-hidden rounded-xl border"
            style={{ background: "var(--bg-raised)" }}
          >
            <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-2.5">
              <span className="text-meta font-medium">{starterExample.label}</span>
              <Link
                href={`/datasets/${starterRecord.id}#start`}
                className="text-meta underline"
                style={{ color: "var(--accent)" }}
              >
                on the {starterRecord.short_title ?? starterRecord.title} page
              </Link>
            </figcaption>
            <pre
              className="overflow-x-auto px-4 py-3 font-mono text-meta leading-relaxed"
              style={{ background: "var(--bg-sunken)" }}
            >
              <code>{starterExample.code}</code>
            </pre>
          </figure>
        )}

        {hero && (
          <>
            <div className="mt-10 mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="max-w-[60ch]">
                <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                  And past the download
                </p>
                <h3 className="mt-1.5 text-xl font-semibold tracking-tight">
                  {num(notebooks.length)} notebooks that carry on to a result
                </h3>
              </div>
              <Link
                href="/notebooks"
                className="rounded-md border px-4 py-2 text-body font-medium"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}
              >
                All {num(notebooks.length)} notebooks
              </Link>
            </div>
            <NotebookSpotlight hero={hero} others={otherNotebooks} />
          </>
        )}
      </section>

      <section className="border-t py-12 sm:py-14">
        <SectionHead
          eyebrow="Where the reuse went"
          title="What the field leaned on, and what it walked past"
          method={{ href: "/methods#reuse-gap", label: "How the gap is modelled" }}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="impact-panel flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--strong)" }}>
                  Proven reach
                </p>
                <h3 className="mt-1 text-title font-semibold">Most reused datasets</h3>
              </div>
              <span className="rounded-full px-2.5 py-1 text-micro" style={{ background: "var(--strong-bg)", color: "var(--strong)" }}>
                articles that analyzed the data
              </span>
            </div>
            <div className="mt-5">
              <Bars
                labelWidth={132}
                valueWidth={60}
                unit="articles"
                rows={successStories.map((story) => ({
                  key: story.id,
                  label: (
                    <Link href={`/datasets/${story.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                      {story.short ?? story.title}
                    </Link>
                  ),
                  value: story.reuse,
                  title: `${story.title}: ${num(story.reuse)} articles place its accession in a methods section`,
                }))}
              />
            </div>
            <p className="mt-5 text-meta t-muted">
              {num(stats.n_reuse_studies_verified)} reuse studies verified across the
              corpus, each with the article that names the accession.
            </p>
            <Link href="#reuse-evidence" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-meta font-medium" style={{ color: "var(--accent)" }}>
              Citations against real reuse <ArrowIcon />
            </Link>
          </Card>

          <Card className="impact-panel flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--mixed)" }}>
                  Untapped potential
                </p>
                <h3 className="mt-1 text-title font-semibold">Biggest reuse gaps</h3>
              </div>
              <span className="rounded-full px-2.5 py-1 text-micro" style={{ background: "var(--mixed-bg)", color: "var(--mixed)" }}>
                used against expected
              </span>
            </div>
            <ol className="mt-5 space-y-3.5">
              {opportunities.map((dataset) => (
                <li key={dataset.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                  <div className="min-w-0">
                    <Link href={`/datasets/${dataset.id}`} className="block truncate font-medium hover:underline" style={{ color: "var(--accent)" }}>
                      {dataset.short_title ?? dataset.title}
                    </Link>
                    <div className="truncate text-meta t-muted">
                      {num(dataset.n_cases ?? dataset.n_samples)}{" "}
                      {dataset.n_cases ? "people" : "samples"} &middot; {dataset.n_modalities}{" "}
                      data types
                      {dataset.n_research_questions > 0 && (
                        <>
                          {" "}
                          &middot;{" "}
                          <span style={{ color: "var(--mixed)" }}>
                            {dataset.n_research_questions} reviewed questions
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tnum font-semibold">
                      <span style={{ color: "var(--mixed)" }}>{num(dataset.n_verified_reuse)}</span>
                      <span className="t-faint"> / </span>
                      {num(
                        dataset.expected_reuse === null || dataset.expected_reuse === undefined
                          ? null
                          : Math.round(dataset.expected_reuse),
                      )}
                    </div>
                    <div className="text-micro t-faint">used / expected</div>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/underexplored" className="mt-auto inline-flex items-center gap-1.5 pt-5 text-meta font-medium" style={{ color: "var(--accent)" }}>
              All {num(stats.n_underexplored)} opportunities <ArrowIcon />
            </Link>
          </Card>
        </div>
      </section>

      <section id="reuse-evidence" className="scroll-mt-20 border-t py-12 sm:py-14">
        <SectionHead
          eyebrow="Evidence behind the signal"
          title="A citation is not a reuse"
          method={{ href: "/methods#reuse", label: "How reuse is measured" }}
        />
        <Card>
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
            A dataset is drawn only where both numbers were measured, never as a zero
            standing in for a missing one.{" "}
            {num(stats.n_without_citable_accession)} of {num(stats.n_datasets)} have no
            citable accession at all, so their reuse cannot be traced - among them{" "}
            {untraceable.map((dataset, i) => (
              <span key={dataset.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/datasets/${dataset.id}`} className="underline">
                  {dataset.short ?? dataset.title}
                </Link>{" "}
                <span className="tnum t-faint">({num(dataset.cites)} citations)</span>
              </span>
            ))}
            .{" "}
            <Link href="/methods#accession-precision" className="underline">
              Why the counts are corrected
            </Link>
            .
          </p>
        </Card>
      </section>

      <section className="border-t py-12 text-center sm:py-14">
        <h2 className="text-2xl font-semibold tracking-tight">Start with your question</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/ask" className="rounded-md px-4 py-2 font-medium" style={{ background: "var(--accent)", color: "var(--bg-raised)" }}>
            Ask about an analysis
          </Link>
          <Link href="/datasets" className="rounded-md border px-4 py-2 font-medium" style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}>
            Browse {num(stats.n_datasets)} datasets
          </Link>
          <Link href="/questions" className="rounded-md border px-4 py-2 font-medium" style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}>
            {num(nQuestions)} reviewed questions
          </Link>
        </div>
      </section>
    </>
  );
}
