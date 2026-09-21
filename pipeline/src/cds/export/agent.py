"""Machine-readable packages, for agents rather than for people.

Three formats, because three different consumers need three different things:

  - **schema.org/Dataset + DCAT JSON-LD** is what search engines and data catalogs
    understand, and it is how this corpus becomes findable outside its own website.
  - **MLCommons Croissant** is the emerging standard for describing a dataset to a
    machine-learning pipeline, and it carries the field-level detail a training run
    needs. It is also the format an AI-readiness assessment expects.
  - **A plain-language agent brief** is what a language model actually reads. It states
    what the dataset is for, what it cannot support, and the first concrete step - in
    that order, because an agent that reads capabilities before constraints will plan an
    analysis the data cannot sustain.

The last of these is the one that does not exist elsewhere. Structured metadata tells an
agent what fields are present; it does not tell it that vital status is populated for
every case and informative for none.
"""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from typing import Any

from cds import __version__
from cds.model import DatasetRecord, ReuseTier, Severity
from cds.paths import DIST_DIR, WEB_DATA_DIR, ensure_dirs
from cds.subjects import TISSUES

# The public origin baked into every agent package, JSON-LD document and llms.txt.
# Set CDS_SITE_URL to the deployed host before `cds export`; the placeholder is what a
# reader sees when nobody did.
SITE_URL = os.environ.get("CDS_SITE_URL", "https://cd2s.example.org").rstrip("/")
LICENSE = "https://creativecommons.org/licenses/by/4.0/"


def _distributions(rec: DatasetRecord) -> list[dict[str, Any]]:
    out = []
    if rec.landing_page_url:
        out.append(
            {
                "@type": "DataDownload",
                "name": f"{rec.repository.short_name if rec.repository else 'Repository'} portal",
                "contentUrl": rec.landing_page_url,
                "encodingFormat": "text/html",
            }
        )
    out.append(
        {
            "@type": "DataDownload",
            "name": "CD2S structured record",
            "contentUrl": f"{SITE_URL}/data/datasets/{rec.id}.json",
            "encodingFormat": "application/json",
        }
    )
    return out


def to_schema_org(rec: DatasetRecord) -> dict[str, Any]:
    """schema.org/Dataset with DCAT terms, as JSON-LD."""
    identifiers = [i.url or f"{i.scheme.value}:{i.value}" for i in rec.identifiers[:12]]
    keywords = sorted(
        {t.label for t in rec.cancer_types}
        | set(rec.primary_sites)
        | {f"NCIt:{TISSUES[code]['nci']}" for code in rec.subject.tissues}
        | {a.modality.value.replace("_", " ") for a in rec.assays}
        | set(rec.tags)
    )
    citations = [
        {
            "@type": "ScholarlyArticle",
            "name": p.title,
            "identifier": f"https://doi.org/{p.doi}"
            if p.doi
            else (f"https://pubmed.ncbi.nlm.nih.gov/{p.pmid}/" if p.pmid else None),
            "datePublished": str(p.year) if p.year else None,
        }
        for p in rec.primary_publications[:5]
    ]
    funders = [
        {
            "@type": "Grant",
            "identifier": g.core_project_num,
            "name": g.title,
            "funder": {"@type": "Organization", "name": "National Cancer Institute"},
            "url": g.reporter_url,
        }
        for g in rec.grants[:20]
        if g.core_project_num
    ]

    return {
        "@context": {
            "@vocab": "https://schema.org/",
            "dcat": "http://www.w3.org/ns/dcat#",
            "dct": "http://purl.org/dc/terms/",
        },
        "@type": "Dataset",
        "@id": f"{SITE_URL}/datasets/{rec.id}",
        "name": rec.title,
        "alternateName": rec.aliases[:6],
        "description": rec.summary or rec.one_liner or rec.title,
        "url": f"{SITE_URL}/datasets/{rec.id}",
        "identifier": identifiers,
        "keywords": keywords,
        "license": LICENSE,
        "isAccessibleForFree": rec.access.tier.value == "open",
        "conditionsOfAccess": rec.access.mechanism,
        "creator": [
            {"@type": "Organization", "name": inst} for inst in (rec.generating_institutions or [])
        ]
        or [{"@type": "Organization", "name": rec.program_name or "NCI-supported"}],
        "publisher": {
            "@type": "Organization",
            "name": rec.repository.name if rec.repository else "NCI",
            "url": rec.repository.url if rec.repository else None,
        },
        "includedInDataCatalog": {
            "@type": "DataCatalog",
            "name": "CD2S",
            "url": SITE_URL,
        },
        "distribution": _distributions(rec),
        "citation": [c for c in citations if c.get("identifier")],
        "funding": funders,
        "dateModified": rec.retrieved_at.isoformat() if rec.retrieved_at else None,
        "datePublished": rec.release_date.isoformat() if rec.release_date else None,
        "variableMeasured": [
            {
                "@type": "PropertyValue",
                "name": v.label or v.name,
                "description": (
                    f"Populated for {v.populated_pct}% of cases"
                    + (
                        f", informative for {v.coverage_pct}%"
                        if v.coverage_pct is not None
                        else " (one-to-many field; per-case shares not derivable)"
                    )
                ),
            }
            for v in rec.clinical_variables[:40]
        ],
        "measurementTechnique": [a.label for a in rec.assays],
    }


