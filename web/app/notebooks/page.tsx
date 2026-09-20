import type { Metadata } from "next";
import Link from "next/link";

import NotebookGallery from "@/components/NotebookGallery";
import { getNotebookGuides, getStats } from "@/lib/data";
import { num } from "@/lib/format";

export const metadata: Metadata = {
  title: "Analysis notebooks",
  description:
    "Executed cancer data analysis notebooks that show how to choose, retrieve, clean, join and analyze NCI-supported datasets.",
};

export default function NotebooksPage() {
  const guides = getNotebookGuides();
  const stats = getStats();

  return (
    <>
      <header className="notebook-hero relative overflow-hidden border-b py-12 sm:py-16">
        <div className="relative z-10 max-w-4xl">
          <p className="text-meta font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--accent)" }}>
            From discovery to working analysis
          </p>
          <h1 className="mt-3 max-w-[22ch] text-3xl font-semibold tracking-tight sm:text-4xl">
            Do not stop at a download link.
          </h1>
          <p className="mt-5 max-w-[70ch] text-lede t-muted">
            These {num(guides.length)} notebooks show the difficult middle of cancer data reuse:
            choosing data that can answer the question, retrieving it from public APIs, cleaning
            deceptive fields, joining repositories, and producing an analysis you can inspect.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#notebook-library"
              className="rounded-md px-4 py-2 text-body font-medium"
              style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
            >
              Explore all {num(guides.length)} notebooks
            </a>
            <Link
              href="/datasets?capability=workbook"
              className="rounded-md border px-4 py-2 text-body font-medium"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}
            >
              Browse the {num(stats.n_datasets_with_workbook ?? 0)} covered datasets
            </Link>
          </div>
        </div>
      </header>

      <section className="py-10">
        <div className="mb-5 max-w-3xl">
          <p className="text-micro font-semibold uppercase tracking-wider t-faint">What every example includes</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">A complete path, with the traps visible</h2>
        </div>
        <div className="analysis-path grid overflow-hidden rounded-xl border md:grid-cols-4">
          {[
            ["01", "Choose", "Match the research question to measured data capability."],
            ["02", "Retrieve", "Use the repository API and state every required input."],
            ["03", "Clean and check", "Expose missingness, non-answers, joins and exclusions."],
            ["04", "Analyze and verify", "Produce interpretable outputs plus an execution receipt."],
          ].map(([n, title, body], index) => (
            <div
              key={title}
              className={`relative p-5 ${index > 0 ? "border-t md:border-t-0 md:border-l" : ""}`}
              style={{ background: index === 3 ? "var(--accent-bg)" : "var(--bg-raised)" }}
            >
              <div className="font-mono text-micro font-bold" style={{ color: "var(--accent)" }}>{n}</div>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-meta t-muted">{body}</p>
              {index < 3 && (
                <span aria-hidden className="analysis-path-arrow hidden md:grid">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="notebook-library" className="scroll-mt-20 border-t py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-micro font-semibold uppercase tracking-wider t-faint">Notebook library</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Six reusable research workflows</h2>
          </div>
          <p className="max-w-xl text-meta t-muted">
            Each example ran end to end against the public data named in its receipt.
            Adapt the workflow, then recheck its assumptions for your cohort.
          </p>
        </div>
        <NotebookGallery guides={guides} />
      </section>
    </>
  );
}
