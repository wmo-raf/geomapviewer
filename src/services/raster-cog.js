import { setColorFunction } from "@geomatico/maplibre-cog-protocol";

import request from "@/utils/request";
import { buildColorFunction } from "@/utils/color-ramp";

const registeredCogColorUrls = new Set();

const registerCogColorFunctions = (urlsMap, colorRamp) => {
  if (!urlsMap || !colorRamp) return;
  const fn = buildColorFunction(colorRamp);
  if (!fn) return;
  Object.values(urlsMap).forEach((cogUrl) => {
    if (!cogUrl || registeredCogColorUrls.has(cogUrl)) return;
    try {
      setColorFunction(cogUrl, fn);
      registeredCogColorUrls.add(cogUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("setColorFunction failed for", cogUrl, err);
    }
  });
};

// Fetches the TileJSON document served by the geomanager backend for a
// raster_cog layer, and registers the client-side coloring of its COGs. Shape:
//   { timestamps: ISO[], urls: { [iso: string]: cogUrl }, ... }
export const fetchTileJson = (tileJsonUrl, colorRamp) =>
  request(tileJsonUrl).then((res) => {
    const tileJson = res?.data || {};
    registerCogColorFunctions(tileJson.urls, colorRamp);
    return tileJson;
  });
