// Builds the road network snapshot used by the Map Explorer pathfinder.
//
// Usage:
//   node scripts/build-road-snapshot.mjs
//
// Queries Overpass once for Northern Ireland's drivable roads (plus car ferries
// that start and end inside the area) and writes a compact graph to
// public/data/ni-roads.json, so visitors never hit Overpass directly.
// Re-run occasionally to pick up road changes in OpenStreetMap.
//
// Output format (roadNetwork.js rebuilds the graph from this):
//   version:  format version
//   highways: highway tag names (or "ferry"), referenced by index
//   nodes:    flat [lat0, lng0, lat1, lng1, ...], rounded to ~1 m
//   ways:     [highwayIndex, oneway (0|1), speedMph, nodeIndex, nodeIndex, ...]
//             speedMph is the posted limit (0 if untagged), or for ferries the
//             average crossing speed derived from the duration tag.

import { mkdir, writeFile } from "fs/promises";
import path from "path";

const OUTPUT = path.join("public", "data", "ni-roads.json");
const FORMAT_VERSION = 2;

const BBOX = "54.0,-8.18,55.35,-5.43";
const [SOUTH, WEST, NORTH, EAST] = BBOX.split(",").map(Number);

const DRIVABLE =
  "^((motorway|trunk|primary|secondary|tertiary)(_link)?|unclassified|residential|living_street)$";
const NO_ACCESS = "^(private|no)$";

const QUERY = `
[out:json][timeout:180];
(
  way["highway"~"${DRIVABLE}"]["access"!~"${NO_ACCESS}"]["motor_vehicle"!~"${NO_ACCESS}"]["motorcar"!~"${NO_ACCESS}"](${BBOX});
  way["route"="ferry"]["motorcar"!="no"]["motor_vehicle"!="no"](${BBOX});
);
out body;
>;
out skel qt;
`;

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const ROUNDS = 5;
const COORD_PRECISION = 1e5;
const MPH_PER_KMH = 0.621371;
const METRES_PER_MILE = 1609.344;
const MAX_TERMINAL_LINK_METRES = 500;
const TERMINAL_SPEED_MPH = 10;

// UK national speed limit shorthands.
const NAMED_LIMITS_MPH = {
  "GB:nsl_single": 60,
  "GB:nsl_dual": 70,
  "GB:motorway": 70,
  "UK:nsl_single": 60,
  "UK:nsl_dual": 70,
  "UK:motorway": 70,
};

