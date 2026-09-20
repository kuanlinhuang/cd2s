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
    assert all(subject.scope != SubjectScope.NOT_STATED for subject in derived)
    assert all(
        subject.evidence[0].source_label == "Dataset title"
        for subject in derived
        if subject.scope == SubjectScope.TITLE_DERIVED
    )


def test_no_synonym_is_a_stopword_or_short_abbreviation() -> None:
    stoplist = {"all", "os", "read", "arm", "leg", "gum", "lip", "head"}
    phrases = {phrase for values in SYNONYMS.values() for phrase in values}
    assert not (phrases & stoplist)
    assert all(len(phrase) >= 3 for phrase in phrases)
