# CPTAC GBM Discovery Study

Dataset id: pdc-cptac-gbm-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 111 cases
- Cancer types: Glioblastoma
- Subject: Brain and central nervous system
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Lipidome mass spectrometry (Label Free / DDA), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 12.8 months (derivable for 100 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Vital status: 99.1% informative
- Sex at birth (gender): 99.1% informative
- Age at diagnosis: 99.1% populated (one-to-many)
- Race: 97.3% informative
- Morphology (ICD-O): 90.1% informative
- Primary diagnosis: 90.1% informative
- Tissue or organ of origin: 90.1% informative
- AJCC pathologic stage: 0.0% informative
- Days to last follow-up: 90.1% populated (one-to-many)
- Days to death: 65.8% populated (one-to-many)
- Cause of death: 64.9% informative
- Ethnicity: 31.5% informative
- Days to recurrence: 26.1% populated (one-to-many)
- Treatment type: 0.9% populated (one-to-many)
- Treatment outcome: 0.9% populated (one-to-many)

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 5 PDC studies (PDC000245, PDC000553, PDC000552, PDC000205, PDC000204); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000245
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000245. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000245"
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
- Citations to the dataset's publication: 11 (attention, not reuse)
- Reuse gap index: -1.86 (negative means less reused than comparable datasets)
  - Nitrogen metabolism profiling reveals cell state-specific pyrimidine synthesis pathway choice. (2026) PMID 42056505
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932
  - KinPred-RNA-kinase activity inference and cancer type classification using machine learning on RNA-seq data. (2024) PMID 38523792

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-gbm-discovery-study.json
