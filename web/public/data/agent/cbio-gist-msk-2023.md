# Gastrointestinal Stromal Tumors (MSK, Clin Cancer Res 2023)

Dataset id: cbio-gist-msk-2023

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 469 cases
- Cancer types: Gastrointestinal Stromal Tumor
- Subject: Soft tissue
- Measurements: Mutation calls (panel, exome or genome), Copy number alterations, Structural variants / fusions
- Median follow-up: 39.6 months (derivable for 439 cases)
- Treatment response recorded: False
- Access: open. Processed data download from the cBioPortal study page or its public REST API; no account required. Primary raw data remain wherever the original investigators deposited them.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Oncotree Code: 100.0% informative
- Primary Site Group: 100.0% informative
- Recurrence Free Status: 100.0% informative
- Sex: 100.0% informative
- Recurrence Free Status (Months): 100.0% populated (one-to-many)
- Overall Survival Status: 99.4% informative
- Race Category: 95.5% informative
- Ethnicity Category: 93.6% informative
- Overall Survival (Months): 93.6% populated (one-to-many)

## How to get the data

1. Open the study in cBioPortal [human] (5 minutes)
   Harmonized molecular and clinical files are open. Cite the original publication, and cite cBioPortal if the portal's harmonized files were used.
   https://www.cbioportal.org/study/summary?id=gist_msk_2023
   Policy evidence: https://www.cbioportal.org/study/summary?id=gist_msk_2023
2. Download the whole study as a zip [human] (minutes)
   The datasets page carries the staging files used by the portal.
   https://www.cbioportal.org/datasets
   Policy evidence: https://www.cbioportal.org/datasets
3. Or pull the staging files with git-lfs [human]
   Study folders are named by study id under public/.
   https://github.com/cBioPortal/datahub
   Policy evidence: https://github.com/cBioPortal/datahub
4. Read the study straight from the REST API [agent]
   No key is required; pace requests when sweeping many studies.
   https://docs.cbioportal.org/web-api-and-clients/
   Policy evidence: https://docs.cbioportal.org/web-api-and-clients/

## Evidence of prior reuse

- This dataset has no accession specific enough to search for, so reuse cannot be traced through the literature. Absence of evidence here is not evidence of absence.

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/cbio-gist-msk-2023.json
