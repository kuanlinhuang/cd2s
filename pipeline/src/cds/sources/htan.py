"""Human Tumor Atlas Network adapter.

HTAN is where NCI's most distinctive measurements live: multiplexed tissue imaging,
Visium spatial transcriptomics, expansion sequencing, single-cell ATAC, and electron
microscopy, on the same specimens as clinical follow-up and therapy records. It is also
the hardest part of the portfolio to reuse, because the data sit in Synapse behind
per-atlas terms and the portal is built for browsing rather than for asking "which atlas
has spatial transcriptomics with treatment data".

HTAN publishes its portal metadata as JSON in the public `ncihtan/htan-portal`
repository, which is what we read: the atlas roster, the per-atlas Synapse component
inventory (which tells us which assays exist and how many files of each), and a
publication manifest that already carries PMIDs and HTAN grant numbers. That manifest is
unusually good evidence, because the network curates it themselves.
"""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from cds.http import Client
from cds.model import (
    Access,
    AccessTier,
    Assay,
    ClinicalVariable,
    Cohort,
    Confidence,
    DatasetRecord,
    Evidence,
    FundingRole,
    Grant,
    Identifier,
    IdScheme,
    LongitudinalCoverage,
    Method,
    Modality,
    Publication,
    RepositoryNode,
    ReuseKind,
    ReuseRecord,
    ReuseTier,
)

RAW = "https://raw.githubusercontent.com/ncihtan/htan-portal/master/data"
PORTAL = "https://humantumoratlas.org"

HTAN_NODE = RepositoryNode(
    name="Human Tumor Atlas Network (data hosted in Synapse)",
    short_name="HTAN",
    url="https://humantumoratlas.org",
    is_nci_crdc_node=False,
    is_nih_repository=True,
)

# HTAN component -> (modality, human label). Levels 1-4 are raw through analysis-ready.
COMPONENT_MODALITY: list[tuple[re.Pattern[str], Modality, str]] = [
    (
        re.compile(r"10xVisiumSpatialTranscriptomics", re.I),
        Modality.SPATIAL_TRANSCRIPTOMICS,
        "10x Visium spatial transcriptomics",
    ),
    (
        re.compile(r"ExSeq", re.I),
        Modality.SPATIAL_TRANSCRIPTOMICS,
        "Expansion sequencing (ExSeq) in situ transcriptomics",
    ),
    (re.compile(r"ScATAC-seq", re.I), Modality.SC_ATAC, "Single-cell ATAC sequencing"),
    (
        re.compile(r"ScRNA-seq|SingleCellRNA", re.I),
        Modality.SC_RNA_SEQ,
        "Single-cell / single-nucleus RNA sequencing",
    ),
    (re.compile(r"ElectronMicroscopy", re.I), Modality.ELECTRON_MICROSCOPY, "Electron microscopy"),
    (re.compile(r"Imaging", re.I), Modality.SPATIAL_PROTEOMICS, "Multiplexed tissue imaging"),
    (re.compile(r"MassSpectrometry", re.I), Modality.PROTEOME, "Mass spectrometry proteomics"),
    (re.compile(r"BulkRNA-seq", re.I), Modality.RNA_SEQ, "Bulk RNA sequencing"),
    (re.compile(r"BulkDNA", re.I), Modality.BULK_DNA, "Bulk DNA sequencing"),
    (re.compile(r"BulkWES", re.I), Modality.WXS, "Bulk whole exome sequencing"),
    (
        re.compile(r"NanoString|GeoMx", re.I),
        Modality.SPATIAL_TRANSCRIPTOMICS,
        "NanoString GeoMx spatial profiling",
    ),
    (re.compile(r"HI-C|HiC", re.I), Modality.HIC, "Hi-C chromatin conformation"),
    (re.compile(r"RPPA", re.I), Modality.PROTEIN_ARRAY, "Reverse phase protein array"),
    (re.compile(r"OtherAssay", re.I), Modality.OTHER, "Other assay"),
]

# Clinical components map to variables rather than assays.
CLINICAL_COMPONENTS: dict[str, tuple[str, str]] = {
    "Demographics": ("Demographics", "demographic"),
    "Diagnosis": ("Diagnosis", "diagnosis"),
    "FollowUp": ("Follow-up", "followup"),
    "Therapy": ("Therapy", "treatment"),
    "Exposure": ("Exposure history", "exposure"),
    "FamilyHistory": ("Family history", "other"),
    "MolecularTest": ("Clinical molecular test", "molecular_marker"),
    "ClinicalDataTier2": ("Extended clinical data (tier 2)", "other"),
}

