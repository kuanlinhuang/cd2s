# Acute Lymphoblastic Leukemia - Phase II

Dataset id: gdc-target-all-p2

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 1,587 cases
- Cancer types: Lymphoid Leukemias
- Subject: Lymphoid
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Whole genome sequencing, microRNA sequencing, SNP genotyping array (copy number, germline), Clinical, Somatic Structural Variation
- Median follow-up: 92.7 months (derivable for 1570 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Tissue or organ of origin: 100.0% informative
- Primary diagnosis: 99.9% informative
- Morphology (ICD-O): 99.9% informative
- Sex at birth: 99.6% informative
- Vital status: 99.1% informative
- Ethnicity: 94.6% informative
- Race: 86.6% informative
- Classification of tumor: 65.2% informative
- Treatment given: 64.8% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Progression at follow-up: 13.7% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TARGET-ALL-P2
2. Download the open files without an account (minutes to hours, by cohort size)
   2,408 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   15,785 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000464. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000464
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000464

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TARGET-ALL-P2"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 42
- Citations to the dataset's publication: 761 (attention, not reuse)
- Reuse gap index: -1.20 (negative means less reused than comparable datasets)
  - 14q32 rearrangements deregulating BCL11B mark a distinct subgroup of T-lymphoid and myeloid immature acute leukemia. (2021) PMID 33876209
  - Survival Genie, a web platform for survival analysis across pediatric and adult cancers. (2022) PMID 35197510
  - Targeting Pim kinases in hematological cancers: molecular and clinical review. (2023) PMID 36694243
  - The enhancer RNA <i>ARIEL</i> activates the oncogenic transcriptional program in T-cell acute lymphoblastic leukemia. (2019) PMID 31076442
  - 13q12.2 deletions in acute lymphoblastic leukemia lead to upregulation of FLT3 through enhancer hijacking. (2020) PMID 32384149

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-all-p2.json
