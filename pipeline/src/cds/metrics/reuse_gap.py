"""The Reuse Gap Index.

The brief for this project asked us to label datasets "underexplored" only where
evidence supports it. That is harder than it sounds, because raw reuse counts are not
comparable: a 10,000-case open pan-cancer cohort released in 2013 will out-cite a
200-case controlled cohort released in 2023 regardless of how interesting either is.
Calling the second one underexplored on raw counts would be meaningless.

So we model expected reuse from the structural properties that drive it and measure the
residual:

    y         = log2( observed analyzing articles + 1 )
    fitted    = Huber robust regression of y on
                log10 cohort size, log2(1 + years available),
                log2(1 + modality breadth), access tier
    RGI       = y - fitted

RGI near zero means a dataset is reused about as much as comparable datasets. Negative
means less. A dataset at -2 has roughly a quarter of the reuse its size, age, breadth and
access tier would predict.

The response is modeled already log-compressed rather than as a count. A negative
binomial GLM on raw counts was tried first and rejected; `fit()` documents why, and the
rejected specification is published in the diagnostics so the choice can be contested.

One deliberate omission: program membership is *not* a covariate. "It is part of TCGA"
is the effect we are trying to measure, not a nuisance to adjust away. Controlling for
it would define the problem out of existence.

Datasets with no citable accession are excluded from the fit and never labeled
underexplored, because for them the measurement is impossible rather than negative.
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

import numpy as np
import pandas as pd
import statsmodels.api as sm

from cds.model import (
    AccessTier,
    Confidence,
    DatasetRecord,
    Evidence,
    Method,
    UnderexploredLabel,
)

# A dataset is flagged underexplored when it sits at least this far below its predicted
# reuse, measured in log2 units. -1.5 is a shortfall of roughly two thirds, comfortably
# larger than the noise in the fit, and strict enough that the label stays meaningful.
RGI_THRESHOLD = -1.5

# Below this many analyzing articles we also require the shortfall to be real rather
# than an artifact of small numbers.
ABSOLUTE_REUSE_CEILING = 25

# Names the specification actually fitted. The previous id, "rgi-nb-v1", named the
# negative binomial GLM that was tried and rejected; keeping it would have made every
# label cite a model the code does not run.
MODEL_ID = "rgi-huber-v2"


def cohort_size(rec: DatasetRecord) -> int | None:
    return rec.cohort.n_cases or rec.cohort.n_samples or None


def years_available(rec: DatasetRecord, today: date | None = None) -> float | None:
    """Time the data have been available for others to use."""
    today = today or datetime.now(UTC).date()
    if rec.release_date:
        ref = rec.release_date
    else:
        years = [p.year for p in rec.primary_publications if p.year]
        if not years:
            return None
        ref = date(min(years), 7, 1)
    delta = (today - ref).days / 365.25
    return round(max(delta, 0.0), 2)


def observed_reuse(rec: DatasetRecord) -> int | None:
    """Articles whose methods reference this dataset's accession."""
    if rec.reuse_metrics.has_citable_accession is False:
        return None
    v = rec.reuse_metrics.n_by_tier.get("t3_analyzed")
    return int(v) if v is not None else None


def _access_bucket(tier: AccessTier) -> str:
    if tier == AccessTier.OPEN:
        return "open"
    if tier in (AccessTier.CONTROLLED, AccessTier.REQUEST):
        return "controlled"
    if tier == AccessTier.MIXED:
        return "mixed"
    return "unknown"


def build_frame(records: list[DatasetRecord]) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for r in records:
        obs = observed_reuse(r)
        n = cohort_size(r)
        yrs = years_available(r)
        rows.append(
            {
                "id": r.id,
                "observed": obs,
                "n_cases": n,
                "years": yrs,
                "n_modalities": len({a.modality for a in r.assays}) or None,
                "access": _access_bucket(r.access.tier),
                "eligible": obs is not None and n is not None and yrs is not None and n > 0,
            }
        )
    return pd.DataFrame(rows)


