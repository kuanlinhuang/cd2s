# CPTAC CCRCC Confirmatory Study - Training

Dataset id: pdc-cptac-ccrcc-confirmatory-study-training

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 61 cases
- Cancer types: Clear Cell Renal Cell Carcinoma, Non-Clear Cell Renal Cell Carcinoma
- Subject: Kidney
- Measurements: Metabolome mass spectrometry (Label Free / N/A)
- Median follow-up: 32.1 months (derivable for 51 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 93.4% informative
- Tissue or organ of origin: 93.4% informative
- Tumor grade: 93.4% informative
- Race: 91.8% informative
- Morphology (ICD-O): 88.5% informative
- Primary diagnosis: 88.5% informative
- Vital status: 85.2% informative
- AJCC pathologic stage: 85.2% informative
- Age at diagnosis: 85.2% populated (one-to-many)
- Days to last follow-up: 85.2% populated (one-to-many)
- Ethnicity: 23.0% informative
- Cause of death: 13.1% informative
- Days to death: 13.1% populated (one-to-many)
- Days to recurrence: 6.6% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000534
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000534
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000534: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-ccrcc-confirmatory-study-training.json
