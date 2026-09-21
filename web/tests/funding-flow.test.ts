import { describe, expect, it } from "vitest";

import {
  FLOW_LANE_CAP,
  NETWORK_SCOPES,
  fitLanes,
  getAwards,
  getDatasetFunding,
  getFundingCandidates,
  getNetwork,
  type NetworkScope,
} from "@/lib/data";
import type { NetworkData, NetworkEdge, NetworkLane, NetworkNode } from "@/lib/types";

/**
 * The funding graph has to fit on a screen, and has to stay honest about it.
 *
 * Run against the real corpus rather than a fixture, because the defect this pins was
 * only ever visible against real data: every slice was drawn whole, so the whole-corpus
 * view was 332 award cards in one column and 56,000px tall, and the reviewed slice
 * 27,000px. Nothing about that was wrong in a fixture of three nodes.
 *
 * The invariants below are what make a capped graph trustworthy rather than merely
 * short. A lane may draw fewer nodes than it holds, but it must say how many it left
 * out, it must not leave a connector pointing at a card it did not draw, and it must
 * never drop the node the view is about.
 */

const scopes: NetworkScope[] = NETWORK_SCOPES.map((s) => s.key);

function laneOf(data: NetworkData, i: number) {
  return data.nodes.filter((n) => n.lane === i);
}

function check(what: string, data: NetworkData) {
  const drawn = new Set(data.nodes.map((n) => n.id));

  data.lanes.forEach((lane, i) => {
    expect(laneOf(data, i).length, `${what}: lane ${i} over cap`).toBeLessThanOrEqual(
      FLOW_LANE_CAP,
    );
    const more = lane.more ?? 0;
    expect(Number.isInteger(more) && more >= 0, `${what}: lane ${i} bad more`).toBe(true);
  });

  for (const e of data.edges) {
    expect(drawn.has(e.source), `${what}: edge from undrawn ${e.source}`).toBe(true);
    expect(drawn.has(e.target), `${what}: edge to undrawn ${e.target}`).toBe(true);
  }

  // No card wired to nothing. Every node in these graphs has a neighbour in the corpus
  // - an award is on a dataset, an article quotes one - so a node left unconnected is
  // always the cap having cut its last neighbour out from under it.
  const linked = new Set(data.edges.flatMap((e) => [e.source, e.target]));
  for (const n of data.nodes) {
    if (data.edges.length === 0) break;
    expect(linked.has(n.id), `${what}: ${n.id} drawn with no connector`).toBe(true);
  }
}

describe("every funding graph fits a screen", () => {
  it.each(scopes)("caps the %s slice", (scope) => {
    check(`scope ${scope}`, getNetwork(scope));
  });

  it("caps the busiest awards, which are whole cancer centres", () => {
    const busiest = getAwards().slice(0, 5);
    expect(busiest.length).toBeGreaterThan(0);
    for (const award of busiest) {
      check(`award ${award.num}`, getNetwork(`award:${award.num}`));
    }
  });

  it("caps the best-documented datasets, which carry the most awards a side", () => {
    const busiest = getFundingCandidates().slice(0, 10);
    expect(busiest.length).toBeGreaterThan(0);
    for (const candidate of busiest) {
      const funding = getDatasetFunding(candidate.id);
      expect(funding, candidate.id).not.toBeNull();
      check(`dataset ${candidate.id}`, funding!.graph);
    }
  });
});

describe("what the cap may not take away", () => {
  it("keeps the dataset the view is about, however many awards crowd it out", () => {
    for (const candidate of getFundingCandidates().slice(0, 10)) {
      const graph = getDatasetFunding(candidate.id)!.graph;
      const focus = graph.nodes.filter((n) => n.focus);
      expect(focus.map((n) => n.id), candidate.id).toEqual([`dataset:${candidate.id}`]);
    }
  });

  it("leaves the tables to carry every award the graph set aside", () => {
    // The page's claim is that nothing is lost, only moved: the lane says how many it
    // omitted and the table below lists them all. That only holds if the table is the
    // full set rather than the drawn one.
    const candidate = getFundingCandidates().find((c) => c.n_generation > FLOW_LANE_CAP);
    expect(candidate, "no dataset carries more generation awards than the cap").toBeDefined();
    const funding = getDatasetFunding(candidate!.id)!;
    const lane = funding.graph.lanes[0];
    expect(funding.graph.nodes.filter((n) => n.lane === 0)).toHaveLength(FLOW_LANE_CAP);
    expect((lane.more ?? 0) + FLOW_LANE_CAP).toBe(funding.generation.length);
  });

  it("reports a slice's true size as what it drew plus what it says it omitted", () => {
    const data = getNetwork("all");
    const total = (i: number) => laneOf(data, i).length + (data.lanes[i].more ?? 0);
    // The whole corpus, not the eighteen cards the graph draws of it.
    expect(total(1)).toBeGreaterThan(500);
    expect(total(0)).toBeGreaterThan(FLOW_LANE_CAP);
  });
});

// --------------------------------------------------------------------------------------
// The rule itself, on graphs small enough to reason about by hand.
// --------------------------------------------------------------------------------------

