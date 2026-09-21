# Kidney Renal Papillary Cell Carcinoma

Dataset id: gdc-tcga-kirp

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 291 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Kidney
- Measurements: microRNA sequencing, DNA methylation array, Clinical, DICOM medical imaging, Whole exome sequencing, Bulk RNA sequencing, SNP genotyping array (copy number, germline), Whole-slide tissue images, Whole genome sequencing, Reverse phase protein array
- Median follow-up: 25.2 months (derivable for 290 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Prior malignancy: 100.0% informative
- Synchronous malignancy: 100.0% informative
- Classification of tumor: 100.0% populated (one-to-many)
- Disease response at follow-up: 99.3% populated (one-to-many)
- Race: 94.8% informative
- AJCC pathologic stage: 89.7% populated (one-to-many)
- Ethnicity: 87.6% informative
- Treatment type: 87.3% populated (one-to-many)
- Treatment given: 87.3% populated (one-to-many)
- Country of residence: 85.2% informative
- Tobacco smoking status: 85.2% informative
- AJCC clinical stage: 68.7% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-KIRP
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-KIRP
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   7,463 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   11,286 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 163
- 85 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 1 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 1012 (attention, not reuse)
- Reuse gap index: -0.61 (negative means less reused than comparable datasets)
  - An automated surgical decision-making framework for partial or radical nephrectomy based on 3D-CT multi-level anatomical features in renal cell carcinoma. (2023) PMID 37289245
  - A Cluster of Metabolic-Related Genes Serve as Potential Prognostic Biomarkers for Renal Cell Carcinoma. (2022) PMID 35873461
  - Spatially-resolved analyses of muscle invasive bladder cancer microenvironment unveil a distinct fibroblast cluster associated with prognosis. (2024) PMID 39759522
  - Construction and verification of a novel prognostic risk model for kidney renal clear cell carcinoma based on immunity-related genes. (2023) PMID 36741315
  - GAiN: An integrative tool utilizing generative adversarial neural networks for augmented gene expression analysis. (2024) PMID 38370125

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-kirp.json
