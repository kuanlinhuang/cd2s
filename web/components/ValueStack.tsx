import Link from "next/link";

/**
 * The one figure that has to land: what NIH already publishes, the two things that
 * still cost a researcher weeks, and what CD2S puts in each of those two places.
 *
 * It is drawn rather than written. The page used to make this argument in two prose
 * paragraphs, which is the slowest possible way to say "the data are already public,
 * the hard part is elsewhere". Three stacked bands carry the same claim at a glance,
 * and every line under a wall is a live count linking to the page that holds it, so
 * the figure is also the navigation.
 *
 * All of the figure's words live here and every number comes from the caller. That
 * split is the whole API: editing the copy means editing this file, and nothing here
 * can quietly disagree with the corpus, because there is no figure in it to go stale.
 */

export interface ValueStackCounts {
  /** Records in the corpus. */
  datasets: number;
  /** Records whose clinical fields have been measured, so the six verdicts are real. */
  measured: number;
  /** Reviewed research questions, each already attached to a dataset. */
  questions: number;
  /** Records that appear in more than one repository, so the two can be joined. */
  crossRepository: number;
  /** Records whose page carries starter code. */
  starters: number;
  /** Executed notebooks in the library. */
  notebooks: number;
}

function Chevron({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5" aria-hidden>
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span className="text-micro font-medium uppercase tracking-wider t-faint">{label}</span>
      <svg width="13" height="8" viewBox="0 0 13 8" className="t-faint" focusable="false">
        <path
          d="M1.5 1.5 6.5 6.5 11.5 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

interface Wall {
  step: string;
  /** The question in the researcher's own words. */
  question: string;
  /** Why it is slow today. */
  cost: string;
  /**
   * A count, what it is, and where to go and see it.
   *
   * Keep a label under about fifty characters. These are read as a scannable column of
   * six, and at the full container width anything longer wraps onto a second line,
   * which breaks the rhythm the column is for. Narrower than `lg` they all wrap and
   * there is nothing to be done about it; the budget is for where it can be held.
   */
  helps: { value: string; label: string; href: string }[];
}

function walls(n: ValueStackCounts): [Wall, Wall] {
  const count = (v: number) => v.toLocaleString("en-US");
  return [
    {
      step: "01",
      question: "Which one can answer my research question?",
      cost:
        "A portal tells you what is in a dataset, not whether it can answer your " +
        "question. Finding that out means reading papers and data dictionaries, or " +
        "downloading it and hoping.",
      helps: [
        {
          value: count(n.measured),
          label: "datasets checked for the six most-asked analyses",
          href: "/datasets",
        },
        {
          value: count(n.questions),
          label: "research questions already matched to a dataset",
          href: "/questions",
        },
        {
          value: count(n.crossRepository),
          label: "cohorts you can combine across two repositories",
          href: "/compare",
        },
      ],
    },
    {
      step: "02",
      question: "How do I download it and clean it up?",
      cost:
        "Every repository names its fields differently, “not reported” looks " +
        "the same as a real answer, and joining two cohorts can quietly change who you " +
        "are studying.",
      helps: [
        {
          value: count(n.starters),
          label: "datasets with working download code on the page",
          href: "/datasets",
        },
        {
          value: count(n.notebooks),
          label: "community examples that go from download to result",
          href: "/notebooks",
        },
        {
          value: "JSON",
          label: "every dataset as data, for an AI agent to read",
          href: "/agents",
        },
      ],
    },
  ];
}

export default function ValueStack({
  repositories,
  counts,
}: {
  repositories: { name: string; count: number }[];
  counts: ValueStackCounts;
}) {
  return (
    <figure className="m-0">
      <div
        className="rounded-xl border px-5 py-4 sm:px-6"
        style={{ background: "var(--bg-raised)" }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-micro font-semibold uppercase tracking-wider t-faint">
            NIH-funded research already shares
          </span>
          <ul className="flex flex-wrap items-center gap-2">
            {repositories.map((repository) => (
              <li
                key={repository.name}
                className="flex items-baseline gap-1.5 rounded-full border px-2.5 py-1"
                style={{ borderColor: "var(--border-strong)", background: "var(--bg-sunken)" }}
              >
                <span className="font-mono text-micro font-semibold">{repository.name}</span>
                <span className="tnum text-micro t-muted">{repository.count}</span>
              </li>
            ))}
          </ul>
          <span className="ml-auto text-meta t-muted">
            {counts.datasets.toLocaleString("en-US")} datasets, already public
          </span>
        </div>
      </div>

      <Chevron label="but two things still take weeks" />

      {/* Two rows shared by both cards: the two accent bands then start on the same
          line whatever length the costs and the help lists run to, which equal card
          heights alone do not give you. */}
      <div className="grid gap-4 md:grid-cols-2 md:grid-rows-[auto_auto]">
        {walls(counts).map((wall) => (
          <div
            key={wall.step}
            className="flex h-full flex-col overflow-hidden rounded-xl border md:row-span-2 md:grid md:grid-rows-subgrid"
            style={{ background: "var(--bg-raised)" }}
          >
            <div className="flex-1 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-baseline gap-2.5">
                <span
                  className="font-mono text-micro font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {wall.step}
                </span>
                <h3 className="text-title font-semibold tracking-tight">{wall.question}</h3>
              </div>
              <p className="mt-1.5 text-body t-muted">{wall.cost}</p>
            </div>

            <div
              className="border-t px-5 py-4 sm:px-6"
              style={{ background: "var(--accent-bg)", borderColor: "var(--border)" }}
            >
              <p
                className="text-micro font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                Here is what CD2S gives you
              </p>
              <ul className="mt-2.5 space-y-1.5">
                {wall.helps.map((help) => (
                  <li key={help.label}>
                    <Link
                      href={help.href}
                      className="group flex items-baseline gap-2.5 rounded py-0.5"
                    >
                      <span
                        className="tnum w-14 shrink-0 text-right text-body font-semibold"
                        style={{ color: "var(--accent)" }}
                      >
                        {help.value}
                      </span>
                      <span className="text-body group-hover:underline">{help.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <Chevron label="so you get to" />

      <p
        className="rounded-xl border px-5 py-3.5 text-center text-lede font-medium sm:px-6"
        style={{ background: "var(--bg-raised)" }}
      >
        An analysis you can defend, in days instead of months.
      </p>
    </figure>
  );
}
