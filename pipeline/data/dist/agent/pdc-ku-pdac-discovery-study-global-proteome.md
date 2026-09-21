# KU PDAC Discovery Study - Global proteome

Dataset id: pdc-ku-pdac-discovery-study-global-proteome

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 154 cases
- Cancer types: Pancreatic Ductal Adenocarcinoma
- Subject: Pancreas
- Measurements: Proteome mass spectrometry (TMT10 / DDA)
- Median follow-up: 20.4 months (derivable for 153 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Ethnicity: 0.0% informative
- Tumor grade: 0.0% informative
- Race: 99.4% informative
- Sex at birth (gender): 99.4% informative
- Morphology (ICD-O): 99.4% informative
- Primary diagnosis: 99.4% informative
- Tissue or organ of origin: 99.4% informative
- AJCC pathologic stage (tumor_stage): 99.4% informative
- Age at diagnosis: 99.4% populated (one-to-many)
- Days to last follow-up: 99.4% populated (one-to-many)
- Days to recurrence: 99.4% populated (one-to-many)
- Vital status: 98.1% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply.
   https://pdc.cancer.gov/pdc/study/PDC000248
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000248
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000248: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 3
- 4 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 3 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 0 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: +1.60 (negative means less reused than comparable datasets)
  - Lactate dehydrogenase a is a crucial biomarker that affects the prognosis, chemotherapy effect, and immune infiltration of breast cancer. (2025) PMID 41107806
  - CAFs-derived LAM332 promotes CTCs formation and survival via ITGA3 and contributes to the metastasis of pancreatic ductal adenocarcinoma. (2026) PMID 41881953
  - MAP3K1/MAP2K4 mutations drive breast cancer progression by compensating for TP53 loss through inactivation of the JNK2-p53-FOSL1 axis. (2025) PMID 41402909

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-ku-pdac-discovery-study-global-proteome.json