def to_croissant(rec: DatasetRecord) -> dict[str, Any]:
    """MLCommons Croissant description.

    We use `recordSet` to expose what a machine-learning consumer most needs and is least
    likely to be told: per-field completeness, and the explicit list of things this
    dataset must not be used for.
    """
    fields = []
    for v in rec.clinical_variables[:60]:
        fields.append(
            {
                "@type": "cr:Field",
                "@id": f"clinical/{v.name}",
                "name": v.label or v.name,
                "description": (
                    f"Category: {v.category}. Populated for {v.populated_pct}% of cases"
                    + (
                        f"; informative (excluding non-answers) for {v.coverage_pct}%."
                        if v.coverage_pct is not None
                        else "; one-to-many field, per-case shares not derivable."
                    )
                ),
                "dataType": "sc:Text",
            }
        )

    return {
        "@context": {
            "@vocab": "https://schema.org/",
            "cr": "http://mlcommons.org/croissant/",
            "sc": "https://schema.org/",
        },
        "@type": "sc:Dataset",
        "conformsTo": "http://mlcommons.org/croissant/1.0",
        "name": rec.id,
        "alternateName": rec.title,
        "description": rec.summary or rec.one_liner or rec.title,
        "url": f"{SITE_URL}/datasets/{rec.id}",
        "license": LICENSE,
        "citeAs": (rec.primary_publications[0].title if rec.primary_publications else rec.title),
        "version": rec.version or "as-retrieved",
        "datePublished": rec.release_date.isoformat() if rec.release_date else None,
        "recordSet": [
            {
                "@type": "cr:RecordSet",
                "@id": "clinical",
                "name": "Clinical variables with measured completeness",
                "description": (
                    "Completeness is measured from the source repository's own records. "
                    "A field populated entirely with non-answers is reported as populated "
                    "but not informative, because it blocks an analysis just as surely as "
                    "an absent field."
                ),
                "field": fields,
            }
        ],
        "cr:usageGuidance": {
            "supportedQuestions": [q.question for q in rec.useful_for],
            "blockingLimitations": [
                {
                    "kind": limitation.kind.value,
                    "statement": limitation.statement,
                    "rulesOut": limitation.affected_analyses,
                }
                for limitation in rec.limitations
                if limitation.severity == Severity.BLOCKING
            ],
            "inappropriateUses": [u.statement for u in rec.inappropriate_uses],
        },
    }


