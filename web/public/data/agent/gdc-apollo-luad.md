# APOLLO1: Proteogenomic characterization of lung adenocarcinoma

Dataset id: gdc-apollo-luad

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 87 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Lung
- Measurements: Bulk RNA sequencing, Whole genome sequencing, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 50.4 months (derivable for 86 cases)
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Race: 100.0% informative
- Ethnicity: 0.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% informative
- Morphology (ICD-O): 100.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 100.0% informative
- Tobacco smoking status: 100.0% informative
- AJCC pathologic stage: 97.7% informative
- Treatment type: 58.6% populated (one-to-many)
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/APOLLO-LUAD
2. Download the open files without an account (minutes to hours, by cohort size)
   340 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   1,805 controlled-access files hold sequence-level data and are released only under an approved data access request for phs003011. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs003011
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs003011

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["APOLLO-LUAD"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 3
- Citations to the dataset's publication: 73 (attention, not reuse)
- Reuse gap index: +0.14 (negative means less reused than comparable datasets)
  - Amplified dosage of the NKX2-1 lineage transcription factor controls its oncogenic role in lung adenocarcinoma. (2025) PMID 40139189
  - Morphological basis of the lung adenocarcinoma subtypes. (2024) PMID 38706836
  - Multi-omics protein signaling networks identify sex-specific therapeutic candidates in lung adenocarcinoma. (2025) PMID 41024254
  - Single nucleotide polymorphism rs4961 in the adducin 1 gene is not associated with gastric cancer or preneoplastic cancer lesions. (2024) PMID 39100993
  - Global impact of somatic structural variation on the cancer proteome. (2023) PMID 37704602

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-apollo-luad.json
