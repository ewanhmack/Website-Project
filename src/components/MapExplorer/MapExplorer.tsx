import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useRoadNetwork } from "./useRoadNetwork";
import { usePathfinder, formatDuration, PLAYBACK_SPEEDS } from "./usePathfinder";
import { ALGORITHMS } from "./searchAlgorithms";
import { useRoutePlanner, RoutePlannerPanel } from "./RoutePlanner";
import ExplorationLayer from "./ExplorationLayer";
// @ts-expect-error - CSS side-effect imports are handled by the bundler
import "leaflet/dist/leaflet.css";
// @ts-expect-error - CSS side-effect imports are handled by the bundler
import "../css/MapExplorer.css";

const BELFAST_CENTER: [number, number] = [54.5973, -5.9301];
const INITIAL_ZOOM = 8;

const EXPLORED_COLOR = "#f59e0b";
const FRONTIER_COLOR = "#fb923c";
const PATH_COLOR = "#34d399";
const START_COLOR = "#60a5fa";
const END_COLOR = "#f472b6";
const ROUTE_COLOR = "#a78bfa";

type LatLng = { lat: number; lng: number };

type Status = "idle" | "searching" | "playing" | "paused" | "done";

type Options = {
  algorithm: keyof typeof ALGORITHMS;
  metric: "time" | "dist";
  weight: number;
};

type SearchSummary = {
  key: string;
  label: string;
  options: Options;
  found: boolean;
  distanceMiles: number;
  durationMins: number;
  explored: number;
  searchMs: number;
};

const ALGORITHM_HINTS: Record<keyof typeof ALGORITHMS, string> = {
  dijkstra: "Explores outward evenly in every direction. Always optimal.",
  astar: "Steers toward the destination with a straight-line estimate. Always optimal.",
  weighted: "Trusts the estimate more than the true cost: far less exploring, may miss the best route.",
  greedy: "Only chases the destination, ignoring cost so far. Fast but often poor routes.",
  bidirectional: "Searches from both ends until they meet. Always optimal.",
};

