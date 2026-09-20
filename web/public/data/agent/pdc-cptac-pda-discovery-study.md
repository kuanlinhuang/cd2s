# CPTAC PDA Discovery Study

Dataset id: pdc-cptac-pda-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 166 cases
- Cancer types: Pancreatic Ductal Adenocarcinoma
- Subject: Pancreas
- Measurements: Glycoproteome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (Label Free / DIA)
- Median follow-up: 15.0 months (derivable for 144 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Sex at birth (gender): 92.2% informative
- Race: 90.4% informative
- Morphology (ICD-O): 88.0% informative
- Primary diagnosis: 88.0% informative
- Tissue or organ of origin: 88.0% informative
- Tumor grade: 88.0% informative
- Vital status: 86.7% informative
- Age at diagnosis: 86.7% populated (one-to-many)
- Days to last follow-up: 86.7% populated (one-to-many)
- AJCC pathologic stage: 84.9% informative
- Days to death: 69.3% populated (one-to-many)
- Cause of death: 55.4% informative
- Ethnicity: 19.3% informative
- Days to recurrence: 19.3% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 4 PDC studies (PDC000272, PDC000271, PDC000270, PDC000341); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000272
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000272. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000272"
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
- Reuse gap index: -0.26 (negative means less reused than comparable datasets)
  - Mucin 5AC-Mediated CD44/ITGB1 Clustering Mobilizes Adipose-Derived Mesenchymal Stem Cells to Modulate Pancreatic Cancer Stromal Heterogeneity. (2022) PMID 35219699
  - Tumor Microenvironment Responsive CD8<sup>+</sup> T Cells and Myeloid-Derived Suppressor Cells to Trigger CD73 Inhibitor AB680-Based Synergistic Therapy for Pancreatic Cancer. (2023) PMID 37867243
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - Federated Deep Learning Enables Cancer Subtyping by Proteomics. (2025) PMID 40488620
  - SiRCle (Signature Regulatory Clustering) model integration reveals mechanisms of phenotype regulation in renal cancer. (2024) PMID 39633487

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-pda-discovery-study.json
