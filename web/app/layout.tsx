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
    default: "CD2S: Cancer Data to Study",
    template: "%s - CD2S",
  },
  description:
    "A guide to NCI-supported cancer datasets: what each one can answer, what it " +
    "cannot, who has reused it, and a runnable way to start.",
  openGraph: {
    title: "CD2S: Cancer Data to Study",
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

        <footer className="border-t py-6 text-[12px] no-print t-muted">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline gap-x-5 gap-y-1.5 px-4 sm:px-6">
            <span className="font-medium" style={{ color: "var(--text)" }}>
              CD2S
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
