import { useState, useRef, useCallback } from "react";
import { ALGORITHMS } from "./searchAlgorithms";

// Long searches speed up so playback finishes in roughly this time at 1x.
const TARGET_PLAYBACK_MS = 10000;
const MIN_FRAMES_PER_TICK = 4;
const ASSUMED_FPS = 60;

export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];

const MILES_PER_METRE = 0.000621371;

export function formatDuration(mins) {
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

function emptyExploration() {
  return { explored: [], frontier: new Set() };
}

function algorithmLabel({ algorithm, weight }) {
  const label = ALGORITHMS[algorithm].label;
  return algorithm === "weighted" ? `${label} (w=${weight})` : label;
}

function summarise(res, options) {
  return {
    key: algorithmLabel(options),
    label: algorithmLabel(options),
    options,
    found: res.found,
    distanceMiles: res.distanceM * MILES_PER_METRE,
    durationMins: res.timeS / 60,
    explored: res.explored.length,
    searchMs: res.searchMs,
  };
}

// status: idle | searching | playing | paused | done
export function usePathfinder({ coords, findNearest, search }) {
  const [startId, setStartId] = useState(null);
  const [endId, setEndId] = useState(null);
  const [options, setOptionsState] = useState({ algorithm: "astar", metric: "time", weight: 2 });
  const [speed, setSpeedState] = useState(1);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({ explored: 0, frontier: 0 });
  const [finalPath, setFinalPath] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [error, setError] = useState(null);

  // Exploration lives in a ref and is drawn straight to canvas; the version
  // counter tells the layer when to redraw without copying large arrays.
  const explorationRef = useRef(emptyExploration());
  const [explorationVersion, setExplorationVersion] = useState(0);

  const animRef = useRef(null);
  const playbackRef = useRef(null);
  const speedRef = useRef(1);
  const runIdRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const clearSearch = useCallback(() => {
    runIdRef.current++;
    stopAnimation();
    playbackRef.current = null;
    explorationRef.current = emptyExploration();
    setExplorationVersion((v) => v + 1);
    setFinalPath([]);
    setResult(null);
    setProgress({ explored: 0, frontier: 0 });
    setError(null);
  }, [stopAnimation]);

  const pathToCoords = useCallback(
    (path) => Array.from(path, (id) => [coords.lat[id], coords.lng[id]]),
    [coords],
  );

  // Applies frames up to `end` from the current playback.
  function applyFrames(playback, end) {
    const { res, exploration } = playback;
    for (let i = playback.frame; i < end; i++) {
      const id = res.explored[i];
      exploration.explored.push(id);
      exploration.frontier.delete(id);
      for (let a = res.addedOffsets[i]; a < res.addedOffsets[i + 1]; a++) {
        exploration.frontier.add(res.added[a]);
      }
    }
    playback.frame = end;
    setExplorationVersion((v) => v + 1);
    setProgress({ explored: exploration.explored.length, frontier: exploration.frontier.size });
  }

  function finishPlayback(playback) {
    stopAnimation();
    applyFrames(playback, playback.res.explored.length);
    playback.exploration.frontier.clear();
    setFinalPath(pathToCoords(playback.res.path));
    setStatus("done");
  }

  function tick() {
    const playback = playbackRef.current;
    if (!playback) {
      return;
    }
    const total = playback.res.explored.length;
    const framesPerTick = Math.max(
      1,
      Math.round(
        Math.max(MIN_FRAMES_PER_TICK, total / ((TARGET_PLAYBACK_MS / 1000) * ASSUMED_FPS)) *
          speedRef.current,
      ),
    );
    const end = Math.min(playback.frame + framesPerTick, total);
    applyFrames(playback, end);

    if (end < total) {
      animRef.current = requestAnimationFrame(tick);
    } else {
      finishPlayback(playback);
    }
  }

  const run = useCallback(
    async (sId, eId, runOptions, animate) => {
      clearSearch();
      const runId = runIdRef.current;
      setStatus("searching");

      let res;
      try {
        res = await search(sId, eId, runOptions);
      } catch (err) {
        if (runId === runIdRef.current) {
          setError(err.message);
          setStatus("idle");
        }
        return;
      }
      if (runId !== runIdRef.current) {
        return;
      }

      const summary = summarise(res, runOptions);
      setResult(summary);
      setComparison((rows) => [...rows.filter((r) => r.key !== summary.key), summary]);

      const playback = { res, frame: 0, exploration: explorationRef.current };
      playbackRef.current = playback;

      if (animate) {
        setStatus("playing");
        animRef.current = requestAnimationFrame(tick);
      } else {
        finishPlayback(playback);
      }
    },
    // tick/finishPlayback only touch refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearSearch, search, pathToCoords],
  );

  const handleMapClick = useCallback(
    async (latlng) => {
      if (!coords) {
        return;
      }
      const id = await findNearest(latlng);
      if (id < 0) {
        return;
      }

      if (startId === null || endId !== null) {
        clearSearch();
        setComparison([]);
        setStatus("idle");
        setStartId(id);
        setEndId(null);
      } else {
        setEndId(id);
        run(startId, id, options, true);
      }
    },
    [coords, findNearest, startId, endId, options, clearSearch, run],
  );

  // Dragging a marker re-runs instantly so the route follows the drag.
  const moveEndpoint = useCallback(
    async (which, latlng) => {
      const id = await findNearest(latlng);
      if (id < 0) {
        return;
      }
      const sId = which === "start" ? id : startId;
      const eId = which === "end" ? id : endId;
      setStartId(sId);
      setEndId(eId);
      setComparison([]);
      if (sId !== null && eId !== null) {
        run(sId, eId, options, false);
      }
    },
    [findNearest, startId, endId, options, run],
  );

  const setOptions = useCallback(
    (changes) => {
      const next = { ...options, ...changes };
      setOptionsState(next);
      if (changes.metric && changes.metric !== options.metric) {
        setComparison([]);
      }
      if (startId !== null && endId !== null) {
        run(startId, endId, next, true);
      }
    },
    [options, startId, endId, run],
  );

  const compareAll = useCallback(async () => {
    if (startId === null || endId === null) {
      return;
    }
    const runId = runIdRef.current;
    const rows = [];
    for (const algorithm of Object.keys(ALGORITHMS)) {
      const rowOptions = { ...options, algorithm };
      const res = await search(startId, endId, rowOptions);
      if (runId !== runIdRef.current) {
        return;
      }
      rows.push(summarise(res, rowOptions));
    }
    setComparison(rows);
  }, [startId, endId, options, search]);

  const setSpeed = useCallback((value) => {
    speedRef.current = value;
    setSpeedState(value);
  }, []);

  const pause = useCallback(() => {
    if (status === "playing") {
      stopAnimation();
      setStatus("paused");
    }
  }, [status, stopAnimation]);

  const resume = useCallback(() => {
    if (status === "paused") {
      setStatus("playing");
      animRef.current = requestAnimationFrame(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const skip = useCallback(() => {
    if (playbackRef.current && (status === "playing" || status === "paused")) {
      finishPlayback(playbackRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const reset = useCallback(() => {
    clearSearch();
    setStartId(null);
    setEndId(null);
    setComparison([]);
    setStatus("idle");
  }, [clearSearch]);

  const nodePosition = (id) =>
    id !== null && coords ? { lat: coords.lat[id], lng: coords.lng[id] } : null;

  return {
    startNode: nodePosition(startId),
    endNode: nodePosition(endId),
    options,
    setOptions,
    speed,
    setSpeed,
    status,
    result,
    progress,
    finalPath,
    comparison,
    error,
    exploration: explorationRef.current,
    explorationVersion,
    handleMapClick,
    moveEndpoint,
    compareAll,
    pause,
    resume,
    skip,
    reset,
  };
}
