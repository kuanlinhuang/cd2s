# Count Me In (CMI): The Angiosarcoma (ASC) Project

Dataset id: gdc-cmi-asc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 36 cases
- Cancer types: Soft Tissue Tumors and Sarcomas, NOS
- Subject: Soft tissue
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Clinical, Structural Variation
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 0.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Race: 94.4% informative
- Ethnicity: 94.4% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/CMI-ASC
   Policy evidence: https://portal.gdc.cancer.gov/projects/CMI-ASC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   56 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   750 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs001931.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001931
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001931
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 0
- 5 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 4 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 0 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: -2.11 (negative means less reused than comparable datasets)
  - Tracking of stem cells in vivo for cardiovascular applications. (2014) PMID 24406054
  - The Key Gene Expression Patterns and Prognostic Factors in Malignant Transformation from Enchondroma to Chondrosarcoma. (2021) PMID 34568022
  - [Current management of acute pediatric rhinosinusitis in France]. (2007) PMID 17317063

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-cmi-asc.json