def to_agent_brief(rec: DatasetRecord) -> str:
    """Plain-language brief for a language model.

    Ordered deliberately: constraints before capabilities. An agent that reads what a
    dataset offers before reading what it cannot support will plan an analysis the data
    cannot sustain, and every ordering choice here is made to prevent that.
    """
    m = rec.reuse_metrics
    lines: list[str] = []
    lines.append(f"# {rec.title}")
    lines.append("")
    lines.append(f"Dataset id: {rec.id}")
    if rec.one_liner:
        lines.append(f"Summary: {rec.one_liner}")
    lines.append("")

    blocking = [x for x in rec.limitations if x.severity == Severity.BLOCKING]
    lines.append("## Read this first: what these data CANNOT support")
    lines.append("")
    if blocking:
        for x in blocking:
            lines.append(f"- {x.statement}")
            if x.affected_analyses:
                lines.append(f"  Rules out: {', '.join(x.affected_analyses)}")
    else:
        lines.append(
            "- No blocking limitation has been recorded. This is not the same as there "
            "being none: check the review status below."
        )
    for u in rec.inappropriate_uses:
        lines.append(f"- Do not use for: {u.statement} ({u.reason})")
    lines.append("")

    lines.append("## What it is")
    lines.append("")
    n = rec.cohort.n_cases or rec.cohort.n_samples
    lines.append(
        f"- Cohort: {n:,} {'cases' if rec.cohort.n_cases else 'samples'}"
        if n
        else "- Cohort size not published"
    )
    if rec.cancer_types:
        lines.append(f"- Cancer types: {', '.join(t.label for t in rec.cancer_types[:6])}")
    if rec.subject.tissues:
        labels = [TISSUES[code]["label"] for code in rec.subject.tissues]
        suffix = (
            " (derived from title; not stated by repository)"
            if rec.subject.scope.value == "title_derived"
            else ""
        )
        lines.append(f"- Subject: {', '.join(labels)}{suffix}")
    else:
        lines.append(f"- Subject: {rec.subject.scope.value.replace('_', ' ')}")
    if rec.assays:
        lines.append(f"- Measurements: {', '.join(a.label for a in rec.assays[:10])}")
    lo = rec.longitudinal
    if lo.median_followup_months:
        lines.append(
            f"- Median follow-up: {lo.median_followup_months} months"
            + (
                f" (derivable for {lo.n_cases_with_followup} cases)"
                if lo.n_cases_with_followup
                else ""
            )
        )
    if lo.has_treatment_response is not None:
        lines.append(f"- Treatment response recorded: {lo.has_treatment_response}")
    lines.append(f"- Access: {rec.access.tier.value}. {rec.access.mechanism or ''}".rstrip())
    lines.append("")

    if rec.clinical_variables:
        lines.append("## Clinical field completeness")
        lines.append("")
        lines.append("Populated means a value exists; informative excludes 'not reported'.")
        lines.append("")
        for v in sorted(
            rec.clinical_variables,
            key=lambda v: -(v.coverage_pct or v.populated_pct or 0),
        )[:18]:
            share = (
                f"{v.coverage_pct}% informative"
                if v.coverage_pct is not None
                else f"{v.populated_pct}% populated (one-to-many)"
            )
            lines.append(f"- {v.label or v.name}: {share}")
        lines.append("")

    if rec.useful_for:
        lines.append("## Questions these data can support")
        lines.append("")
        for q in rec.useful_for:
            lines.append(f"- {q.question}")
            lines.append(f"  Why: {q.rationale}")
            if q.statistical_note:
                lines.append(f"  Statistical caution: {q.statistical_note}")
            if q.approx_n:
                lines.append(f"  Approximate analysable n: {q.approx_n}")
        lines.append("")

    if rec.access_steps:
        lines.append("## How to get the data")
        lines.append("")
        for s in sorted(rec.access_steps, key=lambda s: s.order):
            audience = f" [{s.audience.value}]" if s.audience else ""
            lines.append(
                f"{s.order}. {s.action}{audience}" + (f" ({s.est_time})" if s.est_time else "")
            )
            if s.detail:
                lines.append(f"   {s.detail}")
            if s.url:
                lines.append(f"   {s.url}")
            for evidence in s.evidence:
                if evidence.source_url:
                    lines.append(f"   Policy evidence: {evidence.source_url}")
        lines.append("")

    runnable = [a for a in rec.analysis_examples if a.receipt and a.receipt.executed]
    if runnable:
        lines.append("## Verified runnable starting points")
        lines.append("")
        for a in runnable:
            lines.append(f"- {a.title} ({a.language}, {a.est_runtime})")
            lines.append(f"  {a.workbook_path}")
        lines.append("")

    lines.append("## Evidence of prior reuse")
    lines.append("")
    if m.has_citable_accession is False:
        lines.append(
            "- This dataset has no accession specific enough to search for, so reuse "
            "cannot be traced through the literature. Absence of evidence here is not "
            "evidence of absence."
        )
    else:
        analyzed = m.n_by_tier.get(ReuseTier.T3_ANALYZED.value)
        if analyzed is None:
            lines.append(
                "- Reuse of these data could not be measured. Europe PMC indexes this "
                "dataset's accession as separate words, and too few of the matching "
                "articles are open access to estimate how many of them are really about "
                "this dataset. No count is given rather than an inflated one."
            )
        else:
            lines.append(f"- Articles that analyzed these data: {analyzed}")
        graded = [x for x in rec.reuse if x.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)]
        if m.n_reuse_examined and graded:
            # A null flag means nobody could check, which is not a negative answer.
            overlap_checked = [x for x in graded if x.independent_of_generators is not None]
            funding_checked = [x for x in graded if x.nci_funded_reuse is not None]
            overlap = (
                "author overlap with the generating team could not be checked for any of them"
                if not overlap_checked
                else f"{sum(1 for x in overlap_checked if x.independent_of_generators)} of "
                f"the {len(overlap_checked)} that could be checked had no author in common "
                f"with the generating team"
            )
            funding = (
                "none could be checked for NCI funding of their own"
                if not funding_checked
                else f"{sum(1 for x in funding_checked if x.nci_funded_reuse)} of the "
                f"{len(funding_checked)} that could be checked were themselves NCI funded"
            )
            lines.append(
                f"- {m.n_reuse_examined} articles matching this dataset's accession "
                f"search were retrieved and graded individually, and the strongest "
                f"{len(rec.reuse)} are kept as exemplars. Of the "
                f"{len(graded)} that analyzed the data, {overlap}, and {funding}."
            )
        if m.n_citations_to_primary_publication:
            lines.append(
                f"- Citations to the dataset's publication: "
                f"{m.n_citations_to_primary_publication} (attention, not reuse)"
            )
        if m.reuse_gap_index is not None:
            lines.append(
                f"- Reuse gap index: {m.reuse_gap_index:+.2f} "
                f"(negative means less reused than comparable datasets)"
            )
    verified = [x for x in rec.reuse if x.tier == ReuseTier.T3_ANALYZED][:5]
    for x in verified:
        p = x.publication
        lines.append(f"  - {p.title} ({p.year}) PMID {p.pmid}")
    lines.append("")

    lines.append("## Provenance")
    lines.append("")
    lines.append(f"- Review status: {rec.review.status.value}")
    if rec.review.status.value in ("machine_only", "needs_review"):
        lines.append(
            "  This page's interpretation has NOT been human-reviewed. Counts and field "
            "coverage are machine-measured and reliable; the absence of a limitations "
            "list means nobody has written one, not that there are no limitations."
        )
    if rec.retrieved_at:
        lines.append(f"- Metadata retrieved: {rec.retrieved_at.date().isoformat()}")
    lines.append(f"- Full structured record: {SITE_URL}/data/datasets/{rec.id}.json")
    lines.append("")
    return "\n".join(lines)