# HTAN's data model is one table per clinical topic, not one harmonized field per
# concept, so an atlas can only tell us how many participants a table covers - never
# which fields inside it are populated. That earns "limited" at most, and the record
# says why. The component that defines the denominator is Demographics: the model
# carries one Demographics record per participant.
PARTICIPANT_COMPONENT = "Demographics"

SKIP_COMPONENTS = {"Biospecimen", "AccessoryManifest", "SRRSBiospecimen"}


def _base_component(component: str) -> str:
    """Strip the level suffix and HTAN's SRRS prefix to get a comparable assay name."""
    c = re.sub(r"^SRRS", "", component)
    return re.sub(r"Level\d+(-AuxiliaryFiles)?$|-AuxiliaryFiles$", "", c)


def _ev(
    url: str, at: datetime, locator: str | None = None, conf: Confidence = Confidence.HIGH
) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=url,
        source_label="HTAN portal metadata (ncihtan/htan-portal)",
        retrieved_at=at,
        locator=locator,
        confidence=conf,
    )


def fetch(client: Client) -> tuple[list[dict], dict[str, list[dict]], list[dict], datetime]:
    a = client.get(f"{RAW}/atlases.json")
    m = client.get(f"{RAW}/syn_metadata.json")
    p = client.get(f"{RAW}/publications_manifest_all.json")
    at = max(a.retrieved_at, m.retrieved_at, p.retrieved_at)
    atlases = a.json() if a.ok else []
    syn = m.json() if m.ok else {}
    pubs = p.json() if p.ok else []
    return atlases, syn, pubs, at


def _atlas_title(entry: dict) -> str:
    t = entry.get("title")
    if isinstance(t, dict):
        return t.get("rendered") or ""
    return str(t or "")


