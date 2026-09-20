# The Cellular Geography of Therapeutic Resistance in Cancer

Dataset id: htan-the-cellular-geography-of-therapeutic-resistance-in-cancer
Summary: An HTAN atlas built explicitly around therapeutic resistance, with multiplexed imaging, single-cell RNA sequencing and the richest clinical annotation of any atlas here - and no publications recorded in the network's own manifest.

## Read this first: what these data CANNOT support

- HTAN atlases profile few patients deeply. 20,350 files does not mean many participants, and participant counts are not exposed in the portal metadata.
  Rules out: Cohort-level association, Powered biomarker discovery
- Do not use for: Cohort-level statistical inference. (Deep sampling of few patients; the design does not support it.)
- Do not use for: Assuming clinical field completeness from their presence in the metadata. (The portal metadata records which clinical components exist, not how completely they are populated. Verify in Synapse.)

## What it is

- Cohort: 156 cases
- Subject: title derived
- Measurements: Multiplexed tissue imaging, Single-cell / single-nucleus RNA sequencing, Bulk DNA sequencing
- Access: mixed. Level 1-2 sequencing data are controlled through dbGaP; level 3-4 derived data and most imaging are downloadable from Synapse after registering and accepting the HTAN data use terms.

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- Extended clinical data (tier 2): 100.0% populated (one-to-many)
- Demographics: 100.0% populated (one-to-many)
- Diagnosis: 100.0% populated (one-to-many)
- Family history: 100.0% populated (one-to-many)
- Follow-up: 100.0% populated (one-to-many)
- Therapy: 100.0% populated (one-to-many)
- Exposure history: 64.1% populated (one-to-many)
- Clinical molecular test: 41.0% populated (one-to-many)

## Questions these data can support

- Where within a tumor do cells that survive therapy actually reside?
  Why: Multiplexed tissue imaging with single-cell RNA sequencing on the same specimens, in an atlas designed around this question, with therapy records available as a clinical component to define the treatment context.
  Statistical caution: Spatial analyses are specimen-level; patient numbers are small and the appropriate unit of inference is the region or cell neighborhood, with patient as a random effect.
- Do spatial niches associated with resistance recur across cancer types, or are they tissue-specific?
  Why: Neighborhood definitions derived here can be tested against other HTAN atlases that share the multiplexed imaging component, giving cross-atlas comparison within a single access framework and a common data model.
- Can the extended clinical tier be used to relate spatial organization to real treatment sequences rather than to treatment as a single binary?
  Why: This atlas carries the extended clinical data tier that most atlases lack, alongside therapy and follow-up. That is what allows spatial features to be related to what was actually given and what happened next.
  Statistical caution: Confirm the completeness of the extended clinical fields in Synapse before designing; the portal metadata records their presence but not their coverage.

## How to get the data

1. Contact the atlas team through the HTAN portal (days)
   With no marker publication recorded, this is the fastest route to the design details you would normally get from a paper.
   https://humantumoratlas.org/
2. Register with Synapse and accept the HTAN data use terms (1 day)
   https://humantumoratlas.org/data-access
3. Verify participant counts and clinical field coverage before designing (2-3 hours)

## Verified runnable starting points

- Select a dataset the way an agent should (python, under a minute)
  workbooks/python/06_agent_dataset_selection.py

## Evidence of prior reuse

- Articles that analyzed these data: 0

## Provenance

- Review status: project_curated
- Metadata retrieved: 2026-09-18
- Full structured record: https://cancer-data-showcase.example.org/data/datasets/htan-the-cellular-geography-of-therapeutic-resistance-in-cancer.json
