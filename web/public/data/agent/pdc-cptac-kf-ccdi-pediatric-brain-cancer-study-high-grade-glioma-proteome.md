# CPTAC-KF-CCDI-Pediatric Brain Cancer Study - High-Grade Glioma Proteome

Dataset id: pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-high-grade-glioma-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 45 cases
- Cancer types: Gliomas, Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Proteome mass spectrometry (TMT18 / DDA)
- Median follow-up: 130.8 months (derivable for 9 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Vital status: 82.2% informative
- Sex at birth (gender): 82.2% informative
- Age at diagnosis: 82.2% populated (one-to-many)
- Tissue or organ of origin: 80.0% informative
- Primary diagnosis: 75.6% informative
- Ethnicity: 64.4% informative
- Race: 57.8% informative
- Morphology (ICD-O): 24.4% informative
- Tumor grade: 24.4% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Classification of tumor: 24.4% informative
- Days to last follow-up: 13.3% populated (one-to-many)
- Cause of death: 6.7% informative
- Days to death: 6.7% populated (one-to-many)

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000687
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000687. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000687"
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

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-high-grade-glioma-proteome.json
