# HTAN-VANDERBILT

Dataset id: idc-htan-vanderbilt

## Read this first: what these data CANNOT support

- IDC serves no clinical table for this collection, so nothing about outcome, stage, treatment or demographics can be read from the repository. Any such variable would have to come from the originating trial or publication.
  Rules out: survival, treatment response, stage-adjusted modelling, analysis by race or ethnicity

## What it is

- Cohort: 30 cases
- Cancer types: Colon Precancer
- Subject: Colorectal and bowel
- Measurements: DICOM medical imaging
- Access: open. Public DICOM download from the IDC portal, its API, or the idc-index Python package; no account required for public collections.

## How to get the data

### For a person

1. Open the collection in the IDC portal (5 minutes)
   Imaging is public and stays in DICOM. Browse the series before downloading; collections run to terabytes.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=htan_vanderbilt
2. Read the collection's own licence (5 minutes)
   Per-collection license, typically CC BY 3.0/4.0 or CC BY-NC. IDC licences differ by collection, and a non-commercial clause on one collection does not travel to the next.
   https://www.cancerimagingarchive.net/data-usage-policies-and-restrictions/
3. Download with idc-index (hours for a full collection)
   The package resolves the collection to its buckets and pulls them with s5cmd. No account, no cloud project.
   https://github.com/ImagingDataCommons/idc-index

   ```
   pip install idc-index
   python -c "from idc_index import IDCClient; IDCClient().download_from_selection(collection_id='htan_vanderbilt', downloadDir='.')"
   ```

### From code

4. List the series before pulling any pixels
   One row per DICOM series, with modality and size, so an agent can decide what to fetch instead of fetching everything.
   https://learn.canceridc.dev/

   ```
   python -c "from idc_index import IDCClient; df = IDCClient().get_series(collection_id='htan_vanderbilt'); print(len(df), df['Modality'].value_counts().to_dict())"
   ```

## Evidence of prior reuse

- This dataset has no accession specific enough to search for, so reuse cannot be traced through the literature. Absence of evidence here is not evidence of absence.

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/idc-htan-vanderbilt.json
