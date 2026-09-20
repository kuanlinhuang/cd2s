# Acute Myeloid Leukemia

Dataset id: gdc-target-aml
Summary: 2,492 children and young adults with acute myeloid leukaemia - the largest paediatric cancer genomics cohort in this corpus, with 3.5 years of median follow-up and therapeutic agents recorded for 35% of cases.

## Read this first: what these data CANNOT support

- Progression or recurrence is populated for 0.3% of cases and informative for none, and cause of death is absent entirely. Relapse - the central clinical event in paediatric AML - cannot be modeled from these records.
  Rules out: Relapse-free survival, Competing-risk analysis, Relapse biology
- Do not use for: Relapse or event-free survival analysis. (Progression and recurrence fields are effectively empty.)
- Do not use for: Assuming molecular coverage is uniform across the cohort. (Whole genome sequencing covers 227 of 2,492 cases; an analysis specified as "TARGET-AML whole genomes" is working with under a tenth of the cohort.)

## What it is

- Cohort: 2,492 cases
- Cancer types: Myeloid Leukemias, Not Applicable
- Subject: Myeloid
- Measurements: Bulk RNA sequencing, microRNA sequencing, Whole genome sequencing, Whole exome sequencing, Targeted DNA panel sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Clinical, Somatic Structural Variation
- Median follow-up: 41.7 months (derivable for 2158 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 87.8% informative
- Morphology (ICD-O): 87.8% informative
- Tissue or organ of origin: 87.8% informative
- Classification of tumor: 87.5% informative
- Sex at birth: 86.6% informative
- Vital status: 86.6% informative
- Treatment type: 86.3% populated (one-to-many)
- Treatment given: 86.3% populated (one-to-many)
- Treatment outcome: 85.0% populated (one-to-many)
- Ethnicity: 83.4% informative
- Race: 78.0% informative
- Therapeutic agents: 35.2% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative

## Questions these data can support

- How does the genomic landscape of paediatric AML differ from adult AML?
  Why: 2,281 RNA-sequenced paediatric cases can be contrasted directly with adult AML cohorts, and the marker paper established that the differences are substantial and age-dependent. This remains the definitive paediatric comparison set.
  Statistical caution: Adult comparison cohorts differ in platform and processing; model batch explicitly.
  Approximate analysable n: 2281
- Which molecular features predict survival in paediatric AML?
  Why: Vital status informative for 86.6% of 2,492 cases with median follow-up of 41.7 months gives a well-powered survival cohort, and therapeutic agents are recorded for 35% so treatment can be partially controlled.
  Statistical caution: Cause of death is not recorded, so competing risks from treatment-related mortality cannot be separated from disease death.
  Approximate analysable n: 2159
- Are there racial differences in paediatric AML biology or outcome?
  Why: 251 Black or African American patients alongside 1,551 white patients is one of the better-powered settings in this corpus for a race-stratified comparison in a paediatric cancer.
  Statistical caution: Race is self-reported; genetic ancestry from germline data is the more defensible variable for biological claims. Treatment differences may confound outcome comparisons.
  Approximate analysable n: 1802

## How to get the data

1. Scope with open derived expression files (1 hour)
   https://portal.gdc.cancer.gov/projects/TARGET-AML
2. Check per-layer coverage before designing a multi-omic analysis (30 minutes)
   The assay table on this page shows how sharply coverage drops beyond RNA sequencing.
3. Submit a dbGaP data access request (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Evidence of prior reuse

- Articles that analyzed these data: 137
- Of those, 129 were retrieved and graded individually; 3 had no author in common with the generating team and 9 were themselves NCI funded.
- Citations to the dataset's publication: 695 (attention, not reuse)
- Reuse gap index: -2.00 (negative means less reused than comparable datasets)
  - Pan-cancer genome and transcriptome analyses of 1,699 paediatric leukaemias and solid tumours. (2018) PMID 29489755
  - The molecular landscape of pediatric acute myeloid leukemia reveals recurrent structural alterations and age-specific mutational interactions. (2018) PMID 29227476
  - Genomic Profiling of Pediatric Acute Myeloid Leukemia Reveals a Changing Mutational Landscape from Disease Diagnosis to Relapse. (2016) PMID 26941285
  - Genetic mechanisms of primary chemotherapy resistance in pediatric acute myeloid leukemia. (2019) PMID 30760869
  - A new genomic framework to categorize pediatric acute myeloid leukemia. (2024) PMID 38212634

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-target-aml.json
