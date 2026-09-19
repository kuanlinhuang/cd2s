"""NCI Proteomic Data Commons adapter (CPTAC, ICPC, APOLLO, CBTN, HCMI proteogenomics).

PDC organises data as one *study* per analytical fraction: "CPTAC LUAD Discovery Study -
Proteome" and "... - Phosphoproteome" are separate studies over the same tumors. A
researcher does not think of those as two datasets, so we group fractions back into one
record per biological cohort and expose the fractions as assays.

This is also where the most genuinely underexplored measurements in the NCI portfolio
live. Beyond proteome and phosphoproteome, PDC holds acetylome, intact glycoproteome,
ubiquitylome, lipidome, metabolome and protein-protein interaction studies - data types
with very few reuse publications relative to the effort that produced them.
"""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import UTC, date, datetime
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
    Method,
    Modality,
    OntologyTerm,
    RepositoryNode,
)

GRAPHQL = "https://proteomic.datacommons.cancer.gov/graphql"
PORTAL = "https://pdc.cancer.gov"

PDC_NODE = RepositoryNode(
    name="NCI Proteomic Data Commons",
    short_name="PDC",
    url="https://pdc.cancer.gov",
    is_nci_crdc_node=True,
    is_nih_repository=True,
)

FRACTION_MODALITY: dict[str, Modality] = {
    "Phosphotyrosine": Modality.PHOSPHOPROTEOME,
    "Proteome": Modality.PROTEOME,
    "Phosphoproteome": Modality.PHOSPHOPROTEOME,
    "Acetylome": Modality.ACETYLPROTEOME,
    "Glycoproteome": Modality.GLYCOPROTEOME,
    "Ubiquitylome": Modality.UBIQUITYLOME,
    "Metabolome": Modality.METABOLOME,
    "Lipidome": Modality.LIPIDOME,
    "Protein-Protein interaction": Modality.OTHER,
}

# Fractions that are rare across the whole NCI portfolio. Used to tag records for the
# "unusual measurements" discovery axis; the actual underexplored label is computed later
# from reuse evidence, not from this list.
RARE_FRACTIONS = {
    "Acetylome",
    "Glycoproteome",
    "Ubiquitylome",
    "Metabolome",
    "Lipidome",
    "Protein-Protein interaction",
}

STUDIES_QUERY = """
{
  allPrograms {
    program_id
    name
    projects {
      project_id
      name
      studies {
        study_id
        pdc_study_id
        study_name
        study_submitter_id
        submitter_id_name
        analytical_fraction
        experiment_type
        acquisition_type
        disease_type
        primary_site
        cases_count
        aliquots_count
        embargo_date
      }
    }
  }
}
"""

# Suffixes that name the fraction rather than the cohort, stripped to recover the cohort.
_FRACTION_SUFFIX = re.compile(
    r"\s*[-–]\s*(?:"
    r"(?:DIA\s+|TMT\s+|Label\s*Free\s+|LFQ\s+)?"
    r"(?:Intact\s+|N-linked\s+|Cyst\s+Fluid\s+|Whole\s+)?"
    r"(?:CompRef\s+)?"
    r"(?:Proteome|Phosphoproteome|Phosphoproteomics|Phosphotyrosine|Phosphopeptide"
    r"|Acetylome|Acetylproteome|Glycoproteome|Glycoproteomics"
    r"|Glycosite-containing\s+peptide|Ubiquitylome|Ubiquitinome|Metabolome"
    r"|Metabolomics|Lipidome|Lipidomics"
    r"|Protein-protein\s+Interaction|Proteomics|Peptidome)"
    r")\s*$",
    re.IGNORECASE,
)


def _cohort_key(study_name: str) -> str:
    """Strip the analytical-fraction suffix to recover the biological cohort name."""
    name = study_name.strip()
    for _ in range(3):  # names occasionally stack qualifiers
        stripped = _FRACTION_SUFFIX.sub("", name).strip(" -–")
        if stripped == name:
            break
        name = stripped
    return name or study_name


def _is_compref(study_name: str) -> bool:
    """CompRef studies are inter-laboratory reference materials, not patient cohorts."""
    return "compref" in study_name.lower()


def _ev(at: datetime, locator: str | None = None) -> Evidence:
    return Evidence(
        method=Method.API,
        source_url=GRAPHQL,
        source_label="PDC GraphQL allPrograms",
        retrieved_at=at,
        locator=locator,
        confidence=Confidence.HIGH,
    )


def fetch_studies(client: Client) -> tuple[list[dict[str, Any]], datetime]:
    data, at = client.graphql(GRAPHQL, STUDIES_QUERY)
    rows: list[dict[str, Any]] = []
    for prog in (data or {}).get("allPrograms") or []:
        for proj in prog.get("projects") or []:
            for st in proj.get("studies") or []:
                rows.append(
                    {
                        **st,
                        "program_id": prog.get("program_id"),
                        "program_name": prog.get("name"),
                        "project_id": proj.get("project_id"),
                        "project_name": proj.get("name"),
                    }
                )
    return rows, at


def _slug(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)[:70]


