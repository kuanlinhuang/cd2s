"""Apply human-curated overlays onto machine-extracted records.

This is the seam between what a pipeline can do and what only a person can.

Machine extraction is good at counting: how many cases, which assays, what fraction of
a clinical field is populated, who cited an accession. It is unreliable at judgement:
which research questions these data can genuinely support, which gap would invalidate a
particular analysis, and which of a thousand articles is the dataset's marker paper. We
established the last one empirically - automated inference nominated a 13-citation
methods paper as the marker paper for TCGA-BRCA, because the actual marker paper never
quotes its own project identifier.

So judgement lives in YAML files, one per dataset, written and signed by a reviewer.
Overlays are applied last and win over extracted values, but they never silently
replace evidence: a curated field carries `Method.CURATED` evidence naming the reviewer
and the date, so a reader can always see which parts of a page a human vouched for.

Fields not mentioned in an overlay keep their extracted values, so a reviewer can
correct one limitation without re-stating the whole record.
"""

from __future__ import annotations

import os
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import yaml

from cds.model import (
    AccessStep,
    AnalysisExample,
    Confidence,
    DatasetRecord,
    Evidence,
    InappropriateUse,
    Limitation,
    Method,
    Publication,
    ResearchQuestion,
    Review,
    ReviewStatus,
)
from cds.paths import CURATED_DIR

# Scalars a reviewer may override outright.
SCALAR_FIELDS = {
    "title",
    "short_title",
    "summary",
    "one_liner",
    "is_pediatric",
    "is_showcase",
    "program_name",
    "nci_program",
    "version",
}

# List fields replaced wholesale when present in an overlay.
LIST_FIELDS = {
    "useful_for": ResearchQuestion,
    "limitations": Limitation,
    "inappropriate_uses": InappropriateUse,
    "access_steps": AccessStep,
    "analysis_examples": AnalysisExample,
    "primary_publications": Publication,
}


class CurationError(ValueError):
    pass


def _curated_evidence(
    reviewer: str | None, reviewed_at: date | None, note: str | None = None
) -> Evidence:
    return Evidence(
        method=Method.CURATED,
        source_label="Expert review",
        retrieved_at=datetime.now(UTC),
        confidence=Confidence.HIGH,
        reviewer=reviewer,
        reviewed_at=reviewed_at,
        note=note
        or (
            "Written by a named reviewer after reading the source documentation and the "
            "measured field coverage. Not machine-generated."
        ),
    )


def load_overlays(directory: Path | None = None) -> dict[str, dict[str, Any]]:
    directory = directory or CURATED_DIR
    out: dict[str, dict[str, Any]] = {}
    if not directory.exists():
        return out
    for path in sorted(directory.glob("*.y*ml")):
        try:
            data = yaml.safe_load(path.read_text()) or {}
        except yaml.YAMLError as exc:
            raise CurationError(f"{path.name}: invalid YAML: {exc}") from exc
        if not isinstance(data, dict):
            raise CurationError(f"{path.name}: expected a mapping at the top level")
        rid = data.get("id")
        if not rid:
            raise CurationError(f"{path.name}: missing required 'id'")
        if rid in out:
            raise CurationError(f"duplicate overlay for '{rid}' in {path.name}")
        data["_source_file"] = path.name
        out[str(rid)] = data
    return out


