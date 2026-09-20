# CD2S - Cancer Data to Study: answering "what research can I do with this dataset?"

**NCI Office of Data Sharing Impact Prize - Track 1: Research Output Sharing and Reuse Ideas**

---

## Prompt 1: Significance and Approach

NCI's data catalogs answer the question "what is in this dataset?" Researchers arrive with a
different question: "will this dataset support the analysis I want to run?" Nothing in the
current infrastructure answers it, and the gap is not cosmetic. It is the difference between a
dataset being findable and a dataset being reusable.

We built a working prototype to measure the gap, and the measurements are stark. Across 602
dataset records assembled from the Genomic Data Commons, the Proteomic Data Commons, the
Imaging Data Commons, the Human Tumor Atlas Network, and investigator cohorts curated in
cBioPortal, we audited how complete each dataset's clinical fields actually are, rather than
whether those fields exist.

The Foundation Medicine Adult Cancer Dataset holds 18,004 patients, the largest cohort in the
Genomic Data Commons. Its vital status field is populated for 100% of cases and informative for
0%: every value is "not reported." Race is "not reported" for all 18,004 patients. Every
treatment field is empty. A researcher attracted by that sample size discovers this only after
requesting controlled access to 54,012 files. Thirty-two records in our corpus share the exact
pattern - vital status uninformative, race uninformative, no treatment field populated -
twenty of them GDC projects, seventeen of those NCI-MATCH arms. Beyond FM-AD the largest are
ALCHEMIST (1,176 cases) and the West Coast Dream Team metastatic prostate cohort, where no
treatment field is populated at all in a cohort defined by its treatment history. The
Chernobyl-exposed thyroid cohort reports a median follow-up of 115 months; that median rests on
12 of 449 cases, and no outcome exists to pair it with.

Three distinctions do most of the work here, and no catalog currently draws any of them. A
field that is *absent* differs from a field that is *populated but uninformative*, and both
block an analysis for different reasons and with different remedies. A one-to-many field, such
as treatment records, cannot be read as a per-case percentage at all. And a dataset that has
not been reused differs fundamentally from one whose reuse cannot be measured.

**Who this affects.** Researchers lose weeks and access requests to dead ends. That cost falls
hardest on exactly the people this challenge prioritizes: trainees, investigators at
less-resourced institutions, and anyone without a colleague who already knows the cohort.
Knowing that ALCHEMIST will not support a survival analysis is currently tacit knowledge,
distributed by word of mouth among people already inside the relevant networks. Making it
explicit is a redistribution of access to people outside them.

It also affects which populations get studied. The HIV-positive cervical cancer cohort from
Uganda holds 212 tumors, 207 of them from Black African women, with ECOG performance status
informative for 98.6% of cases - coverage most GDC projects do not have at all. It is one of
very few NCI resources describing this population, and its usability is invisible from its
catalog entry. NCI's commitment to equitable sharing is not served by data that are technically
open but practically undiscoverable.

And it affects AI agents, now a significant consumer of public data. Asked to find a cancer
dataset, an agent ranks by cohort size and selects precisely the kind of cohort that
supports none of the analyses it will then attempt.

The gap compounds because reuse itself is largely invisible. Of our 602 records, 364 have no
accession specific enough to search the literature for. One MSK cohort's publication has 646
citations and no citable data identifier. Proteomic Data Commons accessions are almost never
quoted, so proteomic reuse cannot be traced at all. Absence of evidence is being read as
evidence of absence, and resources are judged unused when they are merely unmeasurable.

**Our approach.** Build a question-first layer over data NCI already shares. For each dataset:
measure field completeness from the repository's own records; state the research questions the
data support and the limitations that rule analyses out; trace reuse with graded evidence; link
funding through NIH RePORTER, separating NCI-funded data generation from NCI-funded reuse; and
ship an executable starting point. Every claim carries machine-readable provenance - source,
retrieval date, method, confidence - so a reader can check any line rather than trust the page.

This is the right response because the barrier is neither access nor findability. NCI has
substantially solved both. The barrier is *interpretation*, and interpretation is what no
catalog currently supplies.

---

## Prompt 2: Potential Impact on the Cancer Research Community

The immediate impact is time returned. Deciding whether a cohort fits currently takes days of
portal archaeology and often a controlled-access request that proves unnecessary. Our prototype
answers it in about a minute: the first of six executed workbooks takes a project identifier
and returns a verdict on six classes of analysis, computed live from the repository. Run it on
the 212-case Ugandan cervical cohort and it reports that survival and treatment-response
analysis are supported and stage-adjusted modeling is not, because stage is empty for every
case. That is a week of work compressed into a minute, and it happens before any access
request.

