import { useEffect, useState } from "react";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const MILES_TO_METERS = 1609.344;

export function metersToMiles(m: number): string {
  return (m / MILES_TO_METERS).toFixed(2);
}

function metersToFeet(m: number): number {
  return Math.round(m * 3.28084);
}

function getToleranceColor(actual: number, target: number): string {
  const diff = Math.abs(actual - target) / target;
  if (diff <= 0.05) { return "#34d399"; }
  if (diff <= 0.10) { return "#f59e0b"; }
  return "#fc8181";
}

export interface RouteState {
  start: { lat: number; lng: number } | null;
  route: {
    distance: number;
    ascentFt: number | null;
    descentFt: number | null;
  } | null;
  path: [number, number][];
  loading: boolean;
  error: string | null;
}

export const initialRouteState: RouteState = {
  start: null,
  route: null,
  path: [],
  loading: false,
  error: null,
};

export function useRoutePlanner() {
  const [miles, setMiles] = useState(5);
  const [isLoop, setIsLoop] = useState(true);
  const [routeState, setRouteState] = useState<RouteState>(initialRouteState);

  function handlePlannerClick(latlng: { lat: number; lng: number }) {
    if (routeState.loading) { return; }
    setRouteState((prev) => ({
      ...prev,
      start: latlng,
      route: null,
      path: [],
      error: null,
    }));
  }

  useEffect(() => {
  setRouteState((prev) => ({
    ...prev,
    route: null,
    path: [],
    error: null,
  }));
}, [miles, isLoop]);

async function handleFindRoute() {
  if (!routeState.start) { return; }
  setRouteState((prev) => ({ ...prev, loading: true, error: null, route: null, path: [] }));

  try {
    const { lat, lng } = routeState.start;
    const targetMeters = miles * MILES_TO_METERS;
    const toleranceMeters = 0.5 * MILES_TO_METERS;
    const maxAttempts = 8;

    let geojson = null;

    if (isLoop) {
      let orsLength = targetMeters / 2;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const res = await fetch(
          "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
          {
            method: "POST",
            headers: {
              Authorization: ORS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              coordinates: [[lng, lat]],
              options: { round_trip: { length: orsLength, points: 3, seed: attempt + 1 } },
              elevation: true,
            }),
          }
        );

        const candidate = await res.json();

        if (candidate.error) {
          throw new Error(candidate.error.message || "Route error");
        }

        const returnedMeters = candidate.features[0].properties.summary.distance;

        if (Math.abs(returnedMeters - targetMeters) <= toleranceMeters) {
          geojson = candidate;
          break;
        }

        const ratio = targetMeters / returnedMeters;
        const diff = Math.abs(returnedMeters - targetMeters) / targetMeters;
        const blend = diff > 0.2 ? 0.25 : 0.75;
        const smoothedRatio = blend + (ratio * (1 - blend));
        orsLength = orsLength * smoothedRatio;

        if (attempt === maxAttempts - 1) {
          geojson = candidate;
        }
      }
    } else {
      let attemptLength = targetMeters;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = Math.random() * 2 * Math.PI;
        const latOffset = (attemptLength / 111320) * Math.cos(angle);
        const lngOffset =
          (attemptLength / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
        const endLat = lat + latOffset;
        const endLng = lng + lngOffset;

        const res = await fetch(
          "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
          {
            method: "POST",
            headers: {
              Authorization: ORS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              coordinates: [[lng, lat], [endLng, endLat]],
              elevation: true,
            }),
          }
        );

        const candidate = await res.json();

        if (candidate.error) {
          throw new Error(candidate.error.message || "Route error");
        }

        const returnedMeters = candidate.features[0].properties.summary.distance;

        if (Math.abs(returnedMeters - targetMeters) <= toleranceMeters) {
          geojson = candidate;
          break;
        }

        const ratio = targetMeters / returnedMeters;
        attemptLength = attemptLength * ratio;

        if (attempt === maxAttempts - 1) {
          geojson = candidate;
        }
      }
    }

    const feature = geojson!.features[0];
    const summary = feature.properties.summary;
    const coords: [number, number][] = feature.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    setRouteState((prev) => ({
      ...prev,
      loading: false,
      path: coords,
      route: {
        distance: summary.distance,
        ascentFt: feature.properties.ascent != null ? metersToFeet(feature.properties.ascent) : null,
        descentFt: feature.properties.descent != null ? metersToFeet(feature.properties.descent) : null,
      },
    }));
  } catch (err: any) {
    setRouteState((prev) => ({ ...prev, loading: false, error: err.message }));
  }
}
  function resetRoute() {
    setRouteState(initialRouteState);
  }

  return {
    miles,
    setMiles,
    isLoop,
    setIsLoop,
    routeState,
    handlePlannerClick,
    handleFindRoute,
    resetRoute,
  };
}

