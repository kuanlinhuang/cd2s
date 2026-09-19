# %% [markdown]
# # Treatment response in a cohort that can actually support it
#
# **Level:** intermediate &nbsp;·&nbsp; **Language:** Python &nbsp;·&nbsp; **Runtime:** about a minute
# &nbsp;·&nbsp; **Access:** none required for the clinical layer
#
# Most treatment-response analyses on public cancer cohorts are built on sand: the
# response field is sparse, the therapy is unrecorded, or the field labeled "response"
# actually holds disease status. This workbook does the checking first and the analysis
# second, on `CGCI-HTMCP-CC` - 212 cervical carcinomas from Ugandan women, 98% Black
# African, with ECOG performance status on essentially every case.
#
# A distinction that matters and is easy to miss: GDC's response-bearing fields carry
# both genuine response categories (`complete response`, `progressive disease`) and
# disease-status codes (`tf-tumor free`, `wt-with tumor`, `pdm-persistent distant
# metastasis`). The second group describes the state of the disease, not how it responded
# to treatment. Counting them as response is how a cohort with no treatment data at all
# ends up flagged as usable for resistance research.

# %%
import json
from collections import Counter
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
import pandas as pd
from scipy import stats

GDC = "https://api.gdc.cancer.gov"
PROJECT_ID = "CGCI-HTMCP-CC"


def gdc_get(endpoint: str, params: dict) -> dict:
    url = f"{GDC}/{endpoint}?{urlencode(params)}"
    with urlopen(url, timeout=180) as r:  # noqa: S310 - fixed, trusted host
        return json.loads(r.read().decode())


filters = json.dumps(
    {"op": "in", "content": {"field": "project.project_id", "value": [PROJECT_ID]}},
    sort_keys=True,
)

# %% [markdown]
# ## 1. Separate genuine response from disease status

# %%
RESPONSE_VOCABULARY = {
    "complete response", "partial response", "progressive disease", "stable disease",
    "cr-complete response", "pr-partial response", "pd-progressive disease",
    "sd-stable disease", "complete remission", "partial remission",
    "no measurable disease", "persistent disease", "treatment ongoing",
}
NON_ANSWERS = {"not reported", "unknown", "unspecified", "not applicable"}

agg = gdc_get(
    "cases",
    {
        "filters": filters,
        "facets": "diagnoses.treatments.treatment_outcome,follow_ups.disease_response",
        "size": "0",
        "format": "json",
    },
)["data"]["aggregations"]

for field, node in agg.items():
    buckets = {b["key"]: b["doc_count"] for b in node.get("buckets", []) if b["key"] != "_missing"}
    genuine = {k: v for k, v in buckets.items() if k.lower() in RESPONSE_VOCABULARY}
    status = {
        k: v for k, v in buckets.items()
        if k.lower() not in RESPONSE_VOCABULARY and k.lower() not in NON_ANSWERS
    }
    print(f"\n{field}")
    print(f"  genuine response values : {genuine}")
    print(f"  disease-status values   : {status}")

# %% [markdown]
# `follow_ups.disease_response` is dominated by `tf-tumor free` and `wt-with tumor`,
# which are tumor-status codes. `diagnoses.treatments.treatment_outcome` carries the
# real response categories. Only the second is used below.

# %% [markdown]
# ## 2. Assemble a per-case response table
#
# Treatment records are one-to-many, so a case can have several outcomes. We collapse to
# one label per case with an explicit, pre-stated rule: a patient counts as a responder
# only if a complete or partial response is recorded and no progression is.

# %%
FIELDS = [
    "submitter_id",
    "demographic.vital_status",
    "demographic.days_to_death",
    "follow_ups.days_to_follow_up",
    "follow_ups.ecog_performance_status",
    "diagnoses.treatments.treatment_outcome",
    "diagnoses.treatments.therapeutic_agents",
    "diagnoses.treatments.treatment_type",
]
hits = gdc_get(
    "cases",
    {"filters": filters, "fields": ",".join(FIELDS), "size": "1000", "format": "json"},
)["data"]["hits"]
print(f"retrieved {len(hits)} cases")

RESPONDER = {"complete response", "partial response", "cr-complete response", "pr-partial response"}
PROGRESSOR = {"progressive disease", "pd-progressive disease"}