def _uninformative_giant(records: list[DatasetRecord]) -> tuple[DatasetRecord, int] | None:
    """The largest cohort whose vital status is recorded for all and informative for none.

    The concrete trap an agent falls into when it ranks by sample size. Looked up rather
    than written down: the example is only useful while it is true, and the corpus grows.
    """
    best: tuple[DatasetRecord, int] | None = None
    for rec in records:
        n = rec.cohort.n_cases or 0
        if n <= 0 or (best and n <= best[1]):
            continue
        for v in rec.clinical_variables:
            if (v.harmonized_name or v.name) != "demographic.vital_status":
                continue
            if (v.populated_pct or 0) >= 99 and v.coverage_pct == 0:
                best = (rec, n)
            break
    return best


def build_llms_txt(records: list[DatasetRecord], stats: dict[str, Any]) -> str:
    """The /llms.txt convention: an orientation file for language models."""
    showcase = [r for r in records if r.is_showcase]
    under = [r for r in records if r.underexplored.is_underexplored]
    trap = _uninformative_giant(records)
    trap_line = (
        f"1. Read a dataset's blocking limitations BEFORE its capabilities. "
        f"{trap[0].short_title or trap[0].title} holds {trap[1]:,} patients whose vital "
        f"status is populated for every case and informative for none; it will support "
        f"no survival analysis at any sample size."
        if trap
        else "1. Read a dataset's blocking limitations BEFORE its capabilities. A field "
        "populated for every case can still be informative for none, and then it "
        "supports no analysis at any sample size."
    )
    lines = [
        "# CD2S",
        "",
        "> A question-first guide to NCI-supported cancer datasets: what each one can "
        "answer, what it cannot, who has already reused it, and a runnable way to start. "
        f"{stats.get('n_datasets', 0)} dataset records across "
        f"{stats.get('n_repositories', 0)} repositories.",
        "",
        "Every claim carries provenance. Structured records expose measured clinical "
        "field completeness, graded reuse evidence, and explicit blocking limitations.",
        "",
        "## How to use this if you are an agent",
        "",
        trap_line,
        "2. Filter on measured capability (`has_survival_endpoint`, "
        "`has_treatment_response`), not on description text.",
        "3. `has_citable_accession: false` means reuse could not be measured, not that "
        "the dataset is unused.",
        "",
        "## Data",
        "",
        f"- [Search index]({SITE_URL}/data/index.json): one slim row per dataset",
        f"- [Facets]({SITE_URL}/data/facets.json): browse dimensions with counts",
        f"- [Subject vocabulary]({SITE_URL}/data/subjects.json): controlled tissues and query synonyms",
        f"- [Corpus statistics]({SITE_URL}/data/stats.json)",
        f"- [Research questions]({SITE_URL}/data/questions.json): curated questions, flattened",
        f"- [Full record]({SITE_URL}/data/datasets/{{id}}.json): everything, with evidence",
        f"- [Agent brief]({SITE_URL}/data/agent/{{id}}.md): plain-language, constraints first",
        f"- [schema.org JSON-LD]({SITE_URL}/data/jsonld/{{id}}.jsonld)",
        f"- [MLCommons Croissant]({SITE_URL}/data/croissant/{{id}}.json)",
        f"- [Reuse gap model]({SITE_URL}/data/reuse_gap_model.json): coefficients and diagnostics",
        f"- [Field calibration]({SITE_URL}/data/field_calibration.json): why the reuse "
        "method uses the fields it uses, re-measured on every build",
        "",
        "## Live endpoints",
        "",
        f"- `GET {SITE_URL}/api/v1/search` - filter on measured capability: `survival`, "
        "`treatment_response`, `subject`, `site`, `modality`, `access`, `repository`, `min_cases`, "
        "`min_modalities`, `underexplored`, `showcase`, `q`, `limit`",
        f"- `GET {SITE_URL}/api/v1/datasets/{{id}}` - the full record plus `analysis_fit`, "
        "the six verdicts",
        f"- `GET {SITE_URL}/api/v1/agent?q=...` - describe an analysis, get a ranked "
        'shortlist with the reasons and the blockers (`POST` with `{"q": "..."}` also works)',
        f"- [OpenAPI description]({SITE_URL}/openapi.json)",
        "",
        "## Method notes that change how you should read the numbers",
        "",
        "- Reuse is graded by where an accession appears in an article. Methods, results, "
        "tables and figures count as analysis; a reference-list mention does not.",
        "- Availability is dated from the first article referencing the accession, because "
        "repository file timestamps record re-harmonization rather than first release.",
        "- 'Underexplored' is a modeled residual against datasets matched on size, age, "
        "modality breadth and access tier - never an editorial judgement.",
        "",
        f"## Showcase datasets ({len(showcase)})",
        "",
    ]
    for r in sorted(showcase, key=lambda r: r.title):
        lines.append(f"- [{r.title}]({SITE_URL}/datasets/{r.id}): {r.one_liner or ''}")
    lines += ["", f"## Underexplored datasets ({len(under)})", ""]
    for r in sorted(under, key=lambda r: r.reuse_metrics.reuse_gap_index or 0)[:25]:
        lines.append(
            f"- [{r.title}]({SITE_URL}/datasets/{r.id}): reuse gap index "
            f"{r.reuse_metrics.reuse_gap_index:+.2f}"
        )
    return "\n".join(lines) + "\n"


