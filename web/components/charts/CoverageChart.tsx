import { Chip, EvidenceChip } from "@/components/ui";
import { CLINICAL_CATEGORY_LABELS } from "@/lib/format";
import type { ClinicalVariable } from "@/lib/types";

/**
 * How complete each clinical field really is.
 *
 * Every row is one bar split three ways: cases with an informative value, cases that
 * hold only "not reported" or "unknown", and cases with nothing at all. The distinction
 * is the site's central measurement, so it is drawn rather than described. One-to-many
 * fields can only report the share of cases with any record, so they show one segment.
 */

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

export function CoverageChart({ variables }: { variables: ClinicalVariable[] }) {
  const groups = group(variables);
  return (
    <div>
      <CoverageLegend />
      <div className="mt-4 grid gap-x-10 gap-y-6 lg:grid-cols-2">
        {groups.map(([cat, vars]) => (
          <div key={cat}>
            <h4 className="mb-2 text-[12px] font-medium uppercase tracking-wide t-faint">
              {CLINICAL_CATEGORY_LABELS[cat] ?? cat}
            </h4>
            <ul className="space-y-2">
              {vars.map((v) => {
                const p = parts(v);
                return (
                  <li
                    key={v.name}
                    className="grid items-center gap-3"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(80px, 150px) 40px" }}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-[13px]">
                      <span className="truncate">{v.label ?? v.name}</span>
                      {v.is_repeated && (
                        <Chip title="A case can have several records of this field, so the bar shows the share of cases with at least one record.">
                          1:n
                        </Chip>
                      )}
                      <EvidenceChip evidence={v.evidence} />
                    </span>
                    <span className="seg-bar" style={{ height: 8 }} title={p.tip} role="img" aria-label={p.tip}>
                      {p.informative > 0 && (
                        <span style={{ flex: `${p.informative} 0 0`, background: "var(--viz-1)" }} />
                      )}
                      {p.uninformative > 0 && (
                        <span style={{ flex: `${p.uninformative} 0 0`, background: "var(--viz-3)" }} />
                      )}
                      {p.missing > 0 && (
                        <span style={{ flex: `${p.missing} 0 0`, background: "var(--viz-track)" }} />
                      )}
                    </span>
                    <span className="viz-value text-right">{Math.round(p.pct)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
