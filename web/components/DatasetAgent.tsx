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
 * The form posts to /api/v1/agent and renders the ranked shortlist with the reasons and
 * the blockers side by side, because the blockers are the part a catalog never shows.
 */

const EXAMPLES = [
  "Survival analysis in a cervical cancer cohort from sub-Saharan Africa",
  "Treatment response in pediatric acute myeloid leukemia",
  "Pair radiology images with RNA sequencing in lung adenocarcinoma",
  "Phosphoproteomics and outcomes in gastric cancer, open access only",
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
        className="rounded-lg border p-4"
        style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-semibold">Cancer Data Agent</h2>
          <span className="text-[12px] t-muted">Finds the datasets that can support the analysis you describe</span>
        </div>
        <label htmlFor="agent-q" className="mt-2 block text-[12px] font-medium t-muted">
          Describe the analysis you want to run
        </label>
        <textarea
          id="agent-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void run(q);
            }
          }}
          rows={2}
          placeholder="For example: compare survival by molecular subtype in a breast cancer cohort with treatment records"
          className="mt-1.5 w-full resize-none rounded-md border px-3 py-2 text-[14px]"
          style={{ background: "var(--bg)", borderColor: "var(--border)" }}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQ(ex);
                  void run(ex);
                }}
                className="rounded-full border px-2.5 py-0.5 text-[11px] hover:border-[var(--accent)] t-muted"
                style={{ borderColor: "var(--border)" }}
              >
                {ex}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={busy || q.trim().length < 3}
            className="rounded-md px-4 py-1.5 text-[13px] font-medium disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
          >
            {busy ? "Finding datasets…" : "Find datasets"}
          </button>
        </div>
      </form>
      <p className="mt-1.5 text-[12px] t-faint">
        {busy ? "Checking each candidate's measured fields. This can take up to a minute. " : ""}
        Or use the{" "}
        <Link href="/datasets" className="underline">
          browse page
        </Link>{" "}
        with filters.
      </p>

      {error && (
        <p className="mt-3 rounded-md border px-3 py-2 text-[13px]" style={{ borderColor: "var(--weak)", color: "var(--weak)" }}>
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4" aria-live="polite">
          <p className="text-[14px] leading-relaxed">{result.summary}</p>
          {result.needs.length > 0 && (
            <p className="mt-1 text-[12px] t-muted">
              Read from your request: {result.needs.join(", ")}.
            </p>
          )}
          <ol className="mt-3 space-y-3">
            {result.picks.map((p) => {
              const v = VERDICT[p.verdict];
              return (
                <li key={p.id} className="rounded-lg border p-3" style={{ background: "var(--bg-raised)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/datasets/${p.id}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                        {p.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] t-muted">
                        {p.short_title && <span className="font-mono text-[11px]">{p.short_title}</span>}
                        {p.n_cases !== null && <span className="tnum">{num(p.n_cases)} cases</span>}
                        <AccessBadge tier={p.access_tier as AccessTier} />
                        {p.is_underexplored && <UnderexploredBadge />}
                      </div>
                    </div>
                    <span className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium" style={{ color: v.fg, background: v.bg }}>
                      {v.label}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-3 text-[13px] sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide t-faint">Why it fits</div>
                      <ul className="mt-0.5 list-disc pl-4">
                        {p.why.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide t-faint">Check first</div>
                      {p.watch_out.length === 0 ? (
                        <p className="mt-0.5 t-muted">No blockers found for what you described.</p>
                      ) : (
                        <ul className="mt-0.5 list-disc pl-4">
                          {p.watch_out.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px]">
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
