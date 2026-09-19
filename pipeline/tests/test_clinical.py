"""The shared clinical vocabulary and the per-repository profilers that feed it.

These cover the arithmetic every analysis verdict rests on: separating absent from
populated-but-uninformative, refusing to claim a measurement that was never made, and
keeping one repository's spelling of a field comparable with another's.
"""

from __future__ import annotations

import pytest

from cds import clinical as cl
from cds.sources import cbioportal as cb
from cds.sources import pdc


class TestValueCounts:
    def test_separates_absent_from_uninformative(self):
        v = cl.from_value_counts(
            name="demographic.vital_status",
            harmonized_name=cl.VITAL_STATUS,
            n_total=100,
            values={"Alive": 40, "not reported": 50},
            n_missing=10,
        )
        assert v is not None
        assert v.n_nonmissing == 90
        assert v.n_not_reported == 50
        assert v.n_informative == 40
        assert v.coverage_pct == 40.0
        assert v.populated_pct == 90.0

    def test_a_field_filled_only_with_non_answers_is_measured_as_zero(self):
        v = cl.from_value_counts(
            name="demographic.race",
            harmonized_name=cl.RACE,
            n_total=18004,
            values={"not reported": 18004},
            n_missing=0,
        )
        assert v is not None
        assert v.populated_pct == 100.0
        assert v.coverage_pct == 0.0

    def test_infers_missing_when_the_source_does_not_report_it(self):
        v = cl.from_value_counts(name="x", harmonized_name=None, n_total=10, values={"a": 4})
        assert v is not None
        assert v.n_nonmissing == 4
        assert v.populated_pct == 40.0

    def test_repeated_fields_claim_no_informative_split(self):
        v = cl.from_value_counts(
            name="diagnoses.treatments.treatment_type",
            harmonized_name=cl.TREATMENT_TYPE,
            n_total=100,
            values={"Chemotherapy": 180, "not reported": 20},
            n_missing=40,
            is_repeated=True,
        )
        assert v is not None
        assert v.coverage_pct is None
        assert v.n_informative is None
        assert v.is_repeated

    def test_returns_nothing_when_there_is_no_denominator(self):
        assert cl.from_value_counts(name="x", harmonized_name=None, n_total=0, values={}) is None

    def test_label_and_category_come_from_the_vocabulary(self):
        v = cl.from_value_counts(
            name="pdc:vital_status", harmonized_name=cl.VITAL_STATUS, n_total=5, values={"Dead": 5}
        )
        assert v is not None
        assert v.label == "Vital status"
        assert v.category == "outcome"


class TestNonAnswers:
    @pytest.mark.parametrize(
        "value",
        ["not reported", "Not Reported", "unknown", "NA", "n/a", "No Value Entered", ""],
    )
    def test_recognises_a_non_answer_in_any_repository_spelling(self, value):
        assert cl.is_non_answer(value)

    @pytest.mark.parametrize("value", ["white", "Stage IA", "Dead", "G3"])
    def test_a_real_value_is_not_a_non_answer(self, value):
        assert not cl.is_non_answer(value)


class TestResponseVocabulary:
    @pytest.mark.parametrize(
        "value",
        ["Complete Response", "partial response", "SD", "pd-progressive disease", "CR"],
    )
    def test_accepts_a_response(self, value):
        assert cl.is_response_value(value)

    @pytest.mark.parametrize(
        "value",
        [
            "tf-tumor free",
            "wt-with tumor",
            "pdm-persistent distant metastasis",
            "not reported",
            "Chemotherapy",
        ],
    )
    def test_rejects_a_disease_state_or_a_treatment(self, value):
        assert not cl.is_response_value(value)


class TestHarmonizedIndex:
    def test_keeps_the_better_covered_of_two_fields_for_one_concept(self):
        weak = cl.from_value_counts(
            name="pdc:tumor_stage",
            harmonized_name=cl.AJCC_PATHOLOGIC_STAGE,
            n_total=100,
            values={"Not Reported": 100},
            n_missing=0,
        )
        strong = cl.from_value_counts(
            name="pdc:ajcc_pathologic_stage",
            harmonized_name=cl.AJCC_PATHOLOGIC_STAGE,
            n_total=100,
            values={"Stage IA": 97},
            n_missing=3,
        )
        best = cl.by_harmonized([weak, strong])
        assert best[cl.AJCC_PATHOLOGIC_STAGE].name == "pdc:ajcc_pathologic_stage"

    def test_every_field_a_verdict_reads_is_in_the_vocabulary(self):
        for fields in cl.VERDICT_FIELDS.values():
            for field in fields:
                assert field in cl.HARMONIZED_FIELDS


