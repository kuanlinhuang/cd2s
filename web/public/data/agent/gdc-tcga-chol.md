# Cholangiocarcinoma

Dataset id: gdc-tcga-chol

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 51 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Biliary tract, Liver, Pancreas
- Measurements: Whole exome sequencing, Clinical, DICOM medical imaging, Whole genome sequencing, Somatic Structural Variation, Whole-slide diagnostic images, Bulk RNA sequencing, microRNA sequencing, SNP genotyping array (copy number, germline), DNA methylation array
- Median follow-up: 22.3 months (derivable for 48 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 94.1% informative
- Vital status: 94.1% informative
- Country of residence: 94.1% informative
- Primary diagnosis: 94.1% populated (one-to-many)
- Morphology (ICD-O): 94.1% populated (one-to-many)
- Tissue or organ of origin: 94.1% populated (one-to-many)
- AJCC pathologic stage: 94.1% populated (one-to-many)
- Tumor grade: 94.1% informative
- Prior treatment: 94.1% populated (one-to-many)
- Prior malignancy: 94.1% informative
- Synchronous malignancy: 94.1% informative
- Classification of tumor: 94.1% populated (one-to-many)
- Treatment type: 94.1% populated (one-to-many)
- Treatment given: 94.1% populated (one-to-many)
- Race: 92.2% informative
- Disease response at follow-up: 92.2% populated (one-to-many)
- Ethnicity: 88.2% informative
- ECOG performance status: 72.5% informative

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/TCGA-CHOL
2. Download the open files without an account (minutes to hours, by cohort size)
   1,171 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   2,000 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000178. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
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
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["TCGA-CHOL"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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
- Reuse gap index: +0.87 (negative means less reused than comparable datasets)
  - Integrative analyses of bulk and single-cell transcriptomics reveals the infiltration and crosstalk of cancer-associated fibroblasts as a novel predictor for prognosis and microenvironment remodeling in intrahepatic cholangiocarcinoma. (2024) PMID 38702814
  - Extrachromosomal circular DNA (eccDNA) characteristics in the bile and plasma of advanced perihilar cholangiocarcinoma patients and the construction of an eccDNA-related gene prognosis model. (2024) PMID 38903532
  - On-target off-tumor toxicity of claudin18.2-directed CAR-T cells in preclinical models. (2025) PMID 41176533
  - The correlation between LAG-3 expression and the efficacy of chemoimmunotherapy in advanced biliary tract cancer. (2025) PMID 39751894
  - New platinum derivatives selectively cause double-strand DNA breaks and death in naïve and cisplatin-resistant cholangiocarcinomas. (2025) PMID 40324694

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-chol.json
