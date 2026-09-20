"""Correcting Europe PMC section hit counts for hyphen tokenization.

Europe PMC does not index a hyphenated accession as one term. It splits on the hyphen
and stores the parts, so a quoted search is a two-word *phrase* query, not an exact
match. The API makes this easy to confirm and impossible to work around:

    METHODS:"TARGET-OS"   -> 262 hits
    METHODS:"target os"   -> 262 hits      (identical: the hyphen is not in the index)
    METHODS:TARGET-OS     -> 42155 hits    (unquoted: OR over the two words)
    METHODS:/TARGET-OS/   -> 0 hits        (no regex support)

There is no escape, no proximity operator and no exact-phrase modifier that restores
the hyphen. So for any accession whose hyphen-stripped form is also ordinary English,
the raw hit count is inflated by prose that has nothing to do with the dataset.

How much depends entirely on the words. Measured against open-access full text:

    TCGA-BRCA   100% of sampled hits really contain the accession
    TCGA-OV      97%
    TARGET-OS    86%      "target OS" also means "target overall survival"
    TARGET-WT    69%      "target WT" also means "target wild-type"
    TARGET-RT    14%      "target RT" also means radiotherapy, retention time,
                          reverse transcription, room temperature

Publishing 270 for TARGET-RT when the truth is nearer 38 is not a rounding error, and
because the inflation is token-specific it is not a constant the site could disclose
once. It has to be measured per accession.

So we measure it. Take a sample of the articles the section query returns, fetch the
open-access full text of the ones that have it, and test whether the literal accession -
hyphen included - actually appears. That fraction is the query's precision, and the
corrected count is the raw count times the precision.

Two limits, stated here because they are stated on the site:

*Only open-access articles can be checked.* The correction assumes the closed-access
articles a query returns are contaminated at the same rate as the open-access ones. That
is an assumption, not a measurement, and it is why the sample size travels with every
corrected number.

*The literal test is deliberately strict.* It accepts the accession written with a
hyphen, a dash, an underscore or nothing between the parts, but not with a space,
because a space is exactly the contamination pattern being measured. An article that
only ever writes "TCGA BRCA" is therefore scored as a miss even though it is a genuine
use. That biases precision downward, so a corrected count is a conservative estimate
rather than a best guess.
"""

from __future__ import annotations

import math
import re

import httpx

from cds.http import Client, FetchError
from cds.model import AccessionPrecision

BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest"

#: Bump when the sampling or the literal test changes; every corrected count stores it.
STRATEGY_ID = "epmc-literal-precision-v1"

#: Articles drawn from the head of the result list for each measurement.
#:
#: Twenty was tried first and is too thin. Two independent samples of TCGA-LIHC gave
#: 100% and 87%, which the Wilson interval covers honestly but only by being 16 points
#: wide - and the estimate multiplies the headline count, so its width is the count's
#: width. Thirty narrows that materially for one extra full text per two articles
#: already fetched.
SAMPLE_SIZE = 30

#: Below this many open-access full texts we decline to publish a corrected count at
#: all. Eight is where the Wilson interval on a plausible precision stops being wider
#: than the quantity it is describing.
MIN_CHECKED = 8


def is_vulnerable(token: str) -> bool:
    """Whether this accession can be inflated by Europe PMC's tokenization.

    Only a token containing a separator can be, because only then is there more than
    one indexed term to match as a phrase. `phs000178`, `GSE68086` and `PDC000173` are
    single terms and are matched exactly, so they need no correction and no sampling.
    """
    return bool(re.search(r"[-_\s]", token.strip()))


def _literal_pattern(token: str) -> re.Pattern[str]:
    """Match the accession as actually written, but never with a space."""
    parts = [re.escape(p) for p in re.split(r"[-_\s]+", token.strip()) if p]
    # hyphen, non-breaking/figure hyphen, en/em dash, underscore, or nothing at all
    joiner = r"[\-‐‑‒–—_]?"
    return re.compile(joiner.join(parts), re.I)


