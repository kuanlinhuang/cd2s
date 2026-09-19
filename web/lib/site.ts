/**
 * The site's public origin, for absolute URLs in the sitemap, metadata and snippets.
 *
 * NEXT_PUBLIC_SITE_URL wins when set. On Vercel the platform provides the production
 * host as VERCEL_PROJECT_PRODUCTION_URL at build time, so a fresh project gets correct
 * absolute URLs with no configuration. Null when neither is known.
 */
export function siteUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return null;
}

/** The origin, or the placeholder the pipeline uses when nobody set one. */
export function siteUrlOrPlaceholder(): string {
  return siteUrl() ?? "https://cancer-data-showcase.example.org";
}
