"""Resolve the same cohort appearing in several repositories into one record.

TCGA-BRCA is one cohort of 1,098 patients. It appears as a GDC project (genomics), an
IDC collection (radiology and pathology slides), a PDC study (proteomics for the CPTAC
overlap) and a cBioPortal study (harmonized matrices). A researcher asking "what can I
do with TCGA-BRCA" wants one page listing all four routes, not four pages each showing
a quarter of the picture. Fragmentation across repositories is itself one of the main
reasons multimodal reuse does not happen.

Merging is deliberately conservative. We merge only on identifiers that name a specific
cohort, never on a program-level accession: every TCGA project shares dbGaP phs000178,
so merging on that would collapse thirty-three distinct cancer types into one record. We
therefore ignore any identifier value that is shared by more than a couple of records,
and we keep every source identifier and every piece of evidence on the merged result so
nothing becomes unverifiable.
"""

from __future__ import annotations

import re
from collections import defaultdict
from collections.abc import Iterable

from cds.model import (
    Assay,
    DatasetRecord,
    IdScheme,
    Modality,
    RepositoryNode,
)

# Identifier schemes specific enough to name one cohort.
MERGE_SCHEMES: set[IdScheme] = {
    IdScheme.GDC_PROJECT,
    IdScheme.PDC_STUDY,
    IdScheme.GEO_SERIES,
    IdScheme.IDC_COLLECTION,
    IdScheme.CBIOPORTAL_STUDY,
    IdScheme.SRA_BIOPROJECT,
    IdScheme.EGA,
}

# Values shared by more than this many records are treated as program-level and ignored
# for merging (dbGaP phs000178 covers all of TCGA, for example).
MAX_SHARED_VALUE = 2

# Which repository should own the page when several describe the same cohort. Lower wins.
REPO_PRIORITY = {
    "GDC": 0,
    "PDC": 1,
    "HTAN": 2,
    "IDC": 3,
    "cBioPortal": 9,
}

# Source preference when two records disagree on a scalar. The primary repository for a
# modality is trusted over a secondary mirror.
SOURCE_PREFIX_PRIORITY = {"gdc-": 0, "pdc-": 1, "htan-": 2, "idc-": 3, "cbio-": 9}


def _norm(scheme: IdScheme, value: str) -> str:
    v = value.strip()
    if scheme in (IdScheme.GDC_PROJECT, IdScheme.PDC_STUDY, IdScheme.GEO_SERIES):
        return v.upper()
    if scheme == IdScheme.IDC_COLLECTION:
        # IDC uses snake_case where GDC uses hyphenated caps: tcga_brca vs TCGA-BRCA.
        return v.upper().replace("_", "-")
    if scheme == IdScheme.CBIOPORTAL_STUDY:
        return v.lower()
    return v.upper()


def _merge_keys(rec: DatasetRecord) -> set[tuple[str, str]]:
    keys: set[tuple[str, str]] = set()
    for ident in rec.identifiers:
        if ident.scheme not in MERGE_SCHEMES:
            continue
        n = _norm(ident.scheme, ident.value)
        if not n:
            continue
        # IDC collection ids and GDC project ids describe the same cohort when equal
        # after normalisation, so they share a key space.
        space = (
            "cohort"
            if ident.scheme in (IdScheme.GDC_PROJECT, IdScheme.IDC_COLLECTION)
            else ident.scheme.value
        )
        keys.add((space, n))
    return keys


def _priority(rec: DatasetRecord) -> int:
    for prefix, p in SOURCE_PREFIX_PRIORITY.items():
        if rec.id.startswith(prefix):
            return p
    return 5


def _pick(a, b):
    """Prefer a non-empty value, else the first."""
    if a in (None, "", [], {}):
        return b
    return a


