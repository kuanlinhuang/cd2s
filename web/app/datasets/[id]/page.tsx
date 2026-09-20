import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Bars, type BarRow } from "@/components/charts/Bars";
import { FitGrid } from "@/components/FitGrid";
import ChipList from "@/components/ChipList";
import SectionNav from "@/components/SectionNav";
import { AgeBox } from "@/components/charts/AgeBox";
import { CoverageChart } from "@/components/charts/CoverageChart";
import { ObservedExpected, reuseSentence } from "@/components/charts/ObservedExpected";
import {
  AccessBadge,
  Callout,
  Card,
  Chip,
  DatasetLink,
  EmptyState,
  EvidenceChip,
  ReuseTierBadge,
  ReviewBadge,
  Section,
  SeverityBadge,
  Stat,
  UnderexploredBadge,
} from "@/components/ui";
import {
  getAllRecordIds,
  getJsonLd,
  getRecord,
  getRelated,
  getSubjects,
  isInferredMarker,
} from "@/lib/data";
import { fitVerdicts } from "@/lib/fit";
import { starterSnippets } from "@/lib/starter";
import {
  ACCESS_DESCRIPTIONS,
  FEASIBILITY_LABELS,
  FUNDING_ROLE_LABELS,
  LIMITATION_KIND_LABELS,
  REUSE_TIER_MEANING,
  SCARCE_MODALITIES,
  bytes,
  idSchemeLabel,
  isNonAnswer,
  modalityLabel,
  months,
  num,
  shortDate,
} from "@/lib/format";
import type { DatasetRecord } from "@/lib/types";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllRecordIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = getRecord(id);
  if (!r) return { title: "Dataset not found" };
  const desc =
    r.one_liner ??
    r.summary?.slice(0, 200) ??
    `${r.title}: cohort size, measurements, limitations, verified reuse and a runnable starting point.`;
  return {
    title: r.title,
    description: desc,
    openGraph: { title: r.title, description: desc },
  };
}

const SECTIONS = [
  { id: "fit", label: "Can it answer your question?" },
  { id: "glance", label: "At a glance" },
  { id: "useful-for", label: "Good for" },
  { id: "limitations", label: "Cannot tell you" },
  { id: "reuse", label: "Who has used it" },
  { id: "ways", label: "Analysis notebooks" },
  { id: "start", label: "Start here" },
  { id: "provenance", label: "Provenance" },
];

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = getRecord(id);
  if (!r) notFound();
  const related = getRelated(id, 6);
  const relatedUnder = related.filter((x) => x.is_underexplored);
  const jsonLd = getJsonLd(id);

  return (
    <article>
      {/*
        The schema.org/DCAT description, inlined so Google Dataset Search and the other
        harvesters can read it: they parse JSON-LD in the page and do not follow a link
        to a .jsonld file. The document is the pipeline's own, byte for byte.

        `<` is escaped because a description carrying "</script>" would otherwise close
        this element and turn the rest of the document into markup. The text comes from
        upstream repositories, so that is a real input, not a hypothetical one.
      */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd.replace(/</g, "\\u003c") }}
        />
      )}
      <Header record={r} />

      {/* in-page navigation */}
      <SectionNav sections={SECTIONS} />

      <Fit record={r} />
      <AtAGlance record={r} />
      <UsefulFor record={r} />
      <Limitations record={r} />
      <Reuse record={r} />
      <WaysToUse record={r} />
      <StartHere record={r} />
      <Provenance record={r} />

      {/* related and less-known */}
      {related.length > 0 && (
        <Section
          id="related"
          title="Related datasets"
          lede="Same disease area, favoring cohorts that add a measurement this one lacks."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((x) => (
              <Card key={x.id}>
                <div className="flex items-start justify-between gap-2">
                  <DatasetLink id={x.id}>{x.title}</DatasetLink>
                  {x.is_underexplored && <UnderexploredBadge />}
                </div>
                <div className="mt-1 text-meta t-muted">
                  {num(x.n_cases ?? x.n_samples)} {x.n_cases ? "cases" : "samples"} -{" "}
                  {x.repositories.join(" + ")}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {x.modalities
                    .filter((m) => !r.assays.some((a) => a.modality === m))
                    .slice(0, 4)
                    .map((m) => (
                      <Chip
                        key={m}
                        tone={SCARCE_MODALITIES.has(m) ? "scarce" : "accent"}
                        title="This dataset adds a measurement the one you are viewing does not have"
                      >
                        + {modalityLabel(m)}
                      </Chip>
                    ))}
                </div>
              </Card>
            ))}
          </div>
          {relatedUnder.length > 0 && (
            <div className="mt-4">
              <Callout tone="info" title="Broaden your search">
                {relatedUnder.length} of these are reused far less than comparable
                datasets:{" "}
                {relatedUnder.map((x, i) => (
                  <span key={x.id}>
                    {i > 0 && ", "}
                    <DatasetLink id={x.id}>{x.short_title ?? x.title}</DatasetLink>
                  </span>
                ))}
                . Fewer people have worked on them, which can make them a better fit for
                a new question.
              </Callout>
            </div>
          )}
        </Section>
      )}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-6 text-meta t-faint">
        <Link href="/agents" className="underline">
          For software
        </Link>
        <span aria-hidden>:</span>
        <a href={`/data/datasets/${r.id}.json`} className="font-mono underline">
          record JSON
        </a>
      </p>
    </article>
  );
}

// ====================================================================================
// header
// ====================================================================================