def build_openapi(stats: dict[str, Any]) -> dict[str, Any]:
    """A minimal, honest OpenAPI description of the static JSON surface."""
    return {
        "openapi": "3.1.0",
        "info": {
            "title": "CD2S API",
            "version": __version__,
            "summary": "Question-first metadata for NCI-supported cancer datasets.",
            "description": (
                "A read-only JSON surface over the CD2S corpus. Every "
                "endpoint is a static file, so it is cacheable, archivable and has no "
                "rate limit. Records expose measured clinical field completeness and "
                "graded reuse evidence, not only descriptive metadata."
            ),
            "license": {"name": "CC BY 4.0", "url": LICENSE},
        },
        "servers": [{"url": SITE_URL}],
        "paths": {
            "/data/index.json": {
                "get": {
                    "summary": "Every dataset as a slim searchable row",
                    "description": (
                        f"{stats.get('n_datasets', 0)} rows. Filter on "
                        "`has_survival_endpoint`, `has_treatment_response`, `modalities`, "
                        "`access_tier`, `is_underexplored`."
                    ),
                    "responses": {"200": {"description": "Array of index rows"}},
                }
            },
            "/data/facets.json": {
                "get": {
                    "summary": "Browse dimensions with counts",
                    "responses": {"200": {"description": "Facet map"}},
                }
            },
            "/data/stats.json": {
                "get": {
                    "summary": "Corpus-level statistics",
                    "responses": {"200": {"description": "Statistics object"}},
                }
            },
            "/data/questions.json": {
                "get": {
                    "summary": "Curated research questions across all datasets",
                    "responses": {"200": {"description": "Array of questions"}},
                }
            },
            "/data/datasets/{id}.json": {
                "get": {
                    "summary": "Full record with evidence for every claim",
                    "parameters": [
                        {
                            "name": "id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                            "example": "gdc-cgci-htmcp-cc",
                        }
                    ],
                    "responses": {
                        "200": {"description": "DatasetRecord"},
                        "404": {"description": "Unknown id"},
                    },
                }
            },
            "/data/agent/{id}.md": {
                "get": {
                    "summary": "Plain-language brief for a language model, constraints first",
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": {"description": "Markdown brief"}},
                }
            },
            "/data/jsonld/{id}.jsonld": {
                "get": {
                    "summary": "schema.org/Dataset plus DCAT, for indexing",
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": {"description": "JSON-LD document"}},
                }
            },
            "/data/reuse_gap_model.json": {
                "get": {
                    "summary": "The fitted reuse model, its coefficients and its worst case",
                    "description": (
                        "Ships so the underexplored label can be recomputed or contested. "
                        "`largest_over_prediction` names the dataset the model is most "
                        "wrong about, which bounds how far `expected_reuse` can be trusted."
                    ),
                    "responses": {"200": {"description": "Model diagnostics"}},
                }
            },
            "/data/field_calibration.json": {
                "get": {
                    "summary": "Why the narrow availability field is used and the broad one is not",
                    "description": (
                        "Re-measured against the live Europe PMC index on every build, "
                        "including a sentinel query against an unindexed field name that "
                        "must return zero hits."
                    ),
                    "responses": {"200": {"description": "Calibration result"}},
                }
            },
            "/api/v1/datasets/{id}": {
                "get": {
                    "summary": "The full record plus the six analysis verdicts",
                    "description": (
                        "Everything in /data/datasets/{id}.json, plus `analysis_fit`: one "
                        "verdict per analysis class, each `supported`, `limited`, "
                        "`blocked` or `unknown`. `unknown` means the field was not "
                        "measured for this record and must not be read as absent."
                    ),
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {
                        "200": {"description": "Record with analysis_fit"},
                        "404": {"description": "No such dataset"},
                    },
                }
            },
            "/api/v1/search": {
                "get": {
                    "summary": "Capability-first dataset search",
                    "description": (
                        "Filters on what a dataset can support, measured from field "
                        "completeness, rather than on what its description says. "
                        "Results are ordered by cohort size."
                    ),
                    "parameters": [
                        {
                            "name": name,
                            "in": "query",
                            "required": False,
                            "schema": schema,
                            "description": desc,
                        }
                        for name, schema, desc in (
                            (
                                "q",
                                {"type": "string"},
                                "Substring match over the record's searchable text",
                            ),
                            (
                                "modality",
                                {"type": "string"},
                                "Measurement type, as in /data/facets.json",
                            ),
                            ("site", {"type": "string"}, "Primary anatomic site"),
                            (
                                "subject",
                                {"type": "string"},
                                "Controlled tissue code or subject state, as in /data/subjects.json",
                            ),
                            (
                                "access",
                                {
                                    "type": "string",
                                    "enum": ["open", "mixed", "controlled", "request", "unknown"],
                                },
                                "Access tier",
                            ),
                            ("repository", {"type": "string"}, "GDC, PDC, IDC, HTAN or cBioPortal"),
                            (
                                "survival",
                                {"type": "boolean"},
                                "Only datasets where a survival endpoint is derivable",
                            ),
                            (
                                "treatment_response",
                                {"type": "boolean"},
                                "Only datasets that record a response to therapy",
                            ),
                            (
                                "underexplored",
                                {"type": "boolean"},
                                "Only datasets labelled underexplored by the reuse model",
                            ),
                            (
                                "showcase",
                                {"type": "boolean"},
                                "Only datasets whose interpretation a person has reviewed",
                            ),
                            (
                                "min_cases",
                                {"type": "integer"},
                                "Minimum cohort size, falling back to samples",
                            ),
                            (
                                "min_modalities",
                                {"type": "integer"},
                                "Minimum number of distinct measurement types",
                            ),
                            (
                                "limit",
                                {"type": "integer", "default": 25, "maximum": 200},
                                "Maximum results to return",
                            ),
                        )
                    ],
                    "responses": {"200": {"description": "total, returned, caveat and results"}},
                }
            },
            "/api/v1/agent": {
                "get": {
                    "summary": "Describe an analysis, get a ranked shortlist",
                    "description": (
                        "Retrieval, the capability checks and the ranking are deterministic "
                        "and always run, and they are the whole answer whenever the leading "
                        "dataset meets every need read from the request. Only a request "
                        "they cannot settle is handed to a language model to rank and "
                        "reword, and only where the deployment has one configured. `mode` "
                        "says which wrote the wording; on a rules answer `note` says why "
                        "no model did."
                    ),
                    "parameters": [
                        {
                            "name": "q",
                            "in": "query",
                            "required": True,
                            "schema": {"type": "string", "minLength": 3, "maxLength": 600},
                            "description": "The analysis the researcher wants to run, in their own words",
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "query, mode, model, note, needs, summary and picks"
                        },
                        "400": {"description": "Query too short"},
                    },
                },
                "post": {
                    "summary": "Same as GET, with the query in a JSON body",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "required": ["q"],
                                    "properties": {"q": {"type": "string"}},
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {"description": "query, mode, model, note, needs, summary and picks"}
                    },
                },
            },
            "/data/croissant/{id}.json": {
                "get": {
                    "summary": "MLCommons Croissant description",
                    "parameters": [
                        {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                    ],
                    "responses": {"200": {"description": "Croissant JSON-LD"}},
                }
            },
        },
    }


def write_all(records: list[DatasetRecord], stats: dict[str, Any]) -> dict[str, int]:
    ensure_dirs()
    counts = {"jsonld": 0, "croissant": 0, "agent": 0}
    for target in (DIST_DIR, WEB_DATA_DIR):
        for rec in records:
            (target / "jsonld").mkdir(parents=True, exist_ok=True)
            (target / "croissant").mkdir(parents=True, exist_ok=True)
            (target / "agent").mkdir(parents=True, exist_ok=True)
            (target / "jsonld" / f"{rec.id}.jsonld").write_text(
                json.dumps(to_schema_org(rec), indent=2, default=str)
            )
            (target / "croissant" / f"{rec.id}.json").write_text(
                json.dumps(to_croissant(rec), indent=2, default=str)
            )
            (target / "agent" / f"{rec.id}.md").write_text(to_agent_brief(rec))
        (target / "llms.txt").write_text(build_llms_txt(records, stats))
        (target / "openapi.json").write_text(
            json.dumps(build_openapi(stats), indent=2, default=str)
        )
    counts = {"jsonld": len(records), "croissant": len(records), "agent": len(records)}
    counts["generated_at"] = datetime.now(UTC).isoformat()  # type: ignore[assignment]
    return counts
