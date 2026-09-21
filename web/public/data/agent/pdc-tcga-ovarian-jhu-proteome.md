# TCGA Ovarian JHU Proteome

Dataset id: pdc-tcga-ovarian-jhu-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 124 cases
- Cancer types: Ovarian Serous Cystadenocarcinoma
- Subject: Ovary and fallopian tube
- Measurements: Proteome mass spectrometry (iTRAQ4 / DDA)
- Median follow-up: 29.9 months (derivable for 122 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Prior malignancy: 0.0% informative
- Vital status: 98.4% informative
- Sex at birth (gender): 98.4% informative
- Morphology (ICD-O): 98.4% informative
- Primary diagnosis: 98.4% informative
- Tissue or organ of origin: 98.4% informative
- Prior treatment: 98.4% informative
- Classification of tumor: 0.0% informative
- Age at diagnosis: 95.2% populated (one-to-many)
- Days to last follow-up: 95.2% populated (one-to-many)
- Race: 91.1% informative
- Days to death: 61.3% populated (one-to-many)
- Ethnicity: 46.8% informative
- Cause of death: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000113
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000113
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000113: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 6
- 8 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 7 are kept as exemplars. Of the 6 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 2 of the 6 that could be checked were themselves NCI funded.
- Reuse gap index: +0.37 (negative means less reused than comparable datasets)
  - Automated imaging and identification of proteoforms directly from ovarian cancer tissue. (2023) PMID 37838706
  - Model Cell Lines and Tissues of Different HGSOC Subtypes Differ in Local Estrogen Biosynthesis. (2022) PMID 35681563
  - Machine Learning-Enhanced Extraction of Biomarkers for High-Grade Serous Ovarian Cancer from Proteomics Data. (2024) PMID 38918474
  - Inflammation-related citrullination of matrisome proteins in human cancer. (2022) PMID 36531007
  - Mutation impact on mRNA versus protein expression across human cancers. (2025) PMID 39775839

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-tcga-ovarian-jhu-proteome.json
