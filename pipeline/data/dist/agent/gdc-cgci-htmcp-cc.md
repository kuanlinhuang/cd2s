# HIV+ Tumor Molecular Characterization Project - Cervical Cancer

Dataset id: gdc-cgci-htmcp-cc
Summary: 212 cervical carcinomas from Ugandan women, 98% Black African and enriched for HIV infection - the largest genomically characterized cervical cancer cohort from sub-Saharan Africa, with ECOG status on 99% of cases, treatment outcome on 68%, and a derivable follow-up time for every single case.

## Read this first: what these data CANNOT support

- Tumor stage is not populated for any case in the GDC harmonized clinical records - both AJCC pathologic stage and AJCC clinical stage are empty for all 212 cases. Since stage is the dominant prognostic factor in cervical cancer, any survival model built from these records alone is unadjusted for the single most important covariate.
  Rules out: Multivariable survival modeling, Prognostic biomarker discovery, Any comparison of outcomes against staged cohorts
- Do not use for: Estimating cervical cancer incidence or population-level disease burden. (This is a convenience sample of patients presenting to participating centres, not a population-based registry. It carries no denominator and no sampling frame.)
- Do not use for: Stage-adjusted prognostic modeling using only the GDC clinical records. (Stage is empty for all 212 cases in those records, so a model cannot adjust for it no matter how it is specified.)
- Do not use for: Comparing HIV-positive and HIV-negative tumor biology within the cohort. (HIV status is not present as a structured variable in the harmonized records, so the comparison cannot be constructed without obtaining additional controlled phenotype data.)

## What it is

