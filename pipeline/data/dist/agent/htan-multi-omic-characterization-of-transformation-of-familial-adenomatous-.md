# Multi-omic Characterization of Transformation of Familial Adenomatous Polyposis

Dataset id: htan-multi-omic-characterization-of-transformation-of-familial-adenomatous-

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 40 cases
- Subject: Colorectal and bowel (derived from title; not stated by repository)
- Measurements: Multiplexed tissue imaging, Mass spectrometry proteomics, Bulk DNA sequencing, Single-cell ATAC sequencing, Single-cell / single-nucleus RNA sequencing, Bulk RNA sequencing, Hi-C chromatin conformation
- Access: mixed. Level 1-2 sequencing data are controlled through dbGaP; level 3-4 derived data and most imaging are downloadable from Synapse after registering and accepting the HTAN data use terms.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Demographics: 100.0% populated (one-to-many)
- Diagnosis: 40.0% populated (one-to-many)
- Exposure history: 40.0% populated (one-to-many)
- Family history: 40.0% populated (one-to-many)
- Follow-up: 40.0% populated (one-to-many)
- Therapy: 40.0% populated (one-to-many)

## How to get the data

### For a person

1. Register at Synapse and accept the HTAN terms (15 minutes)
   One free account covers the whole atlas. The terms are click-through; they are not a data access request.
   Requires: Synapse account
   https://humantumoratlas.org/data-access
2. Download the level 3-4 files from Synapse (minutes to hours)
   Derived data and most imaging come down directly once the terms are accepted.
   https://help.synapse.org/docs/Getting-Started.2055471150.html

   ```
   synapse get syn39282161
   ```
3. Request level 1-2 sequencing through dbGaP (days to a few weeks)
   Raw and aligned sequencing is controlled, on the same footing as any other genomic data. Derived analyses rarely need it.
   Requires: eRA Commons account, approved dbGaP request
   https://humantumoratlas.org/data-access

### From code

4. Give the agent a Synapse token, not a password
   Unauthenticated calls return metadata and nothing to download, so an agent reports an empty atlas rather than a permission error.
   Requires: SYNAPSE_AUTH_TOKEN
   https://help.synapse.org/docs/Getting-Started.2055471150.html

   ```
   export SYNAPSE_AUTH_TOKEN=...
   python -c "import synapseclient; syn = synapseclient.login(); print(syn.get('syn39282161', downloadFile=False).name)"
   ```

## Evidence of prior reuse

- Articles that analyzed these data: 0
- Citations to the dataset's publication: 294 (attention, not reuse)
- Reuse gap index: -2.39 (negative means less reused than comparable datasets)

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/htan-multi-omic-characterization-of-transformation-of-familial-adenomatous-.json
