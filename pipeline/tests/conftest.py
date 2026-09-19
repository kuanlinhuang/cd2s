"""Shared fixtures.

Nothing here touches the network. The pipeline's HTTP layer is cached and the adapters
are exercised by running the real thing; what these tests protect is the logic that has
actually gone wrong - the derivations, the merge, the labels and the exports.
"""

from __future__ import annotations

import pytest

from cds.model import (
    Access,
    AccessTier,
    Assay,
    Cohort,
    DatasetRecord,
    Demographics,
    Identifier,
    IdScheme,
    Modality,
    RepositoryNode,
)


def make_record(
    rid: str,
    *,
    n_cases: int | None = 100,
    identifiers: list[tuple[IdScheme, str]] | None = None,
    modalities: list[Modality] | None = None,
    countries: dict[str, int] | None = None,
    race: dict[str, int] | None = None,
    tier: AccessTier = AccessTier.OPEN,
    repo: str | None = "GDC",
) -> DatasetRecord:
    return DatasetRecord(
        id=rid,
        title=rid.upper(),
        short_title=rid.upper(),
        repository=RepositoryNode(name=repo, short_name=repo, url="https://example.org")
        if repo
        else None,
        identifiers=[
            Identifier(scheme=s, value=v, is_primary=(i == 0))
            for i, (s, v) in enumerate(identifiers or [])
        ],
        assays=[Assay(modality=m, label=m.value) for m in (modalities or [])],
        cohort=Cohort(
            n_cases=n_cases,
            demographics=Demographics(country_or_region=countries or {}, race=race or {}),
        ),
        access=Access(tier=tier),
    )


@pytest.fixture
def record_factory():
    return make_record