- Cohort: 212 cases
- Cancer types: Epithelial Neoplasms, NOS, Adenomas and Adenocarcinomas, Complex Epithelial Neoplasms, Squamous Cell Neoplasms
- Measurements: Clinical, Whole-slide tissue images, DICOM medical imaging, Whole genome sequencing, Copy Number Variation, Somatic Structural Variation, Bulk RNA sequencing, DNA methylation array, microRNA sequencing, Targeted DNA panel sequencing
- Median follow-up: 13.2 months (derivable for 212 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Prior treatment: 100.0% informative
- Prior malignancy: 100.0% informative
- Classification of tumor: 100.0% informative
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Disease response at follow-up: 100.0% populated (one-to-many)
- Primary diagnosis: 99.5% informative
- Synchronous malignancy: 99.5% informative
- Tobacco smoking status: 99.1% informative
- Morphology (ICD-O): 98.6% informative
- ECOG performance status: 98.6% informative
- Tumor grade: 98.1% informative
- Race: 97.6% informative
- Treatment outcome: 67.9% populated (one-to-many)
- Ethnicity: 47.6% informative

## Questions these data can support

- Does HPV clade shape the tumor epigenome and transcriptome differently in an African cohort than in the predominantly North American and European cohorts that define current cervical cancer subtypes?
  Why: Methylation arrays are available on 120 cases and RNA sequencing on 123, on the same tumors as whole genome sequencing that can be used to type and subclassify the integrated HPV. This is the design the marker paper used, and the cohort is large enough to repeat it with different clade groupings or to test subtype assignments derived from TCGA-CESC against an independent, differently constituted population.
  Statistical caution: Analyses restricted to the intersection of methylation and expression leave roughly 118 cases; clade subgroups below about 25 cases will not support multiple-testing corrected genome-wide comparisons.
  Approximate analysable n: 118
- Do molecular subtypes derived from predominantly white cohorts transfer to Black African patients, or do they misclassify tumors in this population?
  Why: 207 of 212 cases are recorded as Black or African American, making this the only cohort in this corpus where a non-white group constitutes more than half the participants. Expression and methylation data allow subtype classifiers trained on TCGA to be applied directly, and classifier failure is itself the finding.
  Statistical caution: Because the cohort is nearly homogeneous by race, this is a transfer-validation design rather than a within-cohort disparities comparison; there is no internal white comparison group.
  Approximate analysable n: 120
- Which molecular features are associated with performance status and with response to chemoradiation in a setting where platinum-based chemoradiation is the dominant treatment?
  Why: ECOG performance status is informative on 98.6% of cases, which is exceptional - most GDC projects record it for none. Treatment type is populated for every case, therapeutic agents for 29.7% (cisplatin, paclitaxel and carboplatin are the commonest), and a treatment outcome field is populated for 67.9%. Together these support a response analysis that is impossible in most cohorts of this size.
  Statistical caution: Roughly 144 cases have a populated treatment outcome. Response categories are unevenly distributed and the outcome field is one-to-many, so collapse to a binary responder definition per case before modeling and pre-register that definition.
  Approximate analysable n: 144
- How do survival patterns in this cohort compare with cervical cancer cohorts from high-income settings, given a median follow-up of only 13.2 months?
  Why: Vital status is informative for 100% of cases and follow-up time is computable, giving a usable overall survival endpoint. The short follow-up is itself scientifically interesting because it reflects real-world attrition in the setting where the cohort was recruited.
  Statistical caution: Median follow-up is 13.2 months and the maximum is 32.7, so late events are not observed. Report restricted mean survival time or landmark analyses rather than median overall survival, and do not compare medians directly against cohorts with five-year follow-up.
  Approximate analysable n: 212
- Can radiology and histopathology images from this cohort be used to build or validate imaging models on a population that is absent from almost every public imaging training set?
  Why: Histopathology and radiology are both available for 211 of 212 cases, alongside the molecular data. Imaging models trained largely on North American and European cohorts have documented performance gaps on under-represented populations, and this is one of the few resources that permits an external check.
  Statistical caution: Suitable for external validation rather than primary training; 211 cases is small for training a deep model from scratch.
  Approximate analysable n: 211

## How to get the data

1. Read the marker publication first (1 hour)
   The Nature Genetics paper describes the recruitment setting, HPV typing approach and the clinical variables that exist outside the harmonized records. It will tell you whether the variables your analysis needs are obtainable at all.
   https://pubmed.ncbi.nlm.nih.gov/32747824/
2. Explore the open-access files without any approval (1-2 hours)
   2,457 of 7,160 files are open. Derived expression, copy number and methylation products are enough to scope the analysis and check that the cohort fits before you invest in an access request.
   https://portal.gdc.cancer.gov/projects/CGCI-HTMCP-CC
3. Submit a dbGaP data access request for the controlled tier (days to a few weeks)
   Needed for whole genome sequencing and any sequence-level analysis. You will need an eRA Commons account and your institutional signing official. Request the full phenotype file at the same time - that is where stage and HIV-related variables are most likely to live.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download with the GDC client (hours, depending on volume)
   Once approved, use the GDC Data Transfer Tool with your token. Do not put the token on a command line or into a script that is committed anywhere.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py
- Treatment response, after checking the response field is real (python, about a minute)
  workbooks/python/03_treatment_response_cervical.py
- Select a dataset the way an agent should (python, under a minute)
  workbooks/python/06_agent_dataset_selection.py

## Evidence of prior reuse

- Articles that analyzed these data: 21
- Citations to the dataset's publication: 70 (attention, not reuse)
- Reuse gap index: -0.89 (negative means less reused than comparable datasets)
  - Integrated analysis of cervical squamous cell carcinoma cohorts from three continents reveals conserved subtypes of prognostic significance. (2022) PMID 36207323
  - Insight into the Regulation of NDRG1 Expression. (2025) PMID 40332138
  - Identification and validation of a prognostic signature related to hypoxic tumor microenvironment in cervical cancer. (2022) PMID 35657977
  - Big Data to Knowledge: Application of Machine Learning to Predictive Modeling of Therapeutic Response in Cancer. (2021) PMID 35273457
  - Deep learning for predicting prognostic consensus molecular subtypes in cervical cancer from histology images. (2025) PMID 39799271

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-cgci-htmcp-cc.json
