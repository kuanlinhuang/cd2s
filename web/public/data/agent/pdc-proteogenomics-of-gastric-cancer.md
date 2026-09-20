# Proteogenomics of Gastric Cancer

Dataset id: pdc-proteogenomics-of-gastric-cancer

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 80 cases
- Cancer types: Early Onset Gastric Cancer
- Subject: Esophagus and stomach
- Measurements: Glycoproteome mass spectrometry (iTRAQ4 / DDA), Phosphoproteome mass spectrometry (iTRAQ4 / DDA), Proteome mass spectrometry (iTRAQ4 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Sex at birth (gender): 100.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Classification of tumor: 0.0% informative
- Primary diagnosis: 98.8% informative
- AJCC pathologic stage (tumor_stage): 7.5% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 3 PDC studies (PDC000216, PDC000215, PDC000214); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000216
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000216. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000216"
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

- Articles that analyzed these data: 4
- Citations to the dataset's publication: 19 (attention, not reuse)
- Reuse gap index: -1.91 (negative means less reused than comparable datasets)
  - Multi-Omics Characterization of E3 Regulatory Patterns in Different Cancer Types. (2024) PMID 39062881
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932
  - Human gastric cancer progression and stabilization of ATG2B through RNF5 binding facilitated by autophagy-associated CircDHX8. (2024) PMID 38866787
  - Hyperactivation of mTOR/eIF4E Signaling Pathway Promotes the Production of Tryptophan-To-Phenylalanine Substitutants in EBV-Positive Gastric Cancer. (2024) PMID 38994917
  - Comprehensive landscape of m6A regulator-related gene patterns and tumor microenvironment infiltration characterization in gastric cancer. (2024) PMID 39013954

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-proteogenomics-of-gastric-cancer.json
