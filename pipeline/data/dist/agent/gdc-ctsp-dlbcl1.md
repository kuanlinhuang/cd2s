# CTSP Diffuse Large B-Cell Lymphoma (DLBCL) CALGB 50303

Dataset id: gdc-ctsp-dlbcl1
Summary: 45 diffuse large B-cell lymphomas from the randomized CALGB 50303 trial - small, but every case has complete vital status, five years of median follow-up, and a known randomized treatment assignment.

## Read this first: what these data CANNOT support

- 45 cases is small for any genomic analysis and very small for a treatment-interaction question. Split by trial arm the groups are around twenty patients each.
  Rules out: Genome-wide discovery, Treatment-by-subtype interaction, Multivariable modeling
- Treatment fields are populated for only 6.7% of cases in the GDC records, and trial arm assignment is not present at all, even though the cohort comes from a randomized trial.
  Rules out: Any analysis requiring treatment arm
- Do not use for: Genome-wide biomarker discovery. (45 cases cannot support multiple-testing-corrected genome-wide discovery.)
- Do not use for: Claiming a treatment interaction without obtaining arm assignment. (Trial arm is not in these records. Any treatment claim made without it would be asserting a randomization the analysis does not actually use.)

## What it is

- Cohort: 45 cases
- Cancer types: Mature B-Cell Lymphomas
- Measurements: Bulk RNA sequencing, Whole exome sequencing, Targeted DNA panel sequencing, Clinical, Structural Variation
- Median follow-up: 60.4 months (derivable for 37 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% informative
- Prior malignancy: 0.0% informative
- Morphology (ICD-O): 80.0% informative
- Race: 77.8% informative
- Ethnicity: 73.3% informative
- Cause of death: 35.6% informative
- Tissue or organ of origin: 17.8% informative
- Tumour grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Treatment type: 6.7% populated (one-to-many)
- Treatment given: 6.7% populated (one-to-many)
- Therapeutic agents: 6.7% populated (one-to-many)
- Treatment outcome: 6.7% informative
- Regimen or line of therapy: 6.7% informative
- Disease response at follow-up: 6.7% informative

## Questions these data can support

- Do molecular subtypes of diffuse large B-cell lymphoma predict differential benefit from dose-adjusted EPOCH-R versus R-CHOP?
  Why: This is a predictive-biomarker question, and it requires randomized treatment assignment to answer properly. RNA sequencing on 44 cases supports cell-of-origin and subtype classification, and the trial provides the randomization.
  Statistical caution: 45 cases split across two arms cannot power a treatment-by-subtype interaction test. This is a design demonstration and a hypothesis-generating analysis, not a definitive one. Trial arm assignment must be obtained from the trial group; it is not in the GDC clinical records.
  Approximate analysable n: 44
- How well do molecular classifiers built on observational DLBCL cohorts perform on uniformly treated trial patients?
  Why: Classifier performance usually degrades when treatment heterogeneity is removed, because some apparent prognostic signal is really treatment-selection signal. A uniformly treated, randomized cohort is the right place to detect that.
  Statistical caution: Validation only; too small for training.
  Approximate analysable n: 44
- What is the five-year survival experience of genomically characterized DLBCL patients treated in a controlled setting?
  Why: Vital status is informative for all 45 cases with 60.4 months of median follow-up and cause of death recorded for 35.6% - unusually complete for a cohort this small.
  Statistical caution: 45 cases give wide confidence intervals; report them.
  Approximate analysable n: 45

## How to get the data

1. Read the CALGB 50303 primary trial report (1-2 hours)
   https://pubmed.ncbi.nlm.nih.gov/30939090/
2. Contact the Alliance trial group about arm assignment and trial covariates (weeks)
   This is the step that determines whether the cohort's randomization is usable. Do it before the data access request, not after.
3. Submit a dbGaP data access request for the sequence data (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Evidence of prior reuse

- Articles that analyzed these data: 5
- Citations to the dataset's publication: 333 (attention, not reuse)
- Reuse gap index: -1.79 (negative means less reused than comparable datasets)
  - A Hyper-IgM Syndrome Mutation in Activation-Induced Cytidine Deaminase Disrupts G-Quadruplex Binding and Genome-wide Chromatin Localization. (2020) PMID 33098766
  - Developmental Deconvolution for Classification of Cancer Origin. (2022) PMID 36041084
  - International Prognostic Index-Based Immune Prognostic Model for Diffuse Large B-Cell Lymphoma. (2021) PMID 34745101
  - Oncolytic herpes simplex virus infects myeloma cells &lt;i&gt;in vitro&lt;/i&gt; and &lt;i&gt;in vivo&lt;/i&gt;. (2021) PMID 33738338
  - Pareto task inference analysis reveals cellular trade-offs in diffuse large B-Cell lymphoma transcriptomic data. (2024) PMID 40809150

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-ctsp-dlbcl1.json
