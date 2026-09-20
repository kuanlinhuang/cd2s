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
    FundingRole,
    IdScheme,
    Method,
    Publication,
    ReuseKind,
    ReuseMetrics,
    ReuseRecord,
    ReuseTier,
)
from cds.reuse import epmc, markers, precision

# Fixed field set for the comparable index. Documented on the site and in the export.
#
# T3 asks METHODS alone, although Europe PMC also indexes RESULTS and usually returns
# more hits there. Two reasons, and the second is the one that matters. RESULTS is the
# noisier field: `dating` already excludes it because it dated TARGET-AML to 2005, four
# years before the program existed. And because this tier used to take the *maximum*
# across both fields, the noisier field won whenever it was noisier - the rule was
# structurally biased towards whichever number was most inflated. Asking one field is
# the only version of this that is comparable across datasets, which is the entire
# purpose of the index pass.
INDEX_FIELDS: dict[ReuseTier, tuple[str, ...]] = {
    ReuseTier.T3_ANALYZED: ("METHODS",),
    ReuseTier.T2_DECLARED: ("DATA_AVAILABILITY",),
    ReuseTier.T1_ACCESSION: ("ACCESSION_ID",),
    ReuseTier.T0_MENTION: ("REF", "INTRO"),
}
INDEX_STRATEGY_ID = "epmc-index-v3"

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


def shared_accessions(records: list[DatasetRecord]) -> set[str]:
    """Accessions that more than one dataset in the corpus claims.

    An umbrella accession measures its program, not its member datasets, and counting
    one as a dataset's own is how fourteen TCGA projects came to report the identical
    reuse count. They all carry `phs000178`, the dbGaP accession for the whole of TCGA;
    `METHODS:"phs000178"` returns 395; and because the index pass took the maximum
    across a dataset's accessions, 395 beat the project's own count and was published as
    the reuse of Uterine Carcinosarcoma, of Cholangiocarcinoma, of Uveal Melanoma and of
    eleven others alike.

    The corpus itself is the evidence for which accessions those are: an identifier that
    several records claim is by construction not specific to any one of them. Deriving
    the set this way rather than listing the known umbrellas means a new program is
    handled the day it is ingested.
    """
    owners: dict[str, set[str]] = {}
    for rec in records:
        for ident in rec.identifiers:
            owners.setdefault(ident.value.strip(), set()).add(rec.id)
    return {value for value, ids in owners.items() if len(ids) > 1}


def tokens_for(
    rec: DatasetRecord,
    *,
    limit: int = MAX_INDEX_TOKENS,
    shared: set[str] | None = None,
) -> list[str]:
    """Specific, citable accessions for this dataset, best first.

    `shared` is the corpus-wide set of accessions claimed by more than one dataset; see
    `shared_accessions`. Anything in it is excluded, because a count made from it would
    describe the program rather than this dataset.
    """
    shared = shared or set()
    by_scheme: dict[IdScheme, list[str]] = {}
    for ident in rec.identifiers:
        by_scheme.setdefault(ident.scheme, []).append(ident.value)
    out: list[str] = []
    for scheme in TOKEN_SCHEMES:
        for v in by_scheme.get(scheme, []):
            v = v.strip()
            if not v or v in out or v in shared:
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
    """Max hit count across the given fields, and the query that produced it.

    The query comes back even when the count is zero. A caller that reads an empty query
    as "no measurement was made" would turn every genuine zero into a blank, and a
    measured zero is the most informative number this index produces: it is the dataset
    nobody has used.
    """
    best = 0
    best_q = f'{fields[0]}:"{token}"' if fields else ""
    for field in fields:
        query = f'{field}:"{token}"'
        data, _, _ = epmc._search(client, query)
        n = int(data.get("hitCount") or 0)
        if n > best:
            best, best_q = n, query
    return best, best_q


