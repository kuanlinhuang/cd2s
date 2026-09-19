import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { getStats } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { siteUrl } from "@/lib/site";

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: {
    default: "Cancer Data Showcase",
    template: "%s - Cancer Data Showcase",
  },
  description:
    "A guide to NCI-supported cancer datasets: what each one can answer, what it " +
    "cannot, who has reused it, and a runnable way to start.",
  openGraph: {
    title: "Cancer Data Showcase",
    description:
      "What research can I do with this dataset? Evidence-backed guides to " +
      "NCI-supported cancer research outputs, for researchers and their agents.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const stats = getStats();
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:px-3 focus:py-2"
          style={{ background: "var(--bg-raised)", color: "var(--text)" }}
        >
          Skip to content
        </a>

        <SiteHeader />

        <main id="main" className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-20">
          {children}
        </main>

        <footer className="border-t py-8 text-[12px] no-print t-muted">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 grid gap-6 sm:grid-cols-3">
            <div>
              <div className="font-medium mb-1" style={{ color: "var(--text)" }}>
                Cancer Data Showcase
              </div>
              <p>
                A guide to reusing NCI-supported cancer data. Built for the NCI Office of
                Data Sharing Impact Prize, Track 1.
              </p>
            </div>
            <div>
              <div className="font-medium mb-1" style={{ color: "var(--text)" }}>
                Provenance
              </div>
              <p>
                {stats.n_datasets.toLocaleString()} dataset records from{" "}
                {stats.n_repositories} repositories. Corpus built{" "}
                {shortDate(stats.generated_at)} with pipeline v
                {stats.pipeline_version}.
              </p>
              <p className="mt-1">
                Every claim links to its source. See{" "}
                <Link href="/methods" className="underline">
                  Methods
                </Link>{" "}
                for how the corpus is built and where it is weak.
              </p>
            </div>
            <div>
              <div className="font-medium mb-1" style={{ color: "var(--text)" }}>
                Reuse this
              </div>
              <p>
                Curated text and structured metadata are CC BY 4.0; pipeline code is MIT.
                Upstream dataset metadata keeps its original terms.
              </p>
              <p className="mt-1">
                <Link href="/agents" className="underline">
                  Bulk download and agent API
                </Link>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
