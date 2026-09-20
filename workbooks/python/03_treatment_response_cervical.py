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

import matplotlib as mpl
import matplotlib.pyplot as plt
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

# %%
# One house style for every figure below: a single accent, one contrast colour for the
# thing the reader must not miss, and nothing else. Defined here rather than imported so
# the downloaded notebook runs on its own.
INK, ACCENT, WARN, MUTED = "#1f2430", "#2f6f6b", "#b4762a", "#9aa3b2"
mpl.rcParams.update(
    {
        "figure.dpi": 120,
        "savefig.dpi": 120,
        "font.size": 9.5,
        "axes.titlesize": 11,
        "axes.titleweight": "semibold",
        "axes.labelcolor": INK,
        "axes.titlecolor": INK,
        "text.color": INK,
        "axes.edgecolor": MUTED,
        "xtick.color": MUTED,
        "ytick.color": MUTED,
        "axes.grid": True,
        "grid.color": "#e6e9ef",
        "grid.linewidth": 0.8,
        "axes.axisbelow": True,
    }
)


def finish(ax, title):
    ax.set_title(title, loc="left")
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.figure.tight_layout()
    return ax


# %% [markdown]
# ### What the outcome field actually contains
#
# The left panel is the reason this workbook exists: most cases carry no usable response
# label at all, and a bar chart makes that impossible to overlook in a way a printed
# count is not.

# %%
fig, axes = plt.subplots(1, 2, figsize=(9.8, 4.2))

vc = df["response"].value_counts(dropna=False)
labels = ["no usable label" if pd.isna(k) else str(k) for k in vc.index]
colors = [ACCENT if lab == "responder" else WARN if lab == "progressor" else MUTED
          for lab in labels]
axes[0].bar(labels, vc.values, color=colors, width=0.62)
for x, v in enumerate(vc.values):
    axes[0].text(x, v, f" {v}", ha="center", va="bottom", fontsize=8.5, color=INK)
axes[0].set_ylabel("cases")
axes[0].grid(axis="x", visible=False)
finish(axes[0], "Response label, after validation")

if len(sub) >= 20:
    order = [g for g in ("responder", "progressor") if (sub["response"] == g).any()]
    axes[1].boxplot(
        [sub.loc[sub["response"] == g, "ecog"].values for g in order],
        tick_labels=[f"{g}\n(n={(sub['response'] == g).sum()})" for g in order],
        widths=0.45,
        medianprops={"color": ACCENT, "linewidth": 2},
        boxprops={"color": MUTED},
        whiskerprops={"color": MUTED},
        capprops={"color": MUTED},
        flierprops={"markeredgecolor": MUTED, "markersize": 4},
    )
    axes[1].set_ylabel("ECOG performance status")
    axes[1].grid(axis="x", visible=False)
    finish(axes[1], "Performance status by response group")
else:
    axes[1].axis("off")
    axes[1].text(0.5, 0.5, "too few cases carry both response and ECOG",
                 ha="center", va="center", color=MUTED)
plt.show()

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
