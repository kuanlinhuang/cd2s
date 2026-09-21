# Oral Squamous Cell Carcinoma Study

Dataset id: pdc-oral-squamous-cell-carcinoma-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 39 cases
- Cancer types: Oral Squamous Cell Carcinoma
- Subject: Head and neck
- Measurements: Proteome mass spectrometry (iTRAQ4 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Primary diagnosis: 0.0% informative
- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Classification of tumor: 0.0% informative
- Sex at birth (gender): 97.4% informative
- Tissue or organ of origin: 97.4% informative
- Vital status: 0.0% informative
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
   https://pdc.cancer.gov/pdc/study/PDC000262
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000262
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000262: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 1
- 2 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 1 are kept as exemplars. Of the 1 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 0 of the 1 that could be checked were themselves NCI funded.
- Reuse gap index: +1.34 (negative means less reused than comparable datasets)
  - Alternative splicing regulates FGGY-derived neoantigen presentation and promotes immune evasion in metabolic-associated hepatocellular carcinoma. (2026) PMID 42291265

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-oral-squamous-cell-carcinoma-study.json
