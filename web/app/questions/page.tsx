import type { Metadata } from "next";
import Link from "next/link";

import QuestionBrowser from "@/components/QuestionBrowser";
import { EmptyState } from "@/components/ui";
import { getQuestions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Research questions",
  description:
    "Start from the question you want to answer and find NCI-supported datasets that " +
    "can support it.",
};

export default function QuestionsPage() {
  const questions = getQuestions();

  return (
    <>
      <div className="pt-10 pb-6">
        <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Question-first discovery
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Start from a research question</h1>
        <p className="mt-3 max-w-3xl text-lede t-muted">
          {questions.length} reviewed questions, each matched to data that can answer it.
          See why the match works, the usable sample size, and the caveat to carry into analysis.
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
        <QuestionBrowser questions={questions} />
      )}
    </>
  );
}
