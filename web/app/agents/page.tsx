import type { Metadata } from "next";
import Link from "next/link";

import { Callout, Card } from "@/components/ui";
import { getLargestUninformativeCohort, getStats } from "@/lib/data";
import { num } from "@/lib/format";

export const metadata: Metadata = {
  title: "For software",
  description:
    "Structured metadata, a read-only JSON API, and plain-language dataset briefs " +
    "written for language models.",
};

const FILES = [
  {
    path: "/data/index.json",
    what: "One slim row per dataset with the measured capability flags. Start here.",
  },
  {
    path: "/data/datasets/{id}.json",
    what: "The complete record, including an evidence array on every substantive claim.",
  },
  {
    path: "/api/v1/datasets/{id}",
    what:
      "The same record with analysis_fit added: six analysis verdicts (supported, limited, " +
      "blocked, or unknown when not measured) derived from field completeness.",
  },
  {
    path: "/data/agent/{id}.md",
    what: "Plain-language brief for a language model. Constraints first, deliberately.",
  },
  {
    path: "/data/croissant/{id}.json",
    what: "MLCommons Croissant, carrying per-field completeness and blocking limitations.",
  },
  {
    path: "/data/jsonld/{id}.jsonld",
    what: "schema.org/Dataset with DCAT terms, for catalog and search-engine ingest.",
  },
  { path: "/data/facets.json", what: "Browse dimensions with counts." },
  {
    path: "/data/search.json",
    what:
      "Free text per dataset, split out of the index so the browse page need not ship " +
      "it. The same text is on index.json as search_text; prefer that one.",
  },
  { path: "/data/questions.json", what: "Every curated research question, flattened." },
  {
    path: "/data/reuse_gap_model.json",
    what: "Coefficients and diagnostics for the underexplored label, so it can be recomputed.",
  },
  { path: "/data/stats.json", what: "Corpus-level statistics." },
  { path: "/llms.txt", what: "Orientation file following the llms.txt convention." },
  { path: "/openapi.json", what: "OpenAPI 3.1 description of the JSON surface." },
];