interface RoutePlannerPanelProps {
  routeState: RouteState;
  onFindRoute: () => void;
  onReset: () => void;
  miles: number;
  setMiles: (v: number) => void;
  isLoop: boolean;
  setIsLoop: (v: boolean) => void;
}

export function RoutePlannerPanel({
  routeState,
  onFindRoute,
  onReset,
  miles,
  setMiles,
  isLoop,
  setIsLoop,
}: RoutePlannerPanelProps) {
  const actualMiles = routeState.route
    ? parseFloat(metersToMiles(routeState.route.distance))
    : null;
  const toleranceColor = actualMiles !== null
    ? getToleranceColor(actualMiles, miles)
    : null;

  return (
    <div className="mxp-planner-panel">
      <div className="mxp-planner-field">
        <span className="mxp-trip-label">Distance</span>
        <div className="mxp-planner-range-row">
          <input
            type="range"
            min={1}
            max={26}
            step={0.5}
            value={miles}
            onChange={(e) => setMiles(parseFloat(e.target.value))}
            className="mxp-range"
          />
          <span className="mxp-planner-miles">{miles} mi</span>
        </div>
      </div>

      <div className="mxp-planner-field">
        <span className="mxp-trip-label">Route type</span>
        <div className="mxp-planner-toggle">
          <button
            className={`mxp-planner-btn${isLoop ? " mxp-planner-btn--active" : ""}`}
            onClick={() => setIsLoop(true)}
          >
            Loop
          </button>
          <button
            className={`mxp-planner-btn${!isLoop ? " mxp-planner-btn--active" : ""}`}
            onClick={() => setIsLoop(false)}
          >
            One way
          </button>
        </div>
      </div>

      {routeState.route && actualMiles !== null && (
        <div className="mxp-planner-stats">
          <div className="mxp-planner-stat">
            <span className="mxp-trip-value" style={{ color: toleranceColor ?? undefined }}>
              {actualMiles}
              <span className="mxp-trip-unit"> mi</span>
            </span>
            <span className="mxp-trip-label">Actual</span>
          </div>
          <div className="mxp-trip-divider" />
          <div className="mxp-planner-stat">
            <span className="mxp-trip-value">
              {miles}
              <span className="mxp-trip-unit"> mi</span>
            </span>
            <span className="mxp-trip-label">Target</span>
          </div>
          <div className="mxp-trip-divider" />
          <div className="mxp-planner-stat">
            <span className="mxp-trip-value">
              {routeState.route.ascentFt ?? "—"}
              <span className="mxp-trip-unit"> ft</span>
            </span>
            <span className="mxp-trip-label">Gain</span>
          </div>
          <div className="mxp-trip-divider" />
          <div className="mxp-planner-stat">
            <span className="mxp-trip-value">
              {routeState.route.descentFt ?? "—"}
              <span className="mxp-trip-unit"> ft</span>
            </span>
            <span className="mxp-trip-label">Loss</span>
          </div>
        </div>
      )}

      <div className="mxp-planner-actions">
        <button
          className="mxp-planner-find-btn"
          onClick={onFindRoute}
          disabled={!routeState.start || routeState.loading}
        >
          {routeState.loading ? (
            <><span className="mxp-spinner mxp-spinner--small" /> Finding…</>
          ) : "Find Route"}
        </button>
        {(routeState.start || routeState.route) && (
          <button className="mxp-reset-btn" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}