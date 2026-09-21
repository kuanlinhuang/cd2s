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

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-CHOL
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-CHOL
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   1,171 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   2,000 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000178
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000178
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 195
- 72 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 0 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 409 (attention, not reuse)
- Reuse gap index: +1.51 (negative means less reused than comparable datasets)
  - Integrative analyses of bulk and single-cell transcriptomics reveals the infiltration and crosstalk of cancer-associated fibroblasts as a novel predictor for prognosis and microenvironment remodeling in intrahepatic cholangiocarcinoma. (2024) PMID 38702814
  - Extrachromosomal circular DNA (eccDNA) characteristics in the bile and plasma of advanced perihilar cholangiocarcinoma patients and the construction of an eccDNA-related gene prognosis model. (2024) PMID 38903532
  - The correlation between LAG-3 expression and the efficacy of chemoimmunotherapy in advanced biliary tract cancer. (2025) PMID 39751894
  - New platinum derivatives selectively cause double-strand DNA breaks and death in naïve and cisplatin-resistant cholangiocarcinomas. (2025) PMID 40324694
  - Comparative impact of tertiary lymphoid structures and tumor-infiltrating lymphocytes in cholangiocarcinoma. (2025) PMID 39870490

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-chol.json
