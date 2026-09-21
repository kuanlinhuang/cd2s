import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { agentModel, answer } from "@/lib/agent";

/**
 * When the language model is asked, and when it is not.
 *
 * The deterministic pass is the answer: a request whose leading candidate meets every
 * need the request stated, all of them measured, is returned as it stands. Calling a
 * model there costs a researcher seconds of waiting for wording alone, and puts a
 * network call in the path of an answer that did not need one. The model is for the
 * requests the rules cannot settle, and these pin both sides of that line by counting
 * the calls rather than by reading the wording that came back.
 *
 * `fetch` is stubbed for the whole file with an implementation that throws, so a test
 * that reaches the network is a failure rather than a silent charge to the OpenRouter
 * account of whoever ran it. Tests that want the model path arm it deliberately.
 */

/** No stated need, so the bar is cleared vacuously - the commonest shape a visitor types. */
const BARE_SUBJECT = "acute myeloid leukemia";
/** Three stated needs, each measured for the leading record and met by it. */
const RESOLVED = "Pair radiology images with RNA sequencing in lung adenocarcinoma";
/** A stated need nobody measured for any candidate, so nothing clears the bar. */
const UNRESOLVED = "neuroblastoma in a diverse population";

const unarmed = () => {
  throw new Error("the model was called on a request the rules had already settled");
};

function modelReply(ids: string[]) {
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Wording written by the model.",
              picks: ids.slice(0, 2).map((id) => ({
                id,
                verdict: "good",
                why: ["a reason grounded in a stated fact"],
                watch_out: [],
              })),
            }),
          },
        },
      ],
    }),
  };
}

/** The shortlist the rules alone produce, so a stub can answer with real ids. */
async function rulesPickIds(query: string): Promise<string[]> {
  const restore = process.env.OPENROUTER_API_KEY;
  vi.stubEnv("OPENROUTER_API_KEY", "");
  try {
    return (await answer(query)).picks.map((p) => p.id);
  } finally {
    vi.stubEnv("OPENROUTER_API_KEY", restore ?? "");
  }
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // agentModel() reads this, and a developer who exported the override README documents
  // would otherwise redden a suite that is testing the default.
  vi.stubEnv("OPENROUTER_MODEL", "");
  fetchMock = vi.fn(unarmed);
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the model is asked only about requests the rules cannot resolve", () => {
  beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"));

  it.each([BARE_SUBJECT, RESOLVED])(
    "answers %j from the measured fields without calling the model",
    async (q) => {
      const a = await answer(q);
      expect(a.picks.some((p) => p.verdict === "best")).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(a.mode).toBe("rules");
      expect(a.model).toBeNull();
      expect(a.note).toMatch(/no model was called/i);
    },
  );

  /**
   * The vacuous case and the substantive one must be covered separately: a bare subject
   * states no need and clears the bar trivially, so on its own it would pass a
   * `resolvedByRules` that had stopped checking needs at all.
   */
  it("reads three real needs out of the resolved request, and meets them", async () => {
    const a = await answer(RESOLVED);
    expect(a.needs).toEqual(expect.arrayContaining(["imaging", "transcriptomics"]));
    expect(a.picks[0].why).toEqual(
      expect.arrayContaining([expect.stringMatching(/RNA sequencing is available/)]),
    );
  });

  it("never asks the model about a request that reached no dataset", async () => {
    const a = await answer("banana bread recipe");
    expect(a.picks).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(a.note).toBeNull();
  });

  it("hands over a request where a stated need was never measured", async () => {
    const ids = await rulesPickIds(UNRESOLVED);
    expect(ids.length).toBeGreaterThan(0);
    fetchMock.mockImplementation(async () => modelReply(ids));

    const a = await answer(UNRESOLVED);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.mode).toBe("llm");
    expect(a.model).toBe(agentModel());
    expect(a.summary).toBe("Wording written by the model.");
    expect(a.note).toBeNull();
  });

  /**
   * The model reorders and rewrites; it can never introduce a dataset. It sees the same
   * deterministic candidates in the same deterministic order, of which the rules answer
   * renders the leading four, so the rendered picks are its prefix.
   */
  it("sends the model only the shortlist the rules built", async () => {
    const ids = await rulesPickIds(UNRESOLVED);
    expect(ids.length).toBeGreaterThan(0);
    fetchMock.mockImplementation(async () => modelReply(ids));
    await answer(UNRESOLVED);

    const sent = fetchMock.mock.calls[0]?.[1] as { body?: string } | undefined;
    const body = JSON.parse(String(sent?.body)) as { messages: { content: string }[] };
    const [, candidates] = body.messages.at(-1)!.content.split("Candidates (JSON):\n");
    expect(candidates, "the prompt no longer labels its candidate block").toBeDefined();

    const cards = JSON.parse(candidates) as { id: string }[];
    expect(cards.length).toBeGreaterThanOrEqual(ids.length);
    expect(cards.length).toBeLessThanOrEqual(6);
    expect(cards.map((c) => c.id).slice(0, ids.length)).toEqual(ids);
  });

  it("falls back to the rules, and says so, when the model call fails", async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 502, text: async () => "upstream" }));

    const a = await answer(UNRESOLVED);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.mode).toBe("rules");
    expect(a.model).toBeNull();
    expect(a.picks.length).toBeGreaterThan(0);
    expect(a.note).toMatch(/did not return a usable answer/i);
  });

  it("keeps the rules answer when the model names a dataset the shortlist does not hold", async () => {
    fetchMock.mockImplementation(async () => modelReply(["a-dataset-that-does-not-exist"]));

    const a = await answer(UNRESOLVED);
    expect(a.mode).toBe("rules");
    expect(a.picks.every((p) => p.id !== "a-dataset-that-does-not-exist")).toBe(true);
    expect(a.note).toMatch(/did not return a usable answer/i);
  });

  /**
   * The model now runs only where nothing clears the bar, so every verdict it is shown
   * is "good" or "caution" and it may never talk a card up past the measured one. It is
   * asked not to in the prompt; this is what makes it true.
   */
  it("never lets the model claim more for a card than the measured verdict allows", async () => {
    const ids = await rulesPickIds(UNRESOLVED);
    fetchMock.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "The model over-claims.",
                picks: ids.slice(0, 2).map((id) => ({ id, verdict: "best", why: ["x"], watch_out: [] })),
              }),
            },
          },
        ],
      }),
    }));

    const a = await answer(UNRESOLVED);
    expect(a.mode).toBe("llm");
    expect(a.picks.length).toBeGreaterThan(0);
    expect(a.picks.every((p) => p.verdict !== "best")).toBe(true);
  });
});

describe("without a key every request is answered by the rules", () => {
  beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", ""));

  it.each([BARE_SUBJECT, UNRESOLVED])(
    "tells a self-hoster what a key would add, on %j",
    async (q) => {
      const a = await answer(q);
      expect(a.mode).toBe("rules");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(a.note).toMatch(/OPENROUTER_API_KEY/);
    },
  );

  it("treats a key of nothing but whitespace as no key, without a round trip", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "   ");
    const a = await answer(UNRESOLVED);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(a.note).toMatch(/OPENROUTER_API_KEY/);
  });
});