function Header({ record: r }: { record: DatasetRecord }) {
  const repos = [
    r.repository?.short_name,
    ...r.additional_repositories.map((x) => x.short_name),
  ].filter(Boolean) as string[];

  return (
    <header className="pt-10 pb-6">
      <div className="flex flex-wrap items-center gap-2 text-meta">
        <Link href="/datasets" className="underline t-muted">
          Datasets
        </Link>
        <span className="t-faint">/</span>
        <span className="font-mono t-muted">
          {r.short_title ?? r.id}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {r.title}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {r.underexplored.is_underexplored && <UnderexploredBadge />}
          <AccessBadge tier={r.access.tier} size="md" />
          <ReviewBadge status={r.review.status} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-body t-muted">
        {r.program_name && <span>{r.program_name}</span>}
        {repos.length > 0 && <span>Available from {repos.join(" and ")}</span>}
        {r.generating_institutions.length > 0 && (
          <span>{r.generating_institutions.join(", ")}</span>
        )}
      </div>

      {(r.one_liner || r.summary) && (
        <p className="prose-cds mt-4 text-lede leading-relaxed">
          {r.one_liner ?? r.summary}
        </p>
      )}

      {/* the three actions promised on every page */}
      <div className="mt-6 flex flex-wrap gap-2 no-print">
        <a
          href="#fit"
          className="rounded-md px-3.5 py-2 text-body font-medium"
          style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
        >
          Can it answer my question?
        </a>
        <a
          href="#reuse"
          className="rounded-md border px-3.5 py-2 text-body font-medium"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Who has used it
        </a>
        <a
          href="#start"
          className="rounded-md border px-3.5 py-2 text-body font-medium"
          style={{ borderColor: "var(--border-strong)" }}
        >
          Get the data
        </a>
      </div>
    </header>
  );
}

// ====================================================================================
// 0. can it answer your question?
// ====================================================================================

function Fit({ record: r }: { record: DatasetRecord }) {
  return (
    <Section
      id="fit"
      title="Can it answer your question?"
      lede="Six common analyses, each judged from how complete the fields it depends on really are. The fastest way to rule a dataset in or out before requesting access."
    >
      <FitGrid verdicts={fitVerdicts(r)} />
    </Section>
  );
}

// ====================================================================================
// 1. at a glance
// ====================================================================================

/** Bars for one demographic breakdown. Uninformative values are drawn in amber. */
function demographicRows(values: Record<string, number>, limit = 6): BarRow[] {
  const total = Object.values(values).reduce((a, b) => a + b, 0);
  return Object.entries(values)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, n]) => ({
      key: label,
      label,
      value: n,
      tone: isNonAnswer(label) ? "warn" : "primary",
      display: (
        <>
          {num(n)}
          <span className="t-faint"> {total ? Math.round((100 * n) / total) : 0}%</span>
        </>
      ),
      title: `${label}: ${num(n)} of ${num(total)} cases`,
    }));
}

function informativeCount(values: Record<string, number>): number {
  return Object.entries(values)
    .filter(([k]) => !isNonAnswer(k))
    .reduce((a, [, n]) => a + n, 0);
}

