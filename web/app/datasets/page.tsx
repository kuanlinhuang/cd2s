import type { Metadata } from "next";

import DatasetBrowser from "@/components/DatasetBrowser";
import { getBrowseRows, getFacets, getStats, getSubjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Search NCI-supported cancer datasets by research capability, cancer type, " +
    "measurement type, population and access level.",
};

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const stats = getStats();

  return (
    <>
      <div className="pt-10 pb-6">
        <p className="text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
          Search across repositories
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Find data for your analysis</h1>
        <p className="mt-2 max-w-2xl text-lede t-muted">
          {stats.n_datasets.toLocaleString()} datasets from {stats.n_repositories}{" "}
          repositories. Filter by the analysis you need to run, not only by what a repository
          says a dataset contains. Capability filters are measured from the data fields themselves.
        </p>
      </div>
      <DatasetBrowser
        rows={getBrowseRows()}
        facets={getFacets()}
        subjects={getSubjects()}
        initial={{
          q: one("q"),
          modality: one("modality"),
          cancer: one("cancer"),
          site: one("site"),
          subject: one("subject"),
          capability: one("capability"),
          repository: one("repository"),
          access: one("access"),
          review: one("review"),
        }}
      />
    </>
  );
}
