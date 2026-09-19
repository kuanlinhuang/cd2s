# CPTAC LUAD Discovery Study

Dataset id: pdc-cptac-luad-discovery-study
Summary: 115 lung adenocarcinomas with proteome, phosphoproteome and acetylome, plus ubiquitylome on 80 - one of five ubiquitylation datasets in the Proteomic Data Commons, openly downloadable.

## Read this first: what these data CANNOT support

- Treatment is absent: no therapeutic agent, treatment type or response is recorded for any of the 115 cases, and neither is smoking history, which is central to lung adenocarcinoma biology. Vital status, follow-up time and stage are served by the PDC API even though they do not ship in the study's file bundle.
  Rules out: Treatment-response analysis, Smoking-stratified analysis
- Do not use for: Treatment-response or resistance claims from PDC data alone. (No treatment record of any kind is populated for this study - not the agent, not the type, not the outcome.)
- Do not use for: Survival claims that ignore how short the follow-up is. (Vital status is informative for 93% of cases and 107 have a follow-up time, but the median is 15.7 months, so late events are largely unobserved.)
- Do not use for: Treating the ubiquitylome subset as representative of the full cohort without checking. (80 of 115 cases carry it; the selection may not be random.)

## What it is

- Cohort: 115 cases
- Cancer types: Lung Adenocarcinoma
- Measurements: Acetylome mass spectrometry (TMT10 / DDA), Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA), Ubiquitylome mass spectrometry (TMT11 / DDA)
- Median follow-up: 15.7 months (derivable for 107 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Sex at birth (gender): 96.5% informative
- Morphology (ICD-O): 96.5% informative
- Primary diagnosis: 96.5% informative
- Tissue or organ of origin: 96.5% informative
- Tumor grade: 96.5% informative
- AJCC pathologic stage: 96.5% informative
- Age at diagnosis: 96.5% populated (one-to-many)
- Race: 93.9% informative
- Vital status: 93.0% informative
- Days to last follow-up: 93.0% populated (one-to-many)
- Ethnicity: 33.0% informative
- Days to death: 22.6% populated (one-to-many)
- Cause of death: 13.9% informative
- Days to recurrence: 7.8% populated (one-to-many)
- Prior malignancy: 0.0% informative
- Classification of tumor: 0.0% informative
- AJCC clinical stage: 0.0% informative

## Questions these data can support

- Which proteins are regulated by degradation rather than by transcription in lung adenocarcinoma?
  Why: Ubiquitylome on 80 cases alongside proteome on all 115 allows the two regulatory modes to be separated on the same tumors - the direct test of an assumption that expression studies make implicitly.
  Statistical caution: Ubiquitylation site quantification is sparse; apply a completeness filter and report it, since the filter choice materially changes the feature set.
  Approximate analysable n: 80
- How do acetylation and phosphorylation interact in the same tumor?
  Why: Both modification layers are measured on all 115 cases, allowing cross-modification analysis on a common set of tumors rather than across separate cohorts.
  Approximate analysable n: 115
- Can degradation signatures identify candidate targets for proteasome or E3 ligase directed therapy?
  Why: Direct measurement of ubiquitylation state in primary tumors is the substrate for target nomination in a therapeutic area where target selection is usually based on inference.
  Approximate analysable n: 80

## How to get the data

1. Download the fractions from the PDC portal (1 hour)
   Open access, no account required.
   https://pdc.cancer.gov/pdc/browse
2. Join clinical data from the GDC CPTAC-3 record (2-3 hours)
   https://portal.gdc.cancer.gov/projects/CPTAC-3

## Verified runnable starting points

- Find and use the scarcest measurements in the portfolio (python, about a minute)
  workbooks/python/04_scarce_modality_cptac.py

## Evidence of prior reuse

- Articles that analyzed these data: 22
- Reuse gap index: -1.00 (negative means less reused than comparable datasets)
  - Tryptophan depletion results in tryptophan-to-phenylalanine substitutants. (2022) PMID 35264796
  - ALDH2 as a potential stem cell-related biomarker in lung adenocarcinoma: Comprehensive multi-omics analysis. (2023) PMID 36936815
  - Arginine deprivation enriches lung cancer proteomes with cysteine by inducing arginine-to-cysteine substitutants. (2024) PMID 38759626
  - SIMSI-Transfer: Software-Assisted Reduction of Missing Values in Phosphoproteomic and Proteomic Isobaric Labeling Data Using Tandem Mass Spectrum Clustering. (2022) PMID 35462064
  - Inflammation-related citrullination of matrisome proteins in human cancer. (2022) PMID 36531007

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/pdc-cptac-luad-discovery-study.json