def _merge_assays(groups: Iterable[list[Assay]]) -> list[Assay]:
    """Union assays by modality, keeping the richest description of each."""
    best: dict[Modality, Assay] = {}
    for assays in groups:
        for a in assays:
            cur = best.get(a.modality)
            if cur is None:
                best[a.modality] = a.model_copy(deep=True)
                continue
            # Keep whichever carries more counts; merge evidence either way.
            score_new = sum(1 for x in (a.n_cases, a.n_samples, a.n_files) if x)
            score_cur = sum(1 for x in (cur.n_cases, cur.n_samples, cur.n_files) if x)
            merged_ev = cur.evidence + [e for e in a.evidence if e not in cur.evidence]
            winner = a.model_copy(deep=True) if score_new > score_cur else cur
            winner.evidence = merged_ev
            winner.n_cases = _pick(winner.n_cases, a.n_cases or cur.n_cases)
            winner.n_samples = _pick(winner.n_samples, a.n_samples or cur.n_samples)
            winner.n_files = _pick(winner.n_files, a.n_files or cur.n_files)
            winner.data_levels = sorted(set(cur.data_levels) | set(a.data_levels))
            best[a.modality] = winner
    return sorted(best.values(), key=lambda a: -(a.n_cases or a.n_samples or a.n_files or 0))


def merge_group(records: list[DatasetRecord]) -> DatasetRecord:
    """Fold a group of records describing one cohort into a single record."""
    records = sorted(records, key=_priority)
    base = records[0].model_copy(deep=True)
    rest = records[1:]
    if not rest:
        return base

    base.assays = _merge_assays([r.assays for r in records])

    seen_ids: set[tuple[str, str]] = {(i.scheme.value, i.value) for i in base.identifiers}
    extra_repos: list[RepositoryNode] = []
    for r in rest:
        for ident in r.identifiers:
            key = (ident.scheme.value, ident.value)
            if key not in seen_ids:
                seen_ids.add(key)
                base.identifiers.append(ident.model_copy(deep=True))
        if (
            r.repository
            and (not base.repository or r.repository.short_name != base.repository.short_name)
            and all(x.short_name != r.repository.short_name for x in extra_repos)
        ):
            extra_repos.append(r.repository)

        base.aliases = sorted(set(base.aliases) | set(r.aliases) | {r.short_title or ""} - {""})
        base.cancer_types = base.cancer_types or r.cancer_types
        base.primary_sites = sorted(set(base.primary_sites) | set(r.primary_sites))
        base.generating_institutions = sorted(
            set(base.generating_institutions) | set(r.generating_institutions)
        )
        base.summary = _pick(base.summary, r.summary)
        base.one_liner = _pick(base.one_liner, r.one_liner)

        # Counts: take the maximum, since each repository sees part of the cohort.
        for field in ("n_cases", "n_samples", "n_aliquots", "n_files", "total_bytes"):
            mine = getattr(base.cohort, field)
            theirs = getattr(r.cohort, field)
            if theirs and (not mine or theirs > mine):
                setattr(base.cohort, field, theirs)
        for field in ("sex", "race", "ethnicity", "vital_status", "country_or_region"):
            if not getattr(base.cohort.demographics, field):
                setattr(base.cohort.demographics, field, getattr(r.cohort.demographics, field))
        base.cohort.evidence += [e for e in r.cohort.evidence if e not in base.cohort.evidence]

        if not base.clinical_variables:
            base.clinical_variables = r.clinical_variables
        elif r.clinical_variables:
            have = {v.name for v in base.clinical_variables}
            base.clinical_variables += [v for v in r.clinical_variables if v.name not in have]

        lo, ro = base.longitudinal, r.longitudinal
        for field in (
            "has_followup",
            "has_survival_endpoint",
            "has_serial_samples",
            "has_treatment_response",
        ):
            if getattr(lo, field) is None and getattr(ro, field) is not None:
                setattr(lo, field, getattr(ro, field))
            elif getattr(ro, field) is True:
                setattr(lo, field, True)
        lo.survival_endpoints = sorted(set(lo.survival_endpoints) | set(ro.survival_endpoints))
        lo.response_criteria = sorted(set(lo.response_criteria) | set(ro.response_criteria))
        lo.median_followup_months = _pick(lo.median_followup_months, ro.median_followup_months)
        lo.max_followup_months = _pick(lo.max_followup_months, ro.max_followup_months)
        lo.evidence += [e for e in ro.evidence if e not in lo.evidence]

        # Access: the merged cohort is as open as its most open component and as
        # restricted as its most restricted, so we record both explicitly.
        base.access.open_components = sorted(
            set(base.access.open_components) | set(r.access.open_components)
        )
        base.access.controlled_components = sorted(
            set(base.access.controlled_components) | set(r.access.controlled_components)
        )
        if base.access.open_components and base.access.controlled_components:
            from cds.model import AccessTier

            base.access.tier = AccessTier.MIXED
        base.access.evidence += [e for e in r.access.evidence if e not in base.access.evidence]

        have_pubs = {(p.pmid, p.doi) for p in base.primary_publications}
        base.primary_publications += [
            p for p in r.primary_publications if (p.pmid, p.doi) not in have_pubs
        ]
        have_grants = {g.core_project_num for g in base.grants}
        base.grants += [g for g in r.grants if g.core_project_num not in have_grants]
        base.tags = sorted(set(base.tags) | set(r.tags))

    base.additional_repositories = extra_repos
    base.aliases = [a for a in base.aliases if a and a != base.short_title]
    return base


