"""Orchestrate reuse tracing across the corpus.

Two passes, deliberately different.

The *index pass* runs over every dataset with a fixed, minimal set of Europe PMC section
fields. Uniformity matters more than maximality here: the Reuse Gap Index compares
datasets to each other, so every dataset must be measured the same way. Using whichever
field happens to return the most hits for a given dataset would make the comparison
meaningless.

The *deep pass* runs only on showcase datasets and sweeps every field, fetches article
records, checks author overlap against the dataset's own generating team, and produces
the reuse entries a reader actually sees. Author overlap is the sharpest available proxy
for genuine external reuse: a paper by the people who made the data is a follow-up, not
someone else finding the data useful.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from cds.http import Client
from cds.model import (
    Confidence,
    DatasetRecord,
    Evidence,
    IdScheme,
    Method,
    Publication,
    ReuseKind,
    ReuseMetrics,
    ReuseRecord,
    ReuseTier,
)
from cds.reuse import epmc

# Fixed field set for the comparable index. Documented on the site and in the export.
INDEX_FIELDS: dict[ReuseTier, tuple[str, ...]] = {
    ReuseTier.T3_ANALYZED: ("METHODS", "RESULTS"),
    ReuseTier.T2_DECLARED: ("DATA_AVAILABILITY",),
    ReuseTier.T1_ACCESSION: ("ACCESSION_ID",),
    ReuseTier.T0_MENTION: ("REF", "INTRO"),
}
INDEX_STRATEGY_ID = "epmc-index-v1"

# Identifier schemes worth searching, in the order we prefer them.
TOKEN_SCHEMES = [
    IdScheme.GDC_PROJECT,
    IdScheme.PDC_STUDY,
    IdScheme.GEO_SERIES,
    IdScheme.DBGAP,
    IdScheme.SRA_BIOPROJECT,
    IdScheme.EGA,
    IdScheme.SYNAPSE,
    IdScheme.CBIOPORTAL_STUDY,
]

MAX_INDEX_TOKENS = 3


def tokens_for(rec: DatasetRecord, *, limit: int = MAX_INDEX_TOKENS) -> list[str]:
    """Specific, citable accessions for this dataset, best first."""
    by_scheme: dict[IdScheme, list[str]] = {}
    for ident in rec.identifiers:
        by_scheme.setdefault(ident.scheme, []).append(ident.value)
    out: list[str] = []
    for scheme in TOKEN_SCHEMES:
        for v in by_scheme.get(scheme, []):
            v = v.strip()
            if not v or v in out:
                continue
            # cBioPortal study ids are not accessions authors quote; skip for counting.
            if scheme == IdScheme.CBIOPORTAL_STUDY:
                continue
            if epmc.is_strong_token(v):
                out.append(v)
            if len(out) >= limit:
                return out
    return out


def _count_with_fields(client: Client, token: str, fields: tuple[str, ...]) -> tuple[int, str]:
    """Max hit count across the given fields, and the query that produced it."""
    best = 0
    best_q = ""
    for field in fields:
        query = f'{field}:"{token}"'
        data, _, _ = epmc._search(client, query)
        n = int(data.get("hitCount") or 0)
        if n > best:
            best, best_q = n, query
    return best, best_q


def _primary_citations(client: Client, rec: DatasetRecord) -> int | None:
    """Citations to the dataset's own publications, summed over distinct papers."""
    pmids = [p.pmid for p in rec.primary_publications if p.pmid and p.pmid.isdigit()]
    if not pmids:
        return None
    return sum(epmc.citation_count(client, pm) for pm in dict.fromkeys(pmids))


def refresh_citation_metrics(client: Client, rec: DatasetRecord) -> bool:
    """Recount citations to the dataset's marker papers, after curation has named them.

    The index pass counts citations at the time it runs, which is before expert overlays
    are applied. For most repositories that is fine, but it silently defeated the thing
    it exists for: a GDC project carries no publication in its API response, so the count
    was computed against an empty list, and the marker paper a reviewer later supplied
    was never counted. Every showcase dataset ended up with a curated PMID and a null
    citation count - TCGA-BRCA knew that 2,463 articles analyzed its data and could not
    say how often its 2012 Nature paper had been cited.

    That comparison is the point of collecting both numbers, so this runs after curation
    and fills it in. Returns True when it changed something.
    """
    cites = _primary_citations(client, rec)
    if cites is None:
        return False
    m = rec.reuse_metrics
    before = (m.n_citations_to_primary_publication, m.citation_to_reuse_ratio)
    m.n_citations_to_primary_publication = cites
    verified = m.n_by_tier.get(ReuseTier.T3_ANALYZED.value) or 0
    m.citation_to_reuse_ratio = round(cites / verified, 1) if cites and verified else None
    return (m.n_citations_to_primary_publication, m.citation_to_reuse_ratio) != before


