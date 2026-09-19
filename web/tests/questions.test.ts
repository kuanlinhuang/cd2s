import { describe, expect, it } from "vitest";

import { groupByTopic, matchesQuery, topicLabel } from "@/lib/questions";
import type { QuestionRow } from "@/lib/types";

/**
 * The browse-by-question page must never lose a question: every reviewed question
 * appears under at least one topic, and the default view shows all of them.
 */

function question(over: Partial<QuestionRow> = {}): QuestionRow {
  return {
    qid: "q1",
    dataset_id: "ds",
    dataset_title: "A dataset",
    question: "Which features predict survival?",
    rationale: "Vital status is informative for most cases.",
    feasibility: "direct",
    approx_n: 100,
    modalities: ["rna_seq"],
    topics: ["survival"],
    access_tier: "open",
    is_underexplored: false,
    ...over,
  } as QuestionRow;
}

describe("groupByTopic", () => {
  it("orders topics by size, then alphabetically, and files untagged questions under other", () => {
    const groups = groupByTopic([
      question({ qid: "a", topics: ["survival"] }),
      question({ qid: "b", topics: ["survival", "treatment"] }),
      question({ qid: "c", topics: ["imaging"] }),
      question({ qid: "d", topics: [] }),
    ]);
    expect(groups.map((g) => g.topic)).toEqual(["survival", "imaging", "other", "treatment"]);
    expect(groups[0].questions.map((q) => q.qid)).toEqual(["a", "b"]);
    expect(groups.find((g) => g.topic === "other")?.questions.map((q) => q.qid)).toEqual(["d"]);
  });

  it("keeps every question in at least one group", () => {
    const qs = [question({ qid: "a" }), question({ qid: "b", topics: [] })];
    const seen = new Set(groupByTopic(qs).flatMap((g) => g.questions.map((q) => q.qid)));
    expect(seen).toEqual(new Set(["a", "b"]));
  });
});

describe("matchesQuery", () => {
  it("matches on question, rationale, dataset title and measurement labels", () => {
    const q = question();
    expect(matchesQuery(q, "SURVIVAL")).toBe(true);
    expect(matchesQuery(q, "vital status")).toBe(true);
    expect(matchesQuery(q, "a dataset")).toBe(true);
    expect(matchesQuery(q, "rna sequencing", (m) => (m === "rna_seq" ? "RNA sequencing" : m))).toBe(true);
    expect(matchesQuery(q, "proteomics")).toBe(false);
  });

  it("treats a blank query as matching everything", () => {
    expect(matchesQuery(question(), "   ")).toBe(true);
  });
});

describe("topicLabel", () => {
  it("turns a slug into a readable heading", () => {
    expect(topicLabel("treatment-response")).toBe("Treatment response");
  });
});
