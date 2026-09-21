# KNCC Glioblastoma Evolution

Dataset id: pdc-kncc-glioblastoma-evolution

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 111 cases
- Cancer types: Glioblastoma
- Subject: Brain and central nervous system
- Measurements: Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 26.7 months (derivable for 105 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Ethnicity: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Race: 98.2% informative
- Sex at birth (gender): 98.2% informative
- Primary diagnosis: 98.2% informative
- Tissue or organ of origin: 98.2% informative
- Days to last follow-up: 94.6% populated (one-to-many)
- Days to recurrence: 93.7% populated (one-to-many)
- Age at diagnosis: 91.9% populated (one-to-many)
- Classification of tumor: 0.0% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000515
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000515
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000515: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 2
- 3 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 3 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: -0.59 (negative means less reused than comparable datasets)
  - Integrated proteogenomic characterization of glioblastoma evolution. (2024) PMID 38215747
  - Inhibition of FOS-Like Antigen 1 Reduces Chemoresistance to Temozolomide Through Stemness Reprogramming via IL-6/STAT3Tyr705 Pathway. (2026) PMID 41556041
  - T2Pdecoder enables protein-centric analyses from transcriptomic data. (2026) PMID 42277023

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-kncc-glioblastoma-evolution.json
