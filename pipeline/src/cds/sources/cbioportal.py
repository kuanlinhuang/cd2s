"""cBioPortal adapter - the discovery channel for investigator-generated datasets.

The major programs are easy to enumerate because they have their own portals. The
long tail is not: a single lab publishes a cohort, deposits it, and it is thereafter
findable only by someone who already knows it exists. Roughly half of the value of NCI's
data investment sits in that tail.

cBioPortal is a good place to find it, because its curators have already done the hard
part - taking published cohorts and harmonising them into a comparable form - and they
record the PMID of the paper each study came from. That gives us a route the major
portals cannot: take every cBioPortal study, resolve its publication through NIH
RePORTER, and keep the ones an NCI award actually paid for. The result is a list of
NCI-supported investigator cohorts that no NCI catalog enumerates.

A caveat we carry on every record: cBioPortal hosts processed data. Presence here means
the cohort has been harmonized for reuse, which is a genuine signal of reusability, but
the record points back to the originating repository for the primary data.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import (
    Access,
    AccessTier,
    Assay,
    Cohort,
    Confidence,
    DatasetRecord,
    Evidence,
    FundingRole,
    Identifier,
    IdScheme,
    LongitudinalCoverage,
    Method,
    Modality,
    OntologyTerm,
    Publication,
    RepositoryNode,
)
from cds.sources import reporter as rp

API = "https://www.cbioportal.org/api"
PORTAL = "https://www.cbioportal.org"

CBIO_NODE = RepositoryNode(
    name="cBioPortal for Cancer Genomics",
    short_name="cBioPortal",
    url="https://www.cbioportal.org",
    is_nci_crdc_node=False,
    is_nih_repository=False,
)

# cBioPortal sample-count field -> (modality, label)
COUNT_MODALITY: list[tuple[str, Modality, str]] = [
    ("sequencedSampleCount", Modality.TARGETED_DNA, "Mutation calls (panel, exome or genome)"),
    ("cnaSampleCount", Modality.COPY_NUMBER, "Copy number alterations"),
    ("mrnaRnaSeqV2SampleCount", Modality.RNA_SEQ, "RNA sequencing expression"),
    ("mrnaRnaSeqSampleCount", Modality.RNA_SEQ, "RNA sequencing expression"),
    ("mrnaMicroarraySampleCount", Modality.RNA_SEQ, "Microarray expression"),
    ("miRnaSampleCount", Modality.MICRORNA, "microRNA expression"),
    ("methylationHm27SampleCount", Modality.METHYLATION, "DNA methylation (HM27)"),
    ("rppaSampleCount", Modality.PROTEIN_ARRAY, "Reverse phase protein array"),
    ("massSpectrometrySampleCount", Modality.PROTEOME, "Mass spectrometry proteomics"),
]

# Studies already represented by a primary-repository record; we link rather than duplicate.
AGGREGATE_PATTERNS = re.compile(
    r"(^|_)(tcga|pan_can_atlas|msk_impact_50k|metastatic_solid_tumors|pancan|"
    r"mixed_allen_2018|genie)($|_)",
    re.I,
)


def _slug(text: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-"))[:70]


def fetch_studies(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    r = client.get(f"{API}/studies", params={"projection": "DETAILED"})
    return (r.json() if r.ok else []), r.retrieved_at


def _ev(
    at: datetime, study_id: str, locator: str | None = None, conf: Confidence = Confidence.HIGH
) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=f"{API}/studies/{study_id}",
        source_label="cBioPortal API /studies",
        retrieved_at=at,
        locator=locator,
        confidence=conf,
    )


def to_record(
    study: dict[str, Any],
    at: datetime,
    nci_grants: list[Any],
    grant_at: datetime | None,
) -> DatasetRecord:
    sid = study["studyId"]
    ev = _ev(at, sid)
    name = study.get("name") or sid
    ct = study.get("cancerType") or {}
    pmid = str(study.get("pmid") or "").split(",")[0].strip() or None

    assays: list[Assay] = []
    seen: set[Modality] = set()
    for field, mod, label in COUNT_MODALITY:
        n = study.get(field) or 0
        if not n:
            continue
        if mod in seen:
            continue
        seen.add(mod)
        assays.append(
            Assay(
                modality=mod,
                label=label,
                n_samples=int(n),
                data_levels=["processed matrix"],
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator=f"field: {field}")],
            )
        )
    n_sv = study.get("structuralVariantCount") or 0
    if n_sv:
        assays.append(
            Assay(
                modality=Modality.STRUCTURAL_VARIANT,
                label="Structural variants / fusions",
                n_files=int(n_sv),
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator="field: structuralVariantCount")],
            )
        )
    n_tx = study.get("treatmentCount") or 0
    if n_tx:
        assays.append(
            Assay(
                modality=Modality.TREATMENT,
                label="Structured treatment records",
                n_samples=int(n_tx),
                access_tier=AccessTier.OPEN,
                evidence=[_ev(at, sid, locator="field: treatmentCount")],
            )
        )

    pubs: list[Publication] = []
    if pmid:
        pubs.append(
            Publication(
                pmid=pmid,
                title=None,
                authors_short=study.get("citation"),
                url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                evidence=[_ev(at, sid, locator="field: pmid")],
            )
        )

    tags = ["cbioportal", "investigator-cohort", "harmonized-for-reuse"]
    if n_tx:
        tags.append("treatment-annotated")
    if nci_grants:
        tags.append("nci-funded")

    return DatasetRecord(
        id=f"cbio-{_slug(sid)}",
        title=name,
        short_title=sid,
        aliases=[sid],
        summary=study.get("description") or None,
        identifiers=[
            Identifier(
                scheme=IdScheme.CBIOPORTAL_STUDY,
                value=sid,
                url=f"{PORTAL}/study/summary?id={sid}",
                is_primary=True,
                evidence=[ev],
            )
        ],
        repository=CBIO_NODE,
        program_name="Investigator-initiated cohort (harmonized in cBioPortal)",
        nci_program=None,
        program_url=f"{PORTAL}/study/summary?id={sid}",
        data_generation_funding_role=(
            FundingRole.GENERATION if nci_grants else FundingRole.UNKNOWN
        ),
        landing_page_url=f"{PORTAL}/study/summary?id={sid}",
        retrieved_at=at,
        cancer_types=[OntologyTerm(label=ct.get("name"), ontology="cBioPortal", code=ct.get("id"))]
        if ct.get("name")
        else [],
        primary_sites=[ct["parent"]] if ct.get("parent") else [],
        cohort=Cohort(
            n_samples=study.get("allSampleCount"),
            evidence=[_ev(at, sid, locator="field: allSampleCount")],
        ),
        assays=assays,
        longitudinal=LongitudinalCoverage(
            has_treatment_response=bool(n_tx) or None,
            evidence=[_ev(at, sid, locator="field: treatmentCount", conf=Confidence.MEDIUM)],
        ),
        access=Access(
            tier=AccessTier.OPEN,
            mechanism=(
                "Processed data download from the cBioPortal study page or its public "
                "REST API; no account required. Primary raw data remain wherever the "
                "original investigators deposited them."
            ),
            license="Per-study terms; cBioPortal asks that the original study be cited",
            citation_requirement=(
                "Cite the original publication, and cite cBioPortal if the portal's "
                "harmonized files were used."
            ),
            publication_policy_url="https://www.cbioportal.org/faq",
            login_required=False,
            open_components=["harmonized mutation, copy-number, expression and clinical files"],
            evidence=[_ev(at, sid, conf=Confidence.MEDIUM)],
        ),
        primary_publications=pubs,
        grants=nci_grants,
        tags=tags,
    )


def build(
    client: Client,
    *,
    limit: int | None = None,
    deep: bool = True,
    min_samples: int = 40,
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    studies, at = fetch_studies(client)
    kept = [
        s
        for s in studies
        if s.get("publicStudy")
        and (s.get("allSampleCount") or 0) >= min_samples
        and not AGGREGATE_PATTERNS.search(s.get("studyId") or "")
        and str(s.get("pmid") or "").strip()
    ]
    kept.sort(key=lambda s: -(s.get("allSampleCount") or 0))

    n_candidates = len(kept)
    grants_by_study: dict[str, list[Any]] = {}
    grant_at: datetime | None = None
    n_nci = 0
    if deep:
        pmids = [str(s["pmid"]).split(",")[0].strip() for s in kept]
        mapping, grant_at = rp.pmids_to_core_projects(client, pmids)
        all_nci_cores = sorted({c for cores in mapping.values() for c in cores if rp.is_nci(c)})
        details, _ = rp.fetch_project_details(client, all_nci_cores)
        for s in kept:
            pmid = str(s["pmid"]).split(",")[0].strip()
            cores = [c for c in mapping.get(pmid, []) if rp.is_nci(c)]
            if cores:
                n_nci += 1
            grants_by_study[s["studyId"]] = [
                rp.to_grant(
                    c,
                    details.get(c),
                    rp.infer_role(c, is_primary_publication=True),
                    pmid,
                    grant_at,
                )
                for c in cores
            ]

    # Keep NCI-supported cohorts. Without the grant lookup we cannot tell, so keep all.
    records = [
        to_record(s, at, grants_by_study.get(s["studyId"], []), grant_at)
        for s in kept
        if (not deep) or grants_by_study.get(s["studyId"])
    ]
    if limit:
        records = records[:limit]

    manifest = {
        "source": "cBioPortal",
        "api": API,
        "n_public_studies": len(studies),
        "n_candidates_after_filters": n_candidates,
        "n_with_nci_award_on_publication": n_nci,
        "n_records": len(records),
        "min_samples": min_samples,
        "filters": (
            "public studies with a PMID and at least min_samples samples, excluding "
            "TCGA/GENIE/pan-cancer aggregates already represented by primary-repository "
            "records; retained only where NIH RePORTER links the study's publication to "
            "an NCI (CA-series) award."
        ),
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
