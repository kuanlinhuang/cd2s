# CPTAC HNSCC Discovery Study

Dataset id: pdc-cptac-hnscc-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 124 cases
- Cancer types: Head and Neck Squamous Cell Carcinoma
- Subject: Head and neck
- Measurements: Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 24.3 months (derivable for 106 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Sex at birth (gender): 90.3% informative
- Tumor grade: 90.3% informative
- Morphology (ICD-O): 88.7% informative
- Primary diagnosis: 88.7% informative
- Tissue or organ of origin: 88.7% informative
- AJCC pathologic stage: 88.7% informative
- Age at diagnosis: 88.7% populated (one-to-many)
- Race: 87.1% informative
- Vital status: 86.3% informative
- Days to last follow-up: 86.3% populated (one-to-many)
- Prior malignancy: 83.1% informative
- Days to death: 33.1% populated (one-to-many)
- Cause of death: 19.4% informative
- Days to recurrence: 2.4% populated (one-to-many)
- Ethnicity: 1.6% informative
- Treatment type: 0.8% populated (one-to-many)

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000222
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000222
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000222: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 18
- 24 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: +0.30 (negative means less reused than comparable datasets)
  - A proteogenomic portrait of lung squamous cell carcinoma. (2021) PMID 34358469
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - Pathobiological functions and clinical implications of annexin dysregulation in human cancers. (2022) PMID 36247003
  - SMYD3 represses tumor-intrinsic interferon response in HPV-negative squamous cell carcinoma of the head and neck. (2023) PMID 37463106

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-hnscc-discovery-study.json
