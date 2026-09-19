# %% [markdown]
# # Joining the same patients across two NCI repositories
#
# **Level:** advanced &nbsp;·&nbsp; **Language:** Python &nbsp;·&nbsp; **Runtime:** about two minutes
# &nbsp;·&nbsp; **Access:** none required
#
# TCGA-BRCA is one cohort of 1,098 patients. Its molecular data live in the Genomic Data
# Commons and its radiology and pathology imaging live in the Imaging Data Commons, and
# neither portal tells you about the other. The result is that a large amount of
# multimodal research that is already possible simply does not happen.
#
# This workbook builds the join, quantifies how many patients actually carry both, and
# then does the same sweep across every TCGA project to produce a map of where
# imaging-plus-molecular analysis is possible today.

# %%
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pandas as pd

GDC = "https://api.gdc.cancer.gov"
IDC = "https://api.imaging.datacommons.cancer.gov/v3"


def get_json(url: str, params: dict | None = None, timeout: int = 180):
    full = f"{url}?{urlencode(params)}" if params else url
    with urlopen(full, timeout=timeout) as r:  # noqa: S310 - fixed, trusted hosts
        return json.loads(r.read().decode())


def idc_sql(sql: str, timeout: int = 180) -> list[dict]:
    """Run SQL against IDC's public endpoint. Note the body field is `sql`, not `query`."""
    req = Request(
        f"{IDC}/sql",
        data=json.dumps({"sql": sql}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=timeout) as r:  # noqa: S310 - fixed, trusted host
        return json.loads(r.read().decode()).get("rows", [])


PROJECT_ID = "TCGA-BRCA"
IDC_COLLECTION = PROJECT_ID.lower().replace("-", "_")

# %% [markdown]
# ## 1. What each repository holds for this cohort

# %%
proj = get_json(
    f"{GDC}/projects/{PROJECT_ID}",
    {"expand": "summary,summary.experimental_strategies", "format": "json"},
)["data"]
n_gdc_cases = proj["summary"]["case_count"]

coll = get_json(f"{IDC}/collections/{IDC_COLLECTION}")
if isinstance(coll, list):
    coll = coll[0]

print(f"GDC  {PROJECT_ID}")
print(f"  cases : {n_gdc_cases:,}")
print(f"  files : {proj['summary']['file_count']:,}")
print(f"\nIDC  {IDC_COLLECTION}")
print(f"  patients : {coll.get('patients') or coll.get('subjects'):,}")
print(f"  series   : {coll.get('series'):,}")
print(f"  modalities      : {coll.get('modalities')}")
print(f"  supporting data : {coll.get('supporting_data')}")

# %% [markdown]
# ## 2. Build the patient-level join
#
# Both repositories key on the TCGA barcode, which is what makes this join possible at
# all. We pull the identifier list from each side and intersect.

# %%
filters = json.dumps(
    {"op": "in", "content": {"field": "project.project_id", "value": [PROJECT_ID]}},
    sort_keys=True,
)
gdc_cases = get_json(
    f"{GDC}/cases",
    {"filters": filters, "fields": "submitter_id", "size": "5000", "format": "json"},
)["data"]["hits"]
gdc_ids = {h["submitter_id"] for h in gdc_cases if h.get("submitter_id")}
print(f"GDC patient identifiers: {len(gdc_ids):,}")

# IDC exposes patient identifiers through a public SQL endpoint.
try:
    rows = idc_sql(
        "SELECT DISTINCT PatientID FROM index "
        f"WHERE collection_id = '{IDC_COLLECTION}'"
    )
    idc_ids = {r["PatientID"] for r in rows if r.get("PatientID")}
except Exception as exc:  # noqa: BLE001 - fall back rather than fail the workbook
    print(f"  SQL endpoint unavailable ({type(exc).__name__}); falling back to counts only")
    idc_ids = set()

if idc_ids:
    overlap = gdc_ids & idc_ids
    print(f"IDC patient identifiers: {len(idc_ids):,}")
    print(f"\npatients in BOTH repositories: {len(overlap):,}")
    print(f"  = {100 * len(overlap) / max(len(gdc_ids), 1):.1f}% of the GDC cohort")
    print(f"\nexample joined identifiers: {sorted(overlap)[:5]}")
    only_gdc = gdc_ids - idc_ids
    only_idc = idc_ids - gdc_ids
    print(f"molecular only (no imaging): {len(only_gdc):,}")
    print(f"imaging only (no molecular): {len(only_idc):,}")
else:
    n_idc = coll.get("patients") or coll.get("subjects") or 0
    print(f"\nIDC reports {n_idc:,} patients against {len(gdc_ids):,} in GDC")
    print("  upper bound on the joinable cohort:", min(n_idc, len(gdc_ids)))

# %% [markdown]
# ## 3. Where else is this possible?
#
# The same join works for every TCGA project. Mapping it produces something neither
# portal provides: a list of cohorts where imaging and molecular data already coexist.

# %%
projects = get_json(
    f"{GDC}/projects",
    {"size": "1000", "expand": "summary", "format": "json"},
)["data"]["hits"]
gdc_projects = {
    p["project_id"]: (p.get("summary") or {}).get("case_count") or 0
    for p in projects
    if p.get("project_id")
}

collections = get_json(f"{IDC}/collections")
idc_by_key = {}
for c in collections:
    key = (c.get("collection_id") or "").upper().replace("_", "-")
    idc_by_key[key] = c

matches = []
for pid, n_cases in gdc_projects.items():
    c = idc_by_key.get(pid.upper())
    if not c:
        continue
    matches.append(
        {
            "project": pid,
            "gdc_cases": n_cases,
            "idc_patients": c.get("patients") or c.get("subjects") or 0,
            "modalities": (c.get("modalities") or "")[:38],
            "supporting": (c.get("supporting_data") or "")[:38],
        }
    )

link_map = pd.DataFrame(matches).sort_values("gdc_cases", ascending=False)
print(f"{len(link_map)} cohorts exist in BOTH the GDC and the IDC\n")
print(link_map.head(20).to_string(index=False))
print(f"\ntotal patients in linkable cohorts: {link_map['gdc_cases'].sum():,}")

# %% [markdown]
# ## 4. Why this matters
#
# Every row above is a cohort where a researcher could, today and with no data access
# request, pair radiology or pathology imaging with matched molecular profiles on the
# same patients. The data are public, harmonized and openly licensed.
#
# The reason it rarely happens is not technical difficulty - the join above is a set
# intersection on a shared barcode. It is that no catalog lists these cohorts as
# multimodal, because each repository describes only its own holdings. Making the
# linkage visible is most of the work.
#
# **Next steps for a real analysis:**
#
# - Use `idc-index` (`pip install idc-index`) to pull DICOM for the joined patients.
# - Pull matched expression from the GDC open tier, as in workbook 2.
# - Check that imaging coverage is not biased by collection site or era before treating
#   the joined cohort as representative of the whole.