class TestCbioportal:
    def test_strips_the_event_code_from_a_status_value(self):
        assert cb._strip_code("1:DECEASED") == "DECEASED"
        assert cb._strip_code("0:No recurrence") == "No recurrence"
        assert cb._strip_code("Female") == "Female"

    def test_counts_events_only_from_informative_values(self):
        events, informative = cb._event_share(
            {"1:DECEASED": 45, "0:LIVING": 559, "NA": 12, "Unknown": 3}
        )
        assert events == 45
        assert informative == 604

    def test_a_survival_endpoint_needs_a_time_events_and_enough_patients(self):
        counts = {"OS_STATUS": {"1:DECEASED": 45, "0:LIVING": 559}}
        with_time = cb._longitudinal({"OS_MONTHS": ([1.0] * 604, 604)}, counts, None, "s")
        assert with_time.has_survival_endpoint is True
        assert "overall survival" in with_time.survival_endpoints

        without_time = cb._longitudinal({}, counts, None, "s")
        assert without_time.has_survival_endpoint is False

    def test_treatment_records_alone_are_not_a_response(self):
        longi = cb._longitudinal({}, {"OS_STATUS": {"0:LIVING": 50}}, None, "s", n_treated=21473)
        assert longi.has_treatment_response is False
        assert longi.response_criteria == []

    def test_a_response_field_with_recist_values_is_a_response(self):
        longi = cb._longitudinal(
            {},
            {"RESPONSE": {"Complete Response": 16, "Progressive Disease": 56, "NA": 367}},
            None,
            "s",
        )
        assert longi.has_treatment_response is True
        assert "Complete Response" in longi.response_criteria

    def test_every_response_attribute_maps_to_the_treatment_outcome_concept(self):
        for attr in cb.RESPONSE_ATTRIBUTES:
            assert cb.STANDARD_ATTRIBUTES[attr] == cl.TREATMENT_OUTCOME


class TestPdc:
    def test_a_number_written_as_a_string_or_as_na(self):
        assert pdc._num("889") == 889.0
        assert pdc._num("889.00") == 889.0
        assert pdc._num("N/A") is None
        assert pdc._num(None) is None
        assert pdc._num("") is None

    def test_follow_up_takes_the_latest_contact_per_case(self):
        # A case with both a last-contact date and a death date has one follow-up time,
        # not two; pooling them would put the same patient in the median twice.
        longi = pdc._longitudinal(
            counts={
                "vital_status": {"Dead": 30, "Alive": 70},
                "progression_or_recurrence": {},
            },
            numbers={"days_to_recurrence": [], "days_to_death": [], "age_at_diagnosis": []},
            followup_days=[float(d) for d in range(1, 101)],
            responses=[],
            n_cases=100,
            at=None,
            pdc_study_id="PDC000000",
        )
        assert longi.n_cases_with_followup == 100
        assert longi.has_survival_endpoint is True

    def test_no_survival_endpoint_without_enough_deaths(self):
        longi = pdc._longitudinal(
            counts={"vital_status": {"Alive": 100}, "progression_or_recurrence": {}},
            numbers={"days_to_recurrence": [], "days_to_death": [], "age_at_diagnosis": []},
            followup_days=[100.0] * 100,
            responses=[],
            n_cases=100,
            at=None,
            pdc_study_id="PDC000000",
        )
        assert longi.has_survival_endpoint is False

    def test_treatment_coverage_is_counted_per_case_not_per_record(self):
        rows = [
            {
                "case_id": "a",
                "treatments": [{"therapeutic_agents": "X"}, {"therapeutic_agents": "Y"}],
            },
            {"case_id": "b", "treatments": []},
        ]
        variables, responses = _treatment_vars(rows, n_cases=2)
        agents = next(v for v in variables if v.harmonized_name == cl.THERAPEUTIC_AGENTS)
        assert agents.n_nonmissing == 1
        assert agents.populated_pct == 50.0
        assert responses == []

    def test_response_values_are_picked_out_of_treatment_outcomes(self):
        rows = [
            {"case_id": "a", "treatments": [{"treatment_outcome": "Complete Response"}]},
            {"case_id": "b", "treatments": [{"treatment_outcome": "Not Reported"}]},
        ]
        _, responses = _treatment_vars(rows, n_cases=2)
        assert responses == ["Complete Response"]


def _treatment_vars(rows, n_cases):
    from datetime import UTC, datetime

    return pdc._treatment_variables(rows, n_cases, datetime.now(UTC), "PDC000000")