The larger impact is on which datasets get used at all. We fit a model of expected reuse from
cohort size, years available, modality breadth, and access tier, and measured the residual.
Eighteen datasets fall materially below expectation. They are not obscure because they are
weak. NSCLC Radiogenomics pairs CT and PET imaging with matched expression on 211 patients and
has three analyzing articles. The CPTAC gastric study measures 193 tumors seven ways -
proteome, phosphoproteome, acetylome, glycoproteome, ubiquitylome, metabolome, and
protein-protein interaction - and downloads openly with no account. Ubiquitylation data exist
in five studies across the entire Proteomic Data Commons; lipidomics in three. An HTAN atlas
built explicitly around therapeutic resistance, carrying the richest clinical annotation of any
atlas in the network, has no publication recorded in HTAN's own manifest. These are not
marginal resources. They are unfindable ones, and redirecting even a fraction of reuse toward
them is a direct return on money already spent.

Cross-repository linkage compounds this. We found 39 cohorts present in both the Genomic and
Imaging Data Commons, and for TCGA-BRCA the patient-level join is 1,098 of 1,098: every patient
has both molecular and imaging data, openly available today. Almost nobody makes this join,
because each portal describes only its own holdings. Making it visible costs nothing and
unlocks multimodal research already funded.

Breadth follows from the design. The approach is repository-agnostic, working wherever there is
an API and a citable identifier - genomics, proteomics, imaging, spatial biology, and
investigator cohorts alike. It surfaces resources from every NCI Division we touched rather
than from a single program, and because the structured export is public it serves consumers we
will never meet: other catalogs, AI agents, institutional data librarians, and educators who
need a cohort a student can actually finish an analysis on.

**How we would know it worked.** Four measures, all instrumentable: the proportion of dataset
selections that survive to a completed analysis rather than being abandoned; time from
question to first result; the share of reuse accruing to datasets outside the top decile of
current use; and interpretation accuracy, measured by how often a curated limitation is later
disputed by the data generators.

Finally, it gives ODS something it currently lacks: a quantitative, reproducible view of where
NCI data investment is and is not converting into reuse, and which barriers are responsible.
Our corpus already separates datasets that are unused from datasets whose use cannot be
measured, and identifies two dominant and fixable causes - missing citable accessions and
absent clinical annotation. Both are addressable at deposition, which makes this diagnostic
directly actionable at the policy level rather than only at the user level.

---

## Prompt 3: Innovation and Awareness of Existing Efforts

NCI has invested heavily and successfully in this space, and we built on that work rather than
around it. The Cancer Research Data Commons and its nodes solved access and harmonization. The
Cancer Data Aggregator federates queries across them. The CRDC data catalog, dbGaP, re3data,
DataCite Commons, and Google Dataset Search address findability. cBioPortal and UCSC Xena make
analysis-ready matrices available and are genuinely excellent at it. HTAN publishes a curated
publication manifest that is better evidence than anything text mining produces, and we use it
in preference to our own extraction wherever it exists. FAIRsharing documents standards. The
NIH Common Fund Data Ecosystem addresses cross-program discovery. The DataWorks! Prize
recognizes reuse practice.

Every one of these is metadata-first: they describe what a dataset contains. None tells a
researcher whether a dataset can answer their question, and none distinguishes a field that is
present from a field that is usable. That distinction is where our contribution sits, and it is
a layer above the infrastructure rather than a replacement for any of it.

Four things are new.

**Measured fitness rather than declared contents.** We compute per-field informativeness from
each repository's own records, in one shared vocabulary, so that a proteomic cohort and a
genomic one are graded by the same rule, down to when an endpoint counts as derivable. It
covers 385 of our 602 records today - every GDC
project, 126 of 130 Proteomic Data Commons cohorts and 166 of 228 cBioPortal studies - and it
is what reveals that an 18,004-case cohort supports no survival analysis. It is a small
technical step that nobody is currently taking.

**Graded reuse evidence.** Citing a dataset's paper is not reusing its data, yet reuse
statistics in the field routinely treat them as one. We grade by where an accession appears in
an article: methods, results, a table or a figure means the reported findings depend on the
data; a reference-list mention does not. Europe PMC indexes article sections separately, which
makes the distinction tractable. Crucially, the field choice was calibrated against the live
index rather than assumed, and it is re-measured on every build rather than quoted from a note.
In the current build, Europe PMC's broad AVAILABILITY field matched 3,953 of the 5,146 articles
mentioning TCGA-LUAD anywhere and therefore cannot discriminate, while the narrow
DATA_AVAILABILITY field matched 311 and can. An unindexed field name returns zero hits, which
is what shows the section fields are genuinely indexed; a build where that check fails does not
publish. We also test independence by author overlap,
because a follow-up by the team that generated the data is a continuation rather than someone
else finding the resource useful.

