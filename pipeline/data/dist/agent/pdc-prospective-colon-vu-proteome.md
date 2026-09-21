# Prospective Colon VU Proteome

Dataset id: pdc-prospective-colon-vu-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 100 cases
- Cancer types: Colon Adenocarcinoma
- Subject: Colorectal and bowel
- Measurements: Proteome mass spectrometry (Label Free / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- AJCC clinical stage: 0.0% informative
- AJCC pathologic stage (tumor_stage): 100.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 100.0% informative
- Vital status: 0.0% informative
- Sex at birth (gender): 96.0% informative
- Morphology (ICD-O): 96.0% informative
- AJCC pathologic stage: 96.0% informative
- Classification of tumor: 0.0% informative
- Ethnicity: 95.0% informative
- Race: 94.0% informative
- Days to last follow-up: 4.0% populated (one-to-many)
- Cause of death: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000109
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000109
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000109: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 3
- 6 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 5 are kept as exemplars. Of the 5 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 5 that could be checked were themselves NCI funded.
- Reuse gap index: +1.83 (negative means less reused than comparable datasets)
  - Federated Deep Learning Enables Cancer Subtyping by Proteomics. (2025) PMID 40488620
  - Multi-Omics Characterization of E3 Regulatory Patterns in Different Cancer Types. (2024) PMID 39062881
  - Sex differences in the cancer proteome. (2026) PMID 42466117
  - The implication of non-AUG-initiated N-terminally extended proteoforms in cancer. (2025) PMID 40276932
  - Identification of microbial species and proteins associated with colorectal cancer by reanalyzing CPTAC proteomic datasets. (2025) PMID 40263502

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-prospective-colon-vu-proteome.json
