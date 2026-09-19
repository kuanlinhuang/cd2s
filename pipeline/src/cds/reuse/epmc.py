"""Europe PMC reuse tracing.

The central problem in measuring dataset reuse is that citing a dataset's paper is not
the same as using its data. A pan-cancer review that cites the TCGA marker paper in its
introduction is not reuse. A paper that downloads TCGA-BRCA expression matrices and
fits a model on them is. Conflating the two inflates every reuse statistic in the field.

Europe PMC makes the distinction tractable because it indexes article *sections*
separately and maintains a text-mined accession index. Where an accession appears tells
you a great deal about what the authors did with it:

  appears in Methods / Results / a table or figure  ->  they computed on it
  appears in a data-availability statement          ->  they declared using it
  appears only in the reference list or intro       ->  they cited a paper, not data

We encode that as a versioned search strategy so every count on the site is
reproducible, and so "none identified in our search" is a statement about a specific
documented query rather than a shrug.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import (
    Confidence,
    Evidence,
    Method,
    Publication,
    ReuseTier,
)

BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"

# Bump this when the queries below change; every stored count records the id it used.
STRATEGY_ID = "epmc-sectioned-v1"

# Europe PMC section fields, verified against the live API (a bogus field name returns
# zero hits, so a non-zero count confirms the field is indexed).
TIER_FIELDS: dict[ReuseTier, tuple[str, ...]] = {
    # The accession appears where the analysis itself is described.
    ReuseTier.T3_ANALYZED: ("METHODS", "RESULTS", "TABLE", "FIG", "SUPPL"),
    # The authors declared they used these data. Only the narrow DATA_AVAILABILITY
    # field is used: Europe PMC's broader AVAILABILITY field matched 3,421 of the 4,375
    # articles mentioning TCGA-BRCA anywhere, so it does not discriminate.
    ReuseTier.T2_DECLARED: ("DATA_AVAILABILITY",),
    # Europe PMC's text-mined accession index found it somewhere in the article.
    ReuseTier.T1_ACCESSION: ("ACCESSION_ID",),
    # Named, but only in framing text or the bibliography.
    ReuseTier.T0_MENTION: ("INTRO", "DISCUSS", "REF", "ACK_FUND"),
}

TIER_ORDER = [
    ReuseTier.T0_MENTION,
    ReuseTier.T1_ACCESSION,
    ReuseTier.T2_DECLARED,
    ReuseTier.T3_ANALYZED,
    ReuseTier.T4_CONFIRMED,
]

# Tokens we trust for counting. A token must be specific enough that a match is almost
# certainly about this dataset. Free-text program names ("CPTAC STAD") are not, because
# Europe PMC will match the words separately and inflate the count.
STRONG_TOKEN_PATTERNS = [
    re.compile(r"^phs\d{6}(\.v\d+\.p\d+)?$", re.I),  # dbGaP
    re.compile(r"^PDC\d{6}$", re.I),  # Proteomic Data Commons
    re.compile(
        r"^(TCGA|TARGET|CPTAC|CGCI|HCMI|MMRF|BEATAML|APOLLO|WCDT|REBC|CMI|MP2PRT|NCICCR|CDDP|CTSP|OHSU|VAREPOP|TRIO|PECGS|ORGANOID|EXCEPTIONAL)[-_][A-Z0-9\-]{2,}$",
        re.I,
    ),
    re.compile(r"^GSE\d{3,}$"),  # GEO series
    re.compile(r"^syn\d{6,}$"),  # Synapse
    re.compile(r"^EGA[SD]\d{8,}$"),  # EGA
    re.compile(r"^PRJ[A-Z]{2}\d+$"),  # BioProject
    re.compile(r"^PXD\d{6}$"),  # PRIDE
    re.compile(r"^(MSV\d{9})$"),  # MassIVE
    re.compile(r"^ST\d{6}$"),  # Metabolomics Workbench
    re.compile(r"^10\.7937/.+$"),  # TCIA DOI prefix
]


def is_strong_token(token: str) -> bool:
    t = token.strip()
    return any(p.match(t) for p in STRONG_TOKEN_PATTERNS)


@dataclass
class TierCount:
    tier: ReuseTier
    field: str
    token: str
    hit_count: int
    query: str
    url: str
    retrieved_at: datetime


def _search(
    client: Client,
    query: str,
    *,
    page_size: int = 1,
    result_type: str = "lite",
    cursor: str = "*",
) -> tuple[dict[str, Any], str, datetime]:
    params = {
        "query": query,
        "format": "json",
        "pageSize": str(page_size),
        "resultType": result_type,
        "cursorMark": cursor,
    }
    r = client.get(f"{BASE}/search", params=params)
    if not r.ok:
        return {}, r.url, r.retrieved_at
    return r.json(), r.url, r.retrieved_at


def count_tier(client: Client, token: str, tier: ReuseTier) -> list[TierCount]:
    """Hit counts for one token at one tier, one query per indexed section field."""
    out: list[TierCount] = []
    for field in TIER_FIELDS.get(tier, ()):
        query = f'{field}:"{token}"'
        data, url, at = _search(client, query)
        out.append(
            TierCount(
                tier=tier,
                field=field,
                token=token,
                hit_count=int(data.get("hitCount") or 0),
                query=query,
                url=url,
                retrieved_at=at,
            )
        )
    return out


def count_all_tiers(client: Client, token: str) -> dict[ReuseTier, int]:
    """Best (maximum) hit count per tier across that tier's section fields.

    We take the maximum rather than the sum because the same article can appear under
    several fields; summing would double count.
    """
    result: dict[ReuseTier, int] = {}
    for tier in (
        ReuseTier.T3_ANALYZED,
        ReuseTier.T2_DECLARED,
        ReuseTier.T1_ACCESSION,
        ReuseTier.T0_MENTION,
    ):
        counts = count_tier(client, token, tier)
        result[tier] = max((c.hit_count for c in counts), default=0)
    return result


def free_text_count(client: Client, token: str) -> int:
    data, _, _ = _search(client, f'"{token}"')
    return int(data.get("hitCount") or 0)


def citation_count(client: Client, pmid: str) -> int:
    """Articles citing a given PubMed record.

    This is the number a bibliometric analysis would report as a dataset's "impact". We
    collect it precisely so the site can contrast it with how many articles actually
    analyzed the data, which is usually far smaller.
    """
    if not pmid or not str(pmid).isdigit():
        return 0
    data, _, _ = _search(client, f"CITES:{pmid}_MED")
    return int(data.get("hitCount") or 0)


def _to_publication(hit: dict[str, Any]) -> Publication:
    ji = hit.get("journalInfo") or {}
    journal = (ji.get("journal") or {}).get("title")
    year = hit.get("pubYear")
    pmid = hit.get("pmid")
    pmcid = hit.get("pmcid")
    # PubMed first: Europe PMC returns 403 to automated requests, so its links look
    # broken to link checkers and to readers behind strict tooling.
    url = None
    if pmid:
        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
    elif hit.get("doi"):
        url = f"https://doi.org/{hit['doi']}"
    elif pmcid:
        url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
    return Publication(
        pmid=str(pmid) if pmid else None,
        pmcid=pmcid,
        doi=hit.get("doi"),
        title=hit.get("title"),
        journal=journal,
        year=int(year) if year and str(year).isdigit() else None,
        authors_short=_short_authors(hit.get("authorString")),
        url=url,
        is_open_access=hit.get("isOpenAccess") == "Y",
        citation_count=hit.get("citedByCount"),
    )


def _short_authors(author_string: str | None) -> str | None:
    if not author_string:
        return None
    first = author_string.split(",")[0].strip()
    parts = first.split()
    surname = parts[0] if parts else first
    return f"{surname} et al." if "," in author_string else surname


def author_surnames(author_string: str | None) -> set[str]:
    """Surnames, lowercased, for author-overlap tests."""
    if not author_string:
        return set()
    out: set[str] = set()
    for chunk in author_string.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        # Europe PMC formats authors as "Surname AB".
        surname = chunk.split()[0] if chunk.split() else chunk
        if len(surname) > 2:
            out.add(surname.lower())
    return out


def fetch_candidates(
    client: Client,
    token: str,
    tier: ReuseTier,
    *,
    limit: int = 40,
) -> tuple[list[tuple[Publication, str, set[str]]], list[str], datetime | None]:
    """Fetch candidate articles for a token at one tier.

    Returns (publication, matching field, author surnames) triples plus the queries run.
    """
    seen: dict[str, tuple[Publication, str, set[str]]] = {}
    queries: list[str] = []
    at: datetime | None = None
    for field in TIER_FIELDS.get(tier, ()):
        if len(seen) >= limit:
            break
        query = f'{field}:"{token}"'
        queries.append(query)
        cursor = "*"
        while len(seen) < limit:
            data, _, ts = _search(
                client, query, page_size=min(100, limit * 2), result_type="core", cursor=cursor
            )
            at = ts
            hits = (data.get("resultList") or {}).get("result") or []
            if not hits:
                break
            for h in hits:
                key = h.get("pmid") or h.get("pmcid") or h.get("doi") or h.get("id")
                if not key or key in seen:
                    continue
                seen[key] = (
                    _to_publication(h),
                    field,
                    author_surnames(h.get("authorString")),
                )
            nxt = data.get("nextCursorMark")
            if not nxt or nxt == cursor:
                break
            cursor = nxt
    return list(seen.values())[:limit], queries, at


def most_cited_in_window(
    client: Client, token: str, lo_year: int, hi_year: int, *, field: str = "METHODS"
) -> tuple[Publication | None, set[str], datetime | None]:
    """The most-cited article referencing this accession in a given year window.

    Needed because a dataset's marker paper will not appear in a relevance-ordered page
    of candidates once thousands of articles reference the accession - TCGA-BRCA has over
    two thousand. Asking directly for the most-cited article in the first years of
    availability finds it in one query.
    """
    query = f'{field}:"{token}" AND FIRST_PDATE:[{lo_year}-01-01 TO {hi_year}-12-31]'
    params = {
        "query": query,
        "format": "json",
        "pageSize": "5",
        "resultType": "core",
        "sort": "CITED desc",
    }
    r = client.get(f"{BASE}/search", params=params)
    if not r.ok:
        return None, set(), r.retrieved_at
    hits = (r.json().get("resultList") or {}).get("result") or []
    if not hits:
        return None, set(), r.retrieved_at
    top = hits[0]
    return (
        _to_publication(top),
        author_surnames(top.get("authorString")),
        r.retrieved_at,
    )


def classify_tier(matched_fields: set[str]) -> ReuseTier:
    """Highest tier justified by the sections the accession appeared in."""
    for tier in (ReuseTier.T3_ANALYZED, ReuseTier.T2_DECLARED, ReuseTier.T1_ACCESSION):
        if matched_fields & set(TIER_FIELDS[tier]):
            return tier
    return ReuseTier.T0_MENTION


def evidence_for(token: str, field: str, at: datetime | None) -> Evidence:
    tier = classify_tier({field})
    return Evidence(
        method=Method.FULLTEXT,
        source_url=(
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=" + f'{field}:"{token}"'
        ),
        source_label=f"Europe PMC section search ({field})",
        retrieved_at=at or datetime.now(UTC),
        locator=f'accession "{token}" indexed in {field}',
        confidence=Confidence.HIGH if tier == ReuseTier.T3_ANALYZED else Confidence.MEDIUM,
        note=(
            f"Search strategy {STRATEGY_ID}. Section placement is used to grade the "
            "strength of reuse evidence, not merely to confirm a citation."
        ),
    )


def strategy_description() -> dict[str, Any]:
    """Published alongside the data so the counts are auditable."""
    return {
        "strategy_id": STRATEGY_ID,
        "source": "Europe PMC RESTful Web Service",
        "endpoint": f"{BASE}/search",
        "documented_at": "https://europepmc.org/developers",
        "rationale": (
            "Citing a dataset's publication is not the same as reusing its data. "
            "Europe PMC indexes article sections separately and maintains a text-mined "
            "accession index, so the section in which an accession appears can be used "
            "to grade how strongly a paper depends on the data."
        ),
        "tiers": {
            tier.value: {
                "fields": list(fields),
                "interpretation": {
                    ReuseTier.T3_ANALYZED: "Accession appears where analysis is described; "
                    "the results plausibly depend on these data.",
                    ReuseTier.T2_DECLARED: "Authors declared use of these data in an "
                    "availability statement.",
                    ReuseTier.T1_ACCESSION: "Europe PMC's text-mined accession index "
                    "located the accession in the article.",
                    ReuseTier.T0_MENTION: "Named only in framing text or the bibliography; "
                    "counted but not reported as reuse.",
                }[tier],
            }
            for tier, fields in TIER_FIELDS.items()
        },
        "counting_rule": (
            "Per tier we take the maximum hit count across that tier's section fields "
            "rather than the sum, because one article can match several fields."
        ),
        "token_rule": (
            "Only specific accession-like tokens are counted (dbGaP phs, GDC project id, "
            "PDC study id, GEO series, Synapse id, EGA, BioProject, PRIDE, MassIVE, "
            "Metabolomics Workbench, TCIA DOI). Free-text program names are excluded "
            "because Europe PMC matches their words independently and inflates counts."
        ),
        "known_limitations": [
            "Section indexing requires full text, so closed-access articles are "
            "under-represented at tiers 2 and 3.",
            "Datasets whose accessions are rarely quoted (notably PDC study identifiers) "
            "will show near-zero counts even where real reuse exists; for these, absence "
            "of citation evidence is reported as such rather than as absence of reuse.",
            "Preprints and articles outside Europe PMC's corpus are not counted.",
            "Europe PMC's text-mined ACCESSION_ID index recognises repository accession "
            "formats such as dbGaP phs identifiers but not GDC project identifiers, so "
            "tier 1 counts are zero for datasets identified only by project id.",
        ],
    }