def apply_overlay(rec: DatasetRecord, overlay: dict[str, Any]) -> list[str]:
    """Merge one overlay into a record. Returns the names of fields changed."""
    changed: list[str] = []
    reviewer = overlay.get("reviewer")
    reviewed_raw = overlay.get("reviewed_at")
    reviewed_at = (
        reviewed_raw
        if isinstance(reviewed_raw, date)
        else date.fromisoformat(str(reviewed_raw))
        if reviewed_raw
        else None
    )
    ev = _curated_evidence(reviewer, reviewed_at)

    for field in SCALAR_FIELDS:
        if field in overlay:
            setattr(rec, field, overlay[field])
            changed.append(field)

    for field, model in LIST_FIELDS.items():
        if field not in overlay:
            continue
        items = overlay[field] or []
        if not isinstance(items, list):
            raise CurationError(f"{rec.id}: '{field}' must be a list")
        built = []
        for raw in items:
            if not isinstance(raw, dict):
                raise CurationError(f"{rec.id}: each '{field}' entry must be a mapping")
            entry = dict(raw)
            # A reviewer may supply their own evidence; otherwise attribute to them.
            if not entry.get("evidence"):
                entry["evidence"] = [ev.model_dump(mode="json")]
            built.append(model.model_validate(entry))
        setattr(rec, field, built)
        changed.append(field)

    # Longitudinal and access corrections are field-level, not wholesale.
    for block in ("longitudinal", "access", "cohort"):
        if block not in overlay:
            continue
        patch = overlay[block] or {}
        if not isinstance(patch, dict):
            raise CurationError(f"{rec.id}: '{block}' must be a mapping")
        target = getattr(rec, block)
        for k, v in patch.items():
            if not hasattr(target, k):
                raise CurationError(f"{rec.id}: {block} has no field '{k}'")
            setattr(target, k, v)
            changed.append(f"{block}.{k}")
        target.evidence = [*target.evidence, ev]

    if "tags" in overlay:
        rec.tags = sorted(set(rec.tags) | set(overlay["tags"] or []))
        changed.append("tags")

    if "related_dataset_ids" in overlay:
        rec.related_dataset_ids = list(overlay["related_dataset_ids"] or [])
        changed.append("related_dataset_ids")

    # Review block. A record only reaches expert_reviewed through an overlay.
    review_raw = overlay.get("review") or {}
    status = review_raw.get("status") or (
        ReviewStatus.PROJECT_CURATED.value if reviewer else ReviewStatus.NEEDS_REVIEW.value
    )
    rec.review = Review(
        status=ReviewStatus(status),
        reviewer=reviewer or review_raw.get("reviewer"),
        reviewer_affiliation=overlay.get("reviewer_affiliation")
        or review_raw.get("reviewer_affiliation"),
        reviewed_at=reviewed_at,
        sections_reviewed=review_raw.get("sections_reviewed") or sorted(set(changed)),
        open_questions=review_raw.get("open_questions") or [],
        notes=review_raw.get("notes"),
    )
    changed.append("review")
    return sorted(set(changed))


def apply_all(
    records: list[DatasetRecord], directory: Path | None = None
) -> tuple[int, dict[str, Any]]:
    overlays = load_overlays(directory)
    by_id = {r.id: r for r in records}
    applied = 0
    unmatched: list[str] = []
    detail: dict[str, list[str]] = {}
    for rid, overlay in overlays.items():
        rec = by_id.get(rid)
        if rec is None:
            unmatched.append(f"{rid} (from {overlay.get('_source_file')})")
            continue
        detail[rid] = apply_overlay(rec, overlay)
        applied += 1
    stats = {
        "n_overlays_found": len(overlays),
        "n_applied": applied,
        "n_unmatched": len(unmatched),
        "unmatched_ids": unmatched,
        "fields_changed": detail,
    }
    return applied, stats


# Base URL of the published source repository, e.g.
# "https://github.com/some-org/cancer-data-showcase". Left unset while the repository is
# local: a "View notebook" button that 404s is worse than no button, and this project
# claims every link on a page resolves.
REPO_BASE_URL = os.environ.get("CDS_REPO_URL", "").rstrip("/")


def _workbook_url(name: str) -> str | None:
    """Link to the executed notebook, only when a published repository is configured."""
    if not REPO_BASE_URL:
        return None
    return f"{REPO_BASE_URL}/blob/main/workbooks/executed/{name}.ipynb"


