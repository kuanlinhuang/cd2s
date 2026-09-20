"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { FitBadge } from "@/components/FitGrid";
import { AccessBadge, Chip, UnderexploredBadge } from "@/components/ui";
import type { FitVerdictSlim } from "@/lib/fit";
import type { IndexRow } from "@/lib/types";
import {
  SCARCE_MODALITIES,
  describeReuse,
  modalityLabel,
  months,
  num,
} from "@/lib/format";

/**
 * Side-by-side comparison.
 *
 * A comparison table that simply prints every field for every dataset is not a
 * comparison, it is four catalog entries next to each other. What a researcher
 * choosing between candidates needs is the *differences*, so rows where the datasets
 * agree are dimmed and can be hidden entirely, and the modality row shows which
 * measurements are unique to each column.
 */

type Row = {
  key: string;
  label: string;
  hint?: string;
  render: (r: IndexRow) => React.ReactNode;
  compare: (r: IndexRow) => string;
  /** Higher is better, for the "best in row" marker. Undefined means not rankable. */
  rank?: (r: IndexRow) => number | undefined;
  /** A magnitude to draw as a thin bar under the value, scaled to the row's largest. */
  bar?: (r: IndexRow) => number | undefined;
};

const ROWS: Row[] = [
  {
    key: "cases",
    label: "Cohort size",
    render: (r) => (
      <span className="tnum">
        {num(r.n_cases ?? r.n_samples)}{" "}
        <span className="t-faint">
          {r.n_cases ? "cases" : "samples"}
        </span>
      </span>
    ),
    compare: (r) => String(r.n_cases ?? r.n_samples ?? ""),
    rank: (r) => r.n_cases ?? r.n_samples ?? undefined,
    bar: (r) => r.n_cases ?? r.n_samples ?? undefined,
  },
  {
    key: "access",
    label: "Access",
    hint: "Whether you need approval before you can download anything.",
    render: (r) => <AccessBadge tier={r.access_tier} />,
    compare: (r) => r.access_tier,
    rank: (r) =>
      ({ open: 4, registered: 3, mixed: 2, request: 1, controlled: 1, unknown: 0 })[
        r.access_tier
      ],
  },
  {
    key: "modalities",
    label: "Measurement types",
    render: (r) => <span className="tnum">{r.n_modalities}</span>,
    compare: (r) => String(r.n_modalities),
    rank: (r) => r.n_modalities,
    bar: (r) => r.n_modalities,
  },
  {
    key: "survival",
    label: "Survival analysis possible",
    hint: "Vital status and follow-up time are actually filled in, not just present as fields.",
    render: (r) => <YesNo v={r.has_survival_endpoint} />,
    compare: (r) => String(r.has_survival_endpoint),
    rank: (r) => (r.has_survival_endpoint ? 1 : 0),
  },
  {
    key: "followup",
    label: "Median follow-up",
    render: (r) => (
      <span className="tnum">
        {r.median_followup_months ? months(r.median_followup_months) : "-"}
      </span>
    ),
    compare: (r) => String(r.median_followup_months ?? ""),
    rank: (r) => r.median_followup_months ?? undefined,
    bar: (r) => r.median_followup_months ?? undefined,
  },
  {
    key: "treatment",
    label: "Treatment response",
    render: (r) => <YesNo v={r.has_treatment_response} />,
    compare: (r) => String(r.has_treatment_response),
    rank: (r) => (r.has_treatment_response ? 1 : 0),
  },
  {
    key: "population",
    label: "Population notes",
    render: (r) =>
      r.population_flags.length > 0 ? (
        <span className="text-meta">{r.population_flags.join("; ")}</span>
      ) : (
        <span className="t-faint">-</span>
      ),
    compare: (r) => r.population_flags.join("|"),
  },
  {
    key: "reuse",
    label: "Articles that analyzed it",
    hint: "The accession appears in the article's methods section.",
    render: (r) =>
      r.has_citable_accession === false ? (
        <span className="text-meta t-faint">
          not traceable
        </span>
      ) : (
        <span className="tnum">{num(r.n_verified_reuse)}</span>
      ),
    compare: (r) => String(r.n_verified_reuse ?? "na"),
    rank: (r) => r.n_verified_reuse ?? undefined,
    bar: (r) => r.n_verified_reuse ?? undefined,
  },
  {
    key: "citations",
    label: "Citations to its paper",
    hint: "Attention to the publication. Not reuse. Shown so the two are not confused.",
    render: (r) => (
      <span className="tnum">{num(r.n_citations_to_primary_publication)}</span>
    ),
    compare: (r) => String(r.n_citations_to_primary_publication ?? ""),
    bar: (r) => r.n_citations_to_primary_publication ?? undefined,
  },
  {
    key: "gap",
    label: "Reuse gap index",
    hint: "Negative means reused less than comparable datasets. Minus one is half the expected reuse.",
    render: (r) =>
      r.reuse_gap_index === null || r.reuse_gap_index === undefined ? (
        <span className="t-faint">not assessed</span>
      ) : (
        <span
          className="tnum"
          title={describeReuse(r.n_verified_reuse, r.expected_reuse) ?? undefined}
        >
          {r.reuse_gap_index.toFixed(2)}
        </span>
      ),
    compare: (r) => String(r.reuse_gap_index ?? ""),
  },
  {
    key: "workbooks",
    label: "Runnable workbooks",
    render: (r) => <span className="tnum">{r.n_workbooks}</span>,
    compare: (r) => String(r.n_workbooks),
    rank: (r) => r.n_workbooks,
    bar: (r) => r.n_workbooks,
  },
  {
    key: "questions",
    label: "Reviewed research questions",
    render: (r) => <span className="tnum">{r.n_research_questions}</span>,
    compare: (r) => String(r.n_research_questions),
    rank: (r) => r.n_research_questions,
    bar: (r) => r.n_research_questions,
  },
];

