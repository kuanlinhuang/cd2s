# CPTAC STAD Study

Dataset id: pdc-cptac-stad-study
Summary: 193 gastric cancers measured seven ways - proteome, phosphoproteome, acetylome, glycoproteome, ubiquitylome, metabolome and protein-protein interaction - the deepest single-cohort molecular characterization in the NCI portfolio, and openly downloadable.

## Read this first: what these data CANNOT support

- The PDC record carries no clinical annotation: no survival, no treatment, no stage and no demographics are exposed through the study metadata.
  Rules out: Survival analysis, Treatment-response analysis, Clinical correlation of any kind
- Do not use for: Survival or prognostic analysis using PDC data alone. (No outcome variable is distributed with these studies.)
- Do not use for: Treating the seven layers as a complete-case multi-omic matrix without checking overlap. (Case counts differ by layer; the naive intersection is smaller than any single layer.)

## What it is

- Cohort: 193 cases
- Measurements: Acetylome mass spectrometry (TMT18 / DDA), Glycoproteome mass spectrometry (TMT18 / DDA), Metabolome mass spectrometry (Label Free / N/A), Phosphoproteome mass spectrometry (TMT18 / DDA), Protein-protein interaction mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT18 / DDA), Ubiquitylome mass spectrometry (Label Free / DIA)
- Access: open. Direct download from the PDC portal or its API; no account required

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

1. Browse the study in the PDC portal (30 minutes)
   No account is required. All seven fractions are openly downloadable.
   https://pdc.cancer.gov/pdc/browse
2. Pull the study manifest from the PDC GraphQL API (1 hour)
   The API is public and needs no key, which makes this cohort unusually easy to script against.
3. Retrieve the matching clinical and genomic data from the GDC (2-3 hours)
   This is the step people skip. Without it the proteomic layers have no clinical context at all.
   https://portal.gdc.cancer.gov/projects/CPTAC-3

## Verified runnable starting points

- Find and use the scarcest measurements in the portfolio (python, about a minute)
  workbooks/python/04_scarce_modality_cptac.py

## Evidence of prior reuse

- Articles that analyzed these data: 1
- Citations to the dataset's publication: 1 (attention, not reuse)
- Reuse gap index: -1.22 (negative means less reused than comparable datasets)

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.vercel.app/data/datasets/pdc-cptac-stad-study.json
