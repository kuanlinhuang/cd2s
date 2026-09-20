# Prospective Ovarian PNNL Proteome Qeplus

Dataset id: pdc-prospective-ovarian-pnnl-proteome-qeplus

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 95 cases
- Cancer types: Ovarian Serous Cystadenocarcinoma
- Subject: Ovary and fallopian tube
- Measurements: Proteome mass spectrometry (TMT10 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- Tumor grade: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Classification of tumor: 0.0% informative
- Prior malignancy: 96.8% informative
- Age at diagnosis: 96.8% populated (one-to-many)
- Days to last follow-up: 96.8% populated (one-to-many)
- Days to recurrence: 96.8% populated (one-to-many)
- Tissue or organ of origin: 94.7% informative
- Primary diagnosis: 92.6% informative
- Sex at birth (gender): 91.6% informative
- Race: 89.5% informative
- AJCC pathologic stage (tumor_stage): 87.4% informative
- Ethnicity: 84.2% informative
- Morphology (ICD-O): 82.1% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000118
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000118. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000118"
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

- Articles that analyzed these data: 3
- Reuse gap index: +0.12 (negative means less reused than comparable datasets)
  - Mutation impact on mRNA versus protein expression across human cancers. (2025) PMID 39775839
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932
  - HMPA: a pioneering framework for the noncanonical peptidome from discovery to functional insights. (2024) PMID 39413795

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-prospective-ovarian-pnnl-proteome-qeplus.json
