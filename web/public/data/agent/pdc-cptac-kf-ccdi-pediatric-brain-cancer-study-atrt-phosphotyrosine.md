# CPTAC-KF-CCDI-Pediatric Brain Cancer Study - ATRT Phosphotyrosine

Dataset id: pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-atrt-phosphotyrosine

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 32 cases
- Cancer types: Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Phosphoproteome mass spectrometry (TMT18 / DDA)
- Median follow-up: 30.3 months (derivable for 3 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Vital status: 87.5% informative
- Sex at birth (gender): 87.5% informative
- Primary diagnosis: 87.5% informative
- Tissue or organ of origin: 87.5% informative
- Age at diagnosis: 87.5% populated (one-to-many)
- Ethnicity: 84.4% informative
- Race: 71.9% informative
- Cause of death: 0.0% informative
- Morphology (ICD-O): 15.6% informative
- Tumor grade: 15.6% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Classification of tumor: 15.6% informative
- Days to last follow-up: 9.4% populated (one-to-many)
- Progression or recurrence: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000659
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000659
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000659: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-atrt-phosphotyrosine.json
