import { shareExampleUrl } from "@/lib/community";

/**
 * The invitation, at the two sizes the site needs it: a primary button where the
 * gallery is the point of the page, and a quiet link where it sits under someone
 * else's example.
 */
export default function ShareExample({
  dataset,
  tone = "quiet",
  label = "Share your example",
}: {
  dataset?: { id: string; title?: string };
  tone?: "primary" | "quiet";
  label?: string;
}) {
  const href = shareExampleUrl(dataset);
  if (tone === "primary") {
    return (
      <a
        href={href}
        className="inline-flex shrink-0 rounded-md px-4 py-2 text-body font-medium"
        style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
      >
        {label}
      </a>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-meta font-medium hover:border-[var(--accent)]"
      style={{ borderColor: "var(--border-strong)" }}
    >
      {label}
    </a>
  );
}

/**
 * Who an example is credited to.
 *
 * A finding is only true of the run that produced it, so the credit and that run's
 * date travel together - the same rule the findings block follows, applied to the
 * person rather than the numbers.
 */
export function Credit({
  contributor,
  contributorUrl,
  when,
}: {
  contributor: string;
  contributorUrl?: string | null;
  when?: string | null;
}) {
  return (
    <span className="text-micro t-faint">
      {contributorUrl ? (
        <a href={contributorUrl} className="underline">
          {contributor}
        </a>
      ) : (
        contributor
      )}
      {when ? ` · ran ${when}` : null}
    </span>
  );
}
