# CPTAC-Brain, Head and Neck, Kidney, Lung, Pancreas, Uterus

Dataset id: gdc-cptac-3
Summary: 1,866 tumors across six cancer types with genomics in the GDC and proteomics in the PDC - the largest prospectively collected proteogenomic cohort, with recurrence recorded for 78% of cases.

## Read this first: what these data CANNOT support

- The proteomic data that define this cohort's purpose are not in this record. They are distributed through the Proteomic Data Commons as separate per-fraction studies with their own identifiers, and joining them is the analyst's responsibility.
  Rules out: Any proteogenomic analysis
- Do not use for: Describing this as a proteogenomic dataset without retrieving the PDC studies. (This GDC record contains no proteomic data.)
- Do not use for: Conclusions about Black patients. (22 cases is far too few.)

## What it is

- Cohort: 1,866 cases
- Cancer types: Not Applicable, Transitional Cell Papillomas and Carcinomas, Ductal and Lobular Neoplasms, Adenomas and Adenocarcinomas, Gliomas, Epithelial Neoplasms, NOS
- Subject: pan cancer
- Measurements: Whole exome sequencing, Targeted DNA panel sequencing, Bulk RNA sequencing, Whole genome sequencing, microRNA sequencing, Single-cell RNA sequencing, DNA methylation array, Copy Number Variation, Somatic Structural Variation
- Median follow-up: 22.9 months (derivable for 1763 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 100.0% informative
- Tissue or organ of origin: 99.5% informative
- Primary diagnosis: 98.7% informative
- Morphology (ICD-O): 98.7% informative
- Tobacco smoking status: 96.4% informative
- Vital status: 95.8% informative
- Race: 94.5% informative
- Disease response at follow-up: 92.2% populated (one-to-many)
- ECOG performance status: 92.2% populated (one-to-many)
- Alcohol history: 84.6% informative
- Progression or recurrence: 77.9% informative
- Last known disease status: 77.2% informative
- AJCC pathologic stage: 75.6% informative
- Tumor grade: 69.7% informative
- Treatment type: 52.7% populated (one-to-many)
- Treatment outcome: 44.1% informative
- Cause of death: 28.9% informative
- Ethnicity: 21.7% informative

## Questions these data can support

- Which genomic alterations have consequences at the protein level, and which do not?
  Why: This is the question CPTAC exists to answer, and it needs both halves joined. Genomics on over 1,800 cases here pairs with proteomic studies in the PDC on the same participants, allowing copy number and mutation effects to be traced to protein and phosphosite abundance.
  Statistical caution: The proteomic layers cover subsets of the cohort organized by cancer type, so the joined analysis is substantially smaller than 1,866 and varies by tumor type. Build the intersection first.
  Approximate analysable n: 1000
- What molecular features predict recurrence across cancer types?
  Why: Progression or recurrence is informative for 77.9% of 1,866 cases with a median follow-up of 22.8 months - unusual completeness for a recurrence endpoint, and the basis for a genuinely pan-cancer recurrence analysis.
  Statistical caution: Pan-cancer recurrence pooling mixes very different natural histories; stratify by tumor type and treat the pooled estimate as secondary.
  Approximate analysable n: 1453
- Do proteogenomic subtypes cut across tissue of origin?
  Why: Six cancer types collected prospectively under a common protocol make cross-tissue subtype comparison less confounded by collection differences than a retrospective pan-cancer assembly.
  Approximate analysable n: 1000

## How to get the data

1. Decide which half you need first (30 minutes)
   The proteomic half is open and immediately usable; the genomic half is largely controlled. If your question is proteomic, start at the PDC and avoid the access delay entirely.
2. Retrieve the matching PDC studies (2-3 hours)
   https://pdc.cancer.gov/pdc/browse
3. Submit a dbGaP request for the controlled genomic tier (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Evidence of prior reuse

- Articles that analyzed these data: 25
- Of those, 51 were retrieved and graded individually; 2 had no author in common with the generating team and 10 were themselves NCI funded.
- Citations to the dataset's publication: 688 (attention, not reuse)
- Reuse gap index: -1.42 (negative means less reused than comparable datasets)
  - Proteogenomic Characterization Reveals Therapeutic Vulnerabilities in Lung Adenocarcinoma. (2020) PMID 32649874
  - Proteogenomic Characterization of Endometrial Carcinoma. (2020) PMID 32059776
  - A proteogenomic portrait of lung squamous cell carcinoma. (2021) PMID 34358469
  - Proteogenomic characterization of 2002 human cancers reveals pan-cancer molecular subtypes and associated pathways. (2022) PMID 35562349
  - Pan-cancer analysis of post-translational modifications reveals shared patterns of protein regulation. (2023) PMID 37582358

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/gdc-cptac-3.json
