import type { Metadata } from "next";

import DatasetBrowser from "@/components/DatasetBrowser";
import { getBrowseRows, getFacets, getStats } from "@/lib/data";

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
        <h1 className="text-2xl font-semibold tracking-tight">Datasets</h1>
        <p className="mt-2 max-w-2xl text-lede t-muted">
          {stats.n_datasets.toLocaleString()} records from {stats.n_repositories}{" "}
          repositories. The filters describe what you can <em>do</em> with a dataset,
          measured from how complete its fields are rather than from what it claims.
        </p>
      </div>
      <DatasetBrowser
        rows={getBrowseRows()}
        facets={getFacets()}
        initial={{
          q: one("q"),
          modality: one("modality"),
          cancer: one("cancer"),
          site: one("site"),
          capability: one("capability"),
          repository: one("repository"),
          access: one("access"),
          review: one("review"),
        }}
      />
    </>
  );
}