async function fetchOverpass() {
  for (let round = 0; round < ROUNDS; round++) {
    for (const url of OVERPASS_URLS) {
      const host = new URL(url).hostname;
      try {
        console.log(`Querying ${host}...`);
        const res = await fetch(url, {
          method: "POST",
          body: `data=${encodeURIComponent(QUERY)}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Website-Project road snapshot script",
          },
        });

        if (res.ok) {
          return await res.json();
        }
        console.warn(`  ${host} returned ${res.status}`);
      } catch (err) {
        console.warn(`  ${host} failed: ${err.message}`);
      }
    }

    const delayMs = 5000 * (round + 1);
    console.log(`All endpoints failed, retrying in ${delayMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Overpass unavailable, try again later");
}

function parseMaxspeedMph(value) {
  if (!value) {
    return 0;
  }
  if (NAMED_LIMITS_MPH[value]) {
    return NAMED_LIMITS_MPH[value];
  }
  const match = /^(\d+(?:\.\d+)?)\s*(mph)?$/.exec(value.trim());
  if (!match) {
    return 0;
  }
  const n = Number(match[1]);
  // OSM speeds without a unit are km/h.
  return Math.round(match[2] ? n : n * MPH_PER_KMH);
}

// Accepts "HH:MM", "H:MM:SS", ":MM" and "N min".
function parseDurationHours(value) {
  if (!value) {
    return 0;
  }
  const minutes = /^(\d+)\s*min/.exec(value);
  if (minutes) {
    return Number(minutes[1]) / 60;
  }
  const parts = value.split(":").map((p) => Number(p || 0));
  if (parts.some(Number.isNaN)) {
    return 0;
  }
  const [h = 0, m = 0, s = 0] = parts;
  return h + m / 60 + s / 3600;
}

function haversineMetres(a, b) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function isOneway(tags) {
  if (tags.oneway === "no") {
    return false;
  }
  return (
    tags.oneway === "yes" ||
    tags.oneway === "1" ||
    tags.oneway === "-1" ||
    tags.highway === "motorway" ||
    tags.highway === "motorway_link" ||
    tags.junction === "roundabout"
  );
}

function insideBbox([lat, lng]) {
  return lat >= SOUTH && lat <= NORTH && lng >= WEST && lng <= EAST;
}

function buildSnapshot(elements) {
  const coords = new Map();
  for (const el of elements) {
    if (el.type === "node") {
      coords.set(el.id, [el.lat, el.lon]);
    }
  }

  const highways = [];
  const nodeIndex = new Map();
  const nodes = [];
  const ways = [];
  const ferries = [];

  function indexOfNode(osmId) {
    if (!nodeIndex.has(osmId)) {
      const [lat, lng] = coords.get(osmId);
      nodeIndex.set(osmId, nodeIndex.size);
      nodes.push(
        Math.round(lat * COORD_PRECISION) / COORD_PRECISION,
        Math.round(lng * COORD_PRECISION) / COORD_PRECISION,
      );
    }
    return nodeIndex.get(osmId);
  }

  function highwayIndex(name) {
    if (!highways.includes(name)) {
      highways.push(name);
    }
    return highways.indexOf(name);
  }

  for (const el of elements) {
    if (el.type !== "way") {
      continue;
    }

    const tags = el.tags ?? {};
    const wayNodes = el.nodes.filter((id) => coords.has(id));
    if (wayNodes.length < 2) {
      continue;
    }

    if (tags.route === "ferry") {
      // Untagged ferries are usually foot passenger only.
      const takesCars =
        tags.motorcar === "yes" || (tags.motor_vehicle === "yes" && tags.motorcar !== "no");
      // Long-haul routes (Scotland, England, Isle of Man) would be dead ends.
      if (!takesCars || !wayNodes.every((id) => insideBbox(coords.get(id)))) {
        continue;
      }
      let metres = 0;
      for (let i = 0; i < wayNodes.length - 1; i++) {
        metres += haversineMetres(coords.get(wayNodes[i]), coords.get(wayNodes[i + 1]));
      }
      const hours = parseDurationHours(tags.duration);
      // Without a timetable, assume a slow 8 mph crossing.
      const speedMph = hours > 0 ? metres / METRES_PER_MILE / hours : 8;
      ways.push([
        highwayIndex("ferry"),
        0,
        Math.max(1, Math.round(speedMph)),
        ...wayNodes.map(indexOfNode),
      ]);
      ferries.push(tags.name ?? `way ${el.id}`);
      continue;
    }

    // oneway=-1 means traffic flows against the way's node order.
    if (tags.oneway === "-1") {
      wayNodes.reverse();
    }

    ways.push([
      highwayIndex(tags.highway),
      isOneway(tags) ? 1 : 0,
      parseMaxspeedMph(tags.maxspeed),
      ...wayNodes.map(indexOfNode),
    ]);
  }

  connectFerryTerminals(ways, nodes, highwayIndex);

  return { snapshot: { version: FORMAT_VERSION, highways, nodes, ways }, ferries };
}

// Ferry ways usually end at a pier node that isn't on any drivable road, so
// link each unconnected end to the nearest road node with a short terminal way.
function connectFerryTerminals(ways, nodes, highwayIndex) {
  const ferryIndex = highwayIndex("ferry");
  const roadNodes = new Set();
  for (const way of ways) {
    if (way[0] !== ferryIndex) {
      for (let i = 3; i < way.length; i++) {
        roadNodes.add(way[i]);
      }
    }
  }

  const coordOf = (id) => [nodes[id * 2], nodes[id * 2 + 1]];
  const ferryWays = ways.filter((way) => way[0] === ferryIndex);

  for (const way of ferryWays) {
    for (const end of [way[3], way[way.length - 1]]) {
      if (roadNodes.has(end)) {
        continue;
      }

      let nearest = null;
      let nearestMetres = Infinity;
      for (const id of roadNodes) {
        const metres = haversineMetres(coordOf(end), coordOf(id));
        if (metres < nearestMetres) {
          nearestMetres = metres;
          nearest = id;
        }
      }

      if (nearest === null || nearestMetres > MAX_TERMINAL_LINK_METRES) {
        console.warn(`  Ferry end ${end} has no road within ${MAX_TERMINAL_LINK_METRES} m`);
        continue;
      }
      ways.push([highwayIndex("ferry_terminal"), 0, TERMINAL_SPEED_MPH, end, nearest]);
    }
  }
}

const data = await fetchOverpass();
const { snapshot, ferries } = buildSnapshot(data.elements);
const json = JSON.stringify(snapshot);

await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, json);

console.log(
  `Wrote ${OUTPUT}: ${snapshot.nodes.length / 2} nodes, ` +
    `${snapshot.ways.length} ways, ${(json.length / 1e6).toFixed(1)} MB`,
);
console.log(`Ferries: ${ferries.join(", ") || "none"}`);
