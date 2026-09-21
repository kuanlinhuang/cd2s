# Functional Genomic Landscape of Acute Myeloid Leukemia

Dataset id: gdc-beataml1.0-cohort

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 826 cases
- Cancer types: Myeloid Leukemias, Leukemias, NOS, Unknown, Chronic Myeloproliferative Disorders, Plasma Cell Tumors, Myelodysplastic Syndromes
- Subject: Myeloid
- Measurements: Whole exome sequencing, Targeted DNA panel sequencing, Bulk RNA sequencing, Single-cell RNA sequencing, Structural Variation
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Last known disease status: 0.0% informative
- Sex at birth: 97.1% informative
- Primary diagnosis: 95.8% informative
- Morphology (ICD-O): 95.8% informative
- Progression or recurrence: 95.3% informative
- Vital status: 84.9% informative
- Race: 64.0% informative
- Ethnicity: 53.9% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/BEATAML1.0-COHORT
   Policy evidence: https://portal.gdc.cancer.gov/projects/BEATAML1.0-COHORT
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   1,276 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   15,518 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs001657.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001657
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001657
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 22
- 47 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 5 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 1161 (attention, not reuse)
- Reuse gap index: -0.82 (negative means less reused than comparable datasets)
  - Characteristics and prognostic impact of IDH mutations in AML: a COG, SWOG, and ECOG analysis. (2023) PMID 37267439
  - Acute Myeloid Leukemia iPSCs Reveal a Role for RUNX1 in the Maintenance of Human Leukemia Stem Cells. (2020) PMID 32492433
  - Cohesin regulates alternative splicing. (2023) PMID 36857449
  - Procrustes is a machine-learning approach that removes cross-platform batch effects from clinical RNA sequencing data. (2024) PMID 38555407
  - Genetic Ancestry Inference from Cancer-Derived Molecular Data across Genomic and Transcriptomic Platforms. (2023) PMID 36351074

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-beataml1.0-cohort.json
