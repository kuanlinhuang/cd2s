# CPTAC-COAD

Dataset id: idc-cptac-coad

## Read this first: what these data CANNOT support

- IDC serves no clinical table for this collection, so nothing about outcome, stage, treatment or demographics can be read from the repository. Any such variable would have to come from the originating trial or publication. The collection's own supporting_data field nevertheless lists clinical data, so the two disagree.
  Rules out: survival, treatment response, stage-adjusted modelling, analysis by race or ethnicity

## What it is

- Cohort: 178 cases
- Cancer types: Colon Cancer
- Subject: Colorectal and bowel
- Measurements: DICOM medical imaging, Clinical (accompanying data, per IDC supporting_data), Genomics (accompanying data, per IDC supporting_data), Proteomics (accompanying data, per IDC supporting_data)
- Access: open. Public DICOM download from the IDC portal, its API, or the idc-index Python package; no account required for public collections.

## Evidence of prior reuse

- This dataset has no accession specific enough to search for, so reuse cannot be traced through the literature. Absence of evidence here is not evidence of absence.

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/idc-cptac-coad.json
