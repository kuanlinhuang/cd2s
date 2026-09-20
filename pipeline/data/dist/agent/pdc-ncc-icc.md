# NCC iCC

Dataset id: pdc-ncc-icc

## Read this first: what these data CANNOT support

- No blocking limitation has been recorded. This is not the same as there being none: check the review status below.

## What it is

- Cohort: 106 cases
- Cancer types: Cholangiocarcinoma, Hepatocellular Carcinoma
- Subject: Biliary tract, Liver
- Measurements: Phosphoproteome mass spectrometry (TMT10 / DDA), Proteome mass spectrometry (TMT10 / DDA)
- Median follow-up: 21.0 months (derivable for 104 cases)
- Treatment response recorded: False
- Access: open. Direct download from the PDC portal or its API; no account required

## Clinical field completeness

Populated means a value exists; informative excludes 'not reported'.

- AJCC pathologic stage (tumor_stage): 0.0% informative
- Race: 98.1% informative
- Ethnicity: 98.1% informative
- Sex at birth (gender): 98.1% informative
- Morphology (ICD-O): 98.1% informative
- Tissue or organ of origin: 98.1% informative
- Tumor grade: 98.1% informative
- Age at diagnosis: 98.1% populated (one-to-many)
- Days to last follow-up: 98.1% populated (one-to-many)
- Days to recurrence: 98.1% populated (one-to-many)
- Primary diagnosis: 97.2% informative
- Vital status: 0.0% informative
- Cause of death: 0.0% informative
- AJCC pathologic stage: 0.0% informative
- AJCC clinical stage: 0.0% informative
- Progression or recurrence: 0.0% informative
- Last known disease status: 0.0% informative
- Prior treatment: 0.0% informative

## How to get the data

### For a person

1. Open the study in the PDC portal (5 minutes)
   Proteomic data are released open: no account, no request, no waiting. This cohort spans 2 PDC studies (PDC000363, PDC000356); repeat for each.
   https://pdc.cancer.gov/pdc/study/PDC000363
2. Accept the data use guidelines and download (minutes to hours, by study size)
   The portal asks you to accept the guidelines at download time. They ask for citation and acknowledgement, not for approval.
   https://pdc.cancer.gov/pdc/data-use-guidelines

### From code

3. Resolve the study UUID, then fetch the file manifest
   filesPerStudy keys on the version UUID, not on PDC000363. Passing the PDC study id returns one row per file with every field null - a successful call that looks like a study whose files carry no metadata. Resolve the latest version through studyCatalog first. acceptDUA: true is the programmatic form of the portal's terms click; without it there are no signed download URLs.
   https://pdc.cancer.gov/data-dictionary/publicapi-documentation/

   ```
   python3 - <<'PY'
   import requests
   STUDY = "PDC000363"
   GQL = "https://pdc.cancer.gov/graphql"
   catalog = requests.post(GQL, json={"query": "{ studyCatalog(acceptDUA: true) { pdc_study_id versions { study_id is_latest_version } } }"}).json()["data"]["studyCatalog"]
   uuid = next(v["study_id"] for s in catalog if s["pdc_study_id"] == STUDY
               for v in s["versions"] if v["is_latest_version"] == "yes")
   q = '{ filesPerStudy(study_id: "%s" acceptDUA: true) { file_id file_name file_type data_category } }' % uuid
   files = requests.post(GQL, json={"query": q}).json()["data"]["filesPerStudy"]
   print(len(files), "files")
   PY
   ```

## Evidence of prior reuse

- Articles that analyzed these data: 2
- Reuse gap index: +0.52 (negative means less reused than comparable datasets)
  - An SLCO2B1 mRNA Isoform Acts as a Noncoding RNA to Drive Cancer Progression by Triggering Protein Biosynthesis. (2026) PMID 41886603
  - Automated sparse feature selection in high-dimensional proteomics data via 1-bit compressed sensing and K-Medoids clustering. (2025) PMID 40597613

## Provenance

- Review status: machine_only
  This page's interpretation has NOT been human-reviewed. Counts and field coverage are machine-measured and reliable; the absence of a limitations list means nobody has written one, not that there are no limitations.
- Metadata retrieved: 2026-09-18
- Full structured record: https://cd2s.vercel.app/data/datasets/pdc-ncc-icc.json
