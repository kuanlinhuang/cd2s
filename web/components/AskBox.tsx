"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The question box. It is the front door: one field, and submitting navigates to
 * /ask?q=… so the answer has a URL, the back button returns to the question, and the
 * home page itself stays static.
 */

export const EXAMPLES = [
  "Survival analysis in a cervical cancer cohort from sub-Saharan Africa",
  "Treatment response in pediatric acute myeloid leukemia",
  "Pair radiology images with RNA sequencing in lung adenocarcinoma",
  "Phosphoproteomics and outcomes in gastric cancer, open access only",
];

/** The same examples, short enough for two per row on a phone. */
const SHORT = [
  "Cervical cancer survival, Africa",
  "Pediatric AML treatment response",
  "Radiology paired with RNA-seq, lung",
  "Phosphoproteomics, open access",
];

export default function AskBox({
  initial = "",
  examples = false,
  autoFocus = false,
}: {
  initial?: string;
  /** Show the example questions under the field. */
  examples?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function go(text: string) {
    const t = text.trim();
    if (t.length < 3) return;
    router.push(`/ask?q=${encodeURIComponent(t)}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
      className="rounded-lg border p-3 sm:p-4"
      style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-card)" }}
    >
      <label htmlFor="ask-q" className="sr-only">
        Describe the analysis you want to run
      </label>
      <textarea
        id="ask-q"
        name="q"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            go(q);
          }
        }}
        rows={2}
        placeholder="For example: survival by subtype in breast cancer with treatment records"
        className="w-full resize-none rounded-md border px-3 py-2 text-[15px]"
        style={{ background: "var(--bg)", borderColor: "var(--border)" }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {examples && (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex}
                type="button"
                onClick={() => go(ex)}
                className="rounded-full border px-2.5 py-0.5 text-[12px] hover:border-[var(--accent)] t-muted"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="hidden sm:inline">{ex}</span>
                <span className="sm:hidden">{SHORT[i]}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="submit"
          disabled={q.trim().length < 3}
          className="ml-auto rounded-md px-4 py-1.5 text-[13px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
        >
          Ask
        </button>
      </div>
    </form>
  );
}
