# Center for Cancer Genomics (CCG) Cancers of Unknown Primary Project (CUPP)

Dataset id: gdc-ccg-cupp

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 272 cases
- Cancer types: Ductal and Lobular Neoplasms, Transitional Cell Papillomas and Carcinomas, Germ Cell Neoplasms, Neoplasms, NOS, Myomatous Neoplasms, Adnexal and Skin Appendage Neoplasms
- Subject: not stated
- Measurements: Whole exome sequencing, Whole genome sequencing, Bulk RNA sequencing, microRNA sequencing, DNA methylation array, Whole-slide tissue images, Clinical, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 6.5 months (derivable for 272 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior malignancy: 100.0% informative
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Race: 97.8% informative
- Ethnicity: 97.4% informative
- Cause of death: 83.1% informative
- Prior treatment: 77.6% informative
- Tumor grade: 29.8% informative
- Country of residence: 18.8% informative
- Synchronous malignancy: 18.8% informative
- Tobacco smoking status: 18.8% informative
- ECOG performance status: 15.8% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/CCG-CUPP
   Policy evidence: https://portal.gdc.cancer.gov/projects/CCG-CUPP
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   826 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   723 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs001801.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001801
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001801
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
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-ccg-cupp.json
