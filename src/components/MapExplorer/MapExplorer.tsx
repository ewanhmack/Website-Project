import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useOSMGraph } from "./useOSMGraph";
import { usePathfinder, formatDuration } from "./usePathfinder";
import "./MapExplorer.css";

const BELFAST_CENTER = [54.5973, -5.9301];
const INITIAL_ZOOM = 8;

const EXPLORED_COLOR = "#f59e0b";
const FRONTIER_COLOR = "#fb923c";
const PATH_COLOR = "#34d399";
const START_COLOR = "#60a5fa";
const END_COLOR = "#f472b6";
const ROUTE_COLOR = "#a78bfa";

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const MILES_TO_METERS = 1609.344;

function metersToMiles(m) {
  return (m / MILES_TO_METERS).toFixed(2);
}

function metersToFeet(m) {
  return Math.round(m * 3.28084);
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(BELFAST_CENTER, INITIAL_ZOOM);
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [map]);
  return null;
}

function StatusBar({ loading, error, graph, startNode, endNode, running, tripStats, mode, routeState }) {
  if (loading) {
    return (
      <div className="mxp-status mxp-status--loading">
        <span className="mxp-spinner" />
        Fetching road network from OpenStreetMap…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mxp-status mxp-status--error">
        ⚠ Failed to load road data: {error}
      </div>
    );
  }

  if (!graph) {
    return null;
  }

  if (mode === "planner") {
    if (routeState.error) {
      return (
        <div className="mxp-status mxp-status--error">
          ⚠ {routeState.error}
        </div>
      );
    }
    if (routeState.loading) {
      return (
        <div className="mxp-status mxp-status--running">
          <span className="mxp-spinner" />
          Finding route…
        </div>
      );
    }
    if (!routeState.start) {
      return (
        <div className="mxp-status mxp-status--info">
          Click anywhere on the map to set your start point.
        </div>
      );
    }
    if (routeState.start && !routeState.route) {
      return (
        <div className="mxp-status mxp-status--info">
          Start set. Adjust distance and type, then click Find Route.
        </div>
      );
    }
    return null;
  }

  if (startNode && !endNode && !running && !tripStats) {
    return (
      <div className="mxp-status mxp-status--info">
        Start set. Click a destination on the map.
      </div>
    );
  }

  if (!startNode && !running && !tripStats) {
    return (
      <div className="mxp-status mxp-status--info">
        Click anywhere on the road network to set a start point.
      </div>
    );
  }

  return null;
}

function TripStats({ tripStats, finalPath }) {
  const isExact = tripStats?.exact ?? false;
  const hasData = tripStats !== null;

  return (
    <div className={`mxp-trip-stats ${isExact ? "mxp-trip-stats--exact" : "mxp-trip-stats--live"}`}>
      <div className="mxp-trip-stat">
        <span className="mxp-trip-label">
          {isExact ? "Distance" : "Explored Dist."}
        </span>
        <span className="mxp-trip-value">
          {hasData ? (
            <>{tripStats.distanceMiles.toFixed(1)}<span className="mxp-trip-unit"> mi</span></>
          ) : (
            <span className="mxp-trip-empty">—</span>
          )}
        </span>
      </div>
      <div className="mxp-trip-divider" />
      <div className="mxp-trip-stat">
        <span className="mxp-trip-label">
          {isExact ? "Est. Drive Time" : "Explored Time"}
        </span>
        <span className="mxp-trip-value">
          {hasData ? formatDuration(tripStats.durationMins) : <span className="mxp-trip-empty">—</span>}
        </span>
      </div>
      <div className="mxp-trip-divider" />
      <div className="mxp-trip-stat">
        <span className="mxp-trip-label">
          {isExact ? "Waypoints" : "Explored"}
        </span>
        <span className="mxp-trip-value">
          {hasData ? (
            isExact ? finalPath.length : tripStats.explored
          ) : (
            <span className="mxp-trip-empty">—</span>
          )}
        </span>
      </div>
      {hasData && !isExact && (
        <div className="mxp-trip-badge">
          <span className="mxp-spinner mxp-spinner--small" />
          searching
        </div>
      )}
      {isExact && (
        <div className="mxp-trip-badge mxp-trip-badge--done">
          ✓ route found
        </div>
      )}
    </div>
  );
}

