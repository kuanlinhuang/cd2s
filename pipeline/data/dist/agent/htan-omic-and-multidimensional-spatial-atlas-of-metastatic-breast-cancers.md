# Omic and Multidimensional Spatial Atlas of Metastatic Breast Cancers

Dataset id: htan-omic-and-multidimensional-spatial-atlas-of-metastatic-breast-cancers
Summary: Serial biopsies from metastatic breast cancer patients measured nine ways including electron microscopy, Visium spatial transcriptomics, multiplexed imaging and single-cell ATAC - 120,000 files, and the only electron microscopy in the corpus.

## Read this first: what these data CANNOT support

- Deep serial profiling means few patients. File counts are large but participant numbers are small, and the portal metadata we ingest does not expose them.
  Rules out: Cohort-level association, Biomarker discovery, Any powered comparison
- Do not use for: Population-level or cohort-level statistical inference. (The design is deep serial sampling of few patients, not a representative cohort.)
- Do not use for: Assuming all nine modalities are available for every specimen. (Coverage varies by biopsy and by level; the intersection is much smaller than the union.)

## What it is

- Cohort size not published
- Measurements: Electron microscopy, Multiplexed tissue imaging, Bulk DNA sequencing, Bulk RNA sequencing, Single-cell ATAC sequencing, Single-cell / single-nucleus RNA sequencing, Reverse phase protein array, NanoString GeoMx spatial profiling, Other assay
- Access: mixed. Level 1-2 sequencing data are controlled through dbGaP; level 3-4 derived data and most imaging are downloadable from Synapse after registering and accepting the HTAN data use terms.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Diagnosis: None% populated (one-to-many)
- Exposure history: None% populated (one-to-many)
- Family history: None% populated (one-to-many)
- Follow-up: None% populated (one-to-many)
- Therapy: None% populated (one-to-many)
- Clinical molecular test: None% populated (one-to-many)
- Demographics: None% populated (one-to-many)

## Questions these data can support

- How does the spatial organization of a metastatic tumor change as it acquires resistance to therapy?
  Why: Serial biopsies with multiplexed imaging and spatial transcriptomics on the same patients across treatment, with therapy and follow-up clinical components present. This longitudinal spatial design is essentially unique in public data.
  Statistical caution: Patient numbers are small by design - deep serial sampling trades breadth for depth. Treat this as a case-series design with within-patient comparison, not a cohort study.
- Do single-cell chromatin accessibility changes precede the transcriptional changes that accompany resistance?
  Why: Single-cell ATAC and single-cell RNA on the same serial samples allow regulatory and transcriptional state to be ordered in time within a patient.
- Can ultrastructural features from electron microscopy be related to molecular state measured on the same tissue?
  Why: Electron microscopy appears in no other dataset in this corpus. Linking ultrastructure to spatial and single-cell molecular data on the same specimens is possible only here.
  Statistical caution: Descriptive and mechanistic rather than statistically powered.
- How do multiplexed imaging and spatial transcriptomics agree when applied to the same tissue section?
  Why: Both assays are present on shared specimens, which makes cross-platform concordance measurable - a methodological question the spatial field needs answered and rarely can.

## How to get the data

1. Explore the atlas in the HTAN Data Portal (1 hour)
   https://humantumoratlas.org/explore
2. Register with Synapse and accept the HTAN data use terms (1 day)
   This unlocks the level 3 and 4 derived data and most imaging without a formal data access request.
   https://humantumoratlas.org/data-access
3. Request dbGaP access only if you need level 1 or 2 sequence data (days to a few weeks)
   https://humantumoratlas.org/data-access

## Evidence of prior reuse

- Articles that analyzed these data: 0
- Citations to the dataset's publication: 40 (attention, not reuse)

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/htan-omic-and-multidimensional-spatial-atlas-of-metastatic-breast-cancers.json
