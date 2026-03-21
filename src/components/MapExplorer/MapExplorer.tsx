import { useEffect } from "react";
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

function StatusBar({ loading, error, graph, startNode, endNode, running, tripStats }) {
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
    reset,
  } = usePathfinder(graph);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="mxp-root">
      <div className="mxp-header">
        <div className="mxp-title-block">
          <span className="mxp-label">PATHFINDER</span>
          <h2 className="mxp-title">Northern Ireland</h2>
        </div>
        <div className="mxp-legend">
          <span className="mxp-legend-item">
            <span className="mxp-dot" style={{ background: START_COLOR }} />
            Start
          </span>
          <span className="mxp-legend-item">
            <span className="mxp-dot" style={{ background: END_COLOR }} />
            End
          </span>
          <span className="mxp-legend-item">
            <span className="mxp-dot" style={{ background: EXPLORED_COLOR }} />
            Explored
          </span>
          <span className="mxp-legend-item">
            <span className="mxp-dot" style={{ background: FRONTIER_COLOR }} />
            Frontier
          </span>
          <span className="mxp-legend-item">
            <span className="mxp-dot" style={{ background: PATH_COLOR }} />
            Path
          </span>
          {(startNode || finalPath.length > 0) && (
            <button className="mxp-reset-btn" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </div>

      <StatusBar
        loading={loading}
        error={error}
        graph={graph}
        startNode={startNode}
        endNode={endNode}
        running={running}
        tripStats={tripStats}
      />

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
          <ClickHandler onClick={handleMapClick} />

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
        </MapContainer>

        <div className="mxp-stats-overlay">
          <TripStats tripStats={tripStats} finalPath={finalPath} />
        </div>
      </div>
    </div>
  );
}