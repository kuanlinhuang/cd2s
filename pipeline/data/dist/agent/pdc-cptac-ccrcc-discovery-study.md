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

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 4 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000471
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000471
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000471: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 4
- 45 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 3 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -1.34 (negative means less reused than comparable datasets)
  - Analysis and Visualization of Quantitative Proteomics Data Using FragPipe-Analyst. (2024) PMID 39254081
  - Telomere-related gene risk model for prognosis and drug treatment efficiency prediction in kidney cancer. (2022) PMID 36189312
  - SETD2 deficiency accelerates sphingomyelin accumulation and promotes the development of renal cancer. (2023) PMID 37989747
  - Identification and validation of <i>SERPINE1</i> as a prognostic and immunological biomarker in pan-cancer and in ccRCC. (2023) PMID 37680718
  - Integrated glycoproteomic characterization of clear cell renal cell carcinoma. (2023) PMID 37074911

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ccrcc-discovery-study.json
