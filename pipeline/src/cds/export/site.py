"""Write the artifacts the website and the agent API read.

Three audiences, one source of truth:

  - the site needs a slim search index plus one file per dataset,
  - a human wants a spreadsheet and a bulk download,
  - an agent wants schema.org/DCAT JSON-LD and an MLCommons Croissant description, plus
    a plain-language brief telling it what the dataset is for and how to start.

Everything is generated, never hand-edited, and every file carries the build timestamp
and the pipeline version so a reader can tell how fresh it is.
"""

from __future__ import annotations

import csv
import io
import shutil
from collections import Counter
from datetime import UTC, datetime
from typing import Any

import orjson

from cds import __version__, subjects
from cds.clinical import VERDICT_FIELDS, is_non_answer
from cds.model import DatasetRecord, ReuseTier
from cds.paths import DIST_DIR, WEB_DATA_DIR, ensure_dirs
from cds.reuse import markers

SITE_NAME = "Cancer Data Showcase"
LICENSE_CONTENT = "https://creativecommons.org/licenses/by/4.0/"
LICENSE_CODE = "https://opensource.org/licenses/MIT"


def _w(path, obj: Any, *, indent: bool = False) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    opts = orjson.OPT_INDENT_2 if indent else 0
    data = orjson.dumps(obj, option=opts | orjson.OPT_NON_STR_KEYS)
    path.write_bytes(data)
    return len(data)


# ---------------------------------------------------------------------------------------
# slim index for search
# ---------------------------------------------------------------------------------------


def search_row(r: DatasetRecord) -> dict[str, Any]:
    mods = sorted({a.modality.value for a in r.assays})
    m = r.reuse_metrics
    return {
        "id": r.id,
        "title": r.title,
        "short_title": r.short_title,
        "one_liner": r.one_liner,
        "summary": (r.summary or "")[:400] or None,
        "repository": r.repository.short_name if r.repository else None,
        "repositories": sorted(
            {r.repository.short_name} | {x.short_name for x in r.additional_repositories}
        )
        if r.repository
        else [],
        "program": r.program_name,
        "nci_program": r.nci_program,
        "cancer_types": [t.label for t in r.cancer_types][:8],
        "primary_sites": r.primary_sites[:8],
        "subjects": list(r.subject.tissues),
        "subject_scope": r.subject.scope.value,
        "modalities": mods,
        "n_modalities": len(mods),
        "n_cases": r.cohort.n_cases,
        "n_samples": r.cohort.n_samples,
        "access_tier": r.access.tier.value,
        "has_followup": r.longitudinal.has_followup,
        "has_survival_endpoint": r.longitudinal.has_survival_endpoint,
        "median_followup_months": r.longitudinal.median_followup_months,
        "has_treatment_response": r.longitudinal.has_treatment_response,
        "is_pediatric": r.is_pediatric,
        "population_flags": population_flags(r),
        "n_verified_reuse": m.n_by_tier.get(ReuseTier.T3_ANALYZED.value),
        "n_reuse_examined": m.n_reuse_examined,
        "n_citations_to_primary_publication": m.n_citations_to_primary_publication,
        "reuse_gap_index": m.reuse_gap_index,
        "expected_reuse": m.expected_reuse,
        "reuse_gap_percentile": m.reuse_gap_percentile,
        "has_citable_accession": m.has_citable_accession,
        "is_underexplored": r.underexplored.is_underexplored,
        "is_showcase": r.is_showcase,
        "n_research_questions": len(r.useful_for),
        "n_limitations": len(r.limitations),
        "n_workbooks": sum(1 for a in r.analysis_examples if a.workbook_path),
        "review_status": r.review.status.value,
        "tags": r.tags,
        "search_text": r.search_text or build_search_text(r),
    }


# Spellings of the United States seen across the source repositories. A cohort whose
# only recorded country is one of these is domestic, not international.
US_LABELS = {
    "united states",
    "united states of america",
    "usa",
    "us",
    "u.s.",
    "u.s.a.",
}


