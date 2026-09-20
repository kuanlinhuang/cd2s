# CPTAC LSCC Discovery Study

Dataset id: pdc-cptac-lscc-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 115 cases
- Cancer types: Lung Squamous Cell Carcinoma
- Subject: Lung
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA), Ubiquitylome mass spectrometry (TMT11 / DDA)
- Median follow-up: 39.6 months (derivable for 104 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 95.7% informative
- Morphology (ICD-O): 95.7% informative
- Primary diagnosis: 95.7% informative
- Tissue or organ of origin: 95.7% informative
- Tumor grade: 95.7% informative
- Classification of tumor: 0.0% informative
- Race: 94.8% informative
- AJCC pathologic stage: 93.0% informative
- Age at diagnosis: 93.0% populated (one-to-many)
- Vital status: 91.3% informative
- Days to last follow-up: 91.3% populated (one-to-many)
- Ethnicity: 29.6% informative
- Days to death: 29.6% populated (one-to-many)
- Cause of death: 19.1% informative
- Days to recurrence: 3.5% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 4 PDC studies (PDC000233, PDC000232, PDC000234, PDC000237); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000233
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000233. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000233"
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

- Articles that analyzed these data: 19
- Reuse gap index: -1.21 (negative means less reused than comparable datasets)
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - Inflammation-related citrullination of matrisome proteins in human cancer. (2022) PMID 36531007
  - SiRCle (Signature Regulatory Clustering) model integration reveals mechanisms of phenotype regulation in renal cancer. (2024) PMID 39633487
  - Cytidine diphosphate diacylglycerol synthase 2 is a synthetic lethal target in mesenchymal-like cancers. (2025) PMID 40615674

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-lscc-discovery-study.json
