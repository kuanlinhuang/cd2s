# Pediatric Brain Cancer Pilot Study

Dataset id: pdc-pediatric-brain-cancer-pilot-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 207 cases
- Cancer types: Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 141.2 months (derivable for 172 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Vital status: 96.1% informative
- Sex at birth (gender): 96.1% informative
- Morphology (ICD-O): 96.1% informative
- Primary diagnosis: 96.1% informative
- Tissue or organ of origin: 96.1% informative
- Tumor grade: 96.1% informative
- Classification of tumor: 96.1% informative
- Age at diagnosis: 96.1% populated (one-to-many)
- Ethnicity: 95.2% informative
- Race: 83.1% informative
- Days to last follow-up: 83.1% populated (one-to-many)
- Days to recurrence: 3.9% populated (one-to-many)

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 2 PDC studies (PDC000176, PDC000180); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000176
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000176. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000176"
   GQL = "https://pdc.cancer.gov/graphql"
   catalog = requests.post(GQL, json={"query": "{ studyCatalog(acceptDUA: true) { pdc_study_id versions { study_id is_latest_version } } }"}).json()["data"]["studyCatalog"]
   uuid = next(v["study_id"] for s in catalog if s["pdc_study_id"] == STUDY
               for v in s["versions"] if v["is_latest_version"] == "yes")
   q = '{ filesPerStudy(study_id: "%s" acceptDUA: true) { file_id file_name file_type data_category } }' % uuid
   files = requests.post(GQL, json={"query": q}).json()["data"]["filesPerStudy"]
   print(len(files), "files")
   PY
   ```

## Evidence of prior reuse

- Articles that analyzed these data: 6
- Citations to the dataset's publication: 10 (attention, not reuse)
- Reuse gap index: -0.48 (negative means less reused than comparable datasets)
  - Integrative multi-omics reveals two biologically distinct groups of pilocytic astrocytoma. (2023) PMID 37656187
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932
  - Surface Proteomic Analysis Reveals the Presence of Noncanonical Cell Membrane Endoplasmic Reticulum Chaperones in High-Grade Gliomas. (2026) PMID 41287960
  - A data-driven pan-cancer proteogenomic analysis reveals the characteristics of human cancer protein expression. (2026) PMID 41550727
  - Germline pathogenic variation impacts somatic alterations and patient outcomes in pediatric central nervous system tumors. (2025) PMID 41271695

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-pediatric-brain-cancer-pilot-study.json