**"Underexplored" as a measurement, not a label.** Raw reuse counts are not comparable across
datasets of different size, age, and access tier. We model expected reuse and report the
residual, and we deliberately exclude program membership as a covariate: "it is part of TCGA"
is the disparity being measured, not a nuisance to adjust away. Model, coefficients, and
diagnostics are published so the label can be recomputed or contested. We also record the
specification we rejected and why, because a count model on raw counts extrapolated absurdly
at the tails.

**Agent-readable interpretation.** Structured metadata tells an agent which fields exist. Our
agent brief tells it, in its first section, what the data cannot support. Constraints precede
capabilities by design. We emit MLCommons Croissant carrying per-field completeness and
blocking limitations, which no cancer data resource currently provides and which speaks
directly to AI-readiness assessment.

One further point about rigor. The method's value showed most clearly when it caught our own
errors. Our first follow-up calculation read one GDC field and reported a median of 29.8 months
for TCGA-BRCA computed from a single patient, because that field is null for 1,097 of 1,098
cases and the real values live elsewhere. Our first availability-dating pass placed TARGET-AML
in 2005, four years before the program existed, because one Europe PMC field matches the words
of a hyphenated accession independently. Both bugs produced plausible numbers that a reviewer
would not have questioned. A method that surfaces this class of error in its own output is the
same method that surfaces it in the data.

---

## Prompt 4: Transferability, Sustainability, and Feasibility

**Feasibility is demonstrated rather than asserted.** The prototype exists and runs: 602
dataset records, clinical field completeness measured for 385 of them, 20 deeply curated pages
(14 of them less-known resources), 736 NCI awards resolved through RePORTER, 778 verified reuse
studies, and six workbooks executed end to end against live public APIs. Each workbook ships a receipt recording when it ran, with which
package versions, how long it took, and a hash of its outputs, so "independently executed" is a
claim a reviewer can check. A link check across the curated pages resolves 124 of 124 URLs. All
of it was built by a small team in a short period.

**Nothing here depends on privileged conditions.** No credentials, no negotiated agreements, no
preferential access, no institutional infrastructure. Every source is a public, unauthenticated
API. Every HTTP response is cached on disk keyed by request, so a full rebuild is deterministic
and can run offline from the cache. The site is static files plus one small query endpoint, and
the entire corpus is archivable as a directory of JSON - which matters for a resource that
should still resolve in five years. A graduate student with a laptop can reproduce it; an
institution with no data-science group can host it. Code is MIT, curated content CC BY 4.0.

**The method transfers beyond cancer.** Nothing in it is oncology-specific. It requires an API,
a citable accession, and a literature index, conditions met across NIH. The same pipeline would
run against NIDDK, NHLBI, or Common Fund repositories with new source adapters and no change to
the measurement or the model.

**Sustaining it needs one thing that does not scale: judgment.** Machine extraction handles
counts, coverage, linkage, and reuse tracing, and refreshes automatically. Deciding what a
dataset is genuinely good for does not. We learned this concretely: automated inference
nominated a 13-citation methods paper as TCGA-BRCA's marker paper, because the actual marker
paper never quotes its own project identifier. So expert judgment lives in reviewed overlay
files, one per dataset, separate from extracted values and attributed to a named reviewer, and
every unreviewed page states plainly that its interpretation has not been checked. Scaling
curation means recruiting the people who already hold this knowledge - program staff, data
generators, and the trainees who have reused these cohorts. That is a community activity NCI is
uniquely placed to convene, and a natural fit for the Data Jamboree and the ODS symposium.

**Honest constraints.** Section indexing requires full text, so closed-access articles are
under-represented and reuse counts are biased downward for datasets whose users publish in
subscription journals. Datasets without citable accessions cannot be assessed at all, which is
364 of our 602. Field-level completeness reaches 385 of 602 records: the Human Tumor Atlas
Network publishes one clinical table per topic rather than harmonized fields, and the Imaging
Data Commons serves per-collection tables named by the submitting trial, so neither can be
graded field by field. Those records read *not measured*, which we never fold into *not
supported*. Discovery of investigator cohorts runs through cBioPortal and therefore skews
toward institutions that deposit there, Memorial Sloan Kettering most of all. Author-overlap
independence is a proxy that will miss consortium reuse. Our corpus is a demonstration, not a
census, and we say so on the site.

**What we would do with support.** Broaden source coverage, particularly CCDI and the Cancer
Data Service. Build the curation workflow that lets dataset generators claim and correct their
own pages, which converts curation from a bottleneck into a contribution channel. Run a user
study measuring whether researchers actually find suitable datasets faster, against the four
metrics above. And work with ODS on the deposition-time changes that would prevent the problem
rather than document it: a citable accession for every shared dataset, and a minimal
outcome-annotation standard, which together would move a large fraction of the portfolio from
unmeasurable to measurable.

The most useful thing we can offer ODS is not the prototype. It is evidence that a measurable,
fixable barrier sits between NCI's data investment and its return, and a demonstrated method
for measuring it.