def _ensure_unique_ids(records: list[DatasetRecord]) -> int:
    """Guarantee record ids are unique.

    Slugs are truncated for readability, so two long titles can collide. When they do we
    append the record's primary accession rather than a counter, so the id stays stable
    across rebuilds even if the corpus grows or the sort order changes.
    """
    seen: dict[str, int] = {}
    n_changed = 0
    for rec in records:
        if rec.id not in seen:
            seen[rec.id] = 1
            continue
        primary = next(
            (i.value for i in rec.identifiers if i.is_primary),
            next((i.value for i in rec.identifiers), None),
        )
        suffix = re.sub(r"[^a-z0-9]+", "-", (primary or "").lower()).strip("-")
        candidate = f"{rec.id}-{suffix}" if suffix else rec.id
        if not suffix or candidate in seen:
            seen[rec.id] = seen[rec.id] + 1
            candidate = f"{rec.id}-{seen[rec.id]}"
        rec.id = candidate
        seen[candidate] = 1
        n_changed += 1
    return n_changed


def merge_records(records: list[DatasetRecord]) -> tuple[list[DatasetRecord], dict]:
    """Union-find over merge keys, then fold each group."""
    # Count how often each merge value appears, to spot program-level identifiers.
    value_counts: dict[tuple[str, str], int] = defaultdict(int)
    per_record_keys: list[set[tuple[str, str]]] = []
    for rec in records:
        keys = _merge_keys(rec)
        per_record_keys.append(keys)
        for k in keys:
            value_counts[k] += 1

    parent: dict[int, int] = {i: i for i in range(len(records))}

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int) -> None:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[max(ri, rj)] = min(ri, rj)

    key_to_indices: dict[tuple[str, str], list[int]] = defaultdict(list)
    n_skipped_broad = 0
    for i, keys in enumerate(per_record_keys):
        for k in keys:
            if value_counts[k] > MAX_SHARED_VALUE:
                n_skipped_broad += 1
                continue
            key_to_indices[k].append(i)
    for idxs in key_to_indices.values():
        for j in idxs[1:]:
            union(idxs[0], j)

    groups: dict[int, list[DatasetRecord]] = defaultdict(list)
    for i, rec in enumerate(records):
        groups[find(i)].append(rec)

    merged = [merge_group(g) for g in groups.values()]
    merged.sort(key=lambda r: -(r.cohort.n_cases or r.cohort.n_samples or 0))
    n_disambiguated = _ensure_unique_ids(merged)

    stats = {
        "n_input": len(records),
        "n_output": len(merged),
        "n_groups_merged": sum(1 for g in groups.values() if len(g) > 1),
        "n_records_absorbed": len(records) - len(merged),
        "n_broad_identifier_keys_ignored": n_skipped_broad,
        "max_shared_value": MAX_SHARED_VALUE,
        "largest_group": max((len(g) for g in groups.values()), default=0),
        "n_ids_disambiguated": n_disambiguated,
    }
    return merged, stats
