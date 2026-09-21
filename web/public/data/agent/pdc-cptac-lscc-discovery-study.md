# CPTAC LSCC Discovery Study

Dataset id: pdc-cptac-lscc-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 115 cases
- Cancer types: Lung Squamous Cell Carcinoma
- Subject: Lung
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA), Ubiquitylome mass spectrometry (TMT11 / DDA)
- Median follow-up: 39.6 months (derivable for 104 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 95.7% informative
- Morphology (ICD-O): 95.7% informative
- Primary diagnosis: 95.7% informative
- Tissue or organ of origin: 95.7% informative
- Tumor grade: 95.7% informative
- Classification of tumor: 0.0% informative
- Race: 94.8% informative
- AJCC pathologic stage: 93.0% informative
- Age at diagnosis: 93.0% populated (one-to-many)
- Vital status: 91.3% informative
- Days to last follow-up: 91.3% populated (one-to-many)
- Ethnicity: 29.6% informative
- Days to death: 29.6% populated (one-to-many)
- Cause of death: 19.1% informative
- Days to recurrence: 3.5% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 4 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000233
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000233
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000233: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 19
- 26 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.90 (negative means less reused than comparable datasets)
  - A proteogenomic portrait of lung squamous cell carcinoma. (2021) PMID 34358469
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - Pan-Cancer Proteomics Analysis to Identify Tumor-Enriched and Highly Expressed Cell Surface Antigens as Potential Targets for Cancer Therapeutics. (2023) PMID 37517589

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-lscc-discovery-study.json
