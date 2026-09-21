# TCGA Ovarian PNNL Phosphoproteome Velos Qexactive

Dataset id: pdc-tcga-ovarian-pnnl-phosphoproteome-velos-qexactive

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 70 cases
- Cancer types: Ovarian Serous Cystadenocarcinoma
- Subject: Ovary and fallopian tube
- Measurements: Phosphoproteome mass spectrometry (iTRAQ4 / DDA)
- Median follow-up: 42.0 months (derivable for 69 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Prior malignancy: 0.0% informative
- Vital status: 98.6% informative
- Sex at birth (gender): 98.6% informative
- Morphology (ICD-O): 98.6% informative
- Primary diagnosis: 98.6% informative
- Tissue or organ of origin: 98.6% informative
- Prior treatment: 98.6% informative
- Classification of tumor: 0.0% informative
- Age at diagnosis: 98.6% populated (one-to-many)
- Race: 94.3% informative
- Days to last follow-up: 94.3% populated (one-to-many)
- Days to death: 77.1% populated (one-to-many)
- Ethnicity: 38.6% informative
- Cause of death: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000115
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000115
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000115: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 1
- Reuse gap index: +1.03 (negative means less reused than comparable datasets)

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-tcga-ovarian-pnnl-phosphoproteome-velos-qexactive.json
