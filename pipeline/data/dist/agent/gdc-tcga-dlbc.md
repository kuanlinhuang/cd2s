# Lymphoid Neoplasm Diffuse Large B-cell Lymphoma

Dataset id: gdc-tcga-dlbc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 58 cases
- Cancer types: Not Reported, Mature B-Cell Lymphomas
- Subject: Lymphoid
- Measurements: Clinical, SNP genotyping array (copy number, germline), Bulk RNA sequencing, Whole exome sequencing, DNA methylation array, DICOM medical imaging, microRNA sequencing, Whole-slide tissue images, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 26.7 months (derivable for 48 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 82.8% informative
- Race: 82.8% informative
- Ethnicity: 82.8% informative
- Vital status: 82.8% informative
- Country of residence: 82.8% informative
- Primary diagnosis: 82.8% populated (one-to-many)
- Morphology (ICD-O): 82.8% populated (one-to-many)
- Tissue or organ of origin: 82.8% populated (one-to-many)
- Prior treatment: 82.8% populated (one-to-many)
- Prior malignancy: 82.8% informative
- Synchronous malignancy: 82.8% informative
- Classification of tumor: 82.8% populated (one-to-many)
- Treatment type: 82.8% populated (one-to-many)
- Treatment given: 82.8% populated (one-to-many)
- Disease response at follow-up: 82.8% populated (one-to-many)
- Therapeutic agents: 74.1% populated (one-to-many)
- Regimen or line of therapy: 72.4% populated (one-to-many)
- ECOG performance status: 53.4% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TCGA-DLBC
2. Download the open files without an account (minutes to hours, by cohort size)
   1,232 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   1,942 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000178. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000178
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000178

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TCGA-DLBC"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
     --data-urlencode 'fields=file_id,file_name,data_type' \
     --data-urlencode 'size=10000' \
     --data-urlencode 'format=TSV' > files.tsv
   ```
6. Pass the token when the agent needs controlled files
   Without a token the same endpoints return the open subset and HTTP 200. An agent that treats a short result as the whole cohort will silently under-count; filter on access and compare against the counts on this page.
   Requires: GDC authentication token
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -H "X-Auth-Token: $GDC_TOKEN" \
     'https://api.gdc.cancer.gov/data/<file_id>' -o file.bam
   ```

## Evidence of prior reuse

- Articles that analyzed these data: 395
- Reuse gap index: +1.02 (negative means less reused than comparable datasets)
  - Predicting lymphoma prognosis using machine learning-based genes associated with lactylation. (2024) PMID 39146596
  - 5-Hydroxymethylcytosine profiles of cfDNA are highly predictive of R-CHOP treatment response in diffuse large B cell lymphoma patients. (2021) PMID 33573703
  - An integrative analysis reveals cancer risk associated with artificial sweeteners. (2025) PMID 39780215
  - Gene expression profiles analysis identifies a novel two-gene signature to predict overall survival in diffuse large B-cell lymphoma. (2019) PMID 30393234
  - Pan-cancer analysis reveals IL32 is a potential prognostic and immunotherapeutic biomarker in cancer. (2024) PMID 38584169

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-dlbc.json
