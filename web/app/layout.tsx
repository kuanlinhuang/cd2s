import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { Nav, type NavItem } from "@/components/Nav";
import { getIndex, getQuestions, getStats } from "@/lib/data";
import { num, shortDate } from "@/lib/format";
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

/**
 * The same seven destinations the site has always had, now behind one control, each
 * with the one line that says why it is worth opening. See components/Nav.tsx.
 */
function navItems(): NavItem[] {
  const stats = getStats();
  return [
    {
      href: "/datasets",
      label: "Datasets",
      hint: "Browse and filter by what you need to do with the data",
      count: num(stats.n_datasets),
      group: "find",
    },
    {
      href: "/questions",
      label: "By question",
      hint: "Start from a research question and see what can answer it",
      count: num(getQuestions().length),
      group: "find",
    },
    {
      href: "/underexplored",
      label: "Underexplored",
      hint: "Reused far less than comparable datasets, with the model behind the label",
      count: num(stats.n_underexplored),
      group: "find",
    },
    {
      href: "/compare",
      label: "Compare",
      hint: "Up to four datasets side by side, showing only where they differ",
      count: "4 at a time",
      group: "use",
    },
    {
      href: "/network",
      label: "Network",
      hint: "Which award paid for a dataset, and which awards its reuse went on to fund",
      count: num(stats.n_grants_linked),
      group: "use",
    },
    {
      href: "/agents",
      label: "For agents",
      hint: "Every page as structured data, with open search and agent endpoints",
      count: "JSON",
      group: "use",
    },
    {
      href: "/methods",
      label: "Methods",
      hint: "How every number is measured, and where the corpus is weak",
      group: "trust",
    },
  ];
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const stats = getStats();
  const index = getIndex();
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

        <header
          className="sticky top-0 z-40 border-b backdrop-blur no-print"
          style={{ background: "color-mix(in srgb, var(--bg) 96%, transparent)" }}
        >
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
            <div className="flex h-16 items-center gap-4 sm:gap-6">
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid h-8 w-8 place-items-center rounded-md font-mono text-meta font-bold"
                  style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
                >
                  CD
                </span>
                <span className="text-title font-semibold tracking-tight whitespace-nowrap">
                  Cancer Data Showcase
                </span>
              </Link>
              <Nav items={navItems()} />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6">
          {children}
        </main>

        <footer className="border-t py-8 text-meta no-print t-muted">
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
                {num(stats.n_datasets)} dataset records from {stats.n_repositories}{" "}
                repositories, {num(index.length)} of them in the search index. Corpus built{" "}
                {shortDate(stats.generated_at)} with pipeline v{stats.pipeline_version}.
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
