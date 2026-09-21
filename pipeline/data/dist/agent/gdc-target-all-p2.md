# Acute Lymphoblastic Leukemia - Phase II

Dataset id: gdc-target-all-p2

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 1,587 cases
- Cancer types: Lymphoid Leukemias
- Subject: Lymphoid
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Whole genome sequencing, microRNA sequencing, SNP genotyping array (copy number, germline), Clinical, Somatic Structural Variation
- Median follow-up: 92.7 months (derivable for 1570 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tissue or organ of origin: 100.0% informative
- Primary diagnosis: 99.9% informative
- Morphology (ICD-O): 99.9% informative
- Sex at birth: 99.6% informative
- Vital status: 99.1% informative
- Ethnicity: 94.6% informative
- Race: 86.6% informative
- Classification of tumor: 65.2% informative
- Treatment given: 64.8% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Progression at follow-up: 13.7% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TARGET-ALL-P2
   Policy evidence: https://portal.gdc.cancer.gov/projects/TARGET-ALL-P2
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   2,408 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   15,785 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000464.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000464
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000464
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 42
- 101 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 8 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -1.29 (negative means less reused than comparable datasets)
  - Pan-cancer genome and transcriptome analyses of 1,699 paediatric leukaemias and solid tumours. (2018) PMID 29489755
  - The genomic landscape of pediatric and young adult T-lineage acute lymphoblastic leukemia. (2017) PMID 28671688
  - Transcriptional landscape of B cell precursor acute lymphoblastic leukemia based on an international study of 1,223 cases. (2018) PMID 30487223
  - The genomic basis of childhood T-lineage acute lymphoblastic leukaemia. (2024) PMID 39143224
  - Network-based systems pharmacology reveals heterogeneity in LCK and BCL2 signaling and therapeutic sensitivity of T-cell acute lymphoblastic leukemia. (2021) PMID 34151288

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-all-p2.json
