import type { Metadata } from "next";
import Link from "next/link";

import { Bars } from "@/components/charts/Bars";
import { RepositoryBars } from "@/components/charts/RepositoryBars";
import ReuseScatter from "@/components/charts/ReuseScatter";
import { Callout, Card } from "@/components/ui";
import {
  getFieldCalibration,
  getModel,
  getRepositoryBreakdown,
  getScatterPoints,
  getStats,
} from "@/lib/data";
import { FIT_RULES } from "@/lib/fit";
import { agentModel } from "@/lib/agent";
import { num, shortDate } from "@/lib/format";

const COEFFICIENT_LABELS: Record<string, string> = {
  const: "Intercept",
  log_n: "log10 cohort size",
  log_years: "log2 (1 + years available)",
  log_modalities: "log2 (1 + measurement types)",
  access_mixed: "Access: mixed (vs controlled)",
  access_open: "Access: open (vs controlled)",
  access_unknown: "Access: unknown (vs controlled)",
};

export const metadata: Metadata = {
  title: "Methods",
  description:
    "How the corpus is assembled, how reuse is graded, how the reuse gap index is " +
    "computed, and where the whole thing is incomplete.",
};

const SOURCES = [
  {
    name: "NCI Genomic Data Commons",
    endpoint: "api.gdc.cancer.gov",
    unit: "project",
    what:
      "Cohort counts, assay inventories, open/controlled file splits, and - the part " +
      "that matters most - per-field clinical completeness derived from the API's own " +
      "missing-value facets.",
  },
  {
    name: "NCI Proteomic Data Commons",
    endpoint: "proteomic.datacommons.cancer.gov/graphql",
    unit: "study, grouped into cohorts",
    what:
      "PDC ships one study per analytical fraction, so proteome and phosphoproteome of " +
      "the same tumors arrive as separate studies. We group fractions back into one " +
      "record per biological cohort and drop inter-laboratory reference materials, " +
      "which are not patient cohorts. Clinical completeness is read case by case from " +
      "clinicalPerStudy and the treatment records, in the same harmonized vocabulary " +
      "the GDC uses, so a proteomic cohort is graded by the same six rules.",
  },
  {
    name: "NCI Imaging Data Commons",
    endpoint: "api.imaging.datacommons.cancer.gov/v3",
    unit: "collection",
    what:
      "Subject and series counts, DICOM modalities, licenses, and the supporting_data " +
      "field that records which other measurements accompany the images. Collection " +
      "descriptions are mined for cross-repository accessions, which recovers " +
      "imaging-genomics pairs documented only in prose. Clinical variables here are " +
      "per-collection tables named by the submitting trial, with no shared vocabulary " +
      "to grade against, so we record only whether such a table exists - and say so " +
      "where a collection's own supporting_data disagrees with what is served.",
  },
  {
    name: "Human Tumor Atlas Network",
    endpoint: "github.com/ncihtan/htan-portal",
    unit: "atlas",
    what:
      "Per-atlas Synapse component inventories, which give the assay mix, file counts " +
      "and the participant count behind each clinical table, plus the network's own " +
      "curated publication manifest with PMIDs and grant numbers. That manifest is " +
      "unusually strong evidence because HTAN maintains it.",
  },
  {
    name: "cBioPortal",
    endpoint: "cbioportal.org/api",
    unit: "study",
    what:
      "The discovery channel for investigator-generated cohorts. Every public study " +
      "records the PMID it came from; we resolve those through NIH RePORTER and keep the " +
      "ones an NCI award paid for. This surfaces NCI-supported datasets that no NCI " +
      "catalog enumerates. Its standard clinical attributes are counted per patient, " +
      "including an explicit bucket for patients a field has no row for, and the " +
      "survival and progression times are read value by value so the medians are exact.",
  },
  {
    name: "Europe PMC",
    endpoint: "ebi.ac.uk/europepmc/webservices/rest",
    unit: "article",
    what:
      "Section-scoped literature search, which is what makes graded reuse evidence " +
      "possible, plus citation counts and first-reference dating.",
  },
  {
    name: "NIH RePORTER",
    endpoint: "api.reporter.nih.gov/v2",
    unit: "award",
    what:
      "PMID-to-award linkage, award titles, investigators, institutes and fiscal years. " +
      "Used to separate NCI-funded data generation from NCI-funded reuse.",
  },
];

