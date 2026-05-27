// Compatibility shim for react-map-gl@5 + maplibre-gl@5.
// react-map-gl 5 targets the mapbox-gl 1 API; a few static helpers it relies on
// were removed in maplibre-gl 4/5. Patch them so the StaticMap mount doesn't crash.
import maplibregl from "maplibre-gl";

if (typeof maplibregl.supported !== "function") {
  maplibregl.supported = () => {
    if (typeof window === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return !!(
        canvas.getContext("webgl2") || canvas.getContext("webgl")
      );
    } catch {
      return false;
    }
  };
}

if (typeof maplibregl.setRTLTextPlugin !== "function") {
  maplibregl.setRTLTextPlugin = () => {};
}

export default maplibregl;
