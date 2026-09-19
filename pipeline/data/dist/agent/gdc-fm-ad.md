# Foundation Medicine Adult Cancer Clinical Dataset (FM-AD)

Dataset id: gdc-fm-ad
Summary: 18,004 patients profiled with a targeted clinical panel - the largest cohort in this corpus, with no informative vital status, no race data, and no treatment records.

## Read this first: what these data CANNOT support

- Vital status is populated for 100% of the 18,004 cases and informative for 0%: every value is "not reported". Progression or recurrence and last known disease status show the same pattern - fully populated, entirely uninformative. No outcome endpoint of any kind can be derived.
  Rules out: Survival analysis, Prognostic modeling, Any outcome-anchored question
- Every treatment field is empty for every case: prior treatment, treatment type, therapeutic agents, treatment outcome and line of therapy are all at 0% coverage.
  Rules out: Treatment-response analysis, Resistance mechanisms, Line-of-therapy questions
- Race is recorded as "not reported" for all 18,004 patients. The largest cohort in this corpus contributes nothing to any question about how cancer genomics differs across populations.
  Rules out: Disparities research, Ancestry-stratified analysis
- Do not use for: Any survival, prognostic or outcome analysis. (Vital status is uninformative for all 18,004 cases.)
- Do not use for: Any treatment or resistance analysis. (All treatment fields are empty.)
- Do not use for: Any analysis of racial or ethnic differences. (Race is "not reported" for every patient in the cohort.)
- Do not use for: Estimating population-level mutation prevalence. (The cohort is ascertained by clinical referral for sequencing and carries no sampling frame or denominator.)

## What it is

- Cohort: 18,004 cases
- Cancer types: Not Reported, Cystic, Mucinous and Serous Neoplasms, Miscellaneous Tumors, Germ Cell Neoplasms, Complex Mixed and Stromal Neoplasms, Thymic Epithelial Neoplasms
- Measurements: Targeted DNA panel sequencing, Clinical
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Vital status: 0.0% informative
- Tumour grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Primary diagnosis: 98.8% informative
- Morphology (ICD-O): 98.8% informative
- Tissue or organ of origin: 90.0% informative
- Classification of tumour: 86.3% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## Questions these data can support

- What are the mutation frequencies and co-occurrence patterns of clinically targeted genes in a large real-world oncology population?
  Why: 18,004 patients profiled on a clinical panel give tight confidence intervals on alteration frequencies, including for alterations too rare to study in a thousand-patient research cohort. Frequency and co-occurrence need only the variant calls and the tumor type, both of which are present.
  Statistical caution: Panel composition bounds what can be counted: absence of a gene from the panel is not absence of alteration. Report frequencies only for genes on the panel and state the panel version.
  Approximate analysable n: 18004
- How does the mutational landscape of clinically sequenced patients differ from that of research cohorts such as TCGA?
  Why: Clinical sequencing populations are enriched for advanced and pretreated disease relative to the largely treatment-naive primary tumors in research cohorts. With 18,004 cases the comparison is well powered, and the discrepancy is itself a caution about generalising research-cohort findings to clinical practice.
  Statistical caution: Restrict the comparison to genes present on both assays and to matched tumor types; differences in assay sensitivity and tumor purity confound naive comparisons.
  Approximate analysable n: 18004
- How common are actionable alterations across tumor types in routine practice?
  Why: Scale plus a clinically-deployed panel makes this the right cohort for estimating what fraction of patients would be eligible for a given targeted therapy, a question that research cohorts systematically answer wrong.
  Statistical caution: Eligibility estimates apply to the population that received clinical sequencing, which is not the whole cancer population.
  Approximate analysable n: 18004

## How to get the data

1. Check your question against the annotation gaps above (15 minutes)
   Almost all files are controlled, so scoping after approval is expensive. The three blocking limitations on this page rule out most reasons people arrive at a cohort of this size.
2. Submit a dbGaP data access request if the question survives (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py

## Evidence of prior reuse

- Articles that analyzed these data: 6
- Citations to the dataset's publication: 726 (attention, not reuse)
- Reuse gap index: -2.90 (negative means less reused than comparable datasets)
  - Functional characterization of SMARCA4 variants identified by targeted exome-sequencing of 131,668 cancer patients. (2020) PMID 33144586
  - Genomic analysis of 63,220 tumors reveals insights into tumor uniqueness and targeted cancer immunotherapy strategies. (2017) PMID 28231819
  - Comprehensive characterization of distinct genetic alterations in metastatic breast cancer across various metastatic sites. (2021) PMID 34272397
  - Machine learning of genomic features in organotropic metastases stratifies progression risk of primary tumors. (2021) PMID 34795255
  - Ligand-activated EGFR/MAPK signaling but not PI3K, are key resistance mechanisms to EGFR-therapy in colorectal cancer. (2025) PMID 40346041

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-fm-ad.json
