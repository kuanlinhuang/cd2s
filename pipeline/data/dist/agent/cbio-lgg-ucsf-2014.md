# Low-Grade Gliomas (UCSF, Science 2014)

Dataset id: cbio-lgg-ucsf-2014

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 23 cases
- Cancer types: Diffuse Glioma
- Subject: Brain and central nervous system
- Measurements: Mutation calls (panel, exome or genome), Structured treatment records
- Median follow-up: 74.0 months (derivable for 23 cases)
- Treatment response recorded: False
- Access: open. Processed data download from the cBioPortal study page or its public REST API; no account required. Primary raw data remain wherever the original investigators deposited them.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Neoplasm Histologic Grade: 100.0% informative
- Oncotree Code: 100.0% informative
- Sex: 100.0% informative
- Overall Survival (Months): 100.0% populated (one-to-many)
- Overall Survival Status: 95.7% informative
- Named therapeutic agents: 43.5% populated (one-to-many)

## How to get the data

1. Open the study in cBioPortal [human] (5 minutes)
   Harmonized molecular and clinical files are open. Cite the original publication, and cite cBioPortal if the portal's harmonized files were used.
   https://www.cbioportal.org/study/summary?id=lgg_ucsf_2014
   Policy evidence: https://www.cbioportal.org/study/summary?id=lgg_ucsf_2014
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
- Full structured record: https://cd2s.vercel.app/data/datasets/cbio-lgg-ucsf-2014.json
