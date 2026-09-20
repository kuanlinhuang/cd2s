# TCGA Ovarian JHU Proteome

Dataset id: pdc-tcga-ovarian-jhu-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 124 cases
- Cancer types: Ovarian Serous Cystadenocarcinoma
- Subject: Ovary and fallopian tube
- Measurements: Proteome mass spectrometry (iTRAQ4 / DDA)
- Median follow-up: 29.9 months (derivable for 122 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Prior malignancy: 0.0% informative
- Vital status: 98.4% informative
- Sex at birth (gender): 98.4% informative
- Morphology (ICD-O): 98.4% informative
- Primary diagnosis: 98.4% informative
- Tissue or organ of origin: 98.4% informative
- Prior treatment: 98.4% informative
- Classification of tumor: 0.0% informative
- Age at diagnosis: 95.2% populated (one-to-many)
- Days to last follow-up: 95.2% populated (one-to-many)
- Race: 91.1% informative
- Days to death: 61.3% populated (one-to-many)
- Ethnicity: 46.8% informative
- Cause of death: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000113
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000113. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000113"
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
- Citations to the dataset's publication: 38 (attention, not reuse)
- Reuse gap index: +0.15 (negative means less reused than comparable datasets)
  - Automated imaging and identification of proteoforms directly from ovarian cancer tissue. (2023) PMID 37838706
  - Model Cell Lines and Tissues of Different HGSOC Subtypes Differ in Local Estrogen Biosynthesis. (2022) PMID 35681563
  - Machine Learning-Enhanced Extraction of Biomarkers for High-Grade Serous Ovarian Cancer from Proteomics Data. (2024) PMID 38918474
  - Inflammation-related citrullination of matrisome proteins in human cancer. (2022) PMID 36531007
  - Mutation impact on mRNA versus protein expression across human cancers. (2025) PMID 39775839

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-tcga-ovarian-jhu-proteome.json