def _primary_citations(client: Client, rec: DatasetRecord) -> int | None:
    """Citations to the dataset's own publications, summed over distinct papers.

    Only authoritative marker papers count. A paper this pipeline nominated itself is a
    reading suggestion, and citations to it are citations to somebody's reuse of the
    data, not attention to the cohort - see `cds.reuse.markers`.
    """
    pmids = [p for p in markers.authoritative_marker_pmids(rec) if p.isdigit()]
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


def _corrected_tier_counts(
    client: Client, toks: list[str]
) -> tuple[
    dict[str, int], dict[str, int], dict[str, str], precision.AccessionPrecision | None, bool
]:
    """Tier counts for one dataset, corrected for Europe PMC's hyphen tokenization.

    Precision is measured once per accession, against the methods-section query, and
    then applied to every tier that accession wins. Measuring it per tier as well would
    quadruple the number of full texts fetched for a correction that is a property of
    how the accession is tokenized, not of which section it was found in.

    Where a tier's best accession has no usable precision estimate the tier is left out
    of the result entirely rather than defaulted to its raw count or to zero. A missing
    tier renders as "not measured"; a zero would read as "nobody used this".

    The last element of the result says whether any hits were dropped that way. A
    dataset can have an exact zero in one tier and uncorrectable hits in another, and
    the zero on its own would otherwise let the record claim nobody used it.

    Estimating is the expensive half of this - it retrieves a full text per sampled
    article - so an accession is only measured once something has been found under it.
    Most of the corpus has no literature hits at all, and sampling for a correction to
    zero would fetch thousands of articles to multiply nothing by a fraction.
    """
    raw_by_token: dict[str, dict[str, tuple[int, str]]] = {}
    for tier, fields in INDEX_FIELDS.items():
        for tok in toks:
            raw, query = _count_with_fields(client, tok, fields)
            if query:
                raw_by_token.setdefault(tok, {})[tier.value] = (raw, query)

    estimates: dict[str, precision.AccessionPrecision] = {}
    for tok in toks:
        found_anything = any(raw for raw, _ in raw_by_token.get(tok, {}).values())
        estimates[tok] = (
            precision.measure(client, tok, f'METHODS:"{tok}"')
            if found_anything
            else precision.unmeasured(tok, f'METHODS:"{tok}"')
        )

    corrected: dict[str, int] = {}
    raw_counts: dict[str, int] = {}
    winning_queries: dict[str, str] = {}
    dropped = False
    for tier in INDEX_FIELDS:
        best: tuple[int, int, str] | None = None  # (corrected, raw, query)
        for tok in toks:
            entry = raw_by_token.get(tok, {}).get(tier.value)
            if entry is None:
                continue
            raw, query = entry
            value = precision.correct(raw, estimates[tok])
            if value is None:
                dropped = dropped or raw > 0
                continue
            if best is None or value > best[0]:
                best = (value, raw, query)
        if best is None:
            continue
        corrected[tier.value], raw_counts[tier.value], winning_queries[tier.value] = best

    # The estimate shown on the page is the one behind the headline T3 number.
    t3_query = winning_queries.get(ReuseTier.T3_ANALYZED.value)
    t3_estimate = next(
        (e for e in estimates.values() if e.query == t3_query),
        estimates.get(toks[0]) if toks else None,
    )
    return corrected, raw_counts, winning_queries, t3_estimate, dropped


