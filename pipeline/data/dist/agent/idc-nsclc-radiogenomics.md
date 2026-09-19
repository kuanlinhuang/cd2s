# NSCLC Radiogenomics

Dataset id: idc-nsclc-radiogenomics
Summary: 211 non-small cell lung cancers with pre-surgical CT and PET/CT, semantic annotations, segmentations and matched gene expression - a genuinely paired imaging-genomics cohort, fully open, and described only in prose.

## Read this first: what these data CANNOT support

- The matched imaging-and-expression subset is a small fraction of the 211 imaged patients - the collection describes roughly 26 cases with microarray data. The cohort is imaging-rich and genomics-poor.
  Rules out: Predictive radiogenomic modeling, Genome-wide imaging-expression association
- Do not use for: Training a deep radiogenomic model end to end. (Around 26 paired cases is far too few; the result would not generalize.)
- Do not use for: Population-level claims about lung cancer imaging phenotypes. (Single-institution surgical series with no sampling frame.)

## What it is

- Cohort: 211 cases
- Cancer types: Non-small Cell Lung Cancer
- Measurements: DICOM medical imaging, Clinical (accompanying data, per IDC supporting_data), Genomics (accompanying data, per IDC supporting_data)
- Access: open. Public DICOM download from the IDC portal, its API, or the idc-index Python package; no account required for public collections.

## Questions these data can support

- Do quantitative CT or PET features predict gene expression programs in lung adenocarcinoma?
  Why: This is the defining radiogenomics question and it needs paired data on the same patients, which this collection provides for the subset with matched microarrays. Imaging is available for all 211.
  Statistical caution: The matched-expression subset described in the collection is around 26 patients, which supports hypothesis generation and feature-level correlation but not a validated predictive model. Confirm the exact overlap before designing.
  Approximate analysable n: 26
- How reproducible are radiomic features across CT and PET acquisitions of the same tumor?
  Why: Both modalities were acquired for the same patients pre-surgically, so feature stability across modality and acquisition can be assessed directly - a prerequisite for any radiomics claim and rarely testable.
  Statistical caution: Reproducibility is estimable at this sample size; report intraclass correlation.
  Approximate analysable n: 211
- Can models trained on this cohort's segmentations generalize to other lung imaging collections in the same repository?
  Why: Expert segmentations and semantic annotations are provided, and the Imaging Data Commons holds several other lung collections that can serve as external validation within one access framework.
  Approximate analysable n: 211

## How to get the data

1. Explore the collection in the Imaging Data Commons (30 minutes)
   Fully open. No account, no data access request.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=nsclc_radiogenomics
2. Pull DICOM with the idc-index Python package (1-2 hours)
3. Retrieve the matched expression series from GEO and verify the identifier join (2 hours)
   https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE28827

## Verified runnable starting points

- Join the same patients across two NCI repositories (python, about two minutes)
  workbooks/python/05_cross_repository_linkage.py

## Evidence of prior reuse

- Articles that analyzed these data: 3
- Citations to the dataset's publication: 202 (attention, not reuse)
- Reuse gap index: -5.63 (negative means less reused than comparable datasets)
  - Integrative analysis of imaging and transcriptomic data of the immune landscape associated with tumor metabolism in lung adenocarcinoma: Clinical and prognostic implications. (2018) PMID 29556367
  - Synergies of Radiomics and Transcriptomics in Lung Cancer Diagnosis: A Pilot Study. (2023) PMID 36832225
  - Radiogenomics Based on PET Imaging. (2020) PMID 32582396

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/idc-nsclc-radiogenomics.json