def _slug(text: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-"))[:70]


def to_record(
    htan_id: str,
    title: str,
    institutions: str | None,
    components: list[dict],
    pubs: list[dict],
    at: datetime,
) -> DatasetRecord:
    syn_url = f"{RAW}/syn_metadata.json"
    ev = _ev(syn_url, at, locator=f"atlas {htan_id}")

    # Aggregate components into assays and clinical variables.
    assay_items: dict[tuple[Modality, str], dict[str, Any]] = {}
    levels: dict[tuple[Modality, str], set[str]] = defaultdict(set)

    # Clinical tables first, because the participant count they imply is the denominator
    # for everything else on the record. Each entry in the inventory is one manifest, so
    # the records in a table are summed across manifests before anything is derived.
    table_records: dict[str, int] = defaultdict(int)
    table_components: dict[str, set[str]] = defaultdict(set)
    for c in components:
        comp = c.get("component") or ""
        base = _base_component(comp)
        if base in CLINICAL_COMPONENTS:
            table_records[base] += int(c.get("numItems") or 0)
            table_components[base].add(comp)

    n_participants = table_records.get(PARTICIPANT_COMPONENT) or None
    clinical: list[ClinicalVariable] = []
    for base in sorted(table_records):
        label, category = CLINICAL_COMPONENTS[base]
        n_records = table_records[base]
        total = n_participants or n_records
        # A table can carry more rows than there are participants - several therapy
        # lines, several follow-up visits - so a share above 100% is reported as a
        # one-to-many table rather than silently clipped.
        repeated = bool(n_participants) and n_records > n_participants
        clinical.append(
            ClinicalVariable(
                name=f"htan:{base}",
                harmonized_name=None,
                label=label,
                category=category,  # type: ignore[arg-type]
                n_nonmissing=min(n_records, total) if not repeated else n_records,
                n_total=total,
                populated_pct=round(100.0 * min(n_records, total) / total, 1) if total else None,
                is_repeated=repeated,
                evidence=[
                    _ev(
                        syn_url,
                        at,
                        locator=(
                            f"{n_records:,} {base} records across "
                            f"{len(table_components[base])} manifest(s)"
                            + (
                                f"; {n_participants:,} participants in the atlas"
                                if n_participants
                                else ""
                            )
                        ),
                        conf=Confidence.MEDIUM,
                    )
                ],
            )
        )
    clinical_seen = set(table_records)

    for c in components:
        comp = c.get("component") or ""
        if not comp or _base_component(comp) in SKIP_COMPONENTS or comp in SKIP_COMPONENTS:
            continue
        base = _base_component(comp)
        if base in CLINICAL_COMPONENTS:
            continue
        matched = next(((m, lbl) for pat, m, lbl in COMPONENT_MODALITY if pat.search(base)), None)
        if matched is None:
            continue
        mod, label = matched
        key = (mod, label)
        slot = assay_items.setdefault(key, {"n_files": 0, "components": set()})
        slot["n_files"] += int(c.get("numItems") or 0)
        slot["components"].add(comp)
        lvl = re.search(r"Level(\d+)", comp)
        if lvl:
            levels[key].add(f"level {lvl.group(1)}")

    assays = [
        Assay(
            modality=mod,
            label=label,
            n_files=slot["n_files"] or None,
            data_levels=sorted(levels[(mod, label)]),
            access_tier=AccessTier.MIXED,
            evidence=[
                _ev(
                    syn_url,
                    at,
                    locator="components: " + ", ".join(sorted(slot["components"]))[:200],
                )
            ],
        )
        for (mod, label), slot in sorted(assay_items.items(), key=lambda kv: -kv[1]["n_files"])
    ]

    has_followup = "FollowUp" in clinical_seen
    has_therapy = "Therapy" in clinical_seen

    # HTAN's own publication manifest: strong, curator-supplied evidence.
    pub_url = f"{RAW}/publications_manifest_all.json"
    primary: list[Publication] = []
    reuse: list[ReuseRecord] = []
    grants: list[Grant] = []
    grant_seen: set[str] = set()
    for p in pubs:
        # HTAN's manifest stores a full PubMed URL in the PMID column for some rows, so
        # take the trailing numeric segment rather than the raw field.
        raw_pmid = str(p.get("PMID") or "").strip().rstrip("/")
        pmid = raw_pmid.rsplit("/", 1)[-1] if raw_pmid else ""
        if not pmid.isdigit():
            pmid = ""
        doi = (p.get("DOI") or "").replace("https://doi.org/", "").strip()
        year = p.get("Year of Publication") or p.get("Eutils Date")
        pub = Publication(
            pmid=pmid or None,
            doi=doi or None,
            title=p.get("Title") or p.get("Eutils Title"),
            journal=p.get("Eutils Journal"),
            year=int(str(year)[:4]) if year and str(year)[:4].isdigit() else None,
            authors_short=(p.get("Authors") or "").split(",")[0].strip() + " et al."
            if p.get("Authors")
            else None,
            url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
            if pmid
            else (f"https://doi.org/{doi}" if doi else None),
            citation_count=int(p["Cited In Number"])
            if str(p.get("Cited In Number") or "").isdigit()
            else None,
            evidence=[
                Evidence(
                    method=Method.FILE,
                    source_url=pub_url,
                    source_label="HTAN publication manifest (network-curated)",
                    retrieved_at=at,
                    locator=f"HTAN Center ID {p.get('HTAN Center ID')}",
                    confidence=Confidence.HIGH,
                    note="Curated by the HTAN Data Coordinating Center, not text-mined.",
                )
            ],
        )
        ctype = str(p.get("Publication Content Type") or "")
        if "Published manuscript" in ctype:
            primary.append(pub)
        else:
            reuse.append(
                ReuseRecord(
                    publication=pub,
                    tier=ReuseTier.T2_DECLARED,
                    kind=ReuseKind.PRIMARY,
                    what_they_analyzed=p.get("Data Type") or None,
                    evidence=pub.evidence,
                )
            )
        gid = str(p.get("HTAN Grant ID") or "").strip()
        if gid and gid not in grant_seen:
            grant_seen.add(gid)
            grants.append(
                Grant(
                    core_project_num=gid if gid.startswith(("U", "R", "P", "K")) else f"U2C{gid}",
                    title=None,
                    agency_ic="NCI",
                    role=FundingRole.GENERATION,
                    reporter_url=f"https://reporter.nih.gov/search/results?text_criteria={gid}",
                    evidence=[
                        Evidence(
                            method=Method.FILE,
                            source_url=pub_url,
                            source_label="HTAN publication manifest",
                            retrieved_at=at,
                            locator="field: HTAN Grant ID",
                            confidence=Confidence.MEDIUM,
                            note="Grant number as recorded by HTAN; resolved against RePORTER separately.",
                        )
                    ],
                )
            )

    rare = {
        Modality.SPATIAL_TRANSCRIPTOMICS,
        Modality.SPATIAL_PROTEOMICS,
        Modality.ELECTRON_MICROSCOPY,
        Modality.SC_ATAC,
    }
    present = {a.modality for a in assays}
    tags = ["htan", "spatial", "single-cell"]
    if present & rare:
        tags.append("rare-modality")
    if has_therapy and has_followup:
        tags.append("treatment-linked")

    return DatasetRecord(
        id=f"htan-{_slug(title) or htan_id.lower()}",
        title=title or htan_id,
        short_title=htan_id,
        aliases=[htan_id],
        identifiers=[
            Identifier(
                scheme=IdScheme.ACCESSION_OTHER,
                value=htan_id,
                url=f"{PORTAL}/explore?selectedFilters=%5B%7B%22value%22%3A%22{htan_id}%22%7D%5D",
                is_primary=True,
                evidence=[ev],
            )
        ]
        + [
            Identifier(
                scheme=IdScheme.SYNAPSE,
                value=c["synapseId"],
                url=f"https://www.synapse.org/#!Synapse:{c['synapseId']}",
                evidence=[ev],
            )
            for c in components[:12]
            if c.get("synapseId")
        ],
        repository=HTAN_NODE,
        program_name="Human Tumor Atlas Network",
        nci_program="HTAN",
        program_url=PORTAL,
        generating_institutions=[institutions] if institutions else [],
        data_generation_funding_role=FundingRole.GENERATION,
        landing_page_url=f"{PORTAL}/explore",
        retrieved_at=at,
        cohort=Cohort(
            n_cases=n_participants,
            n_files=sum(int(c.get("numItems") or 0) for c in components) or None,
            evidence=[
                _ev(
                    syn_url,
                    at,
                    locator=(
                        f"participants counted as {PARTICIPANT_COMPONENT} records "
                        f"({n_participants:,})"
                        if n_participants
                        else "no Demographics records in the atlas inventory"
                    ),
                    conf=Confidence.MEDIUM,
                )
            ],
        ),
        assays=assays,
        clinical_variables=clinical,
        longitudinal=LongitudinalCoverage(
            has_followup=has_followup or None,
            has_treatment_response=None,
            evidence=[
                _ev(
                    syn_url,
                    at,
                    locator="presence of FollowUp/Therapy components",
                    conf=Confidence.MEDIUM,
                )
            ],
        ),
        access=Access(
            tier=AccessTier.MIXED,
            mechanism=(
                "Level 1-2 sequencing data are controlled through dbGaP; level 3-4 "
                "derived data and most imaging are downloadable from Synapse after "
                "registering and accepting the HTAN data use terms."
            ),
            dua_url="https://humantumoratlas.org/data-access",
            login_required=True,
            license="HTAN data use terms; CC BY 4.0 for many level 3-4 products",
            citation_requirement=(
                "Cite the atlas publication and acknowledge HTAN per the network's "
                "publication policy."
            ),
            publication_policy_url="https://humantumoratlas.org/data-access",
            open_components=["level 3-4 derived data", "most imaging"],
            controlled_components=["level 1-2 sequencing (dbGaP)"],
            evidence=[_ev("https://humantumoratlas.org/data-access", at, conf=Confidence.MEDIUM)],
        ),
        primary_publications=primary,
        reuse=reuse,
        grants=grants,
        tags=tags,
    )


def build(
    client: Client, *, limit: int | None = None, deep: bool = True
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    atlases, syn, pubs, at = fetch(client)
    names: dict[str, tuple[str, str | None]] = {}
    for a in atlases:
        hid = str(a.get("htan_id") or "").upper()
        if hid:
            names[hid] = (_atlas_title(a), a.get("lead_institutions"))

    pubs_by_center: dict[str, list[dict]] = defaultdict(list)
    for p in pubs:
        cid = str(p.get("HTAN Center ID") or "").upper()
        if cid:
            pubs_by_center[cid].append(p)

    records: list[DatasetRecord] = []
    for hid, components in syn.items():
        hid_u = hid.upper()
        title, inst = names.get(hid_u, (hid_u, None))
        records.append(to_record(hid_u, title, inst, components, pubs_by_center.get(hid_u, []), at))
    records.sort(key=lambda r: -(r.cohort.n_files or 0))
    if limit:
        records = records[:limit]
    manifest = {
        "source": "HTAN",
        "data": f"{RAW}/(atlases|syn_metadata|publications_manifest_all).json",
        "n_atlases": len(records),
        "n_publications_in_manifest": len(pubs),
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
