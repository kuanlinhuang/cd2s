# VA Research Precision Oncology Program

Dataset id: gdc-varepop-apollo

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 41 cases
- Cancer types: Epithelial Neoplasms, NOS, Squamous Cell Neoplasms
- Subject: pan cancer
- Measurements: DICOM medical imaging, Targeted DNA panel sequencing
- Median follow-up: 13.2 months (derivable for 7 cases)
- Treatment response recorded: False
- Access: controlled. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Ethnicity: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% informative
- Alcohol history: 100.0% informative
- Classification of tumor: 85.7% informative
- AJCC clinical stage: 71.4% informative
- Prior malignancy: 71.4% informative
- Progression or recurrence: 71.4% informative
- Last known disease status: 71.4% informative
- Therapeutic agents: 71.4% informative
- Tumor grade: 57.1% informative
- Race: 42.9% informative
- Cause of death: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/VAREPOP-APOLLO
2. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   42 controlled-access files hold sequence-level data and are released only under an approved data access request for phs001374. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs001374
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
3. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs001374

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

4. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["VAREPOP-APOLLO"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 2
- Citations to the dataset's publication: 9 (attention, not reuse)
- Reuse gap index: -1.58 (negative means less reused than comparable datasets)
  - FocusedON-BC: A Robust Deep Learning Framework for Automated Body Composition Assessment. (2026) PMID 42124078

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-varepop-apollo.json