def fit(records: list[DatasetRecord]) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Fit expected reuse and compute the index for every eligible dataset.

    We model log2(observed + 1) with a Huber robust regression rather than fitting a
    count model to the raw counts. This was not the first choice and the reason for
    changing is worth recording, because it is the kind of thing that quietly invalidates
    an index.

    Reuse counts in this corpus span four orders of magnitude - the most reused dataset
    has thousands of analyzing articles while the median has a handful and many have
    none. Fitting a Poisson or negative binomial to that on a log link lets a handful of
    extreme points dominate the fit, and the resulting predictions extrapolate absurdly:
    an earlier negative binomial specification predicted hundreds of analyzing articles
    for a two-hundred-subject imaging collection, which would have made its "shortfall"
    an artifact of the model rather than a property of the dataset.

    Modeling the already-compressed response bounds this. The residual is then directly
    interpretable: it *is* the reuse gap index, in log2 units, with no back-transformation
    and no opportunity for exponential blow-up.

    It reduces the problem rather than removing it, and the honest version of that
    sentence is worth keeping. Some small collection is still predicted far more articles
    than it received - lower than the negative binomial's extrapolation, and inside the
    range actually seen in the corpus, but a long way from comfortable. Which dataset
    that is, and by how much, is published in the diagnostics as
    `largest_over_prediction` rather than written into prose that goes stale: it is the
    reason the underexplored label additionally requires the absolute count to be small,
    and the reason anyone recomputing the index from the published coefficients should
    treat the upper tail of `expected_reuse` as the weakest part of the model.
    """
    df = build_frame(records)
    fitset = df[df["eligible"]].copy()
    diagnostics: dict[str, Any] = {
        "model_id": MODEL_ID,
        "n_records": int(len(df)),
        "n_eligible": int(len(fitset)),
        "n_excluded_no_citable_accession": int((df["observed"].isna()).sum()),
        "rgi_threshold_log2": RGI_THRESHOLD,
        "absolute_reuse_ceiling": ABSOLUTE_REUSE_CEILING,
    }
    if len(fitset) < 30:
        diagnostics["status"] = "insufficient data to fit"
        df["expected"] = np.nan
        df["rgi"] = np.nan
        df["rgi_percentile"] = np.nan
        return df, diagnostics

    fitset["log_n"] = np.log10(fitset["n_cases"].astype(float))
    fitset["log_years"] = np.log2(1.0 + fitset["years"].astype(float))
    fitset["log_modalities"] = np.log2(1.0 + fitset["n_modalities"].fillna(1).astype(float))

    X = pd.get_dummies(
        fitset[["log_n", "log_years", "log_modalities", "access"]],
        columns=["access"],
        drop_first=True,
        dtype=float,
    )
    X = sm.add_constant(X, has_constant="add")
    y = np.log2(fitset["observed"].astype(float) + 1.0)

    # Robust (Huber) rather than ordinary least squares. The 33 TCGA projects are
    # simultaneously the oldest and the most reused datasets in the corpus, which gives
    # them high leverage and lets "years available" partly absorb "is part of TCGA" -
    # precisely the program effect we refuse to control for directly. Huber weighting
    # limits how far that cluster can drag the fit, so the expectation for an ordinary
    # dataset is set by ordinary datasets.
    model = sm.RLM(y, X, M=sm.robust.norms.HuberT()).fit()
    fitted = model.predict(X)
    ols = sm.OLS(y, X).fit()

    # The index is the residual in log2 units. Expected reuse is reported on the natural
    # count scale for readability, clipped at the largest count actually observed so it
    # can never claim more reuse than any dataset in the corpus has received.
    fitset["rgi"] = y - fitted
    fitset["expected"] = np.clip(np.power(2.0, fitted) - 1.0, 0.0, float(fitset["observed"].max()))
    fitset["rgi_percentile"] = fitset["rgi"].rank(pct=True) * 100.0

    resid_sd = float(np.std(fitset["rgi"], ddof=1))

    # The model's own worst case, published rather than described. The Methods page used
    # to name a specific dataset and a specific predicted count in prose; those numbers
    # went stale the first time the corpus changed, which is exactly the failure this
    # project criticises elsewhere. They are computed here instead.
    over = fitset.assign(gap=fitset["expected"] - fitset["observed"]).sort_values(
        "gap", ascending=False
    )
    worst = over.iloc[0] if len(over) else None
    largest_over_prediction = (
        {
            "id": str(worst["id"]),
            "n_cases": int(worst["n_cases"]),
            "observed": int(worst["observed"]),
            "expected": round(float(worst["expected"]), 1),
            "residual_log2": round(float(worst["rgi"]), 2),
            "residual_in_sd": round(float(worst["rgi"]) / resid_sd, 1) if resid_sd else None,
        }
        if worst is not None
        else None
    )
    diagnostics.update(
        {
            "status": "fitted",
            "family": "Huber robust regression on log2(observed + 1)",
            "ols_r_squared_for_reference": round(float(ols.rsquared), 3),
            "n_downweighted_by_robust_fit": int((np.asarray(model.weights) < 0.9).sum()),
            "residual_sd_log2": round(resid_sd, 3),
            "coefficients": {k: round(float(v), 4) for k, v in model.params.items()},
            "p_values": {k: float(f"{v:.3g}") for k, v in model.pvalues.items()},
            "observed_reuse_median": float(fitset["observed"].median()),
            "observed_reuse_max": int(fitset["observed"].max()),
            "max_expected_reuse": round(float(fitset["expected"].max()), 1),
            "largest_over_prediction": largest_over_prediction,
            "upper_tail_note": (
                "Expected reuse is least trustworthy at the top of its range. The "
                "dataset in `largest_over_prediction` is the corpus's worst case: the "
                "model predicts far more analysing articles than were observed. That is "
                "why the underexplored label additionally requires a small absolute "
                "count, and why anyone recomputing the index should treat the upper tail "
                "of `expected_reuse` as the weakest part of the fit."
            ),
            "covariates": [
                "log10(cohort size)",
                "log2(1 + years available)",
                "log2(1 + number of distinct modalities)",
                "access tier (open / mixed / controlled / unknown)",
            ],
            "deliberately_excluded_covariates": [
                "program membership - this is the disparity being measured, "
                "not a nuisance to adjust away"
            ],
            "response_note": (
                "Response is log2(analyzing articles + 1). The index is the model "
                "residual, so -1 means the dataset sits one log2 unit below the "
                "prediction for datasets matched on size, age, breadth and access tier."
            ),
            "rejected_specification": (
                "A negative binomial GLM on raw counts was fitted first and rejected: "
                "reuse counts span four orders of magnitude, so extreme points dominated "
                "the fit and predictions extrapolated to hundreds of articles for small "
                "collections. Ordinary least squares on the log response fixed the "
                "extrapolation but still let the TCGA cluster, which is both the oldest "
                "and the most reused group, set the slope on years available."
            ),
        }
    )

    out = df.merge(fitset[["id", "expected", "rgi", "rgi_percentile"]], on="id", how="left")
    return out, diagnostics


def _ordinal(value: float | None) -> str:
    """1st, 2nd, 3rd, 4th. A plain "th" printed "2th percentile" on the label."""
    if value is None:
        return "-"
    n = int(round(value))
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


# A dataset cited far more often than it is analyzed is known but little used, which is
# a different problem from one nobody has heard of - and a different thing to tell a
# reader. Five citations per analysis is the point where the gap stops being noise.
CITATION_TO_REUSE_NOTABLE = 5


def citation_basis_line(m) -> str | None:
    """The 'known but little used' sentence, when the numbers support it."""
    ratio = m.citation_to_reuse_ratio
    if not ratio or ratio < CITATION_TO_REUSE_NOTABLE:
        return None
    return (
        f"Its publications are cited {m.n_citations_to_primary_publication} times, about "
        f"{ratio:.0f} citations for every article that analyzed the data - the dataset "
        "is known but little used."
    )


def refresh_underexplored_basis(records: list[DatasetRecord]) -> int:
    """Top up the underexplored basis after curation has supplied the marker papers.

    `gap` runs before `curate`, so when the label is first written the citation count is
    usually unknown - for GDC and PDC records it is always unknown, because their APIs
    carry no publication. That left the citation sentence unreachable for every dataset
    it was written for. Rather than reorder the pipeline, the label is topped up once the
    numbers exist. Returns how many labels gained the sentence.
    """
    n = 0
    for rec in records:
        if not rec.underexplored.is_underexplored:
            continue
        line = citation_basis_line(rec.reuse_metrics)
        if line and line not in rec.underexplored.basis:
            rec.underexplored.basis = [*rec.underexplored.basis, line]
            n += 1
    return n


def apply_to_records(
    records: list[DatasetRecord], frame: pd.DataFrame, diagnostics: dict[str, Any]
) -> int:
    """Write expected reuse, the index and the underexplored label onto each record."""
    by_id = {row["id"]: row for _, row in frame.iterrows()}
    now = datetime.now(UTC)
    n_flagged = 0
    for rec in records:
        row = by_id.get(rec.id)
        if row is None:
            continue
        m = rec.reuse_metrics
        m.years_since_release = float(row["years"]) if pd.notna(row.get("years")) else None
        if pd.notna(row.get("expected")):
            m.expected_reuse = round(float(row["expected"]), 2)
        if pd.notna(row.get("rgi")):
            m.reuse_gap_index = round(float(row["rgi"]), 3)
        if pd.notna(row.get("rgi_percentile")):
            m.reuse_gap_percentile = round(float(row["rgi_percentile"]), 1)

        if m.reuse_gap_index is None:
            rec.underexplored = UnderexploredLabel(
                is_underexplored=False,
                basis=[
                    "Not assessed: this dataset has no accession specific enough for "
                    "citation-based reuse tracing, so a shortfall cannot be measured."
                ]
                if m.has_citable_accession is False
                else ["Not assessed: insufficient metadata to model expected reuse."],
                comparator_set=MODEL_ID,
            )
            continue

        observed = int(row["observed"]) if pd.notna(row.get("observed")) else 0
        flagged = m.reuse_gap_index <= RGI_THRESHOLD and observed <= ABSOLUTE_REUSE_CEILING
        basis: list[str] = []
        if flagged:
            n_flagged += 1
            basis.append(
                f"{observed} article(s) reference this dataset's accession in a methods "
                f"section, against {m.expected_reuse:.1f} predicted for "
                f"datasets of comparable size, age, modality breadth and access tier "
                f"(reuse gap index {m.reuse_gap_index:+.2f} on a log2 scale, "
                f"{_ordinal(m.reuse_gap_percentile)} percentile of the assessed corpus)."
            )
            line = citation_basis_line(m)
            if line:
                basis.append(line)
        elif m.reuse_gap_index <= RGI_THRESHOLD:
            # Below the model, but already reused enough that calling it underexplored
            # would be a stretch. Saying "within the expected range" here, which is what
            # this used to do, contradicted the same page's own "well below" verdict and
            # the index printed beside it.
            basis.append(
                f"{observed} article(s) reference this dataset's accession in a methods "
                f"section, fewer than the {m.expected_reuse:.1f} predicted for comparable "
                f"datasets (index {m.reuse_gap_index:+.2f}). It is not flagged as "
                f"underexplored because more than {ABSOLUTE_REUSE_CEILING} articles have "
                f"already analysed it, which is not the position a researcher looking for "
                f"neglected data is looking for."
            )
        else:
            basis.append(
                f"Reuse is within the expected range for comparable datasets "
                f"(index {m.reuse_gap_index:+.2f})."
            )

        rec.underexplored = UnderexploredLabel(
            is_underexplored=flagged,
            basis=basis,
            index_value=m.reuse_gap_index,
            percentile=m.reuse_gap_percentile,
            comparator_set=(
                f"{diagnostics.get('n_eligible')} datasets in this corpus with a citable "
                "accession and sufficient metadata"
            ),
            evidence=[
                Evidence(
                    method=Method.DERIVED,
                    source_label=f"Reuse Gap Index ({MODEL_ID})",
                    retrieved_at=now,
                    locator=(
                        "Huber robust regression of log2(analyzing articles + 1) on "
                        "cohort size, years available, modality breadth and access tier"
                    ),
                    confidence=Confidence.MEDIUM,
                    note=(
                        "Model, covariates and coefficients are published with the "
                        "dataset export so the label can be recomputed or contested."
                    ),
                )
            ],
        )
    return n_flagged
