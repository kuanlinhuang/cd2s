# Lung Squamous Cell Carcinoma

Dataset id: gdc-tcga-lusc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 504 cases
- Cancer types: Adenomas and Adenocarcinomas, Squamous Cell Neoplasms
- Subject: Lung
- Measurements: SNP genotyping array (copy number, germline), Clinical, DICOM medical imaging, DNA methylation array, Whole exome sequencing, Bulk RNA sequencing, Whole-slide tissue images, microRNA sequencing, Whole genome sequencing, Reverse phase protein array
- Median follow-up: 21.7 months (derivable for 499 cases)
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
- Prior malignancy: 99.8% informative
- Synchronous malignancy: 99.8% informative
- AJCC pathologic stage: 99.2% informative
- Tobacco smoking status: 97.6% informative
- Disease response at follow-up: 92.1% populated (one-to-many)
- Treatment type: 91.9% populated (one-to-many)
- Treatment given: 91.9% populated (one-to-many)
- Race: 77.6% informative
- Ethnicity: 64.9% informative
- ECOG performance status: 53.6% populated (one-to-many)

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-LUSC
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-LUSC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   13,139 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   19,265 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 643
- 115 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 1 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 3276 (attention, not reuse)
- Reuse gap index: +1.06 (negative means less reused than comparable datasets)
  - A robust machine learning model based on ribosomal-subunit-derived piRNAs for diagnostic potential of nonsmall cell lung cancer across multicentre, large-scale of sequencing data. (2025) PMID 40714929
  - Machine learning constructs a ferroptosis related signature for predicting prognosis and drug sensitivity in lung cancer. (2025) PMID 41123817
  - Multi-omics analysis untangles the crosstalk between intratumor microbiome, lactic acid metabolism and immune status in lung squamous cell carcinoma. (2025) PMID 40568577
  - Integrative machine learning model for subtype identification and prognostic prediction in lung squamous cell carcinoma. (2025) PMID 40410522
  - Thioredoxin: a key factor in cold tumor formation and a promising biomarker for immunotherapy resistance in NSCLC. (2025) PMID 40349025

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-lusc.json
