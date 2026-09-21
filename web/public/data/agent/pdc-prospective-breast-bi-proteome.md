# Prospective Breast BI Proteome

Dataset id: pdc-prospective-breast-bi-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 127 cases
- Cancer types: Breast Invasive Carcinoma
- Subject: Breast
- Measurements: Proteome mass spectrometry (TMT10 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- Tumor grade: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Classification of tumor: 0.0% informative
- Tissue or organ of origin: 97.6% informative
- Prior malignancy: 93.7% informative
- Age at diagnosis: 92.9% populated (one-to-many)
- Race: 92.1% informative
- Days to last follow-up: 91.3% populated (one-to-many)
- Days to recurrence: 91.3% populated (one-to-many)
- Primary diagnosis: 89.0% informative
- AJCC pathologic stage (tumor_stage): 89.0% informative
- Sex at birth (gender): 88.2% informative
- Morphology (ICD-O): 86.6% informative
- AJCC pathologic stage: 86.6% informative
- Ethnicity: 84.3% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000120
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000120
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000120: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 19
- 29 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: +1.00 (negative means less reused than comparable datasets)
  - Proteogenomic Landscape of Breast Cancer Tumorigenesis and Targeted Therapy. (2020) PMID 33212010
  - Carbonic anhydrases reduce the acidity of the tumor microenvironment, promote immune infiltration, decelerate tumor growth, and improve survival in ErbB2/HER2-enriched breast cancer. (2023) PMID 37098526
  - Soluble POSTN is a novel biomarker complementing CA153 and CEA for breast cancer diagnosis and metastasis prediction. (2022) PMID 35831854
  - METTL14 suppresses the expression of YAP1 and the stemness of triple-negative breast cancer. (2024) PMID 39563370
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-prospective-breast-bi-proteome.json
