/**
 * Where a reader who has already done the analysis sends it.
 *
 * The gallery's examples are worth more as a place other people's work lands than as a
 * library the project writes alone, so every surface that shows an example also shows
 * the way in. The route is the repository's own issue form rather than anything hosted
 * here: the site is a static export with no backend to accept a submission, and an
 * example is only published once someone has run it and recorded a receipt, which is a
 * review step and not a form field.
 */

const REPO = "https://github.com/kuanlinhuang/cd2s";

/** How an example with no named contributor is credited: it is the project's own. */
export const HOUSE_CONTRIBUTOR = "CD2S workbooks";

/**
 * A prefilled link to the community-example issue form.
 *
 * `dataset` prefills the field when the invitation is shown on one dataset's page, so
 * the person does not have to copy an id out of the URL.
 */
export function shareExampleUrl(dataset?: { id: string; title?: string }): string {
  const params = new URLSearchParams({ template: "community-example.yml" });
  if (dataset) {
    params.set("dataset", dataset.id);
    if (dataset.title) params.set("title", `Community example: ${dataset.title}`);
  }
  return `${REPO}/issues/new?${params.toString()}`;
}

/** Every community example, listed. */
export const COMMUNITY_EXAMPLES_URL = `${REPO}/issues?q=is%3Aissue+label%3Acommunity-example`;
