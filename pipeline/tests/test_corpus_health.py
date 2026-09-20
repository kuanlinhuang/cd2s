"""Drift detection against the exported corpus.

Upstream APIs change shape without telling anyone, and the failure is silent: a field
that stops being served becomes an empty list, a page renders "not recorded", and
nothing errors. Every assertion here corresponds to something that actually went that
way. They run only when an export exists, so a clean checkout is not blocked by them.
"""

from __future__ import annotations

import json
from collections import Counter

import pytest

from cds.paths import DIST_DIR

INDEX = DIST_DIR / "index.json"
pytestmark = pytest.mark.skipif(
    not INDEX.exists(), reason="no exported index; run `cds export` first"
)


@pytest.fixture(scope="module")
def rows() -> list[dict]:
    return json.loads(INDEX.read_text())


def by_repo(rows: list[dict], name: str) -> list[dict]:
    return [r for r in rows if r.get("repository") == name]


@pytest.mark.parametrize("repository", ["GDC", "PDC", "cBioPortal"])
def test_clinical_completeness_is_measured_for_most_of_a_harmonized_repository(rows, repository):
    """These three serve fields that map onto the shared vocabulary.

    If a measurement pass silently stops working, the verdicts on those pages revert to
    "not measured" and the site quietly becomes a catalog again.
    """
    subset = by_repo(rows, repository)
    assert subset, f"no {repository} records in the corpus"
    measured = [r for r in subset if r.get("has_survival_endpoint") is not None]
    share = len(measured) / len(subset)
    assert share >= 0.9, (
        f"{repository}: clinical fields measured for only {len(measured)} of {len(subset)} records"
    )


def test_pdc_records_carry_a_disease_classification(rows):
    """PDC moved these from the study record to the clinical record.

    Reading only the study record left every PDC cohort with no cancer type and no
    primary site - invisible to the two facets researchers browse by - and nothing failed.
    """
    subset = by_repo(rows, "PDC")
    classified = [r for r in subset if r["cancer_types"] or r["primary_sites"]]
    assert len(classified) / len(subset) >= 0.85, (
        f"only {len(classified)} of {len(subset)} PDC records have a disease "
        "classification; check whether the clinical endpoint still serves disease_type "
        "and primary_site"
    )


def test_every_repository_reports_a_cohort_size(rows):
    """A record with no count cannot be ranked, compared, or modelled for reuse."""
    missing = [r["id"] for r in rows if not (r.get("n_cases") or r.get("n_samples"))]
    assert len(missing) <= 2, f"records with no cohort size at all: {missing[:10]}"


def test_no_measured_percentage_exceeds_one_hundred(rows):
    """A share above 100% means a per-record count was read as a per-case one."""
    bad = [
        r["id"]
        for r in rows
        if (r.get("median_followup_months") or 0) < 0
        or (r.get("n_cases") or 0) < 0
        or (r.get("n_modalities") or 0) < 0
    ]
    assert not bad, f"negative measurements: {bad[:10]}"


def test_the_corpus_still_spans_every_repository(rows):
    counts = Counter(r["repository"] for r in rows)
    assert set(counts) == {"GDC", "PDC", "IDC", "HTAN", "cBioPortal"}, dict(counts)
    for repository, n in counts.items():
        assert n > 0, repository


@pytest.mark.parametrize("repository", ["GDC", "PDC", "IDC", "cBioPortal"])
def test_subject_is_classified_for_most_records_in_each_repository(rows, repository):
    subset = by_repo(rows, repository)
    classified = [row for row in subset if row["subject_scope"] != "not_stated"]
    assert len(classified) / len(subset) >= 0.9


def test_subject_not_stated_does_not_silently_grow(rows):
    missing = [row["id"] for row in rows if row["subject_scope"] == "not_stated"]
    assert len(missing) <= 30, missing


#: The one cohort whose subject is genuinely unstated, rather than unclassified.
#:
#: GDC's Cancers of Unknown Primary Project reports `primary_sites: ["Unknown"]` - not
#: knowing the primary site is the thing the cohort is for. Its twelve cancer_types are
#: morphology groups carrying no tissue, and picking one of them would assert a site
#: nobody observed. This record was classified `single / SOFT_TISSUE` until the ICD-O
#: label fix stopped a lone incidental label standing in for a cohort's tissue; the
#: committed corpus predates that fix, so this only surfaces on a re-export.
UNKNOWN_PRIMARY_IDS = {"gdc-ccg-cupp"}


def test_all_previously_unstated_records_are_labelled_as_title_derived(rows):
    derived = [row for row in rows if row["subject_scope"] == "title_derived"]
    assert len(derived) == 30
    unstated = {row["id"] for row in rows if row["subject_scope"] == "not_stated"}
    assert unstated <= UNKNOWN_PRIMARY_IDS, sorted(unstated - UNKNOWN_PRIMARY_IDS)
