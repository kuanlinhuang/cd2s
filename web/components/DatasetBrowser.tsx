"use client";

import Link from "next/link";
import MiniSearch from "minisearch";
import { useEffect, useMemo, useState } from "react";

import {
  AccessBadge,
  Chip,
  CountPill,
  ReviewBadge,
  UnderexploredBadge,
} from "@/components/ui";
import type { BrowseRow, Facets, SearchDoc } from "@/lib/types";
import { REVIEW_STATUS_LABELS, SCARCE_MODALITIES, modalityLabel, months, num } from "@/lib/format";

/**
 * Search and browse over the whole corpus.
 *
 * Everything runs in the browser against the generated index, so results are instant
 * and the site needs no search backend to keep alive - which matters for a resource
 * whose whole point is that it should still work years from now.
 *
 * The rows arrive as props and are therefore serialized into the page, so they carry
 * only the fields rendered here (see `BrowseRow`). The free-text corpus is fetched
 * separately, after paint, because most visitors filter rather than search.
 *
 * The result card leads with why a dataset fits the query rather than with its size,
 * because "1,098 cases" tells a researcher much less than "treatment response recorded
 * on 64% of cases, median follow-up 30 months".
 */

const CAPABILITY_FILTERS = {
  survival: {
    label: "Survival analysis possible",
    test: (r: BrowseRow) => r.has_survival_endpoint === true,
  },
  treatment: {
    label: "Treatment response recorded",
    test: (r: BrowseRow) => r.has_treatment_response === true,
  },
  longitudinal: {
    label: "Longitudinal follow-up",
    test: (r: BrowseRow) => r.has_followup === true,
  },
  multimodal: {
    label: "Three or more modalities",
    test: (r: BrowseRow) => r.n_modalities >= 3,
  },
  open: { label: "Open access", test: (r: BrowseRow) => r.access_tier === "open" },
  underexplored: {
    label: "Underexplored",
    test: (r: BrowseRow) => r.is_underexplored,
  },
  workbook: {
    label: "Has a runnable workbook",
    test: (r: BrowseRow) => r.n_workbooks > 0,
  },
  reviewed: {
    // Keyed on "not machine-only" rather than on a particular review status, so a record
    // promoted from project-curated to expert-reviewed stays in this filter.
    label: "Interpretation reviewed by a person",
    test: (r: BrowseRow) => r.review_status !== "machine_only",
  },
  scarce: {
    label: "Scarce measurement type",
    test: (r: BrowseRow) => r.modalities.some((m) => SCARCE_MODALITIES.has(m)),
  },
} as const;

type CapabilityKey = keyof typeof CAPABILITY_FILTERS;

type SortKey = "relevance" | "size" | "reuse" | "reuse_gap" | "modalities" | "title";

const SORTS: Record<SortKey, string> = {
  relevance: "Best match",
  size: "Largest cohort",
  reuse: "Most reused",
  reuse_gap: "Biggest reuse shortfall",
  modalities: "Most modalities",
  title: "Name",
};

interface Props {
  rows: BrowseRow[];
  facets: Facets;
  initial?: {
    q?: string;
    modality?: string;
    cancer?: string;
    site?: string;
    capability?: string;
    repository?: string;
    access?: string;
    review?: string;
  };
}

/**
 * Free-text search, loaded out of band.
 *
 * MiniSearch needs the whole searchable corpus in memory, and that corpus is 40% of the
 * generated index. Passing it through props put it in the page for every visitor and
 * built the index during hydration, on the main thread, before anyone had typed. Here it
 * is fetched as a static file the browser can cache between visits, and indexed when it
 * lands. `null` until then; the caller substring-matches in the meantime.
 */
function useSearchIndex(rows: BrowseRow[]) {
  type Doc = SearchDoc & { title: string; short_title: string };
  const [mini, setMini] =
    useState<MiniSearch<Doc> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch("/data/search.json", { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<SearchDoc[]>) : Promise.reject(r.status)))
      .then((docs) => {
        if (cancelled) return;
        const text = new Map(docs.map((d) => [d.id, d.text]));
        const ms = new MiniSearch<Doc>({
          fields: ["title", "short_title", "text"],
          storeFields: ["id"],
          idField: "id",
          searchOptions: {
            boost: { title: 3, short_title: 2 },
            prefix: true,
            fuzzy: 0.15,
          },
        });
        ms.addAll(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            short_title: r.short_title ?? "",
            text: text.get(r.id) ?? "",
          })),
        );
        setMini(ms);
      })
      .catch(() => {
        // Leave `mini` null: the substring fallback keeps search usable offline or if
        // the corpus fails to load, rather than silently returning nothing.
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [rows]);

  return mini;
}

