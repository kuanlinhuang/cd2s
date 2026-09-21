import Link from "next/link";

import { EvidenceChip } from "@/components/ui";
import { FIT_STATUS_LABELS, FIT_STATUS_MEANING, type FitStatus, type FitVerdict } from "@/lib/fit";

/**
 * The six verdicts as a grid. Each tile is one analysis: a status, the sentence that
 * justifies it, and the evidence chip for the field it read. Status colour is carried
 * on a left rule and the label, never on the whole tile, so six tiles do not shout.
 */

const STATUS_STYLE: Record<FitStatus, { fg: string; bg: string; glyph: string }> = {
  supported: { fg: "var(--open)", bg: "var(--open-bg)", glyph: "✓" },
  limited: { fg: "var(--moderate)", bg: "var(--moderate-bg)", glyph: "◑" },
  blocked: { fg: "var(--weak)", bg: "var(--weak-bg)", glyph: "✕" },
  unknown: { fg: "var(--text-faint)", bg: "var(--bg-sunken)", glyph: "?" },
};

export function FitBadge({ status, compact = false }: { status: FitStatus; compact?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium whitespace-nowrap ${compact ? "px-1.5 py-0.5 text-micro" : "px-2 py-0.5 text-meta"}`}
      style={{ color: s.fg, background: s.bg }}
      title={FIT_STATUS_MEANING[status]}
    >
      <span aria-hidden className="font-mono text-micro">
        {s.glyph}
      </span>
      {FIT_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * A verdict's reason, with harmonized field names set in monospace so "treatment_outcome"
 * reads as a field and not as a typo. Sentences that begin with prose are capitalized;
 * ones that begin with a field name are left as the field is spelled.
 */
export function Reason({ text }: { text: string }) {
  const parts = text.split(/(\b[a-z]+(?:_[a-z]+)+\b)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^[a-z]+(?:_[a-z]+)+$/.test(part) ? (
          <code key={i} className="font-mono text-meta" style={{ color: "var(--text)" }}>
            {part}
          </code>
        ) : (
          <span key={i}>{i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part}</span>
        ),
      )}
    </>
  );
}

/**
 * All six verdicts as one row of labelled pills.
 *
 * For places that need the shape of a dataset's capability rather than the reasoning
 * behind it - comparing two cohorts at a glance on the home page. Colour is carried on
 * a left rule and never as a fill, so six pills read as one row and not as six alarms,
 * and each pill still names its analysis, which is what makes the row legible in
 * greyscale.
 */
export function FitStrip({ verdicts }: { verdicts: FitVerdict[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {verdicts.map((v) => {
        const s = STATUS_STYLE[v.status];
        return (
          <li
            key={v.key}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-micro"
            style={{ background: "var(--bg-sunken)", borderLeft: `3px solid ${s.fg}` }}
            title={`${v.label}: ${FIT_STATUS_LABELS[v.status]}. ${v.reason}.`}
          >
            <span aria-hidden className="font-mono" style={{ color: s.fg }}>
              {s.glyph}
            </span>
            <span>{v.label}</span>
            <span className="sr-only">: {FIT_STATUS_LABELS[v.status]}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The six verdicts, and nothing that restates them.
 *
 * This used to open with a sentence summarising the tiles - "supports overall survival,
 * treatment response; cannot support stage-adjusted modelling" - directly above six
 * tiles that each say so with their own evidence. A reader who has the grid does not
 * need the list, and the count that is genuinely a summary is carried beside the
 * section heading instead.
 */
export function FitGrid({ verdicts }: { verdicts: FitVerdict[] }) {
  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {verdicts.map((v) => {
          const s = STATUS_STYLE[v.status];
          return (
            <li
              key={v.key}
              className="rounded-lg border p-3.5"
              style={{ background: "var(--bg-raised)", borderLeft: `3px solid ${s.fg}` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lede font-medium">{v.label}</h3>
                <FitBadge status={v.status} compact />
              </div>
              <p className="mt-1.5 text-body leading-snug t-muted">
                <Reason text={v.reason} />.
                {v.evidence.length > 0 && (
                  <span className="ml-1.5 inline-block align-middle">
                    <EvidenceChip evidence={v.evidence} />
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-meta t-faint">
        Judged from the repository&rsquo;s own field completeness (
        <Link href="/methods#fit" className="underline">
          thresholds
        </Link>
        ). &ldquo;Not measured&rdquo; means we have not probed that field for this record,
        not that the data lack it.
      </p>
    </div>
  );
}
