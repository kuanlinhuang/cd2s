# Pheochromocytoma and Paraganglioma

Dataset id: gdc-tcga-pcpg

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 179 cases
- Cancer types: Paragangliomas and Glomus Tumors
- Subject: Adrenal gland
- Measurements: Bulk RNA sequencing, Whole exome sequencing, microRNA sequencing, SNP genotyping array (copy number, germline), DNA methylation array, Whole-slide tissue images, Clinical, DICOM medical imaging, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 24.8 months (derivable for 179 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Country of residence: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Treatment type: 100.0% populated (one-to-many)
- Treatment given: 100.0% populated (one-to-many)
- Disease response at follow-up: 100.0% populated (one-to-many)
- Prior malignancy: 98.3% informative
- Synchronous malignancy: 98.3% informative
- Race: 97.8% informative
- Ethnicity: 79.9% informative
- ECOG performance status: 34.1% informative
- Progression at follow-up: 6.1% informative
- Therapeutic agents: 3.4% populated (one-to-many)

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TCGA-PCPG
2. Download the open files without an account (minutes to hours, by cohort size)
   4,555 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   7,373 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000178. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
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
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TCGA-PCPG"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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
- Reuse gap index: +0.27 (negative means less reused than comparable datasets)
  - mTORC1 upregulates B7-H3/CD276 to inhibit antitumor T cells and drive tumor immune evasion. (2023) PMID 36869048
  - IL-33-activated ILC2s induce tertiary lymphoid structures in pancreatic cancer. (2025) PMID 39814891
  - DIANA-miTED: a microRNA tissue expression database. (2022) PMID 34469540
  - A cfDNA methylation-based tissue-of-origin classifier for cancers of unknown primary. (2024) PMID 38632274
  - Single-nuclei and bulk-tissue gene-expression analysis of pheochromocytoma and paraganglioma links disease subtypes with tumor microenvironment. (2022) PMID 36271074

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-pcpg.json
