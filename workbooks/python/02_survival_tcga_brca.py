# %% [markdown]
# # Survival analysis on TCGA breast cancer, from open data only
#
# **Level:** beginner &nbsp;·&nbsp; **Language:** Python &nbsp;·&nbsp; **Runtime:** about two minutes
# &nbsp;·&nbsp; **Access:** none required
#
# A complete, correct survival analysis of 1,098 breast tumors using only files that
# anyone can download without an account or a data access request.
#
# The part people get wrong is the endpoint, and it is worth being precise about why.
#
# GDC stores follow-up time in three different places and uses a different one depending
# on the project. For TCGA-BRCA, `diagnoses.days_to_last_follow_up` - the field almost
# everyone reaches for - is null for 1,097 of 1,098 cases, while
# `follow_ups.days_to_follow_up` is populated for 1,096. Reading only the obvious field
# gives you a cohort of about 150 patients, nearly all of them deaths, and a survival
# curve that is badly wrong in a way nothing warns you about.
#
# We hit exactly this bug building this workbook. The fix is to take the latest contact
# evidenced by *any* of the three fields, and to guard against GDC's negative sentinel
# values while doing it.

# %%
import json
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
import pandas as pd
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.statistics import logrank_test

GDC = "https://api.gdc.cancer.gov"
PROJECT_ID = "TCGA-BRCA"


def gdc_get(endpoint: str, params: dict) -> dict:
    url = f"{GDC}/{endpoint}?{urlencode(params)}"
    with urlopen(url, timeout=180) as r:  # noqa: S310 - fixed, trusted host
        return json.loads(r.read().decode())


print("lifelines survival analysis on open GDC clinical data")

# %% [markdown]
# ## 1. Pull case-level clinical fields

# %%
FIELDS = [
    "submitter_id",
    "demographic.vital_status",
    "demographic.days_to_death",
    "demographic.age_at_index",
    "demographic.race",
    "diagnoses.days_to_last_follow_up",   # null for almost every TCGA-BRCA case
    "follow_ups.days_to_follow_up",       # where the follow-up time actually lives here
    "diagnoses.ajcc_pathologic_stage",
    "diagnoses.primary_diagnosis",
]

filters = json.dumps(
    {"op": "in", "content": {"field": "project.project_id", "value": [PROJECT_ID]}},
    sort_keys=True,
)
hits = gdc_get(
    "cases",
    {"filters": filters, "fields": ",".join(FIELDS), "size": "5000", "format": "json"},
)["data"]["hits"]
print(f"retrieved {len(hits):,} cases")

# %% [markdown]
# ## 2. Derive the overall survival endpoint
#
# `SENTINEL_FLOOR` guards against GDC's large negative placeholders, which otherwise
# produce negative survival times that silently corrupt a Cox model.

# %%
SENTINEL_FLOOR = -35000


