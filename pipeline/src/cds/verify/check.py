"""Keep the corpus honest over time.

A guide to other people's data starts decaying the moment it is published: portals
reorganise, accessions are superseded, cohorts grow.

**Link checking** is what `cds verify` runs. It confirms that the URLs a reader would
actually click still resolve, recording the status per URL and the date checked, so a
page can say when it was last verified rather than implying it is current.

**Drift detection** (`detect_drift`) compares stored counts against a freshly fetched
record. It is a building block for the monitoring pass, not part of `cds verify`: that
comparison needs a re-ingest of every source, so it belongs to a scheduled job rather
than to the per-build link check. Nothing calls it yet, and this docstring says so
rather than implying the corpus is being watched for drift.
"""

from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import DatasetRecord, LinkCheck

# Hosts we never hammer: one representative URL per host per record is enough to detect
# a portal-wide outage, and checking 600 identical GDC URLs proves nothing.
SAMPLE_PER_HOST = 2

# Status codes that mean "this host refuses automated requests", not "this page is gone".
# Europe PMC returns 403 to every programmatic HEAD, and reporting that as a broken link
# would tell readers a working page is dead.
BLOCKED_STATUSES = {401, 403, 405, 429}


def collect_urls(rec: DatasetRecord) -> list[str]:
    urls: list[str] = []
    if rec.landing_page_url:
        urls.append(rec.landing_page_url)
    if rec.program_url:
        urls.append(rec.program_url)
    for ident in rec.identifiers:
        if ident.url:
            urls.append(ident.url)
    for p in rec.primary_publications:
        if p.url:
            urls.append(p.url)
    for s in rec.access_steps:
        if s.url:
            urls.append(s.url)
    if rec.access.dua_url:
        urls.append(rec.access.dua_url)
    if rec.access.publication_policy_url:
        urls.append(rec.access.publication_policy_url)
    # "View notebook" and "Open in Colab" are buttons on the page, so they are links a
    # reader clicks and must be checked like any other.
    for ex in rec.analysis_examples:
        if ex.workbook_url:
            urls.append(ex.workbook_url)
        if ex.colab_url:
            urls.append(ex.colab_url)

    # Deduplicate, then cap per host.
    seen: set[str] = set()
    per_host: Counter[str] = Counter()
    out: list[str] = []
    for u in urls:
        if u in seen:
            continue
        seen.add(u)
        host = u.split("/")[2] if "//" in u else u
        if per_host[host] >= SAMPLE_PER_HOST:
            continue
        per_host[host] += 1
        out.append(u)
    return out


def check_record(client: Client, rec: DatasetRecord) -> None:
    now = datetime.now(UTC)
    checks: list[LinkCheck] = []
    for url in collect_urls(rec):
        status, note = client.head_ok(url)
        ok = status is not None and 200 <= status < 400
        blocked = status in BLOCKED_STATUSES
        checks.append(
            LinkCheck(
                url=url,
                status=status,
                ok=ok or blocked,
                checked_at=now,
                redirect_to=note if note and note.startswith("http") else None,
                note=(
                    "host refuses automated requests; not verifiable but not known broken"
                    if blocked
                    else (None if ok else note)
                ),
            )
        )
    rec.verification.link_checks = checks
    rec.verification.n_links_ok = sum(1 for c in checks if c.ok and not c.note)
    rec.verification.n_links_broken = sum(1 for c in checks if not c.ok)
    rec.verification.notes = (
        [f"{sum(1 for c in checks if c.note)} link(s) on hosts that block automated checks"]
        if any(c.note for c in checks)
        else []
    )
    rec.verification.last_verified_at = now


def detect_drift(rec: DatasetRecord, fresh: DatasetRecord) -> dict[str, Any]:
    """Compare stored counts against a freshly fetched record."""
    drift: dict[str, Any] = {}
    pairs = [
        ("n_cases", rec.cohort.n_cases, fresh.cohort.n_cases),
        ("n_files", rec.cohort.n_files, fresh.cohort.n_files),
        ("n_samples", rec.cohort.n_samples, fresh.cohort.n_samples),
    ]
    for name, stored, current in pairs:
        if stored is None or current is None or stored == current:
            continue
        drift[name] = {
            "published": stored,
            "current": current,
            "delta": current - stored,
            "pct": round(100.0 * (current - stored) / max(stored, 1), 1),
        }
    stored_mods = {a.modality.value for a in rec.assays}
    fresh_mods = {a.modality.value for a in fresh.assays}
    if fresh_mods - stored_mods:
        drift["new_modalities"] = sorted(fresh_mods - stored_mods)
    if stored_mods - fresh_mods:
        drift["removed_modalities"] = sorted(stored_mods - fresh_mods)
    return drift


def run(
    records: list[DatasetRecord],
    *,
    limit: int | None = None,
    showcase_only: bool = False,
    max_age_days: float = 3.0,
) -> dict[str, Any]:
    targets = [r for r in records if r.is_showcase] if showcase_only else records
    if limit:
        targets = targets[:limit]

    n_ok = n_broken = n_blocked = 0
    broken_examples: list[dict[str, Any]] = []
    with Client("verify", max_age_days=max_age_days) as c:
        for rec in targets:
            check_record(c, rec)
            n_ok += rec.verification.n_links_ok
            n_broken += rec.verification.n_links_broken
            n_blocked += sum(1 for chk in rec.verification.link_checks if chk.note and chk.ok)
            for chk in rec.verification.link_checks:
                if not chk.ok and len(broken_examples) < 40:
                    broken_examples.append(
                        {
                            "dataset": rec.id,
                            "url": chk.url,
                            "status": chk.status,
                            "note": chk.note,
                        }
                    )

    return {
        "checked_at": datetime.now(UTC).isoformat(),
        "n_datasets_checked": len(targets),
        "n_links_ok": n_ok,
        "n_links_broken": n_broken,
        "n_links_unverifiable": n_blocked,
        "pct_ok": round(100.0 * n_ok / max(n_ok + n_broken, 1), 1),
        "broken_examples": broken_examples,
        "note": (
            "At most two URLs are checked per host per dataset. A broken link is recorded "
            "on the dataset page with the date checked, so a reader can see how fresh the "
            "verification is rather than assuming it is current."
        ),
    }
