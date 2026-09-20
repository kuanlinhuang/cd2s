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

/** Return controlled tissue codes named by complete vocabulary phrases in the query. */
export function subjectsNamedIn(
  query: string,
  vocab: SubjectVocabulary = getSubjects(),
): Set<string> {
  const text = normalizeSubject(query);
  const matches: { phrase: string; code: string }[] = [];
  for (const subject of vocab.subjects) {
    for (const raw of subject.synonyms) {
      const phrase = normalizeSubject(raw);
      if (containsPhrase(text, phrase)) matches.push({ phrase, code: subject.code });
    }
  }
  const longest = matches.filter(
    (match) =>
      !matches.some(
        (other) =>
          other.phrase !== match.phrase && containsPhrase(other.phrase, match.phrase),
      ),
  );
  return new Set(longest.map((match) => match.code));
}
