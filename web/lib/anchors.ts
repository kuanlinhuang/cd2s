import { NEED_PHRASES } from "@/lib/needs";

/**
 * The section of a dataset page that carries the evidence for one line of the agent's
 * answer, or null when the wording does not identify one. Rule-based wording is
 * recognised exactly; free prose - a reviewer's limitation, a model's phrasing - is not
 * guessed at, because a link labelled as provenance that points at a section which does
 * not carry the claim is worse than no link. Runs in the browser, so it must stay free
 * of server-only imports. Returning null is this function's no-claim return under the
 * claim invariant written down in lib/agent.ts.
 */
export function bulletAnchor(text: string): string | null {
  const t = text.trim().toLowerCase();
  if (NEED_PHRASES.some((p) => t.startsWith(p.toLowerCase()))) return "#fit";
  if (/has not been measured/.test(t)) return "#fit";
  if (/reviewed research questions/.test(t)) return "#useful-for";
  if (/measurement types?\b|median follow-up|^\d[\d,]* (cases|samples)/.test(t)) return "#glance";
  if (/access request/.test(t)) return "#start";
  if (/citable accession/.test(t)) return "#reuse";
  return null;
}
