# USC PE-CGS: Optimizing Engagement of Hispanic Colorectal Cancer Patients in Cancer Genomic Characterization Studies

Dataset id: gdc-pecgs-copecc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 67 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Colorectal and bowel
- Measurements: Bulk RNA sequencing, Clinical, Structural Variation
- Median follow-up: 19.1 months (derivable for 18 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Progression or recurrence: 98.5% informative
- AJCC pathologic stage: 86.6% informative
- Tobacco smoking status: 73.1% informative
- Tissue or organ of origin: 62.7% informative
- Alcohol history: 59.7% informative
- Race: 53.7% informative
- Ethnicity: 52.2% informative
- AJCC clinical stage: 41.8% informative
- Vital status: 14.9% informative
- Cause of death: 10.4% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/PECGS-COPECC
   Policy evidence: https://portal.gdc.cancer.gov/projects/PECGS-COPECC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   67 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   537 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs003985.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs003985
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs003985
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

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-pecgs-copecc.json