function ClickHandler({ onClick }: { onClick: (latlng: LatLng) => void }) {
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

function endpointIcon(color: string) {
  return L.divIcon({
    className: "mxp-endpoint",
    html: `<span class="mxp-endpoint-dot" style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function EndpointMarker({
  position,
  color,
  onMove,
}: {
  position: LatLng;
  color: string;
  onMove: (latlng: LatLng) => void;
}) {
  const icon = useMemo(() => endpointIcon(color), [color]);
  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend(e) {
          onMove((e.target as L.Marker).getLatLng());
        },
      }}
    />
  );
}

type StatusBarProps = {
  loading: boolean;
  error: string | null;
  ready: boolean;
  startNode: LatLng | null;
  endNode: LatLng | null;
  status: Status;
  result: SearchSummary | null;
  mode: string;
  routeState: {
    error?: string | null;
    loading: boolean;
    start?: LatLng | null;
    route?:
      | Array<[number, number]>
      | Array<LatLng>
      | { distance: number; ascentFt: number | null; descentFt: number | null }
      | null;
  };
};

function StatusBar({
  loading,
  error,
  ready,
  startNode,
  endNode,
  status,
  result,
  mode,
  routeState,
}: StatusBarProps) {
  if (loading) {
    return (
      <div className="mxp-status mxp-status--loading">
        <span className="mxp-spinner" />
        Loading road network…
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

  if (!ready) {
    return null;
  }

  if (mode === "planner") {
    if (routeState.error) {
      return <div className="mxp-status mxp-status--error">⚠ {routeState.error}</div>;
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

  if (status === "searching") {
    return (
      <div className="mxp-status mxp-status--running">
        <span className="mxp-spinner" />
        Searching…
      </div>
    );
  }

  if (status === "done" && result && !result.found) {
    return (
      <div className="mxp-status mxp-status--error">
        ⚠ No route between these points.
      </div>
    );
  }

  if (!startNode) {
    return (
      <div className="mxp-status mxp-status--info">
        Click anywhere on the road network to set a start point.
      </div>
    );
  }

  if (!endNode) {
    return (
      <div className="mxp-status mxp-status--info">
        Start set. Click a destination on the map.
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mxp-status mxp-status--info">
        Drag the markers to re-route, or click the map to start again.
      </div>
    );
  }

  return null;
}

type PathfinderPanelProps = {
  options: Options;
  setOptions: (changes: Partial<Options>) => void;
  status: Status;
  speed: number;
  setSpeed: (speed: number) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  compareAll: () => void;
  canCompare: boolean;
};

function PathfinderPanel({
  options,
  setOptions,
  status,
  speed,
  setSpeed,
  pause,
  resume,
  skip,
  compareAll,
  canCompare,
}: PathfinderPanelProps) {
  const animating = status === "playing" || status === "paused";

  return (
    <div className="mxp-planner-panel">
      <div className="mxp-planner-field">
        <span className="mxp-trip-label">Algorithm</span>
        <div className="mxp-planner-toggle">
          {(Object.keys(ALGORITHMS) as Array<keyof typeof ALGORITHMS>).map((key) => (
            <button
              key={key}
              className={`mxp-planner-btn${options.algorithm === key ? " mxp-planner-btn--active" : ""}`}
              onClick={() => setOptions({ algorithm: key })}
              title={ALGORITHM_HINTS[key]}
            >
              {ALGORITHMS[key].label}
            </button>
          ))}
        </div>
        <span className="mxp-hint">{ALGORITHM_HINTS[options.algorithm]}</span>
      </div>

      <div className="mxp-planner-field">
        <span className="mxp-trip-label">Optimise for</span>
        <div className="mxp-planner-toggle">
          <button
            className={`mxp-planner-btn${options.metric === "time" ? " mxp-planner-btn--active" : ""}`}
            onClick={() => setOptions({ metric: "time" })}
          >
            Fastest
          </button>
          <button
            className={`mxp-planner-btn${options.metric === "dist" ? " mxp-planner-btn--active" : ""}`}
            onClick={() => setOptions({ metric: "dist" })}
          >
            Shortest
          </button>
        </div>
      </div>

      {options.algorithm === "weighted" && (
        <div className="mxp-planner-field">
          <span className="mxp-trip-label">Heuristic weight</span>
          <div className="mxp-planner-range-row">
            <input
              type="range"
              min={1}
              max={5}
              step={0.25}
              value={options.weight}
              onChange={(e) => setOptions({ weight: parseFloat(e.target.value) })}
              className="mxp-range"
            />
            <span className="mxp-planner-miles">×{options.weight}</span>
          </div>
        </div>
      )}

      <div className="mxp-planner-field">
        <span className="mxp-trip-label">Playback</span>
        <div className="mxp-planner-toggle">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              className={`mxp-planner-btn${speed === s ? " mxp-planner-btn--active" : ""}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="mxp-planner-actions">
        {animating && (
          <>
            <button className="mxp-planner-btn" onClick={status === "playing" ? pause : resume}>
              {status === "playing" ? "Pause" : "Resume"}
            </button>
            <button className="mxp-planner-btn" onClick={skip}>
              Skip
            </button>
          </>
        )}
        <button className="mxp-planner-find-btn" onClick={compareAll} disabled={!canCompare}>
          Compare all
        </button>
      </div>
    </div>
  );
}

type TripStatsProps = {
  status: Status;
  result: SearchSummary | null;
  progress: { explored: number; frontier: number };
};

function TripStats({ status, result, progress }: TripStatsProps) {
  const done = status === "done" && result?.found;
  const live = status === "playing" || status === "paused";

  const stats: Array<{ label: string; value: React.ReactNode }> = done
    ? [
        {
          label: "Distance",
          value: (
            <>
              {result.distanceMiles.toFixed(1)}
              <span className="mxp-trip-unit"> mi</span>
            </>
          ),
        },
        { label: "Est. Drive Time", value: formatDuration(result.durationMins) },
        { label: "Explored", value: result.explored.toLocaleString() },
        {
          label: "Search Time",
          value: (
            <>
              {Math.round(result.searchMs)}
              <span className="mxp-trip-unit"> ms</span>
            </>
          ),
        },
      ]
    : [
        { label: "Explored", value: live ? progress.explored.toLocaleString() : null },
        { label: "Frontier", value: live ? progress.frontier.toLocaleString() : null },
        {
          label: "Search Time",
          value:
            live && result ? (
              <>
                {Math.round(result.searchMs)}
                <span className="mxp-trip-unit"> ms</span>
              </>
            ) : null,
        },
      ];

  return (
    <div className={`mxp-trip-stats ${done ? "mxp-trip-stats--exact" : "mxp-trip-stats--live"}`}>
      {stats.map((stat, i) => (
        <div key={stat.label} style={{ display: "contents" }}>
          {i > 0 && <div className="mxp-trip-divider" />}
          <div className="mxp-trip-stat">
            <span className="mxp-trip-label">{stat.label}</span>
            <span className="mxp-trip-value">
              {stat.value ?? <span className="mxp-trip-empty">—</span>}
            </span>
          </div>
        </div>
      ))}
      {live && (
        <div className="mxp-trip-badge">
          <span className="mxp-spinner mxp-spinner--small" />
          {status === "paused" ? "paused" : "searching"}
        </div>
      )}
      {done && <div className="mxp-trip-badge mxp-trip-badge--done">✓ route found</div>}
    </div>
  );
}

function ComparisonTable({
  rows,
  metric,
  activeKey,
  onSelect,
}: {
  rows: SearchSummary[];
  metric: Options["metric"];
  activeKey: string | null;
  onSelect: (options: Options) => void;
}) {
  if (rows.length < 2) {
    return null;
  }

  const costOf = (r: SearchSummary) => (metric === "time" ? r.durationMins : r.distanceMiles);
  const found = rows.filter((r) => r.found);
  const bestCost = Math.min(...found.map(costOf));
  const fewestExplored = Math.min(...found.map((r) => r.explored));

  return (
    <div className="mxp-compare">
      <table>
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Explored</th>
            <th>Search</th>
            <th>Distance</th>
            <th>Drive time</th>
            <th>vs best</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const extra = r.found ? (costOf(r) / bestCost - 1) * 100 : null;
            return (
              <tr
                key={r.key}
                className={r.key === activeKey ? "mxp-compare-row--active" : undefined}
                onClick={() => onSelect(r.options)}
                title="Replay this search"
              >
                <td>{r.label}</td>
                <td className={r.explored === fewestExplored ? "mxp-compare-best" : undefined}>
                  {r.explored.toLocaleString()}
                </td>
                <td>{Math.round(r.searchMs)} ms</td>
                <td>{r.found ? `${r.distanceMiles.toFixed(1)} mi` : "—"}</td>
                <td>{r.found ? formatDuration(r.durationMins) : "—"}</td>
                <td className={extra !== null && extra < 0.05 ? "mxp-compare-best" : undefined}>
                  {extra === null ? "no route" : extra < 0.05 ? "optimal" : `+${extra.toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MapExplorer() {
  const network = useRoadNetwork();
  const {
    startNode,
    endNode,
    options,
    setOptions,
    speed,
    setSpeed,
    status,
    result,
    progress,
    finalPath,
    comparison,
    error: searchError,
    exploration,
    explorationVersion,
    handleMapClick,
    moveEndpoint,
    compareAll,
    pause,
    resume,
    skip,
    reset: resetPathfinder,
  } = usePathfinder(network);

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

  function handleModeSwitch(newMode: string) {
    setMode(newMode);
    resetPathfinder();
    resetRoute();
  }

  function handleMapClickDispatch(latlng: LatLng) {
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
            {startNode && (
              <button className="mxp-reset-btn" onClick={resetPathfinder}>
                Reset
              </button>
            )}
          </div>
        )}

        {mode === "planner" && (
          <div className="mxp-legend">
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: START_COLOR }} />
              Start
            </span>
            <span className="mxp-legend-item">
              <span className="mxp-dot" style={{ background: ROUTE_COLOR }} />
              Route
            </span>
          </div>
        )}
      </div>

      <StatusBar
        loading={network.loading}
        error={network.error ?? searchError}
        ready={network.coords !== null}
        startNode={startNode}
        endNode={endNode}
        status={status}
        result={result}
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
        <>
          <PathfinderPanel
            options={options}
            setOptions={setOptions}
            status={status}
            speed={speed}
            setSpeed={setSpeed}
            pause={pause}
            resume={resume}
            skip={skip}
            compareAll={compareAll}
            canCompare={startNode !== null && endNode !== null && status !== "searching"}
          />
          <TripStats status={status} result={result} progress={progress} />
          <ComparisonTable
            rows={comparison}
            metric={options.metric}
            activeKey={result?.key ?? null}
            onSelect={setOptions}
          />
        </>
      )}

      <div className="mxp-map-wrap">
        <MapContainer
          center={BELFAST_CENTER}
          zoom={INITIAL_ZOOM}
          className="mxp-map"
          zoomControl={true}
          doubleClickZoom={false}
        >
          <TileLayer
            url={`https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapInvalidator />
          <ClickHandler onClick={handleMapClickDispatch} />

          {mode === "pathfinder" && (
            <>
              <ExplorationLayer
                coords={network.coords}
                exploration={exploration}
                version={explorationVersion}
                exploredColor={EXPLORED_COLOR}
                frontierColor={FRONTIER_COLOR}
              />
              {finalPath.length > 1 && (
                <Polyline
                  positions={finalPath}
                  pathOptions={{ color: PATH_COLOR, weight: 4, opacity: 0.9 }}
                />
              )}
              {startNode && (
                <EndpointMarker
                  position={startNode}
                  color={START_COLOR}
                  onMove={(latlng) => moveEndpoint("start", latlng)}
                />
              )}
              {endNode && (
                <EndpointMarker
                  position={endNode}
                  color={END_COLOR}
                  onMove={(latlng) => moveEndpoint("end", latlng)}
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
                  pathOptions={{
                    color: START_COLOR,
                    fillColor: START_COLOR,
                    fillOpacity: 1,
                    weight: 2,
                  }}
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
