# Sarcoma

Dataset id: gdc-tcga-sarc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 261 cases
- Cancer types: Lipomatous Neoplasms, Fibromatous Neoplasms, Synovial-like Neoplasms, Myomatous Neoplasms, Nerve Sheath Tumors, Soft Tissue Tumors and Sarcomas, NOS
- Subject: Soft tissue
- Measurements: SNP genotyping array (copy number, germline), DNA methylation array, Whole-slide tissue images, Clinical, DICOM medical imaging, Bulk RNA sequencing, microRNA sequencing, Whole exome sequencing, Whole genome sequencing, Reverse phase protein array
- Median follow-up: 30.8 months (derivable for 261 cases)
- Treatment response recorded: False
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
- Disease response at follow-up: 99.6% populated (one-to-many)
- Prior malignancy: 99.2% informative
- Synchronous malignancy: 99.2% informative
- Race: 96.6% informative
- Ethnicity: 87.4% informative
- Progression at follow-up: 46.0% informative
- Treatment type: 13.8% informative
- Treatment given: 11.9% informative
- AJCC pathologic stage: 2.3% informative
- Cause of death: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-SARC
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-SARC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   6,613 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   9,791 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 192
- 83 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 2 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 891 (attention, not reuse)
- Reuse gap index: +0.81 (negative means less reused than comparable datasets)
  - Oncogene-induced matrix reorganization controls CD8+ T cell function in the soft-tissue sarcoma microenvironment. (2024) PMID 38652549
  - Identifying specific TLS-associated genes as potential biomarkers for predicting prognosis and evaluating the efficacy of immunotherapy in soft tissue sarcoma. (2024) PMID 38720884
  - Integration of ubiquitination-related genes in predictive signatures for prognosis and immunotherapy response in sarcoma. (2024) PMID 39469643
  - MO-GCAN: multi-omics integration based on graph convolutional and attention networks. (2025) PMID 40692180
  - A web-based calculator for predicting the prognosis of patients with sarcoma on the basis of antioxidant gene signatures. (2022) PMID 35143416

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-sarc.json