function YesNo({ v }: { v: boolean | null | undefined }) {
  if (v === true)
    return (
      <span className="font-medium" style={{ color: "var(--open)" }}>
        Yes
      </span>
    );
  if (v === false)
    return (
      <span style={{ color: "var(--weak)" }}>
        No
      </span>
    );
  return <span className="t-faint">Unknown</span>;
}

type Fits = Record<string, FitVerdictSlim[]>;

const FIT_RANK = { supported: 3, limited: 2, unknown: 1, blocked: 0 } as const;

/**
 * One row per analysis verdict, built from whichever columns carry verdicts. These sit
 * first because "can it answer my question" is what the comparison is for; the
 * catalog attributes follow.
 */
function fitRows(fits: Fits): Row[] {
  const keys = new Map<string, string>();
  for (const list of Object.values(fits)) for (const v of list) keys.set(v.key, v.label);
  return [...keys.entries()].map(([key, label]) => {
    const get = (r: IndexRow) => fits[r.id]?.find((v) => v.key === key);
    return {
      key: `fit:${key}`,
      label,
      hint: "Judged from how complete the fields this analysis depends on really are. Hover a verdict for the reason.",
      render: (r) => {
        const v = get(r);
        return v ? (
          <span title={v.reason.charAt(0).toUpperCase() + v.reason.slice(1) + "."}>
            <FitBadge status={v.status} compact />
          </span>
        ) : (
          <span className="t-faint">-</span>
        );
      },
      compare: (r) => get(r)?.status ?? "",
      rank: (r) => {
        const v = get(r);
        return v && v.status !== "unknown" ? FIT_RANK[v.status] : undefined;
      },
    };
  });
}

