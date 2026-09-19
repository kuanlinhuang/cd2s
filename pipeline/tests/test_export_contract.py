"""The contract between the pipeline's export and the site that reads it.

The site is TypeScript reading JSON the pipeline writes, so nothing type-checks across
the boundary. A field renamed on this side renders as `undefined` on that side, silently
and on every page. These tests read the site's own source and assert the export still
satisfies it.
"""

from __future__ import annotations

import re

import pytest

from cds.export.site import build_facets, search_corpus, search_row
from cds.model import AccessTier, IdScheme, Modality
from cds.paths import WEB_DIR

DATA_TS = WEB_DIR / "lib" / "data.ts"


def _browse_fields() -> list[str]:
    """The field list the browse page projects the index down to."""
    src = DATA_TS.read_text()
    block = re.search(r"const BROWSE_FIELDS = \[(.*?)\] as const", src, re.S)
    assert block, "BROWSE_FIELDS not found in web/lib/data.ts"
    return re.findall(r'"([^"]+)"', block.group(1))


@pytest.fixture
def row(record_factory):
    rec = record_factory(
        "gdc-tcga-brca",
        identifiers=[(IdScheme.GDC_PROJECT, "TCGA-BRCA")],
        modalities=[Modality.RNA_SEQ, Modality.METHYLATION],
        tier=AccessTier.OPEN,
    )
    return search_row(rec)


@pytest.mark.skipif(not DATA_TS.exists(), reason="site not present")
def test_every_field_the_browse_page_projects_exists_in_the_index(row):
    missing = [f for f in _browse_fields() if f not in row]
    assert not missing, f"browse page expects fields the export does not write: {missing}"


@pytest.mark.skipif(not DATA_TS.exists(), reason="site not present")
def test_browse_projection_stays_well_under_the_full_row(row):
    """The projection exists to keep the browse page small.

    If it ever grows to most of the row there is no point paying for the indirection, so
    this fails loudly rather than letting it drift back.
    """
    fields = _browse_fields()
    assert "search_text" not in fields, "the search corpus must not ride along on the row"
    assert "summary" not in fields, "summary is not rendered by the browse page"
    assert len(fields) < len(row), "the projection is no longer a projection"


def test_search_corpus_covers_every_row_with_text(record_factory):
    rows = [search_row(record_factory(f"x{i}")) for i in range(3)]
    corpus = search_corpus(rows)
    assert {c["id"] for c in corpus} == {r["id"] for r in rows if r["search_text"]}
    assert all(set(c) == {"id", "text"} for c in corpus), "the corpus carries only what it needs"


def test_facet_counts_match_the_rows_they_describe(record_factory):
    rows = [
        search_row(record_factory("a", modalities=[Modality.RNA_SEQ], tier=AccessTier.OPEN)),
        search_row(record_factory("b", modalities=[Modality.RNA_SEQ], tier=AccessTier.CONTROLLED)),
    ]
    facets = build_facets(rows)
    by_value = {f["value"]: f["count"] for f in facets["modality"]}
    assert by_value["rna_seq"] == 2
    assert {f["value"] for f in facets["access_tier"]} == {"open", "controlled"}


def test_index_row_reports_scarce_modalities_the_site_knows_about(record_factory):
    """The site's SCARCE_MODALITIES set is hand-written against the model's enum."""
    fmt = (WEB_DIR / "lib" / "format.ts").read_text()
    block = re.search(r"SCARCE_MODALITIES = new Set\(\[(.*?)\]\)", fmt, re.S)
    assert block
    known = {m.value for m in Modality}
    unknown = [m for m in re.findall(r'"([^"]+)"', block.group(1)) if m not in known]
    assert not unknown, f"site names modalities the model does not define: {unknown}"


def test_every_modality_label_in_the_site_is_a_real_modality():
    fmt = (WEB_DIR / "lib" / "format.ts").read_text()
    block = re.search(r"MODALITY_LABELS: Record<string, string> = \{(.*?)\n\};", fmt, re.S)
    assert block
    labelled = set(re.findall(r"^\s*(\w+):", block.group(1), re.M))
    known = {m.value for m in Modality}
    assert not (labelled - known), f"labels for modalities that do not exist: {labelled - known}"
    assert not (known - labelled), f"modalities with no display label: {known - labelled}"