def group_studies(rows: list[dict[str, Any]]) -> dict[tuple[str, str], list[dict[str, Any]]]:
    """Group per-fraction studies into one entry per (project, cohort)."""
    groups: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        name = r.get("submitter_id_name") or r.get("study_name") or ""
        if not name:
            continue
        if _is_compref(name):
            continue
        key = (r.get("project_name") or "", _cohort_key(name))
        groups[key].append(r)
    return groups


def to_record(
    project_name: str, cohort_name: str, studies: list[dict[str, Any]], at: datetime
) -> DatasetRecord:
    program = studies[0].get("program_name")
    ev = _ev(at, locator=f"{len(studies)} fraction studies grouped by cohort name")

    # The cohort size is the largest per-study case count; fractions are subsets of it.
    n_cases = max((s.get("cases_count") or 0) for s in studies) or None
    n_aliquots = sum((s.get("aliquots_count") or 0) for s in studies) or None

    assays: list[Assay] = []
    fractions_present: set[str] = set()
    for s in studies:
        frac = s.get("analytical_fraction") or "Proteome"
        fractions_present.add(frac)
        mod = FRACTION_MODALITY.get(frac, Modality.PROTEOME)
        exp = s.get("experiment_type")
        acq = s.get("acquisition_type")
        label = frac if frac != "Protein-Protein interaction" else "Protein-protein interaction"
        detail = " / ".join(x for x in (exp, acq) if x)
        assays.append(
            Assay(
                modality=mod,
                label=f"{label} mass spectrometry" + (f" ({detail})" if detail else ""),
                platform=exp,
                n_cases=s.get("cases_count"),
                n_samples=s.get("aliquots_count"),
                data_levels=["raw", "peptide/protein matrix"],
                access_tier=AccessTier.OPEN,
                evidence=[ev],
            )
        )

    diseases = sorted({s["disease_type"] for s in studies if s.get("disease_type")})
    sites = sorted({s["primary_site"] for s in studies if s.get("primary_site")})

    embargoes = [s["embargo_date"] for s in studies if s.get("embargo_date")]
    embargo = None
    if embargoes:
        try:
            embargo = max(date.fromisoformat(e[:10]) for e in embargoes)
        except ValueError:
            embargo = None

    idents: list[Identifier] = []
    for s in studies:
        if s.get("pdc_study_id"):
            idents.append(
                Identifier(
                    scheme=IdScheme.PDC_STUDY,
                    value=s["pdc_study_id"],
                    url=f"{PORTAL}/pdc/study/{s['pdc_study_id']}",
                    is_primary=len(idents) == 0,
                    evidence=[ev],
                )
            )
    primary_pdc = idents[0].value if idents else _slug(cohort_name)

    rare = sorted(fractions_present & RARE_FRACTIONS)
    tags = ["pdc", "proteogenomics"]
    if rare:
        tags.append("rare-modality")
    tags.extend(_slug(f) for f in rare)

    return DatasetRecord(
        id=f"pdc-{_slug(cohort_name)}",
        title=cohort_name,
        short_title=primary_pdc,
        aliases=sorted({s.get("submitter_id_name") or "" for s in studies} - {""}),
        summary=None,
        identifiers=idents,
        repository=PDC_NODE,
        program_name=program,
        nci_program=program,
        program_url=f"{PORTAL}/pdc/browse",
        data_generation_funding_role=FundingRole.GENERATION,
        landing_page_url=f"{PORTAL}/pdc/study/{primary_pdc}",
        retrieved_at=at,
        cancer_types=[OntologyTerm(label=d) for d in diseases],
        primary_sites=sites,
        cohort=Cohort(n_cases=n_cases, n_aliquots=n_aliquots, evidence=[ev]),
        assays=assays,
        access=Access(
            tier=AccessTier.OPEN,
            mechanism="Direct download from the PDC portal or its API; no account required",
            license="Open access under the PDC data use terms",
            citation_requirement=(
                "Cite the PDC study identifier and the study's primary publication; "
                "PDC asks that the consortium be acknowledged."
            ),
            publication_policy_url="https://pdc.cancer.gov/pdc/data-use-guidelines",
            embargo_until=embargo,
            login_required=False,
            open_components=[f"{len(studies)} analytical fraction studies"],
            evidence=[ev],
        ),
        tags=tags,
    )


def build(
    client: Client, *, limit: int | None = None, deep: bool = True
) -> tuple[list[DatasetRecord], dict[str, Any]]:
    rows, at = fetch_studies(client)
    groups = group_studies(rows)
    records = [to_record(proj, cohort, studies, at) for (proj, cohort), studies in groups.items()]
    records.sort(key=lambda r: -(r.cohort.n_cases or 0))
    if limit:
        records = records[:limit]
    manifest = {
        "source": "PDC",
        "api": GRAPHQL,
        "n_studies_seen": len(rows),
        "n_compref_excluded": sum(1 for r in rows if _is_compref(r.get("submitter_id_name") or "")),
        "n_cohort_records": len(records),
        "fetched_at": datetime.now(UTC).isoformat(),
    }
    return records, manifest
