# Osteosarcoma

Dataset id: gdc-target-os

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 383 cases
- Cancer types: Osseous and Chondromatous Neoplasms
- Subject: Bone
- Measurements: Whole exome sequencing, Whole genome sequencing, Bulk RNA sequencing, Targeted DNA panel sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Clinical, Somatic Structural Variation
- Median follow-up: 36.5 months (derivable for 277 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 79.6% informative
- Primary diagnosis: 79.6% informative
- Morphology (ICD-O): 79.6% informative
- Classification of tumor: 76.5% informative
- Tissue or organ of origin: 73.6% informative
- Vital status: 72.1% informative
- Treatment given: 68.4% informative
- Race: 66.1% informative
- Ethnicity: 52.7% informative
- Progression at follow-up: 32.9% informative
- Therapeutic agents: 13.1% populated (one-to-many)
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TARGET-OS
2. Download the open files without an account (minutes to hours, by cohort size)
   708 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   3,606 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000468. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000468
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000468

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TARGET-OS"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 266
- Citations to the dataset's publication: 7 (attention, not reuse)
- Reuse gap index: -0.10 (negative means less reused than comparable datasets)
  - Pan-cancer genome and transcriptome analyses of 1,699 paediatric leukaemias and solid tumours. (2018) PMID 29489755
  - Metabolic control of CD47 expression through LAT2-mediated amino acid uptake promotes tumor immune evasion. (2022) PMID 36274066
  - Immune determinants of CAR-T cell expansion in solid tumor patients receiving GD2 CAR-T cell therapy. (2024) PMID 38134936
  - Immuno-transcriptomic profiling of extracranial pediatric solid malignancies. (2021) PMID 34818552
  - Targeted &lt;i&gt;in silico&lt;/i&gt; characterization of fusion transcripts in tumor and normal tissues via FusionInspector. (2023) PMID 37323575

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-os.json
