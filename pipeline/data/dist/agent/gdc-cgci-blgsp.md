# Burkitt Lymphoma Genome Sequencing Project

Dataset id: gdc-cgci-blgsp

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 388 cases
- Cancer types: Mature B-Cell Lymphomas
- Subject: Lymphoid
- Measurements: DICOM medical imaging, Whole-slide tissue images, Clinical, Bulk RNA sequencing, microRNA sequencing, Whole genome sequencing, Targeted DNA panel sequencing, Somatic Structural Variation, Copy Number Variation
- Median follow-up: 15.7 months (derivable for 281 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 99.7% informative
- Classification of tumor: 89.8% informative
- Treatment type: 89.8% populated (one-to-many)
- Treatment given: 89.8% populated (one-to-many)
- Tissue or organ of origin: 89.5% informative
- Primary diagnosis: 89.2% informative
- Prior treatment: 86.7% informative
- Prior malignancy: 86.7% informative
- Disease response at follow-up: 86.1% populated (one-to-many)
- Morphology (ICD-O): 85.5% informative
- Synchronous malignancy: 85.2% informative
- Vital status: 81.8% informative
- Race: 69.4% informative
- ECOG performance status: 63.0% informative
- Treatment outcome: 53.1% populated (one-to-many)
- Ethnicity: 52.5% informative
- Therapeutic agents: 43.2% populated (one-to-many)
- Regimen or line of therapy: 42.3% populated (one-to-many)

## How to get the data

### For a person

1. Open the project in the GDC Data Portal (5 minutes)
   The portal is the authority on how many cases and files this project currently holds. Check those counts against the ones on this page before requesting anything.
   https://portal.gdc.cancer.gov/projects/CGCI-BLGSP
2. Download the open files without an account (minutes to hours, by cohort size)
   4,906 open-access files are open access: no login, no request. Add them to the portal cart to get a manifest, then fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool

   ```
   gdc-client download -m gdc_manifest.txt
   ```
3. Request controlled access through dbGaP (days to a few weeks after signing official approval)
   7,823 controlled-access files hold sequence-level data and are released only under an approved data access request for phs000527. The request starts at dbGaP, not in the portal, and it is your institution's signing official who submits it.
   Requires: eRA Commons account, institutional signing official approval, dbGaP data access request for phs000527
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token
   An approved request yields a token that expires monthly. The same manifest fetches nothing without it.
   Requires: approved dbGaP request, GDC authentication token
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000527

   ```
   gdc-client download -m gdc_manifest.txt -t gdc-user-token.txt
   ```

### From code

5. Query the project from code, with no credentials
   The file index is public even where the files are not, so an agent can size a cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

   ```
   curl -s 'https://api.gdc.cancer.gov/files' --get \
     --data-urlencode 'filters={"op":"and","content":[{"op":"in","content":{"field":"cases.project.project_id","value":["CGCI-BLGSP"]}},{"op":"in","content":{"field":"access","value":["open"]}}]}' \
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
- Citations to the dataset's publication: 62 (attention, not reuse)
- Reuse gap index: -2.65 (negative means less reused than comparable datasets)
  - Developmental Deconvolution for Classification of Cancer Origin. (2022) PMID 36041084
  - Epstein-Barr Virus in Burkitt Lymphoma in Africa Reveals a Limited Set of Whole Genome and &lt;i&gt;LMP-1&lt;/i&gt; Sequence Patterns: Analysis of Archival Datasets and Field Samples From Uganda, Tanzania, and Kenya. (2022) PMID 35340265
  - B7H6 is the predominant activating ligand driving natural killer cell-mediated killing in patients with liquid tumours: evidence from clinical, in silico, in vitro, and in vivo studies. (2024) PMID 39579618
  - Cytokine-Induced Killer Cells in Combination with Heat Shock Protein 90 Inhibitors Functioning via the Fas/FasL Axis Provides Rationale for a Potential Clinical Benefit in Burkitt's lymphoma. (2023) PMID 37569852
  - Incorporation of Epstein-Barr viral variation implicates significance of Latent Membrane Protein 1 in survival prediction and prognostic subgrouping in Burkitt lymphoma. (2025) PMID 40047459

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-cgci-blgsp.json
