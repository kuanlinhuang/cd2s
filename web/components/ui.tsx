/**
 * Shared display primitives.
 *
 * The one that matters most is `EvidenceChip`. Every substantive claim on this site
 * carries one, and it resolves to where the claim came from, when it was retrieved and
 * how confident we are. That is the difference between a catalog a reader has to
 * trust and a reference work a reader can check.
 */

import Link from "next/link";
import type { ReactNode } from "react";

import type {
  AccessTier,
  Evidence,
  ReuseTier,
  ReviewStatus,
  Severity,
} from "@/lib/types";
import {
  ACCESS_DESCRIPTIONS,
  ACCESS_LABELS,
  CONFIDENCE_LABELS,
  METHOD_LABELS,
  REUSE_TIER_LABELS,
  REUSE_TIER_MEANING,
  REVIEW_STATUS_LABELS,
  SEVERITY_LABELS,
  SEVERITY_MEANING,
  coverageBand,
  modalityLabel,
  num,
  shortDate,
} from "@/lib/format";

// ------------------------------------------------------------------------------------
// evidence
// ------------------------------------------------------------------------------------

const CONFIDENCE_STYLE: Record<string, { fg: string; bg: string }> = {
  high: { fg: "var(--strong)", bg: "var(--strong-bg)" },
  medium: { fg: "var(--moderate)", bg: "var(--moderate-bg)" },
  low: { fg: "var(--weak)", bg: "var(--weak-bg)" },
  unverified: { fg: "var(--text-faint)", bg: "var(--bg-sunken)" },
};

const METHOD_GLYPH: Record<string, string> = {
  api: "API",
  file: "FILE",
  fulltext: "TEXT",
  derived: "CALC",
  curated: "HUMAN",
  llm_extracted: "MODEL",
};

/**
 * One claim's provenance. Rendered as a small inline chip; the full detail is in the
 * native title tooltip and, for a single evidence item with a URL, the chip links out.
 */
