# HIV+ Tumor Molecular Characterization Project - Lung Cancer

Dataset id: gdc-cgci-htmcp-lc
Summary: 39 lung cancers from an HIV-enriched cohort, two thirds Black or African American, with whole genome sequencing on every case and clinical staging on 62% - very small, and addressing a population that appears in almost no lung cancer genomics.

## Read this first: what these data CANNOT support

- 39 cases is the smallest cohort with a showcase page here. Nearly every analysis is underpowered, and no subgroup analysis is viable.
  Rules out: Discovery, Subgroup comparison, Multivariable modeling
- HIV status, CD4 count and antiretroviral history are not structured fields. Progression and last known disease status are empty for all cases.
  Rules out: HIV-stratified analysis, Progression-free survival
- Do not use for: Any statistically powered discovery analysis. (39 cases cannot support it.)
- Do not use for: Comparing HIV-positive with HIV-negative patients within the cohort. (HIV status is not a structured variable in these records.)

## What it is

- Cohort: 39 cases
- Cancer types: Neoplasms, NOS, Complex Epithelial Neoplasms, Adenomas and Adenocarcinomas, Paragangliomas and Glomus Tumors, Epithelial Neoplasms, NOS, Squamous Cell Neoplasms
- Subject: Lung
- Measurements: Whole genome sequencing, Bulk RNA sequencing, microRNA sequencing, Clinical, Copy Number Variation, Somatic Structural Variation, Whole-slide tissue images, DICOM medical imaging
- Median follow-up: 6.4 months (derivable for 36 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Race: 92.3% informative
- Prior treatment: 92.3% informative
- Prior malignancy: 92.3% informative
- Classification of tumor: 92.3% populated (one-to-many)
- Treatment type: 92.3% populated (one-to-many)
- Treatment given: 92.3% populated (one-to-many)
- Disease response at follow-up: 92.3% populated (one-to-many)
- Ethnicity: 89.7% informative
- Vital status: 89.7% informative
- Tobacco smoking status: 89.7% informative
- Synchronous malignancy: 76.9% informative
- AJCC pathologic stage: 61.5% informative
- ECOG performance status: 59.0% informative
- AJCC clinical stage: 43.6% informative

## Questions these data can support

- Does lung cancer arising in people living with HIV differ genomically from lung cancer in the general population?
  Why: Whole genome sequencing on all 39 cases, contrastable with the large TCGA lung cohorts in the same repository under the same harmonization. Whole genome rather than exome allows mutational signature and structural analysis.
  Statistical caution: 39 cases supports descriptive comparison of signature burden and recurrent alterations only. Any difference must be large to be detectable, and the comparison cohorts differ in sequencing era and platform.
  Approximate analysable n: 39
- Can this cohort serve as a validation set for HIV-associated cancer hypotheses?
  Why: Alongside the cervical and lymphoma cohorts in the same program, it allows a hypothesis about HIV-associated tumor biology to be tested across three tumor types collected under a common protocol.
  Approximate analysable n: 39
- What is the survival experience of this population?
  Why: Vital status is informative for 89.7% of cases, with follow-up derivable for 36 of 39 and extending to 104 months despite a short median of 6.4.
  Statistical caution: 35 cases with informative vital status and a 6.4-month median follow-up gives very wide confidence intervals. Report them and avoid median survival estimates.
  Approximate analysable n: 35

## How to get the data

1. Scope with the 380 open-access files (30 minutes)
   https://portal.gdc.cancer.gov/projects/CGCI-HTMCP-LC
2. Consider analyzing alongside the cervical and lymphoma HTMCP cohorts (1 hour)
   All three share a collection protocol, and together they are considerably more useful than any one alone.
3. Submit a dbGaP data access request (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Treatment response, after checking the response field is real (python, about a minute)
  workbooks/python/03_treatment_response_cervical.py

## Evidence of prior reuse

- Articles that analyzed these data: 0
- Of those, 2 were retrieved and graded individually, and the strongest 2 are kept as exemplars below. Author overlap and funding were resolved for those exemplars only: 0 of the 2 that analyzed the data had no author in common with the generating team.
  - Ribosomal DNA copy number loss and sequence variation in cancer. (2017) PMID 28640831
  - Single nucleotide polymorphism rs4961 in the adducin 1 gene is not associated with gastric cancer or preneoplastic cancer lesions. (2024) PMID 39100993

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-cgci-htmcp-lc.json