def population_flags(r: DatasetRecord) -> list[str]:
    """Coarse population descriptors used as a browse facet.

    Derived from the demographic counts we actually measured, so the facet reflects the
    cohort rather than the study's stated aims.
    """
    flags: list[str] = []
    race = r.cohort.demographics.race
    total = sum(race.values())
    # The shared non-answer rule, not a local list: registries write refusal and
    # ignorance a dozen ways, and a facet that counts "Pt Refused To Answer" as a race
    # group can label a cohort by a category nobody chose.
    informative = {k: v for k, v in race.items() if not is_non_answer(k)}
    if total and informative:
        for group, n in informative.items():
            if n / total >= 0.5 and "white" not in group.lower():
                flags.append(f"majority {group}")
        nonwhite = sum(v for k, v in informative.items() if "white" not in k.lower())
        if total and nonwhite / total >= 0.3:
            flags.append("substantial non-white representation")
    if total and not informative:
        flags.append("race not recorded")
    if r.is_pediatric:
        flags.append("pediatric")
    # Only claim non-US enrolment when a country other than the US is actually recorded.
    # Flagging on the mere presence of country data labelled three US-only GDC cohorts
    # (TCGA-KIRC, TCGA-KICH, RC-PTCL) as international, which is the opposite of true.
    countries = r.cohort.demographics.country_or_region
    non_us = {k: v for k, v in countries.items() if k.strip().lower() not in US_LABELS}
    if non_us and sum(non_us.values()) > 0:
        flags.append("non-US enrolment recorded")
    return sorted(set(flags))


def build_search_text(r: DatasetRecord) -> str:
    parts = [
        r.title,
        r.short_title or "",
        r.summary or "",
        r.one_liner or "",
        " ".join(r.aliases),
        " ".join(t.label for t in r.cancer_types),
        " ".join(r.primary_sites),
        " ".join(a.label for a in r.assays),
        " ".join(q.question for q in r.useful_for),
        " ".join(q.rationale for q in r.useful_for),
        " ".join(v.label or v.name for v in r.clinical_variables),
        " ".join(r.tags),
        " ".join(i.value for i in r.identifiers),
        r.program_name or "",
    ]
    return " ".join(p for p in parts if p)[:6000]