export default function AgentsPage() {
  const stats = getStats();
  const trap = getLargestUninformativeCohort();
  return (
    <>
      <div className="pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">For software</h1>
        <p className="mt-3 max-w-3xl text-[14px] t-muted">
          Everything on this site is also a file: JSON records, agent briefs, Croissant,
          JSON-LD, and search and agent endpoints. No key, no rate limit.
        </p>
      </div>

      {/* ------------------------------------------------- the important part */}
      <section className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          Read limitations before capabilities
        </h2>
        <div className="mt-3 max-w-3xl">
          <Callout tone="warn" title="The failure this resource exists to prevent">
            {trap ? (
              <>
                An agent that ranks datasets by cohort size and then asks about outcome
                walks into cohorts like{" "}
                <Link href={`/datasets/${trap.row.id}`} className="underline">
                  {trap.row.short_title ?? trap.row.title}
                </Link>
                : {num(trap.row.n_cases)} patients with a vital status field filled for{" "}
                {trap.vitalStatusPct !== null ? `${Math.round(trap.vitalStatusPct)}%` : "every one"}{" "}
                of them and informative for none. It supports no survival analysis at any
                sample size. Nothing in its catalog entry says so.
              </>
            ) : (
              <>
                An agent that ranks datasets by cohort size and then asks about outcome
                walks into cohorts whose vital status is filled for every case and
                informative for none. They support no survival analysis at any sample
                size, and nothing in a catalog entry says so.
              </>
            )}
          </Callout>
        </div>
        <div className="prose-cds mt-4 text-[14px]">
          <p>
            Every agent brief puts constraints first for that reason, and every record
            carries <code>limitations</code> graded by severity. A <code>blocking</code>{" "}
            limitation rules out a class of analysis however the model is specified.
            Reading them costs one request.
          </p>
          <p>
            Two flags carry most of the decision weight, both measured from field
            completeness rather than taken from a description:{" "}
            <code>has_survival_endpoint</code> and <code>has_treatment_response</code>.
            The <code>analysis_fit</code> array on <code>/api/v1/datasets/{"{id}"}</code>{" "}
            extends them to six analyses; its <code>unknown</code> status means the field
            was not measured for that record and must not be read as absent. A
            third, <code>has_citable_accession</code>, matters differently: when it is
            false, reuse could not be traced at all, so a missing reuse count says nothing
            about the dataset.
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- endpoints */}
      <section className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Files and endpoints</h2>
        <p className="mt-1 mb-4 max-w-3xl text-[13px] t-muted">
          Everything is a static JSON or Markdown file with permissive CORS. No key, no
          rate limit, no account. A resource meant to resolve in five years should not
          depend on a running service.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b text-left t-faint">
                <th className="py-1.5 pr-4 font-medium">Path</th>
                <th className="py-1.5 font-medium">Contents</th>
              </tr>
            </thead>
            <tbody>
              {FILES.map((f) => (
                <tr key={f.path} className="border-b last:border-b-0 align-top">
                  <td className="py-2 pr-4">
                    <code className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
                      {f.path}
                    </code>
                  </td>
                  <td className="py-2">{f.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 mb-2 text-[13px] font-medium uppercase tracking-wide t-faint">
          Dataset agent
        </h3>
        <Card>
          <code className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
            GET /api/v1/agent?q=... &middot; POST /api/v1/agent {"{"}&quot;q&quot;: &quot;...&quot;{"}"}
          </code>
          <p className="mt-2 text-[13px] t-muted">
            Describe an analysis in plain language. The response is a ranked shortlist with
            the reasons each dataset fits and the blockers to check first. Retrieval and the
            capability checks are deterministic; when the server has an{" "}
            <code>OPENROUTER_API_KEY</code>, a language model (DeepSeek V4 Flash unless{" "}
            <code>OPENROUTER_MODEL</code> says otherwise) ranks and explains the shortlist,
            and <code>mode</code> says which happened.
          </p>
        </Card>

        <h3 className="mt-6 mb-2 text-[13px] font-medium uppercase tracking-wide t-faint">
          Query endpoint
        </h3>
        <Card>
          <code className="font-mono text-[12px]" style={{ color: "var(--accent)" }}>
            GET /api/v1/search
          </code>
          <p className="mt-2 text-[13px] t-muted">
            Capability-first filtering. Parameters: <code>q</code>, <code>modality</code>,{" "}
            <code>site</code>, <code>access</code>, <code>repository</code>,{" "}
            <code>survival</code>, <code>treatment_response</code>,{" "}
            <code>underexplored</code>, <code>showcase</code>, <code>min_cases</code>,{" "}
            <code>min_modalities</code>, <code>limit</code>.
          </p>
          <p className="mt-2 text-[13px] t-muted">
            A side-by-side comparison is also a URL: <code>/compare?ids=a,b,c</code>, up to
            four dataset ids.
          </p>
          <pre
            className="mt-3 overflow-x-auto rounded border p-3 font-mono text-[12px]"
            style={{ background: "var(--bg-sunken)" }}
          >
            <code>{`# Cohorts where treatment-response analysis is actually possible
curl "/api/v1/search?treatment_response=true&survival=true&min_cases=200"

# Under-used datasets carrying a scarce measurement
curl "/api/v1/search?underexplored=true&modality=ubiquitylome"

# Then read the constraints before planning anything
curl "/data/agent/gdc-fm-ad.md"`}</code>
          </pre>
        </Card>
      </section>

      {/* ---------------------------------------------------------- workbooks */}
      <section className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">Runnable workbooks</h2>
        <p className="mt-1 mb-4 max-w-3xl text-[13px] t-muted">
          {num(stats.n_datasets_with_workbook ?? 0)} dataset pages carry a workbook executed end to end
          against the live public APIs. Each ships a receipt recording when it ran, with
          which package versions, how long it took and a hash of its outputs. So
          &ldquo;executed&rdquo; is a claim you can check.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Audit whether a dataset can answer your question", "Measures clinical completeness and returns a verdict for six analysis classes."],
            ["Survival from open data, endpoint derived correctly", "Includes the three-field follow-up derivation that a naive version gets wrong."],
            ["Treatment response, after checking the field is real", "Separates genuine response categories from disease-status codes."],
            ["Find and use the scarcest measurements", "Ranks analytical fractions by scarcity across the Proteomic Data Commons."],
            ["Join the same patients across two repositories", "Patient-level intersection of GDC molecular data with IDC imaging."],
            ["Select a dataset the way an agent should", "Contrasts size-ranked with capability-ranked selection, then emits a task brief."],
          ].map(([title, body]) => (
            <Card key={title}>
              <h3 className="font-medium text-[14px]">{title}</h3>
              <p className="mt-1 text-[13px] t-muted">
                {body}
              </p>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-[13px] t-muted">
          Source lives in <code>workbooks/python/</code> as plain scripts in the{" "}
          <code># %%</code> cell format; executed notebooks and receipts are in{" "}
          <code>workbooks/executed/</code>. Notebooks are build artifacts, not source,
          because notebook JSON is unreviewable in a diff.
        </p>
      </section>

      {/* ------------------------------------------------------------- caveats */}
      <section className="py-8 border-t">
        <h2 className="text-lg font-semibold tracking-tight">
          What an agent should not conclude from this data
        </h2>
        <ul className="mt-3 space-y-2 text-[14px]">
          {[
            [
              "A missing reuse count is not an absent reuse",
              `${num(stats.n_without_citable_accession)} of ${num(stats.n_datasets)} datasets have no accession specific enough to search for. For those, reuse is unmeasurable, not zero.`,
            ],
            [
              "An empty limitations list is not a clean bill of health",
              "Limitations are written by a human reviewer. Records with review_status of machine_only have measured field coverage but no written interpretation. No warning means nobody has looked yet.",
            ],
            [
              "A high citation count is not evidence of reuse",
              "Citations to a dataset's publication measure attention to the finding. Both numbers are reported separately so they are not confused.",
            ],
            [
              "Coverage percentages describe the repository's harmonized records",
              "A field absent here may still exist in a paper's supplement or in a controlled phenotype file. The page reports what the repository serves.",
            ],
          ].map(([title, body]) => (
            <li key={title}>
              <Card>
                <h3 className="font-medium text-[14px]">{title}</h3>
                <p className="mt-1 text-[13px] t-muted">
                  {body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13px] t-muted">
          Full methodology, including where the whole approach is weak, is on{" "}
          <Link href="/methods" className="underline">
            the Methods page
          </Link>
          .
        </p>
      </section>
    </>
  );
}
