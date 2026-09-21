# Academia Sinica LUAD100

Dataset id: pdc-academia-sinica-luad100

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 110 cases
- Cancer types: Lung Adenocarcinoma, Lung Squamous Cell Carcinoma
- Subject: Lung
- Measurements: Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Classification of tumor: 100.0% informative
- Sex at birth (gender): 95.5% informative
- Age at diagnosis: 94.5% populated (one-to-many)
- Primary diagnosis: 93.6% informative
- AJCC pathologic stage (tumor_stage): 93.6% informative
- Cause of death: 0.0% informative
- Vital status: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000220
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000220
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000220: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 10
- 16 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 2 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.42 (negative means less reused than comparable datasets)
  - Integrative analysis of lung adenocarcinoma across diverse ethnicities and exposures. (2025) PMID 40749670
  - Identification of HMGB2 associated with proliferation, invasion and prognosis in lung adenocarcinoma via weighted gene co-expression network analysis. (2022) PMID 35962344
  - A multiomic investigation of lung adenocarcinoma molecular subtypes. (2024) PMID 37991388
  - Proteomic-based stemness score measures oncogenic dedifferentiation and enables the identification of druggable targets. (2025) PMID 40250426
  - Deciphering key roles of B cells in prognostication and tailored therapeutic strategies for lung adenocarcinoma: a multi-omics and machine learning approach towards predictive, preventive, and personalized treatment strategies. (2025) PMID 39991096

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-academia-sinica-luad100.json
