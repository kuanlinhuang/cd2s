# Broad Institute - Medulloblastoma

Dataset id: pdc-broad-institute-medulloblastoma

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 46 cases
- Cancer types: Pediatric/AYA Brain Tumors
- Subject: Brain and central nervous system
- Measurements: Acetylome mass spectrometry (TMT10 / DDA), Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 0.0% informative
- Tumor grade: 0.0% informative
- Primary diagnosis: 97.8% informative
- Sex at birth (gender): 95.7% informative
- Age at diagnosis: 95.7% populated (one-to-many)
- AJCC pathologic stage (tumor_stage): 93.5% informative
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
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 3 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000430
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000430
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000430: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 0
- 1 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 1 are kept as exemplars. Of the 1 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 1 that could be checked were themselves NCI funded.
- Reuse gap index: -2.44 (negative means less reused than comparable datasets)
  - Discovery of immunotherapy targets for pediatric solid and brain tumors by exon-level expression. (2024) PMID 38702309

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-broad-institute-medulloblastoma.json
