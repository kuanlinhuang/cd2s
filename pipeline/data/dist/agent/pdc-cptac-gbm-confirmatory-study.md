# CPTAC GBM Confirmatory Study

Dataset id: pdc-cptac-gbm-confirmatory-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 118 cases
- Cancer types: Glioblastoma, Gliomas, Lung Adenocarcinoma, Skin Cutaneous Melanoma, Epithelial Neoplasms, NOS, Breast Invasive Carcinoma
- Subject: pan cancer
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Glycoproteome mass spectrometry (TMT11 / DDA), Lipidome mass spectrometry (Label Free / N/A), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 14.4 months (derivable for 112 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 99.2% informative
- Morphology (ICD-O): 99.2% informative
- Primary diagnosis: 99.2% informative
- Tissue or organ of origin: 98.3% informative
- Vital status: 96.6% informative
- Days to death: 76.3% populated (one-to-many)
- Race: 70.3% informative
- AJCC pathologic stage: 0.0% informative
- Age at diagnosis: 68.6% populated (one-to-many)
- Days to last follow-up: 66.9% populated (one-to-many)
- Cause of death: 58.5% informative
- Days to recurrence: 42.4% populated (one-to-many)
- Tumor grade: 22.9% informative
- Ethnicity: 12.7% informative
- Classification of tumor: 0.0% informative
- Treatment type: 0.8% populated (one-to-many)
- Treatment outcome: 0.8% populated (one-to-many)

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 6 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000450
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000450
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000450: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-gbm-confirmatory-study.json
