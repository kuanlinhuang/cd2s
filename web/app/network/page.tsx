import type { Metadata } from "next";
import Link from "next/link";

import FundingFlow from "@/components/charts/FundingFlow";
import { Card, EvidenceChip } from "@/components/ui";
import {
  NETWORK_SCOPES,
  defaultAward,
  defaultFundingDataset,
  getAwardConnections,
  getAwards,
  getDatasetFunding,
  getFundingCandidates,
  getFundingCoverage,
  getNetwork,
  type FundingAward,
  type NetworkScope,
} from "@/lib/data";
import { FUNDING_ROLE_LABELS, num } from "@/lib/format";

/**
 * Funding in, findings out.
 *
 * The page used to open on an award: pick a grant, see the cohorts it bought and the
 * articles that came out of them. That answers a funder's question. A researcher's
 * question - and the one the corpus can now answer on both sides - runs the other way
 * round: for this dataset, who paid to create it, and whose grants got a paper out of it
 * afterwards. So the dataset view is the page, and the award view is one link away.
 *
 * Both halves come from the same RePORTER publication index and differ only in which
 * paper an award is credited on: the dataset's own marker paper, or an article that used
 * the data later. That is the whole distinction between funding data generation and
 * funding reuse, and it is why the two sides can be drawn as one flow.
 */

const ROLE_MEANING: Record<string, string> = {
  generation: "The award is listed on the dataset's own publication, so it paid to produce these data.",
  reuse: "The award is listed on a later study that analyzed these data, so it paid for reuse.",
  infrastructure: "The award funds a center or harmonization effort that maintains or redistributes the data.",
  unknown: "The award is linked to the dataset, but which role it played could not be determined.",
};

export const metadata: Metadata = {
  title: "Funding in, findings out",
  description:
    "For any NCI-supported cancer dataset: the award that paid to create it, and the " +
    "awards that got a published finding out of it afterwards.",
};

const SLICES = new Set<string>(NETWORK_SCOPES.map((s) => s.key));

