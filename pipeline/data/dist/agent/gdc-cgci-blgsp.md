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

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/CGCI-BLGSP
   Policy evidence: https://portal.gdc.cancer.gov/projects/CGCI-BLGSP
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   4,906 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   7,823 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000527.
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
   Policy evidence: https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Download controlled files with your token [human]
   An approved request yields a token. The same manifest fetches nothing controlled without it.
   https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000527
   Policy evidence: https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs000527
5. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
6. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 5
- 20 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, author overlap with the generating team could not be checked for any of them, and 4 of the 10 that could be checked were themselves NCI funded.
- Reuse gap index: -3.35 (negative means less reused than comparable datasets)
  - Genetic subgroups inform on pathobiology in adult and pediatric Burkitt lymphoma. (2023) PMID 36201743
  - Sources of erroneous sequences and artifact chimeric reads in next generation sequencing of genomic DNA from formalin-fixed paraffin-embedded samples. (2019) PMID 30418619
  - Developmental Deconvolution for Classification of Cancer Origin. (2022) PMID 36041084
  - Evaluation of protocols for rRNA depletion-based RNA sequencing of nanogram inputs of mammalian total RNA. (2019) PMID 31671154
  - Genetic regulation of TERT splicing affects cancer risk by altering cellular longevity and replicative potential. (2025) PMID 39956830

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-cgci-blgsp.json