def attach_workbooks(records: list[DatasetRecord]) -> dict[str, Any]:
    """Attach executed workbooks to the datasets they actually exercise.

    A workbook appears on a dataset page only if it ran against that dataset, and it
    carries its execution receipt, so the "runnable workbook" claim on the page is backed
    by a record of when the code ran, against which package versions and for how long.
    """
    import yaml as _yaml

    from cds import workbooks as wb
    from cds.model import AnalysisExample, ExecutionReceipt, WorkbookLevel

    manifest_path = wb.WORKBOOK_SRC.parent / "manifest.yaml"
    if not manifest_path.exists():
        return {"n_workbooks": 0, "note": "no workbook manifest found"}
    entries = _yaml.safe_load(manifest_path.read_text()) or []
    receipts = wb.load_receipts()
    by_id = {r.id: r for r in records}

    n_attached = 0
    n_executed = 0
    missing: list[str] = []
    for entry in entries:
        name = entry["workbook"]
        raw = receipts.get(name)
        receipt = None
        if raw:
            receipt = ExecutionReceipt(
                executed=bool(raw.get("executed")),
                executed_at=raw.get("executed_at"),
                runtime_seconds=raw.get("runtime_seconds"),
                executor=raw.get("executor"),
                package_versions=raw.get("package_versions") or {},
                n_cells=raw.get("n_cells"),
                n_cells_executed=raw.get("n_cells_executed"),
                output_hash=raw.get("output_hash"),
                error=raw.get("error"),
            )
            n_executed += bool(raw.get("executed"))
        for ds_id in entry.get("datasets", []):
            rec = by_id.get(ds_id)
            if rec is None:
                missing.append(f"{name} -> {ds_id}")
                continue
            rec.analysis_examples = [a for a in rec.analysis_examples if a.template_source != name]
            rec.analysis_examples.append(
                AnalysisExample(
                    level=WorkbookLevel(entry.get("level", "intermediate")),
                    title=entry["title"],
                    question=entry["question"],
                    inputs=entry.get("inputs", []),
                    outputs=entry.get("outputs", []),
                    steps=entry.get("steps", []),
                    language=entry.get("language", "python"),
                    est_runtime=entry.get("est_runtime"),
                    workbook_path=f"workbooks/python/{name}.py",
                    workbook_url=_workbook_url(name),
                    receipt=receipt,
                    template_source=name,
                    evidence=[
                        Evidence(
                            method=Method.CURATED,
                            source_label="Cancer Data Showcase workbook",
                            retrieved_at=datetime.now(UTC),
                            locator=f"workbooks/python/{name}.py",
                            confidence=Confidence.HIGH,
                            note=(
                                "Executed end to end against the live public APIs; the "
                                "receipt records when, with which package versions and "
                                "how long it took."
                            ),
                        )
                    ],
                )
            )
            n_attached += 1
    return {
        "n_workbook_entries": len(entries),
        "n_executed": n_executed,
        "n_attachments": n_attached,
        "unmatched": missing,
    }


def completeness(rec: DatasetRecord) -> float:
    """A rough score for how complete a page is, used for sorting and for the roadmap.

    Weighted toward the things a researcher actually needs rather than toward the count
    of populated fields: a page with three good research questions and honest limitations
    is more useful than one with exhaustive assay metadata and no interpretation.
    """
    checks: list[tuple[float, bool]] = [
        (2.0, len(rec.useful_for) >= 3),
        (2.0, len(rec.limitations) >= 2),
        (1.5, bool(rec.analysis_examples)),
        (1.5, any(a.receipt and a.receipt.executed for a in rec.analysis_examples)),
        (1.0, bool(rec.primary_publications)),
        (1.0, bool(rec.reuse) or rec.reuse_metrics.no_reuse_identified),
        (1.0, bool(rec.access_steps)),
        (1.0, bool(rec.grants)),
        (0.75, bool(rec.clinical_variables)),
        (0.75, bool(rec.assays)),
        (0.5, bool(rec.summary or rec.one_liner)),
        (
            0.5,
            rec.review.status in (ReviewStatus.PROJECT_CURATED, ReviewStatus.EXPERT_REVIEWED),
        ),
        (0.5, bool(rec.inappropriate_uses)),
    ]
    total = sum(w for w, _ in checks)
    got = sum(w for w, ok in checks if ok)
    return round(100.0 * got / total, 1)
