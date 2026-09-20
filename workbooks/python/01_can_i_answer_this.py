# %% [markdown]
# # Can I answer this question with this dataset?
#
# **Level:** beginner &nbsp;·&nbsp; **Language:** Python &nbsp;·&nbsp; **Runtime:** about a minute
# &nbsp;·&nbsp; **Access:** none required
#
# The most expensive mistake in dataset reuse is discovering, after weeks of work and a
# controlled-access request, that the field your analysis depends on is empty. This
# workbook front-loads that discovery into sixty seconds.
#
# Given any NCI Genomic Data Commons project, it reports which classes of analysis the
# data can actually support, by measuring how complete the relevant clinical fields are
# rather than by checking whether they exist.
#
# Two distinctions drive everything here, and both come from working with the real data:
#
# 1. **Populated is not the same as informative.** A field filled entirely with
#    "not reported" blocks an analysis just as surely as an empty one. We count these
#    separately.
# 2. **One-to-many fields cannot be read as per-case percentages.** A case can have
#    several treatment records, so those facet counts sum to more than the cohort size.
#
# Nothing here needs credentials. Change `PROJECT_ID` and re-run.

# %%
import json
from urllib.parse import urlencode
from urllib.request import urlopen

import matplotlib as mpl
import matplotlib.pyplot as plt
import pandas as pd

GDC = "https://api.gdc.cancer.gov"

# Try any of: TCGA-BRCA, CGCI-HTMCP-CC, REBC-THYR, WCDT-MCRPC, FM-AD, MP2PRT-ALL
PROJECT_ID = "CGCI-HTMCP-CC"

pd.set_option("display.width", 120)
pd.set_option("display.max_colwidth", 46)


def gdc_get(endpoint: str, params: dict) -> dict:
    """Plain GET against the GDC API. No key, no account, no client library."""
    url = f"{GDC}/{endpoint}?{urlencode(params)}"
    with urlopen(url, timeout=120) as r:  # noqa: S310 - fixed, trusted host
        return json.loads(r.read().decode())


print(f"Auditing {PROJECT_ID}")

# %% [markdown]
# ## 1. How big is the cohort, and what was measured?

# %%
proj = gdc_get(
    f"projects/{PROJECT_ID}",
    {"expand": "summary,summary.experimental_strategies,program", "format": "json"},
)["data"]

summary = proj.get("summary", {})
n_cases = summary.get("case_count", 0)

print(f"{proj.get('name')}")
print(f"  program : {(proj.get('program') or {}).get('name')}")
print(f"  cases     : {n_cases:,}")
print(f"  files     : {summary.get('file_count', 0):,}")

strategies = pd.DataFrame(summary.get("experimental_strategies", []))
if not strategies.empty:
    strategies = strategies.sort_values("case_count", ascending=False)
    strategies["pct_of_cohort"] = (100 * strategies["case_count"] / n_cases).round(1)
    print("\nAssay coverage:")
    print(strategies[["experimental_strategy", "case_count", "pct_of_cohort"]].to_string(index=False))

# %% [markdown]
# Coverage is rarely uniform. A cohort described as "1,000 cases with multi-omics" often
# has whole genome sequencing on a tenth of them. Always check before designing a
# multi-omic analysis.

# %% [markdown]
# ## 2. Which clinical fields are actually populated?
#
# We ask the GDC for facet counts on the fields that decide whether common analyses are
# possible. The `_missing` bucket tells us how many cases have no value at all.

# %%
# Values that are present but carry no information.
NON_ANSWERS = {
    "not reported",
    "unknown",
    "not allowed to collect",
    "unspecified",
    "not otherwise specified",
    "indeterminate",
    "not applicable",
}

PROBES = {
    "demographic.vital_status": "Vital status",
    "demographic.race": "Race",
    "demographic.ethnicity": "Ethnicity",
    "diagnoses.ajcc_pathologic_stage": "AJCC pathologic stage",
    "diagnoses.ajcc_clinical_stage": "AJCC clinical stage",
    "diagnoses.progression_or_recurrence": "Progression or recurrence",
    "diagnoses.treatments.treatment_type": "Treatment type",
    "diagnoses.treatments.therapeutic_agents": "Therapeutic agents",
    "diagnoses.treatments.treatment_outcome": "Treatment outcome",
    "follow_ups.disease_response": "Disease response at follow-up",
    "follow_ups.ecog_performance_status": "ECOG performance status",
}

