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

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000116
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000116
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000116: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 19
- 29 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: +1.99 (negative means less reused than comparable datasets)
  - Arginase-1 inhibition reduces migration ability and metastatic colonization of colon cancer cells. (2023) PMID 36639644
  - LINC00982-encoded protein PRDM16-DT regulates CHEK2 splicing to suppress colorectal cancer metastasis and chemoresistance. (2024) PMID 38855188
  - Targeting ARF1-IQGAP1 interaction to suppress colorectal cancer metastasis and vemurafenib resistance. (2023) PMID 36396045
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - Network-based elucidation of colon cancer drug resistance mechanisms by phosphoproteomic time-series analysis. (2024) PMID 38724493

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-prospective-colon-pnnl-proteome-qeplus.json
