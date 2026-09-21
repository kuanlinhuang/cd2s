"""Regressions for defects that actually shipped.

Every test here corresponds to a wrong number or a wrong claim that reached the site
before somebody noticed. They are written as the smallest case that reproduces the
original mistake, so a future change that reintroduces it fails here rather than on a
dataset page.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from cds.export.site import population_flags
from cds.metrics import reuse_gap
from cds.model import (
    AccessionPrecision,
    DatasetRecord,
    IdScheme,
    Modality,
    ReuseMetrics,
    ReuseTier,
    UnderexploredLabel,
)
from cds.normalize.curate import _workbook_url
from cds.normalize.merge import merge_records
from cds.reuse import dating, precision, trace
from cds.workbooks import parse_percent_script

_NOW = datetime.now(UTC)

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


def test_synapse_folder_ids_are_not_treated_as_citable_accessions(record_factory):
    """A Synapse id names a folder inside an atlas, and no author cites one.

    Counting them is worse than counting nothing: every HTAN record scored an exact
    zero in every tier, down to T0 mentions, and the site published fourteen atlases as
    having a reuse shortfall against papers cited 856, 676 and 611 times. A dataset
    whose only identifiers are Synapse ids has no citable accession, which the record
    must say outright - "not measurable" and "unused" are different claims.
    """
    rec = record_factory(
        "htan-x",
        identifiers=[(IdScheme.SYNAPSE, "syn35558468"), (IdScheme.SYNAPSE, "syn35558474")],
    )
    assert trace.tokens_for(rec) == []


def test_index_fields_are_fixed_so_counts_stay_comparable():
    """The Reuse Gap Index compares datasets, so every dataset must be measured alike."""
    from cds.model import ReuseTier

    assert trace.INDEX_FIELDS[ReuseTier.T3_ANALYZED] == ("METHODS",)
    assert trace.INDEX_FIELDS[ReuseTier.T2_DECLARED] == ("DATA_AVAILABILITY",)


def test_each_index_tier_asks_exactly_one_field():
    """Taking the maximum across fields let the noisiest field decide every count.

    RESULTS returns more hits than METHODS for most accessions, and more of them are
    wrong: `dating` already refuses RESULTS because it dated TARGET-AML four years
    before the program existed. While T3 took max(METHODS, RESULTS), the field with the
    most false positives won by construction.
    """
    for tier, fields in trace.INDEX_FIELDS.items():
        if tier.value == "t0_mention":
            continue  # framing text is a floor, not a headline number
        assert len(fields) == 1, f"{tier} asks {fields}; a maximum picks the noisiest"


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


# ---------------------------------------------------------------------------------------
# Counting the right articles for the right dataset
# ---------------------------------------------------------------------------------------


def test_umbrella_accessions_are_not_counted_as_a_dataset_of_their_own(record_factory):
    """Fourteen TCGA projects published the identical reuse count, and it was TCGA's.

    Every TCGA project carries phs000178, the dbGaP accession for the whole programme.
    `METHODS:"phs000178"` returns a few hundred hits, the index pass took the maximum
    across a dataset's accessions, and so Uterine Carcinosarcoma, Cholangiocarcinoma,
    Uveal Melanoma and eleven others each reported the same number - the programme's,
    not their own.
    """
    shared_id = (IdScheme.DBGAP, "phs000178")
    a = record_factory("tcga-ucs", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-UCS"), shared_id])
    b = record_factory("tcga-chol", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-CHOL"), shared_id])
    solo = record_factory("beataml", identifiers=[(IdScheme.DBGAP, "phs001657")])

    shared = trace.shared_accessions([a, b, solo])
    assert shared == {"phs000178"}

    assert trace.tokens_for(a, shared=shared) == ["TCGA-UCS"]
    assert trace.tokens_for(b, shared=shared) == ["TCGA-CHOL"]
    # A dbGaP accession only one dataset claims is still that dataset's own.
    assert trace.tokens_for(solo, shared=shared) == ["phs001657"]


def test_hyphenated_accessions_are_flagged_for_precision_correction():
    """Europe PMC indexes `TARGET-RT` as the two words "target" and "RT".

    `METHODS:"TARGET-RT"` and `METHODS:"target rt"` return the identical hit count, so
    the raw number also counts radiotherapy, retention time and reverse transcription.
    Measured against open-access full text, 14% of those hits were really about the
    dataset. Anything with a separator has to be checked; anything without cannot be
    affected and must not be made to pay for a sample it does not need.
    """
    assert precision.is_vulnerable("TARGET-RT")
    assert precision.is_vulnerable("TCGA-BRCA")
    assert not precision.is_vulnerable("phs000178")
    assert not precision.is_vulnerable("GSE68086")
    assert not precision.is_vulnerable("PDC000173")


def test_literal_accession_test_rejects_the_contamination_pattern():
    """The space-separated form is exactly what the correction exists to exclude."""
    pat = precision._literal_pattern("TARGET-RT")
    assert pat.search("data from TARGET-RT were downloaded")
    assert pat.search("cohort target‑rt")  # non-breaking hyphen
    assert pat.search("TARGET_RT")
    assert not pat.search("we target RT with a higher dose")


def test_unmeasurable_precision_publishes_nothing_rather_than_a_raw_count():
    """A count we cannot correct is not a count, and zero would be a different lie."""
    est = precision.AccessionPrecision(
        token="TARGET-RT",
        query='METHODS:"TARGET-RT"',
        strategy_id=precision.STRATEGY_ID,
        needs_correction=True,
        precision=None,
        n_sampled=30,
        n_checked=2,
        n_literal=1,
    )
    assert precision.correct(270, est) is None

    exact = precision.AccessionPrecision(
        token="phs001657",
        query='METHODS:"phs001657"',
        strategy_id=precision.STRATEGY_ID,
        needs_correction=False,
        precision=1.0,
    )
    assert precision.correct(22, exact) == 22

    # The measured precision for TARGET-RT, and the number both the dataset page and the
    # methods page quote from it. A rounded 0.14 here let the published copy drift.
    measured = exact.model_copy(update={"needs_correction": True, "precision": 0.1429})
    assert precision.correct(270, measured) == 39

    # A raw zero is exact. An unmeasurable estimate must not turn it into "unknown".
    unmeasurable = exact.model_copy(update={"needs_correction": True, "precision": None})
    assert precision.correct(0, unmeasurable) == 0
    assert precision.correct(0, measured) == 0


def test_wilson_interval_does_not_claim_certainty_from_a_clean_sample():
    """30 of 30 is not proof of 100%, and a zero-width interval would say it was."""
    lo, hi = precision.wilson_interval(30, 30)
    assert lo < 1.0 and hi == 1.0
    assert lo > 0.85


# ---------------------------------------------------------------------------------------
# Counting citations to the right paper
# ---------------------------------------------------------------------------------------


def test_citation_count_is_withheld_when_the_marker_paper_was_only_guessed(record_factory):
    """TCGA-OV was published as cited 44 times. Its marker paper has 6,322 citations.

    The nomination heuristic picks from articles that quote the accession, and a 2011
    marker paper does not quote a project id the GDC introduced later - so it can only
    ever pick a reuse paper. Counting citations to that paper and labelling the result
    "cited the paper" states something the number is not.
    """
    from cds.model import Confidence, Evidence, Method, Publication
    from cds.reuse import markers

    guessed = Publication(
        pmid="22458606",
        title="Sample-level enrichment analysis unravels shared stress phenotypes",
        evidence=[
            Evidence(
                method=Method.DERIVED,
                source_label=markers.INFERRED_LABEL,
                retrieved_at=_NOW,
                confidence=Confidence.LOW,
            )
        ],
    )
    rec = record_factory("gdc-tcga-ov", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-OV")])
    rec.primary_publications = [guessed]
    rec.reuse_metrics.n_citations_to_primary_publication = 44
    rec.reuse_metrics.citation_to_reuse_ratio = 0.1

    assert markers.authoritative_marker_pmids(rec) == []
    stats = markers.withhold_counts_from_guesses([rec])

    assert stats["n_citation_counts_withheld"] == 1
    assert rec.reuse_metrics.n_citations_to_primary_publication is None
    assert rec.reuse_metrics.citation_to_reuse_ratio is None
    # The suggestion itself survives; only the count derived from it goes.
    assert rec.primary_publications == [guessed]
    assert any(e.source_label == "Citation count withheld" for e in rec.reuse_metrics.evidence)


def test_a_curated_marker_paper_displaces_the_guess_and_may_be_counted_from(
    record_factory, tmp_path
):
    """A reviewer's entry must throw the nomination out, not sit beside it.

    Driven through `apply_registry` rather than by installing the result by hand: the
    displacement, the deduplication and the survival of a repository's own publication
    are all things that function does, and a test that assigns the outcome itself proves
    none of them.
    """
    from cds.model import Confidence, Evidence, Method, Publication
    from cds.reuse import markers

    guessed = Publication(
        pmid="22458606",
        evidence=[
            Evidence(
                method=Method.DERIVED,
                source_label=markers.INFERRED_LABEL,
                retrieved_at=_NOW,
                confidence=Confidence.LOW,
            )
        ],
    )
    repository_supplied = Publication(
        pmid="26451490",
        evidence=[
            Evidence(
                method=Method.API,
                source_label="GDC",
                retrieved_at=_NOW,
                confidence=Confidence.HIGH,
            )
        ],
    )
    rec = record_factory("gdc-tcga-ov", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-OV")])
    rec.primary_publications = [guessed, repository_supplied]
    other = record_factory("gdc-tcga-brca", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-BRCA")])

    path = tmp_path / "marker_papers.yaml"
    path.write_text(
        "reviewer: test\n"
        "reviewed_at: 2025-01-02\n"
        "papers:\n"
        "  gdc-tcga-ov:\n"
        '    pmid: "21720365"\n'
        "    title: Integrated genomic analyses of ovarian carcinoma\n"
        "    journal: Nature\n"
        "    year: 2011\n"
        "  gdc-not-in-this-corpus:\n"
        '    pmid: "1"\n'
    )

    info = markers.apply_registry([rec, other], path)

    assert info["n_applied"] == 1
    assert info["n_guesses_displaced"] == 1
    assert info["n_unmatched"] == 1
    assert info["unmatched_ids"] == ["gdc-not-in-this-corpus"]

    pmids = [p.pmid for p in rec.primary_publications]
    assert "22458606" not in pmids, "the nomination must be displaced, not kept alongside"
    assert pmids == ["21720365", "26451490"], "the repository's own publication survives"
    assert markers.authoritative_marker_pmids(rec) == ["21720365", "26451490"]
    assert not markers.is_inferred(rec.primary_publications[0])
    assert markers.withhold_counts_from_guesses([rec])["n_citation_counts_withheld"] == 0

    # Re-applying must not duplicate the entry.
    markers.apply_registry([rec, other], path)
    assert [p.pmid for p in rec.primary_publications] == ["21720365", "26451490"]


# ---------------------------------------------------------------------------------------
# Sample counts must carry their denominator
# ---------------------------------------------------------------------------------------


def test_deep_pass_records_how_many_articles_it_actually_read(record_factory):
    """ "10 independent" read as 10 of 652. It was 10 of 12."""
    from cds.model import Publication, ReuseRecord, ReuseTier

    rec = record_factory("gdc-tcga-ov", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-OV")])
    rec.reuse_metrics.n_by_tier = {"t3_analyzed": 652}
    rec.reuse_metrics.n_verified_reuse = 652
    exemplars = [
        ReuseRecord(
            publication=Publication(pmid=str(i), year=2022),
            tier=ReuseTier.T3_ANALYZED,
            independent_of_generators=True,
        )
        for i in range(10)
    ]

    trace.apply_deep(rec, exemplars, n_examined=12)

    assert rec.reuse_metrics.n_independent_reuse == 10
    assert rec.reuse_metrics.n_reuse_examined == 12
    # The population count is untouched: the two are different measurements.
    assert rec.reuse_metrics.n_verified_reuse == 652


def test_a_measured_zero_is_kept_as_zero_not_dropped_as_unmeasured():
    """An empty winning query made every genuine zero look like a failed measurement.

    `_count_with_fields` returned no query when nothing was found, and the tier loop
    reads a missing query as "this tier was not measured" - which is rendered as a dash
    rather than a zero. A dataset nobody has used is the most informative row the index
    produces, and it was being hidden.
    """
    fields = trace.INDEX_FIELDS[ReuseTier.T3_ANALYZED]

    class _ZeroClient:
        def get(self, *a, **k):  # pragma: no cover - not reached
            raise AssertionError("should not be called")

    import cds.reuse.epmc as epmc_mod

    original = epmc_mod._search
    epmc_mod._search = lambda *a, **k: ({"hitCount": 0}, "", None)
    try:
        count, query = trace._count_with_fields(_ZeroClient(), "TCGA-XYZ", fields)
    finally:
        epmc_mod._search = original

    assert count == 0
    assert query == f'{fields[0]}:"TCGA-XYZ"'


def test_an_unreadable_article_drops_out_of_the_sample_instead_of_aborting_the_run():
    """Europe PMC serves a persistent 500 for some articles it lists as open access.

    One of them killed a corpus-wide pass at its 150th record. An article we cannot read
    is not an error condition - it is the case the sampler already models, because we
    cannot judge what we cannot retrieve.
    """
    import httpx

    class _FailingClient:
        def get(self, url, **kwargs):
            raise httpx.HTTPStatusError("500", request=None, response=None)  # type: ignore[arg-type]

    assert precision._full_text(_FailingClient(), "PMC7498180") is None


def test_a_nominated_marker_paper_must_actually_name_the_accession():
    """TARGET-RT nominated a 2003 psycholinguistics paper as its marker paper.

    Every candidate query is a two-word phrase match, because Europe PMC indexes the
    hyphen in an accession as a word break, so for TARGET-RT the candidate pool is full
    of articles about targeting and RT. "Timed picture naming in seven languages" was
    printed on the site under "Original publication".
    """
    from cds.model import Publication
    from cds.reuse import enrich

    class _Client:
        def __init__(self, text):
            self.text = text

    def fake_full_text(_client, pmcid):
        return {
            "PMC_GOOD": "we downloaded TARGET-RT from the GDC",
            "PMC_BAD": "timed picture naming",
        }.get(pmcid)

    original = enrich.precision._full_text
    enrich.precision._full_text = fake_full_text
    try:
        good = Publication(pmid="1", pmcid="PMC_GOOD")
        bad = Publication(pmid="2", pmcid="PMC_BAD")
        closed = Publication(pmid="3", pmcid=None)
        assert enrich._mentions_accession(None, good, "TARGET-RT") is True
        assert enrich._mentions_accession(None, bad, "TARGET-RT") is False
        # Unreadable is unproven, not accepted.
        assert enrich._mentions_accession(None, closed, "TARGET-RT") is False
    finally:
        enrich.precision._full_text = original


def test_a_stale_nomination_is_reconsidered_on_the_next_pass(record_factory, monkeypatch):
    """`enrich` reads and writes the same stage, so its own guesses came back forever.

    The nomination step was guarded on `not rec.primary_publications`, which is false as
    soon as a previous run has nominated something. A guess made before a new rejection
    rule existed therefore survived that rule entirely, and the rule appeared to work
    while changing nothing. Driving `enrich_record` with a record that already carries a
    stale guess is the only way to see that: the guess must be put back through the
    rejection rule and dropped, not carried forward untested.
    """
    from cds.model import Confidence, Evidence, Method, Publication
    from cds.reuse import enrich, epmc, markers

    stale = Publication(
        pmid="12921412",
        title="Timed picture naming in seven languages.",
        year=2003,
        evidence=[
            Evidence(
                method=Method.DERIVED,
                source_label=markers.INFERRED_LABEL,
                retrieved_at=_NOW,
                confidence=Confidence.LOW,
            )
        ],
    )
    rec = record_factory("x", identifiers=[(IdScheme.GDC_PROJECT, "TARGET-RT")])
    rec.primary_publications = [stale.model_copy(deep=True)]

    monkeypatch.setattr(enrich.dating, "years_available", lambda *a, **k: (3, 2015, "how"))
    monkeypatch.setattr(enrich.trace, "deep_candidates", lambda *a, **k: ([], [], None))
    monkeypatch.setattr(
        epmc, "most_cited_in_window", lambda *a, **k: (stale.model_copy(deep=True), None)
    )
    # The nominee does not name the accession anywhere in its full text, which is exactly
    # the rule the stale guess predates.
    monkeypatch.setattr(enrich, "_mentions_accession", lambda *a, **k: False)

    info = enrich.enrich_record(None, rec, link_grants=False)

    assert rec.primary_publications == [], "a stale guess must be re-tested, not inherited"
    assert info["rejected_primary_pmid"] == "12921412"


def test_a_sourced_publication_is_never_re_nominated(record_factory, monkeypatch):
    """Only this pipeline's own guesses are reconsidered; a repository's stays put."""
    from cds.model import Confidence, Evidence, Method, Publication
    from cds.reuse import enrich, epmc

    sourced = Publication(
        pmid="99",
        title="The marker paper the repository publishes.",
        year=2011,
        evidence=[
            Evidence(
                method=Method.API,
                source_label="GDC",
                retrieved_at=_NOW,
                confidence=Confidence.HIGH,
            )
        ],
    )
    rec = record_factory("x", identifiers=[(IdScheme.GDC_PROJECT, "TARGET-RT")])
    rec.primary_publications = [sourced.model_copy(deep=True)]

    monkeypatch.setattr(enrich.dating, "years_available", lambda *a, **k: (3, 2015, "how"))
    monkeypatch.setattr(enrich.trace, "deep_candidates", lambda *a, **k: ([], [], None))

    def _must_not_be_called(*a, **k):
        raise AssertionError("a sourced publication must not trigger a nomination")

    monkeypatch.setattr(epmc, "most_cited_in_window", _must_not_be_called)

    enrich.enrich_record(None, rec, link_grants=False)

    assert [p.pmid for p in rec.primary_publications] == ["99"]


def test_independence_is_decided_after_the_generating_team_is_known(record_factory):
    """Every article came back "unknown", and it was an ordering bug, not a finding.

    Independence was settled while the articles were being fetched, but a dataset's
    generation awards are attributed two stages later, from its marker paper. At fetch
    time most records knew nobody who had made them, so the overlap test had nothing to
    test against. TCGA-OV reported 0 of the 110 articles it examined as independent.
    """
    from cds.model import FundingRole, Grant, Publication, ReuseRecord, ReuseTier

    rec = record_factory("ds", identifiers=[(IdScheme.GDC_PROJECT, "TCGA-OV")])
    rec.grants = [
        # RePORTER writes PIs given-name first; the comma form also occurs.
        Grant(core_project_num="U24CA1", pi_names=["Daniel W. Bell"], role=FundingRole.GENERATION),
        # A reuse award's investigators did not make the data and must not count.
        Grant(core_project_num="R01CA2", pi_names=["NOVAK, ANNA"], role=FundingRole.REUSE),
    ]
    rec.reuse = [
        ReuseRecord(
            publication=Publication(pmid="1"),
            tier=ReuseTier.T3_ANALYZED,
            author_keys=["bell d", "zhou q"],
        ),
        ReuseRecord(
            publication=Publication(pmid="2"),
            tier=ReuseTier.T3_ANALYZED,
            author_keys=["novak a", "zhou q"],
        ),
        ReuseRecord(
            publication=Publication(pmid="3"),
            tier=ReuseTier.T3_ANALYZED,
            author_keys=["okafor n"],
        ),
    ]

    assert trace.generator_keys(rec) == {"bell d"}
    trace.refresh_independence([rec])

    flags = [x.independent_of_generators for x in rec.reuse]
    assert flags == [False, True, True]
    assert rec.reuse_metrics.n_independent_reuse == 2


def test_author_overlap_uses_an_initial_so_a_large_team_does_not_match_everyone():
    """A TCGA cohort's awards name hundreds of investigators between them.

    Matching on surname alone, a set containing Chen, Wang, Li and Anderson intersects
    almost any author list in oncology, so nothing would ever be independent.
    """
    from cds.reuse import epmc as epmc_mod

    assert epmc_mod.author_keys("Chen X, Wang Y, Okafor NA") == {"chen x", "wang y", "okafor n"}
    # Same surname, different person, no longer a collision.
    assert "chen j" not in epmc_mod.author_keys("Chen X")
    # A corporate author is not a person; it reduces to a key that will not match any
    # real investigator, which is the right outcome - a consortium byline names nobody.
    assert epmc_mod.author_keys("Cancer Genome Atlas Research Network.") == {"cancer g"}


def test_reporter_and_europe_pmc_author_names_reduce_to_the_same_key():
    """They are written in opposite orders, and mismatched keys never intersect.

    Europe PMC writes "Bell DW", surname first. RePORTER writes "Daniel W. Bell". The
    first version of this compared them directly and found 434 independent reuses and
    zero overlaps in the entire corpus, which is not a result about the literature.
    """
    from cds.reuse import epmc as epmc_mod

    assert trace._person_key("Daniel W. Bell") == "bell d"
    assert trace._person_key("BELL, DANIEL W") == "bell d"
    assert trace._person_key("STEPHEN B. BAYLIN") == "baylin s"
    assert "bell d" in epmc_mod.author_keys("Bell DW, Zhou Q")


def test_an_exact_zero_beside_uncorrectable_hits_is_not_no_reuse(monkeypatch, record_factory):
    """One exact zero does not license the claim that nobody used the dataset.

    A hyphenated accession whose METHODS query returns nothing but whose INTRO query
    returns thirty: the zero needs no correction and is published, while the thirty is
    dropped because too few open-access articles were available to estimate how much of
    it is really about this dataset. Reading the surviving zero as a complete
    measurement would put the dataset on the underexplored list with an observed zero,
    which is the one claim an unmeasurable record is not allowed to make.
    """
    counts = {'METHODS:"TARGET-RT"': 0, 'INTRO:"TARGET-RT"': 30}
    monkeypatch.setattr(
        trace.epmc,
        "_search",
        lambda client, query, **k: ({"hitCount": counts.get(query, 0)}, None, None),
    )
    monkeypatch.setattr(
        trace.precision,
        "measure",
        lambda client, token, query, **k: AccessionPrecision(
            token=token,
            query=query,
            strategy_id="test",
            needs_correction=True,
            precision=None,
        ),
    )
    rec = record_factory("x", identifiers=[(IdScheme.GDC_PROJECT, "TARGET-RT")])

    m = trace.index_pass(None, rec)

    assert m.n_by_tier["t3_analyzed"] == 0
    assert "t0_mention" not in m.n_by_tier
    assert m.n_verified_reuse == 0
    assert m.no_reuse_identified is False


def test_an_estimated_zero_does_not_claim_nobody_used_the_dataset(monkeypatch, record_factory):
    """A precision of 0.0 scales real hits to nothing; that is not an empty literature.

    Two hundred and seventy methods hits, none of the eight sampled full texts carrying
    the literal accession: the corrected count rounds to zero, but the Wilson interval
    around 0 of 8 still admits dozens of genuine articles. Publishing the estimate as a
    count is the point of the correction; publishing it as "nobody has used this" turns
    a sample into a census.
    """
    counts = {'METHODS:"TARGET-RT"': 270, 'INTRO:"TARGET-RT"': 87}
    monkeypatch.setattr(
        trace.epmc,
        "_search",
        lambda client, query, **k: ({"hitCount": counts.get(query, 0)}, None, None),
    )
    monkeypatch.setattr(
        trace.precision,
        "measure",
        lambda client, token, query, **k: AccessionPrecision(
            token=token,
            query=query,
            strategy_id="test",
            needs_correction=True,
            precision=0.0,
            n_checked=8,
            n_literal=0,
        ),
    )
    rec = record_factory("x", identifiers=[(IdScheme.GDC_PROJECT, "TARGET-RT")])

    m = trace.index_pass(None, rec)

    assert m.n_by_tier["t3_analyzed"] == 0
    assert m.n_by_tier_raw["t3_analyzed"] == 270
    assert m.no_reuse_identified is False


def test_a_second_token_with_hits_blocks_the_nobody_used_this_claim(monkeypatch, record_factory):
    """The guard has to read every token, not the one that happened to win its tier.

    A PDC cohort is several study accessions, and a tier is won on the *corrected*
    value. Give one token a raw zero and another two hundred methods hits that a
    measured precision of 0.0 scales to zero, and both correct to zero - so the tie
    goes to whichever token is listed first, and `n_by_tier_raw` can end up holding
    the raw zero. Reading that as "the search returned nothing at all" republishes a
    sampled estimate as a census, which is exactly what
    `test_an_estimated_zero_does_not_claim_nobody_used_the_dataset` forbids for one
    token. Twenty-six records in the corpus carry several tokens and this claim.
    """
    counts = {'METHODS:"PDC000606"': 200, 'INTRO:"PDC000606"': 40}
    monkeypatch.setattr(
        trace.epmc,
        "_search",
        lambda client, query, **k: ({"hitCount": counts.get(query, 0)}, None, None),
    )
    monkeypatch.setattr(
        trace.precision,
        "measure",
        lambda client, token, query, **k: AccessionPrecision(
            token=token,
            query=query,
            strategy_id="test",
            needs_correction=True,
            precision=0.0,
            n_checked=8,
            n_literal=0,
        ),
    )
    # PDC000607 returns nothing and is listed first, so it wins every tie at zero.
    rec = record_factory(
        "x",
        identifiers=[
            (IdScheme.PDC_STUDY, "PDC000607"),
            (IdScheme.PDC_STUDY, "PDC000606"),
        ],
    )

    m = trace.index_pass(None, rec)

    assert m.n_by_tier["t3_analyzed"] == 0
    assert m.no_reuse_identified is False
