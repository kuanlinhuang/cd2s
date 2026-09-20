import Link from "next/link";

import { Chip } from "@/components/ui";
import { num, shortDate } from "@/lib/format";
import type { NotebookGuide } from "@/lib/types";

const NOTEBOOK_NOTES: Record<string, { problem: string; lesson: string }> = {
  "01_can_i_answer_this": {
    problem: "A portal can list a field even when every value is an unusable non-answer.",
    lesson: "Decide whether the analysis is possible before requesting data or writing a protocol.",
  },
  "02_survival_tcga_brca": {
    problem: "Survival time is split across three fields and includes sentinel values that look numeric.",
    lesson: "Derive a defensible endpoint, account for exclusions, then fit and interpret the model.",
  },
  "03_treatment_response_cervical": {
    problem: "Disease-status codes and true response categories are easy to mix into one misleading outcome.",
    lesson: "Validate the response field, collapse repeated records, and state what the observational result cannot prove.",
  },
  "04_scarce_modality_cptac": {
    problem: "Rare proteomic layers are scattered across study records and may cover different patients.",
    lesson: "Find genuinely scarce measurements and bound the complete-case cohort before designing the study.",
  },
  "05_cross_repository_linkage": {
    problem: "Molecular and imaging data for the same cohort live in separate NCI repositories.",
    lesson: "Join shared patient identifiers and quantify the real multimodal overlap, not the advertised totals.",
  },
  "06_agent_dataset_selection": {
    problem: "Ranking by size or fame can select a large dataset that cannot answer the question.",
    lesson: "Filter on measured capability, rank on fit, and carry blocking limitations into the analysis brief.",
  },
};

function runtime(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  return `${Math.round(seconds / 60)} minutes`;
}

export default function NotebookGallery({
  guides,
  compact = false,
}: {
  guides: NotebookGuide[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid gap-4 lg:grid-cols-3" : "space-y-5"}>
      {guides.map((guide, index) => {
        const note = NOTEBOOK_NOTES[guide.slug];
        const receipt = guide.receipt;
        return (
          <article
            id={guide.slug}
            key={guide.slug}
            className={`scroll-mt-24 overflow-hidden rounded-xl border ${compact ? "flex flex-col" : ""}`}
            style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-card)" }}
          >
            <div className={compact ? "p-5" : "grid lg:grid-cols-[minmax(0,1fr)_320px]"}>
              <div className={compact ? "" : "p-5 sm:p-6"}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full font-mono text-meta font-bold"
                    style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Chip tone={guide.level === "beginner" ? "accent" : "neutral"}>
                    {guide.level}
                  </Chip>
                  <Chip>{guide.language}</Chip>
                  {guide.est_runtime && <Chip>{guide.est_runtime}</Chip>}
                  {receipt?.executed && <Chip tone="accent">executed end to end</Chip>}
                </div>

                <h3 className={compact ? "text-title font-semibold" : "text-lg font-semibold tracking-tight"}>
                  {guide.title}
                </h3>
                <p className="mt-2 text-body t-muted">{guide.question}</p>

                {note && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                        The trap it prevents
                      </div>
                      <p className="mt-0.5 text-body">{note.problem}</p>
                    </div>
                    <div>
                      <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                        What you leave with
                      </div>
                      <p className="mt-0.5 text-body">{note.lesson}</p>
                    </div>
                  </div>
                )}

                {compact ? (
                  <Link
                    href={`/notebooks#${guide.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    See the complete workflow <span aria-hidden>→</span>
                  </Link>
                ) : (
                  <>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                          Workflow
                        </div>
                        <ol className="mt-2 space-y-2 text-body">
                          {guide.steps.map((step, stepIndex) => (
                            <li key={step} className="flex gap-2.5">
                              <span
                                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-micro"
                                style={{ background: "var(--bg-sunken)", color: "var(--text-muted)" }}
                              >
                                {stepIndex + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                          Outputs you can inspect
                        </div>
                        <ul className="mt-2 space-y-2 text-body">
                          {guide.outputs.map((output) => (
                            <li key={output} className="flex gap-2.5">
                              <span aria-hidden style={{ color: "var(--strong)" }}>✓</span>
                              <span>{output}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                        See it on real datasets
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {guide.datasets.map((dataset) => (
                          <Link
                            key={dataset.id}
                            href={`/datasets/${dataset.id}#ways`}
                            className="rounded-full border px-3 py-1 text-meta font-medium hover:border-[var(--accent)]"
                            style={{ borderColor: "var(--border-strong)" }}
                          >
                            {dataset.short_title ?? dataset.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!compact && (
                <aside
                  className="border-t p-5 lg:border-t-0 lg:border-l lg:p-6"
                  style={{ background: "var(--bg-sunken)" }}
                >
                  <div className="text-micro font-semibold uppercase tracking-wider t-faint">
                    Reproducibility record
                  </div>
                  {receipt?.executed ? (
                    <dl className="mt-3 space-y-3 text-body">
                      <div>
                        <dt className="text-meta t-muted">Status</dt>
                        <dd className="font-medium" style={{ color: "var(--strong)" }}>
                          Ran successfully
                        </dd>
                      </div>
                      {receipt.executed_at && (
                        <div>
                          <dt className="text-meta t-muted">Executed</dt>
                          <dd>{shortDate(receipt.executed_at)}</dd>
                        </div>
                      )}
                      {runtime(receipt.runtime_seconds) && (
                        <div>
                          <dt className="text-meta t-muted">Recorded runtime</dt>
                          <dd>{runtime(receipt.runtime_seconds)}</dd>
                        </div>
                      )}
                      {receipt.n_cells_executed && (
                        <div>
                          <dt className="text-meta t-muted">Cells completed</dt>
                          <dd className="tnum">
                            {num(receipt.n_cells_executed)} of {num(receipt.n_cells)}
                          </dd>
                        </div>
                      )}
                      {receipt.output_hash && (
                        <div>
                          <dt className="text-meta t-muted">Output fingerprint</dt>
                          <dd className="break-all font-mono text-micro">
                            {receipt.output_hash.slice(0, 20)}…
                          </dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="mt-2 text-body t-muted">No execution receipt is attached.</p>
                  )}

                  <div className="mt-5 border-t pt-4">
                    <div className="text-meta t-muted">Source</div>
                    <code className="mt-1 block break-all text-micro">{guide.workbook_path}</code>
                    <div className="mt-3 flex flex-wrap gap-2">
                    {guide.notebook_download_url && (
                      <a
                        href={guide.notebook_download_url}
                        download
                        className="inline-flex rounded-md px-3 py-1.5 text-meta font-medium"
                        style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
                      >
                        Download executed notebook
                      </a>
                    )}
                    {guide.workbook_url && (
                      <a
                        href={guide.workbook_url}
                        className="inline-flex rounded-md border px-3 py-1.5 text-meta font-medium"
                        style={{ borderColor: "var(--border-strong)" }}
                      >
                        View notebook source
                      </a>
                    )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
