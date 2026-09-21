# Make the Question the Interface

## A capability and reuse layer for NCI-funded cancer research outputs

**NCI Office of Data Sharing Impact Prize - Track 1: Research Output Sharing and Reuse Ideas**

**Applicant:** [Name, affiliation, and contact information]

**Proposed idea:** NCI should publish a common, question-first layer over the research outputs it already shares.

This layer would translate repository holdings into three things a researcher or software agent can act on:

1. What scientific questions the output can support, based on measured completeness and modality coverage.
2. What analyses it cannot support, including the difference between missing, uninformative, and unmeasured fields.
3. How the output has been reused, with evidence that separates actual analysis from a citation to the originating paper.

We call the working prototype **CD2S** - Cancer Data to Science.
The prototype demonstrates the idea across 602 records from five NCI-supported repositories and investigator-cohort resources.
It is evidence that this layer is technically feasible, useful, and directly connected to fixable sharing practices.

## Prompt 1: Significance and approach

NCI has made substantial progress on access and discovery.
Researchers can find data portals, download files, and read descriptions of what a dataset contains.
The remaining barrier is more consequential than a search problem: a researcher still cannot reliably answer, before requesting access or writing analysis code, "Can this output answer my question?"

That is the gap this submission addresses.

A dataset can be technically available but practically unusable for the analysis a researcher has in mind.
The problem is often invisible because catalogs describe the presence of fields, not whether those fields carry usable information.
They also rarely connect one cohort's records across repositories, show how much of the cohort carries each modality, or distinguish a dataset that has not been reused from one whose reuse cannot be measured.

The prototype makes the problem concrete.
The Foundation Medicine Adult Cancer Dataset contains 18,004 cases and is the largest cohort in the Genomic Data Commons.
Its vital-status field is populated for 100% of cases and informative for 0% because every value is "not reported."
Race is recorded as "not reported" for all 18,004 cases.
Every treatment field is empty.
No survival, treatment-response, or race-stratified analysis can be justified from the harmonized records, regardless of the cohort size.
54,012 of the 54,096 files are controlled access, so a researcher can spend substantial effort and request access before learning that the intended analysis is blocked.

The same pattern is not an isolated data-quality complaint.
Thirty-two records in the current corpus have vital status populated but entirely uninformative, race uninformative, and no treatment field populated.
Twenty of those records are GDC projects, including seventeen NCI-MATCH arms.
The Chernobyl-exposed thyroid cohort reports a median follow-up of 115 months, but that time is derivable for only 12 of 449 cases and no informative outcome exists to pair with it.

Three distinctions are therefore essential to responsible reuse:

- A field can be absent.
- A field can be populated but uninformative.
- A field can be unavailable to the measurement layer even though it may exist in a paper, supplement, or controlled file.

These states imply different scientific conclusions and different remedies.
The prototype preserves them instead of collapsing them into a misleading yes or no.
Its status `not measured` is never treated as `not supported`.

The same interpretive gap affects reuse measurement.
Of 602 records, 378 have no citable accession specific enough for literature tracing.
For those records, a short reuse count would mean "not measurable," not "unused."
One publication in the corpus has 6,519 citations but no citable data identifier.
Citation to the originating paper is also not the same as analysis of the data.

The proposed approach is a reusable NCI layer with four parts.

### 1. A capability contract for every research output

Repositories would expose a small, common set of machine-readable fields describing what a dataset, software package, protocol, model, or clinical-trial output can support.
For data, the contract would include cohort size, modality coverage, field-level completeness, outcome derivability, access tier, identifiers, and explicit limitations.
For other outputs, the same pattern would carry version, dependencies, intended use, known failure modes, and a stable citation identifier.

The key requirement is that capability claims be measured or explicitly attributed.
"Survival analysis possible" should be derived from informative vital status and a usable time-to-event field, not inferred from a dataset title.

### 2. A question-first discovery interface

Researchers and agents should be able to describe an analysis in ordinary language and receive a ranked shortlist based on measured fit.
The interface should show blocking limitations before capabilities.
It should support queries such as "find open cohorts with both survival and treatment-response endpoints" or "find underused datasets with matched imaging and molecular data."

The prototype already exposes capability filters, an analysis-fit object with six verdicts, plain-language agent briefs, an OpenAPI description, JSON-LD, and MLCommons Croissant exports.

