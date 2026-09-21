# Unclassified Renal Cell Carcinoma (MSK, Nature 2016)

Dataset id: cbio-urcc-mskcc-2016

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 62 cases
- Cancer types: Unclassified Renal Cell Carcinoma
- Subject: Kidney
- Measurements: Mutation calls (panel, exome or genome), Copy number alterations
- Median follow-up: 11.9 months (derivable for 23 cases)
- Treatment response recorded: False
- Access: open. Processed data download from the cBioPortal study page or its public REST API; no account required. Primary raw data remain wherever the original investigators deposited them.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Disease Free Status: 100.0% informative
- Oncotree Code: 100.0% informative
- Overall Survival Status: 100.0% informative
- Primary Tumor Site: 100.0% informative
- Sex: 100.0% informative
- Race Category: 96.8% informative
- Disease Free (Months): 96.8% populated (one-to-many)
- Overall Survival (Months): 37.1% populated (one-to-many)

## How to get the data

1. Open the study in cBioPortal [human] (5 minutes)
   Harmonized molecular and clinical files are open. Cite the original publication, and cite cBioPortal if the portal's harmonized files were used.
   https://www.cbioportal.org/study/summary?id=urcc_mskcc_2016
   Policy evidence: https://www.cbioportal.org/study/summary?id=urcc_mskcc_2016
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
- Full structured record: https://cd2s.vercel.app/data/datasets/cbio-urcc-mskcc-2016.json
