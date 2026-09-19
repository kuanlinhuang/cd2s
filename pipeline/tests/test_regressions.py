"""Regressions for defects that actually shipped.

Every test here corresponds to a wrong number or a wrong claim that reached the site
before somebody noticed. They are written as the smallest case that reproduces the
original mistake, so a future change that reintroduces it fails here rather than on a
dataset page.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from cds.export.site import population_flags
from cds.metrics import reuse_gap
from cds.model import (
    DatasetRecord,
    IdScheme,
    Modality,
    ReuseMetrics,
    UnderexploredLabel,
)
from cds.normalize.curate import _workbook_url
from cds.normalize.merge import merge_records
from cds.reuse import dating, trace
from cds.workbooks import parse_percent_script

# ---------------------------------------------------------------------------------------
# A cohort recruited entirely in the United States is not international
# ---------------------------------------------------------------------------------------


def test_us_only_cohort_is_not_flagged_as_non_us(record_factory):
    """TCGA-KIRC, TCGA-KICH and RC-PTCL were all labelled 'non-US enrolment recorded'.

    The flag fired on the presence of any country data at all, so recording that every
    patient was American was read as evidence of international enrolment.
    """
    rec = record_factory("gdc-tcga-kirc", countries={"united states": 94})
    assert "non-US enrolment recorded" not in population_flags(rec)


@pytest.mark.parametrize("spelling", ["united states", "USA", "U.S.", "United States of America"])
def test_us_spellings_all_recognised(record_factory, spelling):
    rec = record_factory("x", countries={spelling: 10})
    assert "non-US enrolment recorded" not in population_flags(rec)


def test_genuinely_international_cohort_is_flagged(record_factory):
    rec = record_factory("x", countries={"united states": 30, "vietnam": 70})
    assert "non-US enrolment recorded" in population_flags(rec)


def test_race_not_recorded_is_distinguished_from_race_absent(record_factory):
    """FM-AD's race field is 100% populated and 0% informative."""
    populated_but_useless = record_factory("fm-ad", race={"not reported": 18004})
    assert "race not recorded" in population_flags(populated_but_useless)
    absent = record_factory("other", race={})
    assert "race not recorded" not in population_flags(absent)


# ---------------------------------------------------------------------------------------
# Assignments are validated
# ---------------------------------------------------------------------------------------


def test_bad_assignment_is_rejected_not_serialized():
    """Curation overlays patch fields by assignment straight from hand-written YAML.

    Without validate_assignment a typo reached the published JSON and surfaced only as a
    serializer warning nobody reads.
    """
    rec = DatasetRecord(id="x", title="X")
    with pytest.raises(ValidationError):
        rec.cohort.n_cases = "not a number"
    with pytest.raises(ValidationError):
        rec.longitudinal.has_treatment_response = "yes please"


def test_valid_assignment_still_coerces():
    rec = DatasetRecord(id="x", title="X")
    rec.cohort.n_cases = "1098"
    assert rec.cohort.n_cases == 1098


# ---------------------------------------------------------------------------------------
# Merging must not collapse a whole program into one record
# ---------------------------------------------------------------------------------------


def test_program_level_accession_does_not_collapse_distinct_cohorts(record_factory):
    """Every TCGA project shares dbGaP phs000178.

    Merging on it would have folded thirty-three cancer types into a single page.
    """
    recs = [
        record_factory(
            f"gdc-tcga-{code}",
            identifiers=[
                (IdScheme.GDC_PROJECT, f"TCGA-{code.upper()}"),
                (IdScheme.DBGAP, "phs000178"),
            ],
        )
        for code in ("brca", "gbm", "luad", "kirc")
    ]
    merged, stats = merge_records(recs)
    assert len(merged) == 4, "distinct TCGA projects were merged on the shared phs id"
    assert stats["n_records_absorbed"] == 0


def test_same_cohort_in_two_repositories_is_one_record(record_factory):
    """TCGA-BRCA is one cohort whether it is reached through GDC or IDC.

    IDC spells collection ids in snake_case where GDC uses hyphenated caps.
    """
    gdc = record_factory(
        "gdc-tcga-brca",
        identifiers=[(IdScheme.GDC_PROJECT, "TCGA-BRCA")],
        modalities=[Modality.RNA_SEQ],
        repo="GDC",
    )
    idc = record_factory(
        "idc-tcga-brca",
        identifiers=[(IdScheme.IDC_COLLECTION, "tcga_brca")],
        modalities=[Modality.RADIOLOGY],
        repo="IDC",
    )
    merged, _ = merge_records([gdc, idc])
    assert len(merged) == 1
    mods = {a.modality for a in merged[0].assays}
    assert mods == {Modality.RNA_SEQ, Modality.RADIOLOGY}
    assert [r.short_name for r in merged[0].additional_repositories] == ["IDC"]


