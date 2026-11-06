// Compatibility shim for react-map-gl@5 + maplibre-gl@6.
// react-map-gl 5 targets the mapbox-gl 1 API: it imports `mapbox-gl` as a
// default export (aliased to this file in next.config.js), assigns
// `accessToken`/`baseApiUrl` on it and calls a few static helpers that
// maplibre-gl removed. maplibre-gl 6 is ESM-only and its module namespace is
// frozen, so expose a mutable copy with those helpers patched back.
import * as maplibre from "maplibre-gl";

// maplibre-gl 6 locates its worker from `import.meta.url`, which webpack
// rewrites to a file:// URL: point it at the worker emitted as an asset.
maplibre.setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString()
);

const maplibregl = {
  ...maplibre,
  version: maplibre.getVersion(),
  // maplibre-gl 6 requires WebGL2
  supported: () => {
    if (typeof window === "undefined") return false;
    try {
      return !!document.createElement("canvas").getContext("webgl2");
    } catch {
      return false;
    }
  },
};

export default maplibregl;
