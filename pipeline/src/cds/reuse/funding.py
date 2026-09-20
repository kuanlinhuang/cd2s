"""Which award paid to create a dataset.

The reuse enrichment pass already answers the other half of the funding question: for
every article that analysed a dataset, RePORTER says which awards that article reported
under, and those awards are recorded on the record as funded *reuse*. That side was
built first because it is the interesting one - NCI money spent on data somebody else
generated is a return the usual metrics never show.

It left the record lopsided. A dataset knew what it had enabled and not what had paid
for it, unless it came from cBioPortal, whose adapter resolves marker-paper grants while
it ingests. So 66 GDC and PDC records carried downstream awards with nothing upstream,
and the funding graph could never show one dataset's money in and money out together.

This pass fills the gap from the same source, for every repository: take the dataset's
own marker paper, ask RePORTER which awards reported it, and record those as generation.

Two constraints that decide what this will and will not claim:

*Only an authoritative marker paper counts.* Where a repository publishes no marker-paper
link, `enrich` nominates the earliest heavily cited article that analysed the accession,
at low confidence and clearly labelled. Attributing an award from a nomination like that
would say "this grant paid to create this cohort" on the strength of a guess about which
paper describes it, and would be wrong in exactly the direction this project exists to
argue against - a reuse paper read as a marker paper. Those records are left with no
generation award, which is the honest answer and is reported as such.

*The marker paper outranks a downstream mention.* If an award already sits on the record
as reuse or infrastructure and also appears on the marker paper, the role is upgraded to
generation rather than duplicated: the same award can fund a cohort and later analyses
of it, and the stronger evidence is what should be shown.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import Confidence, DatasetRecord, Evidence, FundingRole, Grant, Method
from cds.reuse import markers
from cds.sources import reporter as rp

#: What counts as a marker paper strong enough to attribute generation funding from is
#: the same question the citation count asks, so it is answered in one place.
INFERRED_LABEL = markers.INFERRED_LABEL
authoritative_marker_pmids = markers.authoritative_marker_pmids


def _generation_grant(
    core: str, detail: dict[str, Any] | None, pmid: str, at: datetime | None
) -> Grant:
    g = rp.to_grant(core, detail, FundingRole.GENERATION, pmid, at)
    g.evidence = [
        Evidence(
            method=Method.API,
            source_url=rp.PUBS_API,
            source_label="NIH RePORTER",
            retrieved_at=at or datetime.now(UTC),
            locator=f"PMID {pmid} (this dataset's marker paper) reported under {core}",
            confidence=Confidence.HIGH,
            note=(
                "The award is credited on the dataset's own marker paper, so it paid to "
                "produce these data rather than to analyse them. Resolved from RePORTER's "
                "publication index; only a repository-supplied or reviewer-supplied marker "
                "paper is used, never one this pipeline nominated itself."
            ),
        )
    ]
    return g


def link_generation_grants(
    client: Client, records: list[DatasetRecord], *, batch: int = 60, max_details: int = 400
) -> dict[str, Any]:
    """Attribute generation funding across the corpus from authoritative marker papers.

    One batched RePORTER lookup for every marker PMID in the corpus rather than one per
    record: the publications endpoint takes 60 PMIDs at a time and the same paper is the
    marker for more than one record often enough to matter.
    """
    marker_pmids: dict[str, list[str]] = {}
    for rec in records:
        pmids = authoritative_marker_pmids(rec)
        if pmids:
            marker_pmids[rec.id] = pmids

    every = sorted({p for pmids in marker_pmids.values() for p in pmids})
    info: dict[str, Any] = {
        "n_records": len(records),
        "n_records_with_authoritative_marker": len(marker_pmids),
        "n_marker_pmids": len(every),
        "n_records_without_marker": sum(1 for r in records if not authoritative_marker_pmids(r)),
        "n_grants_added": 0,
        "n_roles_upgraded": 0,
        "n_records_gained_generation": 0,
    }
    if not every:
        return info

    mapping, at = rp.pmids_to_core_projects(client, every, batch=batch)
    nci_cores = sorted({c for cores in mapping.values() for c in cores if rp.is_nci(c)})
    info["n_nci_awards_resolved"] = len(nci_cores)
    details, _ = rp.fetch_project_details(client, nci_cores[:max_details])

    for rec in records:
        pmids = marker_pmids.get(rec.id)
        if not pmids:
            continue
        had_generation = any(g.role == FundingRole.GENERATION for g in rec.grants)
        by_core = {g.core_project_num: g for g in rec.grants if g.core_project_num}
        added = 0
        for pmid in pmids:
            for core in mapping.get(pmid, []):
                if not rp.is_nci(core):
                    continue
                existing = by_core.get(core)
                if existing is None:
                    grant = _generation_grant(core, details.get(core), pmid, at)
                    rec.grants.append(grant)
                    by_core[core] = grant
                    added += 1
                    info["n_grants_added"] += 1
                elif existing.role != FundingRole.GENERATION:
                    existing.role = FundingRole.GENERATION
                    existing.evidence += _generation_grant(
                        core, details.get(core), pmid, at
                    ).evidence
                    info["n_roles_upgraded"] += 1
                    added += 1
        if added and not had_generation:
            info["n_records_gained_generation"] += 1

    return info


def backfill_award_details(
    client: Client, records: list[DatasetRecord], *, max_awards: int = 1200
) -> dict[str, Any]:
    """Fill in title, PI, institution, years and amount for awards that have none.

    A grant reaches a record from the publications endpoint, which gives only a core
    project number; everything a human reads comes from a second lookup against the
    projects endpoint. That lookup used to lose whole awards to an unpaged response (see
    `reporter.fetch_project_details`), and the ones it lost were the awards that ended
    longest ago - so a closed R01 was drawn on the site as a bare grant number with no
    project, no investigator and no institution.

    This runs corpus-wide rather than per record, because one award is often credited on
    dozens of datasets and there is no reason to ask about it more than once.
    """
    missing: set[str] = set()
    for rec in records:
        for g in rec.grants:
            core = g.core_project_num or g.project_num
            if core and not g.title:
                missing.add(core)

    info: dict[str, Any] = {"n_awards_missing_detail": len(missing), "n_awards_filled": 0}
    if not missing:
        return info

    details, _ = rp.fetch_project_details(client, sorted(missing)[:max_awards])
    filled = 0
    for rec in records:
        for g in rec.grants:
            core = g.core_project_num or g.project_num
            if not core or g.title:
                continue
            d = details.get(core)
            if not d:
                continue
            g.title = d.get("title") or g.title
            g.pi_names = g.pi_names or (d.get("pi_names") or [])
            g.org_name = g.org_name or d.get("org_name")
            g.agency_ic = g.agency_ic or d.get("agency_ic") or rp.ic_of(core)
            g.activity_code = g.activity_code or d.get("activity_code") or rp.activity_code_of(core)
            g.fiscal_years = g.fiscal_years or sorted(d.get("fiscal_years") or [])
            g.award_amount_usd = g.award_amount_usd or (d.get("award_amount_usd") or None)
            filled += 1
    info["n_awards_filled"] = filled
    info["n_awards_still_unknown"] = len([c for c in missing if c not in details])
    return info
