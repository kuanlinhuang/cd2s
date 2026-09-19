# Cancer Data Showcase

A question-first guide to NCI-supported cancer research outputs: what each dataset is actually
good for, who has already reused it, what it cannot answer, and a runnable starting point - for
human researchers and for their agents.

Built for the **NCI Office of Data Sharing Impact Prize, Track 1** (Research Output Sharing and
Reuse Ideas). Submission materials are in [`submission/`](submission/).

## The problem, in one example

The Foundation Medicine Adult Cancer Dataset holds 18,004 patients, the largest cohort in the
Genomic Data Commons.
Its vital status field is populated for 100% of cases and informative for 0%: every value is
`not reported`.
Race is `not reported` for all 18,004 patients.
Every treatment field is empty.

A researcher who selects it for its sample size discovers this after requesting controlled
access to 54,012 files.
Several GDC projects share the pattern.
No catalog says so, because catalogs describe what a dataset *contains* rather than what it
can *support*.

## What this does

For every dataset it ingests:

- **Measures** clinical field completeness from the repository's own records, separating
  *absent* from *populated but uninformative* from *informative* - in one shared vocabulary,
  so a proteomic cohort and a genomic one are graded by the same rule
- **Answers** "can it answer your question?" up front: six analysis verdicts (overall
  survival, progression, treatment response, therapeutic agents, stage adjustment, race)
  derived from that completeness with the thresholds of the executed audit workbook, and
  an explicit *not measured* status that is never folded into *not supported*
- **States** the research questions the data support and the limitations that rule analyses out
- **Traces** reuse with graded evidence, distinguishing articles that analyzed the data from
  articles that cited the paper
- **Links** funding through NIH RePORTER, separating NCI-funded generation from NCI-funded reuse
- **Ships** an executable starting point and a machine-readable package for agents
- **Checks itself**: the reuse method's field calibration, the model's own worst case and
  the marker-paper inferences it withdraws are all re-measured and published on every build

Every substantive claim carries provenance: source, retrieval date, method, and confidence.

## Current corpus

Every number below is generated. `pipeline/data/dist/stats.json` is the source; this table is
a snapshot of the build described there.

| | |
| --- | --- |
| Dataset records | 602 across 5 repositories, 29 measurement types |
| Clinical fields measured | 385 records, in one harmonized vocabulary |
| Survival endpoint derivable | 206 records, measured rather than asserted |
| Deeply curated pages | 20 (14 of them less-known resources) |
| Verified reuse studies | 778 (accession in methods, results, a table or a figure) |
| NCI awards linked | 736, resolved through NIH RePORTER |
| Executed workbooks | 6, attached to 15 dataset pages, each with an execution receipt |
| Datasets with no citable accession | 364 - their reuse cannot be traced at all |
| People across the corpus | 349,817 patients or subjects, in the 601 records that report a count |

Measurement coverage by repository, because how far it reaches is part of the result:

| Repository | Records | Clinical fields measured |
| --- | --- | --- |
| GDC | 93 | 93 |
| cBioPortal | 228 | 166 |
| PDC | 130 | 126 |
| HTAN | 14 | 0 - table-level coverage only, so verdicts reach *limited* at most |
| IDC | 137 | 0 - per-collection tables with no shared vocabulary to grade against |

## Repository layout

| Path | Contents |
| --- | --- |
| `pipeline/` | Python ingestion, linkage, reuse tracing, metrics, export |
| `pipeline/src/cds/clinical.py` | The shared clinical vocabulary every adapter reports into |
| `pipeline/src/cds/sources/` | One adapter per repository (GDC, PDC, IDC, HTAN, cBioPortal, RePORTER) |
| `pipeline/src/cds/reuse/` | Europe PMC section-scoped reuse tracing and availability dating |
| `pipeline/src/cds/metrics/` | The reuse gap model |
| `pipeline/data/curated/` | Human-reviewed overlays - the expert-judgment source of truth |
| `pipeline/data/dist/` | Generated artifacts consumed by the site and the agent API |
| `web/` | Next.js site: dataset agent, dataset pages, charts, award network, comparison view, agent API |
| `workbooks/python/` | Workbook source as plain `# %%` scripts |
| `workbooks/executed/` | Executed notebooks plus execution receipts |
| `submission/` | Track 1 narrative and supporting evidence |

## Running it

Nothing here needs credentials. Every source is a public, unauthenticated API.

```bash
# pipeline
cd pipeline
uv venv --python 3.12 && uv pip install -e ".[dev,notebooks]"

.venv/bin/python -m cds.cli ingest all      # fetch every source
.venv/bin/python -m cds.cli merge           # fold records describing one cohort together
.venv/bin/python -m cds.cli trace-index     # comparable reuse counts for every dataset
.venv/bin/python -m cds.cli enrich          # availability dating, exemplars, funded-reuse links
.venv/bin/python -m cds.cli gap             # fit the reuse gap model, label underexplored
.venv/bin/python -m cds.cli curate          # apply expert overlays and attach workbooks
.venv/bin/python -m cds.cli verify          # check links and record when
.venv/bin/python -m cds.cli export          # write site data and agent packages
.venv/bin/python -m cds.cli workbooks       # execute workbooks, write receipts

# site
cd ../web && npm install && npm run build && npm start
```

The local gate, which is what any status report here is based on:

```bash
cd pipeline && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/python -m pytest
cd ../web && npm run typecheck && npm run lint && npm test && npm run build
```

