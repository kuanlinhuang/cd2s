# CPTAC AML Study

Dataset id: pdc-cptac-aml-study
Summary: 164 acute myeloid leukaemias with proteome, phosphoproteome, acetylome and glycoproteome, plus lipidomics and metabolomics on 98 - one of only three NCI cohorts carrying lipidomic data, openly downloadable.

## Read this first: what these data CANNOT support

- Cytogenetic risk group - the primary stratifier in AML - is not in the PDC clinical records, and neither is any therapeutic agent. A treatment record of any kind exists for 2% of the 164 cases. What the API does serve is vital status and follow-up time for 99% of cases, which is enough for overall survival but not for anything risk-stratified.
  Rules out: Risk-stratified comparison, Treatment-response analysis
- Do not use for: Prognostic claims that do not adjust for cytogenetic risk. (Vital status and follow-up are present for 99% of cases, so a survival model will fit - but risk group is absent, and in AML it dominates prognosis.)
- Do not use for: Treatment-response or resistance analysis from these data. (A treatment record of any kind exists for 2% of the cohort and no agent is named.)
- Do not use for: Risk-group comparisons without obtaining cytogenetics separately. (Cytogenetic risk is the primary stratifier in AML and is not present here.)

## What it is

- Cohort: 164 cases
- Cancer types: Acute Myeloid Leukemia
- Subject: Myeloid
- Measurements: Acetylome mass spectrometry (TMT18 / DDA), Glycoproteome mass spectrometry (TMT18 / DDA), Lipidome mass spectrometry (Label Free / DDA), Metabolome mass spectrometry (Label Free / DDA), Phosphoproteome mass spectrometry (TMT18 / DDA), Proteome mass spectrometry (TMT18 / DDA)
- Median follow-up: 12.1 months (derivable for 162 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tumor grade: 0.0% informative
- AJCC pathologic stage (tumor_stage): 0.0% informative
- Vital status: 99.4% informative
- Race: 99.4% informative
- Sex at birth (gender): 99.4% informative
- Morphology (ICD-O): 99.4% informative
- Primary diagnosis: 99.4% informative
- Tissue or organ of origin: 99.4% informative
- AJCC pathologic stage: 0.0% informative
- Age at diagnosis: 99.4% populated (one-to-many)
- Days to last follow-up: 99.4% populated (one-to-many)
- Days to death: 68.9% populated (one-to-many)
- Cause of death: 61.6% informative
- Ethnicity: 12.8% informative
- Days to recurrence: 9.1% populated (one-to-many)
- Treatment type: 2.4% populated (one-to-many)
- Treatment outcome: 2.4% populated (one-to-many)
- AJCC clinical stage: 0.0% informative

## Questions these data can support

- How does lipid composition differ across AML subtypes, and does it relate to differentiation state?
  Why: Lipidomic profiles on 98 primary AML samples, alongside proteome on all 164, allow lipid class abundance to be related to protein markers of myeloid differentiation on the same patients. Measured lipidomics on primary AML at this scale is essentially unavailable elsewhere.
  Statistical caution: 98 samples supports class-level comparison and well-powered subgroup contrasts only for common subtypes; rare fusion subgroups will have single-digit counts.
  Approximate analysable n: 98
- Do measured metabolite levels agree with metabolic state inferred from transcript or protein abundance?
  Why: Metabolomics and proteomics on the same 98 patients allow a direct test of an assumption that a large body of computational metabolic modeling depends on and rarely gets to check.
  Statistical caution: This is a methods-validation design; effect sizes are the quantity of interest, not significance.
  Approximate analysable n: 98
- Does protein acetylation, a modification tightly coupled to metabolic cofactor availability, track measured metabolite levels?
  Why: Acetylome on 164 cases and metabolome on 98 overlap substantially. Acetylation depends on acetyl-CoA availability, so this cohort can test a mechanistic link that is usually assumed rather than measured.
  Approximate analysable n: 98
- Can glycoproteomic features stratify AML in ways expression cannot?
  Why: Glycoproteome on all 164 cases; cell-surface glycosylation is directly relevant to immunotherapy target selection in myeloid disease.
  Approximate analysable n: 164

## How to get the data

1. Download the lipidomic and metabolomic studies from PDC (1 hour)
   Open access, no account required.
   https://pdc.cancer.gov/pdc/browse
2. Retrieve matching clinical and cytogenetic data from the GDC CPTAC records (2-3 hours)
   https://portal.gdc.cancer.gov/projects/CPTAC-3

## Verified runnable starting points

- Find and use the scarcest measurements in the portfolio (python, about a minute)
  workbooks/python/04_scarce_modality_cptac.py

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/pdc-cptac-aml-study.json
