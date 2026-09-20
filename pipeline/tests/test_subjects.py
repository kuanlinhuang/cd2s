from __future__ import annotations

import json
from pathlib import Path

import pytest

from cds import store
from cds.model import (
    Confidence,
    DatasetRecord,
    Evidence,
    Method,
    OntologyTerm,
    Subject,
    SubjectScope,
)
from cds.subjects import (
    FILING_PLACEHOLDERS,
    NAME_TO_CODE,
    ONCOTREE_PATH,
    SITE_TO_TISSUE,
    SYNONYMS,
    assign,
    classify_string,
    is_curated,
)


def record(
    *,
    cancer_types: list[str] | None = None,
    primary_sites: list[str] | None = None,
    codes: list[str] | None = None,
    title: str = "Test record",
) -> DatasetRecord:
    terms = [OntologyTerm(label=value) for value in cancer_types or []]
    terms.extend(OntologyTerm(label=code, code=code) for code in codes or [])
    return DatasetRecord(
        id="test",
        title=title,
        cancer_types=terms,
        primary_sites=primary_sites or [],
    )


def test_every_string_in_the_raw_stage_is_classified() -> None:
    unmapped: list[str] = []
    for path in sorted(Path("data/raw").glob("*.records.jsonl")):
        for rec in store.read_jsonl(path):
            has_codes = any(term.code for term in rec.cancer_types)
            if not has_codes:
                for term in rec.cancer_types:
                    if classify_string(term.label, "disease")[0] == "unmapped":
                        unmapped.append(f"{rec.id} cancer_type={term.label!r}")
                for site in rec.primary_sites:
                    if classify_string(site, "site")[0] == "unmapped":
                        unmapped.append(f"{rec.id} primary_site={site!r}")
            assign(rec)
    assert not unmapped, "\n".join(unmapped)


@pytest.mark.parametrize(
    "placeholder", sorted(FILING_PLACEHOLDERS - {"mixed cancer types", "various"})
)
def test_placeholders_never_become_subjects(placeholder: str) -> None:
    result = assign(record(cancer_types=[placeholder]))
    assert result.scope == SubjectScope.NOT_STATED
    assert not result.tissues


def test_histology_decides_over_biopsy_sites() -> None:
    tissue_names = []
    seen = set()
    for site, tissue in SITE_TO_TISSUE.items():
        if tissue not in seen:
            tissue_names.append(site)
            seen.add(tissue)
        if len(tissue_names) == 20:
            break
    skin = assign(record(cancer_types=["Nevi and Melanomas"], primary_sites=tissue_names))
    broad = assign(
        record(cancer_types=["Adenomas and Adenocarcinomas"], primary_sites=tissue_names)
    )
    assert skin.scope == SubjectScope.SINGLE
    assert skin.tissues == ["SKIN"]
    assert broad.scope == SubjectScope.PAN_CANCER


HISTOLOGY_MAJORITY_NOTE = "A two-thirds histology majority determined the subject."


def test_no_record_contradicts_its_only_stated_site_except_by_histology_majority() -> None:
    """Over the whole raw stage, not just the cases someone thought to write down.

    A subject may contradict the site the repository stated - a mesothelioma is pleural
    though the site says lung, a lymphoma is lymphoid wherever it was biopsied - but
    only ever because histology carried a two-thirds majority. Reaching the same
    contradiction through the fallback means an incidental label outranked a site the
    repository actually stated, which is how a lung cohort came to be filed under the
    adrenal gland.
    """
    violations: list[str] = []
    for path in sorted(Path("data/raw").glob("*.records.jsonl")):
        for rec in store.read_jsonl(path):
            subject = assign(rec)
            if subject.scope not in (SubjectScope.SINGLE, SubjectScope.SEVERAL):
                continue
            sites = {
                NAME_TO_CODE[name]
                for kind, name in (classify_string(s, "site") for s in rec.primary_sites)
                if kind == "tissue" and name
            }
            if len(sites) != 1 or set(subject.tissues) & sites:
                continue
            if subject.evidence[0].note != HISTOLOGY_MAJORITY_NOTE:
                violations.append(
                    f"{rec.id}: filed {subject.tissues} against stated site {sorted(sites)} "
                    f"via {subject.evidence[0].note!r}"
                )
    assert not violations, "\n".join(violations)


def test_one_incidental_histology_does_not_outrank_the_stated_site() -> None:
    """A histology label swamped by morphology categories is not a claim about tissue.

    CGCI-HTMCP-LC states two primary sites, both lung, and six ICD-O categories, one of
    which is "Paragangliomas and Glomus Tumors". The majority rule already rejected that
    one-in-six signal; the fallback then used it anyway and filed a lung cohort under the
    adrenal gland, where it led the shortlist for "pheochromocytoma" and could not be
    reached from "lung".
    """
    result = assign(
        record(
            cancer_types=[
                "Neoplasms, NOS",
                "Complex Epithelial Neoplasms",
                "Adenomas and Adenocarcinomas",
                "Paragangliomas and Glomus Tumors",
                "Epithelial Neoplasms, NOS",
                "Squamous Cell Neoplasms",
            ],
            primary_sites=["Bronchus and lung", "lung"],
        )
    )
    assert result.scope == SubjectScope.SINGLE
    assert result.tissues == ["LUNG"]


