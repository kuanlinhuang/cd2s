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

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 3 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000226
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000226
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000226: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 13
- 23 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 2 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.41 (negative means less reused than comparable datasets)
  - Proteogenomic insights suggest druggable pathways in endometrial carcinoma. (2023) PMID 37567170
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075
  - SIMSI-Transfer: Software-Assisted Reduction of Missing Values in Phosphoproteomic and Proteomic Isobaric Labeling Data Using Tandem Mass Spectrum Clustering. (2022) PMID 35462064
  - Pan-Cancer Proteomics Analysis to Identify Tumor-Enriched and Highly Expressed Cell Surface Antigens as Potential Targets for Cancer Therapeutics. (2023) PMID 37517589

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ucec-discovery-study.json
