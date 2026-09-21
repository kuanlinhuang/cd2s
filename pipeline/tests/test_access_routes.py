"""Generated access routes stay tied to identifiers and repository policy."""

from __future__ import annotations

import pytest

from cds.model import AccessAudience, AccessStep, AccessTier, Evidence, IdScheme, Method
from cds.normalize import access
from tests.conftest import make_record


def _gdc(**kwargs):
    rec = make_record(
        "gdc-tcga-xx",
        identifiers=[(IdScheme.GDC_PROJECT, "TCGA-XX"), (IdScheme.DBGAP, "phs000178")],
        tier=AccessTier.MIXED,
        repo="GDC",
        **kwargs,
    )
    rec.landing_page_url = "https://portal.gdc.cancer.gov/projects/TCGA-XX"
    rec.access.open_components = ["27,931 open-access files"]
    rec.access.controlled_components = ["43,492 controlled-access files"]
    return rec


def _pdc():
    rec = make_record("pdc-x", identifiers=[(IdScheme.PDC_STUDY, "PDC000120")], repo="PDC")
    rec.landing_page_url = "https://pdc.cancer.gov/pdc/study/PDC000120"
    return rec


def _idc():
    return make_record("idc-x", identifiers=[(IdScheme.IDC_COLLECTION, "tcga_brca")], repo="IDC")


def _cbio():
    return make_record(
        "cbio-x",
        identifiers=[(IdScheme.CBIOPORTAL_STUDY, "brca_broad")],
        repo="cBioPortal",
    )


def _htan():
    return make_record("htan-x", identifiers=[(IdScheme.SYNAPSE, "syn22093319")], repo="HTAN")


def test_route_uses_the_record_identifiers_and_numbers_people_before_agents():
    steps = access.derive(_gdc())
    joined = " ".join(f"{s.action} {s.detail} {s.cli_snippet}" for s in steps)
    assert "TCGA-XX" in joined
    assert "phs000178" in joined
    assert [s.order for s in steps] == list(range(1, len(steps) + 1))
    audiences = [s.audience for s in steps]
    first_agent = audiences.index(AccessAudience.AGENT)
    assert all(a == AccessAudience.HUMAN for a in audiences[:first_agent])
    assert all(a == AccessAudience.AGENT for a in audiences[first_agent:])


def test_generated_steps_cite_the_policy_they_apply():
    for rec in (_gdc(), _pdc(), _idc(), _cbio(), _htan()):
        steps = access.derive(rec)
        assert steps, rec.id
        assert all(s.evidence and access.is_derived(s) for s in steps)
        assert all(e.method == Method.DERIVED for s in steps for e in s.evidence)


def test_controlled_and_open_gdc_routes_do_not_overclaim():
    controlled = _gdc()
    controlled.access.open_components = []
    actions = [s.action for s in access.derive(controlled)]
    assert not any("without an account" in action for action in actions)
    assert any("dbGaP" in action for action in actions)
    request = next(s for s in access.derive(controlled) if "dbGaP" in s.action)
    assert "eRA Commons account" in request.requires

    open_only = _gdc()
    open_only.access.controlled_components = []
    actions = [s.action for s in access.derive(open_only)]
    assert not any("dbGaP" in action for action in actions)
    assert any("without an account" in action for action in actions)


@pytest.mark.parametrize(
    "builder,token",
    [(_pdc, "PDC000120"), (_idc, "tcga_brca"), (_cbio, "brca_broad"), (_htan, "syn22093319")],
)
def test_each_supported_repository_gets_a_route_with_its_accession(builder, token):
    steps = access.derive(builder())
    assert steps
    assert token in " ".join(f"{s.detail} {s.cli_snippet}" for s in steps)
    assert any(s.audience == AccessAudience.AGENT for s in steps)


def test_unknown_repository_gets_no_invented_route():
    assert access.derive(make_record("other-x", repo="SomewhereElse")) == []


def test_curated_human_route_is_preserved_and_gets_machine_steps_once():
    rec = _cbio()
    rec.access_steps = [
        AccessStep(
            order=1,
            action="Email the study team",
            evidence=[Evidence(method=Method.CURATED, source_label="Expert review")],
        )
    ]
    access.apply_all([rec])
    assert rec.access_steps[0].action == "Email the study team"
    assert any(
        s.audience == AccessAudience.AGENT and access.is_derived(s) for s in rec.access_steps
    )
    first = len(rec.access_steps)
    access.apply_all([rec])
    assert len(rec.access_steps) == first


# ------------------------------------------------------------------------------------
# The snippets have to run.
#
# Every one of these was verified against the live public API on 2026-09-20, and three
# of them had already rotted: the GDC filter was short a closing brace, filesPerStudy
# was keyed on the pdc_study_id (which returns the right row count with every column
# null), and IDCClient.get_series does not exist. A broken snippet renders perfectly,
# so the shape is pinned here rather than left to a reader to discover.
# ------------------------------------------------------------------------------------


def _snippets(rec) -> str:
    return "\n".join(s.cli_snippet or "" for s in access.derive(rec))


def test_gdc_agent_filter_json_is_balanced():
    text = _snippets(_gdc())
    assert "api.gdc.cancer.gov/files" in text
    for line in text.splitlines():
        if "filters=" not in line:
            continue
        payload = line[line.index("filters=") :]
        assert payload.count("{") == payload.count("}"), payload
        assert payload.count("[") == payload.count("]"), payload


def test_pdc_agent_snippet_resolves_the_study_uuid():
    text = _snippets(_pdc())
    assert "study(pdc_study_id:" in text
    assert "filesPerStudy(study_id:" in text
    assert "filesPerStudy(pdc_study_id" not in text
    assert "proteomic.datacommons.cancer.gov/graphql" in text


def test_idc_snippets_only_call_methods_idc_index_has():
    text = _snippets(_idc())
    assert "download_from_selection(" in text
    # IDCClient exposes no get_series; the collection is filtered out of .index.
    assert ".get_series(" not in text
    assert "collection_id" in text