function usd(n: number | null): string | null {
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${num(n)}`;
}

function yearSpan(years: number[]): string | null {
  if (years.length === 0) return null;
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  return lo === hi ? `FY${lo}` : `FY${lo}–${hi}`;
}

/**
 * One award as a table row.
 *
 * `articles` is the only per-row third column there is. The generation and infrastructure
 * tables used to carry one too, and it printed the same sentence about what that role
 * means on every row - eight identical restatements of the heading above them. It is
 * said once, in the table's lede, and the column is gone.
 */
function AwardRows({ awards, articles }: { awards: FundingAward[]; articles: boolean }) {
  return (
    <tbody>
      {awards.map((a) => (
        <tr key={a.num} className="border-b align-top last:border-b-0">
          <td className="py-3 pr-4">
            {a.reporter_url ? (
              <a
                href={a.reporter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-body font-semibold hover:underline"
                style={{ color: "var(--accent)" }}
              >
                {a.num}
              </a>
            ) : (
              <span className="font-mono text-body font-semibold">{a.num}</span>
            )}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-micro t-faint">
              {a.activity_code && <span>{a.activity_code}</span>}
              {yearSpan(a.fiscal_years) && <span className="tnum">{yearSpan(a.fiscal_years)}</span>}
              {usd(a.award_amount_usd) && (
                <span className="tnum" title="Total awarded across the fiscal years RePORTER lists for this project">
                  {usd(a.award_amount_usd)}
                </span>
              )}
            </div>
          </td>
          <td className="py-3 pr-4 text-body">
            {a.title ?? <span className="t-faint">Title not in RePORTER</span>}
            {(a.pi || a.org) && (
              <div className="mt-0.5 text-meta t-muted">{[a.pi, a.org].filter(Boolean).join(" · ")}</div>
            )}
          </td>
          {articles && (
          <td className="py-3 pr-4 text-body">
            {a.articles.length === 0 ? (
              <span className="t-faint">No traced article could be attributed to this award.</span>
            ) : (
              <ul className="space-y-1">
                {a.articles.slice(0, 4).map((x, i) => (
                  <li key={i} className="text-meta">
                    {x.url ? (
                      <a href={x.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--accent)" }}>
                        {x.title}
                      </a>
                    ) : (
                      x.title
                    )}
                    {x.year && <span className="tnum t-faint"> {x.year}</span>}
                  </li>
                ))}
                {a.articles.length > 4 && (
                  <li className="text-meta t-faint">and {num(a.articles.length - 4)} more</li>
                )}
              </ul>
            )}
          </td>
          )}
          <td className="py-3">
            <EvidenceChip evidence={a.evidence} />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/**
 * What the funding links are and where they stop.
 *
 * One block, shared by both views. Each view used to carry its own three cards saying
 * much the same thing in different words, which is two things to keep in step and twice
 * as much for a reader who visits both.
 */
function FundingCaveats({ coverage }: { coverage?: ReturnType<typeof getFundingCoverage> }) {
  return (
    <div className="mt-8 grid gap-4 text-body lg:grid-cols-3">
      <Card>
        <h2 className="text-body font-semibold">Where the links come from</h2>
        <p className="mt-1.5 t-muted">
          NIH RePORTER maps a PMID to the awards that reported it. On a dataset&rsquo;s
          marker paper that gives the awards which created it; on an article that used the
          data, the awards which funded that use.
        </p>
      </Card>
      <Card>
        <h2 className="text-body font-semibold">How far it reaches</h2>
        <p className="mt-1.5 t-muted">
          {coverage ? (
            <>
              {num(coverage.with_generation)} datasets have an award credited with creating
              them, {num(coverage.with_enabled)} with using them, and{" "}
              {num(coverage.both_sides)} both.
            </>
          ) : (
            <>
              An award on two datasets paid for both; an article on two combined them. Those
              shared nodes are why this is a network and not a list.
            </>
          )}
        </p>
      </Card>
      <Card>
        <h2 className="text-body font-semibold">What is missing</h2>
        <p className="mt-1.5 t-muted">
          No citable accession means no traceable articles; no authoritative marker paper
          means no attributable generation award. Absence is a gap in the record.{" "}
          <Link href="/methods" className="underline">
            Methods
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

function AwardTable({
  title,
  lede,
  awards,
  articleColumn,
}: {
  title: string;
  lede: React.ReactNode;
  awards: FundingAward[];
  /** Head this column when the rows have per-award articles to list. */
  articleColumn?: string;
}) {
  return (
    <Card className="mt-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 mb-3 max-w-[80ch] text-body t-muted">{lede}</p>
      <div className="overflow-x-auto">
        <table className={`w-full text-left ${articleColumn ? "min-w-[720px]" : "min-w-[560px]"}`}>
          <thead>
            <tr className="border-b text-micro font-semibold uppercase tracking-wide t-faint">
              <th className="py-2 pr-4 font-semibold">Award</th>
              <th className="py-2 pr-4 font-semibold">Project</th>
              {articleColumn && <th className="py-2 pr-4 font-semibold">{articleColumn}</th>}
              <th className="py-2 font-semibold">Evidence</th>
            </tr>
          </thead>
          <AwardRows awards={awards} articles={Boolean(articleColumn)} />
        </table>
      </div>
    </Card>
  );
}

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const awardParam = one("award")?.trim();
  const sliceParam = one("scope");
  const datasetParam = one("dataset")?.trim();

  // An award or a corpus slice switches to the award-centred graph; everything else is
  // the dataset view, which is the page's default.
  const awardMode = Boolean(awardParam || (sliceParam && SLICES.has(sliceParam)));

  return awardMode ? (
    <AwardView awardParam={awardParam} sliceParam={sliceParam} />
  ) : (
    <DatasetView datasetParam={datasetParam} />
  );
}

// ------------------------------------------------------------------------------------
// the dataset view
// ------------------------------------------------------------------------------------

function DatasetView({ datasetParam }: { datasetParam?: string }) {
  const candidates = getFundingCandidates();
  const coverage = getFundingCoverage();
  const chosen =
    (datasetParam && candidates.find((c) => c.id === datasetParam)) || defaultFundingDataset();
  const unknown = Boolean(datasetParam && !candidates.some((c) => c.id === datasetParam));
  const funding = chosen ? getDatasetFunding(chosen.id) : null;

  const bothSided = candidates.filter((c) => c.n_generation > 0 && c.n_enabled > 0).slice(0, 6);

  return (
    <>
      <div className="pt-12 pb-7">
        <h1 className="text-2xl font-semibold tracking-tight">Funding in, findings out</h1>
        <p className="mt-3 max-w-[72ch] text-lede t-muted">
          For any dataset: the NCI award that paid to create it, and the awards that got a
          published finding out of it afterwards.
        </p>
      </div>

      <Card className="mb-6">
        <form action="/network" method="get">
          <label htmlFor="dataset" className="mb-1.5 block text-body font-medium">
            Pick a dataset
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="dataset"
              name="dataset"
              list="dataset-list"
              defaultValue={chosen?.id ?? ""}
              placeholder="Type a dataset id, for example gdc-tcga-brca"
              className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 font-mono text-body"
              style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)" }}
              autoComplete="off"
            />
            <datalist id="dataset-list">
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.short_title ?? c.title} &mdash; {c.n_generation} paid for it,{" "}
                  {c.n_enabled} funded by it
                </option>
              ))}
            </datalist>
            <button
              type="submit"
              className="shrink-0 rounded-lg px-5 py-2.5 text-body font-semibold"
              style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
            >
              Show its funding
            </button>
          </div>
          <p className="mt-2 text-meta t-faint">
            {num(coverage.with_any_award)} of {num(coverage.total)} datasets have at least one
            award resolved. {num(coverage.both_sides)} have awards on both sides.
          </p>
        </form>

        {unknown && (
          <p className="mt-3 text-meta" style={{ color: "var(--weak)" }}>
            No dataset with resolved funding matches &ldquo;{datasetParam}&rdquo;. Showing{" "}
            {chosen?.short_title ?? chosen?.id} instead.
          </p>
        )}

        {bothSided.length > 0 && (
          <div className="mt-4 border-t pt-3.5">
            <p className="mb-2 text-meta t-faint">
              <span className="font-medium">Datasets with awards on both sides</span> - awards
              that paid to create it <span aria-hidden>&rarr;</span> awards that funded work
              using it
            </p>
            <div className="flex flex-wrap gap-2">
              {bothSided.map((c) => (
                <Link
                  key={c.id}
                  href={`/network?dataset=${encodeURIComponent(c.id)}`}
                  title={c.title}
                  className="rounded-full border px-3.5 py-1.5 text-meta"
                  style={{
                    borderColor: chosen?.id === c.id ? "var(--accent)" : "var(--border)",
                    background: chosen?.id === c.id ? "var(--accent-bg)" : "var(--bg-raised)",
                    color: chosen?.id === c.id ? "var(--accent)" : "var(--text)",
                  }}
                >
                  {c.short_title ?? c.title}{" "}
                  <span className="tnum t-faint">
                    {c.n_generation}&thinsp;&rarr;&thinsp;{c.n_enabled}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>

      {!funding ? (
        <Card>
          <p className="text-body t-muted">
            No dataset in this corpus has an NCI award resolved against it yet. Run the
            pipeline&rsquo;s linkage step, or see{" "}
            <Link href="/methods" className="underline">
              Methods
            </Link>
            .
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight">
                  <Link href={`/datasets/${funding.id}`} className="hover:underline">
                    {funding.short_title ?? funding.title}
                  </Link>
                </h2>
                {funding.short_title && <p className="text-body t-muted">{funding.title}</p>}
              </div>
              <p className="text-body tnum t-muted">
                {num(funding.generation.length)} award
                {funding.generation.length === 1 ? "" : "s"} paid to create it &middot;{" "}
                {num(funding.enabled.length)} award{funding.enabled.length === 1 ? "" : "s"}{" "}
                funded work that used it
              </p>
            </div>

            <FundingFlow data={funding.graph} />

            {(funding.generation.length === 0 || funding.enabled.length === 0) && (
              <div
                className="mt-5 rounded-lg border-l-4 px-4 py-3 text-body"
                style={{ borderLeftColor: "var(--border-strong)", background: "var(--bg-sunken)" }}
              >
                <p className="font-medium">Why one side of this chain is empty</p>
                <ul className="mt-1.5 space-y-1 t-muted">
                  {funding.generation.length === 0 && (
                    <li>
                      {!funding.has_marker_paper
                        ? "No repository or reviewer names this dataset's marker paper, so no award can be credited with creating it."
                        : funding.marker_paper_inferred
                          ? "This dataset's marker paper is this pipeline's own nomination, not a repository's or a reviewer's. Attributing generation funding from a guess about which paper describes the cohort is exactly the mistake this project argues against, so no award is claimed."
                          : "The marker paper is known, but RePORTER indexes no NCI award against it."}
                    </li>
                  )}
                  {funding.enabled.length === 0 && (
                    <li>
                      {!funding.has_citable_accession
                        ? "This dataset has no accession that articles quote, so no reuse can be traced and nothing it enabled is visible."
                        : funding.n_traced_articles === 0
                          ? "No article naming this dataset's accession has been found."
                          : `${num(funding.n_traced_articles)} articles used this dataset, but none of them reports an NCI award.`}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </Card>

          {funding.generation.length > 0 && (
            <AwardTable
              title="Awards that paid to create this data"
              lede="Credited on the dataset's own marker paper."
              awards={funding.generation}
            />
          )}

          {funding.enabled.length > 0 && (
            <AwardTable
              title="Awards that funded work using this data"
              lede={
                <>
                  {funding.n_traced_articles === 1
                    ? "The one traced article reports an NCI award."
                    : `${num(funding.n_articles_with_award)} of ${num(funding.n_traced_articles)} traced articles report an NCI award.`}
                  {funding.enabled.some((a) => a.also_generation) && (
                    <>
                      {" "}
                      {num(funding.enabled.filter((a) => a.also_generation).length)} of these
                      awards also paid to create the data - the same team publishing again on
                      its own cohort, not a duplicated row.
                    </>
                  )}
                </>
              }
              awards={funding.enabled}
              articleColumn="Articles it is credited on"
            />
          )}

          {funding.infrastructure.length > 0 && (
            <AwardTable
              title="Awards that maintain or redistribute this data"
              lede="Resource and center grants credited on articles that used the data. Kept out of the flow above because they pay for the pipes, not for a cohort or a finding."
              awards={funding.infrastructure}
            />
          )}
        </>
      )}

      <FundingCaveats coverage={coverage} />

      <p className="mt-6 text-body t-muted">
        <Link href={`/network?award=${encodeURIComponent(defaultAward()?.num ?? "")}`} className="underline" style={{ color: "var(--accent)" }}>
          Start from an award
        </Link>{" "}
        instead, and see every dataset it touches.
      </p>
    </>
  );
}

// ------------------------------------------------------------------------------------
// the award view
// ------------------------------------------------------------------------------------

function AwardView({ awardParam, sliceParam }: { awardParam?: string; sliceParam?: string }) {
  const awards = getAwards();

  let scope: NetworkScope;
  let award = awardParam ? awards.find((a) => a.num.toLowerCase() === awardParam.toLowerCase()) ?? null : null;
  if (award) scope = `award:${award.num}`;
  else if (sliceParam && SLICES.has(sliceParam)) scope = sliceParam as NetworkScope;
  else {
    award = defaultAward();
    scope = award ? `award:${award.num}` : "showcase";
  }
  const unknownAward = awardParam && !award && !sliceParam;

  const data = getNetwork(scope);
  // A condensed slice draws fewer nodes than it counts, so the totals in the prose add
  // back what the condenser set aside. Counting the drawn nodes alone understates a
  // whole-corpus slice by hundreds.
  const drawn = (kind: string) => data.nodes.filter((nd) => nd.kind === kind).length;
  const nAwards = drawn("award") + (data.condensed?.n_awards_omitted ?? 0);
  const nDatasets = drawn("dataset");
  const nPapers = drawn("paper") + (data.condensed?.n_papers_omitted ?? 0);
  const topAwards = awards.filter((a) => a.n_datasets >= 3).slice(0, 8);
  const connections = award ? getAwardConnections(award.num) : [];
  const orgs = [...new Set(connections.map((c) => c.org_name).filter(Boolean))] as string[];
  const years = connections.flatMap((c) => c.fiscal_years);
  const span = yearSpan(years);
  const amount = connections.find((c) => c.award_amount_usd)?.award_amount_usd ?? null;

  return (
    <>
      <div className="pt-12 pb-7">
        <p className="mb-2 text-meta">
          <Link href="/network" className="underline" style={{ color: "var(--accent)" }}>
            &larr; Back to one dataset&rsquo;s funding
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Start from an award</h1>
        <p className="mt-3 max-w-[72ch] text-lede t-muted">
          Pick an NCI award and see the datasets it is credited on and the articles that
          came out of them.
        </p>
      </div>

      <Card className="mb-5">
        <form action="/network" method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="award" className="mb-1.5 block text-body font-medium">
              Award number
            </label>
            <input
              id="award"
              name="award"
              list="award-list"
              defaultValue={award?.num ?? ""}
              placeholder="Type a core project number, for example R01CA097096"
              className="w-full rounded-lg border px-3.5 py-2.5 font-mono text-body"
              style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)" }}
              autoComplete="off"
            />
            <datalist id="award-list">
              {awards.map((a) => (
                <option key={a.num} value={a.num}>
                  {a.title ? `${a.title.slice(0, 60)} (${a.n_datasets} datasets)` : `${a.n_datasets} datasets`}
                </option>
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            className="rounded-lg px-5 py-2.5 text-body font-semibold"
            style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
          >
            Show this award
          </button>
        </form>
        {unknownAward && (
          <p className="mt-2 text-meta" style={{ color: "var(--weak)" }}>
            No dataset in this corpus is linked to &ldquo;{awardParam}&rdquo;. Showing the default award instead.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-meta">
          <span className="t-faint">Most connected awards</span>
          {topAwards.map((a) => (
            <Link
              key={a.num}
              href={`/network?award=${encodeURIComponent(a.num)}`}
              className="rounded-full border px-3 py-1 font-mono"
              title={a.title ?? undefined}
              style={{
                borderColor: award?.num === a.num ? "var(--accent)" : "var(--border)",
                background: award?.num === a.num ? "var(--accent-bg)" : "var(--bg-raised)",
                color: award?.num === a.num ? "var(--accent)" : "var(--text)",
              }}
            >
              {a.num} <span className="t-faint">{a.n_datasets}</span>
            </Link>
          ))}
        </div>
        <details className="mt-3.5 text-meta">
          <summary className="cursor-pointer t-muted">Or browse a whole slice of the corpus</summary>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {NETWORK_SCOPES.map((s) => (
              <Link
                key={s.key}
                href={`/network?scope=${s.key}`}
                className="rounded-full border px-3.5 py-1.5"
                style={{
                  borderColor: s.key === scope ? "var(--accent)" : "var(--border)",
                  background: s.key === scope ? "var(--accent-bg)" : "var(--bg-raised)",
                  color: s.key === scope ? "var(--accent)" : "var(--text)",
                }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </details>
      </Card>

      <Card>
        {award ? (
          <div className="mb-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-mono text-title font-semibold">{award.num}</h2>
              {award.title && <span className="text-lede">{award.title}</span>}
            </div>
            <p className="mt-1.5 text-body t-muted">
              {award.pi ? `${award.pi}. ` : ""}
              Credited on {num(nDatasets)} dataset{nDatasets === 1 ? "" : "s"} and, through
              them, {num(nPapers)} article{nPapers === 1 ? "" : "s"}.
            </p>
          </div>
        ) : (
          <p className="mb-4 max-w-[80ch] text-body t-muted">
            {num(nAwards)} awards, {num(nDatasets)} datasets and {num(nPapers)} articles in
            this slice.{" "}
            {data.condensed
              ? `Drawn without the ${num(data.condensed.n_awards_omitted)} awards and ${num(data.condensed.n_papers_omitted)} articles that touch exactly one dataset: a node shared between two is what makes this a network rather than a list. Pick one award above to see a whole chain.`
              : "Pick one award above to see a whole chain."}
          </p>
        )}
        <FundingFlow data={data} />
      </Card>

      {award && connections.length > 0 && (
        <Card className="mt-5">
          <h2 className="text-lg font-semibold tracking-tight">How {award.num} is connected</h2>
          <p className="mt-1.5 mb-3 max-w-[80ch] text-body t-muted">
            {orgs.length > 0 && <>Awardee: {orgs.join("; ")}. </>}
            {span && <>Fiscal years on record: {span}. </>}
            {amount && <>Total on record across those years: ${num(amount)}. </>}
            Each row carries its RePORTER evidence.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-body">
              <thead>
                <tr className="border-b text-micro font-semibold uppercase tracking-wide t-faint">
                  <th className="py-2 pr-4 font-semibold">Dataset</th>
                  <th className="py-2 pr-4 font-semibold">How the award connects</th>
                  <th className="py-2 pr-4 text-right font-semibold">Articles</th>
                  <th className="py-2 font-semibold">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c) => (
                  <tr key={c.dataset_id} className="border-b align-top last:border-b-0">
                    <td className="py-3 pr-4">
                      <Link href={`/datasets/${c.dataset_id}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                        {c.dataset_short ?? c.dataset_title}
                      </Link>
                      {c.dataset_short && <div className="text-meta t-muted">{c.dataset_title}</div>}
                      <div className="mt-1 text-meta">
                        <Link href={`/network?dataset=${encodeURIComponent(c.dataset_id)}`} className="underline t-faint">
                          Its funding both ways
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{FUNDING_ROLE_LABELS[c.role]}</span>
                      <div className="text-meta t-muted">{ROLE_MEANING[c.role]}</div>
                    </td>
                    <td className="tnum py-3 pr-4 text-right">{num(c.n_articles)}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <EvidenceChip evidence={c.evidence} />
                        {c.evidence[0]?.locator && <span className="text-meta t-muted">{c.evidence[0].locator}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <FundingCaveats />
    </>
  );
}
