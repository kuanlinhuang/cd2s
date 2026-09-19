import type { Metadata } from "next";
import Link from "next/link";

import { Card, Chip, DatasetLink, EmptyState } from "@/components/ui";
import { getQuestions } from "@/lib/data";
import { FEASIBILITY_LABELS, modalityLabel, num } from "@/lib/format";

export const metadata: Metadata = {
  title: "Browse by research question",
  description:
    "Start from the question you want to answer and find NCI-supported datasets that " +
    "can support it.",
};

export default function QuestionsPage() {
  const questions = getQuestions();
  const byTopic = new Map<string, typeof questions>();
  for (const q of questions) {
    for (const t of q.topics.length > 0 ? q.topics : ["other"]) {
      byTopic.set(t, [...(byTopic.get(t) ?? []), q]);
    }
  }
  const topics = [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Browse by research question
        </h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Start from what you want to find out, not from an accession. Each question here
          has been checked against the data that would answer it, with the usable sample
          size and any statistical caveat attached.
        </p>
      </div>

      {questions.length === 0 ? (
        <EmptyState>
          No reviewed research questions yet. They are written during review of each
          showcase dataset. Browse{" "}
          <Link href="/datasets" className="underline">
            all datasets
          </Link>{" "}
          in the meantime.
        </EmptyState>
      ) : (
        <div className="space-y-10">
          {topics.map(([topic, qs]) => (
            <section key={topic}>
              <h2 className="mb-3 text-lg font-semibold tracking-tight capitalize">
                {topic.replace(/-/g, " ")}{" "}
                <span className="tnum text-[13px] font-normal t-faint">
                  {qs.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {qs.map((q) => (
                  <li key={q.qid}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="max-w-2xl font-medium leading-snug">{q.question}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Chip tone={q.feasibility === "direct" ? "accent" : "neutral"}>
                            {FEASIBILITY_LABELS[q.feasibility]}
                          </Chip>
                          {q.approx_n ? <Chip>n ≈ {num(q.approx_n)}</Chip> : null}
                        </div>
                      </div>
                      <p className="mt-2 text-[13px] t-muted">
                        {q.rationale}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[13px]">
                        <span className="t-faint">Using</span>
                        <DatasetLink id={q.dataset_id}>{q.dataset_title}</DatasetLink>
                        {q.modalities.map((m) => (
                          <Chip key={m}>{modalityLabel(m)}</Chip>
                        ))}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
