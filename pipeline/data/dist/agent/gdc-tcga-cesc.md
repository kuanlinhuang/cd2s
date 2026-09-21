# Cervical Squamous Cell Carcinoma and Endocervical Adenocarcinoma

Dataset id: gdc-tcga-cesc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 307 cases
- Cancer types: Adenomas and Adenocarcinomas, Cystic, Mucinous and Serous Neoplasms, Complex Epithelial Neoplasms, Squamous Cell Neoplasms
- Subject: Cervix, Ovary and fallopian tube
- Measurements: microRNA sequencing, DNA methylation array, Clinical, DICOM medical imaging, Whole-slide tissue images, Whole exome sequencing, Bulk RNA sequencing, SNP genotyping array (copy number, germline), Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 21.0 months (derivable for 307 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 99.7% populated (one-to-many)
- Disease response at follow-up: 99.3% populated (one-to-many)
- Primary diagnosis: 98.4% informative
- Morphology (ICD-O): 98.4% informative
- Country of residence: 98.0% informative
- Prior malignancy: 98.0% informative
- Synchronous malignancy: 98.0% informative
- Tumor grade: 97.4% informative
- Race: 88.3% informative
- Tobacco smoking status: 85.7% informative
- ECOG performance status: 67.8% populated (one-to-many)
- Ethnicity: 63.5% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-CESC
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-CESC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   7,478 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   12,042 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 416
- 96 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 0 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 1245 (attention, not reuse)
- Reuse gap index: +0.91 (negative means less reused than comparable datasets)
  - Adenosinergic Signalling in Cervical Cancer Microenvironment. (2025) PMID 39762204
  - Prediction of the Prognosis and Treatment Responses Based on the Characteristics of Disulfidptosis-Related Genes in Patients with Cervical Squamous Cell Carcinoma and Endocervical Adenocarcinoma (2026) PMID 39945255
  - Exploration and validation of the prognostic value of mitophagy and mitochondrial dynamics-related genes in cervical cancer. (2025) PMID 40640353
  - Identification of N6-methyladenosine-associated ferroptosis biomarkers in cervical cancer. (2025) PMID 40197384
  - Development of a Mitochondrial Permeability Transition-Driven Necrosis-Related Prognostic Signature in Cervical Cancer: Integrating Bulk Transcriptomic and Single-Cell Data. (2025) PMID 40747615

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-cesc.json
