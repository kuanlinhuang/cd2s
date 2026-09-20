# Genomic Characterization CS-MATCH-0007 Arm Z1D

Dataset id: gdc-match-z1d

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 36 cases
- Cancer types: Neoplasms, NOS, Cystic, Mucinous and Serous Neoplasms, Complex Mixed and Stromal Neoplasms, Adenomas and Adenocarcinomas, Gliomas, Myomatous Neoplasms
- Subject: pan cancer
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Clinical, Structural Variation
- Treatment response recorded: False
- Access: controlled. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 0.0% informative
- Ethnicity: 0.0% informative
- Vital status: 0.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 0.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/MATCH-Z1D
2. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   891 controlled-access files hold sequence-level data and are released only under an approved data access request for phs001859. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs001859
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
3. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001859

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

4. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["MATCH-Z1D"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
     --data-urlencode 'fields=file_id,file_name,data_type' \
     --data-urlencode 'size=10000' \
     --data-urlencode 'format=TSV' > files.tsv
   ```
5. Pass the token when the agent needs controlled files
   Without a token the same endpoints return the open subset and HTTP 200. An agent that treats a short result as the whole cohort will silently under-count; filter on access and compare against the counts on this page.
   Requires: GDC authentication token
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -H "X-Auth-Token: $GDC_TOKEN" \
     'https://api.gdc.cancer.gov/data/<file_id>' -o file.bam
   ```

## Evidence of prior reuse

- Articles that analyzed these data: 1
- Reuse gap index: +0.19 (negative means less reused than comparable datasets)

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-match-z1d.json
