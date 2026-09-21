# Ukrainian National Research Center for Radiation Medicine Trio Study

Dataset id: gdc-trio-cru

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 339 cases
- Cancer types: Not Applicable
- Subject: title derived
- Measurements: Whole genome sequencing
- Treatment response recorded: False
- Access: controlled. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- Primary diagnosis: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 0.0% informative
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
   https://portal.gdc.cancer.gov/projects/TRIO-CRU
   Policy evidence: https://portal.gdc.cancer.gov/projects/TRIO-CRU
2. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   339 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs001163.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
3. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001163
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001163
4. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
5. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 1
- 2 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 2 are kept as exemplars. Of the 1 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 0 of the 1 that could be checked were themselves NCI funded.
- Reuse gap index: +1.63 (negative means less reused than comparable datasets)
  - Evidence for a transgenerational mutational signature from ionizing radiation exposure in humans. (2025) PMID 40550869

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-trio-cru.json
