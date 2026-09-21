# PTRC TNBC

Dataset id: pdc-ptrc-tnbc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 58 cases
- Cancer types: Breast Invasive Carcinoma
- Subject: Breast
- Measurements: Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Ethnicity: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Primary diagnosis: 0.0% informative
- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 96.6% informative
- Tissue or organ of origin: 96.6% informative
- Race: 94.8% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative
- Classification of tumor: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000409
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000409
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000409: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 3
- 5 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 5 are kept as exemplars. Of the 5 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 3 of the 5 that could be checked were themselves NCI funded.
- Reuse gap index: -1.07 (negative means less reused than comparable datasets)
  - Proteogenomic Markers of Chemotherapy Resistance and Response in Triple-Negative Breast Cancer. (2022) PMID 36001024
  - Carbonic anhydrases reduce the acidity of the tumor microenvironment, promote immune infiltration, decelerate tumor growth, and improve survival in ErbB2/HER2-enriched breast cancer. (2023) PMID 37098526
  - MGAT1-Guided complex N-Glycans on CD73 regulate immune evasion in triple-negative breast cancer. (2025) PMID 40229283
  - Proteomic-based stemness score measures oncogenic dedifferentiation and enables the identification of druggable targets. (2025) PMID 40250426
  - A Validated Proteomic Signature of Basal-like Triple-Negative Breast Cancer Subtypes Obtained from Publicly Available Data. (2025) PMID 40867231

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-ptrc-tnbc.json
