# CPTAC GBM Confirmatory Study

Dataset id: pdc-cptac-gbm-confirmatory-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 118 cases
- Cancer types: Glioblastoma, Gliomas, Lung Adenocarcinoma, Skin Cutaneous Melanoma, Epithelial Neoplasms, NOS, Breast Invasive Carcinoma
- Subject: pan cancer
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Glycoproteome mass spectrometry (TMT11 / DDA), Lipidome mass spectrometry (Label Free / N/A), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 14.4 months (derivable for 112 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 99.2% informative
- Morphology (ICD-O): 99.2% informative
- Primary diagnosis: 99.2% informative
- Tissue or organ of origin: 98.3% informative
- Vital status: 96.6% informative
- Days to death: 76.3% populated (one-to-many)
- Race: 70.3% informative
- AJCC pathologic stage: 0.0% informative
- Age at diagnosis: 68.6% populated (one-to-many)
- Days to last follow-up: 66.9% populated (one-to-many)
- Cause of death: 58.5% informative
- Days to recurrence: 42.4% populated (one-to-many)
- Tumor grade: 22.9% informative
- Ethnicity: 12.7% informative
- Classification of tumor: 0.0% informative
- Treatment type: 0.8% populated (one-to-many)
- Treatment outcome: 0.8% populated (one-to-many)

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 6 PDC studies (PDC000450, PDC000454, PDC000547, PDC000546, PDC000448, PDC000446); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000450
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000450. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000450"
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
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-gbm-confirmatory-study.json
