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
        <h1 className="text-2xl font-semibold tracking-tight">Research questions</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          {questions.length} research questions, each checked against the dataset that can
          answer it, with the usable sample size and any caveat.
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
