# Philadelphia-Negative Neutrophilic Leukemias (CNL/aCML/MDS/MPNu)

Dataset id: gdc-ohsu-cnl

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 176 cases
- Cancer types: Chronic Myeloproliferative Disorders
- Subject: Myeloid
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Structural Variation
- Median follow-up: 19.1 months (derivable for 118 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Primary diagnosis: 70.5% informative
- Morphology (ICD-O): 70.5% informative
- Sex at birth: 64.2% informative
- Vital status: 35.2% informative
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
   https://portal.gdc.cancer.gov/projects/OHSU-CNL
   Policy evidence: https://portal.gdc.cancer.gov/projects/OHSU-CNL
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   80 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   1,548 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs001799.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001799
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001799
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 1
- 4 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 4 are kept as exemplars. Of the 4 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 4 that could be checked were themselves NCI funded.
- Reuse gap index: -2.15 (negative means less reused than comparable datasets)
  - Genomic landscape of neutrophilic leukemias of ambiguous diagnosis. (2019) PMID 31366621
  - B7H6 is the predominant activating ligand driving natural killer cell-mediated killing in patients with liquid tumours: evidence from clinical, in silico, in vitro, and in vivo studies. (2024) PMID 39579618
  - Transcriptomic signature can distinguish chronic neutrophilic leukemia from ambiguous neutrophilic leukemias. (2025) PMID 40255485
  - Identification of a Novel miR-122-5p/CDC25A Axis and Potential Therapeutic Targets for Chronic Myeloid Leukemia. (2025) PMID 41373559

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-ohsu-cnl.json
