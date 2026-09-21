# CPTAC STAD Study

Dataset id: pdc-cptac-stad-study
Summary: 193 gastric cancers measured seven ways - proteome, phosphoproteome, acetylome, glycoproteome, ubiquitylome, metabolome and protein-protein interaction - the deepest single-cohort molecular characterization in the NCI portfolio, and openly downloadable.

## Read this first: what these data CANNOT support

- Race is informative for 86% of cases but is overwhelmingly one group, and ethnicity is informative for well under 1%: it is recorded as "not reported" for almost every case. Population-stratified work is not supportable here whatever the race field suggests.
  Rules out: Any population-stratified analysis, Disparities research
- Do not use for: Progression-free or recurrence analysis from these data. (Progression or recurrence is recorded for no case in the PDC clinical records.)
- Do not use for: Treating treatment annotation as complete when reporting a response analysis. (A treatment outcome is recorded for half the cohort and a named agent for a third, so a complete-case treatment analysis runs on a self-selected subset.)
- Do not use for: Treating the seven layers as a complete-case multi-omic matrix without checking overlap. (Case counts differ by layer; the naive intersection is smaller than any single layer.)

## What it is

- Cohort: 193 cases
- Cancer types: Stomach Adenocarcinoma, Early Onset Gastric Cancer
- Subject: Esophagus and stomach
- Measurements: Acetylome mass spectrometry (TMT18 / DDA), Glycoproteome mass spectrometry (TMT18 / DDA), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT18 / DDA), Protein-protein interaction mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT18 / DDA), Ubiquitylome mass spectrometry (Label Free / DIA)
- Median follow-up: 24.5 months (derivable for 157 cases)
- Treatment response recorded: True
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Sex at birth (gender): 88.6% informative
- Primary diagnosis: 88.6% informative
- Tissue or organ of origin: 88.6% informative
- Vital status: 85.5% informative
- Race: 85.5% informative
- Morphology (ICD-O): 85.5% informative
- Tumor grade: 85.5% informative
- AJCC pathologic stage: 85.5% informative
- Age at diagnosis: 85.5% populated (one-to-many)
- Days to last follow-up: 85.5% populated (one-to-many)
- Treatment type: 52.3% populated (one-to-many)
- Treatment outcome: 49.7% populated (one-to-many)
- Therapeutic agents: 32.1% populated (one-to-many)
- Days to death: 9.3% populated (one-to-many)
- Cause of death: 6.7% informative
- AJCC pathologic stage (tumor_stage): 3.1% informative
- Classification of tumor: 0.0% informative
- Days to recurrence: 2.1% populated (one-to-many)

## Questions these data can support

- How do distinct post-translational modification layers diverge from each other and from transcript abundance on the same tumors?
  Why: Phosphorylation, acetylation, glycosylation and ubiquitylation are measured on largely the same 184 to 193 tumors. Comparing regulation across four modification types on one cohort is an analysis this dataset uniquely enables; almost every other resource offers at most two.
  Statistical caution: Each layer has its own missingness pattern from mass spectrometry. Do not impute across layers; restrict to features quantified in a pre-specified fraction of samples and report that threshold.
  Approximate analysable n: 184
- Does protein degradation signaling, read from the ubiquitylome, identify tumor subgroups invisible to transcriptomics?
  Why: Ubiquitylome data on 184 cases is among the largest such datasets anywhere. Degradation is a major regulatory axis that expression data cannot see, and a cohort this size makes subgroup discovery feasible rather than anecdotal.
  Statistical caution: Ubiquitylation site quantification is sparser than proteome quantification; expect to lose a substantial fraction of sites to the completeness filter.
  Approximate analysable n: 184
- How does tumor metabolism, measured directly rather than inferred, relate to signaling state?
  Why: Metabolomics on 187 cases is available alongside the phosphoproteome, so metabolic state can be related to signaling directly instead of being inferred from enzyme transcript levels - which is what most metabolic analyses in cancer actually do.
  Approximate analysable n: 187
- Can measured protein-protein interaction data improve network inference over correlation-based approaches?
  Why: Interaction data on 153 cases is exceptionally rare in a tumor cohort, and provides a measured reference against which inferred co-expression networks can be scored.
  Approximate analysable n: 153

## How to get the data

1. Browse the study in the PDC portal [human] (30 minutes)
   No account is required. All seven fractions are openly downloadable.
   https://pdc.cancer.gov/pdc/browse
2. Pull the study manifest from the PDC GraphQL API [human] (1 hour)
   The API is public and needs no key, which makes this cohort unusually easy to script against.
3. Retrieve the matching clinical and genomic data from the GDC [human] (2-3 hours)
   This is the step people skip. Without it the proteomic layers have no clinical context at all.
   https://portal.gdc.cancer.gov/projects/CPTAC-3
4. Resolve the study UUID, then fetch the file manifest [agent]
   filesPerStudy keys on the study UUID, not on PDC000622: called with the pdc_study_id it returns the right number of rows with every column null. Resolve the UUID first and pass the terms acknowledgement.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/
   Policy evidence: https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

## Verified runnable starting points

- Find and use the scarcest measurements in the portfolio (python, about a minute)
  workbooks/python/04_scarce_modality_cptac.py

## Evidence of prior reuse

- Articles that analyzed these data: 1
- Reuse gap index: -1.75 (negative means less reused than comparable datasets)

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-cptac-stad-study.json
