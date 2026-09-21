import { Chip, EvidenceChip } from "@/components/ui";
import { BarAxis, exactScale } from "@/components/charts/BarAxis";
import { pctLabel } from "@/lib/chart";
import { CLINICAL_CATEGORY_LABELS } from "@/lib/format";
import type { ClinicalVariable } from "@/lib/types";

/**
 * How complete each clinical field really is.
 *
 * Every row is one bar split three ways: cases with an informative value, cases that
 * hold only "not reported" or "unknown", and cases with nothing at all. The distinction
 * is the site's central measurement, so it is drawn rather than described. One-to-many
 * fields can only report the share of cases with any record, so they show one segment.
 *
 * Each group carries a 0-100% scale under its bars, with gridlines at the same quarters
 * inside the tracks. Every bar here is a share of the same whole, so one scale per group
 * is enough, and reading "about two thirds" off a bar is the point of drawing it.
 */

/**
 * Every bar is a percentage of cases, so the scale is the same for all of them.
 *
 * Two intervals, not four: these bars share a column with the field names and sit around
 * 160px wide, where four tick labels overlap into nonsense. Halves are enough to read a
 * share off a bar, and the exact figure is printed at the end of every row anyway.
 */
const PCT_SCALE = exactScale(100, 2);

const CATEGORY_ORDER = [
  "outcome",
  "followup",
  "treatment",
  "staging",
  "diagnosis",
  "pathology",
  "demographic",
  "exposure",
  "molecular_marker",
  "other",
];

function group(vars: ClinicalVariable[]): [string, ClinicalVariable[]][] {
  const known = new Set(CATEGORY_ORDER);
  const out: [string, ClinicalVariable[]][] = [];
  for (const cat of CATEGORY_ORDER) {
    const rows = vars.filter((v) => (known.has(v.category) ? v.category === cat : cat === "other"));
    if (rows.length > 0) {
      out.push([
        cat,
        rows.sort(
          (a, b) =>
            (b.coverage_pct ?? b.populated_pct ?? 0) - (a.coverage_pct ?? a.populated_pct ?? 0),
        ),
      ]);
    }
  }
  return out;
}

type Parts = { informative: number; uninformative: number; missing: number; pct: number; tip: string };

function parts(v: ClinicalVariable): Parts {
  const total = v.n_total ?? 0;
  if (v.is_repeated) {
    const pct = v.populated_pct ?? 0;
    return {
      informative: pct,
      uninformative: 0,
      missing: Math.max(0, 100 - pct),
      pct,
      tip: `${pct.toFixed(0)}% of cases have at least one record`,
    };
  }
  if (total > 0 && v.n_informative !== null && v.n_informative !== undefined) {
    const informative = v.n_informative;
    const uninformative = v.n_not_reported ?? 0;
    const missing = Math.max(0, total - (v.n_nonmissing ?? informative + uninformative));
    const pct = v.coverage_pct ?? (100 * informative) / total;
    return {
      informative,
      uninformative,
      missing,
      pct,
      tip:
        `${informative.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} cases informative` +
        (uninformative ? `, ${uninformative.toLocaleString("en-US")} not reported or unknown` : "") +
        (missing ? `, ${missing.toLocaleString("en-US")} missing` : ""),
    };
  }
  const pct = v.coverage_pct ?? v.populated_pct ?? 0;
  return {
    informative: pct,
    uninformative: 0,
    missing: Math.max(0, 100 - pct),
    pct,
    tip: `${pct.toFixed(0)}% informative`,
  };
}

export function CoverageLegend() {
  return (
    <div className="viz-legend">
      <span>
        <span className="viz-swatch" style={{ background: "var(--viz-1)" }} />
        Informative - a usable value
      </span>
      <span>
        <span className="viz-swatch" style={{ background: "var(--viz-3)" }} />
        Present but uninformative - &ldquo;not reported&rdquo; or &ldquo;unknown&rdquo;
      </span>
      <span>
        <span className="viz-swatch" style={{ background: "var(--viz-track)", boxShadow: "inset 0 0 0 1px var(--border)" }} />
        Absent - no value recorded
      </span>
    </div>
  );
}

/**
 * One flat run of coverage rows under a single 0-100% scale.
 *
 * Split out so a page that wants a handful of chosen fields - the home page's worked
 * example picks the four that decide whether any outcome analysis is possible - draws
 * them with exactly the encoding the dataset pages use, rather than a second bar that
 * happens to look similar.
 */
export function CoverageRows({ variables }: { variables: ClinicalVariable[] }) {
  return (
    // .coverage-row, in globals.css, is the shared grid; the wrapper is what its
    // container query measures.
    <div className="coverage-rows">
      <ul className="space-y-2">
        {variables.map((v) => {
          const p = parts(v);
          return (
            <li key={v.name} className="coverage-row">
              <span className="flex min-w-0 items-center gap-1.5 text-body">
                <span className="truncate">{v.label ?? v.name}</span>
                {v.is_repeated && (
                  <Chip title="A case can have several records of this field, so the bar shows the share of cases with at least one record.">
                    1:n
                  </Chip>
                )}
                <EvidenceChip evidence={v.evidence} />
              </span>
              <span
                className="seg-bar scaled"
                style={{ height: 12, ["--bar-tick" as string]: PCT_SCALE.interval }}
                title={p.tip}
                role="img"
                aria-label={p.tip}
              >
                {p.informative > 0 && (
                  <span style={{ flex: `${p.informative} 0 0`, background: "var(--viz-1)" }} />
                )}
                {p.uninformative > 0 && (
                  <span style={{ flex: `${p.uninformative} 0 0`, background: "var(--viz-3)" }} />
                )}
                {/* Transparent, not track-coloured: the gridded bar shows through,
                    so a reader can see where the missing share ends on the scale. */}
                {p.missing > 0 && (
                  <span style={{ flex: `${p.missing} 0 0`, background: "transparent" }} />
                )}
              </span>
              <span className="viz-value text-right">{pctLabel(p.pct)}</span>
            </li>
          );
        })}
      </ul>
      <div className="coverage-row mt-1">
        <span />
        <BarAxis scale={PCT_SCALE} unit="%" />
        <span />
      </div>
    </div>
  );
}

export function CoverageChart({ variables }: { variables: ClinicalVariable[] }) {
  const groups = group(variables);
  return (
    <div>
      <CoverageLegend />
      <div className="mt-4 grid gap-x-10 gap-y-6 lg:grid-cols-2">
        {groups.map(([cat, vars]) => (
          <div key={cat}>
            <h4 className="mb-2 text-meta font-medium uppercase tracking-wide t-faint">
              {CLINICAL_CATEGORY_LABELS[cat] ?? cat}
            </h4>
            <CoverageRows variables={vars} />
          </div>
        ))}
      </div>
    </div>
  );
}