def index_pass(
    client: Client, rec: DatasetRecord, *, shared: set[str] | None = None
) -> ReuseMetrics:
    """Comparable tier counts for one dataset."""
    toks = tokens_for(rec, shared=shared)
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

    by_tier, raw_by_tier, winning_queries, est, dropped_hits = _corrected_tier_counts(
        client, toks
    )

    n_verified = by_tier.get(ReuseTier.T3_ANALYZED.value)
    screened = max(by_tier.values(), default=0)
    measured = bool(by_tier)

    return ReuseMetrics(
        n_candidates_screened=screened,
        n_by_tier=by_tier,
        n_by_tier_raw=raw_by_tier,
        accession_precision=est,
        n_verified_reuse=n_verified,
        n_reuse_examined=0,  # filled by the deep pass
        n_independent_reuse=0,  # filled by the deep pass
        n_citations_to_primary_publication=cites,
        citation_to_reuse_ratio=(round(cites / n_verified, 1) if cites and n_verified else None),
        has_citable_accession=True,
        # "Nobody has used this" is a claim, and it needs a measurement behind it. A
        # dataset whose counts could not be corrected has not been measured, so it does
        # not get to make the claim - not even when the tiers that could be corrected
        # all came back as an exact zero.
        no_reuse_identified=(measured and screened == 0 and not dropped_hits),
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
                    "the same single section field per tier, so the counts are comparable; "
                    "the per-tier value is the largest across the dataset's own accessions, "
                    "excluding any accession shared with other datasets in the corpus. "
                    + (
                        est.note
                        if est is not None and est.note
                        else "Counts are corrected for Europe PMC's accession tokenization."
                    )
                ),
            )
        ],
    )


@dataclass
class Candidate:
    """A publication that references the dataset, with everything needed to grade it."""

    publication: Publication
    fields: set[str]
    author_keys: set[str]


def deep_candidates(
    client: Client, rec: DatasetRecord, *, limit: int = 40, shared: set[str] | None = None
) -> tuple[list[Candidate], list[str], datetime | None]:
    """Every article referencing this dataset's accessions, with matched sections."""
    toks = tokens_for(rec, limit=4, shared=shared)
    found: dict[str, Candidate] = {}
    queries: list[str] = []
    at: datetime | None = None
    for tok in toks:
        for tier in (ReuseTier.T3_ANALYZED, ReuseTier.T2_DECLARED, ReuseTier.T1_ACCESSION):
            cands, qs, ts = epmc.fetch_candidates(client, tok, tier, limit=limit)
            queries.extend(qs)
            at = ts or at
            for pub, field, keys in cands:
                key = pub.pmid or pub.doi or (pub.title or "")[:80]
                if not key:
                    continue
                existing = found.get(key)
                if existing is None:
                    found[key] = Candidate(
                        publication=pub,
                        fields={field},
                        author_keys=keys,
                    )
                else:
                    existing.fields.add(field)
                    existing.author_keys |= keys
    return list(found.values()), queries, at


def generator_keys(rec: DatasetRecord) -> set[str]:
    """Who made this dataset, as "surname initial", from the awards that paid for it.

    Only awards marked as generation count. An award that funded a later analysis, or a
    cancer centre's core grant, did not make these data, and folding its investigators
    into the generating team would mark their unrelated work as non-independent reuse.

    Europe PMC writes an author surname-first, as "Smith JA". RePORTER does not: it
    writes "Raju S. Kucherlapati", given name first, and sometimes "SMITH, JOHN A" with
    a comma. Both have to reduce to "smith j" or the two sets never intersect and every
    article looks independent - which is the failure this function had on its first
    outing, reporting 434 independent reuses and not one overlap in the whole corpus.
    """
    out: set[str] = set()
    for g in rec.grants:
        if g.role != FundingRole.GENERATION:
            continue
        for name in g.pi_names:
            key = _person_key(name)
            if key:
                out.add(key)
    return out


def _person_key(name: str) -> str | None:
    """"Raju S. Kucherlapati" and "KUCHERLAPATI, RAJU S" both become "kucherlapati r"."""
    surname_first, comma, rest = name.partition(",")
    if comma:
        surname = surname_first.strip()
        given = rest.strip().split()
    else:
        parts = [p for p in name.replace(".", " ").split() if p]
        if not parts:
            return None
        surname = parts[-1]
        given = parts[:-1]
    if len(surname) <= 2:
        return None
    initial = given[0][0].lower() if given and given[0] else ""
    return f"{surname.lower()} {initial}".strip()