function RoutePlannerPanel({ routeState, onFindRoute, onReset, miles, setMiles, isLoop, setIsLoop }) {
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

      {routeState.route && (
        <div className="mxp-planner-stats">
          <div className="mxp-planner-stat">
            <span className="mxp-trip-value">
              {metersToMiles(routeState.route.distance)}
              <span className="mxp-trip-unit"> mi</span>
            </span>
            <span className="mxp-trip-label">Distance</span>
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

export default function MapExplorer() {
  const { graph, loading, error, fetchGraph } = useOSMGraph();
  const {
    startNode,
    endNode,
    exploredPoints,
    frontierPoints,
    finalPath,
    tripStats,
    running,
    handleMapClick,
    reset: resetPathfinder,
  } = usePathfinder(graph);

  const [mode, setMode] = useState("pathfinder");
  const [miles, setMiles] = useState(5);
  const [isLoop, setIsLoop] = useState(true);
  const [routeState, setRouteState] = useState({
    start: null,
    route: null,
    path: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  function handleModeSwitch(newMode) {
    setMode(newMode);
    resetPathfinder();
    setRouteState({ start: null, route: null, path: [], loading: false, error: null });
  }

  function handlePlannerClick(latlng) {
    if (routeState.loading) { return; }
    setRouteState((prev) => ({
      ...prev,
      start: latlng,
      route: null,
      path: [],
      error: null,
    }));
  }

  async function handleFindRoute() {
    if (!routeState.start) { return; }
    setRouteState((prev) => ({ ...prev, loading: true, error: null, route: null, path: [] }));

    try {
      const meters = miles * MILES_TO_METERS;
      const { lat, lng } = routeState.start;

      let geojson;

      if (isLoop) {
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
              options: { round_trip: { length: meters / 2, points: 3, seed: 1 } },
              elevation: true,
            }),
          }
        );
        geojson = await res.json();
      } else {
        const angle = Math.random() * 2 * Math.PI;
        const latOffset = (meters / 2 / 111320) * Math.cos(angle);
        const lngOffset =
          (meters / 2 / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
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
        geojson = await res.json();
      }

      if (geojson.error) {
        throw new Error(geojson.error.message || "Route error");
      }

      const feature = geojson.features[0];
      const summary = feature.properties.summary;
      const coords = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

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
    } catch (err) {
      setRouteState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }

  function handleMapClickDispatch(latlng) {
    if (mode === "pathfinder") {
      handleMapClick(latlng);
    } else {
      handlePlannerClick(latlng);
    }
  }

  return (
    <div className="mxp-root">
      <div className="mxp-header">
        <div className="mxp-title-block">
          <span className="mxp-label">MAP EXPLORER</span>
          <h2 className="mxp-title">Northern Ireland</h2>
        </div>

        <div className="mxp-mode-toggle">
          <button
            className={`mxp-mode-btn${mode === "pathfinder" ? " mxp-mode-btn--active" : ""}`}
            onClick={() => handleModeSwitch("pathfinder")}
          >
            Pathfinder
          </button>
          <button
            className={`mxp-mode-btn${mode === "planner" ? " mxp-mode-btn--active" : ""}`}
            onClick={() => handleModeSwitch("planner")}
          >
            Route Planner
          </button>
        </div>

        {mode === "pathfinder" && (
          <div className="mxp-legend">
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: START_COLOR }} />Start
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: END_COLOR }} />End
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: EXPLORED_COLOR }} />Explored
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: FRONTIER_COLOR }} />Frontier
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: PATH_COLOR }} />Path
            </span>
            {(startNode || finalPath.length > 0) && (
              <button className="mxp-reset-btn" onClick={resetPathfinder}>Reset</button>
            )}
          </div>
        )}

        {mode === "planner" && (
          <div className="mxp-legend">
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: START_COLOR }} />Start
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: ROUTE_COLOR }} />Route
            </span>
          </div>
        )}
      </div>

      <StatusBar
        loading={loading}
        error={error}
        graph={graph}
        startNode={startNode}
        endNode={endNode}
        running={running}
        tripStats={tripStats}
        mode={mode}
        routeState={routeState}
      />

      {mode === "planner" && (
        <RoutePlannerPanel
          routeState={routeState}
          onFindRoute={handleFindRoute}
          onReset={() => setRouteState({ start: null, route: null, path: [], loading: false, error: null })}
          miles={miles}
          setMiles={setMiles}
          isLoop={isLoop}
          setIsLoop={setIsLoop}
        />
      )}

      {mode === "pathfinder" && (
        <TripStats tripStats={tripStats} finalPath={finalPath} />
      )}

      <div className="mxp-map-wrap">
        <MapContainer
          center={BELFAST_CENTER}
          zoom={INITIAL_ZOOM}
          className="mxp-map"
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapInvalidator />
          <ClickHandler onClick={handleMapClickDispatch} />

          {mode === "pathfinder" && (
            <>
              {exploredPoints.map((pt, i) => (
                <CircleMarker
                  key={`exp-${i}`}
                  center={pt}
                  radius={2}
                  pathOptions={{ color: EXPLORED_COLOR, fillColor: EXPLORED_COLOR, fillOpacity: 0.5, weight: 0 }}
                />
              ))}
              {frontierPoints.map((pt, i) => (
                <CircleMarker
                  key={`fr-${i}`}
                  center={pt}
                  radius={3}
                  pathOptions={{ color: FRONTIER_COLOR, fillColor: FRONTIER_COLOR, fillOpacity: 0.8, weight: 0 }}
                />
              ))}
              {finalPath.length > 1 && (
                <Polyline
                  positions={finalPath}
                  pathOptions={{ color: PATH_COLOR, weight: 4, opacity: 0.9 }}
                />
              )}
              {startNode && (
                <CircleMarker
                  center={[startNode.lat, startNode.lng]}
                  radius={8}
                  pathOptions={{ color: START_COLOR, fillColor: START_COLOR, fillOpacity: 1, weight: 2 }}
                />
              )}
              {endNode && (
                <CircleMarker
                  center={[endNode.lat, endNode.lng]}
                  radius={8}
                  pathOptions={{ color: END_COLOR, fillColor: END_COLOR, fillOpacity: 1, weight: 2 }}
                />
              )}
            </>
          )}

          {mode === "planner" && (
            <>
              {routeState.start && (
                <CircleMarker
                  center={[routeState.start.lat, routeState.start.lng]}
                  radius={8}
                  pathOptions={{ color: START_COLOR, fillColor: START_COLOR, fillOpacity: 1, weight: 2 }}
                />
              )}
              {routeState.path.length > 1 && (
                <Polyline
                  positions={routeState.path}
                  pathOptions={{ color: ROUTE_COLOR, weight: 4, opacity: 0.9 }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}