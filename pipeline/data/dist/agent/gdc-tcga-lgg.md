# Brain Lower Grade Glioma

Dataset id: gdc-tcga-lgg

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 516 cases
- Cancer types: Gliomas
- Subject: Brain and central nervous system
- Measurements: Bulk RNA sequencing, Whole exome sequencing, DNA methylation array, Clinical, DICOM medical imaging, SNP genotyping array (copy number, germline), Whole-slide tissue images, microRNA sequencing, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 22.3 months (derivable for 514 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- Sex at birth: 99.8% informative
- Vital status: 99.8% informative
- Treatment type: 99.8% populated (one-to-many)
- Treatment given: 99.8% populated (one-to-many)
- Tumor grade: 99.6% informative
- Prior malignancy: 99.4% informative
- Synchronous malignancy: 99.4% informative
- Country of residence: 99.2% informative
- Race: 97.9% informative
- Disease response at follow-up: 97.1% populated (one-to-many)
- Ethnicity: 93.2% informative
- Therapeutic agents: 55.2% populated (one-to-many)
- Treatment outcome: 53.1% populated (one-to-many)

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TCGA-LGG
2. Download the open files without an account (minutes to hours, by cohort size)
   13,047 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   20,679 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000178. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
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
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TCGA-LGG"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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

- Articles that analyzed these data: 707
- Reuse gap index: +0.60 (negative means less reused than comparable datasets)
  - On-target off-tumor toxicity of claudin18.2-directed CAR-T cells in preclinical models. (2025) PMID 41176533
  - Updating TCGA glioma classification through integration of molecular data following the latest WHO guidelines. (2025) PMID 40467633
  - Multimodal Explainable Artificial Intelligence for Prognostic Stratification of Patients With Glioblastoma. (2025) PMID 40419087
  - Passenger mutations link cellular origin and transcriptional identity in human lung adenocarcinomas. (2025) PMID 41310231
  - Alternative splicing generates HER2 isoform diversity underlying antibody-drug conjugate resistance in breast cancer. (2025) PMID 40664477

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-lgg.json