def test_a_histology_majority_still_beats_the_sites_it_was_biopsied_from() -> None:
    """The fix above must not weaken the rule it sits beside.

    A lymphoma is lymphoid wherever the tissue was taken from, and that assignment comes
    from a two-thirds histology majority, not from the sites.
    """
    result = assign(
        record(
            cancer_types=["Mature B-Cell Lymphomas", "Mature T- and NK-Cell Lymphomas"],
            primary_sites=["Liver", "Bone", "Brain"],
        )
    )
    assert result.scope == SubjectScope.SINGLE
    assert result.tissues == ["LYMPH"]


def test_tied_histology_keeps_both_tissues_when_no_single_site_decides() -> None:
    """Two histology names that tie are both real statements, so both survive.

    TARGET-ALL-P3 states "Myeloid Leukemias" and "Lymphoid Leukemias" with no usable
    site. Treating a tie as an outvoted signal dropped it to a title-derived subject,
    which cannot admit a record to a shortlist at all - an acute lymphoblastic leukaemia
    cohort unreachable from a leukaemia question.
    """
    result = assign(
        record(
            cancer_types=[
                "Leukemias, NOS",
                "Myeloid Leukemias",
                "Not Applicable",
                "Lymphoid Leukemias",
            ],
            primary_sites=["Unknown", "Hematopoietic and reticuloendothelial systems"],
        )
    )
    assert result.scope == SubjectScope.SEVERAL
    assert result.tissues == ["LYMPH", "MYELOID"]


def test_cancers_of_unknown_primary_claim_no_tissue() -> None:
    """One sarcoma category among twelve does not make a CUP cohort a soft-tissue one."""
    result = assign(
        record(
            cancer_types=[
                "Ductal and Lobular Neoplasms",
                "Transitional Cell Papillomas and Carcinomas",
                "Germ Cell Neoplasms",
                "Neoplasms, NOS",
                "Myomatous Neoplasms",
                "Adnexal and Skin Appendage Neoplasms",
                "Complex Epithelial Neoplasms",
                "Squamous Cell Neoplasms",
                "Soft Tissue Tumors and Sarcomas, NOS",
                "Adenomas and Adenocarcinomas",
                "Cystic, Mucinous and Serous Neoplasms",
                "Epithelial Neoplasms, NOS",
            ],
            primary_sites=["Unknown"],
        )
    )
    assert result.scope == SubjectScope.NOT_STATED
    assert result.tissues == []


def test_four_tissues_is_pan_cancer_and_three_is_several() -> None:
    three = assign(record(primary_sites=["Breast", "Lung", "Kidney"]))
    four = assign(record(primary_sites=["Breast", "Lung", "Kidney", "Liver"]))
    assert three.scope == SubjectScope.SEVERAL
    assert four.scope == SubjectScope.PAN_CANCER


def test_non_cancer_wins_over_various() -> None:
    assert assign(record(cancer_types=["Non-diseased"], primary_sites=["Various"])).scope == (
        SubjectScope.NON_CANCER
    )


def test_oncotree_code_rolls_up_and_mixed_is_pan_cancer() -> None:
    assert assign(record(codes=["brca"])).tissues == ["BREAST"]
    assert assign(record(codes=["mixed"])).scope == SubjectScope.PAN_CANCER


def test_every_cbioportal_code_in_the_raw_stage_is_in_the_vendored_tree() -> None:
    nodes = json.loads(ONCOTREE_PATH.read_text())["nodes"]
    records = store.read_jsonl(Path("data/raw/cbioportal.records.jsonl"))
    codes = {term.code.lower() for rec in records for term in rec.cancer_types if term.code}
    assert codes <= set(nodes)


def test_curated_subject_wins_over_derived() -> None:
    subject = Subject(
        scope=SubjectScope.SINGLE,
        tissues=["BREAST"],
        evidence=[Evidence(method=Method.CURATED, confidence=Confidence.HIGH)],
    )
    assert is_curated(subject)


def test_title_derived_subjects_are_distinct_and_all_30_are_classified() -> None:
    records = [
        DatasetRecord.model_validate(json.loads(path.read_text()))
        for path in Path("data/dist/datasets").glob("*.json")
    ]
    derived = [assign(rec) for rec in records]
    assert sum(subject.scope == SubjectScope.TITLE_DERIVED for subject in derived) == 30
    assert all(
        subject.evidence[0].source_label == "Dataset title"
        for subject in derived
        if subject.scope == SubjectScope.TITLE_DERIVED
    )
    # A record may end with no subject, but only where nothing in the record names a
    # tissue - not because a rule dropped one it had. A cancers-of-unknown-primary
    # cohort is the honest case: its only site is "Unknown" and every disease label it
    # carries is a morphology category. Asserting instead that nothing is ever
    # NOT_STATED forced such a record to claim a tissue it does not have.
    for rec, subject in zip(records, derived, strict=True):
        if subject.scope != SubjectScope.NOT_STATED:
            continue
        sites = [classify_string(site, "site") for site in rec.primary_sites]
        assert all(kind != "tissue" for kind, _ in sites), (
            f"{rec.id} states a site but was left without a subject: {rec.primary_sites}"
        )


def test_no_synonym_is_a_stopword_or_short_abbreviation() -> None:
    stoplist = {"all", "os", "read", "arm", "leg", "gum", "lip", "head"}
    phrases = {phrase for values in SYNONYMS.values() for phrase in values}
    assert not (phrases & stoplist)
    assert all(len(phrase) >= 3 for phrase in phrases)
