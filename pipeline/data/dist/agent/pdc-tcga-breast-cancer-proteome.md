# TCGA Breast Cancer Proteome

Dataset id: pdc-tcga-breast-cancer-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 109 cases
- Cancer types: Breast Invasive Carcinoma
- Subject: Breast
- Measurements: Proteome mass spectrometry (iTRAQ4 / DDA)
- Median follow-up: 37.5 months (derivable for 105 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Vital status: 96.3% informative
- Sex at birth (gender): 96.3% informative
- Morphology (ICD-O): 96.3% informative
- Primary diagnosis: 96.3% informative
- Tissue or organ of origin: 96.3% informative
- Classification of tumor: 0.0% informative
- AJCC pathologic stage (tumor_stage): 95.4% informative
- Prior treatment: 95.4% informative
- Prior malignancy: 95.4% informative
- Age at diagnosis: 95.4% populated (one-to-many)
- AJCC pathologic stage: 94.5% informative
- Race: 86.2% informative
- Days to last follow-up: 86.2% populated (one-to-many)
- Ethnicity: 76.1% informative
- Days to death: 11.9% populated (one-to-many)
- Cause of death: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000173
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000173. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000173"
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

- Articles that analyzed these data: 18
- Reuse gap index: +1.65 (negative means less reused than comparable datasets)
  - Carbonic anhydrases reduce the acidity of the tumor microenvironment, promote immune infiltration, decelerate tumor growth, and improve survival in ErbB2/HER2-enriched breast cancer. (2023) PMID 37098526
  - Pharmacological suppression of the OTUD4/CD73 proteolytic axis revives antitumor immunity against immune-suppressive breast cancers. (2024) PMID 38530357
  - Identifying tumour microenvironment-related signature that correlates with prognosis and immunotherapy response in breast cancer. (2023) PMID 36869083
  - METTL14 suppresses the expression of YAP1 and the stemness of triple-negative breast cancer. (2024) PMID 39563370
  - MGAT1-Guided complex N-Glycans on CD73 regulate immune evasion in triple-negative breast cancer. (2025) PMID 40229283

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-tcga-breast-cancer-proteome.json