def test_colliding_slugs_are_disambiguated(record_factory):
    """Truncated slugs collided (Phosphoproteome and Phosphotyrosine both became 'phosp')."""
    a = record_factory("pdc-cptac-phosp", identifiers=[(IdScheme.PDC_STUDY, "S038-2")])
    b = record_factory("pdc-cptac-phosp", identifiers=[(IdScheme.PDC_STUDY, "S038-3")])
    merged, stats = merge_records([a, b])
    assert len({r.id for r in merged}) == 2
    assert stats["n_ids_disambiguated"] == 1


# ---------------------------------------------------------------------------------------
# Dating: a dataset cannot be referenced before it existed
# ---------------------------------------------------------------------------------------


def test_results_section_is_excluded_from_dating():
    """TARGET-AML was dated 2005, four years before the program was founded.

    Europe PMC's RESULTS field matches the halves of a hyphenated accession
    independently, so 'TARGET-AML' hit any paper containing both words.
    """
    assert "RESULTS" not in dating.DATING_FIELDS
    assert dating.DATING_FIELDS == ("METHODS", "DATA_AVAILABILITY", "ACCESSION_ID")


def test_dating_buckets_are_contiguous_and_ordered():
    los = [lo for lo, _ in dating.BUCKETS]
    assert los == sorted(los)
    for (_, hi), (lo, _) in zip(dating.BUCKETS[:-1], dating.BUCKETS[1:], strict=True):
        assert lo == hi + 1, "a gap between buckets would skip a year"


# ---------------------------------------------------------------------------------------
# Reuse tokens and the comparable index
# ---------------------------------------------------------------------------------------


def test_cbioportal_ids_are_not_treated_as_citable_accessions(record_factory):
    """Authors do not quote cBioPortal study ids, so counting them would invent reuse."""
    rec = record_factory("cbio-x", identifiers=[(IdScheme.CBIOPORTAL_STUDY, "brca_tcga_pub")])
    assert trace.tokens_for(rec) == []


def test_index_fields_are_fixed_so_counts_stay_comparable():
    """The Reuse Gap Index compares datasets, so every dataset must be measured alike."""
    from cds.model import ReuseTier

    assert trace.INDEX_FIELDS[ReuseTier.T3_ANALYZED] == ("METHODS", "RESULTS")
    assert trace.INDEX_FIELDS[ReuseTier.T2_DECLARED] == ("DATA_AVAILABILITY",)


# ---------------------------------------------------------------------------------------
# The underexplored label
# ---------------------------------------------------------------------------------------


def test_model_id_names_the_specification_actually_fitted():
    """The id said 'nb' long after the negative binomial GLM had been rejected, and it
    was published on every label."""
    assert "nb" not in reuse_gap.MODEL_ID.split("-")


def test_citation_basis_line_needs_a_real_ratio():
    assert reuse_gap.citation_basis_line(ReuseMetrics(citation_to_reuse_ratio=None)) is None
    assert reuse_gap.citation_basis_line(ReuseMetrics(citation_to_reuse_ratio=2.0)) is None
    line = reuse_gap.citation_basis_line(
        ReuseMetrics(citation_to_reuse_ratio=138.0, n_citations_to_primary_publication=138)
    )
    assert line and "known but little used" in line


def test_underexplored_basis_is_topped_up_after_curation(record_factory):
    """`gap` runs before `curate`, so the citation sentence was unreachable for every
    dataset it was written for: GDC and PDC records only learn their marker paper from
    an overlay, two stages later."""
    rec = record_factory("gdc-rebc-thyr")
    rec.underexplored = UnderexploredLabel(is_underexplored=True, basis=["shortfall line"])
    rec.reuse_metrics = ReuseMetrics(
        citation_to_reuse_ratio=138.0, n_citations_to_primary_publication=138
    )
    assert reuse_gap.refresh_underexplored_basis([rec]) == 1
    assert len(rec.underexplored.basis) == 2
    # idempotent: running curate twice must not duplicate the sentence
    assert reuse_gap.refresh_underexplored_basis([rec]) == 0
    assert len(rec.underexplored.basis) == 2


def test_percentile_reads_as_english():
    assert reuse_gap._ordinal(2) == "2nd"
    assert reuse_gap._ordinal(1) == "1st"
    assert reuse_gap._ordinal(3) == "3rd"
    assert reuse_gap._ordinal(11) == "11th"
    assert reuse_gap._ordinal(23) == "23rd"


def test_no_citable_accession_is_never_labelled_underexplored(record_factory):
    """364 of 602 datasets cannot be measured at all. Unmeasurable is not zero."""
    rec = record_factory("x")
    rec.reuse_metrics = ReuseMetrics(has_citable_accession=False)
    assert reuse_gap.observed_reuse(rec) is None
    frame, diag = reuse_gap.fit([rec])
    assert diag["n_excluded_no_citable_accession"] == 1


# ---------------------------------------------------------------------------------------
# Links a reader clicks must resolve
# ---------------------------------------------------------------------------------------


