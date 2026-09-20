# Prospective Colon PNNL Proteome Qeplus

Dataset id: pdc-prospective-colon-pnnl-proteome-qeplus

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 102 cases
- Subject: Colorectal and bowel (derived from title; not stated by repository)
- Measurements: Proteome mass spectrometry (TMT10 / DDA)
- Access: open. Direct download from the PDC portal or its API; no account required

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting.
   https://pdc.cancer.gov/pdc/study/PDC000116
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000116. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000116"
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
- Reuse gap index: +1.76 (negative means less reused than comparable datasets)
  - Arginase-1 inhibition reduces migration ability and metastatic colonization of colon cancer cells. (2023) PMID 36639644
  - LINC00982-encoded protein PRDM16-DT regulates <i>CHEK2</i> splicing to suppress colorectal cancer metastasis and chemoresistance. (2024) PMID 38855188
  - Targeting ARF1-IQGAP1 interaction to suppress colorectal cancer metastasis and vemurafenib resistance. (2023) PMID 36396045
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - Network-based elucidation of colon cancer drug resistance mechanisms by phosphoproteomic time-series analysis. (2024) PMID 38724493

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-prospective-colon-pnnl-proteome-qeplus.json