def search_corpus(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    """The free-text half of the index, split out so it can be fetched separately.

    `search_text` is 40% of index.json and is needed only once somebody actually types.
    Shipping it inline with the browse page meant every visitor downloaded it whether or
    not they searched; as its own file it is fetched after first paint and cached by the
    browser across visits, under the same permissive CORS headers as everything in /data.
    """
    return [
        {"id": row["id"], "text": row.get("search_text") or ""}
        for row in rows
        if row.get("search_text")
    ]


# ---------------------------------------------------------------------------------------
# facets
# ---------------------------------------------------------------------------------------


def build_facets(rows: list[dict[str, Any]]) -> dict[str, Any]:
    def count(key: str, listlike: bool = False) -> list[dict[str, Any]]:
        c: Counter[str] = Counter()
        for row in rows:
            v = row.get(key)
            if v is None:
                continue
            if listlike and isinstance(v, list):
                c.update(str(x) for x in v if x)
            elif not listlike:
                c[str(v)] += 1
        return [{"value": k, "count": n} for k, n in c.most_common()]

    return {
        "repository": count("repositories", listlike=True),
        "program": count("program"),
        "cancer_type": count("cancer_types", listlike=True),
        "primary_site": count("primary_sites", listlike=True),
        "subject": count("subjects", listlike=True),
        "subject_scope": count("subject_scope"),
        "modality": count("modalities", listlike=True),
        "access_tier": count("access_tier"),
        "population": count("population_flags", listlike=True),
        "tag": count("tags", listlike=True),
        "review_status": count("review_status"),
        "capability": [
            {
                "value": "survival analysis possible",
                "count": sum(1 for r in rows if r.get("has_survival_endpoint")),
            },
            {
                "value": "treatment response recorded",
                "count": sum(1 for r in rows if r.get("has_treatment_response")),
            },
            {
                "value": "longitudinal follow-up",
                "count": sum(1 for r in rows if r.get("has_followup")),
            },
            {
                "value": "three or more modalities",
                "count": sum(1 for r in rows if (r.get("n_modalities") or 0) >= 3),
            },
            {
                "value": "open access",
                "count": sum(1 for r in rows if r.get("access_tier") == "open"),
            },
            {
                "value": "underexplored",
                "count": sum(1 for r in rows if r.get("is_underexplored")),
            },
            {
                "value": "has runnable workbook",
                "count": sum(1 for r in rows if (r.get("n_workbooks") or 0) > 0),
            },
        ],
    }


# ---------------------------------------------------------------------------------------
# corpus-level statistics, used on the landing page and in the submission
# ---------------------------------------------------------------------------------------


def corpus_stats(records: list[DatasetRecord], rows: list[dict[str, Any]]) -> dict[str, Any]:
    with_case_count = [r for r in records if r.cohort.n_cases]
    n_cases = sum(r.cohort.n_cases or 0 for r in with_case_count)
    assessed = [r for r in records if r.reuse_metrics.reuse_gap_index is not None]
    uncitable = [r for r in records if r.reuse_metrics.has_citable_accession is False]
    # Has an accession, but Europe PMC's tokenization could not be corrected for it, so
    # no count is published. A different gap from "no accession", and one the site has to
    # be able to size rather than leave as a silent blank on some pages and not others.
    unmeasurable = [
        r
        for r in records
        if r.reuse_metrics.has_citable_accession is True
        and r.reuse_metrics.n_by_tier.get(ReuseTier.T3_ANALYZED.value) is None
    ]
    without_marker = [r for r in records if not markers.authoritative_marker_pmids(r)]
    with_cites = [
        r for r in records if (r.reuse_metrics.n_citations_to_primary_publication or 0) > 0
    ]
    ratios = [
        r.reuse_metrics.citation_to_reuse_ratio
        for r in records
        if r.reuse_metrics.citation_to_reuse_ratio
    ]
    # How far the central measurement actually reaches. Until every repository's clinical
    # tables are probed the same way, the six verdicts cover only part of the corpus, and
    # the site should be able to say how much rather than imply all of it.
    verdict_fields = {f for fs in VERDICT_FIELDS.values() for f in fs}
    measured = [
        r for r in records if any(v.harmonized_name in verdict_fields for v in r.clinical_variables)
    ]
    measured_by_repo: Counter[str] = Counter(
        r.repository.short_name for r in measured if r.repository
    )
    total_by_repo: Counter[str] = Counter(r.repository.short_name for r in records if r.repository)
    return {
        "generated_at": datetime.now(UTC).isoformat(),
        "pipeline_version": __version__,
        "n_datasets": len(records),
        "n_showcase": sum(1 for r in records if r.is_showcase),
        "n_underexplored": sum(1 for r in records if r.underexplored.is_underexplored),
        "n_expert_reviewed": sum(1 for r in records if r.review.status.value == "expert_reviewed"),
        "n_cases_total": n_cases,
        "n_datasets_with_case_count": len(with_case_count),
        "n_clinically_measured": len(measured),
        "clinically_measured_by_repository": {
            repo: {"measured": measured_by_repo.get(repo, 0), "total": n}
            for repo, n in sorted(total_by_repo.items())
        },
        "n_repositories": len({r.repository.short_name for r in records if r.repository}),
        "n_distinct_modalities": len({a.modality.value for r in records for a in r.assays}),
        "n_with_survival": sum(1 for r in rows if r.get("has_survival_endpoint")),
        "n_with_treatment_response": sum(1 for r in rows if r.get("has_treatment_response")),
        "n_reuse_assessed": len(assessed),
        "n_without_citable_accession": len(uncitable),
        "n_reuse_unmeasurable": len(unmeasurable),
        "n_without_authoritative_marker_paper": len(without_marker),
        "n_with_publication_citations": len(with_cites),
        "median_citation_to_reuse_ratio": (
            round(sorted(ratios)[len(ratios) // 2], 1) if ratios else None
        ),
        "n_workbook_attachments": sum(
            1 for r in records for a in r.analysis_examples if a.workbook_path
        ),
        "n_datasets_with_workbook": sum(
            1 for r in records if any(a.workbook_path for a in r.analysis_examples)
        ),
        "n_distinct_workbooks": len(
            {a.workbook_path for r in records for a in r.analysis_examples if a.workbook_path}
        ),
        "n_grants_linked": len(
            {g.core_project_num for r in records for g in r.grants if g.core_project_num}
        ),
        "n_reuse_studies_verified": sum(
            1
            for r in records
            for x in r.reuse
            if x.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)
        ),
    }


# ---------------------------------------------------------------------------------------
# research-question index
# ---------------------------------------------------------------------------------------


def question_index(records: list[DatasetRecord]) -> list[dict[str, Any]]:
    """Flatten every curated research question so the site can browse by question."""
    out: list[dict[str, Any]] = []
    for r in records:
        for i, q in enumerate(r.useful_for):
            out.append(
                {
                    "qid": f"{r.id}#q{i + 1}",
                    "dataset_id": r.id,
                    "dataset_title": r.title,
                    "question": q.question,
                    "rationale": q.rationale,
                    "feasibility": q.feasibility.value,
                    "approx_n": q.approx_n,
                    "modalities": [m.value for m in q.required_modalities],
                    "topics": q.topics,
                    "access_tier": r.access.tier.value,
                    "is_underexplored": r.underexplored.is_underexplored,
                }
            )
    return out


# ---------------------------------------------------------------------------------------
# tabular export
# ---------------------------------------------------------------------------------------

CSV_COLUMNS = [
    "id",
    "title",
    "short_title",
    "repository",
    "program",
    "nci_program",
    "cancer_types",
    "primary_sites",
    "subjects",
    "subject_scope",
    "modalities",
    "n_cases",
    "n_samples",
    "access_tier",
    "has_followup",
    "median_followup_months",
    "has_treatment_response",
    "n_verified_reuse",
    "n_citations_to_primary_publication",
    "reuse_gap_index",
    "is_underexplored",
    "is_showcase",
    "review_status",
    "landing_page_url",
]


def to_csv(records: list[DatasetRecord], rows: list[dict[str, Any]]) -> str:
    by_id = {r.id: r for r in records}
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=CSV_COLUMNS, extrasaction="ignore")
    w.writeheader()
    for row in rows:
        rec = by_id[row["id"]]
        w.writerow(
            {
                **{
                    k: (
                        "; ".join(str(x) for x in v)
                        if isinstance(v, list)
                        else ("" if v is None else v)
                    )
                    for k, v in row.items()
                    if k in CSV_COLUMNS
                },
                "landing_page_url": rec.landing_page_url or "",
            }
        )
    return buf.getvalue()


# ---------------------------------------------------------------------------------------
# main entry point
# ---------------------------------------------------------------------------------------


def write_all(
    records: list[DatasetRecord], *, extra_manifest: dict[str, Any] | None = None
) -> dict[str, Any]:
    ensure_dirs()
    for record in records:
        if not subjects.is_curated(record.subject):
            record.subject = subjects.assign(record)
    rows = [search_row(r) for r in records]
    facets = build_facets(rows)
    stats = corpus_stats(records, rows)
    questions = question_index(records)

    # Executed notebooks are part of the public product, not only repository artifacts.
    # Attach a stable local download before serializing records, then copy the notebooks
    # beside the other generated data so this also works while the source repo is private.
    from cds import workbooks as workbook_build

    notebook_files = {p.stem: p for p in workbook_build.WORKBOOK_OUT.glob("*.ipynb")}
    for record in records:
        for example in record.analysis_examples:
            if not example.workbook_path:
                continue
            name = example.template_source or example.workbook_path.rsplit("/", 1)[-1].removesuffix(".py")
            if name in notebook_files:
                example.notebook_download_url = f"/data/notebooks/{name}.ipynb"

    # Agent package links are a pure function of the record id, so they are set before
    # anything is serialized. They used to be filled in afterwards, which meant every
    # record had to be dumped and written a second time to both targets - four full
    # serializations of the corpus per export instead of one.
    for r in records:
        r.agent_package.json_url = f"/data/datasets/{r.id}.json"
        r.agent_package.jsonld_url = f"/data/jsonld/{r.id}.jsonld"
        r.agent_package.croissant_url = f"/data/croissant/{r.id}.json"
        r.agent_package.instructions_url = f"/data/agent/{r.id}.md"

    written: dict[str, int] = {}
    for name, obj, indent in (
        ("index.json", rows, False),
        ("search.json", search_corpus(rows), False),
        ("facets.json", facets, False),
        ("stats.json", stats, True),
        ("questions.json", questions, False),
        ("subjects.json", subjects.vocabulary(), True),
    ):
        for target in (DIST_DIR, WEB_DATA_DIR):
            written[f"{target.name}/{name}"] = _w(target / name, obj, indent=indent)

    for target in (DIST_DIR, WEB_DATA_DIR):
        notebook_dir = target / "notebooks"
        notebook_dir.mkdir(parents=True, exist_ok=True)
        for source in notebook_files.values():
            shutil.copyfile(source, notebook_dir / source.name)
        written[f"{target.name}/notebooks/*.ipynb"] = sum(
            source.stat().st_size for source in notebook_files.values()
        )

    # One dump per record, written to both targets. The dump dominates export time.
    n_bytes = 0
    for r in records:
        # Keep workbook-bearing records readable in the checked-in corpus. These records
        # are the ones researchers open most often while adapting an example, and the
        # existing corpus already stores them with two-space indentation.
        options = orjson.OPT_NON_STR_KEYS
        if r.analysis_examples:
            options |= orjson.OPT_INDENT_2
        payload = orjson.dumps(r.model_dump(mode="json"), option=options)
        n_bytes += len(payload)
        for target in (DIST_DIR, WEB_DATA_DIR):
            path = target / "datasets" / f"{r.id}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)
    for target in (DIST_DIR, WEB_DATA_DIR):
        written[f"{target.name}/datasets/*.json"] = n_bytes

    # Agent packages: JSON-LD, Croissant and a plain-language brief per dataset.
    from cds.export import agent as agent_export

    agent_counts = agent_export.write_all(records, stats)

    (DIST_DIR / "datasets.csv").write_text(to_csv(records, rows))
    _w(
        DIST_DIR / "manifest.json",
        {
            "site": SITE_NAME,
            "license_content": LICENSE_CONTENT,
            "license_code": LICENSE_CODE,
            **stats,
            **(extra_manifest or {}),
            "agent_packages": agent_counts,
            "bytes_written": written,
        },
        indent=True,
    )
    return {"n_records": len(records), "n_questions": len(questions), **stats}
