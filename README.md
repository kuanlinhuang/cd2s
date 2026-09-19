# Cancer Data Showcase

A question-first guide to NCI-supported cancer research outputs: what each dataset is actually
good for, who has already reused it, what it cannot answer, and a runnable starting point - for
human researchers and for their agents.

Built for the **NCI Office of Data Sharing Impact Prize, Track 1** (Research Output Sharing and
Reuse Ideas). Submission materials are in [`submission/`](submission/).

## The problem, in one example

The Foundation Medicine Adult Cancer Dataset holds 18,004 patients, the largest cohort in this
corpus. Its vital status field is populated for 100% of cases and informative for 0%: every
value is `not reported`. Race is `not reported` for all 18,004 patients. Every treatment field
is empty.

A researcher who selects it for its sample size discovers this after requesting controlled
access to 54,012 files. Seven GDC projects share the pattern. No catalog says so, because
catalogs describe what a dataset *contains* rather than what it can *support*.

## What this does

For every dataset it ingests:

- **Measures** clinical field completeness from the repository's own records, separating
  *absent* from *populated but uninformative* from *informative*
- **Answers** "can it answer your question?" up front: six analysis verdicts (overall
  survival, progression, treatment response, therapeutic agents, stage adjustment, race)
  derived from that completeness with the thresholds of the executed audit workbook, and
  an explicit *not measured* status that is never folded into *not supported*
- **States** the research questions the data support and the limitations that rule analyses out
- **Traces** reuse with graded evidence, distinguishing articles that analyzed the data from
  articles that cited the paper
- **Links** funding through NIH RePORTER, separating NCI-funded generation from NCI-funded reuse
- **Ships** an executable starting point and a machine-readable package for agents

Every substantive claim carries provenance: source, retrieval date, method, and confidence.

## Current corpus

| | |
| --- | --- |
| Dataset records | 602 across 5 repositories, 29 measurement types |
| Deeply curated pages | 20 (14 of them less-known resources) |
| Verified reuse studies | 778 (accession in methods, results, a table or a figure) |
| NCI awards linked | 736, resolved through NIH RePORTER |
| Executed workbooks | 6, each with an execution receipt |
| Datasets with no citable accession | 364 - their reuse cannot be traced at all |

## Repository layout

| Path | Contents |
| --- | --- |
| `pipeline/` | Python ingestion, linkage, reuse tracing, metrics, export |
| `pipeline/src/cds/sources/` | One adapter per repository (GDC, PDC, IDC, HTAN, cBioPortal, RePORTER) |
| `pipeline/src/cds/reuse/` | Europe PMC section-scoped reuse tracing and availability dating |
| `pipeline/src/cds/metrics/` | The reuse gap model |
| `pipeline/data/curated/` | Human-reviewed overlays - the expert-judgment source of truth |
| `pipeline/data/dist/` | Generated artifacts consumed by the site and the agent API |
| `web/` | Next.js site: dataset agent, dataset pages, charts, award network, comparison view, agent API |
| `workbooks/python/` | Workbook source as plain `# %%` scripts |
| `workbooks/executed/` | Executed notebooks plus execution receipts |
| `submission/` | Track 1 narrative and supporting evidence |
| `docs/` | Design notes and methodology |

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
- `/llms.txt`, `/openapi.json`, and `GET /api/v1/search`

## Methodology

The [Methods page](web/app/methods/page.tsx) documents how the corpus is assembled, how reuse
is graded, how the reuse gap model is fitted, and - deliberately, at the end - where the
approach is weak. Two decisions worth knowing about up front:

**Citation is not reuse.** We grade by where an accession appears in an article. Methods,
results, a table or a figure means the reported findings depend on the data; a reference-list
mention does not. Field choice was calibrated against the live index: Europe PMC's broad
`AVAILABILITY` field matched 3,421 of 4,375 articles mentioning TCGA-BRCA anywhere and cannot
discriminate, while the narrow `DATA_AVAILABILITY` field matched 313 and can.

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

Working prototype. Curated interpretation covers 20 of 602 records; every other page states
plainly that its interpretation has not been reviewed. Clinical field completeness, and so
the six analysis verdicts, is measured for the 93 GDC projects; other repositories show
*not measured* until their clinical tables are probed the same way.
