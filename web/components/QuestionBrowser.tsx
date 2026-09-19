"use client";

import { useMemo, useState } from "react";

import { Card, Chip, DatasetLink, EmptyState } from "@/components/ui";
import { FEASIBILITY_LABELS, modalityLabel, num } from "@/lib/format";
import { groupByTopic, matchesQuery, topicLabel, topicsOf } from "@/lib/questions";
import type { QuestionRow } from "@/lib/types";

/**
 * Browse the reviewed research questions.
 *
 * Every question is on the page by default, once, so a first visit shows the whole set.
 * Topics are tags rather than categories (most questions carry two or three), so they
 * appear on each card and drive the filter instead of splitting the list into sections.
 */
export default function QuestionBrowser({ questions }: { questions: QuestionRow[] }) {
  const topics = useMemo(() => groupByTopic(questions), [questions]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      questions.filter(
        (q) =>
          (!selectedTopic || topicsOf(q).includes(selectedTopic)) &&
          matchesQuery(q, query, modalityLabel),
      ),
    [questions, query, selectedTopic],
  );

  const filtering = selectedTopic !== "" || query.trim() !== "";

  return (
    <div>
      <div
        className="mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]"
        style={{ background: "var(--bg-raised)" }}
      >
        <div>
          <label
            htmlFor="question-topic"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide t-faint"
          >
            Topic
          </label>
          <select
            id="question-topic"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
            className="w-full min-w-0 rounded-md border px-2.5 py-2 text-[13px]"
            style={{ background: "var(--bg)", borderColor: "var(--border-strong)" }}
          >
            <option value="">All topics ({questions.length} questions)</option>
            {topics.map((g) => (
              <option key={g.topic} value={g.topic}>
                {topicLabel(g.topic)} ({g.questions.length})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="question-search"
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide t-faint"
          >
            Search questions
          </label>
          <input
            id="question-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="For example: treatment, imaging, gastric cancer"
            className="w-full min-w-0 rounded-md border px-2.5 py-2 text-[13px]"
            style={{ background: "var(--bg)", borderColor: "var(--border-strong)" }}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {selectedTopic ? topicLabel(selectedTopic) : "All reviewed questions"}
        </h2>
        <p className="text-[12px] t-muted" aria-live="polite">
          {filtering ? (
            <>
              Showing <span className="tnum">{visible.length}</span> of{" "}
              <span className="tnum">{questions.length}</span>.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setSelectedTopic("");
                  setQuery("");
                }}
              >
                Show all
              </button>
            </>
          ) : (
            <>
              <span className="tnum">{questions.length}</span> questions. Click a topic tag to
              filter.
            </>
          )}
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState>
          No questions match this topic and search. Try another topic or clear the search.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((q) => (
            <li key={q.qid}>
              <QuestionCard
                question={q}
                selectedTopic={selectedTopic}
                onPickTopic={setSelectedTopic}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionCard({
  question: q,
  selectedTopic,
  onPickTopic,
}: {
  question: QuestionRow;
  selectedTopic: string;
  onPickTopic: (topic: string) => void;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-2xl font-medium leading-snug">{q.question}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Chip
            tone={q.feasibility === "direct" ? "accent" : "neutral"}
            title="Whether the analysis can run on the data as published, or needs access approval or extra work first"
          >
            {FEASIBILITY_LABELS[q.feasibility]}
          </Chip>
          {q.approx_n ? (
            <Chip title="Approximate number of cases usable for this question">
              n ≈ {num(q.approx_n)}
            </Chip>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-[13px] t-muted">{q.rationale}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px]">
        <span className="t-faint">Using</span>
        <DatasetLink id={q.dataset_id}>{q.dataset_title}</DatasetLink>
        {q.modalities.map((m) => (
          <Chip key={m}>{modalityLabel(m)}</Chip>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px]">
        <span className="t-faint">Topics</span>
        {topicsOf(q).map((t) => {
          const active = t === selectedTopic;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onPickTopic(active ? "" : t)}
              aria-pressed={active}
              className="rounded px-1.5 py-0.5 text-[11px] hover:underline"
              style={{
                color: active ? "var(--accent-text)" : "var(--text-muted)",
                background: active ? "var(--accent-bg)" : "var(--bg-sunken)",
              }}
            >
              {topicLabel(t)}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
