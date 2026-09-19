"""NIH RePORTER linkage.

Two jobs, both of which the challenge asks for explicitly.

First, funding provenance: which NCI awards paid for a dataset, and which paid for the
studies that reused it. RePORTER's publications endpoint maps PMIDs to core project
numbers, so once we know a dataset's papers we know its awards.

Second, and more interesting, the distinction between NCI-funded *data generation* and
NCI-funded *reuse of data generated elsewhere*. Both are returns on NCI investment but
they are different returns, and lumping them together overstates the first and hides the
second. We resolve the role per grant rather than per dataset, because a single dataset
often has both.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import Confidence, Evidence, FundingRole, Grant, Method

PUBS_API = "https://api.reporter.nih.gov/v2/publications/search"
PROJ_API = "https://api.reporter.nih.gov/v2/projects/search"

# Core project numbers encode the administering institute in characters 4-5:
# K07CA122451 -> CA -> National Cancer Institute.
CORE_RE = re.compile(r"^([A-Z]\d{2})([A-Z]{2})(\d{6})$")

NCI_IC = "CA"

# Activity codes that typically fund resource or data generation rather than
# hypothesis-driven analysis. Used only as a prior; publication context overrides it.
GENERATION_ACTIVITY_CODES = {
    "U24",
    "U2C",
    "U54",
    "U01",
    "UG3",
    "UH3",
    "U10",
    "P01",
    "P30",
    "P50",
    "HHSN",
    "N01",
    "75N",
}


def ic_of(core_project_num: str | None) -> str | None:
    if not core_project_num:
        return None
    m = CORE_RE.match(core_project_num.strip().upper())
    return m.group(2) if m else None


def activity_code_of(core_project_num: str | None) -> str | None:
    if not core_project_num:
        return None
    m = CORE_RE.match(core_project_num.strip().upper())
    return m.group(1) if m else None


def is_nci(core_project_num: str | None) -> bool:
    return ic_of(core_project_num) == NCI_IC


def _chunks(xs: list[int], n: int) -> list[list[int]]:
    return [xs[i : i + n] for i in range(0, len(xs), n)]


def pmids_to_core_projects(
    client: Client, pmids: list[str], *, batch: int = 60
) -> tuple[dict[str, list[str]], datetime | None]:
    """Map each PMID to the core project numbers that reported it."""
    numeric: list[int] = []
    for p in pmids:
        p = str(p).split(",")[0].strip()
        if p.isdigit():
            numeric.append(int(p))
    out: dict[str, list[str]] = {}
    at: datetime | None = None
    for group in _chunks(sorted(set(numeric)), batch):
        r = client.post(PUBS_API, body={"criteria": {"pmids": group}, "limit": 500})
        at = r.retrieved_at
        if not r.ok:
            continue
        for row in r.json().get("results") or []:
            pmid = str(row.get("pmid"))
            core = row.get("coreproject")
            if not pmid or not core:
                continue
            out.setdefault(pmid, [])
            if core not in out[pmid]:
                out[pmid].append(core)
    return out, at


def fetch_project_details(
    client: Client, core_project_nums: list[str], *, batch: int = 40
) -> tuple[dict[str, dict[str, Any]], datetime | None]:
    """Titles, PIs, institutes, years and amounts for a set of core project numbers."""
    details: dict[str, dict[str, Any]] = {}
    at: datetime | None = None
    uniq = sorted({c.strip().upper() for c in core_project_nums if c})
    for group in _chunks(list(range(len(uniq))), batch):
        nums = [uniq[i] for i in group]
        r = client.post(
            PROJ_API,
            body={
                "criteria": {"project_nums": nums},
                "limit": 500,
                "offset": 0,
                "sort_field": "fiscal_year",
                "sort_order": "desc",
            },
        )
        at = r.retrieved_at
        if not r.ok:
            continue
        for row in r.json().get("results") or []:
            core = (row.get("core_project_num") or "").strip().upper()
            if not core:
                continue
            d = details.setdefault(
                core,
                {
                    "core_project_num": core,
                    "title": row.get("project_title"),
                    "org_name": row.get("organization", {}).get("org_name")
                    if isinstance(row.get("organization"), dict)
                    else row.get("org_name"),
                    "agency_ic": (row.get("agency_ic_admin") or {}).get("abbreviation")
                    if isinstance(row.get("agency_ic_admin"), dict)
                    else None,
                    "activity_code": row.get("activity_code"),
                    "fiscal_years": [],
                    "award_amount_usd": 0,
                    "pi_names": [],
                },
            )
            fy = row.get("fiscal_year")
            if isinstance(fy, int) and fy not in d["fiscal_years"]:
                d["fiscal_years"].append(fy)
            amt = row.get("award_amount")
            if isinstance(amt, (int, float)):
                d["award_amount_usd"] += int(amt)
            for pi in row.get("principal_investigators") or []:
                name = (pi.get("full_name") or "").strip()
                name = re.sub(r"\s{2,}", " ", name)
                if name and name not in d["pi_names"]:
                    d["pi_names"].append(name)
            if not d["title"]:
                d["title"] = row.get("project_title")
    return details, at


def infer_role(
    core_project_num: str,
    *,
    is_primary_publication: bool,
    activity_code: str | None = None,
) -> FundingRole:
    """Generation vs reuse.

    A grant credited on a dataset's own marker publication paid for generating it. A
    grant credited only on a downstream study paid for reusing it. Resource-style
    activity codes on a downstream paper usually indicate infrastructure support.
    """
    ac = (activity_code or activity_code_of(core_project_num) or "").upper()
    if is_primary_publication:
        return FundingRole.GENERATION
    if ac in GENERATION_ACTIVITY_CODES:
        return FundingRole.INFRASTRUCTURE
    return FundingRole.REUSE


def to_grant(
    core: str,
    detail: dict[str, Any] | None,
    role: FundingRole,
    source_pmid: str | None,
    at: datetime | None,
) -> Grant:
    ev = Evidence(
        method=Method.API,
        source_url=PUBS_API if source_pmid else PROJ_API,
        source_label="NIH RePORTER",
        retrieved_at=at or datetime.now(UTC),
        locator=f"PMID {source_pmid} reported under {core}" if source_pmid else f"project {core}",
        confidence=Confidence.HIGH,
        note=(
            "Funding role inferred from whether the award appears on the dataset's own "
            "publication or on a downstream study."
        ),
    )
    d = detail or {}
    return Grant(
        core_project_num=core,
        title=d.get("title"),
        pi_names=d.get("pi_names") or [],
        agency_ic=d.get("agency_ic") or ic_of(core),
        activity_code=d.get("activity_code") or activity_code_of(core),
        fiscal_years=sorted(d.get("fiscal_years") or []),
        award_amount_usd=d.get("award_amount_usd") or None,
        org_name=d.get("org_name"),
        reporter_url=f"https://reporter.nih.gov/search/results?text_criteria={core}",
        role=role,
        evidence=[ev],
    )
