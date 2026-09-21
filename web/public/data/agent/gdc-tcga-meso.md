# Mesothelioma

Dataset id: gdc-tcga-meso

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 87 cases
- Cancer types: Mesothelial Neoplasms
- Subject: Pleura
- Measurements: Bulk RNA sequencing, microRNA sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Whole-slide tissue images, Clinical, DICOM medical imaging, Whole exome sequencing, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 17.3 months (derivable for 85 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 100.0% informative
- Vital status: 100.0% informative
- Country of residence: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- AJCC pathologic stage: 100.0% informative
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Prior malignancy: 94.3% informative
- Synchronous malignancy: 94.3% informative
- Ethnicity: 83.9% informative
- Treatment outcome: 74.7% populated (one-to-many)
- Disease response at follow-up: 74.7% informative
- Therapeutic agents: 73.6% populated (one-to-many)

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-MESO
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-MESO
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   2,183 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   3,362 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 67
- 71 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 9 of the 10 that could be checked had no author in common with the generating team, and 2 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 521 (attention, not reuse)
- Reuse gap index: -0.03 (negative means less reused than comparable datasets)
  - Identification of cancer-associated fibroblasts subtypes in prostate cancer. (2023) PMID 37033924
  - Single-Cell View of Tumor Microenvironment Gradients in Pleural Mesothelioma. (2024) PMID 38959428
  - Genomic and transcriptomic analyses identify a prognostic gene signature and predict response to therapy in pleural and peritoneal mesothelioma. (2023) PMID 36773602
  - An integrative analysis reveals cancer risk associated with artificial sweeteners. (2025) PMID 39780215
  - Epigenetic Silencing of <i>LRP2</i> Is Associated with Dedifferentiation and Poor Survival in Multiple Solid Tumor Types. (2023) PMID 36980716

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-meso.json
