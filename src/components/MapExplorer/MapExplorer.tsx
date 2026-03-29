import { useEffect, useState } from "react";
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
import { useRoutePlanner, RoutePlannerPanel } from "./RoutePlanner";
import "../css/MapExplorer.css";

const BELFAST_CENTER: [number, number] = [54.5973, -5.9301];
const INITIAL_ZOOM = 8;

const EXPLORED_COLOR = "#f59e0b";
const FRONTIER_COLOR = "#fb923c";
const PATH_COLOR = "#34d399";
const START_COLOR = "#60a5fa";
const END_COLOR = "#f472b6";
const ROUTE_COLOR = "#a78bfa";

function ClickHandler({ onClick }: { onClick: (latlng: { lat: number; lng: number }) => void }) {
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

  const {
    miles,
    setMiles,
    isLoop,
    setIsLoop,
    routeState,
    handlePlannerClick,
    handleFindRoute,
    resetRoute,
  } = useRoutePlanner();

  const [mode, setMode] = useState("pathfinder");

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  function handleModeSwitch(newMode: string) {
    setMode(newMode);
    resetPathfinder();
    resetRoute();
  }

  function handleMapClickDispatch(latlng: { lat: number; lng: number }) {
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
          onReset={resetRoute}
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