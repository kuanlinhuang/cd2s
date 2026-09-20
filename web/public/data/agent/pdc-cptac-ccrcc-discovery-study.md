# CPTAC CCRCC Discovery Study

Dataset id: pdc-cptac-ccrcc-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 124 cases
- Subject: Kidney (derived from title; not stated by repository)
- Measurements: Glycoproteome mass spectrometry (TMT10 / DDA), Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (Label Free / DIA), Proteome mass spectrometry (TMT10 / DDA)
- Access: open. Direct download from the PDC portal or its API; no account required

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 4 PDC studies (PDC000471, PDC000128, PDC000200, PDC000127); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000471
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000471. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000471"
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
- Citations to the dataset's publication: 289 (attention, not reuse)
- Reuse gap index: -1.46 (negative means less reused than comparable datasets)
  - Telomere-related gene risk model for prognosis and drug treatment efficiency prediction in kidney cancer. (2022) PMID 36189312
  - SETD2 deficiency accelerates sphingomyelin accumulation and promotes the development of renal cancer. (2023) PMID 37989747
  - Identification and validation of <i>SERPINE1</i> as a prognostic and immunological biomarker in pan-cancer and in ccRCC. (2023) PMID 37680718
  - Integrated glycoproteomic characterization of clear cell renal cell carcinoma. (2023) PMID 37074911
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ccrcc-discovery-study.json