def test_no_workbook_url_until_a_repository_is_published(monkeypatch):
    """The published URL was github.com/cancer-data-showcase/blob/main/... - missing the
    repository segment, so every 'View notebook' button on every showcase page 404'd."""
    monkeypatch.setattr("cds.normalize.curate.REPO_BASE_URL", "")
    assert _workbook_url("01_can_i_answer_this") is None
    monkeypatch.setattr("cds.normalize.curate.REPO_BASE_URL", "https://github.com/org/repo")
    url = _workbook_url("01_can_i_answer_this")
    assert (
        url == "https://github.com/org/repo/blob/main/workbooks/executed/01_can_i_answer_this.ipynb"
    )


def test_workbook_links_are_collected_for_checking(record_factory):
    from cds.model import AnalysisExample, WorkbookLevel
    from cds.verify.check import collect_urls

    rec = record_factory("x")
    rec.landing_page_url = "https://portal.example.org/x"
    rec.analysis_examples = [
        AnalysisExample(
            level=WorkbookLevel.BEGINNER,
            title="t",
            question="q",
            workbook_url="https://github.com/org/repo/blob/main/workbooks/executed/a.ipynb",
        )
    ]
    assert any("a.ipynb" in u for u in collect_urls(rec))


# ---------------------------------------------------------------------------------------
# Workbook source format
# ---------------------------------------------------------------------------------------


def test_percent_script_splits_markdown_from_code():
    cells = parse_percent_script(
        "# %% [markdown]\n# # Title\n#\n# Body text\n\n# %%\nprint('hi')\n\n# %%\nx = 1\n"
    )
    assert [k for k, _ in cells] == ["markdown", "code", "code"]
    assert cells[0][1] == "# Title\n\nBody text"
    assert cells[1][1] == "print('hi')"


def test_receipt_counts_code_cells_only():
    """Comparing executed code cells against a total that included markdown made every
    receipt look like a partial run."""
    cells = parse_percent_script("# %% [markdown]\n# doc\n\n# %%\nx = 1\n")
    assert sum(1 for k, _ in cells if k == "code") == 1


class TestMarkerPaperInference:
    """A marker paper describes one cohort.

    The inference - earliest heavily cited article that analysed the accession - nominated
    a pan-tissue DNA methylation clock as the marker paper for eleven separate TCGA
    projects, and its citation count then appeared four times on the site's "most cited
    publications" board. A methods paper that reused the data is exactly what the rest of
    this project exists to distinguish from a marker paper.
    """

    @staticmethod
    def _inferred(pmid: str, citations: int = 5000):
        from cds.model import Confidence, Evidence, Method, Publication
        from cds.reuse.enrich import INFERRED_LABEL

        return Publication(
            pmid=pmid,
            title="DNA methylation age of human tissues and cell types",
            citation_count=citations,
            evidence=[
                Evidence(
                    method=Method.DERIVED,
                    source_label=INFERRED_LABEL,
                    confidence=Confidence.LOW,
                )
            ],
        )

    @staticmethod
    def _authoritative(pmid: str):
        from cds.model import Confidence, Evidence, Method, Publication

        return Publication(
            pmid=pmid,
            title="Comprehensive molecular portraits of human breast tumors",
            evidence=[
                Evidence(
                    method=Method.API,
                    source_label="cBioPortal API /studies",
                    confidence=Confidence.HIGH,
                )
            ],
        )

    def test_withdraws_an_inference_claimed_by_more_than_one_dataset(self, record_factory):
        from cds.reuse.enrich import drop_ambiguous_inferred_primaries

        a, b = record_factory("a"), record_factory("b")
        for rec in (a, b):
            rec.primary_publications = [self._inferred("24138928")]
            rec.reuse_metrics.n_citations_to_primary_publication = 5556
        stats = drop_ambiguous_inferred_primaries([a, b])

        assert stats["n_records_withdrawn"] == 2
        assert a.primary_publications == [] and b.primary_publications == []
        assert a.reuse_metrics.n_citations_to_primary_publication is None
        assert any(
            "nominated for 2 datasets" in (e.locator or "") for e in a.reuse_metrics.evidence
        ), "the withdrawal must leave a reason on the record"

    def test_keeps_an_inference_claimed_by_exactly_one_dataset(self, record_factory):
        from cds.reuse.enrich import drop_ambiguous_inferred_primaries

        a, b = record_factory("a"), record_factory("b")
        a.primary_publications = [self._inferred("111")]
        b.primary_publications = [self._inferred("222")]
        drop_ambiguous_inferred_primaries([a, b])
        assert [p.pmid for p in a.primary_publications] == ["111"]
        assert [p.pmid for p in b.primary_publications] == ["222"]

    def test_never_withdraws_a_publication_the_repository_supplied(self, record_factory):
        """Two records can legitimately share a repository-supplied marker paper."""
        from cds.reuse.enrich import drop_ambiguous_inferred_primaries

        a, b = record_factory("a"), record_factory("b")
        for rec in (a, b):
            rec.primary_publications = [self._authoritative("23000897")]
        stats = drop_ambiguous_inferred_primaries([a, b])
        assert stats["n_records_withdrawn"] == 0
        assert [p.pmid for p in a.primary_publications] == ["23000897"]