function AtAGlance({ record: r }: { record: DatasetRecord }) {
  const d = r.cohort.demographics;
  const cohortN = r.cohort.n_cases ?? null;
  const hasSex = Object.keys(d.sex).length > 0;
  const hasRace = Object.keys(d.race).length > 0;
  const hasVital = Object.keys(d.vital_status).length > 0;
  const age = d.age_at_diagnosis_years;
  const hasAge = age && age.median !== undefined && age.q1 !== undefined && age.q3 !== undefined;
  const raceInformative = informativeCount(d.race);
  const vitalInformative = informativeCount(d.vital_status);
  const anyDemographics = hasSex || hasRace || hasVital || hasAge;

  return (
    <Section
      id="glance"
      title="At a glance"
      lede="Cohort, measurements, clinical completeness and access. Percentages come from the repository's own records, so they show what is actually filled in."
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <Card>
          <Stat
            label="Cases"
            value={num(r.cohort.n_cases ?? r.cohort.n_samples)}
            sub={
              r.cohort.n_cases
                ? r.cohort.n_samples
                  ? `${num(r.cohort.n_samples)} samples`
                  : undefined
                : "samples; case count not published"
            }
            evidence={r.cohort.evidence}
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Measurement types"
            value={num(new Set(r.assays.map((a) => a.modality)).size)}
            sub={
              r.cohort.n_files
                ? `${num(r.cohort.n_files)} files${r.cohort.total_bytes ? `, ${bytes(r.cohort.total_bytes)}` : ""}`
                : undefined
            }
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Follow-up"
            value={
              r.longitudinal.median_followup_months
                ? months(r.longitudinal.median_followup_months)
                : r.longitudinal.has_followup
                  ? "Present"
                  : "None recorded"
            }
            sub={
              [
                r.longitudinal.n_cases_with_followup && r.cohort.n_cases
                  ? `for ${num(r.longitudinal.n_cases_with_followup)} of ${num(r.cohort.n_cases)} cases`
                  : null,
                r.longitudinal.survival_endpoints.length > 0
                  ? r.longitudinal.survival_endpoints.join(", ")
                  : "no survival endpoint",
              ]
                .filter(Boolean)
                .join("; ")
            }
            evidence={r.longitudinal.evidence}
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Treatment response"
            value={
              r.longitudinal.has_treatment_response === true
                ? "Recorded"
                : r.longitudinal.has_treatment_response === false
                  ? "Not recorded"
                  : "Unknown"
            }
            sub={
              r.longitudinal.response_criteria.length > 0
                ? r.longitudinal.response_criteria.slice(0, 3).join(", ")
                : undefined
            }
            evidence={r.longitudinal.evidence}
            emphasis
          />
        </Card>
      </div>

      {/* controlled subject */}
      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-body font-medium uppercase tracking-wide t-faint">
          Subject
          {r.subject.evidence.length > 0 && <EvidenceChip evidence={r.subject.evidence} />}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {r.subject.tissues.map((code) => {
            const item = getSubjects().subjects.find((subject) => subject.code === code);
            return <Chip key={code}>{item?.label ?? code}</Chip>;
          })}
          {r.subject.scope === "pan_cancer" && <Chip>Pan-cancer</Chip>}
          {r.subject.scope === "non_cancer" && <Chip>Non-cancer</Chip>}
          {r.subject.scope === "not_stated" && <Chip>Subject not stated</Chip>}
          {r.subject.scope === "title_derived" && r.subject.tissues.length === 0 && (
            <Chip>Subject derived from title</Chip>
          )}
        </div>
        {r.subject.scope === "title_derived" && (
          <p className="mt-2 text-meta t-muted">
            This subject was derived from the dataset title and was not stated by the
            repository. It is available for browsing but is never used to place this
            dataset in an answer shortlist.
          </p>
        )}
      </div>

      {/* cancer types and sites as filed */}
      <div className="mt-6">
        <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
          As filed by the repository
        </h3>
        {r.cancer_types.length === 0 && r.primary_sites.length === 0 ? (
          <EmptyState>The repository publishes no disease classification for this dataset.</EmptyState>
        ) : (
          <ChipList
            items={[
              ...r.cancer_types.map((t) => ({
                key: `type:${t.label}`,
                label: t.label,
                tone: "accent" as const,
                title: t.ontology ? `${t.ontology} ${t.code ?? ""}` : undefined,
              })),
              ...r.primary_sites.map((s) => ({ key: `site:${s}`, label: s, tone: "neutral" as const })),
            ]}
            what="cancer types and sites"
          />
        )}
      </div>

      {/* who is in the cohort */}
      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-body font-medium uppercase tracking-wide t-faint">
          Who is in the cohort
          {d.evidence.length > 0 && <EvidenceChip evidence={d.evidence} />}
        </h3>
        {!anyDemographics ? (
          <EmptyState>The repository&rsquo;s harmonized records carry no demographics for this dataset.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hasSex && (
              <Card>
                <h4 className="mb-2 text-meta font-medium">Sex</h4>
                <Bars rows={demographicRows(d.sex)} labelWidth={70} valueWidth={80} />
              </Card>
            )}
            {hasAge && (
              <Card>
                <h4 className="mb-2 text-meta font-medium">Age at diagnosis</h4>
                <AgeBox stats={age} />
              </Card>
            )}
            {hasRace && (
              <Card>
                <h4 className="mb-2 text-meta font-medium">Race</h4>
                <Bars rows={demographicRows(d.race)} labelWidth={110} valueWidth={80} />
                {raceInformative === 0 && (
                  <p className="mt-2 text-meta" style={{ color: "var(--weak)" }}>
                    Every value is &ldquo;not reported&rdquo;, so no analysis by race is
                    possible with these data.
                  </p>
                )}
              </Card>
            )}
            {hasVital && (
              <Card>
                <h4 className="mb-2 text-meta font-medium">Vital status</h4>
                <Bars rows={demographicRows(d.vital_status)} labelWidth={90} valueWidth={80} />
                {vitalInformative === 0 && (
                  <p className="mt-2 text-meta" style={{ color: "var(--weak)" }}>
                    Recorded for every case and informative for none. Survival analysis
                    is impossible at any sample size.
                  </p>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* assays */}
      <div className="mt-6">
        <h3 className="mb-1 text-body font-medium uppercase tracking-wide t-faint">
          Measurements
        </h3>
        <p className="mb-2 text-meta t-muted">
          The bar shows how much of the cohort each measurement covers.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-body">
            <thead>
              <tr className="border-b text-left t-faint">
                <th className="py-1.5 pr-3 font-medium">Assay</th>
                <th className="py-1.5 pr-3 font-medium">Platform</th>
                <th className="py-1.5 pr-3 text-right font-medium">Cases</th>
                <th className="py-1.5 pr-3 font-medium" style={{ width: 130 }}>
                  Share of cohort
                </th>
                <th className="py-1.5 pr-3 text-right font-medium">Files</th>
                <th className="py-1.5 font-medium">Levels</th>
              </tr>
            </thead>
            <tbody>
              {r.assays.map((a, i) => {
                const n = a.n_cases ?? a.n_samples ?? null;
                const share = cohortN && n ? Math.min(100, (100 * n) / cohortN) : null;
                return (
                  <tr key={`${a.modality}-${i}`} className="border-b last:border-b-0">
                    <td className="py-1.5 pr-3">
                      <span className="flex items-center gap-1.5">
                        {a.label}
                        {SCARCE_MODALITIES.has(a.modality) && (
                          <Chip tone="scarce" title="Scarce across the NCI portfolio">
                            scarce
                          </Chip>
                        )}
                        <EvidenceChip evidence={a.evidence} />
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 t-muted">{a.platform ?? "-"}</td>
                    <td className="tnum py-1.5 pr-3 text-right">{num(n)}</td>
                    <td className="py-1.5 pr-3">
                      {share !== null ? (
                        <span className="flex items-center gap-2" title={`${Math.round(share)}% of ${num(cohortN)} cases`}>
                          <span className="bar-track" style={{ width: 80, height: 6 }}>
                            <i style={{ width: `${share}%`, background: "var(--viz-1)" }} />
                          </span>
                          <span className="viz-value t-muted">{Math.round(share)}%</span>
                        </span>
                      ) : (
                        <span className="t-faint">-</span>
                      )}
                    </td>
                    <td className="tnum py-1.5 pr-3 text-right">{num(a.n_files)}</td>
                    <td className="py-1.5 t-muted">{a.data_levels.join(", ") || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* clinical completeness */}
      {r.clinical_variables.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-1 text-body font-medium uppercase tracking-wide t-faint">
            How complete the clinical fields are
          </h3>
          <p className="mb-3 max-w-2xl text-meta t-muted">
            A field counts as informative only when it holds a real value. &ldquo;Not
            reported&rdquo; blocks an analysis just as a missing field does. Fields marked
            1:n can hold several records per case, so they show the share of cases with any
            record.
          </p>
          <CoverageChart variables={r.clinical_variables} />
        </div>
      )}

      {/* access summary */}
      <div className="mt-6">
        <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
          Access
        </h3>
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <AccessBadge tier={r.access.tier} size="md" />
            <span className="text-body t-muted">{ACCESS_DESCRIPTIONS[r.access.tier]}</span>
            <EvidenceChip evidence={r.access.evidence} />
          </div>
          {r.access.mechanism && <p className="mt-2 text-body">{r.access.mechanism}</p>}
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-body sm:grid-cols-2">
            {r.access.open_components.length > 0 && (
              <Field label="Open components">{r.access.open_components.join("; ")}</Field>
            )}
            {r.access.controlled_components.length > 0 && (
              <Field label="Controlled components">
                {r.access.controlled_components.join("; ")}
              </Field>
            )}
            {r.access.typical_turnaround && (
              <Field label="Typical turnaround">{r.access.typical_turnaround}</Field>
            )}
            {r.access.license && <Field label="License">{r.access.license}</Field>}
            {r.access.embargo_until && (
              <Field label="Embargo until">{shortDate(r.access.embargo_until)}</Field>
            )}
            {r.access.citation_requirement && (
              <Field label="Citation requirement">{r.access.citation_requirement}</Field>
            )}
          </dl>
        </Card>
      </div>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-micro uppercase tracking-wide t-faint">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ====================================================================================
// 2. useful for
// ====================================================================================

function UsefulFor({ record: r }: { record: DatasetRecord }) {
  return (
    <Section
      id="useful-for"
      title="What it is good for"
      lede="Questions these data can support, with the fields each one depends on. Written and checked by a reviewer, not generated from metadata."
    >
      {r.useful_for.length === 0 ? (
        <EmptyState>
          No reviewed research questions yet. The measurements and field completeness
          above are machine-extracted and still useful for judging fit.
        </EmptyState>
      ) : (
        <ol className="space-y-4">
          {r.useful_for.map((q, i) => (
            <li key={i}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="max-w-2xl font-medium leading-snug">
                    {i + 1}. {q.question}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Chip
                      tone={q.feasibility === "direct" ? "accent" : "neutral"}
                      title={
                        q.feasibility === "direct"
                          ? "Answerable with the data as distributed."
                          : q.feasibility === "needs_access"
                            ? "Requires an approved data access request first."
                            : q.feasibility === "needs_linkage"
                              ? "Requires joining another dataset."
                              : "Underpowered; treat results as hypothesis-generating."
                      }
                    >
                      {FEASIBILITY_LABELS[q.feasibility]}
                    </Chip>
                    {q.approx_n ? (
                      <Chip title="Approximate analysable sample size for this question">
                        n ≈ {num(q.approx_n)}
                      </Chip>
                    ) : null}
                    <EvidenceChip evidence={q.evidence} />
                  </div>
                </div>
                <p className="prose-cds mt-2 text-body">{q.rationale}</p>
                {q.statistical_note && (
                  <p className="mt-2 text-body" style={{ color: "var(--moderate)" }}>
                    Statistical note: {q.statistical_note}
                  </p>
                )}
                {(q.required_fields.length > 0 || q.required_modalities.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-micro uppercase tracking-wide t-faint">
                      Needs
                    </span>
                    {q.required_modalities.map((m) => (
                      <Chip key={m} tone="accent">
                        {modalityLabel(m)}
                      </Chip>
                    ))}
                    {q.required_fields.map((f) => (
                      <Chip key={f}>
                        <span className="font-mono text-micro">{f}</span>
                      </Chip>
                    ))}
                  </div>
                )}
                {q.exemplar_pmid && (
                  <p className="mt-2 text-meta t-muted">
                    A published example:{" "}
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${q.exemplar_pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      PMID {q.exemplar_pmid}
                    </a>
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

// ====================================================================================
// 3. limitations
// ====================================================================================

function Limitations({ record: r }: { record: DatasetRecord }) {
  const blocking = r.limitations.filter((l) => l.severity === "blocking");
  const other = r.limitations.filter((l) => l.severity !== "blocking");

  return (
    <Section
      id="limitations"
      title="What it cannot tell you"
      lede="What these data cannot answer, as written by a reviewer against the source."
      aside={
        blocking.length > 0 ? (
          <span className="text-meta font-medium" style={{ color: "var(--weak)" }}>
            {blocking.length} blocking
          </span>
        ) : undefined
      }
    >
      {r.limitations.length === 0 && r.inappropriate_uses.length === 0 ? (
        <EmptyState>
          No reviewed limitations yet. Check the field completeness chart above before
          committing to an analysis. Low coverage on an endpoint you need is the most
          common blocker.
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {[...blocking, ...other].map((l, i) => (
            <Card key={i}>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={l.severity} />
                <span className="text-meta uppercase tracking-wide t-faint">
                  {LIMITATION_KIND_LABELS[l.kind] ?? l.kind}
                </span>
                <EvidenceChip evidence={l.evidence} />
              </div>
              <p className="prose-cds mt-2 text-body">{l.statement}</p>
              {l.affected_analyses.length > 0 && (
                <p className="mt-2 text-body">
                  <span className="t-faint">Affects: </span>
                  {l.affected_analyses.join("; ")}
                </p>
              )}
              {l.mitigation && (
                <p className="mt-2 text-body" style={{ color: "var(--open)" }}>
                  Mitigation: {l.mitigation}
                </p>
              )}
            </Card>
          ))}

          {r.inappropriate_uses.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
                Not appropriate for
              </h3>
              <ul className="space-y-2">
                {r.inappropriate_uses.map((u, i) => (
                  <li key={i}>
                    <Callout tone="warn">
                      <strong>{u.statement}</strong>
                      <span className="t-muted"> - {u.reason}</span>
                      <span className="ml-1.5">
                        <EvidenceChip evidence={u.evidence} />
                      </span>
                    </Callout>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ====================================================================================
// 4. who has used it
// ====================================================================================

/**
 * Ladder row labels. Deliberately not `REUSE_TIER_LABELS`: those are badges that sit
 * beside a single article ("Data analyzed"), while these are rows counting articles and
 * read as what the articles did ("Analyzed the data").
 */
const TIER_LABEL = {
  t0_mention: "Mentioned the dataset",
  t1_accession: "Accession found in text",
  t2_declared: "Declared using it",
  t3_analyzed: "Analyzed the data",
} as const;

function Reuse({ record: r }: { record: DatasetRecord }) {
  const m = r.reuse_metrics;
  const analyzed = r.reuse.filter((x) => x.tier === "t3_analyzed" || x.tier === "t4_confirmed");
  const weaker = r.reuse.filter((x) => x.tier !== "t3_analyzed" && x.tier !== "t4_confirmed");
  // Both properties are resolved per article and are frequently unresolvable: a null flag
  // means nobody checked, which is not the same as a negative answer and must never be
  // published as one.
  const overlapChecked = analyzed.filter((x) => x.independent_of_generators != null);
  const fundingChecked = analyzed.filter((x) => x.nci_funded_reuse != null);
  const overlapClause =
    overlapChecked.length === 0
      ? "author overlap with the generating team could not be checked for any of them"
      : `${num(overlapChecked.filter((x) => x.independent_of_generators).length)} of the ${num(
          overlapChecked.length,
        )} we could check had no author in common with the generating team`;
  const fundingClause =
    fundingChecked.length === 0
      ? "none could be checked for NCI funding of their own"
      : `${num(fundingChecked.filter((x) => x.nci_funded_reuse).length)} of the ${num(
          fundingChecked.length,
        )} we could check were themselves NCI-funded`;
  const tiers = m.n_by_tier ?? {};
  // A tier is absent, not zero, when the accession-precision correction could not be
  // estimated. `?? 0` here would turn "we could not measure this" into "nobody used
  // this", which is the opposite claim and the more damaging one for a dataset.
  const nAnalyzed = tiers.t3_analyzed ?? m.n_verified_reuse ?? null;
  const prec = m.accession_precision ?? null;
  const wasCorrected = prec?.needs_correction === true && prec.precision != null;
  const rawAnalyzed = m.n_by_tier_raw?.t3_analyzed ?? null;
  const hasExpected = m.expected_reuse !== null && m.expected_reuse !== undefined;
  const ladder: BarRow[] = [
    ...(m.n_citations_to_primary_publication !== null && m.n_citations_to_primary_publication !== undefined
      ? [
          {
            key: "cited",
            label: "Cited the paper",
            value: m.n_citations_to_primary_publication,
            tone: "muted" as const,
            title: "Attention to the publication. Not reuse of the data.",
          },
        ]
      : []),
    ...(["t0_mention", "t1_accession", "t2_declared", "t3_analyzed"] as const)
      .filter((tier) => tiers[tier] !== undefined)
      .map((tier) => ({
        key: tier,
        label: TIER_LABEL[tier],
        value: tiers[tier],
        tone: (tier === "t3_analyzed" ? "primary" : "muted") as "primary" | "muted",
        title: REUSE_TIER_MEANING[tier],
      })),
  ];
  const showLadder = m.has_citable_accession !== false && ladder.some((x) => x.value > 0);
  const showGap = hasExpected && nAnalyzed !== null;

  return (
    <Section
      id="reuse"
      title="Who has used it"
      lede="Articles that analyzed these data, counted separately from articles that only cited the paper. Only the first counts as reuse."
    >
      {/* the headline numbers */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <Stat
            label="Analyzed the data"
            value={nAnalyzed === null ? "-" : num(nAnalyzed)}
            sub={
              nAnalyzed === null
                ? "could not be measured for this dataset"
                : wasCorrected
                  ? `accession in the methods; ${Math.round((prec!.precision ?? 0) * 100)}% of a ${prec!.n_checked}-article sample really cited it`
                  : "accession in the methods section"
            }
            evidence={m.evidence}
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Declared using it"
            value={tiers.t2_declared === undefined ? "-" : num(tiers.t2_declared)}
            sub="named in a data availability statement"
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Cited the paper"
            value={
              m.n_citations_to_primary_publication === null ||
              m.n_citations_to_primary_publication === undefined
                ? "-"
                : num(m.n_citations_to_primary_publication)
            }
            sub="attention to the publication, not reuse of the data"
            emphasis
          />
        </Card>
        <Card>
          <Stat
            label="Against expectation"
            value={
              !showGap
                ? "Not assessed"
                : m.reuse_gap_index !== null && m.reuse_gap_index !== undefined
                  ? m.reuse_gap_index >= 0
                    ? "As expected or above"
                    : m.reuse_gap_index > -1.5
                      ? "Somewhat below"
                      : "Well below"
                  : "-"
            }
            sub={
              showGap
                ? `about ${m.expected_reuse! < 1 ? m.expected_reuse!.toFixed(1) : num(Math.round(m.expected_reuse!))} articles expected; index ${m.reuse_gap_index?.toFixed(2) ?? "-"}`
                : undefined
            }
            emphasis
          />
        </Card>
      </div>

      {(showLadder || showGap) && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {showLadder && (
            <Card>
              <h3 className="text-lede font-medium">What articles did with it</h3>
              <p className="mb-3 text-meta t-muted">
                Only the last row counts as reuse. Where the accession appears in an
                article tells us what the authors did with the data.
              </p>
              <Bars rows={ladder} labelWidth={160} valueWidth={64} />
            </Card>
          )}
          {showGap && (
            <Card>
              <h3 className="text-lede font-medium">Against comparable datasets</h3>
              <p className="mb-3 text-meta t-muted">
                {reuseSentence(nAnalyzed!, m.expected_reuse)}{" "}
                The expectation comes from a model of size, age, breadth and access tier.
              </p>
              <ObservedExpected
                observed={nAnalyzed!}
                expected={m.expected_reuse!}
                underexplored={r.underexplored.is_underexplored}
              />
            </Card>
          )}
        </div>
      )}

      {m.citation_to_reuse_ratio && m.citation_to_reuse_ratio >= 5 && (
        <div className="mt-4">
          <Callout tone="info" title="Well known, little used">
            The publication has {num(m.n_citations_to_primary_publication)} citations,
            about {m.citation_to_reuse_ratio.toFixed(0)} for every article that analyzed
            the data. The finding travelled further than the resource did.
          </Callout>
        </div>
      )}

      {nAnalyzed === null && m.has_citable_accession !== false && (
        <div className="mt-4">
          <Callout tone="warn" title="This count could not be measured">
            Europe PMC indexes this dataset&rsquo;s accession as separate words, so a
            search for it also returns articles that merely use those words in sequence.
            Correcting for that needs a sample of open-access full text, and too few of
            the matching articles are open access
            {prec ? ` (${prec.n_checked} of ${prec.n_sampled} sampled)` : ""} to estimate
            it. We publish no number rather than one we know to be inflated.
          </Callout>
        </div>
      )}

      {wasCorrected && rawAnalyzed !== null && rawAnalyzed !== nAnalyzed && (
        <div className="mt-4">
          <Callout tone="neutral" title="How this count was corrected">
            Europe PMC returned {num(rawAnalyzed)} articles for{" "}
            <code className="t-mono">{prec!.query}</code>, but it indexes the hyphen in{" "}
            <span className="t-mono">{prec!.token}</span> as a word break, so that query
            also matches the two words in ordinary prose. Of {prec!.n_checked} sampled
            articles whose full text we could read, {prec!.n_literal} contained the
            literal accession
            {prec!.precision_low != null && prec!.precision_high != null
              ? ` (${Math.round(prec!.precision_low * 100)}-${Math.round(prec!.precision_high * 100)}%, 95% interval)`
              : ""}
            . The published figure is the raw count scaled by that fraction.
          </Callout>
        </div>
      )}

      {m.has_citable_accession === false && (
        <div className="mt-4">
          <Callout tone="warn" title="Reuse cannot be traced for this dataset">
            No accession is specific enough to search the literature for, so we cannot
            tell how often these data have been reused. That is a limit of the
            measurement, not a finding about the dataset. It is also a barrier in itself:
            a researcher cannot find prior work to build on.
          </Callout>
        </div>
      )}

      {r.underexplored.basis.length > 0 && (
        <div className="mt-4">
          <Callout
            tone={r.underexplored.is_underexplored ? "info" : "neutral"}
            title={r.underexplored.is_underexplored ? "Why this is an underused opportunity" : "Reuse assessment"}
          >
            <ul className="space-y-1">
              {r.underexplored.basis.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {r.underexplored.comparator_set && (
              <p className="mt-1.5 text-meta t-muted">
                Compared against {r.underexplored.comparator_set}. See{" "}
                <Link href="/methods#reuse-gap" className="underline">
                  Methods
                </Link>{" "}
                for the model.
              </p>
            )}
          </Callout>
        </div>
      )}

      {/* primary publications
       *
       * Split by provenance, because the heading is itself a claim. A paper this
       * pipeline nominated is a suggestion, and printing one under "Original
       * publication" asserts whose work the dataset is on the strength of a guess. */}
      {(() => {
        const sourced = r.primary_publications.filter((p) => !isInferredMarker(p));
        const suggested = r.primary_publications.filter(isInferredMarker);
        return (
          <>
            {sourced.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
                  Original publication{sourced.length > 1 ? "s" : ""}
                </h3>
                <ul className="space-y-2">
                  {sourced.map((p, i) => (
                    <li key={i}>
                      <Card>
                        <PubLine pub={p} />
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suggested.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
                  Possible original publication, unverified
                </h3>
                <p className="mb-2 max-w-2xl text-meta t-muted">
                  No repository or reviewer names this dataset&rsquo;s marker paper, so
                  this is the pipeline&rsquo;s own guess: the earliest heavily cited
                  article that analysed the accession and names it in full text. Nothing
                  is counted from it - not the citation figure above, not the funding
                  attribution - and it is queued for review rather than presented as fact.
                </p>
                <ul className="space-y-2">
                  {suggested.map((p, i) => (
                    <li key={i}>
                      <Card>
                        <PubLine pub={p} />
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      })()}

      {/* verified reuse */}
      <div className="mt-6">
        <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
          Articles that analyzed the data
        </h3>
        {analyzed.length > 0 && (
          <p className="mb-2 max-w-2xl text-meta t-muted">
            {nAnalyzed !== null && m.n_reuse_examined > 0 && nAnalyzed > m.n_reuse_examined
              ? `Examples, not the full list. Of the ${num(nAnalyzed)} articles counted above, ${num(m.n_reuse_examined)} were retrieved and graded individually; these are the strongest of those.`
              : "Each was retrieved and graded individually."}
          </p>
        )}
        {analyzed.length > 0 && (
          <p className="mb-2 max-w-2xl text-meta t-muted">
            Deep-review sample: author overlap and funding were checked only for the{" "}
            {num(r.reuse.length)} articles listed here, not for every article examined. Of
            the {num(analyzed.length)} that analyzed the data, {overlapClause}, and{" "}
            {fundingClause}. These are sample counts, not population estimates.
          </p>
        )}
        {analyzed.length === 0 ? (
          <EmptyState>
            {m.has_citable_accession === false
              ? "Not searchable. See the note above."
              : `None found. We searched Europe PMC for this dataset's accessions in article methods, results, tables, figures and data availability statements${m.searched_at ? ` on ${shortDate(m.searched_at)}` : ""}. That means our search found nothing, not that nobody has used these data.`}
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {analyzed.map((x, i) => (
              <li key={i}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <PubLine pub={x.publication} />
                    <div className="flex shrink-0 items-center gap-1.5">
                      <ReuseTierBadge tier={x.tier} />
                      {x.independent_of_generators === true && (
                        <Chip
                          tone="accent"
                          title="No author surname overlaps the dataset's generating team or its grant investigators. The strongest available signal of genuine external reuse."
                        >
                          independent
                        </Chip>
                      )}
                      <EvidenceChip evidence={x.evidence} />
                    </div>
                  </div>
                  {x.what_they_analyzed && (
                    <p className="mt-2 text-body">
                      <span className="t-faint">Analyzed: </span>
                      {x.what_they_analyzed}
                    </p>
                  )}
                  {x.what_they_found && (
                    <p className="mt-1 text-body">
                      <span className="t-faint">Found: </span>
                      {x.what_they_found}
                    </p>
                  )}
                  {x.accession_locator && (
                    <p className="mt-1.5 text-meta t-faint">
                      Accession located in: {x.accession_locator}. {REUSE_TIER_MEANING[x.tier]}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {weaker.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-body font-medium">
            {weaker.length} article{weaker.length === 1 ? "" : "s"} with weaker evidence
          </summary>
          <p className="mt-2 max-w-2xl text-meta t-muted">
            These name the dataset, but we could not confirm the data were analyzed. Shown
            for completeness and not counted as reuse.
          </p>
          <ul className="mt-2 space-y-2">
            {weaker.map((x, i) => (
              <li key={i} className="flex flex-wrap items-start justify-between gap-2 text-body">
                <PubLine pub={x.publication} compact />
                <ReuseTierBadge tier={x.tier} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </Section>
  );
}

function PubLine({
  pub,
  compact = false,
}: {
  pub: DatasetRecord["primary_publications"][number];
  compact?: boolean;
}) {
  const label = pub.title ?? pub.doi ?? pub.pmid ?? "Untitled";
  return (
    <div className="min-w-0">
      {pub.url ? (
        <a
          href={pub.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`hover:underline ${compact ? "text-body" : "font-medium"}`}
          style={{ color: "var(--accent)" }}
        >
          {label}
        </a>
      ) : (
        <span className={compact ? "text-body" : "font-medium"}>{label}</span>
      )}
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta t-muted">
        {pub.authors_short && <span>{pub.authors_short}</span>}
        {pub.journal && <span className="italic">{pub.journal}</span>}
        {pub.year && <span className="tnum">{pub.year}</span>}
        {pub.citation_count !== null && pub.citation_count !== undefined && (
          <span className="tnum">{num(pub.citation_count)} citations</span>
        )}
        {pub.pmid && <span className="font-mono text-micro">PMID {pub.pmid}</span>}
        {pub.evidence.length > 0 && <EvidenceChip evidence={pub.evidence} />}
      </div>
    </div>
  );
}

// ====================================================================================
// 5. ways to use it
// ====================================================================================

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 } as const;

function WaysToUse({ record: r }: { record: DatasetRecord }) {
  const examples = [...r.analysis_examples].sort(
    (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level],
  );
  return (
    <Section
      id="ways"
      title="Analysis notebooks and worked examples"
      lede="Go beyond the download. Each executed workbook retrieves, cleans and analyzes real data end to end, with a receipt recording when it ran, which packages it used and how long it took."
    >
      {examples.length === 0 ? (
        <EmptyState>
          No analysis examples for this dataset yet. The executed workbooks cover the
          common patterns and can be adapted. See{" "}
          <Link href="/agents" className="underline">
            workbooks
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {examples.map((ex, i) => (
            <Card key={i}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={ex.level === "beginner" ? "accent" : "neutral"}>
                      {ex.level}
                    </Chip>
                    <h3 className="font-medium">{ex.title}</h3>
                  </div>
                  <p className="mt-1 text-body t-muted">
                    {ex.question}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <Chip>{ex.language}</Chip>
                  {ex.est_runtime && <Chip>{ex.est_runtime}</Chip>}
                  {ex.receipt?.executed ? (
                    <Chip
                      tone="accent"
                      title={
                        `Executed ${shortDate(ex.receipt.executed_at)}` +
                        (ex.receipt.runtime_seconds
                          ? ` in ${ex.receipt.runtime_seconds.toFixed(0)}s`
                          : "") +
                        (ex.receipt.executor ? ` on ${ex.receipt.executor}` : "") +
                        (ex.receipt.n_cells_executed
                          ? `; ${ex.receipt.n_cells_executed}/${ex.receipt.n_cells} cells ran`
                          : "")
                      }
                    >
                      executed
                    </Chip>
                  ) : ex.workbook_path ? (
                    <Chip title="Written but not yet run end to end in our environment">
                      not executed
                    </Chip>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid gap-4 text-body sm:grid-cols-2">
                {ex.inputs.length > 0 && (
                  <div>
                    <div className="text-micro uppercase tracking-wide t-faint">
                      Required inputs
                    </div>
                    <ul className="mt-0.5 list-disc pl-4">
                      {ex.inputs.map((x, j) => (
                        <li key={j}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ex.outputs.length > 0 && (
                  <div>
                    <div className="text-micro uppercase tracking-wide t-faint">
                      Expected outputs
                    </div>
                    <ul className="mt-0.5 list-disc pl-4">
                      {ex.outputs.map((x, j) => (
                        <li key={j}>{x}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {ex.steps.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-body font-medium">
                    Steps
                  </summary>
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-body">
                    {ex.steps.map((s, j) => (
                      <li key={j}>{s}</li>
                    ))}
                  </ol>
                </details>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {ex.notebook_download_url && (
                  <a
                    href={ex.notebook_download_url}
                    download
                    className="rounded border px-2.5 py-1 text-meta font-medium"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    Download executed notebook
                  </a>
                )}
                {ex.workbook_url && (
                  <a
                    href={ex.workbook_url}
                    className="rounded border px-2.5 py-1 text-meta font-medium"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    View notebook
                  </a>
                )}
                {ex.colab_url && (
                  <a
                    href={ex.colab_url}
                    className="rounded border px-2.5 py-1 text-meta font-medium"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    Open in Colab
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ====================================================================================
// 6. start here
// ====================================================================================

function StartHere({ record: r }: { record: DatasetRecord }) {
  const snippets = starterSnippets(r);
  return (
    <Section
      id="start"
      title="Start here"
      lede="The shortest path from this page to data on your disk: starter code generated from this record's identifiers, then the access steps."
    >
      <div className="mb-6">
        <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
          Get the data in code
        </h3>
        <div className="space-y-2">
          {snippets.map((sn, i) => (
            <details key={sn.key} open={i === 0} className="rounded-lg border" style={{ background: "var(--bg-raised)" }}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-body font-medium">
                {sn.label}
                <Chip>{sn.language}</Chip>
              </summary>
              <div className="border-t px-4 py-3">
                {sn.note && <p className="mb-2 text-meta t-muted">{sn.note}</p>}
                <pre
                  className="overflow-x-auto rounded border p-3 font-mono text-meta leading-relaxed"
                  style={{ background: "var(--bg-sunken)" }}
                >
                  <code>{sn.code}</code>
                </pre>
              </div>
            </details>
          ))}
        </div>
      </div>

      <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
        Access steps
      </h3>
      {r.access_steps.length === 0 ? (
        <Card>
          <p className="text-body">
            {r.access.mechanism ??
              "Access route not yet documented for this dataset."}
          </p>
          {r.landing_page_url && (
            <a
              href={r.landing_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-md px-3 py-1.5 text-body font-medium"
              style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
            >
              Open in {r.repository?.short_name ?? "repository"}
            </a>
          )}
        </Card>
      ) : (
        <ol className="space-y-3">
          {r.access_steps
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <li key={s.order}>
                <Card>
                  <div className="flex items-start gap-3">
                    <span
                      className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full text-meta font-semibold"
                      style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
                    >
                      {s.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{s.action}</span>
                        {s.est_time && (
                          <span className="text-meta t-faint">
                            {s.est_time}
                          </span>
                        )}
                      </div>
                      {s.detail && (
                        <p className="mt-1 text-body t-muted">
                          {s.detail}
                        </p>
                      )}
                      {s.requires.length > 0 && (
                        <p className="mt-1 text-meta t-faint">
                          Requires: {s.requires.join(", ")}
                        </p>
                      )}
                      {s.cli_snippet && (
                        <pre
                          className="mt-2 overflow-x-auto rounded border p-2 font-mono text-meta"
                          style={{ background: "var(--bg-sunken)" }}
                        >
                          <code>{s.cli_snippet}</code>
                        </pre>
                      )}
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block max-w-full break-all text-body underline"
                          style={{ color: "var(--accent)" }}
                        >
                          {s.url}
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
        </ol>
      )}

    </Section>
  );
}

// ====================================================================================
// 7. provenance
// ====================================================================================

function Provenance({ record: r }: { record: DatasetRecord }) {
  const generation = r.grants.filter((g) => g.role === "generation");
  const reuse = r.grants.filter((g) => g.role === "reuse");
  const infra = r.grants.filter((g) => g.role === "infrastructure");

  return (
    <Section
      id="provenance"
      title="Provenance"
      lede="Identifiers, versions, funding and verification. All of it is in this record's JSON."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
            Identifiers
          </h3>
          <ul className="space-y-1 text-body">
            {r.identifiers.slice(0, 14).map((idn, i) => (
              <li key={`${idn.scheme}-${idn.value}-${i}`} className="flex items-baseline gap-2">
                <span
                  className="shrink-0 text-micro uppercase tracking-wide"
                  style={{ color: "var(--text-faint)", minWidth: "8.5rem" }}
                >
                  {idSchemeLabel(idn.scheme)}
                </span>
                {idn.url ? (
                  <a
                    href={idn.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-meta underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {idn.value}
                  </a>
                ) : (
                  <span className="font-mono text-meta">{idn.value}</span>
                )}
                <EvidenceChip evidence={idn.evidence} />
              </li>
            ))}
          </ul>
          {r.identifiers.length > 14 && (
            <p className="mt-1.5 text-meta t-faint">
              and {r.identifiers.length - 14} more in the JSON record
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-body font-medium uppercase tracking-wide t-faint">
            Versions and verification
          </h3>
          <dl className="grid gap-y-2 text-body">
            {r.version && <Field label="Version">{r.version}</Field>}
            {r.release_date && <Field label="Released">{shortDate(r.release_date)}</Field>}
            {r.last_upstream_update && (
              <Field label="Last upstream change">{shortDate(r.last_upstream_update)}</Field>
            )}
            <Field label="Metadata retrieved">{shortDate(r.retrieved_at)}</Field>
            {r.verification.last_verified_at && (
              <Field label="Links last verified">
                {shortDate(r.verification.last_verified_at)}
                {r.verification.n_links_broken > 0 && (
                  <span style={{ color: "var(--weak)" }}>
                    {" "}
                    - {r.verification.n_links_broken} broken
                  </span>
                )}
              </Field>
            )}
            <Field label="Review status">
              <ReviewBadge status={r.review.status} />
              {r.review.reviewer && (
                <span className="ml-2 t-muted">
                  {r.review.reviewer}
                  {r.review.reviewer_affiliation
                    ? `, ${r.review.reviewer_affiliation}`
                    : ""}
                  {r.review.reviewed_at ? ` on ${shortDate(r.review.reviewed_at)}` : ""}
                </span>
              )}
            </Field>
            <Field label="Data generation funding">
              {FUNDING_ROLE_LABELS[r.data_generation_funding_role]}
            </Field>
          </dl>
          {r.review.open_questions.length > 0 && (
            <div className="mt-3">
              <Callout tone="neutral" title="Open questions from review">
                <ul className="list-disc space-y-0.5 pl-4">
                  {r.review.open_questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </Callout>
            </div>
          )}
        </div>
      </div>

      {r.grants.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-1 text-body font-medium uppercase tracking-wide t-faint">
            Funding
          </h3>
          <p className="mb-3 max-w-2xl text-meta t-muted">
            Awards resolved through NIH RePORTER. Awards that paid to generate these
            data are listed apart from awards that paid to reuse them. Both are returns on
            NCI investment, but different ones.
          </p>
          <div className="space-y-4">
            {[
              ["Funded data generation", generation],
              ["Funded reuse of these data", reuse],
              ["Funded infrastructure or harmonization", infra],
            ].map(([label, list]) =>
              (list as typeof generation).length > 0 ? (
                <div key={label as string}>
                  <h4 className="mb-1.5 text-meta font-medium">{label as string}</h4>
                  <ul className="space-y-1 text-body">
                    {(list as typeof generation).slice(0, 10).map((g, i) => (
                      <li key={`${g.core_project_num}-${i}`} className="flex flex-wrap items-baseline gap-2">
                        {g.reporter_url ? (
                          <a
                            href={g.reporter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-meta underline"
                            style={{ color: "var(--accent)" }}
                          >
                            {g.core_project_num}
                          </a>
                        ) : (
                          <span className="font-mono text-meta">{g.core_project_num}</span>
                        )}
                        {g.title && <span className="truncate">{g.title}</span>}
                        {g.pi_names.length > 0 && (
                          <span className="t-muted">
                            {g.pi_names.slice(0, 2).join(", ")}
                          </span>
                        )}
                        {g.fiscal_years.length > 0 && (
                          <span className="tnum text-meta t-faint">
                            FY{Math.min(...g.fiscal_years)}
                            {g.fiscal_years.length > 1
                              ? `-${Math.max(...g.fiscal_years)}`
                              : ""}
                          </span>
                        )}
                        <EvidenceChip evidence={g.evidence} />
                      </li>
                    ))}
                  </ul>
                  {(list as typeof generation).length > 10 && (
                    <p className="mt-1 text-meta t-faint">
                      and {(list as typeof generation).length - 10} more
                    </p>
                  )}
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
