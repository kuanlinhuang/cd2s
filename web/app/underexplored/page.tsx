import type { Metadata } from "next";
import Link from "next/link";

import { ObservedExpected, reuseSentence } from "@/components/charts/ObservedExpected";
import ReuseScatter from "@/components/charts/ReuseScatter";
import { SegmentBar } from "@/components/charts/SegmentBar";
import { Callout, Card, Chip, DatasetLink, EmptyState } from "@/components/ui";
import { getCorpusBreakdown, getModel, getScatterPoints, getStats, getUnderexplored } from "@/lib/data";
import { SCARCE_MODALITIES, modalityLabel, months, num } from "@/lib/format";

export const metadata: Metadata = {
  title: "Underexplored datasets",
  description:
    "NCI-supported datasets reused far less than comparable resources, with the " +
    "evidence behind each label.",
};

export default function UnderexploredPage() {
  const rows = getUnderexplored();
  const stats = getStats();
  const points = getScatterPoints();
  const model = getModel();
  const breakdown = getCorpusBreakdown();

  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Underexplored datasets</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Each dataset here is reused far less than datasets of similar size, age,
          measurement breadth and access tier. The label comes from a model, not an
          opinion, and the model is published so you can check it.
        </p>
        <div className="mt-4 max-w-3xl">
          <Callout tone="info" title="What the label does not mean">
            It does not mean the data are poor. Most gaps come from discoverability: an
            unusual measurement, a cohort that is hard to recognize from its catalog
            entry, or an accession nobody quotes. The{" "}
            {num(stats.n_without_citable_accession)} datasets with no citable accession
            are never labeled either way, because their reuse cannot be measured.
          </Callout>
        </div>
      </div>

      <Card className="mb-5">
        <h2 className="text-[15px] font-semibold">Where the {num(breakdown.total)} records stand</h2>
        <p className="mb-4 text-[13px] t-muted">
          Reuse can only be measured for datasets with an accession that articles quote.
        </p>
        <SegmentBar
          total={breakdown.total}
          segments={[
            {
              key: "untraceable",
              label: "No citable accession",
              value: breakdown.untraceable,
              color: "var(--viz-mute)",
              note: "Reuse cannot be traced through the literature.",
            },
            {
              key: "undated",
              label: "Citable, but no article has quoted it yet",
              value: breakdown.undated,
              color: "var(--viz-1-wash)",
              note: "Nothing to date availability from, so the model does not apply.",
            },
            {
              key: "expected",
              label: "Reused about as expected",
              value: breakdown.expected,
              color: "var(--viz-1)",
              note: "Within the range the model predicts.",
            },
            {
              key: "under",
              label: "Underexplored",
              value: breakdown.under,
              color: "var(--viz-2)",
              note: "Well below prediction, and few articles in absolute terms.",
            },
          ]}
        />
      </Card>

      {points.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-[15px] font-semibold">
            Every dataset we could assess, {num(points.length)} in all
          </h2>
          <p className="mb-4 text-[13px] t-muted">
            Articles that analyzed the data, against the number expected for a dataset of
            its size, age, breadth and access. Below the dashed line a dataset is labeled
            underexplored
            {model ? ` if it also has fewer than ${model.absolute_reuse_ceiling} articles` : ""}.
            Hover a dot for its numbers, click to open the dataset.
          </p>
          <ReuseScatter points={points} thresholdLog2={model?.rgi_threshold_log2 ?? -1.5} />
        </Card>
      )}

      {rows.length === 0 ? (
        <EmptyState>
          No dataset currently carries the label. Either the model has not been fitted, or
          nothing falls far enough below expectation. See{" "}
          <Link href="/methods#reuse-gap" className="underline">
            Methods
          </Link>
          .
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-w-0">
                    <DatasetLink id={r.id}>{r.title}</DatasetLink>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] t-muted">
                      <span className="font-mono text-[11px]">{r.short_title}</span>
                      <span>{r.repositories.join(" + ")}</span>
                      <span className="tnum">
                        {num(r.n_cases ?? r.n_samples)} {r.n_cases ? "cases" : "samples"}
                      </span>
                      {r.median_followup_months ? (
                        <span>follow-up {months(r.median_followup_months)}</span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-[13px]">
                      {reuseSentence(r.n_verified_reuse, r.expected_reuse)}
                      {r.n_citations_to_primary_publication
                        ? ` Its publication has been cited ${num(r.n_citations_to_primary_publication)} times.`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {r.modalities.map((m) => (
                        <Chip key={m} tone={SCARCE_MODALITIES.has(m) ? "scarce" : "neutral"}>
                          {modalityLabel(m)}
                        </Chip>
                      ))}
                    </div>

                    {r.population_flags.length > 0 && (
                      <p className="mt-2 text-[12px] t-muted">
                        Population: {r.population_flags.join("; ")}
                      </p>
                    )}
                  </div>

                  <div className="lg:pt-1">
                    <ObservedExpected
                      observed={r.n_verified_reuse ?? 0}
                      expected={r.expected_reuse ?? 0}
                      underexplored
                      />
                    <p className="mt-2 text-right text-[11px] t-faint">
                      Reuse gap index{" "}
                      <span className="tnum" style={{ color: "var(--text-muted)" }}>
                        {r.reuse_gap_index?.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
