# UPENN-GBM

Dataset id: idc-upenn-gbm

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 630 cases
- Cancer types: Glioblastoma
- Subject: Brain and central nervous system
- Measurements: DICOM medical imaging, Clinical (accompanying data, per IDC supporting_data)
- Access: open. Public DICOM download from the IDC portal, its API, or the idc-index Python package; no account required for public collections.

## How to get the data

1. Open the collection in the IDC portal [human] (5 minutes)
   Browse the series before downloading; imaging collections can be very large.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=upenn_gbm
   Policy evidence: https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=upenn_gbm
2. Read the collection's own licence [human] (5 minutes)
   Per-collection license, typically CC BY 3.0/4.0 or CC BY-NC. IDC licences differ by collection.
   https://www.cancerimagingarchive.net/data-usage-policies-and-restrictions/
   Policy evidence: https://www.cancerimagingarchive.net/data-usage-policies-and-restrictions/
3. Download with idc-index [human] (hours for a full collection)
   The package resolves the collection to its buckets and pulls selected data.
   https://github.com/ImagingDataCommons/idc-index
   Policy evidence: https://github.com/ImagingDataCommons/idc-index
4. List the series before pulling pixels [agent]
   List modality and size first so an agent can choose what to fetch.
   https://learn.canceridc.dev/
   Policy evidence: https://learn.canceridc.dev/

## Evidence of prior reuse

- This dataset has no accession specific enough to search for, so reuse cannot be traced through the literature. Absence of evidence here is not evidence of absence.

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/idc-upenn-gbm.json
