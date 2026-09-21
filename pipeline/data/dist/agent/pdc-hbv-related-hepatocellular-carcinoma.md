# HBV-Related Hepatocellular Carcinoma

Dataset id: pdc-hbv-related-hepatocellular-carcinoma

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 171 cases
- Cancer types: Hepatocellular Carcinoma
- Subject: Liver
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
- Race: 93.6% informative
- Sex at birth (gender): 93.6% informative
- Tissue or organ of origin: 93.6% informative
- Classification of tumor: 93.6% informative
- Age at diagnosis: 93.6% populated (one-to-many)
- Vital status: 88.3% informative
- Days to recurrence: 88.3% populated (one-to-many)
- Cause of death: 6.4% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000199
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000199
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000199: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 27
- 40 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: +1.15 (negative means less reused than comparable datasets)
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - Oxidative stress induces extracellular vesicle release by upregulation of HEXB to facilitate tumour growth in experimental hepatocellular carcinoma. (2024) PMID 38944674
  - Integrative multiomics evaluation reveals the importance of pseudouridine synthases in hepatocellular carcinoma. (2022) PMID 36437949
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - The cryptic lncRNA-encoded microprotein TPM3P9 drives oncogenic RNA splicing and tumorigenesis. (2025) PMID 39865075

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-hbv-related-hepatocellular-carcinoma.json
