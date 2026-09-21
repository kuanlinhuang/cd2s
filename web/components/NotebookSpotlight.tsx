import Image from "next/image";
import Link from "next/link";

import { Credit } from "@/components/ShareExample";
import { Chip } from "@/components/ui";
import { HOUSE_CONTRIBUTOR } from "@/lib/community";
import { shortDate } from "@/lib/format";
import type { NotebookGuide } from "@/lib/types";

/**
 * One notebook, at the size its figure needs, plus the rest of the library as a list.
 *
 * The home page used to show three notebooks as third-width cards with no figure at
 * all, because a 1000px matplotlib figure with 8.5pt axis labels is a smudge in a
 * 340px card. Trading three illegible teasers for one readable one is what lets the
 * strongest thing the project ships - code that ran, with the numbers it produced -
 * appear on the front page rather than only behind a link.
 *
 * The findings are the depth. `outputs` names the kinds of result the code produces;
 * a finding is a result, so it is always stamped with the date of the run that
 * produced it and never presented as a standing fact about the data.
 */

export function NotebookFindings({ guide }: { guide: NotebookGuide }) {
  if (guide.findings.length === 0) return null;
  const when = guide.receipt?.executed_at ? shortDate(guide.receipt.executed_at) : null;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <div className="text-micro font-semibold uppercase tracking-wider t-faint">
          What it found when it ran
        </div>
        {/* A finding is true of one run, so it never appears without that run's date. */}
        {when && <div className="text-micro t-faint">run of {when}</div>}
      </div>
      <ul className="mt-2 space-y-2">
        {guide.findings.map((finding) => (
          <li key={finding} className="flex gap-2.5 text-body">
            <span
              aria-hidden
              className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: "var(--viz-1)" }}
            />
            <span>{finding}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NotebookSpotlight({
  hero,
  others,
}: {
  hero: NotebookGuide;
  others: NotebookGuide[];
}) {
  // All three or none: a figure needs its intrinsic size to lay out without shifting.
  const figure =
    hero.notebook_preview_url && hero.notebook_preview_width && hero.notebook_preview_height
      ? {
          src: hero.notebook_preview_url,
          width: hero.notebook_preview_width,
          height: hero.notebook_preview_height,
        }
      : null;

  return (
    <div className="space-y-4">
      <article
        className="overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {figure && (
            <figure
              className="m-0 border-b lg:border-b-0 lg:border-r"
              style={{ background: "#ffffff" }}
            >
              <Image
                {...figure}
                alt={hero.figure ?? `Figure produced by ${hero.title}`}
                sizes="(min-width: 1024px) 52vw, 100vw"
                quality={90}
                className="block h-auto w-full"
              />
            </figure>
          )}

          <div className="p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {/* Gated, not assumed. Once outside examples can land here, the first
                  one without a receipt would otherwise be badged as executed on the
                  front page with nothing behind the claim. */}
              {hero.receipt?.executed && <Chip tone="accent">executed end to end</Chip>}
              <Chip>{hero.level}</Chip>
              <Chip>{hero.language}</Chip>
              {hero.est_runtime && <Chip>{hero.est_runtime}</Chip>}
            </div>

            <h3 className="text-lg font-semibold tracking-tight">{hero.question}</h3>
            <p className="mt-1.5 text-body t-muted">{hero.title}</p>
            <div className="mt-1.5">
              <Credit
                contributor={hero.contributor ?? HOUSE_CONTRIBUTOR}
                contributorUrl={hero.contributor_url}
                when={hero.receipt?.executed_at ? shortDate(hero.receipt.executed_at) : null}
              />
            </div>

            <div className="mt-4">
              <NotebookFindings guide={hero} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                href={`/notebooks#${hero.slug}`}
                className="rounded-md px-3.5 py-2 text-body font-medium"
                style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
              >
                Read the whole workflow
              </Link>
              {hero.notebook_download_url && (
                <a
                  href={hero.notebook_download_url}
                  download
                  className="text-body font-medium underline"
                  style={{ color: "var(--accent)" }}
                >
                  Download the notebook
                </a>
              )}
            </div>
          </div>
        </div>
      </article>

      <ul className="grid gap-3 sm:grid-cols-2">
        {others.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/notebooks#${guide.slug}`}
              className="group flex h-full flex-col rounded-xl border p-4 hover:border-[var(--accent)]"
              style={{ background: "var(--bg-raised)" }}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-body font-semibold group-hover:underline">
                  {guide.question}
                </span>
                <span className="shrink-0 text-micro t-faint">{guide.level}</span>
              </span>
              {guide.findings[0] && (
                <span className="mt-1.5 text-meta t-muted">{guide.findings[0]}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
