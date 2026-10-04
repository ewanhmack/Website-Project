import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export type NodeCoords = { lat: Float64Array; lng: Float64Array };

export type Exploration = {
  explored: number[];
  frontier: Set<number>;
};

type ExplorationLayerProps = {
  coords: NodeCoords | null;
  exploration: Exploration;
  // Bumped by the pathfinder whenever exploration changes, to trigger a redraw.
  version: number;
  exploredColor: string;
  frontierColor: string;
};

// Where the canvases sit (in layer points) and the lat/lng area they cover.
// Set on each full redraw and shared by both canvases.
type Frame = {
  origin: L.Point;
  size: L.Point;
  north: number;
  south: number;
  west: number;
  east: number;
};

const PANE_NAME = "mxp-exploration";
// Extra canvas on each side, as a fraction of the viewport size.
const CANVAS_MARGIN = 0.25;
const EXPLORED_RADIUS = 2;
const FRONTIER_RADIUS = 3;

// Draws explored and frontier nodes onto canvases. Rendering hundreds of
// thousands of nodes as individual Leaflet markers is far too slow, so
// explored nodes are drawn incrementally (only the new ones each frame) and
// fully redrawn only when the map moves or a new search starts. The frontier
// is small and changes every frame, so it gets its own canvas that is cleared.
export default function ExplorationLayer({
  coords,
  exploration,
  version,
  exploredColor,
  frontierColor,
}: ExplorationLayerProps) {
  const map = useMap();
  const exploredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frontierCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawnRef = useRef<{ exploration: Exploration | null; count: number }>({
    exploration: null,
    count: 0,
  });
  const frameRef = useRef<Frame | null>(null);
  const drawRef = useRef<(fullRedraw: boolean) => void>(() => {});

  drawRef.current = (fullRedraw) => {
    const exploredCanvas = exploredCanvasRef.current;
    const frontierCanvas = frontierCanvasRef.current;
    if (!exploredCanvas || !frontierCanvas || !coords) {
      return;
    }

    const drawn = drawnRef.current;
    const needsFull =
      fullRedraw ||
      drawn.exploration !== exploration ||
      drawn.count > exploration.explored.length;

    if (needsFull) {
      frameRef.current = computeFrame();
      resizeCanvas(exploredCanvas, frameRef.current);
      resizeCanvas(frontierCanvas, frameRef.current);
      drawn.exploration = exploration;
      drawn.count = 0;
    } else {
      clearCanvas(frontierCanvas);
    }

    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const { origin, south, north, west, east } = frame;
    const latLng = L.latLng(0, 0);

    function drawNodes(
      canvas: HTMLCanvasElement,
      ids: Iterable<number>,
      radius: number,
      color: string,
      alpha: number,
    ) {
      const ctx = canvas.getContext("2d");
      if (!ctx || !coords) {
        return;
      }
      ctx.beginPath();
      for (const id of ids) {
        const lat = coords.lat[id];
        const lng = coords.lng[id];
        if (lat < south || lat > north || lng < west || lng > east) {
          continue;
        }
        latLng.lat = lat;
        latLng.lng = lng;
        // Layer points don't change while the map is dragged, so dots drawn
        // mid-drag still line up with the ones drawn before it.
        const p = map.latLngToLayerPoint(latLng);
        const x = p.x - origin.x;
        const y = p.y - origin.y;
        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fill();
    }

    drawNodes(
      exploredCanvas,
      exploration.explored.slice(drawn.count),
      EXPLORED_RADIUS,
      exploredColor,
      0.5,
    );
    drawn.count = exploration.explored.length;

    drawNodes(frontierCanvas, exploration.frontier, FRONTIER_RADIUS, frontierColor, 0.8);
  };

  // The canvases cover the viewport plus a margin on every side, so dragging
  // the map reveals dots that are already drawn instead of empty strips.
  function computeFrame(): Frame {
    const size = map.getSize();
    const margin = size.multiplyBy(CANVAS_MARGIN).round();
    const origin = map.containerPointToLayerPoint(margin.multiplyBy(-1));
    const canvasSize = size.add(margin.multiplyBy(2));
    const northWest = map.layerPointToLatLng(origin);
    const southEast = map.layerPointToLatLng(origin.add(canvasSize));
    return {
      origin,
      size: canvasSize,
      north: northWest.lat,
      west: northWest.lng,
      south: southEast.lat,
      east: southEast.lng,
    };
  }

  // Resizing a canvas also clears it.
  function resizeCanvas(canvas: HTMLCanvasElement, { origin, size }: Frame) {
    const ratio = window.devicePixelRatio || 1;
    L.DomUtil.setPosition(canvas, origin);
    canvas.width = size.x * ratio;
    canvas.height = size.y * ratio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    canvas.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function clearCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  useEffect(() => {
    const pane = map.getPane(PANE_NAME) ?? map.createPane(PANE_NAME);
    // Above tiles (200), below the path and start/end markers (400).
    pane.style.zIndex = "350";
    pane.style.pointerEvents = "none";

    const exploredCanvas = L.DomUtil.create("canvas", "", pane);
    const frontierCanvas = L.DomUtil.create("canvas", "", pane);
    exploredCanvasRef.current = exploredCanvas;
    frontierCanvasRef.current = frontierCanvas;

    const redraw = () => drawRef.current(true);
    const hide = () => {
      pane.style.visibility = "hidden";
    };
    const show = () => {
      pane.style.visibility = "visible";
      redraw();
    };

    map.on("moveend resize", redraw);
    map.on("zoomstart", hide);
    map.on("zoomend", show);
    redraw();

    return () => {
      map.off("moveend resize", redraw);
      map.off("zoomstart", hide);
      map.off("zoomend", show);
      exploredCanvas.remove();
      frontierCanvas.remove();
      exploredCanvasRef.current = null;
      frontierCanvasRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => drawRef.current(false));
    return () => cancelAnimationFrame(frame);
  }, [version, coords]);

  return null;
}
