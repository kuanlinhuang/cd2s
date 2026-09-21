# Ovarian Serous Cystadenocarcinoma

Dataset id: gdc-tcga-ov

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 608 cases
- Cancer types: Not Reported, Cystic, Mucinous and Serous Neoplasms
- Subject: Ovary and fallopian tube
- Measurements: Clinical, DNA methylation array, SNP genotyping array (copy number, germline), DICOM medical imaging, microRNA sequencing, Whole exome sequencing, Bulk RNA sequencing, Reverse phase protein array, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 32.7 months (derivable for 584 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 96.5% informative
- Primary diagnosis: 96.5% populated (one-to-many)
- Morphology (ICD-O): 96.5% populated (one-to-many)
- Tissue or organ of origin: 96.5% populated (one-to-many)
- Prior treatment: 96.5% populated (one-to-many)
- Classification of tumor: 96.5% populated (one-to-many)
- Vital status: 96.2% informative
- Tumor grade: 95.9% informative
- Treatment type: 95.2% populated (one-to-many)
- Treatment given: 95.2% populated (one-to-many)
- Race: 91.4% informative
- Therapeutic agents: 86.7% populated (one-to-many)
- Disease response at follow-up: 86.0% populated (one-to-many)
- Progression at follow-up: 60.7% informative
- Ethnicity: 57.6% informative
- ECOG performance status: 20.7% informative
- Treatment outcome: 7.1% informative
- Population group: 3.9% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-OV
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-OV
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   14,519 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   18,372 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 641
- 110 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 9 of the 10 that could be checked had no author in common with the generating team, and 0 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 6322 (attention, not reuse)
- Reuse gap index: +0.97 (negative means less reused than comparable datasets)
  - Identification of three subtypes of ovarian cancer and construction of prognostic models based on immune-related genes. (2024) PMID 39434163
  - Tumor-infiltrating B cell-related lncRNA crosstalk reveals clinical outcomes and tumor immune microenvironment in ovarian cancer based on single-cell and bulk RNA-sequencing. (2024) PMID 39559246
  - Learning to Train and to Explain a Deep Survival Model with Large-Scale Ovarian Cancer Transcriptomic Data. (2024) PMID 39767787
  - Global DNA methylation signatures associated with chemoresistance and poor prognosis of high grade serous ovarian cancer. (2025) PMID 41125735
  - Analysis of m7G-related signatures in the tumor immune microenvironment and identification of clinical prognostic regulators in ovarian cancer. (2025) PMID 40895564

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-ov.json
