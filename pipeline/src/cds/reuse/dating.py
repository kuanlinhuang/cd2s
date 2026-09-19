"""Dating when a dataset actually became available for others to use.

This turned out to be the hardest simple thing in the project. The obvious answer -
ask the repository - does not work: GDC's earliest file for TCGA-BRCA is stamped 2018,
six years after the data were published, because that date records a re-harmonization
rather than first availability. Using it would make every TCGA project look six years
younger than it is and badly distort any exposure-adjusted reuse measure.

So we date availability from the literature instead: the first year in which an article
references the dataset's accession. That is a lower bound on availability, it is
directly observable, and it measures the thing we actually care about - how long the
community has had the opportunity to use these data.

The search is a coarse-to-fine ladder over publication-date buckets, because Europe PMC's
ascending date sort does not order reliably, but its hit counts within a date range do.
"""

from __future__ import annotations

from datetime import UTC, datetime

from cds.http import Client
from cds.reuse import epmc

# Coarse buckets, oldest first. We stop at the first bucket with any hits, then narrow
# to a single year inside it.
BUCKETS: list[tuple[int, int]] = [
    (1990, 2004),
    (2005, 2009),
    (2010, 2012),
    (2013, 2015),
    (2016, 2018),
    (2019, 2021),
    (2022, 2024),
    (2025, 2027),
]

# Only the precise fields are used for dating. Europe PMC's RESULTS field matches the
# words of a hyphenated accession independently, which produced a 2005 "first reference"
# for TARGET-AML - four years before the program existed. METHODS, the data-availability
# statement and the curated accession index do not show that behavior.
DATING_FIELDS = ("METHODS", "DATA_AVAILABILITY", "ACCESSION_ID")

STRATEGY_ID = "epmc-first-reference-v2"


def _count(client: Client, token: str, field: str, lo: int, hi: int) -> int:
    query = f'{field}:"{token}" AND FIRST_PDATE:[{lo}-01-01 TO {hi}-12-31]'
    data, _, _ = epmc._search(client, query)
    return int(data.get("hitCount") or 0)


def _year_is_real(client: Client, token: str, field: str, year: int) -> bool:
    """Confirm a candidate year by retrieving an actual record.

    A non-zero hit count that yields no retrievable article is an index artifact, and
    accepting one would date a dataset years before it existed. Cheap insurance.
    """
    query = f'{field}:"{token}" AND FIRST_PDATE:[{year}-01-01 TO {year}-12-31]'
    data, _, _ = epmc._search(client, query, page_size=1, result_type="lite")
    hits = (data.get("resultList") or {}).get("result") or []
    return len(hits) > 0


def first_reference_year(client: Client, tokens: list[str]) -> tuple[int | None, str | None]:
    """Earliest publication year in which any of these accessions is referenced."""
    best: int | None = None
    best_field: str | None = None
    for token in tokens:
        for field in DATING_FIELDS:
            # Cheap pre-check: does this field match at all?
            total, _, _ = epmc._search(client, f'{field}:"{token}"')
            if int(total.get("hitCount") or 0) == 0:
                continue
            for lo, hi in BUCKETS:
                if best is not None and lo > best:
                    break  # cannot improve on what we already have
                if _count(client, token, field, lo, hi) == 0:
                    continue
                # Narrow to the exact year inside this bucket.
                found_in_bucket = False
                for year in range(lo, hi + 1):
                    if best is not None and year >= best:
                        break
                    if _count(client, token, field, year, year) > 0 and _year_is_real(
                        client, token, field, year
                    ):
                        best, best_field = year, field
                        found_in_bucket = True
                        break
                if found_in_bucket:
                    break
    return best, best_field


def years_available(
    client: Client, tokens: list[str], *, today: datetime | None = None
) -> tuple[float | None, int | None, str]:
    """Exposure time in years, plus the anchor year and how it was determined."""
    now = today or datetime.now(UTC)
    year, field = first_reference_year(client, tokens)
    if year is None:
        return None, None, "no reference found in the literature"
    elapsed = max(now.year - year + (now.month - 7) / 12.0, 0.0)
    return round(elapsed, 2), year, f"first referenced in {year} ({field} section)"