export default function CompareTable({ rows, fits = {} }: { rows: IndexRow[]; fits?: Fits }) {
  const [onlyDifferences, setOnlyDifferences] = useState(true);

  // The verdict rows subsume the older yes/no survival and treatment rows, so those
  // two are dropped whenever verdicts are present rather than shown twice.
  const allRows = useMemo(() => {
    const fr = fitRows(fits);
    const base = fr.length > 0 ? ROWS.filter((r) => r.key !== "survival" && r.key !== "treatment") : ROWS;
    return [...fr, ...base];
  }, [fits]);

  const { visible, nSame } = useMemo(() => {
    const same = allRows.filter(
      (row) => new Set(rows.map(row.compare)).size <= 1,
    ).length;
    const vis = onlyDifferences
      ? allRows.filter((row) => new Set(rows.map(row.compare)).size > 1)
      : allRows;
    return { visible: vis, nSame: same };
  }, [rows, allRows, onlyDifferences]);

  // Which modalities are unique to a single column - the most decision-relevant
  // difference when choosing between cohorts.
  const modalityCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const r of rows) for (const m of new Set(r.modalities)) c.set(m, (c.get(m) ?? 0) + 1);
    return c;
  }, [rows]);

  const bestPerRow = useMemo(() => {
    const out = new Map<string, Set<string>>();
    for (const row of allRows) {
      if (!row.rank) continue;
      const scored = rows
        .map((r) => ({ id: r.id, v: row.rank!(r) }))
        .filter((x) => x.v !== undefined) as { id: string; v: number }[];
      if (scored.length < 2) continue;
      const max = Math.max(...scored.map((x) => x.v));
      if (max === Math.min(...scored.map((x) => x.v))) continue;
      out.set(row.key, new Set(scored.filter((x) => x.v === max).map((x) => x.id)));
    }
    return out;
  }, [rows, allRows]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(e) => setOnlyDifferences(e.target.checked)}
          />
          Show only rows where they differ
          {nSame > 0 && (
            <span className="t-faint">({nSame} identical)</span>
          )}
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-body">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-10 border-b py-2 pr-4 text-left align-bottom font-medium"
                style={{ background: "var(--bg)", minWidth: 190 }}
              >
                <span className="text-micro uppercase tracking-wide t-faint">
                  Attribute
                </span>
              </th>
              {rows.map((r) => (
                <th
                  key={r.id}
                  className="border-b py-2 pr-4 text-left align-bottom"
                  style={{ minWidth: 175 }}
                >
                  <Link
                    href={`/datasets/${r.id}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {r.short_title ?? r.title}
                  </Link>
                  <div className="mt-0.5 line-clamp-2 text-micro font-normal t-muted">
                    {r.title}
                  </div>
                  {r.is_underexplored && (
                    <div className="mt-1">
                      <UnderexploredBadge />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const best = bestPerRow.get(row.key);
              const barMax = row.bar
                ? Math.max(0, ...rows.map((r) => row.bar!(r) ?? 0))
                : 0;
              return (
                <tr key={row.key} className="border-b">
                  <th
                    className="sticky left-0 z-10 py-2 pr-4 text-left align-top font-normal"
                    style={{ background: "var(--bg)" }}
                  >
                    <span title={row.hint}>{row.label}</span>
                    {row.hint && (
                      <span
                        aria-hidden
                        className="ml-1 cursor-help text-micro t-faint"
                        title={row.hint}
                      >
                        ?
                      </span>
                    )}
                  </th>
                  {rows.map((r) => {
                    const v = row.bar ? row.bar(r) : undefined;
                    return (
                      <td key={r.id} className="py-2 pr-4 align-top">
                        <span className="flex items-center gap-1.5">
                          {row.render(r)}
                          {best?.has(r.id) && (
                            <span
                              className="text-micro"
                              style={{ color: "var(--open)" }}
                              title="Highest in this row among the datasets compared"
                            >
                              ▲
                            </span>
                          )}
                        </span>
                        {row.bar && barMax > 0 && (
                          <span className="cmp-bar" aria-hidden>
                            <i style={{ width: `${(100 * (v ?? 0)) / barMax}%` }} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            <tr className="border-b">
              <th
                className="sticky left-0 z-10 py-2 pr-4 text-left align-top font-normal"
                style={{ background: "var(--bg)" }}
              >
                Measurements
                <span
                  className="ml-1 cursor-help text-micro t-faint"
                  title="Starred chips are unique to that column. Usually the deciding difference."
                >
                  ?
                </span>
              </th>
              {rows.map((r) => (
                <td key={r.id} className="py-2 pr-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(r.modalities)].map((m) => {
                      const unique = modalityCounts.get(m) === 1;
                      return (
                        <Chip
                          key={m}
                          tone={
                            unique
                              ? SCARCE_MODALITIES.has(m)
                                ? "scarce"
                                : "accent"
                              : "neutral"
                          }
                          title={
                            unique
                              ? "Only this dataset has this measurement"
                              : modalityLabel(m)
                          }
                        >
                          {unique ? "★ " : ""}
                          {modalityLabel(m)}
                        </Chip>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>

            <tr>
              <th
                className="sticky left-0 z-10 py-2 pr-4 text-left align-top font-normal"
                style={{ background: "var(--bg)" }}
              >
                Repository
              </th>
              {rows.map((r) => (
                <td
                  key={r.id}
                  className="py-2 pr-4 align-top text-meta t-muted"
                >
                  {r.repositories.join(" + ")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