Every HTTP response is cached on disk keyed by request, so a rebuild is deterministic and can
run offline from the cache.

Two environment variables carry the public origin. `CDS_SITE_URL` is read by `cds export`
and baked into every agent brief, JSON-LD document and `llms.txt`; `NEXT_PUBLIC_SITE_URL`
is read by the site build for the sitemap, Open Graph metadata and the starter snippets.
Set both to the deployed host before exporting and building.

## Deploying

The site is a static Next.js build plus three small server routes, so it deploys to Vercel
with the project root set to `web/`. The generated data in `web/public/data` is committed,
so a clean checkout builds without running the pipeline.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Vercel project | absolute URLs in the sitemap, metadata and snippets |
| `OPENROUTER_API_KEY` | Vercel project | lets a language model rank and explain the dataset agent's shortlist; without it the agent runs on rules and says so |
| `OPENROUTER_MODEL` | Vercel project, optional | overrides the default `deepseek/deepseek-v4-flash` |
| `CDS_SITE_URL` | local shell, before `cds export` | the same origin, baked into the agent packages |
| `CDS_REPO_URL` | local shell, before `cds curate` | base URL of a **public** source repository; when set, each dataset page links its executed notebook. Left unset the pages name the workbook and its receipt instead of offering a link that would 404 |

The site's dataset agent (the "describe your analysis" box on the home page and
`/api/v1/agent`) works without any key: retrieval and the capability checks are deterministic.
Set `OPENROUTER_API_KEY` in the site's environment to have a language model rank and explain the
shortlist through OpenRouter. The default model is `deepseek/deepseek-v4-flash`; override it with
`OPENROUTER_MODEL`.

## For agents

See [`/agents`](web/app/agents/page.tsx) on the running site, or the generated files:

- `/api/v1/datasets/{id}` - the full record plus `analysis_fit`, the six verdicts
- `/data/index.json` - capability-filterable index (`/data/search.json` carries the same
  free text separately, so the browse page can load it after first paint)
- `/data/datasets/{id}.json` - full record with evidence on every claim
- `/data/agent/{id}.md` - plain-language brief, **constraints first**
- `/data/croissant/{id}.json` - MLCommons Croissant with per-field completeness
- `/data/jsonld/{id}.jsonld` - schema.org/Dataset + DCAT
- `/data/field_calibration.json` - the Europe PMC field comparison, re-measured per build
- `/data/reuse_gap_model.json` - the fitted model, its diagnostics and its worst case
- `/llms.txt`, `/openapi.json`, and `GET /api/v1/search`

## Methodology

The [Methods page](web/app/methods/page.tsx) documents how the corpus is assembled, how reuse
is graded, how the reuse gap model is fitted, and - deliberately, at the end - where the
approach is weak. Two decisions worth knowing about up front:

**Citation is not reuse.** We grade by where an accession appears in an article.
Methods, results, a table or a figure means the reported findings depend on the data; a
reference-list mention does not.
Field choice is calibrated against the live index on every build rather than quoted from a
note: `cds calibrate` re-measures how many articles each candidate field matches for the
corpus's most reused accession, checks that an unindexed field name returns zero hits, and
publishes the result as `field_calibration.json`.
The broad `AVAILABILITY` field matches most articles that mention a dataset at all and so
cannot discriminate; the narrow `DATA_AVAILABILITY` field can.

**A marker paper describes one cohort.** Where a repository publishes no marker-paper link,
the earliest heavily cited article that analysed the accession is nominated as a candidate at
low confidence.
That heuristic fails on methods papers, which reuse many datasets and are cited heavily: it
nominated a pan-tissue DNA methylation clock as the marker paper for eleven TCGA projects at
once.
An inference claimed by more than one dataset is therefore withdrawn from all of them, and the
record records why.

**An endpoint needs a time.** Overall survival is reported as possible only where a time to
event is derivable for at least 20 cases and at least 10 events are observed - the thresholds
of the executed audit workbook, applied by one shared function so the three measured
repositories cannot drift apart.
A cohort whose only endpoint is progression-free is not a cohort that supports overall
survival, and the page says which of the two it has.

**"Underexplored" is a measurement.** Raw reuse counts are not comparable across datasets of
different size, age and access tier, so we model expected reuse and report the residual.
Program membership is deliberately *not* a covariate: "it is part of TCGA" is the disparity
being measured, not a nuisance to adjust away. The model ships as
`pipeline/data/dist/reuse_gap_model.json` so the label can be recomputed or contested.

## Licensing

Code is MIT ([`LICENSE`](LICENSE)). Curated text, metadata and structured exports are CC BY 4.0
([`LICENSE-CONTENT`](LICENSE-CONTENT)). Upstream dataset metadata retains its original terms;
every record carries the source and retrieval date of each claim.

## Status

Working prototype.

Curated interpretation covers 20 of 602 records; every other page states plainly that its
interpretation has not been reviewed.

Clinical field completeness, and so the six analysis verdicts, is measured for 385 of 602
records: every GDC project, 126 of 130 PDC cohorts and 166 of 228 cBioPortal studies.
HTAN reports table-level coverage only, which reaches *limited* at most.
IDC serves per-collection clinical tables whose columns are named by the submitting trial,
with no shared vocabulary to grade against, so its records state whether such a table exists
and otherwise show *not measured*.
*Not measured* is never folded into *not supported*.

Workbook notebooks are linked from dataset pages only when `CDS_REPO_URL` points at a public
repository; while the source repository is private, the pages name the workbook path and its
execution receipt rather than offering a link that would 404.
