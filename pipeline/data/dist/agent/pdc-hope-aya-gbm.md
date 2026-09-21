# HOPE-AYA GBM

Dataset id: pdc-hope-aya-gbm

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 89 cases
- Cancer types: Pediatric/AYA Brain Tumors, Gliomas
- Subject: Brain and central nervous system
- Measurements: Glycoproteome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 26.8 months (derivable for 62 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Vital status: 98.9% informative
- Sex at birth (gender): 98.9% informative
- Age at diagnosis: 97.8% populated (one-to-many)
- Tissue or organ of origin: 61.8% informative
- Days to death: 50.6% populated (one-to-many)
- Cause of death: 43.8% informative
- Primary diagnosis: 34.8% informative
- Morphology (ICD-O): 27.0% informative
- Tumor grade: 27.0% informative
- Ethnicity: 25.8% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Classification of tumor: 25.8% informative
- Race: 24.7% informative
- Days to last follow-up: 19.1% populated (one-to-many)

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 3 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000499
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000499
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000499: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-hope-aya-gbm.json
