# Supporting Evidence - CD2S (Cancer Data to Study)

**Track 1, NCI ODS Impact Prize.** All figures below were produced by the working prototype
and are reproducible from the public repository. Corpus built 2026-09-18, pipeline v0.1.0.

## Prototype and code

| Artifact | Location | License |
| --- | --- | --- |
| Pipeline, site, workbooks, curated overlays | `github.com/kuanlinhuang/cd2s` *(to be published)* | MIT (code) |
| Curated dataset guides and structured exports | `/data/` in the repository and on the site | CC BY 4.0 |
| Executed notebooks with receipts | `workbooks/executed/*.ipynb` + `*.receipt.json` | MIT |
| Reuse model coefficients and diagnostics | `pipeline/data/dist/reuse_gap_model.json` | CC BY 4.0 |
| Link verification report | `pipeline/data/dist/verification_report.json` | CC BY 4.0 |

Reproduce end to end: `cds ingest all && cds merge && cds trace-index && cds enrich && cds gap
&& cds curate && cds verify && cds export`. No credentials required at any step.

## What the prototype contains

602 dataset records across 5 repositories and 29 distinct measurement types · clinical field
completeness measured for 385 of them in one shared vocabulary · 206 with a survival endpoint
that can actually be derived · 20 deeply curated showcase pages, 14 of them less-known
resources · 69 reviewed research questions · 778 verified reuse studies (accession located in
methods, results, a table or a figure) · 736 NCI awards resolved through NIH RePORTER ·
6 workbooks executed end to end against live public APIs · 124 of 124 links on curated pages
resolving.

## Headline findings (all measured, all reproducible)

- **18,004-case cohort, zero usable outcomes.** Foundation Medicine Adult Cancer Dataset
  (`FM-AD`): vital status populated 100%, informative 0%; race "not reported" for all patients;
  all treatment fields empty. Thirty-two records share the exact pattern, twenty of them GDC
  projects and seventeen of those NCI-MATCH arms.
- **364 of 602 datasets have no citable accession**, so their reuse cannot be traced at all.
  One MSK cohort publication has 646 citations and no data identifier.
- **Ubiquitylome data exist in 5 studies across the entire Proteomic Data Commons**; lipidomics
  in 3; metabolomics in 7. CPTAC STAD (`PDC000622`) measures 193 tumors seven ways, openly.
- **39 cohorts exist in both the Genomic and Imaging Data Commons.** For TCGA-BRCA the
  patient-level join is 1,098 of 1,098 - complete multimodal coverage, openly available.
- **Chernobyl thyroid cohort** (`REBC-THYR`, 449 cases): reported median follow-up 115 months,
  derivable for 12 cases; vital status informative for none.
- **21 datasets fall materially below modeled expected reuse** (Huber robust regression of
  log2 analyzing articles over 142 datasets; years available the strongest predictor,
  p = 2.0 × 10⁻⁴¹; residual SD 1.49 log2 units; program membership deliberately excluded as a
  covariate. A robust fit yields no R²; the 0.83 published alongside is an OLS reference. The
  model ships its own worst case: `TARGET-NBL` is predicted 586 analyzing articles against 55
  observed, which is why the label also requires a small absolute count.)

## Method validation

- Europe PMC field calibration, re-run on every build and published as
  `/data/field_calibration.json`: in the current build the broad `AVAILABILITY` field matched
  3,953 of the 5,146 articles mentioning TCGA-LUAD anywhere and cannot discriminate; narrow
  `DATA_AVAILABILITY` matched 311 and can. A deliberately invalid field name returns 0,
  confirming the fields are truly indexed rather than falling back to free text; a build where
  that check fails does not publish.
- Self-audit caught two errors that produced plausible but wrong numbers: a follow-up median
  computed from 1 of 1,098 cases (GDC stores follow-up in three different fields), and an
  availability date of 2005 for a program founded in 2009 (one Europe PMC field matches
  hyphenated accessions word-wise). Both are documented in the public methods.

## Primary sources used

NCI Genomic Data Commons (`api.gdc.cancer.gov`) · NCI Proteomic Data Commons
(`proteomic.datacommons.cancer.gov/graphql`) · NCI Imaging Data Commons
(`api.imaging.datacommons.cancer.gov/v3`) · Human Tumor Atlas Network
(`github.com/ncihtan/htan-portal`) · cBioPortal (`cbioportal.org/api`) · Europe PMC
(`ebi.ac.uk/europepmc/webservices/rest`) · NIH RePORTER (`api.reporter.nih.gov/v2`).

## Verified marker publications cited in curated guides

Cancer Genome Atlas Network, *Nature* 2012, PMID 23000897 (TCGA-BRCA) · Gagliardi A et al.,
*Nat Genet* 2020, PMID 32747824 (Ugandan cervical) · Morton LM et al., *Science* 2021,
PMID 33888599 (Chernobyl thyroid) · Abida W et al., *PNAS* 2019, PMID 31061129 (mCRPC) ·
Tiriac H et al., *Cancer Discov* 2018, PMID 29853643 (pancreatic organoids) · Bakr S et al.,
*Sci Data* 2018, PMID 30325352 (NSCLC radiogenomics) · Bolouri H et al., *Nat Med* 2018,
PMID 29227476 (pediatric AML) · Bartlett NL et al., *JCO* 2019, PMID 30939090 (CALGB 50303).
Author strings verified against Europe PMC on 2026-09-18.

## Machine-readable outputs for agents

`/data/index.json` (capability-filterable index) · `/data/datasets/{id}.json` (full record with
evidence on every claim) · `/data/agent/{id}.md` (plain-language brief, constraints first) ·
`/data/croissant/{id}.json` (MLCommons Croissant with per-field completeness and blocking
limitations) · `/data/jsonld/{id}.jsonld` (schema.org/Dataset + DCAT) · `/llms.txt` ·
`/openapi.json` · `/data/field_calibration.json` (the reuse-method calibration) ·
`/data/reuse_gap_model.json` (the fitted model, its diagnostics and its worst case) ·
`GET /api/v1/search` with capability filters.

## Status and limitations

This is a working prototype, not a production service. It is publicly deployed at
<https://cd2s.vercel.app>; the source repository is not yet public, which is
why dataset pages name their executed workbook and its receipt rather than linking to it.

Clinical field completeness, and so the six analysis verdicts, is measured for 385 of 602
records. The Human Tumor Atlas Network publishes one clinical table per topic rather than
harmonized fields, so its verdicts reach *limited* at most; the Imaging Data Commons serves
per-collection tables whose columns are named by the submitting trial, with no shared
vocabulary to grade against, so its records state whether such a table exists at all and
otherwise read *not measured*. *Not measured* is never folded into *not supported*.

Reuse counts are biased downward for datasets whose users publish in closed-access journals;
investigator-cohort discovery skews toward institutions that deposit in cBioPortal; curated
interpretation covers 20 of 602 records and every other page states that its interpretation is
unreviewed. These constraints are published on the site's Methods page rather than omitted.
