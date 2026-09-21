# Neuroblastoma

Dataset id: gdc-target-nbl

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 1,132 cases
- Cancer types: Not Applicable, Neuroepitheliomatous Neoplasms
- Subject: Peripheral nervous system
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Whole exome sequencing, Targeted DNA panel sequencing, DNA methylation array, Clinical, Structural Variation
- Median follow-up: 74.6 months (derivable for 1116 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 98.9% informative
- Primary diagnosis: 98.9% informative
- Morphology (ICD-O): 98.9% informative
- Vital status: 98.6% informative
- Ethnicity: 89.7% informative
- Race: 88.4% informative
- Tissue or organ of origin: 87.1% informative
- Classification of tumor: 74.4% informative
- Treatment given: 74.2% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TARGET-NBL
   Policy evidence: https://portal.gdc.cancer.gov/projects/TARGET-NBL
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   1,568 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   11,957 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000467.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000467
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000467
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 49
- 109 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 8 of the 10 that could be checked had no author in common with the generating team, and 8 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 989 (attention, not reuse)
- Reuse gap index: -3.20 (negative means less reused than comparable datasets)
  - Pan-cancer genome and transcriptome analyses of 1,699 paediatric leukaemias and solid tumours. (2018) PMID 29489755
  - ONECUT2 is a driver of neuroendocrine prostate cancer. (2019) PMID 30655535
  - <i>MYC</i> Drives a Subset of High-Risk Pediatric Neuroblastomas and Is Activated through Mechanisms Including Enhancer Hijacking and Focal Enhancer Amplification. (2018) PMID 29284669
  - Molecular mechanisms and therapeutic significance of Tryptophan Metabolism and signaling in cancer. (2024) PMID 39472902
  - Altered RNA editing in 3' UTR perturbs microRNA-mediated regulation of oncogenes and tumor-suppressors. (2016) PMID 26980570

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-nbl.json
