# Supporting evidence for Track 1

**Project:** CD2S - Cancer Data to Science

**Prize:** NCI Office of Data Sharing Impact Prize, Track 1: Research Output Sharing and Reuse Ideas.

**Corpus build:** 2026-09-20.

**Pipeline version:** 0.1.0.

All figures below are generated from the current committed export or from the executed workbooks.
They are not estimates from a slide deck.

## Prototype at a glance

| Measure | Current result | Evidence |
| --- | ---: | --- |
| Dataset records | 602 | `pipeline/data/dist/stats.json` |
| Source repositories or resource channels | 5 | `pipeline/data/dist/stats.json` |
| Distinct measurement types | 29 | `pipeline/data/dist/stats.json` |
| Records with measured clinical completeness | 385 | `pipeline/data/dist/stats.json` |
| Records with a derivable survival endpoint | 206 | `pipeline/data/dist/stats.json` |
| Records with recorded treatment response | 62 | `pipeline/data/dist/stats.json` |
| Project-curated showcase pages | 20 | `pipeline/data/dist/stats.json` |
| Model-identified underexplored records | 24 | `pipeline/data/dist/stats.json` |
| Curated research questions | 69 | `pipeline/data/dist/questions.json` |
| Executed workbooks | 6 | `workbooks/executed/` and `stats.json` |
| Dataset pages with workbook attachments | 15 | `pipeline/data/dist/stats.json` |
| Dataset pages with generated or curated access routes | 602, including 2,373 policy-backed generated steps | `pipeline/data/dist/stats.json`, `pipeline/src/cds/normalize/access.py` |
| Verified reuse studies | 796 | `pipeline/data/dist/stats.json` |
| Distinct NCI awards linked through NIH RePORTER | 865 | `pipeline/data/dist/stats.json` |
| Patients or subjects represented | 349,817 across 601 records | `pipeline/data/dist/stats.json` |
| Records without a citable accession specific enough for reuse tracing | 364 | `pipeline/data/dist/stats.json` |

The current generated statistics report zero records labeled `expert_reviewed`.
The 20 showcase pages are `project_curated` records, and machine-only records explicitly state that their interpretations have not been human-reviewed.

## Demonstrated user-facing capabilities

| Capability | What the prototype does | Evidence |
| --- | --- | --- |
| Question-first discovery | Accepts plain-language analysis needs and returns a ranked shortlist using measured capability fields. | `web/app/api/v1/agent/route.ts`, `web/lib/agent.ts` |
| Constraints-first interpretation | Emits blocking limitations before capabilities in agent briefs and dataset pages. | `pipeline/src/cds/export/agent.py`, `web/app/agents/page.tsx` |
| Clinical fit measurement | Separates absent, populated-but-uninformative, and informative values in a shared vocabulary. | `pipeline/src/cds/clinical.py`, `pipeline/src/cds/sources/` |
| Analysis verdicts | Derives six common analysis verdicts and preserves `unknown` when a field has not been measured. | `pipeline/src/cds/clinical.py`, `web/lib/fit.ts` |
| Graded reuse evidence | Distinguishes analyzed data from declared availability, accession mentions, and general citations. | `pipeline/src/cds/reuse/` and `web/app/methods/page.tsx` |
| Funding linkage | Separates awards that generated a dataset from awards attached to downstream reuse. | `pipeline/src/cds/reuse/funding.py` |
| Agent interoperability | Publishes JSON, JSON-LD, Croissant, Markdown briefs, OpenAPI, and capability-filterable endpoints. | `pipeline/src/cds/export/`, `web/app/agents/page.tsx` |
| Repository-specific access routes | Derives human and agent steps from each record's identifiers and access tier, while preserving curated routes and attaching policy evidence to generated steps. | `pipeline/src/cds/normalize/access.py`, `pipeline/src/cds/export/agent.py`, dataset JSON |
| Reproducible starting points | Ships plain Python workbook sources, executed notebooks, execution receipts, and output hashes. | `workbooks/python/`, `workbooks/executed/` |

The six executed workbooks are deliberately split between human and agent use.
They give a human researcher runnable examples for dataset audit, survival analysis, treatment-response analysis, scarce-modality discovery, and cross-repository linkage.
They give an AI agent a reproducible selection pattern that filters on measured capability, reads constraints first, and emits a task brief.