export function EvidenceChip({ evidence }: { evidence: Evidence[] }) {
  if (!evidence || evidence.length === 0) return null;
  const best =
    evidence.find((e) => e.confidence === "high") ??
    evidence.find((e) => e.confidence === "medium") ??
    evidence[0];
  const style = CONFIDENCE_STYLE[best.confidence] ?? CONFIDENCE_STYLE.unverified;
  const glyph = METHOD_GLYPH[best.method] ?? "SRC";

  const detail = evidence
    .map((e) => {
      const bits = [
        METHOD_LABELS[e.method] ?? e.method,
        e.source_label,
        e.locator,
        e.retrieved_at ? `retrieved ${shortDate(e.retrieved_at)}` : null,
        CONFIDENCE_LABELS[e.confidence],
        e.reviewer ? `reviewed by ${e.reviewer}` : null,
        e.note,
        e.snippet ? `"${e.snippet.slice(0, 220)}"` : null,
        e.source_url,
      ].filter(Boolean);
      return bits.join(" - ");
    })
    .join("\n\n");

  const label = (
    <span
      className="evidence-chip"
      style={{ color: style.fg, background: style.bg, borderColor: style.fg + "33" }}
      title={detail}
    >
      <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.04em" }}>
        {glyph}
      </span>
      {evidence.length > 1 && <span>{evidence.length}</span>}
    </span>
  );

  if (best.source_url) {
    return (
      <a
        href={best.source_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Source: ${best.source_label ?? best.source_url}`}
      >
        {label}
      </a>
    );
  }
  return label;
}

// ------------------------------------------------------------------------------------
// badges
// ------------------------------------------------------------------------------------

const ACCESS_STYLE: Record<AccessTier, { fg: string; bg: string }> = {
  open: { fg: "var(--open)", bg: "var(--open-bg)" },
  registered: { fg: "var(--mixed)", bg: "var(--mixed-bg)" },
  controlled: { fg: "var(--controlled)", bg: "var(--controlled-bg)" },
  mixed: { fg: "var(--mixed)", bg: "var(--mixed-bg)" },
  request: { fg: "var(--controlled)", bg: "var(--controlled-bg)" },
  unknown: { fg: "var(--text-faint)", bg: "var(--bg-sunken)" },
};

export function AccessBadge({
  tier,
  size = "sm",
}: {
  tier: AccessTier;
  size?: "sm" | "md";
}) {
  const s = ACCESS_STYLE[tier] ?? ACCESS_STYLE.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${
        size === "md" ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-micro"
      }`}
      style={{ color: s.fg, background: s.bg }}
      title={ACCESS_DESCRIPTIONS[tier]}
    >
      {ACCESS_LABELS[tier] ?? tier}
    </span>
  );
}

const CHIP_TONES = {
  neutral: { color: "var(--text-muted)", background: "var(--bg-sunken)" },
  accent: { color: "var(--accent)", background: "var(--accent-bg)" },
  scarce: { color: "var(--mixed)", background: "var(--mixed-bg)" },
} as const;

export type ChipTone = keyof typeof CHIP_TONES;

export function Chip({
  children,
  tone = "neutral",
  title,
  wrap = false,
}: {
  children: ReactNode;
  tone?: ChipTone;
  title?: string;
  /** Let long labels wrap instead of overflowing a narrow screen. */
  wrap?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-micro ${
        wrap ? "max-w-full [overflow-wrap:anywhere]" : "whitespace-nowrap"
      }`}
      style={CHIP_TONES[tone]}
      title={title}
    >
      {children}
    </span>
  );
}

export function ModalityChip({ modality }: { modality: string }) {
  return <Chip title={modality}>{modalityLabel(modality)}</Chip>;
}

export function ReuseTierBadge({ tier }: { tier: ReuseTier }) {
  const strong = tier === "t3_analyzed" || tier === "t4_confirmed";
  const mid = tier === "t2_declared";
  const s = strong
    ? { fg: "var(--strong)", bg: "var(--strong-bg)" }
    : mid
      ? { fg: "var(--moderate)", bg: "var(--moderate-bg)" }
      : { fg: "var(--text-faint)", bg: "var(--bg-sunken)" };
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-micro font-medium whitespace-nowrap"
      style={{ color: s.fg, background: s.bg }}
      title={REUSE_TIER_MEANING[tier]}
    >
      {REUSE_TIER_LABELS[tier]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s =
    severity === "blocking"
      ? { fg: "var(--weak)", bg: "var(--weak-bg)" }
      : severity === "major"
        ? { fg: "var(--moderate)", bg: "var(--moderate-bg)" }
        : { fg: "var(--text-faint)", bg: "var(--bg-sunken)" };
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-micro font-medium"
      style={{ color: s.fg, background: s.bg }}
      title={SEVERITY_MEANING[severity]}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const s =
    status === "expert_reviewed"
      ? { fg: "var(--strong)", bg: "var(--strong-bg)" }
      : status === "project_curated"
        ? { fg: "var(--accent)", bg: "var(--accent-bg)" }
        : status === "flagged"
          ? { fg: "var(--weak)", bg: "var(--weak-bg)" }
          : { fg: "var(--text-faint)", bg: "var(--bg-sunken)" };
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-micro"
      style={{ color: s.fg, background: s.bg }}
      title={
        status === "expert_reviewed"
          ? "A named domain expert has checked this page's interpretation."
          : status === "project_curated"
            ? "Research questions and limitations were written and checked by the project team against source documentation and measured field coverage. Not yet signed off by a named external expert."
            : "Extracted automatically from source APIs and documents. Interpretation not yet reviewed."
      }
    >
      {REVIEW_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function UnderexploredBadge() {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-micro font-medium"
      style={{ color: "var(--mixed)", background: "var(--mixed-bg)" }}
      title="Reused far less than datasets of comparable size, age, measurement breadth and access tier. The reuse section shows the numbers behind the label."
    >
      Underexplored
    </span>
  );
}

// ------------------------------------------------------------------------------------
// layout helpers
// ------------------------------------------------------------------------------------

export function Section({
  id,
  title,
  lede,
  children,
  aside,
}: {
  id: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-8 border-t first:border-t-0">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {aside}
      </div>
      {lede && (
        <p className="text-body mb-4 t-muted">
          {lede}
        </p>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  evidence,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  evidence?: Evidence[];
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="text-micro uppercase tracking-wide mb-0.5 flex items-center gap-1 t-faint">
        {label}
        {evidence && <EvidenceChip evidence={evidence} />}
      </div>
      <div
        className={emphasis ? "text-xl font-semibold" : "tnum text-title font-medium"}
      >
        {value}
      </div>
      {sub && (
        <div className="text-meta mt-0.5 t-muted">
          {sub}
        </div>
      )}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${className}`}
      style={{ background: "var(--bg-raised)", boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

export function Callout({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warn" | "good" | "info";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: { border: "var(--border-strong)", bg: "var(--bg-sunken)", fg: "var(--text)" },
    warn: { border: "var(--weak)", bg: "var(--weak-bg)", fg: "var(--weak)" },
    good: { border: "var(--open)", bg: "var(--open-bg)", fg: "var(--open)" },
    info: { border: "var(--accent)", bg: "var(--accent-bg)", fg: "var(--accent)" },
  } as const;
  const t = tones[tone];
  return (
    <div
      className="rounded-md border-l-2 px-3 py-2 text-body"
      style={{ borderLeftColor: t.border, background: t.bg }}
    >
      {title && (
        <div className="font-medium mb-0.5" style={{ color: t.fg }}>
          {title}
        </div>
      )}
      <div style={{ color: "var(--text)" }}>{children}</div>
    </div>
  );
}

/** Completeness meter for a clinical field. */
export function CoverageMeter({
  value,
  width = 64,
}: {
  value: number | null | undefined;
  width?: number;
}) {
  const band = coverageBand(value);
  const colors = {
    strong: "var(--strong)",
    moderate: "var(--moderate)",
    weak: "var(--weak)",
    none: "var(--text-faint)",
  } as const;
  return (
    <span className="inline-flex items-center gap-1.5" title={band.label}>
      <span className="meter" style={{ width }}>
        <span
          style={{
            width: `${Math.max(value ?? 0, value === 0 ? 0 : 2)}%`,
            background: colors[band.key],
          }}
        />
      </span>
      <span className="tnum text-micro t-muted">
        {value === null || value === undefined ? "n/a" : `${value.toFixed(0)}%`}
      </span>
    </span>
  );
}

export function DatasetLink({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/datasets/${id}`}
      className="font-medium hover:underline"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </Link>
  );
}

export function CountPill({ n, label }: { n: number | null | undefined; label: string }) {
  return (
    <span className="text-meta t-muted">
      <span className="tnum font-medium" style={{ color: "var(--text)" }}>
        {num(n)}
      </span>{" "}
      {label}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="text-body italic rounded-md border border-dashed px-3 py-2 t-muted">
      {children}
    </p>
  );
}
