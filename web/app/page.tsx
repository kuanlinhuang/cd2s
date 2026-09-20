import Link from "next/link";

import AskBox from "@/components/AskBox";
import { ReuseVsCitations } from "@/components/charts/ReuseVsCitations";
import { getIndex, getQuestions, getRecord, getStats } from "@/lib/data";
import { SCARCE_MODALITIES, num } from "@/lib/format";
import { reuseChartRows, untraceableTopCited } from "@/lib/reuse-chart";

/**
 * The front door is the question box. Above the fold: one headline, the box, and the
 * needs a visitor can start from instead. Below it, one section on data reuse. The
 * other pages are destinations the answer routes to, not a menu to decode here.
 */

export default function Home() {
  const stats = getStats();
  const index = getIndex();
  const nQuestions = getQuestions().length;
  const nMultimodal = index.filter((r) => r.n_modalities >= 3).length;
  const nScarce = index.filter((r) => r.modalities.some((m) => SCARCE_MODALITIES.has(m))).length;

  const capabilities = [
    { href: "/datasets?capability=survival", label: "Survival analysis", n: stats.n_with_survival },
    { href: "/datasets?capability=treatment", label: "Treatment response", n: stats.n_with_treatment_response },
    { href: "/datasets?capability=multimodal", label: "Three or more measurement types", n: nMultimodal },
    { href: "/datasets?capability=scarce", label: "A scarce measurement", n: nScarce },
  ];

  const reuseRows = reuseChartRows(index, getRecord);
  const untraceable = untraceableTopCited(index, 5);

  return (
    <>
      {/* ---------------------------------------------------------------- ask */}
      <section className="pt-14 pb-10">
        <h1 className="max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl">
          Which NCI dataset can answer your question?
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed t-muted">
          {num(stats.n_datasets)} datasets from {stats.n_repositories} repositories. Every
          answer says what a dataset can support, what it cannot, and where that claim comes
          from.
        </p>

        <div className="mt-6 max-w-3xl">
          <AskBox examples />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="t-faint">Or start from</span>
          {capabilities.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
            >
              {c.label}
              <span className="tnum font-medium" style={{ color: "var(--accent)" }}>
                {num(c.n)}
              </span>
            </Link>
          ))}
          <Link href="/datasets" className="underline">
            All {num(stats.n_datasets)} datasets
          </Link>
          <Link href="/questions" className="underline">
            {num(nQuestions)} reviewed questions
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- reuse */}
      <section className="border-t py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Data reuse</h2>
          <Link href="/methods#reuse" className="text-[13px] underline">
            How reuse is measured
          </Link>
        </div>
        <p className="mt-1 mb-5 max-w-3xl text-[13px] t-muted">
          Citing a dataset&rsquo;s paper is not the same as using its data. Each row compares
          the two for one dataset: articles citing the original paper, and articles whose
          methods, results, tables or figures name the accession.
        </p>
        <ReuseVsCitations
          rows={reuseRows}
          untraceable={untraceable}
          nDatasets={stats.n_datasets}
          nNoAccession={stats.n_without_citable_accession}
        />
      </section>
    </>
  );
}