Six is the count of user-facing analysis workbooks with executed notebooks and receipts.
It is not the count of all executable code in the project.
The pipeline also includes source adapters for GDC, PDC, IDC, HTAN, cBioPortal, and NIH RePORTER, cached raw records, and commands for rebuilding and exporting the corpus.

## Headline findings

### A large cohort can support no outcome analysis

FM-AD contains 18,004 cases.
Vital status is populated for 100% of cases and informative for 0%.
Race is recorded as "not reported" for all cases.
Treatment fields are empty.
The full record is `pipeline/data/dist/datasets/gdc-fm-ad.json`.

### Reuse is often unmeasurable, not absent

364 of 602 records have no accession specific enough to search the literature.
The prototype therefore reports no reuse count for those records and explains that absence of a count is not evidence of absence of reuse.

### Scarce modalities can be hidden in plain sight

The current corpus contains ubiquitylome measurements in five PDC studies and lipidomics in three.
CPTAC STAD, record `pdc-cptac-stad-study`, measures seven analytical fractions on 193 tumors and is openly downloadable.

### Cross-repository joins are not visible in individual catalogs

The executed cross-repository workbook identifies 39 cohorts present in both GDC and IDC.
For TCGA-BRCA, the patient-level join is 1,098 of 1,098 cases.
The source is `workbooks/python/05_cross_repository_linkage.py`, with the executed notebook and receipt in `workbooks/executed/`.

### The reuse-gap label is recomputable

The current model fits a Huber robust regression over 142 records with measurable reuse.
It uses cohort size, years available, modality breadth, and access tier.
The underexplored threshold is a reuse-gap index of -1.5 on the log2 scale plus an absolute reuse ceiling of 25.
The model labels 24 records in the current export.
Coefficients, diagnostics, the rejected specification, and the model's worst case are in `pipeline/data/dist/reuse_gap_model.json`.

## Method validation

Europe PMC field calibration is rerun and published with each build.
For the current calibration token, the broad `AVAILABILITY` field matched 3,953 of 5,146 articles that mentioned the token anywhere.
The narrower `DATA_AVAILABILITY` field matched 311.
A deliberately invalid indexed field returned zero hits, providing a sentinel against silent free-text fallback.

The reuse pipeline also samples full text for hyphenated accessions because Europe PMC can index the components as separate words.
This correction is applied before a reuse count is published.

The self-audit caught two plausible but wrong calculations.
One follow-up median used a single non-null field instead of all relevant GDC fields.
One availability date was pulled four years before a program existed because a hyphenated accession matched word-wise.
Both errors are documented in the methods and validation artifacts.

## Primary sources

- NCI Genomic Data Commons: <https://api.gdc.cancer.gov>
- NCI Proteomic Data Commons: <https://proteomic.datacommons.cancer.gov/graphql>
- NCI Imaging Data Commons: <https://api.imaging.datacommons.cancer.gov/v3>
- Human Tumor Atlas Network: <https://github.com/ncihtan/htan-portal>
- cBioPortal: <https://www.cbioportal.org/api>
- Europe PMC: <https://www.ebi.ac.uk/europepmc/webservices/rest>
- NIH RePORTER: <https://api.reporter.nih.gov/v2>

## Reproduction

The full pipeline can be rebuilt without credentials.

```text
cd pipeline
.venv/bin/python -m cds.cli ingest all
.venv/bin/python -m cds.cli merge
.venv/bin/python -m cds.cli trace-index
.venv/bin/python -m cds.cli enrich
.venv/bin/python -m cds.cli gap
.venv/bin/python -m cds.cli curate
.venv/bin/python -m cds.cli verify
.venv/bin/python -m cds.cli export
.venv/bin/python -m cds.cli workbooks
```

The repository's normal validation gate is:

```text
cd pipeline && .venv/bin/ruff check src tests scripts && .venv/bin/python -m pytest -q
cd ../web && npm run typecheck && npm run lint && npm test && npm run build
```

## Licenses and status

Pipeline code is MIT licensed.

Curated text, metadata, and structured exports are CC BY 4.0.

Upstream dataset metadata retains its original terms.

The prototype is not presented as a production NCI service.
Its purpose is to demonstrate a measurable gap, a feasible data model, a working interface, and a reproducible path to adoption.
