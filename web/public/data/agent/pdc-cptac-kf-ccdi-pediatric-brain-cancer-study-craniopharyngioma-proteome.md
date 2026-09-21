# CPTAC-KF-CCDI-Pediatric Brain Cancer Study - Craniopharyngioma Proteome

Dataset id: pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-craniopharyngioma-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 66 cases
- Cancer types: Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Proteome mass spectrometry (TMT18 / DDA)
- Median follow-up: 140.2 months (derivable for 4 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Vital status: 100.0% informative
- Sex at birth (gender): 100.0% informative
- Primary diagnosis: 100.0% informative
- Tissue or organ of origin: 100.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Age at diagnosis: 100.0% populated (one-to-many)
- Ethnicity: 84.5% informative
- Race: 70.7% informative
- Cause of death: 0.0% informative
- Morphology (ICD-O): 6.9% informative
- Tumor grade: 6.9% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Classification of tumor: 6.9% informative
- Days to last follow-up: 6.9% populated (one-to-many)
- Progression or recurrence: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000674
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000674
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000674: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-craniopharyngioma-proteome.json
