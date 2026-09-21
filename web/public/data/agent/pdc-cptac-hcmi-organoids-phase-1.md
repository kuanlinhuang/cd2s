# CPTAC-HCMI-Organoids Phase 1

Dataset id: pdc-cptac-hcmi-organoids-phase-1

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 71 cases
- Cancer types: Glioblastoma, Colon Adenocarcinoma, Pancreatic Ductal Adenocarcinoma, Pancreatic Adenocarcinoma, Rectum Adenocarcinoma
- Subject: Brain and central nervous system
- Measurements: Acetylome mass spectrometry (TMT16 / DDA), Phosphoproteome mass spectrometry (TMT16 / DDA), Proteome mass spectrometry (TMT16 / DDA), Ubiquitylome mass spectrometry (TMT16 / DDA)
- Median follow-up: 13.2 months (derivable for 69 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 98.6% informative
- Morphology (ICD-O): 98.6% informative
- Primary diagnosis: 98.6% informative
- Prior treatment: 98.6% informative
- Classification of tumor: 98.6% informative
- Tissue or organ of origin: 97.2% informative
- Days to last follow-up: 95.8% populated (one-to-many)
- Age at diagnosis: 94.4% populated (one-to-many)
- Vital status: 91.5% informative
- Prior malignancy: 84.5% informative
- Race: 78.9% informative
- Ethnicity: 69.0% informative
- Tumor grade: 46.5% informative
- AJCC pathologic stage: 46.5% informative
- Days to death: 42.3% populated (one-to-many)
- Cause of death: 39.4% informative
- AJCC clinical stage: 29.6% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 4 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000713
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000713
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000713: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-hcmi-organoids-phase-1.json
