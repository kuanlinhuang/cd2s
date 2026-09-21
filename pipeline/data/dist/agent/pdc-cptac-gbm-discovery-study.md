# CPTAC GBM Discovery Study

Dataset id: pdc-cptac-gbm-discovery-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 111 cases
- Cancer types: Glioblastoma
- Subject: Brain and central nervous system
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Lipidome mass spectrometry (Label Free / DDA), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 12.8 months (derivable for 100 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Vital status: 99.1% informative
- Sex at birth (gender): 99.1% informative
- Age at diagnosis: 99.1% populated (one-to-many)
- Race: 97.3% informative
- Morphology (ICD-O): 90.1% informative
- Primary diagnosis: 90.1% informative
- Tissue or organ of origin: 90.1% informative
- AJCC pathologic stage: 0.0% informative
- Days to last follow-up: 90.1% populated (one-to-many)
- Days to death: 65.8% populated (one-to-many)
- Cause of death: 64.9% informative
- Ethnicity: 31.5% informative
- Days to recurrence: 26.1% populated (one-to-many)
- Treatment type: 0.9% populated (one-to-many)
- Treatment outcome: 0.9% populated (one-to-many)

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 5 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000245
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000245
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000245: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 1
- 4 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 4 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: -2.04 (negative means less reused than comparable datasets)
  - KinPred-RNA-kinase activity inference and cancer type classification using machine learning on RNA-seq data. (2024) PMID 38523792
  - Nitrogen metabolism profiling reveals cell state-specific pyrimidine synthesis pathway choice. (2026) PMID 42056505
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-gbm-discovery-study.json