export default function DatasetBrowser({ rows, facets, initial = {} }: Props) {
  const [q, setQ] = useState(initial.q ?? "");
  const [modality, setModality] = useState(initial.modality ?? "");
  const [cancer, setCancer] = useState(initial.cancer ?? "");
  const [site, setSite] = useState(initial.site ?? "");
  const [repository, setRepository] = useState(initial.repository ?? "");
  const [access, setAccess] = useState(initial.access ?? "");
  const [review, setReview] = useState(initial.review ?? "");
  const [caps, setCaps] = useState<Set<CapabilityKey>>(
    () =>
      new Set(
        initial.capability && initial.capability in CAPABILITY_FILTERS
          ? [initial.capability as CapabilityKey]
          : [],
      ),
  );
  const [sort, setSort] = useState<SortKey>(initial.q ? "relevance" : "size");
  const [limit, setLimit] = useState(40);
  const [compare, setCompare] = useState<string[]>([]);

  // The searchable text is 40% of the index and is needed only once somebody types, so
  // it is fetched as its own cacheable file after first paint rather than inlined into
  // this page. Until it arrives, queries fall back to a substring match over the fields
  // already on screen - search works from the first keystroke and quietly gets better.
  const mini = useSearchIndex(rows);

  const quickText = useMemo(
    () =>
      new Map(
        rows.map((r) => [
          r.id,
          [
            r.title,
            r.short_title ?? "",
            r.one_liner ?? "",
            r.cancer_types.join(" "),
            r.primary_sites.join(" "),
            r.modalities.join(" "),
          ]
            .join(" ")
            .toLowerCase(),
        ]),
      ),
    [rows],
  );

  const scores = useMemo(() => {
    const term = q.trim();
    if (!term) return null;
    const m = new Map<string, number>();
    if (mini) {
      for (const hit of mini.search(term)) m.set(hit.id as string, hit.score);
      return m;
    }
    const needle = term.toLowerCase();
    for (const r of rows) {
      if (quickText.get(r.id)?.includes(needle)) m.set(r.id, 1);
    }
    return m;
  }, [q, mini, rows, quickText]);

  const filtered = useMemo(() => {
    let out = rows;
    if (scores) out = out.filter((r) => scores.has(r.id));
    if (modality) out = out.filter((r) => r.modalities.includes(modality));
    if (cancer) out = out.filter((r) => r.cancer_types.includes(cancer));
    if (site) out = out.filter((r) => r.primary_sites.includes(site));
    if (repository) out = out.filter((r) => r.repositories.includes(repository));
    if (access) out = out.filter((r) => r.access_tier === access);
    if (review) out = out.filter((r) => r.review_status === review);
    for (const c of caps) out = out.filter(CAPABILITY_FILTERS[c].test);

    const sorted = [...out];
    if (sort === "relevance" && scores) {
      sorted.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    } else if (sort === "size") {
      sorted.sort(
        (a, b) =>
          (b.n_cases ?? b.n_samples ?? 0) - (a.n_cases ?? a.n_samples ?? 0),
      );
    } else if (sort === "reuse") {
      sorted.sort((a, b) => (b.n_verified_reuse ?? -1) - (a.n_verified_reuse ?? -1));
    } else if (sort === "reuse_gap") {
      sorted.sort((a, b) => {
        const av = a.reuse_gap_index ?? Number.POSITIVE_INFINITY;
        const bv = b.reuse_gap_index ?? Number.POSITIVE_INFINITY;
        return av - bv;
      });
    } else if (sort === "modalities") {
      sorted.sort((a, b) => b.n_modalities - a.n_modalities);
    } else {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [rows, scores, modality, cancer, site, repository, access, review, caps, sort]);

  // Reset pagination whenever the filter set changes. Done during render via React's
  // documented "adjusting state when props change" pattern rather than in an effect:
  // calling setState from an effect would render the long list once, then immediately
  // re-render it truncated.
  const filterKey = [
    q,
    modality,
    cancer,
    site,
    repository,
    access,
    review,
    [...caps].sort().join(","),
    sort,
  ].join("|");
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setLimit(40);
  }

  const activeFilters =
    (modality ? 1 : 0) +
    (cancer ? 1 : 0) +
    (site ? 1 : 0) +
    (repository ? 1 : 0) +
    (access ? 1 : 0) +
    (review ? 1 : 0) +
    caps.size;

  function toggleCap(k: CapabilityKey) {
    setCaps((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function toggleCompare(id: string) {
    setCompare((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= 4
          ? prev
          : [...prev, id],
    );
  }

  function clearAll() {
    setModality("");
    setCancer("");
    setSite("");
    setRepository("");
    setAccess("");
    setReview("");
    setCaps(new Set());
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      {/* --------------------------------------------------------------- filters */}
      <aside className="lg:sticky lg:top-20 lg:self-start space-y-5">
        <div>
          <label
            htmlFor="dataset-search"
            className="block text-micro font-medium uppercase tracking-wide mb-1.5 t-faint"
          >
            Search
          </label>
          <input
            id="dataset-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value) setSort("relevance");
            }}
            placeholder="cervical cancer, spatial, resistance..."
            className="w-full rounded-md border px-2.5 py-1.5 text-body"
            style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
          />
          <p className="mt-1.5 text-micro t-faint">
            Titles, summaries, assays, clinical fields and reviewed research questions.
          </p>
        </div>

        <fieldset>
          <legend className="text-micro font-medium uppercase tracking-wide mb-1.5 t-faint">
            What you need
          </legend>
          <div className="space-y-1">
            {(Object.keys(CAPABILITY_FILTERS) as CapabilityKey[]).map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-start gap-2 text-body"
              >
                <input
                  type="checkbox"
                  checked={caps.has(k)}
                  onChange={() => toggleCap(k)}
                  className="mt-0.5 shrink-0"
                />
                <span>{CAPABILITY_FILTERS[k].label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <FacetSelect
          label="Measurement type"
          value={modality}
          onChange={setModality}
          options={(facets.modality ?? []).map((f) => ({
            value: f.value,
            label: `${modalityLabel(f.value)} (${f.count})`,
          }))}
        />
        <FacetSelect
          label="Cancer type"
          value={cancer}
          onChange={setCancer}
          options={(facets.cancer_type ?? []).map((f) => ({
            value: f.value,
            label: `${f.value} (${f.count})`,
          }))}
        />
        <FacetSelect
          label="Primary site"
          value={site}
          onChange={setSite}
          options={(facets.primary_site ?? []).map((f) => ({
            value: f.value,
            label: `${f.value} (${f.count})`,
          }))}
        />
        <FacetSelect
          label="Repository"
          value={repository}
          onChange={setRepository}
          options={(facets.repository ?? []).map((f) => ({
            value: f.value,
            label: `${f.value} (${f.count})`,
          }))}
        />
        <FacetSelect
          label="Access"
          value={access}
          onChange={setAccess}
          options={(facets.access_tier ?? []).map((f) => ({
            value: f.value,
            label: `${f.value} (${f.count})`,
          }))}
        />
        <FacetSelect
          label="Interpretation"
          value={review}
          onChange={setReview}
          options={(facets.review_status ?? []).map((f) => ({
            value: f.value,
            label: `${REVIEW_STATUS_LABELS[f.value] ?? f.value} (${f.count})`,
          }))}
        />

        {activeFilters > 0 && (
          <button
            onClick={clearAll}
            className="text-meta underline t-muted"
          >
            Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
          </button>
        )}
      </aside>

      {/* --------------------------------------------------------------- results */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-body t-muted">
            <span className="tnum font-medium" style={{ color: "var(--text)" }}>
              {num(filtered.length)}
            </span>{" "}
            of {num(rows.length)} datasets
          </p>
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort"
              className="text-meta t-faint"
            >
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded border px-2 py-1 text-meta"
              style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
            >
              {(Object.keys(SORTS) as SortKey[])
                .filter((k) => k !== "relevance" || scores)
                .map((k) => (
                  <option key={k} value={k}>
                    {SORTS[k]}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {compare.length > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-body"
            style={{ background: "var(--accent-bg)", borderColor: "var(--accent)" }}
          >
            <span>
              {compare.length} selected{compare.length >= 4 ? " (maximum)" : ""}
            </span>
            <Link
              href={`/compare?ids=${compare.join(",")}`}
              className="font-medium underline"
              style={{ color: "var(--accent)" }}
            >
              Compare side by side
            </Link>
            <button onClick={() => setCompare([])} className="underline">
              Clear
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-body t-muted">
            Nothing matches. Remove a filter, or browse{" "}
            <Link href="/underexplored" className="underline">
              underexplored datasets
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.slice(0, limit).map((r) => (
              <ResultCard
                key={r.id}
                row={r}
                selected={compare.includes(r.id)}
                onToggle={() => toggleCompare(r.id)}
              />
            ))}
          </ul>
        )}

        {filtered.length > limit && (
          <button
            onClick={() => setLimit((l) => l + 60)}
            className="mt-5 w-full rounded-md border py-2 text-body font-medium"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Show {Math.min(60, filtered.length - limit)} more
          </button>
        )}
      </div>
    </div>
  );
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `facet-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-micro font-medium uppercase tracking-wide mb-1.5 t-faint"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border px-2 py-1.5 text-body"
        style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Why this dataset fits, in the researcher's terms. Deliberately not a metadata dump:
 * the two or three facts that decide whether it is worth opening.
 */
function fitReasons(r: BrowseRow): string[] {
  const out: string[] = [];
  if (r.has_treatment_response) {
    out.push("treatment response recorded");
  }
  if (r.has_survival_endpoint) {
    out.push(
      r.median_followup_months
        ? `survival endpoints, median follow-up ${months(r.median_followup_months)}`
        : "survival endpoints available",
    );
  }
  if (r.n_modalities >= 3) {
    out.push(`${r.n_modalities} measurement types on the same cohort`);
  }
  const scarce = r.modalities.filter((m) => SCARCE_MODALITIES.has(m));
  if (scarce.length > 0) {
    out.push(`scarce measurements: ${scarce.map(modalityLabel).join(", ")}`);
  }
  if (r.population_flags.some((f) => f.startsWith("majority"))) {
    out.push(r.population_flags.find((f) => f.startsWith("majority"))!);
  }
  if (r.access_tier === "open") out.push("no access request needed");
  return out.slice(0, 3);
}

function ResultCard({
  row,
  selected,
  onToggle,
}: {
  row: BrowseRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const reasons = fitReasons(row);
  return (
    <li
      className="rounded-lg border p-4"
      style={{
        background: "var(--bg-raised)",
        borderColor: selected ? "var(--accent)" : "var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${row.title} for comparison`}
          className="mt-1 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              href={`/datasets/${row.id}`}
              className="font-medium leading-snug hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {row.title}
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              {row.is_underexplored && <UnderexploredBadge />}
              <AccessBadge tier={row.access_tier} />
              <ReviewBadge status={row.review_status} />
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta t-muted">
            <span className="font-mono text-micro">{row.short_title}</span>
            {row.repositories.length > 0 && <span>{row.repositories.join(" + ")}</span>}
            {row.n_cases ? <CountPill n={row.n_cases} label="cases" /> : null}
            {!row.n_cases && row.n_samples ? (
              <CountPill n={row.n_samples} label="samples" />
            ) : null}
            {row.cancer_types.length > 0 && (
              <span className="truncate">{row.cancer_types.slice(0, 2).join(", ")}</span>
            )}
          </div>

          {reasons.length > 0 && (
            <p className="mt-2 text-body">
              <span className="t-faint">Why it fits: </span>
              <span>{reasons.join("; ")}</span>
            </p>
          )}

          {row.one_liner && (
            <p className="mt-1.5 text-body t-muted">
              {row.one_liner}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            {row.modalities.slice(0, 6).map((m) => (
              <Chip key={m} tone={SCARCE_MODALITIES.has(m) ? "scarce" : "neutral"}>
                {modalityLabel(m)}
              </Chip>
            ))}
            {row.modalities.length > 6 && (
              <span className="text-micro t-faint">
                +{row.modalities.length - 6} more
              </span>
            )}
          </div>

          {(row.n_verified_reuse !== null && row.n_verified_reuse !== undefined) ||
          row.has_citable_accession === false ? (
            <p className="mt-2 text-meta t-faint">
              {row.has_citable_accession === false
                ? "No citable accession, so reuse cannot be traced"
                : `${num(row.n_verified_reuse)} article${row.n_verified_reuse === 1 ? "" : "s"} analyzed these data` +
                  (row.n_citations_to_primary_publication
                    ? ` - ${num(row.n_citations_to_primary_publication)} cite the paper`
                    : "")}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
