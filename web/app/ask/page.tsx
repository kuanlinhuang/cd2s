import type { Metadata } from "next";
import Link from "next/link";

import AskAnswer, { type NeedLink } from "@/components/AskAnswer";
import AskBox from "@/components/AskBox";
import { readNeeds } from "@/lib/agent";
import { getIndex } from "@/lib/data";
import { num } from "@/lib/format";
import { routeIntent } from "@/lib/intent";

/**
 * The answer page. The question stays at the top, the router's destinations come next,
 * and the dataset shortlist follows every question. Server-rendered per request because
 * the question is in the URL.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Describe the analysis you want to run and get the datasets that can support it, " +
    "with the blockers to check first and the source of every claim.",
  robots: { index: false, follow: true },
};

/** Needs the browse page can filter on, so an answer can offer "see all N". */
const CAPABILITY_FILTER: Record<string, string> = {
  survival: "survival",
  treatment: "treatment",
  multimodal: "multimodal",
  open: "open",
};

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim().slice(0, 600);
  const index = getIndex();

  if (q.length < 3) {
    return (
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ask a question</h1>
        <p className="mt-2 max-w-2xl text-[14px] t-muted">
          Describe the analysis you want to run. The answer names the datasets that can
          support it, what would block you, and where each claim comes from.
        </p>
        <div className="mt-5">
          <AskBox examples autoFocus />
        </div>
      </div>
    );
  }

  const intent = routeIntent(q, index);
  const needLinks: NeedLink[] = readNeeds(q)
    .filter((n) => n.key in CAPABILITY_FILTER)
    .map((n) => ({
      href: `/datasets?capability=${CAPABILITY_FILTER[n.key]}`,
      label: `See all ${num(index.filter((r) => n.check(r) === true).length)} datasets with ${n.label}`,
    }));

  return (
    <>
      <div className="pt-8">
        <h1 className="sr-only">Answer</h1>
        <AskBox key={q} initial={q} />
      </div>

      {intent.routes.length > 0 && (
        <ul className="mt-4 space-y-2">
          {intent.routes.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="block rounded-lg border p-3 transition-colors hover:border-[var(--accent)]"
                style={{ background: "var(--accent-bg)", borderColor: "var(--border)" }}
              >
                <span className="font-medium" style={{ color: "var(--accent)" }}>
                  {r.label}
                </span>
                <span className="block text-[13px] t-muted">{r.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <AskAnswer key={q} q={q} needLinks={needLinks} />
      </div>
    </>
  );
}
