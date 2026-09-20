"""The generated route to the data.

A wrong route is worse than none: it sends someone to a portal that will not serve them
and they conclude the dataset is unavailable. So what is checked here is that a route is
built from the record's own identifiers, that a controlled cohort is never described as
a download, that every step cites the policy it came from, and that a reviewer's route
survives a rebuild untouched.
"""

from __future__ import annotations

import pytest

from cds.model import (
    AccessAudience,
    AccessStep,
    AccessTier,
    Evidence,
    IdScheme,
    Method,
)
from cds.normalize import access
from tests.conftest import make_record


def gdc(**kw):
    rec = make_record(
        "gdc-tcga-xx",
        identifiers=[(IdScheme.GDC_PROJECT, "TCGA-XX"), (IdScheme.DBGAP, "phs000178")],
        tier=AccessTier.MIXED,
        repo="GDC",
        **kw,
    )
    rec.landing_page_url = "https://portal.gdc.cancer.gov/projects/TCGA-XX"
    rec.access.open_components = ["27,931 open-access files"]
    rec.access.controlled_components = ["43,492 controlled-access files"]
    return rec


def test_a_route_is_built_from_the_records_own_identifiers():
    steps = access.derive(gdc())
    joined = " ".join(f"{s.action} {s.detail} {s.cli_snippet}" for s in steps)
    assert "TCGA-XX" in joined
    assert "phs000178" in joined


def test_steps_are_numbered_from_one_with_people_before_machines():
    steps = access.derive(gdc())
    assert [s.order for s in steps] == list(range(1, len(steps) + 1))
    audiences = [s.audience for s in steps]
    assert AccessAudience.AGENT in audiences
    first_agent = audiences.index(AccessAudience.AGENT)
    assert all(a == AccessAudience.HUMAN for a in audiences[:first_agent])
    assert all(a == AccessAudience.AGENT for a in audiences[first_agent:])


def test_every_generated_step_cites_the_policy_it_applies():
    for rec in (gdc(), _pdc(), _idc(), _cbio(), _htan()):
        steps = access.derive(rec)
        assert steps, rec.id
        for s in steps:
            assert s.evidence, f"{rec.id}: step {s.order} cites nothing"
            assert all(e.method == Method.DERIVED for e in s.evidence)
            assert access.is_derived(s)


def test_a_controlled_cohort_is_never_described_as_a_download():
    rec = gdc()
    rec.access.open_components = []
    steps = access.derive(rec)
    actions = [s.action for s in steps]
    assert not any("without an account" in a for a in actions)
    assert any("dbGaP" in a for a in actions)
    request = next(s for s in steps if "dbGaP" in s.action)
    assert "eRA Commons account" in request.requires


def test_an_open_cohort_is_not_told_to_file_a_request():
    rec = gdc()
    rec.access.controlled_components = []
    actions = [s.action for s in access.derive(rec)]
    assert not any("dbGaP" in a for a in actions)
    assert any("without an account" in a for a in actions)


def _pdc():
    rec = make_record("pdc-x", identifiers=[(IdScheme.PDC_STUDY, "PDC000120")], repo="PDC")
    rec.landing_page_url = "https://pdc.cancer.gov/pdc/study/PDC000120"
    return rec


def _idc():
    rec = make_record("idc-x", identifiers=[(IdScheme.IDC_COLLECTION, "tcga_brca")], repo="IDC")
    rec.landing_page_url = "https://portal.imaging.datacommons.cancer.gov/"
    return rec


def _cbio():
    rec = make_record(
        "cbio-x", identifiers=[(IdScheme.CBIOPORTAL_STUDY, "brca_broad")], repo="cBioPortal"
    )
    rec.landing_page_url = "https://www.cbioportal.org/study/summary?id=brca_broad"
    return rec


def _htan():
    rec = make_record("htan-x", identifiers=[(IdScheme.SYNAPSE, "syn22093319")], repo="HTAN")
    return rec


@pytest.mark.parametrize(
    "builder,token",
    [(_pdc, "PDC000120"), (_idc, "tcga_brca"), (_cbio, "brca_broad"), (_htan, "syn22093319")],
)
def test_each_repository_gets_a_route_carrying_its_own_accession(builder, token):
    steps = access.derive(builder())
    assert steps
    assert token in " ".join(f"{s.detail} {s.cli_snippet}" for s in steps)
    assert any(s.audience == AccessAudience.AGENT for s in steps)


def test_a_repository_with_no_builder_gets_no_invented_route():
    assert access.derive(make_record("other-x", repo="SomewhereElse")) == []


def test_a_reviewers_route_is_left_alone():
    rec = _cbio()
    rec.access_steps = [
        AccessStep(
            order=1,
            action="Email the study team",
            evidence=[Evidence(method=Method.CURATED, source_label="Expert review")],
        )
    ]
    stats = access.apply_all([rec])
    assert stats["n_kept_curated"] == 1
    human = [s for s in rec.access_steps if s.audience == AccessAudience.HUMAN]
    assert [s.action for s in human] == ["Email the study team"]


def test_a_reviewed_human_route_still_gets_a_machine_route():
    """Nobody wrote the API call, and its absence is not a judgement that none exists."""
    rec = _cbio()
    rec.access_steps = [
        AccessStep(
            order=1,
            action="Email the study team",
            evidence=[Evidence(method=Method.CURATED, source_label="Expert review")],
        )
    ]
    access.apply_all([rec])
    machine = [s for s in rec.access_steps if s.audience == AccessAudience.AGENT]
    assert machine
    assert all(access.is_derived(s) for s in machine)
    assert [s.order for s in rec.access_steps] == list(range(1, len(rec.access_steps) + 1))


def test_appending_a_machine_route_twice_does_not_duplicate_it():
    rec = _cbio()
    rec.access_steps = [
        AccessStep(
            order=1,
            action="Email the study team",
            evidence=[Evidence(method=Method.CURATED, source_label="Expert review")],
        )
    ]
    access.apply_all([rec])
    first = len(rec.access_steps)
    access.apply_all([rec])
    assert len(rec.access_steps) == first


def test_a_previously_generated_route_is_replaced_rather_than_appended():
    rec = _cbio()
    access.apply_all([rec])
    first = len(rec.access_steps)
    access.apply_all([rec])
    assert len(rec.access_steps) == first
