# APOLLO1: Proteogenomic characterization of lung adenocarcinoma

Dataset id: gdc-apollo-luad

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 87 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Lung
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 50.4 months (derivable for 86 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 100.0% informative
- Ethnicity: 0.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 100.0% informative
- Tobacco smoking status: 100.0% informative
- AJCC pathologic stage: 97.7% informative
- Treatment type: 58.6% populated (one-to-many)
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/APOLLO-LUAD
   Policy evidence: https://portal.gdc.cancer.gov/projects/APOLLO-LUAD
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   340 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   1,805 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs003011.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs003011
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs003011
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 2
- 7 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 6 are kept as exemplars. Of the 6 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 3 of the 6 that could be checked were themselves NCI funded.
- Reuse gap index: -0.54 (negative means less reused than comparable datasets)
  - Amplified dosage of the NKX2-1 lineage transcription factor controls its oncogenic role in lung adenocarcinoma. (2025) PMID 40139189
  - Morphological basis of the lung adenocarcinoma subtypes. (2024) PMID 38706836
  - Multi-omics protein signaling networks identify sex-specific therapeutic candidates in lung adenocarcinoma. (2025) PMID 41024254
  - Single nucleotide polymorphism rs4961 in the adducin 1 gene is not associated with gastric cancer or preneoplastic cancer lesions. (2024) PMID 39100993
  - Global impact of somatic structural variation on the cancer proteome. (2023) PMID 37704602

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-apollo-luad.json
