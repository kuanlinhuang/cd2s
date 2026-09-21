# CPTAC-KF-CCDI-Pediatric Brain Cancer Study - Ganglioglioma-CPC-CPP Phosphoproteome

Dataset id: pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-ganglioglioma-cpc-cpp-phosp

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 84 cases
- Cancer types: Gliomas, Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Phosphoproteome mass spectrometry (TMT18 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Morphology (ICD-O): 0.0% informative
- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 88.1% informative
- Primary diagnosis: 88.1% informative
- Tissue or organ of origin: 88.1% informative
- Vital status: 86.9% informative
- Age at diagnosis: 86.9% populated (one-to-many)
- Ethnicity: 78.6% informative
- Race: 72.6% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000701
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000701
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000701: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-kf-ccdi-pediatric-brain-cancer-study-ganglioglioma-cpc-cpp-phosp.json
