# Clear Cell Sarcoma of the Kidney

Dataset id: gdc-target-ccsk

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 13 cases
- Cancer types: Complex Mixed and Stromal Neoplasms
- Subject: Kidney
- Measurements: Whole genome sequencing, Bulk RNA sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Clinical, Structural Variation
- Median follow-up: 71.9 months (derivable for 13 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 100.0% informative
- Ethnicity: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Classification of tumor: 100.0% informative
- Treatment given: 100.0% informative
- Cause of death: 30.8% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TARGET-CCSK
2. Download the open files without an account (minutes to hours, by cohort size)
   72 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   113 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000466. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000466
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000466

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TARGET-CCSK"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 4
- Citations to the dataset's publication: 119 (attention, not reuse)
- Reuse gap index: -2.25 (negative means less reused than comparable datasets)
  - Targeted &lt;i&gt;in silico&lt;/i&gt; characterization of fusion transcripts in tumor and normal tissues via FusionInspector. (2023) PMID 37323575
  - TCF21 hypermethylation in genetically quiescent clear cell sarcoma of the kidney. (2015) PMID 26158413
  - Loss of DHX36/G4R1, a G4 resolvase, drives genome instability and regulates innate immune gene expression in cancer cells. (2025) PMID 40598896
  - The nuclear export protein XPO1 provides a peptide ligand for natural killer cells. (2024) PMID 39178254
  - GPC2 provides prognostic value in pan-pediatric cancers and is associated with MYCN amplification in neuroblastoma: bioinformatics analysis and validation. (2026) PMID 41840507

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-ccsk.json
