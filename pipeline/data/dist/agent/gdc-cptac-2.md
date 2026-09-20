# CPTAC-Breast, Colon, Ovary

Dataset id: gdc-cptac-2

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 342 cases
- Cancer types: Not Reported, Cystic, Mucinous and Serous Neoplasms, Adenomas and Adenocarcinomas, Ductal and Lobular Neoplasms, Squamous Cell Neoplasms
- Subject: Colorectal and bowel, Breast, Ovary and fallopian tube
- Measurements: Whole exome sequencing, microRNA sequencing, Bulk RNA sequencing, Structural Variation
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Vital status: 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Classification of tumor: 0.0% informative
- Race: 96.8% informative
- Sex at birth: 96.5% informative
- Prior malignancy: 96.5% informative
- Primary diagnosis: 95.3% informative
- Morphology (ICD-O): 95.0% informative
- Ethnicity: 90.6% informative
- AJCC pathologic stage: 65.2% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/CPTAC-2
2. Download the open files without an account (minutes to hours, by cohort size)
   1,288 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   7,956 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000892. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000892
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000892

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["CPTAC-2"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 8
- Reuse gap index: -0.39 (negative means less reused than comparable datasets)
  - pyComBat, a Python tool for batch effects correction in high-throughput molecular data using empirical Bayes methods. (2023) PMID 38057718
  - Inflammatory reprogramming of the solid tumor microenvironment by infiltrating clonal hematopoiesis is associated with adverse outcomes. (2025) PMID 40037357
  - Prognostic relevance of HRDness gene expression signature in ovarian high-grade serous carcinoma; JGOG3025-TR2 study. (2023) PMID 36593360
  - T-Cell Infiltration and Clonality May Identify Distinct Survival Groups in Colorectal Cancer: Development and Validation of a Prognostic Model Based on The Cancer Genome Atlas (TCGA) and Clinical Proteomic Tumor Analysis Consortium (CPTAC). (2022) PMID 36497365
  - Alternate RNA decoding results in stable and abundant proteins in mammals. (2026) PMID 42343131

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-cptac-2.json