def wilson_interval(successes: int, trials: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score interval, which behaves at the extremes where the normal one does not.

    A sample that is 30/30 literal has a normal interval of exactly zero width, which
    would let the site claim a precision of 100% with no uncertainty from thirty
    articles. Wilson gives 88%-100% instead, which is the honest reading.
    """
    if trials <= 0:
        return (0.0, 1.0)
    p = successes / trials
    denom = 1 + z * z / trials
    centre = (p + z * z / (2 * trials)) / denom
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * trials)) / trials) / denom
    return (max(0.0, centre - margin), min(1.0, centre + margin))


def _sample_hits(client: Client, query: str, *, size: int) -> list[dict]:
    r = client.get(
        f"{BASE}/search",
        params={
            "query": query,
            "format": "json",
            "pageSize": str(size),
            "resultType": "core",
            "cursorMark": "*",
        },
    )
    if not r.ok:
        return []
    return ((r.json().get("resultList") or {}).get("result")) or []


def _full_text(client: Client, pmcid: str) -> str | None:
    """The article's full text, or None when Europe PMC will not serve it.

    Not every article Europe PMC lists as open access can actually be retrieved: some
    return a persistent 500 from the full-text endpoint. That is one unreadable article,
    and it already has a meaning here - it drops out of the sample, because we cannot
    judge what we cannot read. Letting it propagate instead aborted a corpus-wide pass
    on its 150th record.
    """
    try:
        r = client.get(f"{BASE}/{pmcid}/fullTextXML")
    except (FetchError, httpx.HTTPError):
        return None
    return r.text if r.ok else None


def unmeasured(token: str, query: str) -> AccessionPrecision:
    """The estimate for an accession nothing was found under.

    Zero hits need no correction, because the correction is a multiplication: whatever
    fraction of nothing is about this dataset is still nothing. Sampling here would
    retrieve articles to scale a count that is already exact.
    """
    return AccessionPrecision(
        token=token,
        query=query,
        strategy_id=STRATEGY_ID,
        needs_correction=False,
        precision=1.0,
        precision_low=1.0,
        precision_high=1.0,
        note=(
            "No article was found under this accession, so there is no count to correct "
            "and no sample was drawn."
        ),
    )


def measure(
    client: Client, token: str, query: str, *, sample_size: int = SAMPLE_SIZE
) -> AccessionPrecision:
    """Estimate what fraction of a section query's hits really contain the accession."""
    if not is_vulnerable(token):
        return AccessionPrecision(
            token=token,
            query=query,
            strategy_id=STRATEGY_ID,
            needs_correction=False,
            precision=1.0,
            precision_low=1.0,
            precision_high=1.0,
            n_sampled=0,
            n_checked=0,
            n_literal=0,
            note=(
                "This accession is a single indexed term, so Europe PMC matches it "
                "exactly and the hit count needs no correction."
            ),
        )

    hits = _sample_hits(client, query, size=sample_size)
    pattern = _literal_pattern(token)
    n_checked = n_literal = 0
    for hit in hits:
        pmcid = hit.get("pmcid")
        if not pmcid or hit.get("isOpenAccess") != "Y":
            continue
        text = _full_text(client, pmcid)
        if text is None:
            continue
        n_checked += 1
        if pattern.search(text):
            n_literal += 1

    if n_checked < MIN_CHECKED:
        return AccessionPrecision(
            token=token,
            query=query,
            strategy_id=STRATEGY_ID,
            needs_correction=True,
            precision=None,
            precision_low=None,
            precision_high=None,
            n_sampled=len(hits),
            n_checked=n_checked,
            n_literal=n_literal,
            note=(
                f"Only {n_checked} of the {len(hits)} sampled articles have open-access "
                f"full text, which is too few to estimate how much of this count is "
                "Europe PMC matching the accession's words separately. No corrected "
                "count is published for this dataset."
            ),
        )

    p = n_literal / n_checked
    lo, hi = wilson_interval(n_literal, n_checked)
    return AccessionPrecision(
        token=token,
        query=query,
        strategy_id=STRATEGY_ID,
        needs_correction=True,
        precision=round(p, 4),
        precision_low=round(lo, 4),
        precision_high=round(hi, 4),
        n_sampled=len(hits),
        n_checked=n_checked,
        n_literal=n_literal,
        note=(
            f"{n_literal} of {n_checked} sampled open-access articles contain the literal "
            f"accession {token}; the rest match only because Europe PMC indexes the "
            "hyphen as a word break. Counts for this dataset are scaled by "
            f"{p:.0%} accordingly."
        ),
    )


def correct(raw: int, est: AccessionPrecision) -> int | None:
    """Apply a precision estimate to a raw hit count. None means 'do not publish'."""
    if not est.needs_correction:
        return raw
    if est.precision is None:
        return None
    return int(round(raw * est.precision))
