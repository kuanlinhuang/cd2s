# CPTAC CCRCC Confirmatory Study

Dataset id: pdc-cptac-ccrcc-confirmatory-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 110 cases
- Subject: Kidney (derived from title; not stated by repository)
- Measurements: Glycoproteome mass spectrometry (Label Free / DIA), Phosphoproteome mass spectrometry (Label Free / DIA), Proteome mass spectrometry (Label Free / DIA)
- Access: open. Direct download from the PDC portal or its API; no account required

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 3 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000413
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000413
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000413: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 3
- 3 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 3 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: +0.00 (negative means less reused than comparable datasets)
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - Identification of non-canonical peptides with moPepGen. (2026) PMID 40523945
  - Targeting PLOD2 induces epithelioid differentiation and improves therapeutic response in sarcomatoid renal cell carcinoma. (2026) PMID 41109566

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ccrcc-confirmatory-study.json