const TIERS = [
  {
    tier: "Data analyzed",
    fields: "METHODS, RESULTS, TABLE, FIG, SUPPL",
    meaning:
      "The accession appears where the analysis is described, so the reported findings plausibly depend on these data. This is the only tier we report as reuse.",
  },
  {
    tier: "Use declared",
    fields: "DATA_AVAILABILITY",
    meaning:
      "The authors named the accession in a data-availability statement. Strong, but it does not by itself show the data were analyzed.",
  },
  {
    tier: "Accession found",
    fields: "ACCESSION_ID",
    meaning:
      "Europe PMC's text-mined accession index located the accession in the article.",
  },
  {
    tier: "Mentioned only",
    fields: "INTRO, DISCUSS, REF, ACK_FUND",
    meaning:
      "Named in framing text or the bibliography. Counted, shown, and deliberately not called reuse.",
  },
];

export default function MethodsPage() {
  const stats = getStats();
  const model = getModel();
  const points = getScatterPoints();
  const repos = getRepositoryBreakdown();
  const calibration = getFieldCalibration();
  const coverage = Object.entries(stats.clinically_measured_by_repository ?? {}).sort(
    (a, b) => b[1].total - a[1].total,
  );
  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">How this was built</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Every number on this site is measured from a repository&rsquo;s own records and
          linked to its source. This page records how, and where the method is weak. Built
          for the NCI Office of Data Sharing Impact Prize, Track 1.
        </p>
        <p className="mt-2 text-[12px] t-faint">
          Corpus built {shortDate(stats.generated_at)} with pipeline v
          {stats.pipeline_version}: {num(stats.n_datasets)} records,{" "}
          {num(stats.n_grants_linked)} awards linked.
        </p>
      </div>

      {/* ----------------------------------------------------------------- index */}
      <section id="index" className="py-6 border-t">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
          <Card>
            <h2 className="font-medium">Methods</h2>
            <p className="mt-1 t-muted">
              <a href="#sources" className="underline">Sources</a> &middot;{" "}
              <a href="#clinical" className="underline">clinical completeness</a> &middot;{" "}
              <a href="#fit" className="underline">six verdicts</a> &middot;{" "}
              <a href="#reuse" className="underline">grading reuse</a> &middot;{" "}
              <a href="#dating" className="underline">dating</a> &middot;{" "}
              <a href="#reuse-gap" className="underline">reuse gap</a> &middot;{" "}
              <a href="#merging" className="underline">merging</a> &middot;{" "}
              <a href="#limitations" className="underline">where this is weak</a> &middot;{" "}
              <a href="#reproduce" className="underline">reproducing</a>
            </p>
          </Card>
          <Card>
            <h2 className="font-medium">
              <Link href="/agents" className="underline">For software</Link>
            </h2>
            <p className="mt-1 t-muted">
              JSON records, agent briefs, Croissant, JSON-LD, and the search and agent
              endpoints. No key, no rate limit.
            </p>
          </Card>
          <Card>
            <h2 className="font-medium">
              <Link href="/network" className="underline">Funding to findings</Link>
            </h2>
            <p className="mt-1 t-muted">
              Pick an NCI award and see the datasets it paid for and the articles that
              analysed them.
            </p>
          </Card>
          <Card>
            <h2 className="font-medium">
              <a href="#agent" className="underline">How the ask box works</a>
            </h2>
            <p className="mt-1 t-muted">
              Deterministic checks against measured fields first. A language model, when
              one is configured, only writes the wording.
            </p>
          </Card>
        </div>
        <p className="mt-3 text-[12px] t-faint">
          Curated text and structured metadata are CC BY 4.0; pipeline code is MIT. Upstream
          dataset metadata keeps its original terms.
        </p>
      </section>

      {/* ------------------------------------------------------------- principle */}
      <section id="principle" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          One rule: no claim without provenance
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            Every substantive statement on a dataset page carries an evidence record: how
            it was obtained (a structured API, a published file, document text, a
            computation here, or a named reviewer), when it was retrieved, and how
            confident we are. On the page these are the small chips beside each claim. In
            the JSON they are the <code>evidence</code> arrays.
          </p>
          <p>
            The reason is practical. &ldquo;Treatment response is recorded&rdquo; is only
            useful if you can find out whether that means a structured RECIST field on 90%
            of cases or a free-text note on twelve. Provenance lets a reader decide how
            much weight to put on any line.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- sources */}
      <section id="sources" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Sources and record units</h2>
        <p className="mt-1 mb-4 max-w-3xl text-[13px] t-muted">
          The unit is the individual study or project. A researcher downloads TCGA-BRCA,
          not TCGA.
        </p>
        <Card className="mb-4">
          <h3 className="text-[14px] font-medium">Records by repository</h3>
          <p className="mb-4 text-[12px] t-muted">
            Two repositories hold most of the corpus and almost none of the records whose
            reuse can be traced.
          </p>
          <RepositoryBars rows={repos} />
        </Card>
        <div className="space-y-3">
          {SOURCES.map((s) => (
            <Card key={s.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium">{s.name}</h3>
                <code className="font-mono text-[11px] t-faint">
                  {s.endpoint}
                </code>
              </div>
              <p className="mt-0.5 text-[12px] t-faint">
                Record unit: {s.unit}
              </p>
              <p className="mt-2 text-[13px]">{s.what}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- clinical */}
      <section id="clinical" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Measuring clinical completeness
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            &ldquo;Clinical data available&rdquo; says nothing about whether you can run a
            survival model. So for every dataset we compute, field by field, how many
            cases carry an informative value, using the source API&rsquo;s own
            missing-value facets.
          </p>
          <p>
            Two distinctions matter. A field filled entirely with &ldquo;not
            reported&rdquo; blocks an analysis as surely as an absent one, for a different
            reason, so the two are counted separately. Several cohorts here report vital
            status for every case and an informative value for none, which makes survival
            analysis impossible in a way no catalog entry reveals; the dataset pages name
            them and show the counts.
          </p>
          <p>
            One-to-many fields, such as treatment records, produce counts that exceed the
            cohort size, so per-case percentages cannot be read from them. Those fields
            are flagged <code>1:n</code> and only the share of cases with any record is
            reported.
          </p>
          <p>
            Each repository names its clinical fields its own way. Every measured field
            therefore carries both its native name and a harmonized name from one shared
            vocabulary, and the verdicts read the harmonized one, so a proteomic cohort
            and a genomic one are graded by the same rule. Where two fields claim the same
            concept, the one informative for more of the cohort is used.
          </p>
        </div>

        {coverage.length > 0 && (
          <Card className="mt-4">
            <h3 className="text-[14px] font-medium">How far the measurement reaches</h3>
            <p className="mt-1 mb-3 max-w-3xl text-[12px] t-muted">
              The six verdicts can only be graded where a repository serves clinical
              fields that map onto the shared vocabulary.{" "}
              {num(stats.n_clinically_measured ?? 0)} of {num(stats.n_datasets)} records
              qualify. The rest show <em>not measured</em>, which is a statement about this
              resource and not about the data.
            </p>
            <Bars
              max={Math.max(...coverage.map(([, v]) => v.total))}
              labelWidth={120}
              valueWidth={120}
              rows={coverage.map(([repo, v]) => ({
                key: repo,
                label: repo,
                value: v.measured,
                display: `${num(v.measured)} of ${num(v.total)}`,
                title: `${v.measured} of ${v.total} ${repo} records have at least one field the verdicts read`,
                tone: (v.measured > 0 ? "primary" : "muted") as "primary" | "muted",
              }))}
            />
          </Card>
        )}
      </section>

      {/* -------------------------------------------------------------------- fit */}
      <section id="fit" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          The six analysis verdicts
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            Every dataset page opens with the same six questions, answered from the field
            completeness above rather than from the catalog description. The thresholds
            are the ones in the executed workbook &ldquo;Can I answer this question with
            this dataset?&rdquo;, so any verdict can be re-derived against the live API.
          </p>
          <p>
            A verdict is <em>supported</em> when the decisive field is informative for
            enough of the cohort, <em>limited</em> when it is informative for some but
            too few, and <em>not supported</em> when it is absent or filled only with
            &ldquo;not reported&rdquo;. <em>Not measured</em> is a fourth, separate
            outcome: we have not probed that field for that repository yet. It is never
            folded into &ldquo;not supported&rdquo;, because an agent that read it that
            way would discard usable cohorts.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b text-left t-faint">
                <th className="py-1.5 pr-4 font-medium">Analysis</th>
                <th className="py-1.5 pr-4 font-medium">Fields read</th>
                <th className="py-1.5 pr-4 font-medium">Supported when</th>
                <th className="py-1.5 font-medium">Limited when</th>
              </tr>
            </thead>
            <tbody>
              {FIT_RULES.map((r) => (
                <tr key={r.key} className="border-b last:border-b-0 align-top">
                  <td className="py-2 pr-4 font-medium">{r.label}</td>
                  <td className="py-2 pr-4 font-mono text-[12px] t-muted">{r.fields}</td>
                  <td className="py-2 pr-4">{r.supported}</td>
                  <td className="py-2 t-muted">{r.limited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] t-muted">
          Repositories that ship one clinical table per topic rather than harmonized
          fields, as HTAN does, can at best tell us that a table exists for some share
          of cases. Those verdicts stay &ldquo;not measured&rdquo; until the table&rsquo;s
          coverage has been probed, and reach &ldquo;limited&rdquo; at most when it has.
        </p>
      </section>

      {/* ------------------------------------------------------------------ agent */}
      <section id="agent" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">How the ask box works</h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            A question goes through two stages, and only the second involves a language
            model. First, the wording is read for what the analysis needs: a survival
            endpoint, recorded treatment response, imaging, a pediatric cohort, open access,
            and so on. Each need is checked against the measured flags on every record. A
            flag that was never measured stays unknown; it is never read as &ldquo;no&rdquo;.
            The candidates that match the topic and meet the most needs form a shortlist,
            with the reasons and the blockers written from the measured fields.
          </p>
          <p>
            Alongside, a deterministic router recognises what a shortlist cannot answer: an
            award number goes to its funding network, a dataset named outright goes to its
            page, two names go to a comparison, a how or why question goes to the section of
            this page that answers it, and a request for files goes to the software page.
            The router chooses pages; it never states a fact about a dataset.
          </p>
          <p>
            When the server is configured with a language model through OpenRouter
            ({agentModel()} unless configured otherwise), the model ranks the shortlist and
            rewrites the reasons in the researcher&rsquo;s own terms, using only the measured
            facts it is given. Without one, the same shortlist is returned with rule-based
            wording. The answer page says which happened, and the API response carries it as{" "}
            <code>mode</code> and <code>model</code>. Every line of the answer links to the
            section of the dataset page that carries its evidence.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ reuse */}
      <section id="reuse" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Grading reuse: citation is not use
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            A review that cites the TCGA marker paper in its introduction has not reused
            TCGA. A paper that downloads TCGA-BRCA expression matrices and fits a model
            on them has. Treating the two as the same inflates every reuse statistic in
            the field, so we separate them and report only the second as reuse.
          </p>
          <p>
            Europe PMC indexes article sections independently, which makes the separation
            possible. Where an accession appears is strong evidence of what the authors
            did with it.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b text-left t-faint">
                <th className="py-1.5 pr-4 font-medium">Tier</th>
                <th className="py-1.5 pr-4 font-medium">Indexed sections</th>
                <th className="py-1.5 font-medium">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {TIERS.map((t) => (
                <tr key={t.tier} className="border-b last:border-b-0 align-top">
                  <td className="py-2 pr-4 font-medium whitespace-nowrap">{t.tier}</td>
                  <td className="py-2 pr-4">
                    <code className="font-mono text-[11px]">{t.fields}</code>
                  </td>
                  <td className="py-2">{t.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3">
          <Card>
            <h3 className="text-[14px] font-medium">Which fields we use, and one we rejected</h3>
            {calibration ? (
              <>
                <p className="mt-1 mb-3 text-[13px] t-muted">
                  Field choice is re-measured against the live index on every build, on the
                  corpus&rsquo;s most reused accession. Of the{" "}
                  {num(calibration.n_mentioning_anywhere)} articles that mention{" "}
                  <code>{calibration.token}</code> anywhere, the broad{" "}
                  <code>{calibration.rejected_field}</code> field matches most and so cannot
                  discriminate. The narrow <code>{calibration.used_field}</code> field can.
                  Measured {shortDate(calibration.retrieved_at)}.
                </p>
                <Bars
                  total={calibration.n_mentioning_anywhere}
                  max={calibration.n_mentioning_anywhere}
                  labelWidth={250}
                  valueWidth={96}
                  rows={[
                    {
                      key: "any",
                      label: `Mentions ${calibration.token} anywhere`,
                      value: calibration.n_mentioning_anywhere,
                      tone: "muted",
                    },
                    ...Object.entries(calibration.by_field).map(([field, value]) => ({
                      key: field,
                      label:
                        field === calibration.used_field
                          ? `${field} (narrow, used)`
                          : field === calibration.rejected_field
                            ? `${field} (broad, rejected)`
                            : `${field} (counted as reuse)`,
                      value,
                      tone: (field === calibration.used_field ? "primary" : "muted") as
                        | "primary"
                        | "muted",
                    })),
                  ]}
                />
                <p className="mt-3 text-[12px] t-faint">
                  The unindexed field name <code>{calibration.sentinel_field}</code> returned{" "}
                  {num(calibration.sentinel_hits)} hits, which is what shows these fields are
                  genuinely indexed rather than falling back to free text. A build where that
                  check fails does not publish.
                </p>
              </>
            ) : (
              <p className="mt-1 text-[13px] t-muted">
                The field comparison has not been measured for this build, so no numbers are
                quoted here. Run <code>cds calibrate</code> to produce them.
              </p>
            )}
          </Card>
          <Callout tone="neutral" title="Which accessions count">
            Only accession-like tokens: dbGaP <code>phs</code> identifiers, GDC project
            ids, PDC study ids, GEO series, Synapse ids, EGA, BioProject, PRIDE, MassIVE,
            Metabolomics Workbench and TCIA DOIs. Program names are excluded because
            Europe PMC matches their words independently. &ldquo;CPTAC STAD&rdquo;
            returns over a thousand articles, almost none of which used that study.
          </Callout>
          <Callout tone="neutral" title="Independence">
            An article is independent when no author surname overlaps the dataset&rsquo;s
            generating team or its grant investigators. A follow-up by the people who
            produced the data is a continuation, not someone else finding the resource
            useful.
          </Callout>
        </div>
      </section>

      {/* -------------------------------------------------------------- dating */}
      <section id="dating" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Dating when data became available
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            Any exposure-adjusted reuse measure needs to know how long the community has
            had the data. Repository file timestamps do not work: GDC&rsquo;s earliest
            file for TCGA-BRCA is stamped 2018, six years after publication, because it
            records a re-harmonization. Using it would make every TCGA project look six
            years younger than it is.
          </p>
          <p>
            So availability is dated from the literature: the first year an article
            references the dataset&rsquo;s accession in its methods, its data availability
            statement, or the curated accession index. It is a lower bound, it is directly
            observable, and it measures what matters.
          </p>
          <p>
            This needed hardening. Europe PMC&rsquo;s <code>RESULTS</code> field reported
            a 2005 first reference for TARGET-AML, four years before the program existed,
            because it matches the words of a hyphenated accession independently. That
            field is excluded from dating, and every candidate year is confirmed by
            retrieving an actual article.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- reuse gap */}
      <section id="reuse-gap" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">The reuse gap index</h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            Raw reuse counts cannot support an &ldquo;underexplored&rdquo; label, because
            they are not comparable. A 10,000-case open pan-cancer cohort available since
            2013 will out-cite a 200-case controlled cohort released in 2023 whatever
            their scientific value.
          </p>
          <p>
            So we model expected reuse from the structural properties that drive it and
            measure the residual. The response is the log of the count, and the fit is a
            Huber robust regression on log cohort size, years available, number of
            measurement types, and access tier. The index is the residual:
          </p>
          <pre
            className="overflow-x-auto rounded border p-3 font-mono text-[12px]"
            style={{ background: "var(--bg-sunken)" }}
          >
            <code>{`y      = log2( analyzing articles + 1 )
fitted = Huber( y ~ log10 cases + log2(1+years) + log2(1+modalities) + access )
RGI    = y - fitted`}</code>
          </pre>
          <p>
            Zero means a dataset is reused about as much as comparable datasets. Minus
            one is a halving.
          </p>
        </div>

        {points.length > 0 && (
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card>
              <h3 className="text-[14px] font-medium">Observed against fitted</h3>
              <p className="mb-3 text-[12px] t-muted">
                {num(points.length)} datasets with a citable accession and a dated first
                use. The diagonal is the model&rsquo;s prediction; the dashed line is the
                label threshold.
              </p>
              <ReuseScatter points={points} thresholdLog2={model?.rgi_threshold_log2 ?? -1.5} labelCount={5} />
            </Card>
            {model && (
              <Card>
                <h3 className="text-[14px] font-medium">Model fit</h3>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[12px]">
                  <dt className="t-muted">Model</dt>
                  <dd className="font-mono text-[11px]">{model.model_id}</dd>
                  <dt className="t-muted">Eligible datasets</dt>
                  <dd className="tnum text-right">{num(model.n_eligible)}</dd>
                  <dt className="t-muted">Excluded, no citable accession</dt>
                  <dd className="tnum text-right">{num(model.n_excluded_no_citable_accession)}</dd>
                  {model.ols_r_squared_for_reference != null && (
                    <>
                      <dt className="t-muted">R&sup2; (OLS, for reference)</dt>
                      <dd className="tnum text-right">{model.ols_r_squared_for_reference.toFixed(2)}</dd>
                    </>
                  )}
                  {model.residual_sd_log2 != null && (
                    <>
                      <dt className="t-muted">Residual SD (log2)</dt>
                      <dd className="tnum text-right">{model.residual_sd_log2.toFixed(2)}</dd>
                    </>
                  )}
                  {model.n_downweighted_by_robust_fit != null && (
                    <>
                      <dt className="t-muted">Down-weighted by the robust fit</dt>
                      <dd className="tnum text-right">{num(model.n_downweighted_by_robust_fit)}</dd>
                    </>
                  )}
                  <dt className="t-muted">Label threshold</dt>
                  <dd className="tnum text-right">
                    index &lt; {model.rgi_threshold_log2} and fewer than {model.absolute_reuse_ceiling} articles
                  </dd>
                </dl>
                <h4 className="mt-4 text-[12px] font-medium">Coefficients</h4>
                <table className="mt-1 w-full text-[12px]">
                  <thead>
                    <tr className="border-b text-left t-faint">
                      <th className="py-1 font-medium">Term</th>
                      <th className="py-1 text-right font-medium">Estimate</th>
                      <th className="py-1 text-right font-medium">p</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(model.coefficients).map(([k, v]) => (
                      <tr key={k} className="border-b last:border-b-0">
                        <td className="py-1 pr-2">{COEFFICIENT_LABELS[k] ?? k}</td>
                        <td className="tnum py-1 text-right">{v.toFixed(2)}</td>
                        <td className="tnum py-1 text-right t-muted">
                          {model.p_values[k] === undefined
                            ? "-"
                            : model.p_values[k] < 0.001
                              ? "<0.001"
                              : model.p_values[k].toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        <div className="prose-cds mt-5 text-[14px]">
          <p>
            <strong>This is the second specification.</strong> The first was a negative
            binomial on raw counts, the textbook choice for overdispersed count data, and
            it was wrong here. Reuse spans four orders of magnitude, so a few extreme
            points dominated the fit and predictions ran to hundreds of expected articles
            for small imaging collections. Modeling the log response bounds that. Huber
            weighting stops the TCGA projects, at once the oldest and the most reused
            datasets here, from setting the slope on years available and so smuggling back
            the program effect we refuse to adjust for.
          </p>
          {model?.largest_over_prediction ? (
            <p>
              It bounds the problem rather than removing it. The corpus&rsquo;s worst case
              is{" "}
              <Link href={`/datasets/${model.largest_over_prediction.id}`}>
                {model.largest_over_prediction.id}
              </Link>
              , a {num(model.largest_over_prediction.n_cases)}-case dataset predicted{" "}
              {num(Math.round(model.largest_over_prediction.expected))} articles against{" "}
              {num(model.largest_over_prediction.observed)} observed
              {model.largest_over_prediction.residual_in_sd
                ? `, ${Math.abs(model.largest_over_prediction.residual_in_sd).toFixed(1)} residual standard deviations below its prediction`
                : ""}
              . That is why the label also requires a small absolute count, and why the
              upper tail of predicted reuse is the weakest part of this model. The figure
              is recomputed on every build rather than quoted here.
            </p>
          ) : (
            <p>
              It bounds the problem rather than removing it. The upper tail of predicted
              reuse remains the weakest part of this model, which is why the label also
              requires a small absolute count.
            </p>
          )}
          <p>
            <strong>One covariate is deliberately absent.</strong> Program membership is
            not adjusted for. &ldquo;It is part of TCGA&rdquo; is the disparity we are
            measuring, not a nuisance to remove. Controlling for it would define the
            finding out of existence.
          </p>
          <p>
            Datasets with no citable accession are excluded from the fit and never labeled
            underexplored: for them the measurement is impossible, not negative. That is{" "}
            {num(stats.n_without_citable_accession)} of {num(stats.n_datasets)} records
            here, a finding in its own right and one of the clearest barriers to reuse we
            met.
          </p>
          <p>
            The coefficients, residual spread, down-weighted count and rejected
            specification ship with the data as{" "}
            <a href="/data/reuse_gap_model.json"><code>reuse_gap_model.json</code></a>, so
            the label can be recomputed or contested rather than taken on trust.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- funding */}
      <section id="funding" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Funding to data to findings</h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            <strong>Where the links come from.</strong> Awards are resolved through NIH
            RePORTER from each dataset&rsquo;s publications. Articles are the record&rsquo;s
            original publication plus the reuse exemplars it ships, at most ten per dataset.
            When a dataset&rsquo;s own paper lists an award, the award funded data generation;
            when a later study that analysed the data lists it, the award funded reuse; an
            award that funds a centre or harmonisation effort is infrastructure.
          </p>
          <p>
            <strong>What a shared node means.</strong> An award touching two datasets paid
            for both. An article touching two datasets combined them. Those cross-links are
            the reason to draw this as a{" "}
            <Link href="/network">network</Link> rather than a list.
          </p>
          <p>
            <strong>What is missing.</strong> Datasets with no citable accession have no
            traceable articles, and datasets whose publications RePORTER does not index have
            no awards. Absence is a gap in the record, not proof that nothing was funded or
            published. Only an award marked as generating the data is ever named as a
            dataset&rsquo;s funder on this site.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- merging */}
      <section id="merging" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Merging the same cohort across repositories
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            TCGA-BRCA is one cohort of patients. It appears as a GDC project for genomics,
            an IDC collection for radiology and pathology slides, and a cBioPortal study
            for harmonized matrices. Records describing the same cohort are folded into
            one page with every access route listed, and the cohort size shown is the one
            the primary repository reports.
          </p>
          <p>
            Merging is conservative. We merge only on identifiers that name a specific
            cohort, and any value shared by more than two records is treated as
            program-level and ignored. Every TCGA project shares dbGaP{" "}
            <code>phs000178</code>; merging on it would collapse every TCGA cancer type
            into one record. All source identifiers and all evidence survive the merge.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ limitations */}
      <section id="limitations" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Where this is weak
        </h2>
        <p className="mt-1 mb-4 max-w-3xl text-[13px] t-muted">
          A resource that grades other people&rsquo;s evidence has to be honest about
          its own.
        </p>
        <ul className="space-y-3">
          {[
            [
              "Section indexing needs full text",
              "Closed-access articles are under-represented at the tiers that require reading methods or data-availability statements, so reuse counts are biased downward for datasets whose users publish in subscription journals.",
            ],
            [
              "Some datasets are simply untraceable",
              `${num(stats.n_without_citable_accession)} records have no accession specific enough to search for. PDC study identifiers, for instance, are almost never quoted, so proteomic reuse is close to invisible to any citation-based method including this one.`,
            ],
            [
              "Inferred primary publications",
              "Where a repository publishes no marker-paper link we nominate the earliest heavily cited article that analyzed the data. That is a guess, it is labeled as one at low confidence, and it is queued for review rather than presented as fact. One failure mode is now caught automatically: an inference claimed by more than one dataset is wrong for all but one of them, so it is withdrawn from all of them and the record says so. It had nominated a pan-tissue methylation clock as the marker paper for eleven TCGA projects.",
            ],
            [
              "Author-overlap independence is a proxy",
              "Surname matching will miss consortium reuse by different members of the same network and will occasionally mark a common surname as overlapping when it is not.",
            ],
            [
              "Discovery of the long tail is not exhaustive",
              "Investigator cohorts are found through cBioPortal, which skews toward institutions that deposit there - Memorial Sloan Kettering most of all. The tail is broader than what we have indexed, and the corpus should not be read as a census.",
            ],
            [
              "Coverage percentages describe harmonized records, not all that exists",
              "A field absent from a repository's harmonized clinical records may still be available in a paper's supplement or from the generating team. We report what the repository serves, and say so.",
            ],
            [
              "Curated interpretation is the scarce resource",
              "Machine extraction scales; judgement about what a dataset is genuinely good for does not. Research questions and limitations are expert-written for the showcase set, and every other page states plainly that its interpretation has not been reviewed.",
            ],
          ].map(([title, body]) => (
            <li key={title}>
              <Card>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1.5 text-[13px] t-muted">
                  {body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------- reproducing */}
      <section id="reproduce" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Reproducing this</h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            The pipeline is a Python package with a command line interface. Every HTTP
            response is cached on disk by request, so a full rebuild is deterministic and
            can run offline. No source needs credentials.
          </p>
          <pre
            className="overflow-x-auto rounded border p-3 font-mono text-[12px]"
            style={{ background: "var(--bg-sunken)" }}
          >
            <code>{`cds ingest all        # fetch every source
cds merge             # fold records describing one cohort together
cds trace-index       # comparable reuse counts for every dataset
cds enrich            # availability dating, exemplars, funded-reuse links
cds gap               # fit the reuse gap model, label underexplored
cds export            # write site data and agent packages
cds verify            # check links and detect upstream drift`}</code>
          </pre>
          <p>
            Bulk data and the agent API are described on{" "}
            <Link href="/agents">the agents page</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