It also provides runnable examples for both human researchers and AI agents.
Six Python workbooks are executed end to end against live public APIs, with receipts and output hashes.
The same corpus is exported as machine-readable records, constraints-first agent briefs, JSON-LD, Croissant, and an OpenAPI surface so an agent can make the same selection without scraping a page.
Every dataset page also carries a route from the record to the repository files.
The route is derived from the dataset's own identifiers, access tier, and repository policy, and it distinguishes the steps a person takes from the API or token steps an agent takes.
Generated steps carry derived evidence pointing to the policy they apply, while reviewer-written routes remain authoritative.
Those six are the counted user-facing analysis workbooks, not the total executable surface.
The pipeline also contains source adapters for GDC, PDC, IDC, HTAN, cBioPortal, and NIH RePORTER, along with cached raw records and rebuild commands.

### 3. A reuse ledger with graded evidence

NCI should report reuse using stable identifiers and section-aware literature evidence.
An accession in methods, results, a table, or a figure is evidence that the reported analysis depends on the output.
A reference-list citation or a general mention is not.
The ledger should show these categories separately and report when reuse cannot be measured.

### 4. A feedback and correction loop at the point of sharing

Dataset generators should be able to claim a record, correct an interpretation, add a citable identifier, and explain the intended scientific questions.
NCI program staff, repository maintainers, librarians, and data generators should be able to review the record without changing the machine-extracted measurements.
The system should preserve both the original evidence and the correction history.

This is the right intervention because the dominant barrier is interpretation.
NCI already supports important data repositories and access mechanisms.
The proposed layer makes the existing investment legible to the people who have not already learned a cohort's limitations through personal networks.

That is also an equity intervention.
Trainees, investigators at less-resourced institutions, patient-centered researchers, and researchers outside the original data-generating consortium are least likely to know which datasets are genuinely analysis-ready.
The prototype shows that a smaller and less famous resource can be more useful for a specific question than a large, well-known cohort.
The HIV-enriched cervical cancer cohort from Uganda, for example, includes 207 tumors from Black African women among 212 tumors and has highly complete ECOG information in the harmonized records.
Its practical value is difficult to see from a generic catalog description.

## Prompt 2: Potential impact on the cancer research community

The immediate impact is to return time and prevent avoidable access requests.
The first prototype workbook accepts a GDC project identifier, measures the fields that decide six common analysis classes, and returns a verdict in about a minute using the live public API.
It can expose a blocked survival or treatment-response analysis before a researcher downloads files, requests controlled access, or commits to a grant aim.
The other executed workbooks show how a human can derive survival correctly, test treatment-response fields, find scarce modalities, join patients across repositories, and select a dataset the way an AI agent should.

The prototype's current corpus shows the scale of the opportunity:

- 602 dataset records across five repositories and 29 measurement types.
- Clinical completeness measured for 385 records in a shared vocabulary.
- 206 records with a derivable survival endpoint and 62 with recorded treatment response.
- 69 curated research questions and six executed workbooks attached to 15 dataset pages.
- 602 dataset pages with generated or curated access routes, including 2,373 policy-backed generated steps.
- 796 verified reuse studies where an accession was located in an analysis-relevant article section.
- 865 distinct NCI awards linked through NIH RePORTER.
- 349,817 patients or subjects represented across 601 records that report a count.

The larger impact is on which resources get used.
The prototype fits a transparent robust model of expected reuse using cohort size, years available, modality breadth, and access tier.
It marks 20 records as materially underexplored after excluding records whose reuse cannot be measured.
The model ships its coefficients, diagnostics, rejected specification, and worst-case overprediction so the label can be recomputed or challenged.

The underexplored set includes resources with clear scientific value.
The NSCLC Radiogenomics collection pairs CT and PET imaging with matched expression on 211 patients and has three verified analyzing articles.
The CPTAC gastric study carries five scarce analytical layers on 193 tumors and is openly downloadable.
Across the Proteomic Data Commons, ubiquitylome data occur in five studies and lipidomics in three.
These are not simply small or low-quality resources.
They are difficult to discover as answers to a question.

Cross-repository linkage creates another measurable opportunity.
The prototype identifies 39 cohorts present in both the Genomic Data Commons and the Imaging Data Commons.
For TCGA-BRCA, the executed workbook finds a patient-level join of 1,098 of 1,098 cases.
Both molecular and imaging data are available, but neither repository's individual catalog page makes the multimodal opportunity obvious.

The proposed NCI layer would make these benefits measurable at portfolio scale.
We would evaluate it using four indicators:

