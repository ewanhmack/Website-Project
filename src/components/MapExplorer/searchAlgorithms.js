import { getReverseEdges, haversine } from "./roadNetwork";
import { MAX_SPEED_MPH, METRES_PER_MILE } from "./roadSpeeds";

export const ALGORITHMS = {
  dijkstra: { label: "Dijkstra" },
  astar: { label: "A*" },
  weighted: { label: "Weighted A*" },
  greedy: { label: "Greedy best-first" },
  bidirectional: { label: "Bidirectional A*" },
};

const MAX_SPEED_MPS = (MAX_SPEED_MPH * METRES_PER_MILE) / 3600;

// Binary min-heap over parallel arrays. Stale entries are skipped on pop
// instead of being updated in place.
class MinHeap {
  constructor() {
    this.keys = [];
    this.ids = [];
  }

  get size() {
    return this.keys.length;
  }

  peekKey() {
    return this.keys[0];
  }

  push(key, id) {
    const { keys, ids } = this;
    let i = keys.length;
    keys.push(key);
    ids.push(id);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (keys[parent] <= key) {
        break;
      }
      keys[i] = keys[parent];
      ids[i] = ids[parent];
      i = parent;
    }
    keys[i] = key;
    ids[i] = id;
  }

  pop() {
    const { keys, ids } = this;
    const top = ids[0];
    const lastKey = keys.pop();
    const lastId = ids.pop();
    const n = keys.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        if (left >= n) {
          break;
        }
        const right = left + 1;
        const child = right < n && keys[right] < keys[left] ? right : left;
        if (keys[child] >= lastKey) {
          break;
        }
        keys[i] = keys[child];
        ids[i] = ids[child];
        i = child;
      }
      keys[i] = lastKey;
      ids[i] = lastId;
    }
    return top;
  }
}

// Records the playback: the order nodes were explored and, per explored node,
// which nodes it added to the frontier.
class Recorder {
  constructor() {
    this.explored = [];
    this.addedOffsets = [0];
    this.added = [];
  }

  explore(id) {
    this.explored.push(id);
  }

  add(id) {
    this.added.push(id);
  }

  endStep() {
    this.addedOffsets.push(this.added.length);
  }
}

function makeCost(network, metric) {
  return metric === "time" ? network.time : network.dist;
}

// Straight-line lower bound on the remaining cost. For time, that's the
// distance at the network's top speed, so it never overestimates.
function makeHeuristic(network, metric, targetId) {
  const { lat, lng } = network;
  const tLat = lat[targetId];
  const tLng = lng[targetId];
  const divisor = metric === "time" ? MAX_SPEED_MPS : 1;
  return (id) => haversine(lat[id], lng[id], tLat, tLng) / divisor;
}

function unidirectional(network, startId, endId, { metric, heuristicWeight, greedy }) {
  const { nodeCount, offsets, targets } = network;
  const cost = makeCost(network, metric);
  const h = makeHeuristic(network, metric, endId);
  const g = new Float64Array(nodeCount).fill(Infinity);
  const viaEdge = new Int32Array(nodeCount).fill(-1);
  const closed = new Uint8Array(nodeCount);
  const open = new MinHeap();
  const recorder = new Recorder();

  g[startId] = 0;
  open.push(h(startId) * heuristicWeight, startId);

  while (open.size > 0) {
    const u = open.pop();
    if (closed[u]) {
      continue;
    }
    closed[u] = 1;
    recorder.explore(u);

    if (u === endId) {
      recorder.endStep();
      return { recorder, pathEdges: walkBack(network, viaEdge, endId, startId) };
    }

    for (let e = offsets[u]; e < offsets[u + 1]; e++) {
      const v = targets[e];
      if (closed[v]) {
        continue;
      }
      // Greedy search ignores path cost entirely: first discovery wins.
      if (greedy) {
        if (viaEdge[v] !== -1 || v === startId) {
          continue;
        }
        g[v] = g[u] + cost[e];
        viaEdge[v] = e;
        open.push(h(v), v);
        recorder.add(v);
        continue;
      }
      const tentative = g[u] + cost[e];
      if (tentative < g[v]) {
        g[v] = tentative;
        viaEdge[v] = e;
        open.push(tentative + h(v) * heuristicWeight, v);
        recorder.add(v);
      }
    }
    recorder.endStep();
  }

  return { recorder, pathEdges: null };
}

// Edge indices from start to end, following viaEdge back from the end.
function walkBack(network, viaEdge, endId, startId) {
  const sourceOf = buildSourceLookup(network);
  const edges = [];
  let node = endId;
  while (node !== startId) {
    const e = viaEdge[node];
    edges.push(e);
    node = sourceOf(e);
  }
  return edges.reverse();
}

