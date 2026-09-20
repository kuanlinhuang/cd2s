import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import type { NavItem } from "@/components/Nav";
import SiteHeader from "@/components/SiteHeader";
import { getQuestions, getStats } from "@/lib/data";
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
 * The seven destinations, each with the one line that says why it is worth opening and
 * a count where there is one to give. Computed here because the counts come from the
 * corpus; rendered by components/Nav.tsx behind a single control.
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
      label: "Research questions",
      hint: "Start from a question and see what can answer it",
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
      label: "How this was built",
      hint: "How every number is measured, and where the corpus is weak",
      group: "trust",
    },
  ];
}

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

        <SiteHeader items={navItems()} />

        <main id="main" className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-20">
          {children}
        </main>

        <footer className="border-t py-6 text-meta no-print t-muted">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline gap-x-5 gap-y-1.5 px-4 sm:px-6">
            <span className="font-medium" style={{ color: "var(--text)" }}>
              Cancer Data Showcase
            </span>
            <span>
              {stats.n_datasets.toLocaleString()} datasets from {stats.n_repositories}{" "}
              repositories, corpus built {shortDate(stats.generated_at)}
            </span>
            <Link href="/methods" className="underline">
              How this was built
            </Link>
            <Link href="/agents" className="underline">
              For software
            </Link>
            <span>Text CC BY 4.0, code MIT</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
