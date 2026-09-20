"""Which publication is a dataset's own, and what may be claimed from it.

A dataset's marker paper is the article that describes the cohort and reports the data
generation. Everything downstream depends on getting it right: the citation count on the
page is citations *to that paper*, the generation award is the award credited *on that
paper*, and reuse independence is "no author overlaps *that paper's* authors".

There are three ways we can come to believe a paper is the marker paper, and they are
not equally good:

1. *The repository says so.* cBioPortal and HTAN publish a marker-paper link. Trusted.
2. *A reviewer says so.* The curated overlays, and the marker-paper registry this module
   loads. Trusted.
3. *We guessed.* `enrich._pick_primary` nominates the earliest heavily cited article
   that analysed the accession. Not trusted, and the reason this module exists.

The guess is not a little bit unreliable, it is structurally unreliable, and it took a
while to see why. The candidate pool it chooses from is the set of articles that quote
the accession - and a marker paper published in 2011 does not quote a project identifier
the GDC only introduced later. TCGA-OV's marker paper never contains the string
"TCGA-OV", so it can never be a candidate, so the heuristic picked a 2012 reuse paper
with 44 citations instead of the 2011 Nature paper with 6,322. The site then reported
that a dataset 652 articles had analysed had been cited 44 times.

A reuse paper read as a marker paper is the precise error this whole project argues
against, so the rule here is narrow: a guess may be shown, clearly labelled, as a
reading suggestion. It may never be counted from. Citation counts and funding
attribution both go through `authoritative_marker_pmids`, which excludes guesses.
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import yaml

from cds.model import (
    Confidence,
    DatasetRecord,
    Evidence,
    Method,
    Publication,
)
from cds.paths import MARKER_PAPERS_FILE

#: How `enrich` labels a marker paper it nominated itself. Anything carrying this label
#: is a low-confidence guess: shown to readers, never counted from.
INFERRED_LABEL = "Candidate primary publication (machine-inferred)"

#: How this module labels a marker paper a reviewer supplied through the registry.
REGISTRY_LABEL = "Marker paper (curated registry)"


def is_inferred(pub: Publication) -> bool:
    return any((e.source_label or "") == INFERRED_LABEL for e in pub.evidence)


def authoritative_marker_pmids(rec: DatasetRecord) -> list[str]:
    """PMIDs strong enough to count citations from and attribute funding from.

    A repository's own marker-paper link, a curated overlay or the registry qualifies;
    this pipeline's own nomination does not.
    """
    out: list[str] = []
    for pub in rec.primary_publications:
        if pub.pmid and not is_inferred(pub) and pub.pmid not in out:
            out.append(pub.pmid)
    return out


def has_only_inferred_primaries(rec: DatasetRecord) -> bool:
    """True when every publication on the record is this pipeline's own guess."""
    return bool(rec.primary_publications) and not authoritative_marker_pmids(rec)


# ------------------------------------------------------------------------------------
# The registry
# ------------------------------------------------------------------------------------


def load_registry(path: Path | None = None) -> dict[str, dict[str, Any]]:
    """Read the curated marker-paper registry, keyed by dataset id.

    Kept as one file rather than one curated overlay per dataset because a marker paper
    is a single fact with a single provenance, and forty overlays carrying nothing else
    would each also stamp a `review` block onto their record, claiming a level of expert
    review of the whole page that naming one paper does not amount to.
    """
    path = path or MARKER_PAPERS_FILE
    if not path.exists():
        return {}
    raw = yaml.safe_load(path.read_text()) or {}
    papers = raw.get("papers") or {}
    if not isinstance(papers, dict):
        raise ValueError(f"{path.name}: 'papers' must be a mapping of dataset id to paper")
    reviewer = raw.get("reviewer")
    reviewed_raw = raw.get("reviewed_at")
    reviewed_at = (
        reviewed_raw
        if isinstance(reviewed_raw, date)
        else date.fromisoformat(str(reviewed_raw))
        if reviewed_raw
        else None
    )
    out: dict[str, dict[str, Any]] = {}
    for rid, entry in papers.items():
        if not isinstance(entry, dict) or not entry.get("pmid"):
            raise ValueError(f"{path.name}: entry for '{rid}' needs at least a pmid")
        out[str(rid)] = {**entry, "_reviewer": reviewer, "_reviewed_at": reviewed_at}
    return out