def refresh_independence(records: list[DatasetRecord]) -> dict[str, int]:
    """Decide independence once the generating team is actually known.

    This used to be settled while the articles were being fetched, which is too early:
    a dataset's generation awards are attributed later, from its marker paper, so at
    fetch time most records knew nobody who made them and every article came back
    "unknown". TCGA-OV reported none of the 110 articles it examined as independent,
    which read as a finding about the articles and was a fact about the ordering.

    Runs after funding attribution. Where the generating team is still unknown the flag
    stays unknown, because "we could not check" and "the same people wrote it" are
    different statements and only one of them is about the article.
    """
    stats = {"n_records": 0, "n_independent": 0, "n_overlapping": 0, "n_unknown": 0}
    for rec in records:
        if not rec.reuse:
            continue
        team = generator_keys(rec)
        stats["n_records"] += 1
        for x in rec.reuse:
            if not team or not x.author_keys:
                x.independent_of_generators = None
                stats["n_unknown"] += 1
                continue
            overlaps = bool(set(x.author_keys) & team)
            x.independent_of_generators = not overlaps
            stats["n_overlapping" if overlaps else "n_independent"] += 1
        verified = [
            x
            for x in rec.reuse
            if x.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)
        ]
        rec.reuse_metrics.n_independent_reuse = sum(
            1 for x in verified if x.independent_of_generators is True
        )
    return stats


def build_reuse_records(
    candidates: list[Candidate],
    *,
    exclude_pmids: set[str],
    token: str,
    at: datetime | None,
    max_exemplars: int = 12,
) -> list[ReuseRecord]:
    """Grade candidates into reuse records, ranked by evidence strength.

    Independence is deliberately *not* decided here, and deliberately not ranked on
    either. It depends on knowing who made the dataset, and that is only established
    once generation funding has been attributed from the marker paper - which happens
    two stages later. Deciding it now produced the answer "unknown" for every article on
    every record whose awards had not yet been resolved. `refresh_independence` settles
    it afterwards, against author keys rather than bare surnames.

    Ranking on the bare-surname answer was the subtler half of the same bug: the flag it
    wrote was overwritten later, but the truncation to `max_exemplars` was not, so a
    highly cited article by "Chen J" could be cut from the list for sharing a surname
    with a generator while the later, stricter pass would have called it independent.
    """
    out: list[ReuseRecord] = []
    for c in candidates:
        if c.publication.pmid and c.publication.pmid in exclude_pmids:
            continue
        tier = epmc.classify_tier(c.fields)
        out.append(
            ReuseRecord(
                publication=c.publication,
                tier=tier,
                kind=ReuseKind.SECONDARY_ANALYSIS,
                accession_locator=", ".join(sorted(c.fields)),
                author_keys=sorted(c.author_keys),
                evidence=[epmc.evidence_for(token, sorted(c.fields)[0], at)],
            )
        )

    tier_rank = {t: i for i, t in enumerate(epmc.TIER_ORDER)}
    out.sort(
        key=lambda r: (
            -tier_rank[r.tier],
            -(r.publication.citation_count or 0),
            -(r.publication.year or 0),
        )
    )
    return out[:max_exemplars]


def apply_deep(rec: DatasetRecord, reuse: list[ReuseRecord], *, n_examined: int) -> None:
    """Attach deep-pass results and refresh the derived counts.

    `n_examined` is how many articles the deep pass actually retrieved and graded. It is
    recorded because everything else this function sets is a count *of that sample*: the
    deep pass reads tens of articles, not the hundreds the index pass counts. Without the
    denominator beside them, "10 independent" and "first reused in 2022" both read as
    statements about the whole population, and for TCGA-OV both were wrong - 10 came out
    of 12 articles examined, and the record's own dating evidence puts the first
    reference in 2011, eleven years before the earliest article in the sample.
    """
    rec.reuse = reuse
    m = rec.reuse_metrics
    m.n_reuse_examined = n_examined
    verified = [r for r in reuse if r.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)]
    m.n_independent_reuse = sum(1 for r in verified if r.independent_of_generators is True)
    years = [r.publication.year for r in reuse if r.publication.year]
    if years:
        m.first_reuse_year = min(years)
        m.latest_reuse_year = max(years)
    if reuse:
        m.no_reuse_identified = False
