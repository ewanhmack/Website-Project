import { useCallback, useEffect, useRef, useState } from "react";

// Pre-built by scripts/build-road-snapshot.mjs from OpenStreetMap via Overpass.
const SNAPSHOT_PATH = `${import.meta.env.BASE_URL}data/ni-roads.json`;

// Owns the pathfinder worker. Exposes node coordinates for drawing, plus
// promise-based nearest-node lookups and searches that run in the worker.
export function useRoadNetwork() {
  const workerRef = useRef(null);
  const pendingRef = useRef(new Map());
  const nextIdRef = useRef(0);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const call = useCallback((type, payload) => {
    const worker = workerRef.current;
    if (!worker) {
      return Promise.reject(new Error("Road network not loaded"));
    }
    const id = nextIdRef.current++;
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("./pathfinderWorker.js", import.meta.url), {
      type: "module",
    });
    const pending = pendingRef.current;
    workerRef.current = worker;

    worker.onmessage = ({ data: { id, result, error: message } }) => {
      const request = pending.get(id);
      if (!request) {
        return;
      }
      pending.delete(id);
      if (message) {
        request.reject(new Error(message));
      } else {
        request.resolve(result);
      }
    };

    setLoading(true);
    setError(null);
    call("load", { url: new URL(SNAPSHOT_PATH, window.location.href).href })
      .then(setCoords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      worker.terminate();
      workerRef.current = null;
      for (const request of pending.values()) {
        request.reject(new Error("Road network unloaded"));
      }
      pending.clear();
    };
  }, [call]);

  const findNearest = useCallback((latlng) => call("nearest", latlng), [call]);
  const search = useCallback(
    (startId, endId, options) => call("search", { startId, endId, options }),
    [call],
  );

  return { coords, loading, error, findNearest, search };
}
