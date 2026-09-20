# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Run the pipeline gate with `cd pipeline && .venv/bin/ruff check src tests scripts && .venv/bin/python -m pytest -q`.
- Run the web gate from `web/` with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- Controlled subject assignment and its pinned vocabulary contract live in `pipeline/src/cds/subjects.py` and `pipeline/src/cds/vocab/oncotree_tissues.json`.
- Europe PMC splits hyphenated accessions into separate indexed words, so a raw hit count for `TARGET-RT` also counts "target RT" in prose. Every published count is corrected by sampling full text; see `pipeline/src/cds/reuse/precision.py` before trusting or changing any reuse number.
- Which paper is a dataset's own is decided in `pipeline/src/cds/reuse/markers.py`, with reviewer-verified PMIDs in `pipeline/data/marker_papers.yaml`. Citation counts and generation funding may only be computed from an authoritative marker paper, never from the pipeline's own nomination.
- Regenerate both `pipeline/data/dist/` and `web/public/data/` through `cds export`; never hand-edit generated corpus artifacts.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
