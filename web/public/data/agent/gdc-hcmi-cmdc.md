# NCI Cancer Model Development for the Human Cancer Model Initiative

Dataset id: gdc-hcmi-cmdc
Summary: 805 next-generation cancer models - organoids and other patient-derived systems - with whole genome sequencing on 804 and the matched patient tumor, spanning many rare cancers.

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.
- Do not use for: Survival analysis. (Vital status is informative for 59% of cases, and progression is absent entirely.)
- Do not use for: Treating model results as clinical evidence. (Models are experimental systems; translational claims require clinical validation this resource does not contain.)

## What it is

- Cohort: 805 cases
- Cancer types: Ductal and Lobular Neoplasms, Complex Mixed and Stromal Neoplasms, Blood Vessel Tumors, Fibromatous Neoplasms, Epithelial Neoplasms, NOS, Mature T- and NK-Cell Lymphomas
- Subject: pan cancer
- Measurements: Clinical, Whole genome sequencing, Bulk RNA sequencing, Whole exome sequencing, DNA methylation array, Copy Number Variation, Somatic Structural Variation, microRNA sequencing, Whole-slide tissue images, DICOM medical imaging
- Median follow-up: 15.8 months (derivable for 544 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Tissue or organ of origin: 99.5% informative
- Prior treatment: 88.9% informative
- Tobacco smoking status: 87.1% informative
- Treatment type: 75.7% populated (one-to-many)
- Prior malignancy: 73.8% informative
- Progression at follow-up: 64.6% populated (one-to-many)
- Tumor grade: 60.9% informative
- Vital status: 59.3% informative
- Therapeutic agents: 55.9% populated (one-to-many)
- Disease response at follow-up: 52.4% informative
- Race: 45.2% informative
- Ethnicity: 43.5% informative
- AJCC pathologic stage: 41.0% informative

## Questions these data can support

- How faithfully do patient-derived models retain the genomics of their source tumor?
  Why: Models and their source tumors are both characterized, with near-complete whole genome coverage, which makes fidelity measurable rather than assumed. The answer determines how much any model-based result should be trusted.
  Statistical caution: Verify model and source tumor pairing per case; it is not uniform.
  Approximate analysable n: 721
- Can a usable model system be found for a rare cancer that currently has none?
  Why: Coverage spans many tumor types including rare ones. For a researcher working on a cancer with no established cell line, this is often the only route to any model at all, and it is the cohort's most practically valuable use.
  Statistical caution: Per-tumor-type counts are small; this is model discovery, not a powered comparison.
  Approximate analysable n: 805
- Does prior treatment of the donor shape the derived model's biology?
  Why: Prior treatment is informative for 88.9% of donors and treatment given is recorded for all, so models derived from treated and untreated patients can be compared - a question with direct bearing on how model-based drug screens should be interpreted.
  Approximate analysable n: 716

## How to get the data

1. Search the model catalog for your tumor type (1 hour)
   https://portal.gdc.cancer.gov/projects/HCMI-CMDC
2. Check model availability through the HCMI Searchable Catalog (1 hour)
   The data describe models; obtaining the physical model is a separate step.
   https://ocg.cancer.gov/programs/HCMI
3. Submit a dbGaP data access request for sequence data (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Join the same patients across two NCI repositories (python, about two minutes)
  workbooks/python/05_cross_repository_linkage.py

## Evidence of prior reuse

- Articles that analyzed these data: 6
- 16 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 3 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -2.15 (negative means less reused than comparable datasets)
  - Patient-Derived Triple-Negative Breast Cancer Organoids Provide Robust Model Systems That Recapitulate Tumor Intrinsic Characteristics. (2022) PMID 35180770
  - Revolutionizing healthcare and medicine: The impact of modern technologies for a healthier future-A comprehensive review. (2024) PMID 39479277
  - Oncofetal reprogramming drives phenotypic plasticity in WNT-dependent colorectal cancer. (2025) PMID 39930084
  - Weight-bearing activity impairs nuclear membrane and genome integrity via YAP activation in plantar melanoma. (2022) PMID 35468978
  - Insight into the Regulation of NDRG1 Expression. (2025) PMID 40332138

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-hcmi-cmdc.json
