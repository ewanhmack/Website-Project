// Loads the road network and runs searches off the main thread, so parsing the
// snapshot and long searches never freeze the map.
import { buildNetwork, findNearestNode } from "./roadNetwork";
import { runSearch } from "./searchAlgorithms";

let network = null;

const handlers = {
  async load({ url }) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Road snapshot returned ${res.status}`);
    }
    network = buildNetwork(await res.json());

    // The main thread gets its own copy of the coordinates for drawing.
    const lat = network.lat.slice();
    const lng = network.lng.slice();
    return { result: { nodeCount: network.nodeCount, lat, lng }, transfer: [lat.buffer, lng.buffer] };
  },

  nearest({ lat, lng }) {
    return { result: findNearestNode(network, lat, lng) };
  },

  search({ startId, endId, options }) {
    const result = runSearch(network, startId, endId, options);
    return {
      result,
      transfer: [result.explored.buffer, result.addedOffsets.buffer, result.added.buffer, result.path.buffer],
    };
  },
};

self.onmessage = async ({ data: { id, type, payload } }) => {
  try {
    const { result, transfer = [] } = await handlers[type](payload);
    self.postMessage({ id, result }, transfer);
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
