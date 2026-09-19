"""Curated prose, checked against the corpus it describes.

Expert overlays are where a person's judgement enters the site, and they are the one
place a factual claim can sit unchecked for as long as nobody rereads it. Superlatives
are the dangerous kind: "the largest cohort in this corpus" was true when it was written
and stopped being true when the corpus grew, and nothing failed.

These tests are deliberately narrow. They verify the claims that are mechanically
checkable against the generated index, and they only run once an index exists.
"""

from __future__ import annotations

import json
import re

import pytest
import yaml

from cds.paths import CURATED_DIR, DIST_DIR

INDEX = DIST_DIR / "index.json"

#: Phrases asserting that a record is the biggest thing in the whole corpus.
CORPUS_SUPERLATIVE = re.compile(
    r"largest (?:single )?cohort (?:in this corpus|indexed here)"
    r"|largest (?:dataset|cohort) (?:in|of) (?:this|the) corpus"
    r"|the biggest (?:cohort|dataset) here",
    re.I,
)


def _overlay_text(data: object) -> str:
    """Every string in an overlay, flattened, so a claim cannot hide in a nested field."""
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        return " ".join(_overlay_text(v) for v in data.values())
    if isinstance(data, list):
        return " ".join(_overlay_text(v) for v in data)
    return ""


def _overlays() -> list[tuple[str, str]]:
    out = []
    for path in sorted(CURATED_DIR.glob("*.y*ml")):
        data = yaml.safe_load(path.read_text()) or {}
        out.append((str(data.get("id") or path.stem), _overlay_text(data)))
    return out


@pytest.mark.skipif(not INDEX.exists(), reason="no exported index; run `cds export` first")
def test_no_overlay_claims_a_corpus_superlative_it_does_not_hold():
    rows = json.loads(INDEX.read_text())
    sizes = {r["id"]: (r.get("n_cases") or r.get("n_samples") or 0) for r in rows}
    biggest = max(sizes, key=lambda k: sizes[k])
    offenders = [
        (rid, sizes.get(rid, 0))
        for rid, text in _overlays()
        if CORPUS_SUPERLATIVE.search(text) and rid != biggest
    ]
    assert not offenders, (
        f"overlays claim to be the largest in the corpus but are not; the largest is "
        f"{biggest} at {sizes[biggest]:,}: {offenders}"
    )


@pytest.mark.skipif(not INDEX.exists(), reason="no exported index; run `cds export` first")
def test_every_overlay_matches_a_record_in_the_corpus():
    ids = {r["id"] for r in json.loads(INDEX.read_text())}
    missing = [rid for rid, _ in _overlays() if rid not in ids]
    assert not missing, f"curated overlays with no record to attach to: {missing}"
