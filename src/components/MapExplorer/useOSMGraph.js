import { useState, useCallback } from "react";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const BBOX = "54.0,-8.18,55.35,-5.43";

const QUERY = `
[out:json][timeout:60];
(
  way["highway"="motorway"](${BBOX});
  way["highway"="trunk"](${BBOX});
  way["highway"="primary"](${BBOX});
  way["highway"="secondary"](${BBOX});
);
out body;
>;
out skel qt;
`;

function haversine(a, b) {
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

function parseGraph(elements) {
  const nodeMap = new Map();
  const graph = new Map();

  for (const el of elements) {
    if (el.type === "node") {
      nodeMap.set(el.id, { lat: el.lat, lng: el.lon });
    }
  }

  for (const el of elements) {
    if (el.type !== "way") {
      continue;
    }

    const oneway =
      el.tags?.oneway === "yes" ||
      el.tags?.oneway === "1" ||
      el.tags?.highway === "motorway";

    const highway = el.tags?.highway ?? "primary";
    const nodes = el.nodes;

    for (let i = 0; i < nodes.length - 1; i++) {
      const aId = nodes[i];
      const bId = nodes[i + 1];
      const aCoord = nodeMap.get(aId);
      const bCoord = nodeMap.get(bId);

      if (!aCoord || !bCoord) {
        continue;
      }

      const dist = haversine(aCoord, bCoord);

      if (!graph.has(aId)) {
        graph.set(aId, { ...aCoord, neighbours: [] });
      }
      if (!graph.has(bId)) {
        graph.set(bId, { ...bCoord, neighbours: [] });
      }

      graph.get(aId).neighbours.push({ id: bId, dist, highway });

      if (!oneway) {
        graph.get(bId).neighbours.push({ id: aId, dist, highway });
      }
    }
  }

  return graph;
}

export function useOSMGraph() {
  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        body: `data=${encodeURIComponent(QUERY)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!res.ok) {
        throw new Error(`Overpass returned ${res.status}`);
      }

      const json = await res.json();
      const g = parseGraph(json.elements);
      setGraph(g);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { graph, loading, error, fetchGraph };
}