1. Time from a research question to a defensible dataset shortlist and first result.
2. The proportion of selections that reach a completed analysis instead of being abandoned after data inspection or access request.
3. The share of reuse accruing to resources outside the current most-reused group.
4. The accuracy and correction rate of capability statements, measured by generator and reviewer feedback.

NCI could also track two upstream sharing indicators that the prototype shows are actionable:
the proportion of outputs with a stable citable identifier, and the proportion with enough outcome and modality metadata to support capability measurement.
In the current corpus, 378 of 602 records lack an accession specific enough to trace reuse.
That is a concrete deposition-time problem, not merely a downstream analytics problem.

The expected scientific return is multiplicative.
Better capability metadata helps a researcher choose a dataset.
Better cross-repository links help them combine outputs.
Better reuse evidence helps NCI identify what is working and where additional documentation or community support will produce the greatest return.
Better identifiers make the impact of public investment visible rather than inferred from paper citations.

## Prompt 3: Innovation and awareness of existing efforts

This proposal builds on NCI infrastructure rather than replacing it.
The Cancer Research Data Commons and its nodes provide important access and harmonization.
The Cancer Data Aggregator supports federated discovery.
The Genomic Data Commons, Proteomic Data Commons, Imaging Data Commons, Human Tumor Atlas Network, cBioPortal, dbGaP, DataCite, and other resources each solve important parts of the sharing problem.
Existing analysis environments such as cBioPortal and UCSC Xena are valuable once a researcher knows which cohort and variables to use.

The proposed layer occupies a different point in the workflow.
Existing catalogs generally answer "what is here?"
The layer proposed here answers "what question can this support, what will it not support, and how do I start?"

Four aspects of the prototype demonstrate the novelty.

### Measured fitness rather than declared contents

The pipeline derives clinical completeness from each repository's own records and maps fields into one controlled vocabulary.
It separates absent values from populated non-answers and handles one-to-many treatment records without pretending they are per-case percentages.
It then applies shared, explicit thresholds for six analysis verdicts.
The same vocabulary currently covers every GDC project, 126 of 130 PDC cohorts, and 166 of 228 cBioPortal studies.

### Reuse evidence rather than citation volume

The reuse index uses section-scoped Europe PMC searches and reports analyzed data separately from declared availability, accession mentions, and general references.
The field choice is calibrated against the live index on every build.
For the current calibration token, a broad availability field matched 3,953 of 5,146 articles that mentioned the token anywhere and therefore could not discriminate reuse.
The narrower data-availability field matched 311.
A deliberately invalid indexed field returned zero hits, providing a sentinel that the method is not silently falling back to free-text search.

The pipeline also checks accession precision because Europe PMC splits hyphenated accessions into separate indexed words.
For example, the TCGA-BRCA count is corrected after sampling full text rather than treating every raw hit as literal reuse.

### Underexplored as a recomputable measurement

Raw reuse counts are not comparable across datasets of different size, age, modality breadth, and access tier.
The prototype fits a Huber robust regression on the log-transformed analyzing-article count.
It deliberately excludes program membership because the disparity between heavily used and underused programs is the subject of measurement, not a nuisance variable to remove.
The full model and diagnostics are published with the data.

### Agent-readable constraints first

The prototype exports one full structured record per dataset, a constraints-first Markdown brief, JSON-LD, Croissant, an OpenAPI description, and capability-filterable endpoints.
An agent can therefore filter on measured fields, read blocking limitations, and receive a runnable task brief without scraping a page or guessing what a title implies.
This matters because a size-ranked agent selects the 18,004-case FM-AD cohort and then attempts an analysis the data cannot support.

The system is also designed to correct itself.
Three plausible-looking errors were caught during self-audit.
One follow-up calculation used a single non-null field and produced an incorrect TCGA-BRCA median.
One availability-dating pass placed a program before its founding year because a hyphenated accession matched word-wise.
The third is the most instructive: all fourteen HTAN atlases were being counted on a Synapse folder identifier, which no author writes in a paper, so each scored zero reuse in every tier while their marker papers hold 856, 676, and 611 citations.
Fourteen atlases nobody had ever referenced was a broken query, not a finding.
Those records now report that their reuse is unmeasurable instead of publishing a shortfall against an expectation, which is exactly the distinction this proposal asks NCI to make.
The published calibration, receipts, and verification reports make these failure modes visible instead of hiding them behind a polished interface.

## Prompt 4: Transferability, sustainability, and feasibility

