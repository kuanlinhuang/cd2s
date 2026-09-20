"use client";

import Link from "next/link";
import { useState } from "react";

import { AccessBadge, Chip, UnderexploredBadge } from "@/components/ui";
import type { AgentAnswer, AgentPick } from "@/lib/agent";
import type { AccessTier } from "@/lib/types";
import { SCARCE_MODALITIES, modalityLabel, num } from "@/lib/format";

/**
 * Describe the analysis, get the datasets that can support it.
 *
 * This is the front door, so it is one centred line: the question goes in, the ranked
 * shortlist comes out. It used to be a titled panel with a two-row textarea, which read
 * as a form to fill in among other page furniture rather than as the one thing to do
 * here. A single field on the page's centre line needs no heading to explain it.
 *
 * The answer renders the reasons and the blockers side by side, left-aligned, because a
 * verdict is read rather than aimed at: the blockers are the part a catalog never shows
 * and the part that decides whether a dataset is worth requesting.
 */

const EXAMPLES = [
  { label: "Survival in cervical cancer, Africa", q: "Survival analysis in a cervical cancer cohort from sub-Saharan Africa" },
  { label: "Treatment response in pediatric AML", q: "Treatment response in pediatric acute myeloid leukemia" },
  { label: "Imaging paired with RNA-seq", q: "Pair radiology images with RNA sequencing in lung adenocarcinoma" },
  { label: "Phosphoproteomics, open access", q: "Phosphoproteomics and outcomes in gastric cancer, open access only" },
];

const VERDICT: Record<AgentPick["verdict"], { label: string; fg: string; bg: string }> = {
  best: { label: "Start here", fg: "var(--open)", bg: "var(--open-bg)" },
  good: { label: "Good fit", fg: "var(--accent)", bg: "var(--accent-bg)" },
  caution: { label: "Check first", fg: "var(--controlled)", bg: "var(--controlled-bg)" },
};

export default function DatasetAgent() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentAnswer | null>(null);

  async function run(query: string) {
    const text = query.trim();
    if (text.length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Request failed (${res.status})`);
      setResult((await res.json()) as AgentAnswer);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(q);
        }}
        className="mx-auto max-w-[760px]"
      >
        <label htmlFor="agent-q" className="mb-2 block text-center text-meta font-medium t-muted">
          Describe the analysis you want to run
        </label>
        <div
          className="flex items-center gap-2 rounded-xl border p-2"
          style={{
            background: "var(--bg-raised)",
            borderColor: "var(--border-strong)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            aria-hidden
            focusable="false"
            className="ml-2 shrink-0"
            style={{ color: "var(--text-faint)" }}
          >
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12.8 12.8 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            id="agent-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            autoComplete="off"
            placeholder="Compare survival by subtype in breast cancer"
            className="min-w-0 flex-1 bg-transparent py-2 text-lede outline-none"
          />
          <button
            type="submit"
            disabled={busy || q.trim().length < 3}
            className="shrink-0 rounded-lg px-5 py-2.5 text-body font-semibold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
          >
            {busy ? "Finding…" : "Find datasets"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-meta">
          <span className="t-faint">Or try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              title={ex.q}
              onClick={() => {
                setQ(ex.q);
                void run(ex.q);
              }}
              className="rounded-full border px-3 py-1 t-muted hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-center text-meta t-faint">
          {busy
            ? "Checking each candidate's measured fields. This can take up to a minute."
            : (
              <>
                Every verdict is measured from the dataset&rsquo;s own records. Prefer filters?{" "}
                <Link href="/datasets" className="underline">
                  Browse all datasets
                </Link>
                .
              </>
            )}
        </p>
      </form>

      {error && (
        <p
          className="mx-auto mt-4 max-w-[760px] rounded-md border px-3 py-2 text-body"
          style={{ borderColor: "var(--weak)", color: "var(--weak)" }}
        >
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 text-left" aria-live="polite">
          <p className="text-lede leading-relaxed">{result.summary}</p>
          {result.needs.length > 0 && (
            <p className="mt-1.5 text-meta t-muted">Read from your request: {result.needs.join(", ")}.</p>
          )}
          <ol className="mt-4 space-y-3">
            {result.picks.map((p) => {
              const v = VERDICT[p.verdict];
              return (
                <li key={p.id} className="rounded-lg border p-4" style={{ background: "var(--bg-raised)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/datasets/${p.id}`} className="text-title font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                        {p.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta t-muted">
                        {p.short_title && <span className="font-mono text-micro">{p.short_title}</span>}
                        {p.n_cases !== null && <span className="tnum">{num(p.n_cases)} cases</span>}
                        <AccessBadge tier={p.access_tier as AccessTier} />
                        {p.is_underexplored && <UnderexploredBadge />}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md px-2.5 py-1 text-meta font-semibold" style={{ color: v.fg, background: v.bg }}>
                      {v.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-4 text-body sm:grid-cols-2">
                    <div>
                      <div className="text-micro font-semibold uppercase tracking-wide t-faint">Why it fits</div>
                      <ul className="mt-1 list-disc pl-5">
                        {p.why.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-micro font-semibold uppercase tracking-wide t-faint">Check first</div>
                      {p.watch_out.length === 0 ? (
                        <p className="mt-1 t-muted">No blockers found for what you described.</p>
                      ) : (
                        <ul className="mt-1 list-disc pl-5">
                          {p.watch_out.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.modalities.slice(0, 7).map((m) => (
                      <Chip key={m} tone={SCARCE_MODALITIES.has(m) ? "scarce" : "neutral"}>
                        {modalityLabel(m)}
                      </Chip>
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-meta">
            {result.picks.length > 1 && (
              <Link href={`/compare?ids=${result.picks.map((p) => p.id).join(",")}`} className="underline" style={{ color: "var(--accent)" }}>
                Compare these side by side
              </Link>
            )}
            <span className="t-faint">
              {result.mode === "llm"
                ? `Shortlist measured from the data; ranked and explained by ${result.model ?? "a language model"} through OpenRouter.`
                : result.note}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
