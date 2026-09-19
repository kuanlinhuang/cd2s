import type { Metadata } from "next";
import Link from "next/link";

import { Bars } from "@/components/charts/Bars";
import { RepositoryBars } from "@/components/charts/RepositoryBars";
import ReuseScatter from "@/components/charts/ReuseScatter";
import { Callout, Card } from "@/components/ui";
import { getModel, getRepositoryBreakdown, getScatterPoints, getStats } from "@/lib/data";
import { FIT_RULES } from "@/lib/fit";
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
      "which are not patient cohorts.",
  },
  {
    name: "NCI Imaging Data Commons",
    endpoint: "api.imaging.datacommons.cancer.gov/v3",
    unit: "collection",
    what:
      "Subject and series counts, DICOM modalities, licenses, and the supporting_data " +
      "field that records which other measurements accompany the images. Collection " +
      "descriptions are mined for cross-repository accessions, which recovers " +
      "imaging-genomics pairs documented only in prose.",
  },
  {
    name: "Human Tumor Atlas Network",
    endpoint: "github.com/ncihtan/htan-portal",
    unit: "atlas",
    what:
      "Per-atlas Synapse component inventories, which give the assay mix and file " +
      "counts, plus the network's own curated publication manifest with PMIDs and grant " +
      "numbers. That manifest is unusually strong evidence because HTAN maintains it.",
  },
  {
    name: "cBioPortal",
    endpoint: "cbioportal.org/api",
    unit: "study",
    what:
      "The discovery channel for investigator-generated cohorts. Every public study " +
      "records the PMID it came from; we resolve those through NIH RePORTER and keep the " +
      "ones an NCI award paid for. This surfaces NCI-supported datasets that no NCI " +
      "catalog enumerates.",
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
  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Methods</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          This page makes the rest of the site checkable. It records where each kind of
          claim comes from, how reuse is graded, how the reuse gap index is fitted, and,
          at the end, where the approach is weak.
        </p>
        <p className="mt-2 text-[12px] t-faint">
          Corpus built {shortDate(stats.generated_at)} with pipeline v
          {stats.pipeline_version}: {num(stats.n_datasets)} records,{" "}
          {num(stats.n_grants_linked)} awards linked.
        </p>
      </div>

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
            reason, so the two are counted separately. One 18,004-case dataset in this
            corpus reports vital status for every case and an informative value for none,
            which makes survival analysis impossible in a way no catalog entry reveals.
          </p>
          <p>
            One-to-many fields, such as treatment records, produce counts that exceed the
            cohort size, so per-case percentages cannot be read from them. Those fields
            are flagged <code>1:n</code> and only the share of cases with any record is
            reported.
          </p>
        </div>
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
            <p className="mt-1 mb-3 text-[13px] t-muted">
              Field choice was calibrated on the live index. Of the 4,375 articles that
              mention TCGA-BRCA anywhere, the broad <code>AVAILABILITY</code> field
              matches most of them and so cannot discriminate. The narrow{" "}
              <code>DATA_AVAILABILITY</code> field can. An invalid field name returns zero
              hits, which confirms each field is truly indexed rather than falling back to
              free text.
            </p>
            <Bars
              total={4375}
              max={4375}
              labelWidth={230}
              valueWidth={90}
              rows={[
                { key: "any", label: "Mentions TCGA-BRCA anywhere", value: 4375, tone: "muted" },
                { key: "avail", label: "AVAILABILITY (broad, rejected)", value: 3421, tone: "muted" },
                { key: "data", label: "DATA_AVAILABILITY (narrow, used)", value: 313, tone: "primary" },
              ]}
            />
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
            points dominated the fit and predictions ran to over three hundred expected
            articles for a 211-subject imaging collection. Modeling the log response
            bounds that. Huber weighting stops the 33 TCGA projects, at once the oldest
            and the most reused datasets here, from setting the slope on years available
            and so smuggling back the program effect we refuse to adjust for.
          </p>
          <p>
            It bounds the problem rather than removing it. That same collection is still
            predicted around 197 articles against 3 observed, the largest residual in the
            corpus at about four standard deviations. That is why the label also requires
            a small absolute count, and why the upper tail of predicted reuse is the
            weakest part of this model.
          </p>
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

      {/* --------------------------------------------------------------- merging */}
      <section id="merging" className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Merging the same cohort across repositories
        </h2>
        <div className="prose-cds mt-3 text-[14px]">
          <p>
            TCGA-BRCA is one cohort of 1,098 patients. It appears as a GDC project for
            genomics, an IDC collection for radiology and pathology slides, and a
            cBioPortal study for harmonized matrices. Records describing the same cohort
            are folded into one page with every access route listed.
          </p>
          <p>
            Merging is conservative. We merge only on identifiers that name a specific
            cohort, and any value shared by more than two records is treated as
            program-level and ignored. Every TCGA project shares dbGaP{" "}
            <code>phs000178</code>; merging on it would collapse 33 cancer types into one
            record. All source identifiers and all evidence survive the merge.
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
              "Where a repository publishes no marker-paper link we nominate the earliest heavily cited article that analyzed the data. That is a guess, it is labeled as one at low confidence, and it is queued for review rather than presented as fact.",
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