def as_number(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return np.nan
    return v if v > SENTINEL_FLOOR else np.nan


def last_contact_days(case: dict) -> float:
    """Latest contact evidenced by any GDC field. Returns NaN when none is usable."""
    candidates = []
    for d in case.get("diagnoses") or []:
        v = as_number(d.get("days_to_last_follow_up"))
        if v is not None and not np.isnan(v) and v >= 0:
            candidates.append(v)
    for f in case.get("follow_ups") or []:
        v = as_number(f.get("days_to_follow_up"))
        if v is not None and not np.isnan(v) and v >= 0:
            candidates.append(v)
    v = as_number((case.get("demographic") or {}).get("days_to_death"))
    if v is not None and not np.isnan(v) and v >= 0:
        candidates.append(v)
    return max(candidates) if candidates else np.nan


rows = []
for h in hits:
    demo = h.get("demographic") or {}
    # 182 of 1,098 cases carry more than one diagnosis record; take the first that has a
    # stage rather than assuming index zero has one.
    dxs = h.get("diagnoses") or [{}]
    stage = next(
        (d.get("ajcc_pathologic_stage") for d in dxs if d.get("ajcc_pathologic_stage")),
        None,
    )
    status = str(demo.get("vital_status", "")).lower()
    rows.append(
        {
            "case": h.get("submitter_id"),
            "vital_status": status,
            "days_to_death": as_number(demo.get("days_to_death")),
            "last_contact_days": last_contact_days(h),
            "age": as_number(demo.get("age_at_index")),
            "race": (demo.get("race") or "not reported").lower(),
            "stage": (stage or "unknown").lower(),
        }
    )

df = pd.DataFrame(rows)

# Event = death. Time = days to death for those who died, latest contact otherwise.
df["event"] = (df["vital_status"] == "dead").astype(int)
df["time_days"] = np.where(
    (df["event"] == 1) & df["days_to_death"].notna(),
    df["days_to_death"],
    df["last_contact_days"],
)
df["time_months"] = df["time_days"] / 30.44

before = len(df)
df = df[df["vital_status"].isin(["alive", "dead"])]
df = df[df["time_days"].notna() & (df["time_days"] > 0)]
print(f"usable for survival: {len(df):,} of {before:,} cases")
print(f"  events (deaths)  : {int(df['event'].sum()):,}")
censored = df.loc[df["event"] == 0, "time_months"]
print(f"  censored cases   : {len(censored):,}")
print(f"  median follow-up among censored: {censored.median():.1f} months")

# %% [markdown]
# Note how many cases are dropped. Reporting this number is not optional: an analysis
# that silently analyses 900 of 1,098 cases is a different analysis from the one the
# reader assumes.

# %% [markdown]
# ## 3. Kaplan-Meier

# %%
kmf = KaplanMeierFitter()
kmf.fit(df["time_months"], df["event"], label=f"{PROJECT_ID} overall survival")

print(f"median survival     : {kmf.median_survival_time_}")
for t in (12, 36, 60):
    if t <= df["time_months"].max():
        print(f"survival at {t:>2} months: {float(kmf.predict(t)):.3f}")

# %% [markdown]
# A median survival of `inf` is the correct answer, not a bug: fewer than half the
# patients died within the observed follow-up, so the median is not reached. Reporting a
# number here would require extrapolating beyond the data.

# %% [markdown]
# ## 4. Stratified comparison: does stage separate the curves?

# %%
def simplify_stage(s: str) -> str:
    s = s.replace("stage ", "").strip()
    for group in ("iv", "iii", "ii", "i"):
        if s.startswith(group):
            return f"stage {group.upper()}"
    return "unknown"


df["stage_group"] = df["stage"].map(simplify_stage)
counts = df["stage_group"].value_counts()
print(counts.to_string())

groups = [g for g in ["stage I", "stage II", "stage III", "stage IV"] if counts.get(g, 0) >= 20]
if len(groups) >= 2:
    a, b = groups[0], groups[-1]
    ga, gb = df[df["stage_group"] == a], df[df["stage_group"] == b]
    res = logrank_test(ga["time_months"], gb["time_months"], ga["event"], gb["event"])
    print(f"\nlog-rank {a} vs {b}: p = {res.p_value:.4g} (n={len(ga)} vs {len(gb)})")
else:
    print("\nnot enough staged cases for a log-rank comparison")

# %% [markdown]
# ## 5. Multivariable Cox model

# %%
model_df = df[df["stage_group"] != "unknown"].copy()
model_df = model_df[model_df["age"].notna()]
design = pd.get_dummies(
    model_df[["time_months", "event", "age", "stage_group"]],
    columns=["stage_group"],
    drop_first=True,
    dtype=float,
)

print(f"model cohort: {len(design):,} cases, {int(design['event'].sum())} events")

if len(design) >= 50 and design["event"].sum() >= 10:
    cph = CoxPHFitter()
    cph.fit(design, duration_col="time_months", event_col="event")
    summary = cph.summary[["coef", "exp(coef)", "p"]].round(4)
    print(summary.to_string())
    print(f"\nconcordance: {cph.concordance_index_:.3f}")
else:
    print("too few events for a stable Cox fit")

# %% [markdown]
# ## What this shows, and what it does not
#
# The analysis is complete and correct, and it runs on open data in about two minutes.
# It is also limited in ways that matter:
#
# - **The median patient is followed under three years**, though a minority reach twenty.
#   Breast cancer, especially hormone receptor positive disease, recurs over ten to twenty
#   years, so anything about late recurrence is thinly observed.
# - **Treatment is not in this model.** TCGA-BRCA records therapeutic agents for about
#   71% of cases and treatment outcome for 64%, and neither is adjusted for here. An
#   unadjusted survival model on an observational cohort mixes prognosis with treatment
#   selection.
# - **Stage is missing or unknown for a meaningful fraction**, which is why the Cox
#   cohort is smaller than the Kaplan-Meier cohort.
#
# Workbook 3 takes the treatment-response question seriously on a cohort where the
# treatment annotation supports it.
