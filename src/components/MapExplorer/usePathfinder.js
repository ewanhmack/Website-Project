import { useState, useRef, useCallback } from "react";
import { aStar } from "./aStar";

const FRAME_INTERVAL_MS = 18;
const FRAMES_PER_TICK = 8;

const SPEED_MS = {
  motorway: 100 / 3.6,
  trunk: 80 / 3.6,
  primary: 60 / 3.6,
  secondary: 50 / 3.6,
};

const DEFAULT_SPEED_MS = 60 / 3.6;

function computeTripStats(graph, pathNodeIds) {
  let totalDistM = 0;
  let totalTimeS = 0;

  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const fromNode = graph.get(pathNodeIds[i]);
    if (!fromNode) {
      continue;
    }

    const toId = pathNodeIds[i + 1];
    const edge = fromNode.neighbours.find((n) => n.id === toId);
    if (!edge) {
      continue;
    }

    const speed = SPEED_MS[edge.highway] ?? DEFAULT_SPEED_MS;
    totalDistM += edge.dist;
    totalTimeS += edge.dist / speed;
  }

  return {
    distanceKm: totalDistM / 1000,
    durationMins: totalTimeS / 60,
  };
}

function formatDuration(mins) {
  if (mins < 1) {
    return "< 1 min";
  }
  if (mins < 60) {
    return `${Math.round(mins)} min`;
  }
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function usePathfinder(graph) {
  const [startId, setStartId] = useState(null);
  const [endId, setEndId] = useState(null);
  const [exploredPoints, setExploredPoints] = useState([]);
  const [frontierPoints, setFrontierPoints] = useState([]);
  const [finalPath, setFinalPath] = useState([]);
  const [tripStats, setTripStats] = useState(null);
  const [running, setRunning] = useState(false);

  const animRef = useRef(null);

  const findNearestNode = useCallback(
    (latlng) => {
      if (!graph) {
        return null;
      }

      let nearest = null;
      let minDist = Infinity;

      for (const [id, node] of graph) {
        const dLat = node.lat - latlng.lat;
        const dLng = node.lng - latlng.lng;
        const d = dLat * dLat + dLng * dLng;
        if (d < minDist) {
          minDist = d;
          nearest = id;
        }
      }

      return nearest;
    },
    [graph]
  );

  const handleMapClick = useCallback(
    (latlng) => {
      if (running) {
        return;
      }

      const id = findNearestNode(latlng);
      if (!id) {
        return;
      }

      if (!startId) {
        setStartId(id);
        setEndId(null);
        setExploredPoints([]);
        setFrontierPoints([]);
        setFinalPath([]);
        setTripStats(null);
      } else if (!endId) {
        setEndId(id);
        runAStar(startId, id);
      } else {
        setStartId(id);
        setEndId(null);
        setExploredPoints([]);
        setFrontierPoints([]);
        setFinalPath([]);
        setTripStats(null);
      }
    },
    [running, startId, endId, findNearestNode, graph]
  );

  function runAStar(sId, eId) {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    setExploredPoints([]);
    setFrontierPoints([]);
    setFinalPath([]);
    setTripStats(null);
    setRunning(true);

    const { frames, path, pathNodeIds } = aStar(graph, sId, eId);

    let frameIndex = 0;
    const explored = [];

    function tick() {
      const end = Math.min(frameIndex + FRAMES_PER_TICK, frames.length);

      for (let i = frameIndex; i < end; i++) {
        explored.push(frames[i].explored);
      }

      frameIndex = end;
      setExploredPoints([...explored]);

      if (frameIndex < frames.length) {
        setFrontierPoints(frames[frameIndex]?.frontier ?? []);
        animRef.current = setTimeout(tick, FRAME_INTERVAL_MS);
      } else {
        setFrontierPoints([]);
        setFinalPath(path);
        setTripStats(computeTripStats(graph, pathNodeIds));
        setRunning(false);
      }
    }

    animRef.current = setTimeout(tick, FRAME_INTERVAL_MS);
  }

  const reset = useCallback(() => {
    if (animRef.current) {
      clearTimeout(animRef.current);
    }
    setStartId(null);
    setEndId(null);
    setExploredPoints([]);
    setFrontierPoints([]);
    setFinalPath([]);
    setTripStats(null);
    setRunning(false);
  }, []);

  const startNode = startId ? graph?.get(startId) : null;
  const endNode = endId ? graph?.get(endId) : null;

  return {
    startNode,
    endNode,
    exploredPoints,
    frontierPoints,
    finalPath,
    tripStats,
    formatDuration,
    running,
    handleMapClick,
    reset,
  };
}