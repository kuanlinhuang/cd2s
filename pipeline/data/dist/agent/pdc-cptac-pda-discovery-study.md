# CPTAC PDA Discovery Study

Dataset id: pdc-cptac-pda-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 166 cases
- Cancer types: Pancreatic Ductal Adenocarcinoma
- Subject: Pancreas
- Measurements: Glycoproteome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (Label Free / DIA)
- Median follow-up: 15.0 months (derivable for 144 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Sex at birth (gender): 92.2% informative
- Race: 90.4% informative
- Morphology (ICD-O): 88.0% informative
- Primary diagnosis: 88.0% informative
- Tissue or organ of origin: 88.0% informative
- Tumor grade: 88.0% informative
- Vital status: 86.7% informative
- Age at diagnosis: 86.7% populated (one-to-many)
- Days to last follow-up: 86.7% populated (one-to-many)
- AJCC pathologic stage: 84.9% informative
- Days to death: 69.3% populated (one-to-many)
- Cause of death: 55.4% informative
- Ethnicity: 19.3% informative
- Days to recurrence: 19.3% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 4 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000272
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000272
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000272: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 19
- 25 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.06 (negative means less reused than comparable datasets)
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - Mucin 5AC-Mediated CD44/ITGB1 Clustering Mobilizes Adipose-Derived Mesenchymal Stem Cells to Modulate Pancreatic Cancer Stromal Heterogeneity. (2022) PMID 35219699
  - Tumor Microenvironment Responsive CD8<sup>+</sup> T Cells and Myeloid-Derived Suppressor Cells to Trigger CD73 Inhibitor AB680-Based Synergistic Therapy for Pancreatic Cancer. (2023) PMID 37867243
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-pda-discovery-study.json
