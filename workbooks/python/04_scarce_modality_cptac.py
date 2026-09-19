# %% [markdown]
# # Finding and using the scarcest measurements in the NCI portfolio
#
# **Level:** intermediate &nbsp;·&nbsp; **Language:** Python &nbsp;·&nbsp; **Runtime:** about a minute
# &nbsp;·&nbsp; **Access:** none required - the Proteomic Data Commons is fully open
#
# Everyone knows where to find cancer RNA sequencing. Almost nobody knows that the NCI
# portfolio contains ubiquitylome data on five studies, lipidomics on three, and a single
# cohort measured seven different ways including protein-protein interactions.
#
# This workbook enumerates the entire Proteomic Data Commons through its public GraphQL
# API, ranks analytical fractions by scarcity, and finds the cohorts where several scarce
# layers land on the same tumors. No account, no key, no data access request.

# %%
import json
from collections import Counter, defaultdict
from urllib.request import Request, urlopen

import pandas as pd

PDC = "https://proteomic.datacommons.cancer.gov/graphql"

QUERY = """
{
  allPrograms {
    name
    projects {
      name
      studies {
        pdc_study_id
        submitter_id_name
        analytical_fraction
        experiment_type
        cases_count
      }
    }
  }
}
"""


def pdc_query(query: str) -> dict:
    req = Request(
        PDC,
        data=json.dumps({"query": query}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=180) as r:  # noqa: S310 - fixed, trusted host
        return json.loads(r.read().decode())


data = pdc_query(QUERY)["data"]

rows = []
for prog in data["allPrograms"]:
    for proj in prog.get("projects") or []:
        for st in proj.get("studies") or []:
            rows.append(
                {
                    "program": prog["name"],
                    "project": proj["name"],
                    "pdc_study_id": st.get("pdc_study_id"),
                    "study": st.get("submitter_id_name"),
                    "fraction": st.get("analytical_fraction"),
                    "experiment": st.get("experiment_type"),
                    "cases": st.get("cases_count") or 0,
                }
            )

df = pd.DataFrame(rows)
print(f"{len(df)} studies across {df['program'].nunique()} programs")

# %% [markdown]
# ## 1. Which measurements are actually scarce?

# %%
scarcity = (
    df.groupby("fraction")
    .agg(n_studies=("pdc_study_id", "nunique"), total_cases=("cases", "sum"))
    .sort_values("n_studies")
)
print(scarcity.to_string())

SCARCE = set(scarcity[scarcity["n_studies"] <= 20].index)
print(f"\nScarce fractions (20 or fewer studies): {sorted(SCARCE)}")

# %% [markdown]
# Proteome and phosphoproteome are common. Acetylome, glycoproteome, ubiquitylome,
# metabolome, lipidome and protein-protein interaction are not, and a researcher who
# needs one of them has very few places to go.

# %% [markdown]
# ## 2. Which cohorts carry several scarce layers on the same tumors?
#
# PDC ships one study per analytical fraction, so the proteome and the ubiquitylome of
# the same tumors arrive as separate records. Grouping them back into cohorts is what
# reveals where deep multi-layer analysis is actually possible.

# %%
import re

FRACTION_SUFFIX = re.compile(
    r"\s*[-]\s*(?:DIA\s+|TMT\s+|Label\s*Free\s+)?(?:Intact\s+|N-linked\s+|Cyst\s+Fluid\s+)?"
    r"(?:CompRef\s+)?(?:Proteome|Phosphoproteome|Phosphotyrosine|Acetylome|Glycoproteome|"
    r"Glycosite-containing\s+peptide|Ubiquitylome|Metabolome|Lipidome|"
    r"Protein-protein\s+Interaction|Proteomics)\s*$",
    re.IGNORECASE,
)


def cohort_name(study: str) -> str:
    name = (study or "").strip()
    for _ in range(3):
        stripped = FRACTION_SUFFIX.sub("", name).strip(" -")
        if stripped == name:
            break
        name = stripped
    return name


# CompRef studies are inter-laboratory reference materials, not patient cohorts.
patients = df[~df["study"].str.contains("CompRef", case=False, na=False)].copy()
patients["cohort"] = patients["study"].map(cohort_name)

grouped = (
    patients.groupby("cohort")
    .agg(
        n_fractions=("fraction", "nunique"),
        fractions=("fraction", lambda s: ", ".join(sorted(set(s)))),
        max_cases=("cases", "max"),
    )
    .reset_index()
)
grouped["n_scarce"] = patients.groupby("cohort")["fraction"].apply(
    lambda s: len(set(s) & SCARCE)
).values

deep = grouped[grouped["n_scarce"] >= 2].sort_values(
    ["n_scarce", "max_cases"], ascending=False
)
print(f"{len(grouped)} cohorts; {len(deep)} carry two or more scarce layers\n")
print(deep.head(12)[["cohort", "max_cases", "n_fractions", "n_scarce", "fractions"]].to_string(index=False))

# %% [markdown]
# ## 3. Pick a target and check the layer overlap
#
# The trap in multi-omic work is assuming all layers cover all cases. They do not.

# %%
TARGET = deep.iloc[0]["cohort"] if len(deep) else patients["cohort"].iloc[0]
print(f"Target cohort: {TARGET}\n")

target = patients[patients["cohort"] == TARGET][
    ["pdc_study_id", "fraction", "experiment", "cases"]
].sort_values("cases", ascending=False)
print(target.to_string(index=False))

n_max = int(target["cases"].max())
n_min = int(target["cases"].min())
print(f"\nlargest layer  : {n_max} cases")
print(f"smallest layer : {n_min} cases")
print(f"complete-case analysis across every layer is bounded above by {n_min} cases")
print(f"  -> that is {100 * n_min / n_max:.0f}% of the largest layer")

# %% [markdown]
# ## 4. How much reuse do these scarce datasets get?
#
# PDC study identifiers are almost never quoted in the literature, which means
# citation-based reuse tracing is close to blind here. We can demonstrate that directly.

# %%
from urllib.parse import urlencode

EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"


def epmc_hits(query: str) -> int:
    url = f"{EPMC}?{urlencode({'query': query, 'format': 'json', 'pageSize': 1})}"
    with urlopen(url, timeout=120) as r:  # noqa: S310 - fixed, trusted host
        return int(json.loads(r.read().decode()).get("hitCount") or 0)


print("Articles whose methods or results cite these PDC study accessions:\n")
checked = 0
for _, row in target.iterrows():
    sid = row["pdc_study_id"]
    n = epmc_hits(f'METHODS:"{sid}"')
    print(f"  {sid}  {row['fraction']:<28} {n} articles")
    checked += 1
    if checked >= 6:
        break

print(
    "\nNear-zero counts here do not mean the data are unused. They mean authors cite the\n"
    "marker paper rather than the accession, so citation-based reuse tracing cannot see\n"
    "proteomic reuse at all. That is a finding about the citation practice, not the data."
)

# %% [markdown]
# ## What to do with this
#
# - The cohort identified above is the most deeply measured in the NCI portfolio, and all
#   of it downloads without an account.
# - **Retrieve clinical data separately.** PDC ships no outcome, treatment or demographic
#   variables. For CPTAC cohorts these live in the Genomic Data Commons and must be joined
#   on case identifier - the step where most CPTAC reuse stalls.
# - **Check the layer intersection before designing**, using the numbers printed above.
