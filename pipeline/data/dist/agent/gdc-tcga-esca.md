# Esophageal Carcinoma

Dataset id: gdc-tcga-esca

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 185 cases
- Cancer types: Adenomas and Adenocarcinomas, Cystic, Mucinous and Serous Neoplasms, Squamous Cell Neoplasms
- Subject: Esophagus and stomach
- Measurements: SNP genotyping array (copy number, germline), DNA methylation array, Clinical, DICOM medical imaging, Whole exome sequencing, microRNA sequencing, Bulk RNA sequencing, Whole-slide tissue images, Reverse phase protein array, Whole genome sequencing
- Median follow-up: 13.1 months (derivable for 185 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Country of residence: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Tumor grade: 100.0% informative
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Disease response at follow-up: 100.0% populated (one-to-many)
- Treatment type: 99.5% populated (one-to-many)
- Treatment given: 99.5% populated (one-to-many)
- Prior malignancy: 98.9% informative
- Synchronous malignancy: 98.9% informative
- Tobacco smoking status: 89.7% informative
- Race: 89.2% informative
- AJCC pathologic stage: 87.6% informative
- Alcohol history: 62.7% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-ESCA
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-ESCA
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   4,647 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   6,523 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 308
- 93 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 0 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 1428 (attention, not reuse)
- Reuse gap index: +1.47 (negative means less reused than comparable datasets)
  - Single-cell RNA sequencing reveals adrb1 as a sympathetic nerve-regulated immune checkpoint driving T cell exhaustion and impacting immunotherapy in esophageal squamous cell carcinoma. (2025) PMID 40406147
  - Extracellular vesicle-LncRNA HOTAIR modulates esophageal cancer chemoresistance and immune microenvironment via miR-375/CDH2 pathway. (2025) PMID 40235720
  - The potential of MCM8 as a biomarker in esophageal carcinoma: a comprehensive analysis integrating m6a methylation and angiogenesis. (2025) PMID 40346692
  - Identification and Characterization of Oxidative Stress and Endoplasmic Reticulum Stress-Related Genes in Esophageal Cancer. (2025) PMID 40302812
  - Identification of esophageal cancer tumor antigens and immune subtypes for guiding vaccine development. (2025) PMID 40529738

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-esca.json
