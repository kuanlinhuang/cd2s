# APOLLO-OV

Dataset id: pdc-apollo-ov

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 72 cases
- Cancer types: Epithelial Neoplasms, NOS
- Subject: Ovary and fallopian tube
- Measurements: Proteome mass spectrometry (TMT11 / DDA)
- Median follow-up: 40.8 months (derivable for 70 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Morphology (ICD-O): 0.0% informative
- Tumor grade: 0.0% informative
- Vital status: 97.2% informative
- Race: 97.2% informative
- Ethnicity: 97.2% informative
- Sex at birth (gender): 97.2% informative
- Primary diagnosis: 97.2% informative
- Tissue or organ of origin: 97.2% informative
- AJCC pathologic stage (tumor_stage): 97.2% informative
- Age at diagnosis: 97.2% populated (one-to-many)
- Days to last follow-up: 97.2% populated (one-to-many)
- Days to recurrence: 97.2% populated (one-to-many)
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000585
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000585
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000585: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-apollo-ov.json
