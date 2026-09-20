# CPTAC UCEC Confirmatory Study

Dataset id: pdc-cptac-ucec-confirmatory-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 159 cases
- Cancer types: Uterine Corpus Endometrial Carcinoma
- Subject: Uterus
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Glycoproteome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 45.8 months (derivable for 127 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 86.8% informative
- Morphology (ICD-O): 86.8% informative
- Primary diagnosis: 86.8% informative
- Tissue or organ of origin: 86.8% informative
- Tumor grade: 86.2% informative
- Race: 83.6% informative
- AJCC pathologic stage: 81.8% informative
- Age at diagnosis: 81.8% populated (one-to-many)
- Vital status: 79.9% informative
- Days to last follow-up: 79.9% populated (one-to-many)
- Ethnicity: 39.0% informative
- Days to death: 13.8% populated (one-to-many)
- Cause of death: 12.6% informative
- Days to recurrence: 3.1% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Classification of tumor: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 4 PDC studies (PDC000443, PDC000445, PDC000441, PDC000439); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000443
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000443. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000443"
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

- Articles that analyzed these data: 1
- Citations to the dataset's publication: 3 (attention, not reuse)
- Reuse gap index: -2.65 (negative means less reused than comparable datasets)
  - Alternate RNA decoding results in stable and abundant proteins in mammals. (2026) PMID 42343131

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ucec-confirmatory-study.json
