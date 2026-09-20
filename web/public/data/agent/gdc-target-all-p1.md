# Acute Lymphoblastic Leukemia - Phase I

Dataset id: gdc-target-all-p1

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 24 cases
- Cancer types: Lymphoid Leukemias
- Subject: Lymphoid
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Clinical, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 49.5 months (derivable for 23 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Classification of tumor: 100.0% informative
- Sex at birth: 95.8% informative
- Ethnicity: 95.8% informative
- Vital status: 95.8% informative
- Treatment given: 95.8% informative
- Race: 87.5% informative
- Progression at follow-up: 62.5% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Tumor grade: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TARGET-ALL-P1
2. Download the open files without an account (minutes to hours, by cohort size)
   18 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   91 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000463. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000463
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000463

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TARGET-ALL-P1"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 14
- Citations to the dataset's publication: 259 (attention, not reuse)
- Reuse gap index: -0.28 (negative means less reused than comparable datasets)
  - Targeted &lt;i&gt;in silico&lt;/i&gt; characterization of fusion transcripts in tumor and normal tissues via FusionInspector. (2023) PMID 37323575
  - EBF1 and Pax5 safeguard leukemic transformation by limiting IL-7 signaling, Myc expression, and folate metabolism. (2020) PMID 33004416
  - RNA binding protein IGF2BP1 synergizes with ETV6-RUNX1 to drive oncogenic signaling in B-cell Acute Lymphoblastic Leukemia. (2023) PMID 37670323
  - An Alternatively Spliced Gain-of-Function NT5C2 Isoform Contributes to Chemoresistance in Acute Lymphoblastic Leukemia. (2024) PMID 39094066
  - Comprehensive profiling of mRNA splicing indicates that GC content signals altered cassette exon inclusion in Ewing sarcoma. (2022) PMID 35047826

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-target-all-p1.json
