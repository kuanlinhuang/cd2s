# Molecular Profiling to Predict Response to Treatment for Acute Lymphoblastic Leukemia

Dataset id: gdc-mp2prt-all
Summary: 1,510 children with acute lymphoblastic leukaemia from Children's Oncology Group trials, with whole genome sequencing, 8.4 years of median follow-up, and a named treatment regimen and response recorded for every single case.

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.
- Do not use for: Estimating paediatric ALL incidence or population survival. (This is a trial-enrolled cohort with no population denominator.)
- Do not use for: Comparing specific chemotherapy agents head to head. (Per-patient drug exposure is not recorded; only the protocol arm is. Agent-level claims would rest on assumptions about protocol adherence rather than on data.)

## What it is

- Cohort: 1,510 cases
- Cancer types: Acute Lymphoblastic Leukemia, Lymphoid Leukemias
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Whole genome sequencing, Clinical, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 100.2 months (derivable for 1510 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Country of residence: 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Treatment outcome: 100.0% informative
- Regimen or line of therapy: 100.0% informative
- Disease response at follow-up: 100.0% informative
- Progression at follow-up: 100.0% informative
- Primary diagnosis: 99.9% informative
- Ethnicity: 96.8% informative
- Morphology (ICD-O): 89.8% informative
- Race: 87.4% informative
- Vital status: 84.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumour grade: 0.0% informative
- Prior treatment: 0.0% informative

## Questions these data can support

- Which genomic features predict failure of protocolised induction therapy in paediatric B-cell acute lymphoblastic leukaemia?
  Why: Treatment outcome and regimen are populated for 100% of 1,510 cases, and regimen strings name the actual protocol arm, so response can be modeled within a treatment context rather than across an uncontrolled mixture of therapies. Whole genome sequencing on 1,507 cases supports genome-wide discovery at this sample size.
  Statistical caution: Complete response is the dominant outcome category in a curable disease, so the informative contrast is relapse and residual disease rather than induction failure. Expect a heavily imbalanced outcome and plan the design accordingly.
  Approximate analysable n: 1510
- Do Hispanic or Latino children carry a different genomic landscape or a different response profile, and does genomics explain any of the known outcome disparity?
  Why: 333 of 1,510 patients are recorded as Hispanic or Latino - both a substantial absolute number and a substantial share, which is unusual. With treatment held closer to constant by the trial protocol, the ethnicity contrast is less confounded by care access than in an observational cohort.
  Statistical caution: Ethnicity is self-reported and unknown for 49 cases. Genetic ancestry can be estimated from the germline data and is the more defensible variable for biological claims; report both and do not treat them as interchangeable.
  Approximate analysable n: 1461
- What are the long-term survival determinants in paediatric ALL, given follow-up that extends beyond fifteen years?
  Why: Vital status is informative for 84% of cases and median follow-up is 100.2 months, so late relapse and long-term survival are genuinely observable rather than censored away. Very few genomic cohorts of this size reach this follow-up duration.
  Statistical caution: 16% of cases have uninformative vital status; check whether missingness is associated with treatment arm before assuming it is uninformative censoring.
  Approximate analysable n: 1268
- How do subtype-defining fusions and copy number alterations interact with assigned risk group and delivered therapy?
  Why: Structural variant and copy number calls exist for 1,504 cases, and the regimen field records the risk-stratified arm each patient received, allowing molecular subtype to be crossed with the therapy actually delivered.
  Approximate analysable n: 1504

## How to get the data

1. Confirm which trial protocols the cohort draws from (2-3 hours)
   The regimen field contains protocol arm names. Reading the corresponding COG protocol publications is what turns those strings into an interpretable treatment variable.
2. Scope with the 7,459 open-access files (1-2 hours)
   https://portal.gdc.cancer.gov/projects/MP2PRT-ALL
3. Submit a dbGaP data access request (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py
- Select a dataset the way an agent should (python, under a minute)
  workbooks/python/06_agent_dataset_selection.py

## Evidence of prior reuse

- Articles that analyzed these data: 2
- Citations to the dataset's publication: 17 (attention, not reuse)
- Reuse gap index: -0.67 (negative means less reused than comparable datasets)
  - Pseudogene Coexpression Networks Reveal a Robust Prognostic Signature for Pediatric B-ALL Survival. (2026) PMID 41802009
  - Increased activity of PRMT5-MEP50 complex improves survival of chromosomally unstable cancer cells by increasing tolerance to protein aggregation and proteotoxicity (2025) PMID None
  - Three-Dimensional Epigenome Roadmap of Human B-cell Differentiation Uncovers Mechanisms of Humoral Immunity and Oncogenesis (2025) PMID None
  - Relapse Thresholds (12/24 Mo) Define Survival Disparity in Pediatric B-ALL. (2026) PMID 42383304
  - Uncovering the genomic complexity of PAX5 intragenic tandem multiplication via long-read and short-read sequencing. (2026) PMID 41587071

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-mp2prt-all.json
