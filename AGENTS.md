# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- The product is **CD2S**, short for Cancer Data to Science. The Python package stays `cds`; only the user-facing name changed, so do not rename the module.
- Run the pipeline gate with `cd pipeline && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/python -m pytest`.
- Run the web gate from `web/` with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- Both gates must stay exactly what `.github/workflows/ci.yml` runs, step for step.
  This entry used to omit `ruff format --check` and scope the lint to `src tests scripts`, so two changes landed on `main` that were green locally and red in CI.
  Add a step here in the same commit that adds it there.
- Controlled subject assignment and its pinned vocabulary contract live in `pipeline/src/cds/subjects.py` and `pipeline/src/cds/vocab/oncotree_tissues.json`.
- Europe PMC splits hyphenated accessions into separate indexed words, so a raw hit count for `TARGET-RT` also counts "target RT" in prose. Every published count is corrected by sampling full text; see `pipeline/src/cds/reuse/precision.py` before trusting or changing any reuse number.
- Reuse is counted only from accessions authors actually write in papers, which is what `TOKEN_SCHEMES` in `pipeline/src/cds/reuse/trace.py` lists. Adding a scheme there without checking is how fourteen HTAN atlases came to publish a reuse shortfall measured on Synapse folder ids. A dataset with no countable accession must report that its reuse is unmeasurable, never that it is zero.
- Which paper is a dataset's own is decided in `pipeline/src/cds/reuse/markers.py`, with reviewer-verified PMIDs in `pipeline/data/marker_papers.yaml`. Citation counts and generation funding may only be computed from an authoritative marker paper, never from the pipeline's own nomination.
- Regenerate both `pipeline/data/dist/` and `web/public/data/` with `CDS_SITE_URL=https://cd2s.vercel.app .venv/bin/python -m cds.cli export`, after `cds curate`; never hand-edit generated corpus artifacts. Without that variable the exports bake in a placeholder origin.
- A workbook's `findings` in `workbooks/manifest.yaml` are the numbers one recorded run printed, not standing facts. Re-run `cds workbooks` and re-check every finding against the new output before publishing a changed notebook.
- Every dataset page's "Start here" code comes from `web/lib/starter.ts` and `pipeline/src/cds/normalize/access.py`. A rotted snippet renders perfectly, so before changing either, run the snippets: fetch a page per repository, pull the `<code>` blocks out, and execute them. The shapes that broke before are pinned by `web/tests/starter.test.ts` and `pipeline/tests/test_access_routes.py`.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
