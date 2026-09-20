# Comprehensive genomic characterization of radiation-related papillary thyroid cancer in the Ukraine

Dataset id: gdc-rebc-thyr
Summary: 449 papillary thyroid carcinomas from Ukrainians exposed to Chernobyl fallout as children - an irreplaceable radiation-exposure cohort with essentially no clinical annotation and no usable outcome data at all.

## Read this first: what these data CANNOT support

- Vital status is populated for 98% of cases and informative for 0%: every populated value is "not reported". A follow-up time is derivable for just 12 of 449 cases, and even for those there is no outcome to pair it with, so no survival endpoint exists. No survival analysis of any kind is possible.
  Rules out: Overall survival, Prognostic biomarker discovery, Any outcome-anchored model
- Individual reconstructed radiation dose is not present in the harmonized clinical records, although it is the variable that distinguishes this cohort from any other thyroid cancer resource and is analyzed in the marker paper.
  Rules out: Dose-response modeling, Any claim about radiation dose thresholds
- Do not use for: Survival or prognostic analysis of any kind. (Vital status is uninformative for every case. The long recorded follow-up in the metadata is not accompanied by outcome status, and using it would produce a survival curve with no events.)
- Do not use for: Quantifying cancer risk attributable to Chernobyl exposure. (This is a case series of tumors, with no unexposed comparison group and no population denominator. Risk estimation requires an epidemiological cohort design that these data do not constitute.)
- Do not use for: Treatment-effect or response analysis. (Treatment fields are populated for 2.7% of cases and contain no outcome.)

## What it is

- Cohort: 449 cases
- Cancer types: Epithelial Neoplasms, NOS, Adenomas and Adenocarcinomas
- Subject: Thyroid
- Measurements: Whole genome sequencing, Bulk RNA sequencing, microRNA sequencing, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 115.0 months (derivable for 12 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 98.0% informative
- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Vital status: 0.0% informative
- Primary diagnosis: 98.0% informative
- Morphology (ICD-O): 98.0% informative
- Tissue or organ of origin: 98.0% informative
- AJCC pathologic stage: 2.7% informative
- Tumor grade: 0.0% informative
- Prior treatment: 2.7% informative
- Prior malignancy: 2.7% informative
- Synchronous malignancy: 2.7% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Classification of tumor: 0.0% informative
- Treatment type: 2.7% informative
- Treatment given: 2.7% informative
- Alcohol history: 0.0% informative

## Questions these data can support

- What is the mutational and structural signature of ionising radiation exposure in a solid human tumor, and how does it scale with dose?
  Why: Whole genome sequencing on 395 cases with structural variant and copy number calls on 394 supports genome-wide signature analysis, including the fusion-driven and small-deletion patterns the marker paper associated with radiation. This is the cohort's central strength and the reason it was assembled.
  Statistical caution: Dose-response analysis requires the reconstructed individual dose estimates, which are not in the harmonized records. Without them this becomes an exposed-cohort description rather than a dose-response study.
  Approximate analysable n: 394
- Do radiation-associated papillary thyroid carcinomas differ transcriptionally from sporadic ones, and can a classifier separate them?
  Why: RNA sequencing on 438 cases and microRNA on 437 gives a well-powered expression cohort. TCGA-THCA provides a 507-case sporadic comparison group in the same repository with the same harmonization, which makes a cross-cohort contrast unusually tractable.
  Statistical caution: Batch and platform differences between this cohort and TCGA-THCA are confounded with the exposure of interest. Any classifier must be evaluated with that confound stated, ideally with a batch-aware design rather than naive merging.
  Approximate analysable n: 437
- Does age at exposure shape the resulting tumor genome, given that participants were children or in utero at the time?
  Why: The cohort's defining feature is exposure during a developmental window. Age variables together with the genomic data allow the question to be posed, and it is one of the few human settings where exposure timing is externally fixed by a single dated event rather than self-reported.
  Statistical caution: Age at diagnosis is not summarized in the harmonized records for this project, so age variables must be obtained through controlled access before this can be designed.
  Approximate analysable n: 395
- Can microRNA profiles discriminate radiation-associated thyroid tumors, as a cheaper assay than whole genome sequencing for future screening cohorts?
  Why: microRNA data exist on 437 of 449 cases, an unusually complete layer, and microRNA assays are far more tractable in resource-limited screening settings than sequencing.
  Approximate analysable n: 437

## How to get the data

1. Read the Science paper before requesting access (1-2 hours)
   It states which clinical and dosimetric variables were available to the original investigators. That is the fastest way to learn whether your question is answerable at all, given that the harmonized records carry almost no clinical annotation.
   https://pubmed.ncbi.nlm.nih.gov/33888599/
2. Scope with the 4,268 open-access files (1-2 hours)
   Derived expression and copy number products are open and sufficient to test whether your analysis plan is viable before you commit to an access request.
   https://portal.gdc.cancer.gov/projects/REBC-THYR
3. Submit a dbGaP request, explicitly asking for dosimetry and outcome variables (days to a few weeks)
   Name the dose reconstruction and vital status variables in your request. They are the difference between a descriptive genomic analysis and the dose-response study most people want this cohort for.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py

## Evidence of prior reuse

- Articles that analyzed these data: 1
- Of those, 2 were retrieved and graded individually, and the strongest 1 are kept as exemplars. Of the 1 that analyzed the data, 0 of the 1 that could be checked had no author in common with the generating team, and 1 of the 1 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 138 (attention, not reuse)
- Reuse gap index: -0.56 (negative means less reused than comparable datasets)
  - Distinctive molecular features of radiation-induced thyroid cancers. (2025) PMID 40845117

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-rebc-thyr.json
