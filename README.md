# Cancer Data Showcase

A question-first guide to NCI-supported cancer research outputs: what each dataset is actually
good for, who has already reused it, what it cannot answer, and a runnable starting point - for
human researchers and for their agents.

Built for the **NCI Office of Data Sharing Impact Prize, Track 1** (Research Output Sharing and
Reuse Ideas). Submission materials are in [`submission/`](submission/).

## Why this layer exists

NIH and NCI already make valuable cancer data available through the GDC, PDC, IDC, HTAN,
cBioPortal, dbGaP, and other resources.
Those repositories answer an important first question: *what data are available?*
CDS adds the missing research question: *which resource, or combination of resources, can answer
my question, and how do I get from the catalog to a defensible analysis?*

The hard part is rarely finding one more download link.
It is knowing which cohort, modality, endpoint, and repository identifiers belong together, then
learning which files to request, how to clean their fields, and how to join records without
quietly changing the population being studied.
That interpretation work is scattered across papers, portal conventions, and expert memory.
CDS makes it explicit, measurable, and runnable so the existing NIH investment can produce more
research.

| Researcher need | What CDS adds on top of existing resources |
| --- | --- |
| Choose a dataset before requesting access | Measures field completeness and returns six analysis-fit verdicts, with `not measured` kept distinct from `not supported`. |
| Combine datasets responsibly | Maps shared identifiers, modality coverage, and patient-level overlap across repositories. |
| Know whether a resource has worked in practice | Separates verified accession reuse from citations to a marker paper and shows the evidence articles. |
| Find value that attention has missed | Compares observed and expected reuse and surfaces underexplored datasets with clear limitations. |
| Get from discovery to analysis | Provides executed notebooks that retrieve, clean, join, visualize, and analyze public records. |
| Let software make the same decision | Publishes constraints-first Markdown briefs, JSON, JSON-LD, Croissant, OpenAPI, and capability filters. |

The product is therefore a research layer, not a replacement catalog.
It preserves links back to the authoritative NIH and NCI sources while making their practical
scope legible to a researcher who does not already know the local conventions.

## The path from a question to a result

CDS is organized around a short, inspectable workflow:

1. **Ask.** Describe the analysis in ordinary language, such as survival with treatment response
   or matched imaging and molecular data.
2. **Screen.** Compare measured capability, access constraints, and limitations before downloading
   a large cohort or requesting controlled files.
3. **Combine.** Follow the repository identifiers and patient-level intersection evidence when a
   question needs more than one data source.
4. **Run.** Start from an executed notebook that shows retrieval, cleaning, joins, plots, and
   analysis decisions against the same public APIs.
5. **Learn.** Compare successful reuse with underexplored opportunities, then follow the evidence
   and provenance back to the source records.

The live interface exposes this path through the question box on the home page, the dataset
browser, the `/notebooks` library, and the `/underexplored` opportunity view.
The implementation lives in [`web/app/`](web/app/) and the generated records live in
[`pipeline/data/dist/`](pipeline/data/dist/).

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
- **Links** funding through NIH RePORTER in both directions: the award that paid to create a
  dataset, resolved from its marker paper, and the awards that got a published finding out of
  it afterwards, resolved from the articles that used it
- **Ships** an executable starting point and a machine-readable package for agents
- **Checks itself**: the reuse method's field calibration, the model's own worst case and
  the marker-paper inferences it withdraws are all re-measured and published on every build

Every substantive claim carries provenance: source, retrieval date, method, and confidence.

## What success and opportunity look like

The homepage intentionally shows both ends of the reuse distribution.
The most reused records demonstrate where a stable accession and a usable data path have already
enabled downstream studies.
The underexplored view shows records whose measured reuse falls below modelled expectations, but
only when reuse is measurable and the absolute evidence is large enough to interpret.

That distinction prevents a quiet dataset from being labelled a failure simply because it has no
citable accession or because Europe PMC could not estimate an accession correction.
It also gives program teams a practical way to ask which valuable resources need better identifiers,
documentation, cross-repository links, or worked examples.

## Current corpus

Every number below is generated. `pipeline/data/dist/stats.json` is the source; this table is
a snapshot of the build described there.