def as_number(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return np.nan
    return v if v > -35000 else np.nan


rows = []
for h in hits:
    demo = h.get("demographic") or {}
    outcomes, agents = [], []
    for d in h.get("diagnoses") or []:
        for tx in d.get("treatments") or []:
            o = (tx.get("treatment_outcome") or "").lower().strip()
            if o and o not in NON_ANSWERS:
                outcomes.append(o)
            a = (tx.get("therapeutic_agents") or "").lower().strip()
            if a:
                agents.append(a)

    if any(o in RESPONDER for o in outcomes) and not any(o in PROGRESSOR for o in outcomes):
        label = "responder"
    elif any(o in PROGRESSOR for o in outcomes):
        label = "progressor"
    else:
        label = None

    ecogs = [
        as_number(f.get("ecog_performance_status"))
        for f in (h.get("follow_ups") or [])
    ]
    ecogs = [e for e in ecogs if not np.isnan(e)]

    times = [as_number(f.get("days_to_follow_up")) for f in (h.get("follow_ups") or [])]
    times = [t for t in times if not np.isnan(t) and t >= 0]
    dd = as_number(demo.get("days_to_death"))
    if not np.isnan(dd) and dd >= 0:
        times.append(dd)

    rows.append(
        {
            "case": h.get("submitter_id"),
            "response": label,
            "n_outcome_records": len(outcomes),
            "agents": "; ".join(sorted(set(agents))) or None,
            "ecog": min(ecogs) if ecogs else np.nan,
            "vital_status": str(demo.get("vital_status", "")).lower(),
            "time_months": (max(times) / 30.44) if times else np.nan,
        }
    )

df = pd.DataFrame(rows)
print(f"\ncases with a usable response label: {df['response'].notna().sum()} of {len(df)}")
print(df["response"].value_counts(dropna=False).to_string())

# %% [markdown]
# ## 3. Is performance status associated with response?

# %%
sub = df[df["response"].notna() & df["ecog"].notna()]
print(f"cases with both response and ECOG: {len(sub)}")

if len(sub) >= 20:
    print("\nECOG distribution by response group:")
    print(pd.crosstab(sub["ecog"], sub["response"]).to_string())
    r = sub.loc[sub["response"] == "responder", "ecog"]
    p = sub.loc[sub["response"] == "progressor", "ecog"]
    if len(r) >= 5 and len(p) >= 5:
        u = stats.mannwhitneyu(r, p, alternative="two-sided")
        print(f"\nMann-Whitney U: p = {u.pvalue:.4g}")
        print(f"  median ECOG, responders  : {r.median()} (n={len(r)})")
        print(f"  median ECOG, progressors : {p.median()} (n={len(p)})")
    else:
        print("\ntoo few in one group for a comparison")
else:
    print("too few cases with both fields")

# %% [markdown]
# ## 4. Which agents were actually given?

# %%
agent_counts = Counter()
for a in df["agents"].dropna():
    for part in a.split(";"):
        part = part.strip()
        if part:
            agent_counts[part] += 1
print("Therapeutic agents recorded (case counts):")
for agent, n in agent_counts.most_common(12):
    print(f"  {agent:<28} {n}")
print(f"\ncases with any agent recorded: {df['agents'].notna().sum()} of {len(df)}")

# %% [markdown]
# ## 5. Honest limits of this analysis
#
# The analysis above is real and runs on open data, but three things bound what it can
# conclude, and all three are properties of the data rather than of the method:
#
# - **Stage is absent for all 212 cases.** Stage is the dominant prognostic factor in
#   cervical cancer, so no result here is stage-adjusted, and it cannot be made so from
#   the harmonized records.
# - **Therapeutic agents are recorded for under a third of patients**, so agent-specific
#   claims apply to a minority and possibly a non-random one.
# - **Treatment is not randomized.** Patients who received different therapy differ in
#   ways that are not recorded, so everything here is associative.
#
# What makes this cohort worth the effort anyway is what it uniquely offers: 207 of 212
# patients are Black African women, ECOG is informative for 98.6% of them, and no other
# public cervical cancer cohort of this size describes this population.
