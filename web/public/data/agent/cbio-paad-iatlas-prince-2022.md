# Metastatic Pancreatic Adenocarcinoma (PRINCE Trial, Nat Med. 2022) - iAtlas Harmonized

Dataset id: cbio-paad-iatlas-prince-2022

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 74 cases
- Cancer types: Pancreatic Adenocarcinoma
- Subject: Pancreas
- Measurements: Mutation calls (panel, exome or genome), RNA sequencing expression
- Median follow-up: 9.8 months (derivable for 73 cases)
- Treatment response recorded: True
- Access: open. Processed data download from the cBioPortal study page or its public REST API; no account required. Primary raw data remain wherever the original investigators deposited them.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Clinical Stage: 100.0% informative
- Ethnicity: 100.0% informative
- Oncotree Code: 100.0% informative
- Sex: 100.0% informative
- Overall Survival Status: 98.6% informative
- Progression-Free Status: 98.6% informative
- Overall Survival (Months): 98.6% populated (one-to-many)
- Progression-Free (Months): 98.6% populated (one-to-many)
- Race: 91.9% informative
- Response: 91.4% informative
- Clinical Benefit: 89.2% informative

## How to get the data

### For a person

1. Open the study in cBioPortal (5 minutes)
   Harmonized mutation, copy-number, expression and clinical files, open to anyone. Cite the original publication, and cite cBioPortal if the portal's harmonized files were used.
   https://www.cbioportal.org/study/summary?id=paad_iatlas_prince_2022
2. Download the whole study as a zip (minutes)
   The datasets page carries one zip per study: the same staging files the portal itself loads. The datahub S3 bucket that older guides quote is no longer readable anonymously.
   https://www.cbioportal.org/datasets
3. Or pull the staging files with git-lfs
   Useful when you want one study out of a version-controlled copy. Study folders are named by study id under public/.
   https://github.com/cBioPortal/datahub

   ```
   git lfs install --skip-repo --skip-smudge
   git clone https://github.com/cBioPortal/datahub.git && cd datahub
   git lfs install --local --skip-smudge
   git -c lfs.fetchexclude="" lfs pull -I public/paad_iatlas_prince_2022
   ```

### From code

4. Read the study straight off the REST API
   No key and no account; the API is rate-limited per address, so an agent sweeping many studies should pace itself.
   https://docs.cbioportal.org/web-api-and-clients/

   ```
   curl -s 'https://www.cbioportal.org/api/studies/paad_iatlas_prince_2022/clinical-data?clinicalDataType=PATIENT&projection=SUMMARY'
   ```

## Evidence of prior reuse

- This dataset has no accession specific enough to search for, so reuse cannot be traced through the literature. Absence of evidence here is not evidence of absence.

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/cbio-paad-iatlas-prince-2022.json
