"""NCI Imaging Data Commons adapter (which wraps The Cancer Imaging Archive collections).

Imaging is the most under-reused modality in the NCI portfolio relative to its size -
tens of terabytes across well over a hundred collections. A large part of the reason is
that imaging collections are hard to match to a research question: a researcher who
wants "CT scans with matched transcriptomics and outcome" has no way to ask for that.
The collection and patient counts are read from the API on every build and reported in
the ingest manifest rather than quoted here, because a number in a docstring is a
number nobody updates.

IDC's `supporting_data` field records exactly which other modalities accompany the
images, so we can answer that question. We also mine each description for cross-
repository accessions (GEO series, DOIs, dbGaP), which recovers imaging-genomics pairs
that are otherwise invisible - NSCLC Radiogenomics, for instance, links its CT and
PET/CT to a GEO expression series in prose alone.

We also record whether IDC serves a clinical table for each collection at all. Its
clinical columns are named by the submitting trial, so they cannot be graded field by
field against the harmonized repositories - but "there is no clinical table here" is a
fact a researcher needs before choosing a collection for an outcome study, and it is one
the collection's own `supporting_data` field sometimes contradicts.
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
    Limitation,
    LimitationKind,
    Method,
    Modality,
    OntologyTerm,
    RepositoryNode,
    Severity,
)

API = "https://api.imaging.datacommons.cancer.gov/v3"
PORTAL = "https://portal.imaging.datacommons.cancer.gov"

IDC_NODE = RepositoryNode(
    name="NCI Imaging Data Commons",
    short_name="IDC",
    url="https://portal.imaging.datacommons.cancer.gov",
    is_nci_crdc_node=True,
    is_nih_repository=True,
)

SUPPORTING_MODALITY: dict[str, Modality] = {
    "clinical": Modality.CLINICAL,
    "genomics": Modality.WGS,
    "proteomics": Modality.PROTEOME,
    "histopathology": Modality.HISTOPATHOLOGY,
    "microarray": Modality.RNA_SEQ,
    "image analyses": Modality.RADIOLOGY,
    "organ segmentations": Modality.RADIOLOGY,
}

# Accessions that appear in collection prose, recovered to build cross-repository links.
ACCESSION_PATTERNS: list[tuple[IdScheme, re.Pattern[str]]] = [
    (IdScheme.GEO_SERIES, re.compile(r"\b(GSE\d{3,7})\b")),
    (IdScheme.DBGAP, re.compile(r"\b(phs\d{6})\b", re.I)),
    (IdScheme.DOI, re.compile(r"\b(10\.7937/[^\s)\"']+)")),
    (IdScheme.ZENODO, re.compile(r"\b(10\.5281/zenodo\.\d+)\b")),
    (IdScheme.SRA_BIOPROJECT, re.compile(r"\b(PRJ[A-Z]{2}\d+)\b")),
    (IdScheme.GDC_PROJECT, re.compile(r"\b(TCGA-[A-Z]{2,4})\b")),
]


def _clean(text: str | None) -> str | None:
    if not text:
        return None
    # IDC descriptions are hard-wrapped and repeat bare URLs in parentheses.
    t = re.sub(r"\s*\(https?://[^)]+\)", "", text)
    t = re.sub(r"\s*\n\s*", " ", t)
    return re.sub(r"\s{2,}", " ", t).strip() or None


def _ev(
    url: str, at: datetime, locator: str | None = None, conf: Confidence = Confidence.HIGH
) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=url,
        source_label="IDC v3 API /collections",
        retrieved_at=at,
        locator=locator,
        confidence=conf,
    )


def fetch_collections(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    r = client.get(f"{API}/collections")
    return (r.json() if r.ok else []), r.retrieved_at


def fetch_analysis_results(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    r = client.get(f"{API}/analysis_results")
    return (r.json() if r.ok else []), r.retrieved_at


def fetch_clinical_tables(client: Client) -> tuple[dict[str, list[dict[str, Any]]], datetime, str]:
    """Which collections ship a clinical table, and how wide it is.

    IDC serves clinical data as per-collection tables whose columns are whatever the
    submitting trial recorded - `i_spy_2_research_id`, `t0`, `dlco`. There is no
    harmonized vocabulary to grade against, so the six verdicts stay "not measured" for
    every imaging collection. What is worth measuring, and what nothing else states, is
    whether a clinical table exists at all: a collection with images and no clinical
    table cannot support an outcome analysis no matter how many scans it holds.
    """
    url = f"{API}/clinical/tables"
    r = client.get(url)
    if not r.ok:
        return {}, r.retrieved_at, url
    by_collection: dict[str, list[dict[str, Any]]] = {}
    for t in (r.json() or {}).get("tables") or []:
        cid = str(t.get("collection_id") or "")
        if cid:
            by_collection.setdefault(cid, []).append(t)
    return by_collection, r.retrieved_at, url


def _slug(text: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-"))[:70]


def to_record(
    coll: dict[str, Any],
    at: datetime,
    derived: list[dict[str, Any]],
    clinical_tables: list[dict[str, Any]] | None = None,
    clinical_at: datetime | None = None,
    clinical_url: str | None = None,
) -> DatasetRecord:
    cid = coll["collection_id"]
    url = f"{API}/collections/{cid}"
    ev = _ev(url, at)
    desc = _clean(coll.get("description"))

    supporting_raw = coll.get("supporting_data") or ""
    supporting = [s.strip().lower() for s in supporting_raw.split(",") if s.strip()]

    dicom_modalities = [
        m.strip() for m in str(coll.get("modalities") or "").split(",") if m.strip()
    ]
    assays: list[Assay] = [
        Assay(
            modality=Modality.RADIOLOGY,
            label="DICOM medical imaging"
            + (f" ({', '.join(dicom_modalities[:6])})" if dicom_modalities else ""),
            platform=", ".join(dicom_modalities[:6]) or None,
            n_cases=coll.get("patients") or coll.get("subjects"),
            n_samples=coll.get("studies"),
            n_files=coll.get("instances"),
            data_levels=["DICOM series"],
            access_tier=AccessTier.OPEN,
            evidence=[ev],
        )
    ]
    seen = {Modality.RADIOLOGY}
    for s in supporting:
        mod = SUPPORTING_MODALITY.get(s)
        if mod is None or mod in seen:
            continue
        assays.append(
            Assay(
                modality=mod,
                label=f"{s.title()} (accompanying data, per IDC supporting_data)",
                evidence=[_ev(url, at, locator="field: supporting_data", conf=Confidence.MEDIUM)],
            )
        )
        seen.add(mod)

    # Cross-repository accessions found in the description.
    idents: list[Identifier] = [
        Identifier(
            scheme=IdScheme.IDC_COLLECTION,
            value=cid,
            url=f"{PORTAL}/explore/?collection_id={cid}",
            is_primary=True,
            evidence=[ev],
        ),
        Identifier(
            scheme=IdScheme.TCIA_COLLECTION,
            value=coll.get("collection_name") or cid,
            url="https://www.cancerimagingarchive.net/collections/",
            evidence=[ev],
        ),
    ]
    text = coll.get("description") or ""
    for scheme, pat in ACCESSION_PATTERNS:
        for m in dict.fromkeys(pat.findall(text)):
            snippet_at = text.find(m)
            snippet = _clean(text[max(0, snippet_at - 120) : snippet_at + 120])
            idents.append(
                Identifier(
                    scheme=scheme,
                    value=m,
                    evidence=[
                        Evidence(
                            method=Method.FULLTEXT,
                            source_url=url,
                            source_label="IDC collection description",
                            retrieved_at=at,
                            snippet=snippet,
                            locator="accession extracted from description prose",
                            confidence=Confidence.MEDIUM,
                            note="Cross-repository link recovered from prose; verify before relying on it.",
                        )
                    ],
                )
            )

    cancer_types = [
        OntologyTerm(label=c.strip())
        for c in (coll.get("cancer_types") or "").split(",")
        if c.strip()
    ]
    sites = [s.strip() for s in (coll.get("tumor_locations") or "").split(",") if s.strip()]

    my_derived = [d for d in derived if cid in (d.get("collections") or "")]

    # Whether IDC serves a clinical table for this collection at all.
    #
    # This is not a field-completeness measurement and is deliberately not reported as
    # one: IDC's clinical columns are whatever the submitting trial recorded, so there is
    # no harmonized field to grade. What is worth stating, and what no catalog states, is
    # the binary. A collection of scans with no clinical table cannot support an outcome
    # analysis however many scans it holds, and that belongs in the limitations a reader
    # sees before they choose it.
    tables = clinical_tables or []
    limitations: list[Limitation] = []
    if clinical_url:
        n_cols = sum(int(t.get("column_count") or 0) for t in tables)
        says_clinical = "clinical" in supporting
        table_ev = Evidence(
            method=Method.API,
            source_url=clinical_url,
            source_label="IDC v3 API /clinical/tables",
            retrieved_at=clinical_at or at,
            locator=(
                f"collection_id={cid}: {len(tables)} table(s), {n_cols} columns in total"
                if tables
                else f"collection_id={cid}: no clinical table is served"
            ),
            confidence=Confidence.HIGH,
        )
        if not tables:
            limitations.append(
                Limitation(
                    kind=LimitationKind.MISSING_DATA,
                    statement=(
                        "IDC serves no clinical table for this collection, so nothing "
                        "about outcome, stage, treatment or demographics can be read "
                        "from the repository. Any such variable would have to come from "
                        "the originating trial or publication."
                        + (
                            " The collection's own supporting_data field nevertheless "
                            "lists clinical data, so the two disagree."
                            if says_clinical
                            else ""
                        )
                    ),
                    severity=Severity.BLOCKING,
                    affected_analyses=[
                        "survival",
                        "treatment response",
                        "stage-adjusted modelling",
                        "analysis by race or ethnicity",
                    ],
                    evidence=[table_ev],
                )
            )
        else:
            limitations.append(
                Limitation(
                    kind=LimitationKind.HARMONIZATION,
                    statement=(
                        f"Clinical data arrive as {len(tables)} collection-specific "
                        f"table(s) with {n_cols} columns in total, named by the "
                        "submitting trial rather than by a shared vocabulary. The "
                        "variables exist, but they cannot be compared field by field "
                        "with the harmonized repositories, so this record's analysis "
                        "verdicts stay unmeasured."
                        + (
                            " The collection's supporting_data field does not list "
                            "clinical data even though a table is served."
                            if not says_clinical
                            else ""
                        )
                    ),
                    severity=Severity.MAJOR,
                    mitigation=(
                        "Read the table's own schema from "
                        f"{API}/clinical/tables before planning an analysis."
                    ),
                    evidence=[table_ev],
                )
            )

    tags = ["idc", "imaging"]
    if tables:
        tags.append("has-clinical-table")
    if "genomics" in supporting:
        tags.append("imaging-genomics")
    if "proteomics" in supporting:
        tags.append("imaging-proteomics")
    if "histopathology" in supporting:
        tags.append("imaging-pathology")
    if my_derived:
        tags.append("has-derived-annotations")
    species = (coll.get("species") or "").lower()
    if species and "human" not in species:
        tags.append("non-human")

    return DatasetRecord(
        id=f"idc-{_slug(cid)}",
        title=coll.get("collection_name") or cid,
        short_title=cid,
        aliases=[cid],
        summary=desc,
        identifiers=idents,
        repository=IDC_NODE,
        program_name="NCI Imaging Data Commons / The Cancer Imaging Archive",
        nci_program="IDC",
        program_url="https://imaging.datacommons.cancer.gov/",
        data_generation_funding_role=FundingRole.UNKNOWN,
        landing_page_url=f"{PORTAL}/explore/?collection_id={cid}",
        retrieved_at=at,
        cancer_types=cancer_types,
        primary_sites=sites,
        cohort=Cohort(
            n_cases=coll.get("patients") or coll.get("subjects"),
            n_samples=coll.get("series"),
            n_files=coll.get("instances"),
            evidence=[ev],
        ),
        assays=assays,
        limitations=limitations,
        access=Access(
            tier=AccessTier.OPEN,
            mechanism=(
                "Public DICOM download from the IDC portal, its API, or the "
                "idc-index Python package; no account required for public collections."
            ),
            license=str(coll.get("licenses") or "").strip()
            or "Per-collection license, typically CC BY 3.0/4.0 or CC BY-NC",
            citation_requirement=(
                "Cite the collection DOI and the IDC/TCIA data-citation guidance."
            ),
            publication_policy_url="https://www.cancerimagingarchive.net/data-usage-policies-and-restrictions/",
            login_required=False,
            evidence=[ev],
        ),
        tags=tags,
        related_dataset_ids=[],
    )


def build(
    client: Client, *, limit: int | None = None, deep: bool = True
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    colls, at = fetch_collections(client)
    derived, _ = fetch_analysis_results(client) if deep else ([], at)
    tables: dict[str, list[dict[str, Any]]] = {}
    tables_at: datetime | None = None
    tables_url: str | None = None
    if deep:
        tables, tables_at, tables_url = fetch_clinical_tables(client)
    colls = [c for c in colls if c.get("collection_id")]
    colls.sort(key=lambda c: -(c.get("patients") or c.get("subjects") or 0))
    if limit:
        colls = colls[:limit]
    records = [
        to_record(
            c,
            at,
            derived,
            clinical_tables=tables.get(str(c["collection_id"]), []),
            clinical_at=tables_at,
            clinical_url=tables_url,
        )
        for c in colls
    ]
    n_with_tables = sum(1 for c in colls if tables.get(str(c["collection_id"])))
    manifest = {
        "source": "IDC",
        "api": API,
        "n_collections": len(records),
        "n_derived_analysis_resources": len(derived),
        "n_with_clinical_table": n_with_tables,
        "n_without_clinical_table": len(records) - n_with_tables if tables_url else None,
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