def index_pass(client: Client, rec: DatasetRecord) -> ReuseMetrics:
    """Comparable tier counts for one dataset."""
    toks = tokens_for(rec)
    now = datetime.now(UTC)
    cites = _primary_citations(client, rec)
    if not toks:
        return ReuseMetrics(
            n_candidates_screened=0,
            no_reuse_identified=False,
            has_citable_accession=False,
            n_citations_to_primary_publication=cites,
            search_strategy_id=INDEX_STRATEGY_ID,
            searched_at=now,
            evidence=[
                Evidence(
                    method=Method.DERIVED,
                    source_label="reuse index",
                    retrieved_at=now,
                    confidence=Confidence.LOW,
                    note=(
                        "This dataset has no accession specific enough to search for in "
                        "the literature, so citation-based reuse cannot be measured. "
                        "Absence of a count here is not evidence of absence of reuse."
                    ),
                )
            ],
        )

    by_tier: dict[str, int] = {}
    winning_queries: dict[str, str] = {}
    for tier, fields in INDEX_FIELDS.items():
        best = 0
        best_query = ""
        for tok in toks:
            n, q = _count_with_fields(client, tok, fields)
            if n > best:
                best, best_query = n, q
        by_tier[tier.value] = best
        if best_query:
            winning_queries[tier.value] = best_query

    n_verified = by_tier.get(ReuseTier.T3_ANALYZED.value, 0)
    screened = max(by_tier.values(), default=0)

    return ReuseMetrics(
        n_candidates_screened=screened,
        n_by_tier=by_tier,
        n_verified_reuse=n_verified,
        n_independent_reuse=0,  # filled by the deep pass
        n_citations_to_primary_publication=cites,
        citation_to_reuse_ratio=(round(cites / n_verified, 1) if cites and n_verified else None),
        has_citable_accession=True,
        no_reuse_identified=(screened == 0),
        search_strategy_id=INDEX_STRATEGY_ID,
        searched_at=now,
        evidence=[
            Evidence(
                method=Method.DERIVED,
                source_url="https://www.ebi.ac.uk/europepmc/webservices/rest/search",
                source_label="Europe PMC section-scoped hit counts",
                retrieved_at=now,
                locator=(
                    f"tokens: {', '.join(toks)}"
                    + (
                        "; queries: " + "; ".join(winning_queries.values())
                        if winning_queries
                        else ""
                    )
                ),
                confidence=Confidence.HIGH,
                note=(
                    f"Index strategy {INDEX_STRATEGY_ID}. Every dataset is measured with "
                    "the same fields so the counts are comparable; per-tier value is the "
                    "maximum across that tier's fields and across the dataset's accessions."
                ),
            )
        ],
    )


@dataclass
class Candidate:
    """A publication that references the dataset, with everything needed to grade it."""

    publication: Publication
    fields: set[str]
    author_surnames: set[str]


def deep_candidates(
    client: Client, rec: DatasetRecord, *, limit: int = 40
) -> tuple[list[Candidate], list[str], datetime | None]:
    """Every article referencing this dataset's accessions, with matched sections."""
    toks = tokens_for(rec, limit=4)
    found: dict[str, Candidate] = {}
    queries: list[str] = []
    at: datetime | None = None
    for tok in toks:
        for tier in (ReuseTier.T3_ANALYZED, ReuseTier.T2_DECLARED, ReuseTier.T1_ACCESSION):
            cands, qs, ts = epmc.fetch_candidates(client, tok, tier, limit=limit)
            queries.extend(qs)
            at = ts or at
            for pub, field, surnames in cands:
                key = pub.pmid or pub.doi or (pub.title or "")[:80]
                if not key:
                    continue
                existing = found.get(key)
                if existing is None:
                    found[key] = Candidate(
                        publication=pub, fields={field}, author_surnames=surnames
                    )
                else:
                    existing.fields.add(field)
                    existing.author_surnames |= surnames
    return list(found.values()), queries, at


def grant_pi_surnames(rec: DatasetRecord) -> set[str]:
    out: set[str] = set()
    for g in rec.grants:
        for name in g.pi_names:
            parts = [x for x in name.replace(",", " ").split() if len(x) > 2]
            if parts:
                out.add(parts[-1].lower())
    return out


def build_reuse_records(
    candidates: list[Candidate],
    *,
    generator_surnames: set[str],
    exclude_pmids: set[str],
    token: str,
    at: datetime | None,
    max_exemplars: int = 12,
) -> list[ReuseRecord]:
    """Grade candidates into reuse records, ranked by evidence strength.

    Independence is evaluated here rather than during fetching, because it depends on
    knowing the dataset's generating team - which for most repositories we only learn
    after nominating a primary publication from these same candidates.
    """
    out: list[ReuseRecord] = []
    for c in candidates:
        if c.publication.pmid and c.publication.pmid in exclude_pmids:
            continue
        tier = epmc.classify_tier(c.fields)
        overlap = bool(c.author_surnames & generator_surnames) if generator_surnames else None
        out.append(
            ReuseRecord(
                publication=c.publication,
                tier=tier,
                kind=ReuseKind.SECONDARY_ANALYSIS,
                independent_of_generators=(None if overlap is None else not overlap),
                accession_locator=", ".join(sorted(c.fields)),
                evidence=[epmc.evidence_for(token, sorted(c.fields)[0], at)],
            )
        )

    tier_rank = {t: i for i, t in enumerate(epmc.TIER_ORDER)}
    out.sort(
        key=lambda r: (
            -tier_rank[r.tier],
            r.independent_of_generators is not True,
            -(r.publication.citation_count or 0),
            -(r.publication.year or 0),
        )
    )
    return out[:max_exemplars]


def apply_deep(rec: DatasetRecord, reuse: list[ReuseRecord]) -> None:
    """Attach deep-pass results and refresh the derived counts."""
    rec.reuse = reuse
    m = rec.reuse_metrics
    verified = [r for r in reuse if r.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)]
    m.n_independent_reuse = sum(1 for r in verified if r.independent_of_generators is True)
    years = [r.publication.year for r in reuse if r.publication.year]
    if years:
        m.first_reuse_year = min(years)
        m.latest_reuse_year = max(years)
    if reuse:
        m.no_reuse_identified = False
