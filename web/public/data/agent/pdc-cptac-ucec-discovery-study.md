# CPTAC UCEC Discovery Study

Dataset id: pdc-cptac-ucec-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 123 cases
- Cancer types: Uterine Corpus Endometrial Carcinoma
- Subject: Uterus
- Measurements: Acetylome mass spectrometry (TMT10 / DDA), Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA)
- Median follow-up: 28.7 months (derivable for 103 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Prior treatment: 0.0% informative
- Classification of tumor: 0.0% informative
- Sex at birth (gender): 84.6% informative
- Morphology (ICD-O): 84.6% informative
- Primary diagnosis: 84.6% informative
- Tissue or organ of origin: 84.6% informative
- AJCC pathologic stage: 84.6% informative
- Age at diagnosis: 84.6% populated (one-to-many)
- Vital status: 83.7% informative
- Race: 83.7% informative
- Days to last follow-up: 83.7% populated (one-to-many)
- Tumor grade: 82.1% informative
- Ethnicity: 39.0% informative
- Cause of death: 9.8% informative
- Days to death: 9.8% populated (one-to-many)
- Days to recurrence: 7.3% populated (one-to-many)

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 3 PDC studies (PDC000226, PDC000126, PDC000125); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000226
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000226. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000226"
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

- Articles that analyzed these data: 13
- Citations to the dataset's publication: 48 (attention, not reuse)
- Reuse gap index: -0.63 (negative means less reused than comparable datasets)
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - SIMSI-Transfer: Software-Assisted Reduction of Missing Values in Phosphoproteomic and Proteomic Isobaric Labeling Data Using Tandem Mass Spectrum Clustering. (2022) PMID 35462064
  - Inflammation-related citrullination of matrisome proteins in human cancer. (2022) PMID 36531007
  - Alternate RNA decoding results in stable and abundant proteins in mammals. (2026) PMID 42343131
  - Algorithmically Reconstructed Molecular Pathways as the New Generation of Prognostic Molecular Biomarkers in Human Solid Cancers. (2023) PMID 37755705

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ucec-discovery-study.json
