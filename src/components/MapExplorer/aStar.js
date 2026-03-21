function heuristic(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

export function aStar(graph, startId, endId) {
  const startNode = graph.get(startId);
  const endNode = graph.get(endId);

  if (!startNode || !endNode) {
    return { frames: [], path: [], pathNodeIds: [] };
  }

  const openSet = new Map();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startNode, endNode));
  openSet.set(startId, fScore.get(startId));

  const frames = [];

  while (openSet.size > 0) {
    let currentId = null;
    let lowestF = Infinity;
    for (const [id, f] of openSet) {
      if (f < lowestF) {
        lowestF = f;
        currentId = id;
      }
    }

    if (currentId === endId) {
      const path = [];
      const pathNodeIds = [];
      let curr = endId;
      while (curr !== undefined) {
        const node = graph.get(curr);
        path.unshift([node.lat, node.lng]);
        pathNodeIds.unshift(curr);
        curr = cameFrom.get(curr);
      }
      return { frames, path, pathNodeIds };
    }

    openSet.delete(currentId);
    const current = graph.get(currentId);

    const frontierCoords = [];
    for (const id of openSet.keys()) {
      const n = graph.get(id);
      if (n) {
        frontierCoords.push([n.lat, n.lng]);
      }
    }
    frames.push({ explored: [current.lat, current.lng], frontier: frontierCoords });

    for (const { id: neighbourId, dist } of current.neighbours) {
      const tentativeG = (gScore.get(currentId) ?? Infinity) + dist;
      if (tentativeG < (gScore.get(neighbourId) ?? Infinity)) {
        cameFrom.set(neighbourId, currentId);
        gScore.set(neighbourId, tentativeG);
        const f = tentativeG + heuristic(graph.get(neighbourId), endNode);
        fScore.set(neighbourId, f);
        openSet.set(neighbourId, f);
      }
    }
  }

  return { frames, path: [], pathNodeIds: [] };
}