filters = json.dumps(
    {"op": "in", "content": {"field": "project.project_id", "value": [PROJECT_ID]}},
    sort_keys=True,
)
agg = gdc_get(
    "cases",
    {"filters": filters, "facets": ",".join(PROBES), "size": "0", "format": "json"},
)["data"]["aggregations"]

rows = []
for field, label in PROBES.items():
    node = agg.get(field)
    if node is None:
        rows.append({"field": label, "populated_pct": None, "informative_pct": None,
                     "one_to_many": False, "note": "not collected for this project"})
        continue

    values, missing = {}, 0
    for b in node.get("buckets", []) or []:
        if b["key"] == "_missing":
            missing = b["doc_count"]
        else:
            values[str(b["key"])] = b["doc_count"]

    if not values and not missing:
        continue

    total = n_cases
    populated = max(total - missing, 0)
    # If value counts exceed the cohort size, the field is one-to-many and the per-value
    # counts are per record, not per case.
    one_to_many = (sum(values.values()) + missing) > total * 1.05
    not_reported = sum(v for k, v in values.items() if k.lower() in NON_ANSWERS)
    informative = None if one_to_many else max(populated - not_reported, 0)

    rows.append(
        {
            "field": label,
            "populated_pct": round(100 * populated / total, 1) if total else None,
            "informative_pct": None if informative is None else round(100 * informative / total, 1),
            "one_to_many": one_to_many,
            "note": ", ".join(sorted(values, key=lambda k: -values[k])[:3]),
        }
    )

coverage = pd.DataFrame(rows)
print(coverage.to_string(index=False))

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
# ### The same table, read at a glance
#
# The gap between the two bars is the whole point of this workbook. A field can be
# populated for every case and still be worthless, because "not reported" is a value.

# %%
plot_df = coverage.dropna(subset=["populated_pct"]).sort_values("populated_pct")
if len(plot_df):
    pos = range(len(plot_df))
    fig, ax = plt.subplots(figsize=(8.6, 0.46 * len(plot_df) + 1.8))
    ax.barh([i + 0.19 for i in pos], plot_df["populated_pct"], height=0.36,
            color=MUTED, label="populated")
    ax.barh([i - 0.19 for i in pos], plot_df["informative_pct"].fillna(0), height=0.36,
            color=ACCENT, label="informative (non-answers removed)")
    for i, (_, row) in enumerate(plot_df.iterrows()):
        if row["one_to_many"]:
            ax.text(1.5, i - 0.19, "one-to-many: per-case share not derivable",
                    va="center", fontsize=8, color=WARN)
    ax.set_yticks(list(pos))
    ax.set_yticklabels(plot_df["field"])
    ax.set_xlim(0, 100)
    ax.set_xlabel("% of cases")
    ax.legend(frameon=False, loc="lower right", fontsize=8.5)
    ax.grid(axis="y", visible=False)
    finish(ax, f"{PROJECT_ID}: populated is not the same as informative")
    plt.show()
else:
    print("no probed field returned counts for this project")

# %% [markdown]
# ## 3. Is there a usable survival endpoint?
#
# Survival needs two things: a vital status that distinguishes alive from dead, and a
# time. A vital status column that is 100% populated with "unknown" satisfies neither.

# %%
case_fields = [
    "demographic.vital_status",
    "demographic.days_to_death",
    "diagnoses.days_to_last_follow_up",
]
cases = gdc_get(
    "cases",
    {
        "filters": filters,
        "fields": ",".join(case_fields),
        "size": str(min(max(n_cases, 1), 12000)),
        "format": "json",
    },
)["data"]["hits"]


