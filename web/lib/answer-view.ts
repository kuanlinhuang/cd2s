/**
 * Whether the shortlist has anything to say beneath the router's cards.
 *
 * The answer page shows both surfaces. When nothing matched and the router has already
 * offered a destination, the shortlist says nothing at all: a sentence denying that
 * anything matched, printed under a card naming the dataset that did, is the one
 * contradiction the page must not be able to produce.
 *
 * The answer page renders this in the browser, so this module must stay free of
 * server-only imports. `lib/intent.ts` reads the corpus through `lib/data.ts`, which
 * reads the filesystem, so importing it from a client component breaks the build.
 */
export function showsShortlist(pickCount: number, routed: boolean): boolean {
  return pickCount > 0 || !routed;
}
