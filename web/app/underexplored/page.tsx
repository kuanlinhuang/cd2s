import type { Metadata } from "next";
import Link from "next/link";

import { ObservedExpected, reuseSentence } from "@/components/charts/ObservedExpected";
import ReuseScatter from "@/components/charts/ReuseScatter";
import { SegmentBar } from "@/components/charts/SegmentBar";
import { Callout, Card, Chip, DatasetLink, EmptyState } from "@/components/ui";
import {
  getCorpusBreakdown,
  getModel,
  getQuestions,
  getScatterPoints,
  getStats,
  getUnderexplored,
} from "@/lib/data";
import { SCARCE_MODALITIES, modalityLabel, months, num } from "@/lib/format";

export const metadata: Metadata = {
  title: "Underused research opportunities",
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

  // The reviewed questions each opportunity could answer. A reuse gap says a dataset is
  // unused; this says what it is unused *for*, which is the part a researcher can act
  // on. Only reviewed questions appear, so an empty list means nobody has written them
  // yet rather than that the data support nothing.
  const questionsByDataset = new Map<string, string[]>();
  for (const q of getQuestions()) {
    const list = questionsByDataset.get(q.dataset_id);
    if (list) list.push(q.question);
    else questionsByDataset.set(q.dataset_id, [q.question]);
  }

  return (
    <>
      <div className="pt-10 pb-6">
        <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--mixed)" }}>
          Look beyond the familiar cohorts
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Underused research opportunities</h1>
        <p className="mt-3 max-w-3xl text-lede t-muted">
          Used far less than resources of similar size, age, breadth and access tier - so
          the questions they can answer are still open.{" "}
          <Link href="/methods#reuse-gap" className="underline">
            How the gap is modelled
          </Link>
          .
        </p>
        <div className="mt-4 max-w-3xl">
          <Callout tone="info" title="An opportunity signal, not a quality score">
            Underused is not poor quality, and it is not a promise of a finding. The{" "}
            {num(stats.n_without_citable_accession)} datasets with no citable accession are
            never labelled either way: their reuse cannot be measured at all.
          </Callout>
        </div>
      </div>

      <Card className="mb-5">
        <h2 className="text-title font-semibold">Where the {num(breakdown.total)} records stand</h2>
        <p className="mb-4 text-body t-muted">
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
              label: "Underused opportunity",
              value: breakdown.under,
              color: "var(--viz-2)",
              note: "Well below prediction, and few articles in absolute terms.",
            },
          ]}
        />
      </Card>

      {points.length > 0 && (
        <Card className="mb-8">
          <h2 className="text-title font-semibold">
            Every dataset we could assess, {num(points.length)} in all
          </h2>
          <p className="mb-4 text-body t-muted">
            Articles that analyzed the data against the number expected. Below the dashed
            line a dataset is labeled underexplored
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
          {rows.map((r) => {
            const questions = questionsByDataset.get(r.id) ?? [];
            const shown = questions.slice(0, 2);
            return (
              <li key={r.id}>
                <Card>
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0">
                      <DatasetLink id={r.id}>{r.title}</DatasetLink>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta t-muted">
                        <span className="font-mono text-micro">{r.short_title}</span>
                        <span>{r.repositories.join(" + ")}</span>
                        <span className="tnum">
                          {num(r.n_cases ?? r.n_samples)} {r.n_cases ? "cases" : "samples"}
                        </span>
                        {r.median_followup_months ? (
                          <span>follow-up {months(r.median_followup_months)}</span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-body">
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
                        <p className="mt-2 text-meta t-muted">
                          Population: {r.population_flags.join("; ")}
                        </p>
                      )}

                      {questions.length > 0 && (
                        <div
                          className="mt-3 rounded-lg border-l-2 px-3.5 py-2.5"
                          style={{
                            borderLeftColor: "var(--mixed)",
                            background: "var(--bg-sunken)",
                          }}
                        >
                          <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                            Open questions these data could answer
                          </div>
                          <ul className="mt-1.5 space-y-1.5">
                            {shown.map((q) => (
                              <li key={q} className="flex gap-2.5 text-body">
                                <span aria-hidden style={{ color: "var(--mixed)" }}>
                                  &rarr;
                                </span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                          {/* Offering "all 2" when both are already on screen is noise,
                              so the link changes to what the dataset page actually adds:
                              the reviewer's reasoning for each one. */}
                          <Link
                            href={`/datasets/${r.id}#useful-for`}
                            className="mt-2 inline-block text-meta underline"
                          >
                            {questions.length > shown.length
                              ? `All ${questions.length} reviewed questions`
                              : "Why these fit this dataset"}
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="lg:pt-1">
                      {r.n_verified_reuse === null || r.n_verified_reuse === undefined ||
                      r.expected_reuse === null || r.expected_reuse === undefined ? (
                        <p className="text-meta t-muted">
                          Reuse could not be measured for this accession.
                        </p>
                      ) : (
                        <ObservedExpected
                          observed={r.n_verified_reuse}
                          expected={r.expected_reuse}
                          underexplored
                        />
                      )}
                      <p className="mt-2 text-right text-micro t-faint">
                        Reuse gap index{" "}
                        <span className="tnum" style={{ color: "var(--text-muted)" }}>
                          {r.reuse_gap_index?.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
