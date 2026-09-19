import type { Metadata } from "next";
import Link from "next/link";

import NetworkGraph from "@/components/charts/NetworkGraph";
import { Card, EvidenceChip } from "@/components/ui";
import {
  NETWORK_SCOPES,
  defaultAward,
  getAwardConnections,
  getAwards,
  getNetwork,
  type NetworkScope,
} from "@/lib/data";
import { FUNDING_ROLE_LABELS, num } from "@/lib/format";

const ROLE_MEANING: Record<string, string> = {
  generation: "The award is listed on the dataset's own publication, so it paid to produce these data.",
  reuse: "The award is listed on a later study that analyzed these data, so it paid for reuse.",
  infrastructure: "The award funds a center or harmonization effort that maintains or redistributes the data.",
  unknown: "The award is linked to the dataset, but which role it played could not be determined.",
};

export const metadata: Metadata = {
  title: "Funding to data to findings",
  description:
    "Pick an NCI award and see the datasets it paid for and the articles that analyzed " +
    "them, as one zoomable network.",
};

const SLICES = new Set<string>(NETWORK_SCOPES.map((s) => s.key));

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  const awards = getAwards();
  const awardParam = one("award")?.trim();
  const sliceParam = one("scope");

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
  const nAwards = data.nodes.filter((n) => n.kind === "award").length;
  const nDatasets = data.nodes.filter((n) => n.kind === "dataset").length;
  const nPapers = data.nodes.filter((n) => n.kind === "paper").length;
  const topAwards = awards.filter((a) => a.n_datasets >= 3).slice(0, 8);
  const connections = award ? getAwardConnections(award.num) : [];
  const orgs = [...new Set(connections.map((c) => c.org_name).filter(Boolean))] as string[];
  const years = connections.flatMap((c) => c.fiscal_years);
  const yearSpan = years.length ? `FY${Math.min(...years)}${Math.max(...years) !== Math.min(...years) ? `–${Math.max(...years)}` : ""}` : null;
  const amount = connections.find((c) => c.award_amount_usd)?.award_amount_usd ?? null;

  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Funding to data to findings</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Pick an NCI award. The graph shows the datasets it paid for and the articles
          that analyzed those datasets. Scroll to zoom, drag to pan, hover a node for its
          details, click to pin it and list everything it connects to.
        </p>
      </div>

      <Card className="mb-4">
        <form action="/network" method="get" className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="award" className="mb-1 block text-[11px] font-medium uppercase tracking-wide t-faint">
              Award number
            </label>
            <input
              id="award"
              name="award"
              list="award-list"
              defaultValue={award?.num ?? ""}
              placeholder="Type a core project number, for example R01CA097096"
              className="w-full rounded-md border px-3 py-2 font-mono text-[13px]"
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
            className="rounded-md px-4 py-2 text-[13px] font-medium"
            style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
          >
            Show this award
          </button>
        </form>
        {unknownAward && (
          <p className="mt-2 text-[12px]" style={{ color: "var(--weak)" }}>
            No dataset in this corpus is linked to &ldquo;{awardParam}&rdquo;. Showing the default award instead.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="t-faint">Most connected awards</span>
          {topAwards.map((a) => (
            <Link
              key={a.num}
              href={`/network?award=${encodeURIComponent(a.num)}`}
              className="rounded-full border px-2.5 py-0.5 font-mono"
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
        <details className="mt-3 text-[12px]">
          <summary className="cursor-pointer t-muted">Or browse a whole slice of the corpus</summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {NETWORK_SCOPES.map((s) => (
              <Link
                key={s.key}
                href={`/network?scope=${s.key}`}
                className="rounded-full border px-3 py-1"
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
          <div className="mb-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-mono text-[15px] font-semibold">{award.num}</h2>
              {award.title && <span className="text-[14px]">{award.title}</span>}
            </div>
            <p className="mt-1 text-[13px] t-muted">
              {award.pi ? `${award.pi}. ` : ""}
              Linked to {num(nDatasets)} dataset{nDatasets === 1 ? "" : "s"} and, through them,{" "}
              {num(nPapers)} article{nPapers === 1 ? "" : "s"}. Solid lines are funded data
              generation and articles that analyzed the data; dashed lines are funded reuse
              and articles that only mentioned or declared use.
            </p>
          </div>
        ) : (
          <p className="mb-3 text-[13px] t-muted">
            {num(nAwards)} awards, {num(nDatasets)} datasets and {num(nPapers)} articles.
            Solid lines are funded data generation and articles that analyzed the data.
            Dashed lines are awards that funded reuse and articles that only mentioned or
            declared use.
            {scope === "all" && " This is the whole corpus, so zoom in before reading labels."}
          </p>
        )}
        <NetworkGraph data={data} />
      </Card>

      {award && connections.length > 0 && (
        <Card className="mt-5">
          <h2 className="text-[15px] font-semibold">How {award.num} is connected</h2>
          <p className="mt-1 text-[13px] t-muted">
            Links come from NIH RePORTER&rsquo;s publication index. When a dataset&rsquo;s own
            paper lists the award, the award funded data generation. When a later study that
            analyzed the data lists it, the award funded reuse. Each row carries the
            RePORTER evidence for that link.
            {orgs.length > 0 && <> Awardee: {orgs.join("; ")}.</>}
            {yearSpan && <> Fiscal years on record: {yearSpan}.</>}
            {amount && <> Latest annual amount on record: ${num(amount)}.</>}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b text-left t-faint">
                  <th className="py-1.5 pr-4 font-medium">Dataset</th>
                  <th className="py-1.5 pr-4 font-medium">How the award connects</th>
                  <th className="py-1.5 pr-4 text-right font-medium">Articles</th>
                  <th className="py-1.5 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c) => (
                  <tr key={c.dataset_id} className="border-b last:border-b-0 align-top">
                    <td className="py-2 pr-4">
                      <Link href={`/datasets/${c.dataset_id}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                        {c.dataset_short ?? c.dataset_title}
                      </Link>
                      {c.dataset_short && <div className="text-[12px] t-muted">{c.dataset_title}</div>}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="font-medium">{FUNDING_ROLE_LABELS[c.role]}</span>
                      <div className="text-[12px] t-muted">{ROLE_MEANING[c.role]}</div>
                    </td>
                    <td className="tnum py-2 pr-4 text-right">{num(c.n_articles)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <EvidenceChip evidence={c.evidence} />
                        {c.evidence[0]?.locator && <span className="text-[12px] t-muted">{c.evidence[0].locator}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 text-[13px] lg:grid-cols-3">
        <Card>
          <h2 className="font-medium">Where the links come from</h2>
          <p className="mt-1 t-muted">
            Awards are resolved through NIH RePORTER from each dataset&rsquo;s
            publications. Articles are the record&rsquo;s original publication plus the
            reuse exemplars it ships, at most ten per dataset.
          </p>
        </Card>
        <Card>
          <h2 className="font-medium">What a shared node means</h2>
          <p className="mt-1 t-muted">
            An award touching two datasets paid for both. An article touching two
            datasets combined them. Those cross-links are the reason to draw this as a
            network rather than a list.
          </p>
        </Card>
        <Card>
          <h2 className="font-medium">What is missing</h2>
          <p className="mt-1 t-muted">
            Datasets with no citable accession have no traceable articles, and datasets
            whose publications RePORTER does not index have no awards. Absence here is a
            gap in the record, not proof that nothing was funded or published. Details on{" "}
            <Link href="/methods" className="underline">
              Methods
            </Link>
            .
          </p>
        </Card>
      </div>
    </>
  );
}
