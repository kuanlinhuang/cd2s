# Sampling techniques for enrichment of PDAC

Dataset id: pdc-sampling-techniques-for-enrichment-of-pdac

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 7 cases
- Cancer types: Pancreatic Ductal Adenocarcinoma
- Subject: Pancreas
- Measurements: Proteome mass spectrometry (TMT10 / DDA)
- Median follow-up: 10.5 months (derivable for 6 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Ethnicity: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Vital status: 85.7% informative
- Race: 85.7% informative
- Sex at birth (gender): 85.7% informative
- Morphology (ICD-O): 85.7% informative
- Primary diagnosis: 85.7% informative
- Tissue or organ of origin: 85.7% informative
- Tumor grade: 85.7% informative
- AJCC pathologic stage: 85.7% informative
- Classification of tumor: 0.0% informative
- Age at diagnosis: 85.7% populated (one-to-many)
- Days to last follow-up: 85.7% populated (one-to-many)
- Cause of death: 71.4% informative
- Days to death: 71.4% populated (one-to-many)
- Days to recurrence: 14.3% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000393
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000393. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000393"
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

- Articles that analyzed these data: 2
- Reuse gap index: +0.96 (negative means less reused than comparable datasets)
  - Alternate RNA decoding results in stable and abundant proteins in mammals. (2026) PMID 42343131

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-sampling-techniques-for-enrichment-of-pdac.json