// Edge index -> source node, by binary search over the CSR offsets.
function buildSourceLookup({ offsets, nodeCount }) {
  return (e) => {
    let lo = 0;
    let hi = nodeCount - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= e) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  };
}

// Symmetric bidirectional A*: forward from the start towards the end, and
// backward along incoming edges from the end towards the start. Every
// unfound route must pass through an open node on each side, so once either
// side's smallest key can't beat the best meeting found so far, that meeting
// is optimal (given a consistent heuristic).
function bidirectional(network, startId, endId, { metric }) {
  const { nodeCount, offsets, targets } = network;
  const reverse = getReverseEdges(network);
  const cost = makeCost(network, metric);
  const hForward = makeHeuristic(network, metric, endId);
  const hBackward = makeHeuristic(network, metric, startId);

  const gF = new Float64Array(nodeCount).fill(Infinity);
  const gB = new Float64Array(nodeCount).fill(Infinity);
  const viaF = new Int32Array(nodeCount).fill(-1);
  const viaB = new Int32Array(nodeCount).fill(-1);
  const closedF = new Uint8Array(nodeCount);
  const closedB = new Uint8Array(nodeCount);
  const openF = new MinHeap();
  const openB = new MinHeap();
  const recorder = new Recorder();

  gF[startId] = 0;
  gB[endId] = 0;
  openF.push(hForward(startId), startId);
  openB.push(hBackward(endId), endId);

  let best = Infinity;
  let meet = -1;
  if (startId === endId) {
    best = 0;
    meet = startId;
  }

  while (openF.size > 0 && openB.size > 0) {
    if (Math.max(openF.peekKey(), openB.peekKey()) >= best) {
      break;
    }
    const forward = openF.peekKey() <= openB.peekKey();
    const open = forward ? openF : openB;

    const u = open.pop();
    const closed = forward ? closedF : closedB;
    if (closed[u]) {
      continue;
    }
    closed[u] = 1;
    recorder.explore(u);

    if (forward) {
      for (let e = offsets[u]; e < offsets[u + 1]; e++) {
        const v = targets[e];
        const tentative = gF[u] + cost[e];
        if (tentative < gF[v]) {
          gF[v] = tentative;
          viaF[v] = e;
          openF.push(tentative + hForward(v), v);
          recorder.add(v);
        }
        if (gF[v] + gB[v] < best) {
          best = gF[v] + gB[v];
          meet = v;
        }
      }
    } else {
      for (let r = reverse.offsets[u]; r < reverse.offsets[u + 1]; r++) {
        const v = reverse.sources[r];
        const e = reverse.forwardEdge[r];
        const tentative = gB[u] + cost[e];
        if (tentative < gB[v]) {
          gB[v] = tentative;
          viaB[v] = e;
          openB.push(tentative + hBackward(v), v);
          recorder.add(v);
        }
        if (gF[v] + gB[v] < best) {
          best = gF[v] + gB[v];
          meet = v;
        }
      }
    }
    recorder.endStep();
  }

  if (meet === -1) {
    return { recorder, pathEdges: null };
  }

  const forwardEdges = meet === startId ? [] : walkBack(network, viaF, meet, startId);
  const backwardEdges = [];
  let node = meet;
  while (node !== endId) {
    const e = viaB[node];
    backwardEdges.push(e);
    node = targets[e];
  }
  return { recorder, pathEdges: forwardEdges.concat(backwardEdges) };
}

export function runSearch(network, startId, endId, { algorithm, metric, weight }) {
  const t0 = performance.now();

  let result;
  if (algorithm === "bidirectional") {
    result = bidirectional(network, startId, endId, { metric });
  } else {
    result = unidirectional(network, startId, endId, {
      metric,
      heuristicWeight: { dijkstra: 0, astar: 1, weighted: weight, greedy: 1 }[algorithm],
      greedy: algorithm === "greedy",
    });
  }

  const searchMs = performance.now() - t0;
  const { recorder, pathEdges } = result;

  let distanceM = 0;
  let timeS = 0;
  const path = [startId];
  for (const e of pathEdges ?? []) {
    distanceM += network.dist[e];
    timeS += network.time[e];
    path.push(network.targets[e]);
  }

  return {
    found: pathEdges !== null,
    explored: Int32Array.from(recorder.explored),
    addedOffsets: Int32Array.from(recorder.addedOffsets),
    added: Int32Array.from(recorder.added),
    path: Int32Array.from(pathEdges ? path : []),
    distanceM,
    timeS,
    searchMs,
  };
}
