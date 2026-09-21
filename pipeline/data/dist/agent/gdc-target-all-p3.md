# Acute Lymphoblastic Leukemia - Phase III

Dataset id: gdc-target-all-p3

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 191 cases
- Cancer types: Leukemias, NOS, Myeloid Leukemias, Not Applicable, Lymphoid Leukemias
- Subject: Lymphoid, Myeloid
- Measurements: Whole exome sequencing, microRNA sequencing, Bulk RNA sequencing, Whole genome sequencing, DNA methylation array, Clinical, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 28.9 months (derivable for 103 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 85.3% informative
- Tissue or organ of origin: 68.6% informative
- Primary diagnosis: 66.5% informative
- Morphology (ICD-O): 66.5% informative
- Classification of tumor: 58.6% informative
- Vital status: 56.0% informative
- Race: 24.6% informative
- Ethnicity: 24.1% informative
- Cause of death: 0.0% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 7.9% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TARGET-ALL-P3
   Policy evidence: https://portal.gdc.cancer.gov/projects/TARGET-ALL-P3
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   820 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   3,364 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000218.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000218
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000218
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 105
- 144 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 7 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -0.26 (negative means less reused than comparable datasets)
  - The genomic landscape of pediatric acute lymphoblastic leukemia. (2022) PMID 36050548
  - Epithelial-mesenchymal transition and its transcription factors. (2022) PMID 34708244
  - Cancer gene mutation frequencies for the U.S. population. (2021) PMID 34645806
  - The genomic basis of childhood T-lineage acute lymphoblastic leukaemia. (2024) PMID 39143224
  - Genetic mechanisms of primary chemotherapy resistance in pediatric acute myeloid leukemia. (2019) PMID 30760869

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-all-p3.json
