import Link from "next/link";

/**
 * The page a visitor lands on from a stale link or a mistyped dataset id.
 *
 * Next.js ships a bare "404" here with no way onward, so this one says what happened
 * in plain words and offers the three routes a visitor most likely wanted.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl pt-16 pb-10 text-center">
      <p className="text-meta font-medium uppercase tracking-wide t-faint">Page not found</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        There is nothing at this address.
      </h1>
      <p className="mt-3 text-lede t-muted">
        The link may be out of date, or a dataset id may be misspelled. Dataset pages use
        the id shown in the breadcrumb and in the browse list.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2 text-body">
        <Link
          href="/datasets"
          className="rounded-md px-3 py-1.5 font-medium"
          style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
        >
          Browse all datasets
        </Link>
        <Link
          href="/questions"
          className="rounded-md border px-3 py-1.5 font-medium"
          style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)" }}
        >
          Research questions
        </Link>
        <Link
          href="/"
          className="rounded-md border px-3 py-1.5 font-medium"
          style={{ background: "var(--bg-raised)", borderColor: "var(--border-strong)" }}
        >
          Ask a question
        </Link>
      </div>
    </div>
  );
}