| | |
| --- | --- |
| Dataset records | 602 across 5 repositories, 29 measurement types |
| Clinical fields measured | 385 records, in one harmonized vocabulary |
| Survival endpoint derivable | 206 records, measured rather than asserted |
| Deeply curated pages | 20 (14 of them less-known resources) |
| Verified reuse studies | 796 (accession in a methods section, corrected for how Europe PMC indexes hyphenated accessions) |
| NCI awards linked | 865, resolved through NIH RePORTER |
| Datasets with an award credited with creating them | 283, from a repository-supplied or reviewer-supplied marker paper only |
| Datasets with awards credited with using them | 80; 31 have awards on both sides |
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
| `pipeline/src/cds/reuse/funding.py` | Which award paid to create a dataset, and award detail backfill |
| `web/` | Next.js site: dataset agent, dataset pages, charts, funding flow, comparison view, agent API |
| `workbooks/python/` | Workbook source as plain `# %%` scripts |
| `workbooks/executed/` | Executed notebooks plus execution receipts |
| `workbooks/manifest.yaml` | Human-readable questions, inputs, outputs, steps, and featured notebook flags |
| `submission/` | Track 1 narrative and supporting evidence |

## Notebook library

The six executed Python notebooks are the most concrete bridge from a catalog record to research
work.
Each notebook has source code, a committed executed `.ipynb`, an execution receipt, and a figure
preview used by the site.

- [`01_can_i_answer_this`](workbooks/python/01_can_i_answer_this.py) audits clinical completeness
  and returns six analysis-fit verdicts before access is requested.
- [`02_survival_tcga_brca`](workbooks/python/02_survival_tcga_brca.py) derives an overall-survival
  endpoint correctly and compares Kaplan-Meier and Cox results.
- [`03_treatment_response_cervical`](workbooks/python/03_treatment_response_cervical.py) checks
  that response fields are real before comparing ECOG and agents.
- [`04_scarce_modality_cptac`](workbooks/python/04_scarce_modality_cptac.py) finds rare analytical
  layers and bounds the complete-case population.
- [`05_cross_repository_linkage`](workbooks/python/05_cross_repository_linkage.py) joins patient
  identifiers across GDC and IDC and reports the overlap rather than assuming it.
- [`06_agent_dataset_selection`](workbooks/python/06_agent_dataset_selection.py) contrasts a naive
  size-ranked choice with a capability-ranked, constraints-first choice.

Browse the visual previews and download the executed notebooks at [`/notebooks`](web/app/notebooks/).
The manifest is the source of truth for each notebook's research question, inputs, outputs, and
demonstrated datasets.

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
The published count asks one section field, `METHODS`, so every dataset is counted the same
way rather than by whichever field happened to return the most; a reference-list mention is
counted separately and never called reuse.
Articles listed individually on a dataset page are graded on a wider set - an accession in
results, a table, a figure or the supplement also shows the data were analysed - so an example
can name a section the count never asked about.
Field choice is calibrated against the live index on every build rather than quoted from a
note: `cds calibrate` re-measures how many articles each candidate field matches for the
corpus's most reused accession, checks that an unindexed field name returns zero hits, and
publishes the result as `field_calibration.json`.
The broad `AVAILABILITY` field matches most articles that mention a dataset at all and so
cannot discriminate; the narrow `DATA_AVAILABILITY` field can.

**A hit count is not an exact match.** Europe PMC splits a hyphenated accession into separate
indexed words, so a raw count for `TARGET-RT` also counts prose about radiotherapy or room
temperature.
Every count on the site is therefore corrected individually: the articles a query returns are
sampled, their open-access full text is tested for the literal accession, and the count is
scaled by the fraction that pass, with the sample size shown beside the number it produced.
Where too few articles are open access to estimate the correction, the dataset shows no count
rather than an inflated one, and that is never drawn as a zero.
The Methods page sets out the measurement and its two known biases.

**A marker paper describes one cohort.** Where a repository publishes no marker-paper link,
the earliest heavily cited article that analysed the accession is nominated as a candidate at
low confidence.
That heuristic fails on methods papers, which reuse many datasets and are cited heavily: it
nominated a pan-tissue DNA methylation clock as the marker paper for eleven TCGA projects at
once.
An inference claimed by more than one dataset is therefore withdrawn from all of them, and the
record records why.
A nomination is a reading suggestion and nothing is counted from it: citation counts and
generation funding are computed only from a marker paper the repository publishes or a
reviewer has named in `pipeline/data/marker_papers.yaml`, and are left blank otherwise.

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
