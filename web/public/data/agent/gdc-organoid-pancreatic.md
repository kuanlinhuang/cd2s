# Pancreas Cancer Organoid Profiling

Dataset id: gdc-organoid-pancreatic
Summary: 70 patient-derived pancreatic cancer organoids with exome and RNA sequencing, linked to drug-response profiling in the source publication - a living model resource rather than a tissue archive.

## Read this first: what these data CANNOT support

- Vital status is populated for all 70 cases and informative for none, and progression is likewise uninformative. No clinical outcome endpoint exists in these records.
  Rules out: Survival analysis, Clinical outcome correlation
- Do not use for: Survival or prognostic analysis. (Vital status is uninformative for all 70 cases.)
- Do not use for: Claiming clinical efficacy from organoid drug response. (Organoid sensitivity is a model-system measurement; the link to patient benefit requires clinical validation this resource does not contain.)

## What it is

- Cohort: 70 cases
- Cancer types: Unknown, Adenomas and Adenocarcinomas
- Subject: Pancreas
- Measurements: Whole exome sequencing, Bulk RNA sequencing, Whole genome sequencing, Structural Variation
- Treatment response recorded: False
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Vital status: 0.0% informative
- Morphology (ICD-O): 0.0% informative
- Tissue or organ of origin: 100.0% informative
- Tumor grade: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 100.0% informative
- Sex at birth: 98.6% informative
- Ethnicity: 97.1% informative
- Race: 88.6% informative
- Primary diagnosis: 84.3% informative
- AJCC pathologic stage: 80.0% informative
- Cause of death: 0.0% informative
- Population group: 0.0% informative
- Country of residence: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Prior treatment: 0.0% informative
- Prior malignancy: 0.0% informative
- Synchronous malignancy: 0.0% informative

## Questions these data can support

- Which molecular features predict chemotherapy sensitivity in pancreatic cancer organoids?
  Why: Exome on 69 and expression on 49 organoids, with measured drug responses reported in the source publication. Because response is measured experimentally rather than inferred from clinical records, this avoids the treatment confounding that defeats observational response analysis.
  Statistical caution: Pharmacotyping data are in the publication's supplementary material, not in the GDC record. Retrieve and join them before designing the analysis.
  Approximate analysable n: 49
- How faithfully do organoids recapitulate the genomics of the tumors they came from?
  Why: A model-fidelity question that determines how much weight any organoid result deserves, and one that can be posed here because both the organoid profiles and the source tumor stage information are available.
  Statistical caution: Matched primary tumor sequencing is not uniformly available in this record; check pairing before assuming it.
  Approximate analysable n: 69
- Can organoid expression programs stratify pancreatic cancer subtypes established in tissue cohorts?
  Why: Expression on 49 organoids can be scored against the basal-like and classical subtype definitions derived from bulk tumor cohorts, testing whether those subtypes survive in culture.
  Statistical caution: Culture adaptation shifts expression; divergence from tissue subtypes is a finding about the model system as much as about the tumor.
  Approximate analysable n: 49

## How to get the data

1. Read the Cancer Discovery paper and retrieve its pharmacotyping supplement [human] (2 hours)
   The drug-response data are the reason to use this resource and they live in the paper, not the repository.
   https://pubmed.ncbi.nlm.nih.gov/29853643/
2. Scope with the 55 open-access files [human] (30 minutes)
   https://portal.gdc.cancer.gov/projects/ORGANOID-PANCREATIC
3. Submit a dbGaP data access request for the sequence data [human] (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data
4. Query the project from code, with no credentials [agent]
   The file index is public even where files are not, so an agent can size the cohort before anyone requests access.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
5. Pass the token when the agent needs controlled files [agent]
   Without a token, an API query may return only the open subset. Compare returned counts with the record before treating them as the whole cohort.
   https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/
   Policy evidence: https://docs.gdc.cancer.gov/API/Users_Guide/Getting_Started/

## Evidence of prior reuse

- Articles that analyzed these data: 3
- 22 articles matching this dataset's accession search were retrieved and graded individually, and the strongest 10 are kept as exemplars. Of the 10 that analyzed the data, 10 of the 10 that could be checked had no author in common with the generating team, and 4 of the 10 that could be checked were themselves NCI funded.
- Citations to the dataset's publication: 898 (attention, not reuse)
- Reuse gap index: -0.00 (negative means less reused than comparable datasets)
  - Tryptophan-derived microbial metabolites activate the aryl hydrocarbon receptor in tumor-associated macrophages to suppress anti-tumor immunity. (2022) PMID 35139353
  - Systematic determination of the mitochondrial proportion in human and mice tissues for single-cell RNA-sequencing data quality control. (2021) PMID 32840568
  - Bioengineering Approaches for the Advanced Organoid Research. (2021) PMID 34561899
  - Patient-derived organoids (PDOs) and PDO-derived xenografts (PDOXs): New opportunities in establishing faithful pre-clinical cancer models. (2022) PMID 39036550
  - Human Pancreatic Cancer Single-Cell Atlas Reveals Association of CXCL10+ Fibroblasts and Basal Subtype Tumor Cells. (2025) PMID 39636224

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/gdc-organoid-pancreatic.json
