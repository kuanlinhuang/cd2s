# Rectum Adenocarcinoma

Dataset id: gdc-tcga-read

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 172 cases
- Cancer types: Adenomas and Adenocarcinomas, Cystic, Mucinous and Serous Neoplasms
- Subject: Colorectal and bowel
- Measurements: Clinical, Whole-slide tissue images, DICOM medical imaging, Whole exome sequencing, Bulk RNA sequencing, SNP genotyping array (copy number, germline), DNA methylation array, microRNA sequencing, Whole genome sequencing, Reverse phase protein array
- Median follow-up: 20.0 months (derivable for 170 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Sex at birth: 98.8% informative
- Vital status: 98.8% informative
- Prior malignancy: 98.3% informative
- Synchronous malignancy: 98.3% informative
- AJCC pathologic stage: 93.6% informative
- Disease response at follow-up: 93.6% populated (one-to-many)
- Treatment type: 88.4% populated (one-to-many)
- Treatment given: 88.4% populated (one-to-many)
- Country of residence: 87.2% informative
- Race: 51.7% informative
- Ethnicity: 48.8% informative
- Therapeutic agents: 44.8% populated (one-to-many)
- Treatment outcome: 32.0% populated (one-to-many)

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-READ
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-READ
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   4,377 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   6,010 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000178
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000178
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 482
- 113 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 0 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 6963 (attention, not reuse)
- Reuse gap index: +2.10 (negative means less reused than comparable datasets)
  - Deep multimodal fusion of patho-radiomic and clinical data for enhanced survival prediction for colorectal cancer patients. (2025) PMID 41350716
  - Multidimensional analysis of the impact of Gemmatimonas, Rhodothermus, and Sutterella on drug and treatment response in colorectal cancer. (2024) PMID 39439901
  - Tumor mutational burden predicts neoantigen profiles and immunotherapy response in microsatellite stable tumors across different cancer types. (2025) PMID 41583482
  - Integrative Analysis of miR-21, PTEN, and Immune Signatures in Colorectal Cancer. (2025) PMID 41465544
  - Whole slide image based prognosis prediction in rectal cancer using unsupervised artificial intelligence. (2024) PMID 39696090

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-read.json