const lanes = (n: number): NetworkLane[] =>
  Array.from({ length: n }, (_, i) => ({ label: `lane ${i}`, hint: "" }));

const node = (id: string, lane: number, focus?: true): NetworkNode =>
  ({ id, lane, kind: "award", label: id, ...(focus ? { focus } : {}) }) as NetworkNode;

const edge = (source: string, target: string): NetworkEdge =>
  ({ source, target, kind: "generation" }) as NetworkEdge;

describe("how the cap chooses what to draw", () => {
  it("keeps the best connected, not the first few", () => {
    // Four awards onto one dataset, declared worst-connected first. Taking the head of
    // the array would draw the two spokes and drop the hubs.
    const nodes = [node("a1", 0), node("a2", 0), node("a3", 0), node("a4", 0), node("d", 1)];
    const edges = [
      edge("a1", "d"),
      edge("a2", "d"),
      edge("a3", "d"),
      edge("a4", "d"),
      edge("a3", "x"),
      edge("a4", "x"),
      edge("a4", "y"),
    ];
    const out = fitLanes(nodes, edges, lanes(2), 2);
    expect(out.nodes.filter((n) => n.lane === 0).map((n) => n.id)).toEqual(["a3", "a4"]);
    expect(out.lanes[0].more).toBe(2);
  });

  it("restores the order the lane was built in, which the ranking destroyed", () => {
    // `getDatasetFunding` orders the last lane to stop its connectors crossing. A lane
    // rendered in rank order would undo that for every capped graph.
    const nodes = [node("first", 0), node("second", 0), node("third", 0), node("d", 1)];
    const edges = [
      edge("third", "d"),
      edge("third", "x"),
      edge("first", "d"),
      edge("first", "y"),
      edge("second", "d"),
    ];
    const out = fitLanes(nodes, edges, lanes(2), 2);
    expect(out.nodes.filter((n) => n.lane === 0).map((n) => n.id)).toEqual(["first", "third"]);
  });

  it("never cuts the node the view is about, however poorly connected", () => {
    const nodes = [node("hub1", 0), node("hub2", 0), node("subject", 0, true)];
    const edges = [edge("hub1", "x"), edge("hub1", "y"), edge("hub2", "x"), edge("hub2", "y")];
    const out = fitLanes(nodes, edges, lanes(1), 1);
    expect(out.nodes.map((n) => n.id)).toEqual(["subject"]);
  });

  it("drops a card whose every neighbour another lane cut, and counts it", () => {
    // `keep` is drawn because it links to the surviving article; `orphan` links only to
    // the one that lost the cut, so drawing it would put a card in the last column with
    // no line reaching it.
    const nodes = [node("p1", 0), node("p2", 0), node("keep", 1), node("orphan", 1)];
    const edges = [edge("p1", "keep"), edge("p1", "z"), edge("p2", "orphan")];
    const out = fitLanes(nodes, edges, lanes(2), 1);
    expect(out.nodes.map((n) => n.id)).toEqual(["p1", "keep"]);
    expect(out.lanes[1].more).toBe(1);
  });

  it("keeps a node that never had a neighbour, because that is a fact not a casualty", () => {
    const nodes = [node("lonely", 0), node("d", 1)];
    const out = fitLanes(nodes, [], lanes(2), 6);
    expect(out.nodes.map((n) => n.id)).toEqual(["lonely", "d"]);
    expect(out.lanes[0].more ?? 0).toBe(0);
  });

  it("accounts for every node it did not draw", () => {
    const nodes = [
      ...Array.from({ length: 9 }, (_, i) => node(`a${i}`, 0)),
      ...Array.from({ length: 4 }, (_, i) => node(`d${i}`, 1)),
    ];
    const edges = nodes
      .filter((n) => n.lane === 0)
      .map((n, i) => edge(n.id, `d${i % 4}`));
    const out = fitLanes(nodes, edges, lanes(2), 3);
    out.lanes.forEach((lane, i) => {
      const drawn = out.nodes.filter((n) => n.lane === i).length;
      const held = nodes.filter((n) => n.lane === i).length;
      expect(drawn + (lane.more ?? 0), `lane ${i}`).toBe(held);
    });
  });

  it("leaves a graph that already fits completely alone", () => {
    const nodes = [node("a", 0), node("b", 0), node("d", 1)];
    const edges = [edge("a", "d"), edge("b", "d")];
    const out = fitLanes(nodes, edges, lanes(2), 6);
    expect(out.nodes).toEqual(nodes);
    expect(out.edges).toEqual(edges);
    expect(out.lanes.every((l) => l.more === undefined)).toBe(true);
  });

  it("does not write back to the shared lane definitions it was handed", () => {
    // Both graph builders pass module-level constants. A cap that mutated them would
    // leak one request's omission counts into the next.
    const shared = lanes(2);
    const nodes = [node("a", 0), node("b", 0), node("d", 1)];
    fitLanes(nodes, [edge("a", "d"), edge("b", "d")], shared, 1);
    expect(shared.every((l) => l.more === undefined)).toBe(true);
  });
});
