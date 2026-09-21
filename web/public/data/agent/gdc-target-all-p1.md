# Acute Lymphoblastic Leukemia - Phase I

Dataset id: gdc-target-all-p1

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 24 cases
- Cancer types: Lymphoid Leukemias
- Subject: Lymphoid
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Clinical, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 49.5 months (derivable for 23 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Classification of tumor: 100.0% informative
- Sex at birth: 95.8% informative
- Ethnicity: 95.8% informative
- Vital status: 95.8% informative
- Treatment given: 95.8% informative
- Race: 87.5% informative
- Progression at follow-up: 62.5% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TARGET-ALL-P1
   Policy evidence: https://portal.gdc.cancer.gov/projects/TARGET-ALL-P1
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   18 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   91 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000463.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000463
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000463
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 14
- 23 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 8 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.07 (negative means less reused than comparable datasets)
  - Pan-cancer genome and transcriptome analyses of 1,699 paediatric leukaemias and solid tumours. (2018) PMID 29489755
  - Transcriptional landscape of B cell precursor acute lymphoblastic leukemia based on an international study of 1,223 cases. (2018) PMID 30487223
  - Genomic analyses identify recurrent MEF2D fusions in acute lymphoblastic leukaemia. (2016) PMID 27824051
  - Targeted in silico characterization of fusion transcripts in tumor and normal tissues via FusionInspector. (2023) PMID 37323575
  - EBF1 and Pax5 safeguard leukemic transformation by limiting IL-7 signaling, Myc expression, and folate metabolism. (2020) PMID 33004416

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-all-p1.json
