# CPTAC LUAD Confirmatory Study

Dataset id: pdc-cptac-luad-confirmatory-study

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 131 cases
- Cancer types: Lung Adenocarcinoma
- Subject: Lung
- Measurements: Acetylome mass spectrometry (TMT11 / DDA), Phosphoproteome mass spectrometry (TMT11 / DDA), Proteome mass spectrometry (TMT11 / DDA), Ubiquitylome mass spectrometry (TMT11 / DDA)
- Median follow-up: 18.7 months (derivable for 102 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Race: 91.6% informative
- Sex at birth (gender): 91.6% informative
- Morphology (ICD-O): 91.6% informative
- Primary diagnosis: 91.6% informative
- Tissue or organ of origin: 91.6% informative
- Tumor grade: 91.6% informative
- AJCC pathologic stage: 89.3% informative
- Age at diagnosis: 89.3% populated (one-to-many)
- Vital status: 78.6% informative
- Days to last follow-up: 78.6% populated (one-to-many)
- Ethnicity: 25.2% informative
- Days to death: 20.6% populated (one-to-many)
- Cause of death: 10.7% informative
- Days to recurrence: 3.1% populated (one-to-many)
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 4 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000491
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000491
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000491: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 2
- 3 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 3 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: -1.08 (negative means less reused than comparable datasets)
  - Integrative analysis of lung adenocarcinoma across diverse ethnicities and exposures. (2025) PMID 40749670
  - Alternate RNA decoding results in stable and abundant proteins in mammals. (2026) PMID 42343131
  - SysML: adaptive recommendation system for heterogeneous biomedical data preprocessing and modeling workflows. (2025) PMID 41115212

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-luad-confirmatory-study.json
