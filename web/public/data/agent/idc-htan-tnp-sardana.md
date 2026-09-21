# HTAN-TNP-SARDANA

Dataset id: idc-htan-tnp-sardana

## Read this first: what these data CANNOT support

- IDC serves no clinical table for this collection, so nothing about outcome, stage, treatment or demographics can be read from the repository. Any such variable would have to come from the originating trial or publication.
  Rules out: survival, treatment response, stage-adjusted modelling, analysis by race or ethnicity

## What it is

- Cohort: 1 cases
- Cancer types: Colon Mucinous Adenocarcinoma
- Subject: Colorectal and bowel
- Measurements: DICOM medical imaging
- Access: open. Public DICOM download from the IDC portal, its API, or the idc-index Python package; no account required for public collections.

## How to get the data

1. Open the collection in the IDC portal [human] (5 minutes)
   Browse the series before downloading; imaging collections can be very large.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=htan_tnp_sardana
   Policy evidence: https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=htan_tnp_sardana
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
- Full structured record: https://cd2s.vercel.app/data/datasets/idc-htan-tnp-sardana.json
