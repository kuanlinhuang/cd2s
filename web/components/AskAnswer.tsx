"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AccessBadge, Chip, UnderexploredBadge } from "@/components/ui";
import type { AgentAnswer, AgentPick } from "@/lib/agent";
import { bulletAnchor } from "@/lib/anchors";
import { showsShortlist } from "@/lib/answer-view";
import { SCARCE_MODALITIES, modalityLabel, num } from "@/lib/format";
import type { AccessTier } from "@/lib/types";

/**
 * The dataset shortlist for a question, fetched from /api/v1/agent and rendered with
 * one rule: every line links to the section of the dataset page that carries the
 * evidence for it. The wording is the agent's, verbatim; this component only adds the
 * links and the routes onward.
 *
 * When the router above has already offered a destination, the shortlist renders
 * nothing until it has picks to show - no placeholder cards on the way, and nothing at
 * all if it finds none. The alternative is a sentence saying nothing matched printed
 * directly beneath a card naming the dataset that did, and the two surfaces must not be
 * able to disagree about the same question.
 */

export interface NeedLink {
  href: string;
  label: string;
}

const VERDICT: Record<AgentPick["verdict"], { label: string; fg: string; bg: string }> = {
  best: { label: "Start here", fg: "var(--open)", bg: "var(--open-bg)" },
  good: { label: "Good fit", fg: "var(--accent)", bg: "var(--accent-bg)" },
  caution: { label: "Check first", fg: "var(--controlled)", bg: "var(--controlled-bg)" },
};

/**
 * How long the browser waits before giving up.
 *
 * Just past the route's own 60s budget, so a server that answered slowly is still
 * rendered and only a request that never arrives is reported as a timeout.
 */
const CLIENT_TIMEOUT_MS = 65_000;

/** The outcome of asking one question; `busy` is simply "no outcome yet for this q". */
type Outcome = { q: string; result: AgentAnswer | null; error: string | null };

export default function AskAnswer({ q, needLinks, routed }: { q: string; needLinks: NeedLink[]; routed: boolean }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // The route budgets itself at 60s and gives the model 45s before answering from
    // rules, so the only way past this is a request that never lands at all. Without a
    // deadline here the button simply stayed on "checking" for as long as the tab was
    // open; with one the visitor is told, and can ask again.
    let timedOut = false;
    const deadline = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);
    fetch("/api/v1/agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        return (await res.json()) as AgentAnswer;
      })
      .then((answer) => setOutcome({ q, result: answer, error: null }))
      .catch((e: unknown) => {
        if (timedOut) {
          setOutcome({
            q,
            result: null,
            error: "The shortlist took too long to come back. Ask again, or browse the datasets directly.",
          });
          return;
        }
        // Aborted because the question changed or the page went away: the next run owns
        // the outcome, so this one must not write an error over it.
        if (controller.signal.aborted) return;
        setOutcome({ q, result: null, error: e instanceof Error ? e.message : "Something went wrong." });
      })
      .finally(() => clearTimeout(deadline));
    return () => {
      clearTimeout(deadline);
      controller.abort();
    };
  }, [q]);

  const busy = outcome === null || outcome.q !== q;
  const error = busy ? null : outcome.error;
  const result = busy ? null : outcome.result;

  if (busy) {
    if (routed) return null;
    return (
      <div aria-live="polite" aria-busy="true">
        <p className="text-body t-muted">Checking each candidate&rsquo;s measured fields.</p>
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border" style={{ background: "var(--bg-raised)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border px-3 py-2 text-body" style={{ borderColor: "var(--weak)", color: "var(--weak)" }}>
        {error}
      </p>
    );
  }
  if (!result) return null;
  if (!showsShortlist(result.picks.length, routed)) return null;

  return (
    <div aria-live="polite">
      <p className="text-lede leading-relaxed">{result.summary}</p>
      {result.needs.length > 0 && (
        <p className="mt-1 text-meta t-muted">Read from your request: {result.needs.join(", ")}.</p>
      )}

      <ol className="mt-4 space-y-3">
        {result.picks.map((p) => {
          const v = VERDICT[p.verdict];
          return (
            <li key={p.id} className="rounded-lg border p-3" style={{ background: "var(--bg-raised)" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/datasets/${p.id}`} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                    {p.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta t-muted">
                    {p.short_title && <span className="font-mono text-micro">{p.short_title}</span>}
                    {p.n_cases !== null && <span className="tnum">{num(p.n_cases)} cases</span>}
                    <AccessBadge tier={p.access_tier as AccessTier} />
                    {p.is_underexplored && (
                      <Link href="/underexplored">
                        <UnderexploredBadge />
                      </Link>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded px-2 py-0.5 text-micro font-medium" style={{ color: v.fg, background: v.bg }}>
                  {v.label}
                </span>
              </div>

              <div className="mt-2 grid gap-3 text-body sm:grid-cols-2">
                <Bullets id={p.id} heading="Why it fits" items={p.why} empty={null} />
                <Bullets
                  id={p.id}
                  heading="Check first"
                  items={p.watch_out}
                  empty="No blockers found for what you described."
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {p.modalities.slice(0, 7).map((m) => (
                    <Chip key={m} tone={SCARCE_MODALITIES.has(m) ? "scarce" : "neutral"}>
                      {modalityLabel(m)}
                    </Chip>
                  ))}
                </div>
                <Link href={`/datasets/${p.id}#fit`} className="text-meta underline" style={{ color: "var(--accent)" }}>
                  Measured fit
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      {result.pan_cancer_count > 0 && (
        <p className="mt-3 text-meta t-muted">
          <Link href="/datasets?subject=pan_cancer" className="underline">
            {result.pan_cancer_count} pan-cancer datasets
          </Link>{" "}
          are not filed under one cancer type.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-body">
        {result.picks.length > 1 && (
          <Link
            href={`/compare?ids=${result.picks.map((p) => p.id).join(",")}`}
            className="rounded-md border px-3 py-1.5 font-medium"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}
          >
            Compare these {result.picks.length} side by side
          </Link>
        )}
        {needLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md border px-3 py-1.5 font-medium"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-raised)" }}
          >
            {l.label}
          </Link>
        ))}
        <span className="ml-auto text-meta t-faint">
          {result.mode === "llm"
            ? "Shortlist from measured fields; wording by a language model. "
            : "Shortlist from measured fields; ranked by rules. "}
          <Link href="/methods#agent" className="underline">
            How this works
          </Link>
        </span>
      </div>
    </div>
  );
}

function Bullets({
  id,
  heading,
  items,
  empty,
}: {
  id: string;
  heading: string;
  items: string[];
  empty: string | null;
}) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wide t-faint">{heading}</div>
      {items.length === 0 ? (
        empty && <p className="mt-0.5 t-muted">{empty}</p>
      ) : (
        <ul className="mt-0.5 list-disc pl-4">
          {items.map((w, i) => {
            const anchor = bulletAnchor(w);
            return (
              <li key={i}>
                {w}
                {anchor && (
                  <>
                    {" "}
                    <Link
                      href={`/datasets/${id}${anchor}`}
                      className="whitespace-nowrap text-micro underline"
                      style={{ color: "var(--accent)" }}
                      aria-label={`Where this came from: ${w}`}
                    >
                      source
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
