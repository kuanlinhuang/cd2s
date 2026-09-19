# Breast Invasive Carcinoma

Dataset id: gdc-tcga-brca
Summary: 1,098 breast tumors measured twelve ways across GDC and IDC, with treatment outcome on 64% of cases - the most reused dataset in this corpus and still the reference cohort for method development.

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.
- Do not use for: Evaluating modern therapies such as CDK4/6 inhibitors or immunotherapy. (Treatment predates these agents; they do not appear in the cohort.)
- Do not use for: Estimating breast cancer incidence or population survival. (A convenience sample from participating centres, with no denominator.)
- Do not use for: Claiming a novel method generalizes on the basis of TCGA-BRCA performance alone. (The cohort has been used so extensively for method development that performance on it is partly a measure of collective overfitting.)

## What it is

- Cohort: 1,098 cases
- Cancer types: Cystic, Mucinous and Serous Neoplasms, Adenomas and Adenocarcinomas, Fibroepithelial Neoplasms, Basal Cell Neoplasms, Ductal and Lobular Neoplasms, Epithelial Neoplasms, NOS
- Measurements: SNP genotyping array (copy number, germline), Clinical, DICOM medical imaging, DNA methylation array, Bulk RNA sequencing, microRNA sequencing, Whole exome sequencing, Whole-slide diagnostic images, Whole genome sequencing, Somatic Structural Variation
- Median follow-up: 27.1 months (derivable for 1096 cases)
- Treatment response recorded: True
- Access: mixed. Data Access Request through dbGaP using an eRA Commons account; institutional signing official approval required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth: 99.9% informative
- Vital status: 99.9% informative
- Primary diagnosis: 99.9% populated (one-to-many)
- Morphology (ICD-O): 99.9% populated (one-to-many)
- Tissue or organ of origin: 99.9% populated (one-to-many)
- Prior treatment: 99.9% populated (one-to-many)
- Classification of tumour: 99.9% populated (one-to-many)
- Treatment type: 99.9% populated (one-to-many)
- Treatment given: 99.9% populated (one-to-many)
- Prior malignancy: 99.1% informative
- Synchronous malignancy: 99.1% informative
- AJCC pathologic stage: 98.9% informative
- Disease response at follow-up: 97.4% populated (one-to-many)
- Race: 91.3% informative
- Ethnicity: 84.1% informative
- Therapeutic agents: 70.7% populated (one-to-many)
- Treatment outcome: 64.4% populated (one-to-many)
- Country of residence: 63.5% informative

## Questions these data can support

- Does a new computational method reproduce established breast cancer molecular subtypes?
  Why: Expression, methylation, copy number, microRNA and protein array data on largely the same 1,098 tumors, with subtype assignments established across hundreds of prior papers. This is the standard benchmark, and the density of prior work is the point.
  Statistical caution: Because so many methods have been tuned on this cohort, strong performance here is weak evidence of generalization. Pair it with an external cohort.
  Approximate analysable n: 1080
- Which molecular features are associated with response to specific systemic therapies?
  Why: Therapeutic agents are recorded for 71% of cases - cyclophosphamide, tamoxifen, anastrozole, paclitaxel and doxorubicin are the commonest - and a treatment outcome field is populated for 64%. Combined with expression on 1,095 cases this supports agent-stratified response analysis.
  Statistical caution: Treatment was not randomized and is confounded with stage, subtype and era of care. Any agent comparison needs explicit confounding control and should be framed as associative.
  Approximate analysable n: 700
- Do radiology or pathology image features add prognostic information beyond molecular data?
  Why: Imaging for these same patients is held in the Imaging Data Commons and is openly downloadable, while the molecular data sit in the GDC. Joining them gives a multimodal cohort most users never realise is available.
  Statistical caution: Imaging coverage is not complete across the cohort; build the intersection first and check it is not biased by site or era.
  Approximate analysable n: 1098
- What distinguishes long-term survivors, given a median follow-up of 27.1 months?
  Why: Vital status is informative for 99.9% of cases and follow-up time is computable, giving a clean overall survival endpoint on a large cohort.
  Statistical caution: Breast cancer events accrue over a decade or more, and the median patient here is followed under three years, although a minority reach twenty years. Late-recurrence questions are underpowered.
  Approximate analysable n: 1097

## How to get the data

1. Download open derived matrices from the GDC (1 hour)
   Expression, copy number, methylation and clinical files need no account.
   https://portal.gdc.cancer.gov/projects/TCGA-BRCA
2. Add the imaging from the Imaging Data Commons if you need it (1-2 hours)
   Same patients, different repository, also open. Most users never make this join.
   https://portal.imaging.datacommons.cancer.gov/explore/?collection_id=tcga_brca
3. Request controlled access only if you need sequence-level data (days to a few weeks)
   https://gdc.cancer.gov/access-data/obtaining-access-controlled-data

## Verified runnable starting points

- Audit whether this dataset can answer your question (python, about a minute)
  workbooks/python/01_can_i_answer_this.py
- Overall survival from open data, with the endpoint derived correctly (python, about two minutes)
  workbooks/python/02_survival_tcga_brca.py
- Join the same patients across two NCI repositories (python, about two minutes)
  workbooks/python/05_cross_repository_linkage.py

## Evidence of prior reuse

- Articles that analyzed these data: 2463
- Citations to the dataset's publication: 9914 (attention, not reuse)
- Reuse gap index: +2.00 (negative means less reused than comparable datasets)
  - On-target off-tumor toxicity of claudin18.2-directed CAR-T cells in preclinical models. (2025) PMID 41176533
  - Passenger mutations link cellular origin and transcriptional identity in human lung adenocarcinomas. (2025) PMID 41310231
  - Tumor necrosis associates with aggressive breast cancer features, increased hypoxia signaling and reduced patient survival. (2025) PMID 41310191
  - Alternative splicing generates HER2 isoform diversity underlying antibody-drug conjugate resistance in breast cancer. (2025) PMID 40664477
  - Exploring Aerobic Energy Metabolism in Breast Cancer: A Mutational Profile of Glycolysis and Oxidative Phosphorylation. (2024) PMID 39684297

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/gdc-tcga-brca.json