def as_number(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if v > -35000 else None  # GDC uses large negatives as sentinels


records = []
for h in cases:
    demo = h.get("demographic") or {}
    dx = (h.get("diagnoses") or [{}])[0]
    status = str(demo.get("vital_status", "")).lower()
    records.append(
        {
            "vital_status": status or None,
            "days_to_death": as_number(demo.get("days_to_death")),
            "days_to_last_follow_up": as_number(dx.get("days_to_last_follow_up")),
        }
    )

surv = pd.DataFrame(records)
informative_status = surv["vital_status"].isin(["alive", "dead"]).sum()
n_dead = (surv["vital_status"] == "dead").sum()
has_time = surv[["days_to_death", "days_to_last_follow_up"]].notna().any(axis=1).sum()

print(f"cases retrieved            : {len(surv):,}")
print(f"informative vital status   : {informative_status:,} ({100*informative_status/max(len(surv),1):.1f}%)")
print(f"  of which deceased        : {n_dead:,}")
print(f"cases with a usable time   : {has_time:,}")

SURVIVAL_POSSIBLE = informative_status >= 20 and n_dead >= 10 and has_time >= 20
print(f"\nSurvival analysis viable   : {SURVIVAL_POSSIBLE}")
if not SURVIVAL_POSSIBLE:
    print("  -> Not enough informative status or events. Check the primary publication's")
    print("     supplement, or the dbGaP phenotype file, before assuming outcomes exist.")

# %% [markdown]
# ## 4. The verdict
#
# A short, blunt summary of what this cohort will and will not support.

# %%
def pct(label: str, column: str = "informative_pct"):
    row = coverage.loc[coverage["field"] == label]
    if row.empty:
        return 0.0
    val = row.iloc[0][column]
    if pd.isna(val):
        val = row.iloc[0]["populated_pct"]
    return float(val) if pd.notna(val) else 0.0


verdict = {
    "Overall survival": (
        SURVIVAL_POSSIBLE,
        f"{informative_status} cases with informative vital status, {n_dead} events",
    ),
    "Stage-adjusted modeling": (
        max(pct("AJCC pathologic stage"), pct("AJCC clinical stage")) >= 50,
        f"stage informative for {max(pct('AJCC pathologic stage'), pct('AJCC clinical stage')):.0f}% of cases",
    ),
    "Treatment-response analysis": (
        pct("Treatment outcome", "populated_pct") >= 30
        or pct("Disease response at follow-up", "populated_pct") >= 30,
        f"treatment outcome populated for {pct('Treatment outcome', 'populated_pct'):.0f}% of cases",
    ),
    "Agent-specific analysis": (
        pct("Therapeutic agents", "populated_pct") >= 25,
        f"therapeutic agents recorded for {pct('Therapeutic agents', 'populated_pct'):.0f}% of cases",
    ),
    "Race-stratified analysis": (
        pct("Race") >= 50,
        f"race informative for {pct('Race'):.0f}% of cases",
    ),
    "Progression-free endpoints": (
        pct("Progression or recurrence") >= 30,
        f"progression informative for {pct('Progression or recurrence'):.0f}% of cases",
    ),
}

print(f"VERDICT FOR {PROJECT_ID}\n" + "=" * 68)
for analysis, (ok, why) in verdict.items():
    mark = "YES " if ok else "NO  "
    print(f"{mark} {analysis:<30} {why}")

blocked = [k for k, (ok, _) in verdict.items() if not ok]
print("=" * 68)
if blocked:
    print(f"Blocked without additional data: {', '.join(blocked)}")
else:
    print("All checked analyses are supported by the harmonized records.")

# %% [markdown]
# ## What to do next
#
# - **If your analysis is marked NO**, it is not that the science is impossible - it is
#   that this repository's harmonized records do not carry the variable. The primary
#   publication's supplement and the dbGaP phenotype file are the two places to look
#   next, and both are worth checking *before* you submit an access request.
# - **Re-run with a different `PROJECT_ID`** to compare candidates. Running this over
#   `FM-AD` (18,004 cases) and `CGCI-HTMCP-CC` (212 cases) is instructive: the cohort
#   that is eighty times larger supports fewer of these analyses.
# - The same audit for every dataset in the corpus is precomputed on the Cancer Data
#   Showcase dataset pages, under "At a glance".
