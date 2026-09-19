# HIV+ Tumor Molecular Characterization Project - Diffuse Large B-Cell Lymphoma

Dataset id: gdc-cgci-htmcp-dlbcl
Summary: 70 diffuse large B-cell lymphomas from an HIV-enriched cohort, half Black or African American, with whole genome sequencing on 66 and named chemotherapy regimens on a quarter.

## Read this first: what these data CANNOT support

- 70 cases, with individual layers covering 50 to 66, limits all subgroup analysis.
  Rules out: Genome-wide discovery, Subgroup comparison, Multivariable modeling
- HIV status, CD4 count and antiretroviral therapy are not structured fields, despite being the cohort's organizing rationale. Stage is absent for all cases.
  Rules out: HIV-stratified comparison, Stage-adjusted survival
- Do not use for: Comparing HIV-positive with HIV-negative lymphoma within the cohort. (HIV status is not a structured variable in these records.)
- Do not use for: Genome-wide significance testing. (66 whole genomes cannot support it.)

## What it is

- Cohort: 70 cases
- Cancer types: Mature B-Cell Lymphomas
- Measurements: Whole genome sequencing, microRNA sequencing, Clinical, Bulk RNA sequencing, Copy Number Variation, Somatic Structural Variation, Whole-slide tissue images, DICOM medical imaging
- Median follow-up: 11.3 months (derivable for 57 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Prior treatment: 81.4% informative
- Prior malignancy: 81.4% informative
- Classification of tumour: 81.4% informative
- Treatment type: 81.4% populated (one-to-many)
- Treatment given: 81.4% populated (one-to-many)
- Disease response at follow-up: 81.4% populated (one-to-many)
- Tissue or organ of origin: 80.0% informative
- Primary diagnosis: 77.1% informative
- Synchronous malignancy: 77.1% informative
- Race: 75.7% informative
- Vital status: 75.7% informative
- Morphology (ICD-O): 74.3% informative
- Ethnicity: 72.9% informative
- ECOG performance status: 60.0% informative
- Tobacco smoking status: 55.7% informative
- Treatment outcome: 45.7% populated (one-to-many)
- Therapeutic agents: 25.7% populated (one-to-many)

## Questions these data can support

- How does the genomic landscape of HIV-associated diffuse large B-cell lymphoma differ from that of lymphoma in immunocompetent patients?
  Why: Whole genome sequencing on 66 cases from an HIV-enriched population, contrastable with the many DLBCL cohorts derived from largely HIV-negative populations. Whole genome rather than exome makes structural and viral-integration analysis possible.
  Statistical caution: 70 cases supports description of recurrent alterations but not genome-wide discovery at conventional significance thresholds.
  Approximate analysable n: 66
- Does immune status shape the tumor transcriptome in lymphoma?
  Why: RNA sequencing on 55 cases with ECOG performance status on 71% allows transcriptional programs to be related to a clinical proxy for host status.
  Statistical caution: ECOG is a crude proxy for immune competence; CD4 count would be far better and is not available in these records.
  Approximate analysable n: 55
- What are the outcomes of HIV-associated DLBCL treated with standard regimens?
  Why: Vital status is informative for 76% of cases, follow-up is derivable for 57 of 70 with a median of 11.3 months extending to 99.6, and 24% carry a named regimen.
  Statistical caution: 53 cases with informative vital status gives wide confidence intervals; median follow-up of 11.3 months is short for lymphoma outcomes.
  Approximate analysable n: 53

## How to get the data

1. Scope with the 946 open-access files (1 hour)
   https://portal.gdc.cancer.gov/projects/CGCI-HTMCP-DLBCL
2. Request controlled access, naming HIV-related phenotype variables (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Treatment response, after checking the response field is real (python, about a minute)
  workbooks/python/03_treatment_response_cervical.py

## Evidence of prior reuse

- Articles that analyzed these data: 2
- Reuse gap index: +0.09 (negative means less reused than comparable datasets)
  - Three-Dimensional Epigenome Roadmap of Human B-cell Differentiation Uncovers Mechanisms of Humoral Immunity and Oncogenesis (2025) PMID None

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-cgci-htmcp-dlbcl.json
