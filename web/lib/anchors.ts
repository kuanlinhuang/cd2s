import { NEED_PHRASES } from "@/lib/needs";

/**
 * The section of a dataset page that carries the evidence for one line of the agent's
 * answer. Rule-based wording is recognised exactly; anything else falls back to the
 * section a reader would check first for that column. Runs in the browser, so it must
 * stay free of server-only imports.
 */
export function bulletAnchor(text: string, column: "why" | "watch_out"): string {
  const t = text.trim().toLowerCase();
  if (NEED_PHRASES.some((p) => t.startsWith(p.toLowerCase()))) return "#fit";
  if (/has not been measured/.test(t)) return "#fit";
  if (/reviewed research questions/.test(t)) return "#useful-for";
  if (/measurement types?\b|median follow-up|^\d[\d,]* (cases|samples)/.test(t)) return "#glance";
  if (/access request/.test(t)) return "#start";
  if (/citable accession/.test(t)) return "#reuse";
  return column === "why" ? "#fit" : "#limitations";
}
