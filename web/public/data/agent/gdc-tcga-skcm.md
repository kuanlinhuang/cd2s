# Skin Cutaneous Melanoma

Dataset id: gdc-tcga-skcm

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 470 cases
- Cancer types: Nevi and Melanomas
- Subject: Skin
- Measurements: Whole exome sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Clinical, DICOM medical imaging, Bulk RNA sequencing, Whole-slide tissue images, microRNA sequencing, Whole genome sequencing, Reverse phase protein array
- Median follow-up: 36.4 months (derivable for 461 cases)
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
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Disease response at follow-up: 100.0% populated (one-to-many)
- Prior malignancy: 99.8% informative
- Synchronous malignancy: 99.8% informative
- Race: 97.9% informative
- Ethnicity: 97.2% informative
- AJCC pathologic stage: 88.9% informative
- Progression at follow-up: 58.7% informative
- Treatment outcome: 41.9% populated (one-to-many)

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-SKCM
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-SKCM
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   11,078 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   17,703 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 724
- 108 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 1 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 2530 (attention, not reuse)
- Reuse gap index: +1.48 (negative means less reused than comparable datasets)
  - Identification and validation of prognostic genes and prognostic models associated with cutaneous melanoma and integrative stress response. (2025) PMID 41409301
  - Machine learning-based identification of an immunotherapy-related signature to enhance outcomes and immunotherapy responses in melanoma. (2024) PMID 39355255
  - Comprehensive analysis of SELPLG as a potential immunotherapy target and prognostic biomarker in oncology. (2025) PMID 40504320
  - Integrating Single-Cell and Spatial Transcriptomics Reveals NK Cell Subpopulations Associated With Immunotherapy for Melanoma. (2025) PMID 41357561
  - Circadian rhythm related genes identified through tumorigenesis and immune infiltration-guided strategies as predictors of prognosis, immunotherapy response, and candidate drugs in skin cutaneous malignant melanoma. (2025) PMID 40191195

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-skcm.json
