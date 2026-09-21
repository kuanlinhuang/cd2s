# NCC iCC

Dataset id: pdc-ncc-icc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 106 cases
- Cancer types: Cholangiocarcinoma, Hepatocellular Carcinoma
- Subject: Biliary tract, Liver
- Measurements: Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA)
- Median follow-up: 21.0 months (derivable for 104 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Race: 98.1% informative
- Ethnicity: 98.1% informative
- Sex at birth (gender): 98.1% informative
- Morphology (ICD-O): 98.1% informative
- Tissue or organ of origin: 98.1% informative
- Tumor grade: 98.1% informative
- Age at diagnosis: 98.1% populated (one-to-many)
- Days to last follow-up: 98.1% populated (one-to-many)
- Days to recurrence: 98.1% populated (one-to-many)
- Primary diagnosis: 97.2% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

1. Open the study in the PDC portal [human] (5 minutes)
   Proteomic data are released open; the portal's use guidelines still apply. This record spans 2 PDC studies; repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000363
   Policy evidence: https://pdc.cancer.gov/pdc/study/PDC000363
2. Accept the data use guidelines and download [human] (minutes to hours, by study size)
   The portal asks for acknowledgement and citation, not a data access request.
   https://pdc.cancer.gov/pdc/data-use-guidelines
   Policy evidence: https://pdc.cancer.gov/pdc/data-use-guidelines
3. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000363: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Evidence of prior reuse

- Articles that analyzed these data: 2
- 3 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 3 are kept as exemplars. Of the 3 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 1 of the 3 that could be checked were themselves NCI funded.
- Reuse gap index: +0.35 (negative means less reused than comparable datasets)
  - Proteomic-based stemness score measures oncogenic dedifferentiation and enables the identification of druggable targets. (2025) PMID 40250426
  - An SLCO2B1 mRNA Isoform Acts as a Noncoding RNA to Drive Cancer Progression by Triggering Protein Biosynthesis. (2026) PMID 41886603
  - Automated sparse feature selection in high-dimensional proteomics data via 1-bit compressed sensing and K-Medoids clustering. (2025) PMID 40597613

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-ncc-icc.json
