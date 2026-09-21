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

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-PCPG
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-PCPG
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   4,555 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   7,373 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 43
- 67 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 3 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 638 (attention, not reuse)
- Reuse gap index: -1.33 (negative means less reused than comparable datasets)
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
