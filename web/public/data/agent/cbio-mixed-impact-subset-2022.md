# Pan-Cancer MSK-IMPACT MET Validation Cohort (MSK 2022)

Dataset id: cbio-mixed-impact-subset-2022

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 69 cases
- Cancer types: Mixed Cancer Types
- Subject: pan cancer
- Measurements: Mutation calls (panel, exome or genome), Copy number alterations
- Median follow-up: 17.9 months (derivable for 67 cases)
- Treatment response recorded: False
- Access: open. Processed data download from the cBioPortal study page or its public REST API; no account required. Primary raw data remain wherever the original investigators deposited them.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Oncotree Code: 100.0% informative
- Primary Tumor Site: 98.6% informative
- Overall Survival Status: 97.1% informative
- Sex: 97.1% informative
- Overall Survival (Months): 97.1% populated (one-to-many)
- Race Category: 95.7% informative
- Ethnicity Category: 92.8% informative
- Disease Free Status: 5.8% informative
- Disease Free (Months): 2.9% populated (one-to-many)

## How to get the data

1. Open the study in cBioPortal [human] (5 minutes)
   Harmonized molecular and clinical files are open. Cite the original publication, and cite cBioPortal if the portal's harmonized files were used.
   https://www.cbioportal.org/study/summary?id=mixed_impact_subset_2022
   Policy evidence: https://www.cbioportal.org/study/summary?id=mixed_impact_subset_2022
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
- Full structured record: https://cd2s.vercel.app/data/datasets/cbio-mixed-impact-subset-2022.json
