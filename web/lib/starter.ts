import { siteUrl } from "@/lib/site";
import type { DatasetRecord } from "@/lib/types";

/**
 * Starter code for getting a dataset onto disk.
 *
 * Every repository has a different door. These snippets are generated from the record's
 * own identifiers so they run as written against the public APIs, and they stop at the
 * point where an access request would be needed. They are a first step, not a
 * workflow; the executed workbooks on the page go further.
 */

export interface Snippet {
  key: string;
  label: string;
  language: "python" | "bash";
  code: string;
  note?: string;
}

function ids(r: DatasetRecord, scheme: string): string[] {
  return [...new Set(r.identifiers.filter((i) => i.scheme === scheme).map((i) => i.value))];
}


export function starterSnippets(r: DatasetRecord): Snippet[] {
  const out: Snippet[] = [];
  const site = siteUrl();
  const gdc = ids(r, "gdc_project_id")[0];
  const pdc = ids(r, "pdc_study_id");
  const idc = ids(r, "idc_collection_id")[0];
  const cbio = ids(r, "cbioportal_study_id")[0];
  const syn = ids(r, "synapse_id");

  if (gdc) {
    out.push({
      key: "gdc",
      label: "GDC: list open files and download them",
      language: "python",
      note: "Open-access files need no account. Controlled files need an approved dbGaP request and a token passed to gdc-client.",
      code: `import json, requests

PROJECT = "${gdc}"
filters = {"op": "and", "content": [
    {"op": "in", "content": {"field": "cases.project.project_id", "value": [PROJECT]}},
    {"op": "in", "content": {"field": "access", "value": ["open"]}},
]}
params = {"filters": json.dumps(filters),
          "fields": "file_id,file_name,data_category,data_type,file_size",
          "size": "10000", "format": "JSON"}
files = requests.get("https://api.gdc.cancer.gov/files", params=params, timeout=60).json()["data"]["hits"]
print(len(files), "open files")

# Write a manifest and fetch with the GDC client (https://gdc.cancer.gov/access-data/gdc-data-transfer-tool)
with open("manifest.txt", "w") as fh:
    fh.write("id\\n" + "\\n".join(f["file_id"] for f in files))
# $ gdc-client download -m manifest.txt`,
    });
    out.push({
      key: "gdc-clinical",
      label: "GDC: clinical table for every case",
      language: "python",
      code: `import json, requests

filters = {"op": "in", "content": {"field": "project.project_id", "value": ["${gdc}"]}}
params = {"filters": json.dumps(filters), "size": "5000", "format": "TSV",
          "fields": ",".join([
              "submitter_id", "demographic.vital_status", "demographic.days_to_death",
              "diagnoses.days_to_last_follow_up", "diagnoses.ajcc_pathologic_stage",
              "diagnoses.treatments.treatment_type", "diagnoses.treatments.treatment_outcome"])}
tsv = requests.get("https://api.gdc.cancer.gov/cases", params=params, timeout=60).text
open("${gdc}_clinical.tsv", "w").write(tsv)`,
    });
  }

  if (pdc.length > 0) {
    const first = pdc[0];
    out.push({
      key: "pdc",
      label: "PDC: file manifest through the GraphQL API",
      language: "python",
      note: pdc.length > 1 ? `This cohort spans ${pdc.length} PDC studies (${pdc.join(", ")}). Repeat for each.` : undefined,
      code: `import requests

STUDY = "${first}"
query = """query ($id: String!) {
  filesPerStudy(pdc_study_id: $id, acceptDUA: true) {
    file_id file_name file_type data_category md5sum file_size signedUrl { url }
  }
}"""
r = requests.post("https://pdc.cancer.gov/graphql", json={"query": query, "variables": {"id": STUDY}}, timeout=120)
files = r.json()["data"]["filesPerStudy"]
print(len(files), "files")
for f in files[:3]:
    print(f["file_name"], f["data_category"], f["file_size"])
# Each signedUrl.url is a time-limited download link; stream it to disk with requests.get(url, stream=True).`,
    });
  }

  if (idc) {
    out.push({
      key: "idc",
      label: "IDC: pull the DICOM collection with idc-index",
      language: "python",
      note: "pip install idc-index. Images are public; the package uses s5cmd under the hood.",
      code: `from idc_index import IDCClient

client = IDCClient()
df = client.get_series(collection_id="${idc}")   # one row per DICOM series
print(len(df), "series;", df["Modality"].value_counts().to_dict())
client.download_from_selection(collection_id="${idc}", downloadDir="./${idc}")`,
    });
  }

  if (cbio) {
    out.push({
      key: "cbio",
      label: "cBioPortal: clinical data and the full study bundle",
      language: "python",
      code: `import requests, pandas as pd

STUDY = "${cbio}"
base = "https://www.cbioportal.org/api"
clin = requests.get(f"{base}/studies/{STUDY}/clinical-data",
                    params={"clinicalDataType": "PATIENT", "projection": "SUMMARY"}, timeout=60).json()
patients = pd.DataFrame(clin).pivot_table(index="patientId", columns="clinicalAttributeId",
                                          values="value", aggfunc="first")
print(patients.shape)
profiles = requests.get(f"{base}/studies/{STUDY}/molecular-profiles", timeout=60).json()
print([p["molecularProfileId"] for p in profiles])
# Whole study as flat files: https://cbioportal-datahub.s3.amazonaws.com/${cbio}.tar.gz`,
    });
  }

  if (syn.length > 0) {
    out.push({
      key: "htan",
      label: "HTAN: fetch files from Synapse",
      language: "python",
      note: "pip install synapseclient. Register at synapse.org and accept the HTAN terms first. Level 1 and 2 sequencing is controlled through dbGaP.",
      code: `import synapseclient

syn = synapseclient.login()          # uses ~/.synapseConfig or SYNAPSE_AUTH_TOKEN
for sid in ${JSON.stringify(syn.slice(0, 4))}:
    entity = syn.get(sid, downloadLocation="./htan")
    print(sid, entity.name)
# Browse the atlas at ${r.landing_page_url ?? "https://humantumoratlas.org/explore"}`,
    });
  }

  out.push({
    key: "record",
    label: "This page as data: limitations first",
    language: "bash",
    code: `curl -s ${site ?? "https://<site>"}/data/datasets/${r.id}.json | python3 -c '
import json, sys
r = json.load(sys.stdin)
for l in r["limitations"]:
    print(l["severity"].upper(), "-", l["statement"][:120])
print("survival endpoint:", r["longitudinal"]["has_survival_endpoint"], "| treatment response:", r["longitudinal"]["has_treatment_response"])'`,
    note: site ? undefined : "Replace <site> with the host this page is served from.",
  });

  return out;
}