def _registry_publication(entry: dict[str, Any], rid: str) -> Publication:
    pmid = str(entry["pmid"])
    return Publication(
        pmid=pmid,
        doi=entry.get("doi"),
        title=entry.get("title"),
        journal=entry.get("journal"),
        year=entry.get("year"),
        url=entry.get("url") or f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
        evidence=[
            Evidence(
                method=Method.CURATED,
                source_label=REGISTRY_LABEL,
                source_url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                retrieved_at=datetime.now(UTC),
                locator=f"marker paper for {rid}",
                confidence=Confidence.HIGH,
                reviewer=entry.get("_reviewer"),
                reviewed_at=entry.get("_reviewed_at"),
                note=(
                    "Named by a reviewer as the publication that describes this cohort "
                    "and reports its data generation, and verified against Europe PMC by "
                    "title, journal and year. This is what the dataset's citation count "
                    "counts citations to, and the only thing a generation award is "
                    "attributed from."
                ),
            )
        ],
    )


def apply_registry(records: list[DatasetRecord], path: Path | None = None) -> dict[str, Any]:
    """Install curated marker papers, displacing any guess for the same record.

    A registry entry wins over a machine nomination outright: that is the whole point of
    the file. It does not displace a repository-supplied publication, which is equally
    authoritative and may legitimately differ; the registry entry is added alongside and
    the pair are deduplicated by PMID.
    """
    registry = load_registry(path)
    by_id = {r.id: r for r in records}
    info: dict[str, Any] = {
        "n_registry_entries": len(registry),
        "n_applied": 0,
        "n_guesses_displaced": 0,
        "n_unmatched": 0,
        "unmatched_ids": [],
    }
    for rid, entry in registry.items():
        rec = by_id.get(rid)
        if rec is None:
            info["n_unmatched"] += 1
            info["unmatched_ids"].append(rid)
            continue
        kept = [p for p in rec.primary_publications if not is_inferred(p)]
        displaced = len(rec.primary_publications) - len(kept)
        pub = _registry_publication(entry, rid)
        if not any(p.pmid == pub.pmid for p in kept):
            kept.insert(0, pub)
        rec.primary_publications = kept
        info["n_applied"] += 1
        info["n_guesses_displaced"] += displaced
    return info


def withhold_counts_from_guesses(records: list[DatasetRecord]) -> dict[str, Any]:
    """Blank any citation count that was computed against a nominated marker paper.

    The index pass counts citations before the marker paper is known, so for a record
    that ends up with nothing but a guess the stored count is citations to an article we
    do not believe describes the cohort. Showing it next to the reuse count invites the
    exact comparison the number cannot support, and it is how the site came to report
    TCGA-OV as cited 44 times.

    A dash is the honest rendering, so that is what this produces. The guessed paper
    itself stays on the record as a reading suggestion, carrying its own low-confidence
    label.
    """
    n = 0
    for rec in records:
        if not has_only_inferred_primaries(rec):
            continue
        m = rec.reuse_metrics
        if m.n_citations_to_primary_publication is None and m.citation_to_reuse_ratio is None:
            continue
        m.n_citations_to_primary_publication = None
        m.citation_to_reuse_ratio = None
        m.evidence.append(
            Evidence(
                method=Method.DERIVED,
                source_label="Citation count withheld",
                retrieved_at=datetime.now(UTC),
                locator="no repository-supplied or reviewer-supplied marker paper",
                confidence=Confidence.HIGH,
                note=(
                    "No citation count is published for this dataset. The only "
                    "publication we have for it is one this pipeline nominated itself, "
                    "and counting citations to a guessed marker paper would put a "
                    "number on the page that is not the quantity its label claims. The "
                    "nominated article is still listed, flagged as a suggestion."
                ),
            )
        )
        n += 1
    return {"n_citation_counts_withheld": n}
