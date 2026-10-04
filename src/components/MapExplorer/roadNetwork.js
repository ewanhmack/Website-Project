import { edgeSpeedMph, METRES_PER_MILE } from "./roadSpeeds";

const SNAPSHOT_VERSION = 2;

export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

// Builds a compressed sparse row graph from the snapshot: the outgoing edges
// of node n are edges offsets[n] .. offsets[n + 1] - 1. Typed arrays keep
// 1.3M nodes and ~2.7M edges compact and fast to search.
export function buildNetwork({ version, highways, nodes, ways }) {
  if (version !== SNAPSHOT_VERSION) {
    throw new Error(
      `Road snapshot is format ${version}, expected ${SNAPSHOT_VERSION}. Re-run scripts/build-road-snapshot.mjs`,
    );
  }

  const nodeCount = nodes.length / 2;
  const lat = new Float64Array(nodeCount);
  const lng = new Float64Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    lat[i] = nodes[i * 2];
    lng[i] = nodes[i * 2 + 1];
  }

  // First pass: count outgoing edges per node.
  const degree = new Int32Array(nodeCount);
  let edgeCount = 0;
  for (const way of ways) {
    const oneway = way[1];
    for (let i = 3; i < way.length - 1; i++) {
      degree[way[i]]++;
      edgeCount++;
      if (!oneway) {
        degree[way[i + 1]]++;
        edgeCount++;
      }
    }
  }

  const offsets = new Int32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i++) {
    offsets[i + 1] = offsets[i] + degree[i];
  }

  const targets = new Int32Array(edgeCount);
  const dist = new Float32Array(edgeCount);
  const time = new Float32Array(edgeCount);
  const highway = new Uint8Array(edgeCount);
  const cursor = offsets.slice(0, nodeCount);

  function addEdge(from, to, metres, seconds, highwayIndex) {
    const e = cursor[from]++;
    targets[e] = to;
    dist[e] = metres;
    time[e] = seconds;
    highway[e] = highwayIndex;
  }

  // Second pass: fill the edges.
  for (const way of ways) {
    const [highwayIndex, oneway, taggedSpeedMph] = way;
    const metresPerSecond =
      (edgeSpeedMph(highways[highwayIndex], taggedSpeedMph) * METRES_PER_MILE) / 3600;

    for (let i = 3; i < way.length - 1; i++) {
      const a = way[i];
      const b = way[i + 1];
      const metres = haversine(lat[a], lng[a], lat[b], lng[b]);
      const seconds = metres / metresPerSecond;
      addEdge(a, b, metres, seconds, highwayIndex);
      if (!oneway) {
        addEdge(b, a, metres, seconds, highwayIndex);
      }
    }
  }

  const network = {
    nodeCount,
    lat,
    lng,
    offsets,
    targets,
    dist,
    time,
    highway,
    highways,
    reverse: null,
  };
  network.routable = findMainComponent(network);
  return network;
}

// Flags the strongly connected component containing the busiest junction:
// every flagged node can reach, and be reached from, every other. Clicks only
// snap to these, so a click never lands on an isolated fragment (a one-way
// stub, or a road cut off by excluding private access) with no route out.
function findMainComponent(network) {
  const { nodeCount, offsets, targets } = network;
  const reverse = getReverseEdges(network);

  let seed = 0;
  for (let i = 1; i < nodeCount; i++) {
    if (offsets[i + 1] - offsets[i] > offsets[seed + 1] - offsets[seed]) {
      seed = i;
    }
  }

  function reach(edgeOffsets, neighbours) {
    const seen = new Uint8Array(nodeCount);
    const stack = [seed];
    seen[seed] = 1;
    while (stack.length > 0) {
      const u = stack.pop();
      for (let e = edgeOffsets[u]; e < edgeOffsets[u + 1]; e++) {
        const v = neighbours[e];
        if (!seen[v]) {
          seen[v] = 1;
          stack.push(v);
        }
      }
    }
    return seen;
  }

  const forward = reach(offsets, targets);
  const backward = reach(reverse.offsets, reverse.sources);
  for (let i = 0; i < nodeCount; i++) {
    forward[i] &= backward[i];
  }
  return forward;
}

// Incoming edges, needed only by bidirectional search. Each entry records the
// forward edge index so path costs come from the same edge data.
export function getReverseEdges(network) {
  if (network.reverse) {
    return network.reverse;
  }

  const { nodeCount, offsets, targets } = network;
  const edgeCount = targets.length;
  const inDegree = new Int32Array(nodeCount);
  for (let e = 0; e < edgeCount; e++) {
    inDegree[targets[e]]++;
  }

  const revOffsets = new Int32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i++) {
    revOffsets[i + 1] = revOffsets[i] + inDegree[i];
  }

  const sources = new Int32Array(edgeCount);
  const forwardEdge = new Int32Array(edgeCount);
  const cursor = revOffsets.slice(0, nodeCount);
  for (let from = 0; from < nodeCount; from++) {
    for (let e = offsets[from]; e < offsets[from + 1]; e++) {
      const r = cursor[targets[e]]++;
      sources[r] = from;
      forwardEdge[r] = e;
    }
  }

  network.reverse = { offsets: revOffsets, sources, forwardEdge };
  return network.reverse;
}

// Nearest routable node by straight-line distance. Longitude is scaled by
// cos(lat) so east-west and north-south distances compare fairly.
export function findNearestNode({ lat, lng, routable }, targetLat, targetLng) {
  const lngScale = Math.cos((targetLat * Math.PI) / 180);
  let nearest = -1;
  let minDist = Infinity;

  for (let i = 0; i < lat.length; i++) {
    if (!routable[i]) {
      continue;
    }
    const dLat = lat[i] - targetLat;
    const dLng = (lng[i] - targetLng) * lngScale;
    const d = dLat * dLat + dLng * dLng;
    if (d < minDist) {
      minDist = d;
      nearest = i;
    }
  }

  return nearest;
}
