# Glioblastoma Multiforme

Dataset id: gdc-tcga-gbm
Summary: 617 glioblastomas with twelve measurement types including radiology on 607 and pathology slides on 389 - the reference glioma cohort, with a median follow-up of 12.0 months.

## Read this first: what these data CANNOT support

- Progression or recurrence is populated for 0.6% of cases and informative for none, so progression-free survival cannot be derived at all.
  Rules out: Progression-free survival, Recurrence biology
- Do not use for: Progression-free survival analysis. (Progression is informative for no case in the record.)
- Do not use for: Claiming a classifier generalizes from TCGA-GBM performance alone. (The cohort has been used extensively for method development.)

## What it is

- Cohort: 617 cases
- Cancer types: Gliomas, Not Reported
- Subject: Brain and central nervous system
- Measurements: Clinical, DICOM medical imaging, SNP genotyping array (copy number, germline), DNA methylation array, Whole exome sequencing, Whole-slide diagnostic images, Whole genome sequencing, Somatic Structural Variation, Bulk RNA sequencing, microRNA sequencing
- Median follow-up: 12.0 months (derivable for 596 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 97.2% populated (one-to-many)
- Morphology (ICD-O): 97.2% populated (one-to-many)
- Tissue or organ of origin: 97.2% populated (one-to-many)
- Prior treatment: 97.2% populated (one-to-many)
- Classification of tumor: 97.2% populated (one-to-many)
- Sex at birth: 96.6% informative
- Vital status: 96.3% informative
- Treatment type: 94.2% populated (one-to-many)
- Treatment given: 94.2% populated (one-to-many)
- Race: 92.5% informative
- Disease response at follow-up: 86.1% informative
- Ethnicity: 81.5% informative
- Therapeutic agents: 71.6% populated (one-to-many)
- Progression at follow-up: 62.7% informative
- ECOG performance status: 12.3% informative
- Treatment outcome: 11.2% informative
- Prior malignancy: 7.8% informative
- Synchronous malignancy: 5.3% informative

## Questions these data can support

- Do imaging features add prognostic or subtype information beyond molecular data in glioblastoma?
  Why: Radiology on 607 cases and pathology slides on 389, paired with expression on 293, methylation on 423 and copy number on 599 for the same patients. Glioma is the disease where imaging is most clinically central, and this pairing is openly available.
  Statistical caution: The intersection of imaging and expression is well below 617; build it explicitly. Imaging is in a separate repository from the molecular data.
  Approximate analysable n: 389
- Does a new glioma classifier reproduce established methylation subgroups?
  Why: Methylation on 423 cases with subgroup definitions established across a large literature makes this the standard validation set for glioma classification.
  Statistical caution: Extensive prior use means good performance here is weak evidence of generalization.
  Approximate analysable n: 423
- Which molecular features associate with survival in glioblastoma?
  Why: Vital status is informative for 96.3% of 617 cases, giving a clean overall survival endpoint on a well-characterized cohort.
  Statistical caution: Follow-up time is recorded across three different GDC fields and is null in the most obvious one; derive it from days to death, follow-up records and diagnosis records together, and state your derivation.
  Approximate analysable n: 594

## How to get the data

1. Download open derived molecular files from the GDC (1 hour)
   https://portal.gdc.cancer.gov/projects/TCGA-GBM
2. Add imaging from the Imaging Data Commons (1-2 hours)
   Openly available for the same patients, and the cohort's most under-used asset.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=tcga_gbm
3. Request controlled access only for sequence-level work (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Join the same patients across two NCI repositories (python, about two minutes)
  workbooks/python/05_cross_repository_linkage.py

## Evidence of prior reuse

- Articles that analyzed these data: 1399
- 112 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 2 of the 9 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 6091 (attention, not reuse)
- Reuse gap index: +1.37 (negative means less reused than comparable datasets)
  - Updating TCGA glioma classification through integration of molecular data following the latest WHO guidelines. (2025) PMID 40467633
  - Integrated pathway analysis identifies prognostically relevant subtypes of glioblastoma characterized by abnormalities in multi-omics. (2025) PMID 41292185
  - Tumor Electric Field Therapy Inhibits TGF-β/C1R Signaling Axis-Driven Epithelial-Mesenchymal Transition in Glioblastoma. (2026) PMID 41489302
  - Robust machine-learning based prognostic index using fatty acid metabolism genes predicts prognosis and therapy responses in glioblastoma. (2025) PMID 41049001
  - Robust Cluster Prediction Across Data Types Validates Association of Sex and Therapy Response in GBM. (2025) PMID 39941811

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-tcga-gbm.json
