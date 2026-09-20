import { getSubjects } from "@/lib/data";
import type { SubjectVocabulary } from "@/lib/types";

export function normalizeSubject(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && word !== "nos")
    .map((word) =>
      word.length > 4 && word.endsWith("s") && !/(?:ss|us|is)$/.test(word)
        ? word.slice(0, -1)
        : word,
    )
    .join(" ");
}

export function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

/**
 * The vocabulary's synonyms in their folded form, computed once per vocabulary.
 *
 * Every question re-normalised all thirty-one subjects and every synonym under them -
 * a regex, a split, a map and a join per phrase - to compare against a string that had
 * just been normalised the same way. The vocabulary is a shipped, immutable file, so
 * the folded form is cached against it. Keyed weakly so a test that passes its own
 * vocabulary is not kept alive by this map.
 */
const _folded = new WeakMap<SubjectVocabulary, { phrase: string; code: string }[]>();

function foldedPhrases(vocab: SubjectVocabulary): { phrase: string; code: string }[] {
  const hit = _folded.get(vocab);
  if (hit) return hit;
  const out: { phrase: string; code: string }[] = [];
  for (const subject of vocab.subjects) {
    for (const raw of subject.synonyms) {
      out.push({ phrase: normalizeSubject(raw), code: subject.code });
    }
  }
  _folded.set(vocab, out);
  return out;
}

/** Return controlled tissue codes named by complete vocabulary phrases in the query. */
export function subjectsNamedIn(
  query: string,
  vocab: SubjectVocabulary = getSubjects(),
): Set<string> {
  const text = normalizeSubject(query);
  const matches = foldedPhrases(vocab).filter((candidate) =>
    containsPhrase(text, candidate.phrase),
  );
  const longest = matches.filter(
    (match) =>
      !matches.some(
        (other) =>
          other.phrase !== match.phrase && containsPhrase(other.phrase, match.phrase),
      ),
  );
  return new Set(longest.map((match) => match.code));
}
