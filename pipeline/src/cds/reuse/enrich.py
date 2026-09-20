"""Enrichment pass: availability dating, exemplar reuse studies, and funded-reuse links.

Runs only on datasets that have a citable accession, because for the rest none of these
questions can be answered from the literature.
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

from cds.http import Client
from cds.model import (
    Confidence,
    DatasetRecord,
    Evidence,
    Method,
    ReuseTier,
)
from cds.reuse import dating, epmc, markers, precision, trace
from cds.sources import reporter as rp


def _pick_primary(
    candidates: list[trace.Candidate], anchor_year: int | None
) -> trace.Candidate | None:
    """Infer the dataset's own marker paper.

    The marker paper is normally the earliest article that analyses the data and is
    heavily cited. We only ever mark this as a *candidate*, at low confidence, because
    getting it wrong would misattribute both the funding and the reuse independence
    tests. A curated override replaces it wherever a reviewer has supplied one.
    """
    if not candidates or anchor_year is None:
        return None
    early = [c for c in candidates if c.publication.year and c.publication.year <= anchor_year + 1]
    if not early:
        return None
    return max(early, key=lambda c: c.publication.citation_count or 0)


#: How an inferred primary publication is labelled, so the corpus-level check can find
#: the machine-nominated ones and leave a repository's own marker-paper link alone.
#: Defined once in `cds.reuse.markers`, which is also where the rule lives about what a
#: nomination may and may not be counted from.
INFERRED_LABEL = markers.INFERRED_LABEL
_is_inferred = markers.is_inferred


def drop_ambiguous_inferred_primaries(records: list[DatasetRecord]) -> dict[str, Any]:
    """Withdraw any machine-nominated marker paper claimed by more than one dataset.

    A marker paper describes one cohort. When the same article is nominated for several,
    the nomination is wrong for at least all but one of them and we cannot tell which,
    so it is withdrawn from all of them rather than asserted for each.

    This is not hypothetical. The heuristic - earliest heavily cited article that
    analysed the accession - nominated a pan-tissue DNA methylation clock as the marker
    paper for eleven separate TCGA projects, and put its citation count on the site's
    "most cited publications" board four times over. A methods paper that reused the data
    is exactly what the rest of this project exists to distinguish from a marker paper.

    Repository-supplied and reviewer-supplied publications are untouched; only the
    low-confidence inferences are withdrawn.
    """
    claims: dict[str, list[DatasetRecord]] = {}
    for rec in records:
        for pub in rec.primary_publications:
            if pub.pmid and _is_inferred(pub):
                claims.setdefault(pub.pmid, []).append(rec)

    shared = {pmid: recs for pmid, recs in claims.items() if len(recs) > 1}
    n_dropped = 0
    for pmid, sharers in shared.items():
        for rec in sharers:
            rec.primary_publications = [
                p for p in rec.primary_publications if not (p.pmid == pmid and _is_inferred(p))
            ]
            if not rec.primary_publications:
                rec.reuse_metrics.n_citations_to_primary_publication = None
                rec.reuse_metrics.citation_to_reuse_ratio = None
            rec.reuse_metrics.evidence.append(
                Evidence(
                    method=Method.DERIVED,
                    source_label="Marker-paper inference withdrawn",
                    retrieved_at=datetime.now(UTC),
                    locator=f"PMID {pmid} was nominated for {len(sharers)} datasets",
                    confidence=Confidence.HIGH,
                    note=(
                        "A marker paper describes one cohort. This article was inferred "
                        "as the marker paper for several datasets at once, which means "
                        "the inference is wrong for all but one of them and we cannot "
                        "tell which, so no marker paper is claimed for this record."
                    ),
                )
            )
            n_dropped += 1
    return {
        "n_inferred_primaries": len(claims),
        "n_shared_across_datasets": len(shared),
        "n_records_withdrawn": n_dropped,
        "withdrawn_pmids": sorted(shared),
    }


def _mentions_accession(client: Client, pub: Any, token: str) -> bool:
    """Whether a candidate marker paper actually names the accession.

    Unreadable counts as unproven. A closed-access article cannot be checked, and a
    nomination we cannot support is not one to publish under "Original publication" -
    the cost of dropping a correct guess is a blank, and the cost of keeping a wrong one
    is a false statement about whose work the dataset is.
    """
    if not pub.pmcid:
        return False
    text = precision._full_text(client, pub.pmcid)
    if text is None:
        return False
    return bool(precision._literal_pattern(token).search(text))


def enrich_record(
    client: Client,
    rec: DatasetRecord,
    *,
    max_exemplars: int = 10,
    link_grants: bool = True,
    shared: set[str] | None = None,
) -> dict[str, Any]:
    tokens = trace.tokens_for(rec, limit=3, shared=shared)
    info: dict[str, Any] = {"tokens": tokens, "skipped": False}
    if not tokens:
        info["skipped"] = True
        return info

    now = datetime.now(UTC)

    # 1. availability dating
    yrs, anchor, how = dating.years_available(client, tokens)
    rec.reuse_metrics.years_since_release = yrs
    if anchor:
        rec.release_date = rec.release_date or date(anchor, 1, 1)
        rec.reuse_metrics.evidence.append(
            Evidence(
                method=Method.DERIVED,
                source_url="https://www.ebi.ac.uk/europepmc/webservices/rest/search",
                source_label="Europe PMC first-reference dating",
                retrieved_at=now,
                locator=how,
                confidence=Confidence.MEDIUM,
                note=(
                    f"Availability dated from the literature ({dating.STRATEGY_ID}) rather "
                    "than from repository file timestamps, which record re-harmonization. "
                    "This is a lower bound on availability."
                ),
            )
        )
    info["anchor_year"] = anchor

    # 2. fetch every article that references the accessions
    candidates, queries, at_cands = trace.deep_candidates(client, rec, limit=60, shared=shared)
    info["n_candidates"] = len(candidates)
    info["n_queries"] = len(queries)

    # 3. establish the generating team *before* judging independence.
    #
    # The order matters. Independence is "no author overlaps the people who made the
    # data", so we need to know who they are first. For repositories that publish a
    # marker-paper link (HTAN, cBioPortal) we already have it; for the rest we nominate
    # the earliest heavily cited article that analyzed the data, clearly labeled as an
    # inference. Judging independence before this step would leave the generating set
    # empty and mark every article "unknown".
    authoritative_pmids = {p.pmid for p in rec.primary_publications if p.pmid}
    generator_surnames = trace.grant_pi_surnames(rec)
    for c in candidates:
        if c.publication.pmid and c.publication.pmid in authoritative_pmids:
            generator_surnames |= c.author_surnames

    # Re-nominate whenever the record carries nothing but a previous run's own guess.
    #
    # `enrich` reads and writes the same stage, so a nomination it made survives into
    # every later pass. Testing `not rec.primary_publications` meant a stale guess was
    # never revisited - including by the checks written specifically to reject it, which
    # silently did nothing on a re-run. A repository's or a reviewer's publication is
    # left exactly as it is; only this pipeline's own guesses are reconsidered.
    sourced = [p for p in rec.primary_publications if not markers.is_inferred(p)]
    if not sourced:
        rec.primary_publications = sourced
        cand = _pick_primary(candidates, anchor)
        cand_pub = cand.publication if cand else None
        cand_surnames = cand.author_surnames if cand else set()
        if cand_pub is None and anchor is not None:
            # A relevance-ordered candidate page will not reach back to the marker paper
            # for a heavily used dataset, so ask directly for the most-cited article in
            # the first years of availability.
            cand_pub, cand_surnames, _ = epmc.most_cited_in_window(
                client, tokens[0], anchor, anchor + 2
            )
        # A nomination has to be about this dataset at all.
        #
        # Every query behind these candidates is a two-word phrase match, because Europe
        # PMC indexes the hyphen in an accession as a word break. For an accession whose
        # words are ordinary English that returns ordinary English: TARGET-RT nominated
        # "Timed picture naming in seven languages", a 2003 psycholinguistics paper, as
        # the marker paper for a rhabdoid tumour cohort, and the page printed it under
        # "Original publication".
        #
        # So the nominee must contain the literal accession in its full text. It is the
        # same check the count correction runs, against one article, and an article that
        # never names the dataset cannot be the paper that describes it.
        if cand_pub is not None and not _mentions_accession(client, cand_pub, tokens[0]):
            info["rejected_primary_pmid"] = cand_pub.pmid
            cand_pub, cand_surnames = None, set()

        if cand_pub is not None:
            pub = cand_pub.model_copy(deep=True)
            pub.evidence = [
                Evidence(
                    method=Method.DERIVED,
                    source_label=INFERRED_LABEL,
                    retrieved_at=now,
                    locator=(
                        f"earliest highly cited article analyzing {tokens[0]} "
                        f"(published {pub.year})"
                    ),
                    confidence=Confidence.LOW,
                    note=(
                        "Inferred, not authoritative. The source repository does not "
                        "publish a marker-paper link for this dataset, so we nominate the "
                        "earliest heavily cited article that analyzed it. Flagged for "
                        "expert review before being relied on."
                    ),
                )
            ]
            rec.primary_publications = [pub]
            authoritative_pmids = {pub.pmid} if pub.pmid else set()
            generator_surnames |= cand_surnames
            info["inferred_primary_pmid"] = pub.pmid

    info["n_generator_surnames"] = len(generator_surnames)

    # 4. grade the remainder, now that independence is answerable
    exemplars = trace.build_reuse_records(
        candidates,
        exclude_pmids=authoritative_pmids,
        token=tokens[0],
        at=at_cands,
        max_exemplars=max_exemplars,
    )
    trace.apply_deep(rec, exemplars, n_examined=len(candidates))

    # 5. NCI-funded reuse: which downstream studies were themselves NCI funded
    if link_grants and rec.reuse:
        pmids = [x.publication.pmid for x in rec.reuse if x.publication.pmid]
        if pmids:
            mapping, at = rp.pmids_to_core_projects(client, pmids)
            nci_cores = sorted({c for cores in mapping.values() for c in cores if rp.is_nci(c)})
            details, _ = rp.fetch_project_details(client, nci_cores[:60])
            existing = {g.core_project_num for g in rec.grants}
            for x in rec.reuse:
                pm = x.publication.pmid
                if not pm:
                    continue
                cores = [c for c in mapping.get(pm, []) if rp.is_nci(c)]
                x.nci_funded_reuse = bool(cores)
                x.linked_grants = cores
                for c in cores:
                    if c in existing:
                        continue
                    existing.add(c)
                    rec.grants.append(
                        rp.to_grant(
                            c,
                            details.get(c),
                            rp.infer_role(c, is_primary_publication=False),
                            pm,
                            at,
                        )
                    )
            rec.reuse_metrics.n_nci_funded_reuse = sum(
                1 for x in rec.reuse if x.nci_funded_reuse
            )
            info["n_nci_funded_reuse"] = rec.reuse_metrics.n_nci_funded_reuse

    # Recompute the headline counts now that exemplars carry independence flags.
    verified = [x for x in rec.reuse if x.tier in (ReuseTier.T3_ANALYZED, ReuseTier.T4_CONFIRMED)]
    rec.reuse_metrics.n_independent_reuse = sum(
        1 for x in verified if x.independent_of_generators is True
    )
    return info
