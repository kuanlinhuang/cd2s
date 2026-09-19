# Genomic Characterization of Metastatic Castration Resistant Prostate Cancer

Dataset id: gdc-wcdt-mcrpc
Summary: 101 metastatic castration-resistant prostate cancers with whole genome and RNA sequencing from metastatic biopsies - every case stage IV with documented progression, and no usable vital status.

## Read this first: what these data CANNOT support

- Vital status is populated for all 101 cases and informative for none - every value is "unknown". No overall survival endpoint exists in the harmonized records, despite a follow-up time being derivable for 87 of 101 cases with a median of 95 months.
  Rules out: Overall survival, Prognostic modeling, Outcome-anchored biomarker discovery
- No treatment field is populated: treatment type, therapeutic agents, treatment outcome and line of therapy are all empty. These are castration-resistant patients, so every one has had prior androgen deprivation and most will have had further systemic therapy, but which therapy and in what order is not recorded here.
  Rules out: Treatment-response analysis, Resistance mechanism attribution, Line-of-therapy stratification
- Do not use for: Survival analysis or prognostic biomarker discovery from the GDC records. (Vital status is uninformative for all 101 cases.)
- Do not use for: Attributing resistance mechanisms to particular drugs. (No treatment is recorded for any case, so drug attribution would be invented rather than observed.)
- Do not use for: Studying prostate cancer disparities. (Five Black patients cannot support a disparities analysis.)

## What it is

- Cohort: 101 cases
- Cancer types: Adenomas and Adenocarcinomas
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 95.2 months (derivable for 87 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 0.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- AJCC pathologic stage: 100.0% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 100.0% informative
- Last known disease status: 100.0% informative
- Disease response at follow-up: 100.0% informative
- Progression at follow-up: 100.0% informative
- Race: 94.1% informative
- Ethnicity: 93.1% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative

## Questions these data can support

- What distinguishes the genome of metastatic castration-resistant prostate cancer from primary prostate cancer?
  Why: Whole genome sequencing on all 101 metastatic biopsies pairs naturally with TCGA-PRAD's 500 primary tumors in the same repository under the same harmonization. The contrast is the cohort's clearest use and does not depend on any outcome field.
  Statistical caution: The two cohorts differ in sequencing strategy and processing era as well as in disease state, so treat platform as a confounder rather than assuming harmonization removed it.
  Approximate analysable n: 101
- Which transcriptional programs mark androgen receptor pathway independence and neuroendocrine transdifferentiation in treatment-resistant disease?
  Why: RNA sequencing on 99 metastatic biopsies is the right substrate for AR-signaling and neuroendocrine scoring, and metastatic tissue is where these phenotypes actually occur.
  Statistical caution: Biopsy site varies across the cohort and contributes substantially to expression variance; include site as a covariate or stratify.
  Approximate analysable n: 99
- How do structural variants and genome rearrangement patterns differ between metastatic sites?
  Why: Structural variant calls exist for all 101 cases from whole genome rather than exome data, which is what makes rearrangement analysis credible here.
  Approximate analysable n: 101
- Can expression or genomic features predict which metastatic biopsies come from patients with the most aggressive disease trajectory?
  Why: This is the question most people want the cohort for, and it is the one the harmonized records cannot support. It is listed here to be explicit that it requires outcome data obtained separately.
  Statistical caution: Not answerable from the GDC records alone. Vital status is "unknown" for every case; outcomes must come from the marker publication's supplement or a dbGaP phenotype file.
  Approximate analysable n: 101

## How to get the data

1. Read the PNAS marker paper for the clinical annotation (1-2 hours)
   It carries the outcome and treatment context that the harmonized records lack. Decide from it whether your question is viable.
   https://pubmed.ncbi.nlm.nih.gov/31061129/
2. Scope with the 200 open-access files (1 hour)
   https://portal.gdc.cancer.gov/projects/WCDT-MCRPC
3. Submit a dbGaP data access request (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py

## Evidence of prior reuse

- Articles that analyzed these data: 27
- Citations to the dataset's publication: 1206 (attention, not reuse)
- Reuse gap index: +1.41 (negative means less reused than comparable datasets)
  - Multiplexed functional genomic analysis of 5' untranslated region mutations across the spectrum of prostate cancer. (2021) PMID 34244513
  - Assessment of Androgen Receptor Splice Variant-7 as a Biomarker of Clinical Response in Castration-Sensitive Prostate Cancer. (2022) PMID 35695870
  - Integrative molecular analyses define correlates of high B7-H3 expression in metastatic castrate-resistant prostate cancer. (2022) PMID 36323882
  - Multi-level functional genomics reveals molecular and cellular oncogenicity of patient-based 3' untranslated region mutations. (2023) PMID 37516102
  - Mechanism-centric regulatory network identifies NME2 and MYC programs as markers of Enzalutamide resistance in CRPC. (2024) PMID 38191557

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-wcdt-mcrpc.json