Feasibility is demonstrated by the working prototype.
The current build contains 602 records, 385 records with measured clinical completeness, 20 project-curated showcase pages, 20 model-identified underexplored resources, 796 verified reuse studies, 865 linked NCI awards, six executed workbooks, and a generated access route for every supported repository record.
The workbooks run end to end against public APIs and ship execution receipts containing the run time, package information, and output hash.
A verification pass found 123 of 123 checked links resolving across the curated pages.

The method has modest technical requirements.
The source adapters use public APIs and published repository files.
The generated site can be archived as static JSON and Markdown with a small query surface.
The pipeline caches HTTP responses by request so the corpus can be rebuilt deterministically or inspected offline from the cache.
Code is MIT licensed, and curated content and structured exports are CC BY 4.0.

The approach transfers across NCI and NIH because it is based on stable concepts rather than one portal's interface.
The concepts are identifiers, provenance, field completeness, explicit limitations, reusable analysis examples, and evidence of downstream use.
Adding a repository requires a source adapter and vocabulary mapping, not a new scientific definition of reuse or a new user experience.
The same pattern could be applied to CCDI, additional Cancer Data Service resources, other NIH data programs, software tools, protocols, models, and clinical-trial outputs.

Sustainability depends on separating automation from judgment.
Machine extraction should refresh counts, coverage, linkages, and literature evidence.
Human review should add interpretation, resolve ambiguous marker publications, and correct records when data generators provide better information.
The current build makes this boundary explicit.
It has 20 project-curated showcase records, while the generated statistics report zero records currently labeled `expert_reviewed`.
Every machine-only page says that its interpretation has not been reviewed.

The next phase would create the community workflow that the prototype points toward:

1. Add CCDI and Cancer Data Service adapters and expand coverage of existing NCI nodes.
2. Publish a small capability schema and identifier guidance that repositories can adopt at deposition.
3. Let data generators claim records, add intended-use questions, correct limitations, and supply stable identifiers.
4. Run a user study with trainees, librarians, data generators, and investigators at less-resourced institutions.
5. Measure the four outcome indicators against a baseline of ordinary catalog search.
6. Convene repository maintainers and program staff to turn the most common limitations into deposition guidance.

The most important policy changes are simple.
Every shared output should have a stable, citable identifier.
Every dataset intended for clinical or population analysis should expose a minimal machine-readable description of the outcome, treatment, demographic, and modality fields that are actually present.
Every catalog should say when a limitation is unmeasured rather than imply that no limitation exists.

There are important limitations.
Section-scoped literature tracing undercounts reuse in closed-access articles.
Records without specific accessions cannot be assessed through citation-based methods.
Clinical completeness is measured for 385 of 602 records because HTAN and IDC expose tables that do not yet map cleanly to the shared vocabulary.
Investigator-cohort discovery is biased toward institutions that deposit in cBioPortal.
Author overlap is only a proxy for independent reuse.
The reuse-gap model is least trustworthy at the upper tail of expected reuse.
These limits are published with the outputs, and the system reports `not measured` rather than converting them into false negatives.

Support from this prize would turn a working demonstration into a shared, testable NCI practice.
It would not require NCI to replace repositories or to predict scientific value with a black box.
It would add the missing interpretive layer that lets researchers and software use the outputs NCI has already funded.

The central claim is straightforward:

**Sharing a dataset is not the same as making its usable scientific scope visible.**

NCI can measure and publish that scope.
Doing so would make existing cancer research outputs easier to find, safer to select, faster to reuse, and more equitable for the people who do not already know where the hidden knowledge lives.

## Selected evidence and links

- Working demonstration: <https://cd2s.vercel.app>
- Prototype README: [`README.md`](../README.md)
- Supporting evidence: [`submission/supporting-evidence.md`](supporting-evidence.md)
- Methods implementation: [`web/app/methods/page.tsx`](../web/app/methods/page.tsx)
- Agent interface: [`web/app/agents/page.tsx`](../web/app/agents/page.tsx)
- Current generated statistics: [`pipeline/data/dist/stats.json`](../pipeline/data/dist/stats.json)
- Current reuse model: [`pipeline/data/dist/reuse_gap_model.json`](../pipeline/data/dist/reuse_gap_model.json)
- Current field calibration: [`pipeline/data/dist/field_calibration.json`](../pipeline/data/dist/field_calibration.json)
- Executed analysis workbooks: [`workbooks/executed/`](../workbooks/executed/)
- NCI Office of Data Sharing Impact Prize: <https://www.nih.gov/challenges/nci-office-data-sharing-impact-prize>
