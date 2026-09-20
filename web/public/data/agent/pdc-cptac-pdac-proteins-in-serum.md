# CPTAC PDAC Proteins in Serum

Dataset id: pdc-cptac-pdac-proteins-in-serum

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 118 cases
- Cancer types: Pancreatic Ductal Adenocarcinoma
- Subject: Pancreas
- Measurements: Glycoproteome mass spectrometry (Label Free / DIA), Proteome mass spectrometry (Label Free / DIA)
- Median follow-up: 25.9 months (derivable for 38 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Ethnicity: 0.0% informative
- Sex at birth (gender): 100.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Race: 40.7% informative
- Vital status: 32.2% informative
- Morphology (ICD-O): 32.2% informative
- Primary diagnosis: 32.2% informative
- Tissue or organ of origin: 32.2% informative
- Tumor grade: 32.2% informative
- AJCC pathologic stage: 32.2% informative
- Age at diagnosis: 32.2% populated (one-to-many)
- Days to last follow-up: 32.2% populated (one-to-many)
- Days to death: 26.3% populated (one-to-many)
- Cause of death: 22.9% informative
- Days to recurrence: 17.8% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 2 PDC studies (PDC000527, PDC000526); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000527
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000527. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000527"
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
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-pdac-proteins-in-serum.json
