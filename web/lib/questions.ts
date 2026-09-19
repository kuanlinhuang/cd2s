import type { QuestionRow } from "@/lib/types";

/**
 * Grouping and filtering for the "browse by research question" page.
 *
 * Kept out of the component so the rules are testable: a question with no topic files
 * under "other", topics are ordered by how many questions they hold, and a search
 * matches the question, its rationale, its dataset or a measurement name.
 */

export const OTHER_TOPIC = "other";

export function topicsOf(q: QuestionRow): string[] {
  return q.topics.length > 0 ? q.topics : [OTHER_TOPIC];
}

export function topicLabel(topic: string): string {
  const label = topic.replace(/-/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type TopicGroup = { topic: string; questions: QuestionRow[] };

/** Every topic with its questions, most populated first, ties broken alphabetically. */
export function groupByTopic(questions: QuestionRow[]): TopicGroup[] {
  const byTopic = new Map<string, QuestionRow[]>();
  for (const q of questions) {
    for (const t of topicsOf(q)) {
      byTopic.set(t, [...(byTopic.get(t) ?? []), q]);
    }
  }
  return [...byTopic.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([topic, qs]) => ({ topic, questions: qs }));
}

export function matchesQuery(
  q: QuestionRow,
  query: string,
  labelModality: (m: string) => string = (m) => m,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [q.question, q.rationale, q.dataset_title, ...q.modalities.map(labelModality)]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}
