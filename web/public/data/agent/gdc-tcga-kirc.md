# Kidney Renal Clear Cell Carcinoma

Dataset id: gdc-tcga-kirc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 537 cases
- Cancer types: Adenomas and Adenocarcinomas
- Subject: Kidney
- Measurements: Clinical, DICOM medical imaging, DNA methylation array, SNP genotyping array (copy number, germline), Bulk RNA sequencing, microRNA sequencing, Whole-slide diagnostic images, Whole genome sequencing, Reverse phase protein array, Somatic Structural Variation
- Median follow-up: 38.6 months (derivable for 537 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Vital status: 100.0% informative
- Primary diagnosis: 100.0% populated (one-to-many)
- Morphology (ICD-O): 100.0% populated (one-to-many)
- Tissue or organ of origin: 100.0% populated (one-to-many)
- Prior treatment: 100.0% populated (one-to-many)
- Classification of tumor: 100.0% populated (one-to-many)
- AJCC pathologic stage: 99.4% informative
- Tumor grade: 99.4% informative
- Prior malignancy: 98.9% informative
- Synchronous malignancy: 98.9% informative
- Race: 98.7% informative
- Disease response at follow-up: 95.5% populated (one-to-many)
- Ethnicity: 71.7% informative
- Treatment type: 57.7% populated (one-to-many)
- Treatment given: 57.7% populated (one-to-many)
- ECOG performance status: 32.8% populated (one-to-many)
- Progression at follow-up: 24.0% informative

## How to get the data

1. Open the project in the GDC Data Portal [human] (5 minutes)
   Check the portal's current case and file counts before requesting anything; the cohort can change after this record was built.
   https://portal.gdc.cancer.gov/projects/TCGA-KIRC
   Policy evidence: https://portal.gdc.cancer.gov/projects/TCGA-KIRC
2. Download the open files without an account [human] (minutes to hours, by cohort size)
   15,306 open-access files are marked open access. Add them to a portal cart, export a manifest, and fetch it with the GDC Data Transfer Tool.
   https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
   Policy evidence: https://gdc.cancer.gov/access-data/gdc-data-transfer-tool
3. Request controlled access through dbGaP [human] (days to a few weeks after signing official approval)
   19,725 controlled-access files require an approved data access request. The request starts at dbGaP, not in the portal. The relevant study is phs000178.
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

- Articles that analyzed these data: 1245
- 111 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 1 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 2845 (attention, not reuse)
- Reuse gap index: +1.98 (negative means less reused than comparable datasets)
  - Single-cell epigenetic profiling reveals a tumor-intrinsic interferon response program in ccRCC tied to poor prognosis and &lt;i&gt;BAP1&lt;/i&gt; loss. (2026) PMID 41719400
  - A manganese metabolism-related gene signature stratifies prognosis and immunotherapy efficacy in kidney cancer. (2025) PMID 40591061
  - Mendelian Randomization Identified SLC2A9 as a Novel cis-eQTL-Mediated Susceptibility Gene in Suppressing Renal Cancer and Its Related Metabolic Mechanisms. (2026) PMID 41837832
  - Nuclear receptor corepressor 1 is a potential diagnostic and prognostic biomarker in clear cell renal cell carcinoma. (2026) PMID 41593170
  - A multi-omics prognostic model and functional validation of &lt;i&gt;HPGD&lt;/i&gt; in clear cell renal cell carcinoma. (2026) PMID 41971124

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-tcga-kirc.json
