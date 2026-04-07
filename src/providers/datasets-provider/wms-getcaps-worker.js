import * as Comlink from "comlink";
import xmldom from "xmldom";
import WMSCapabilities from "wms-capabilities";
import { get } from "axios";
import { useCache } from "@camptocamp/ogc-client/dist/shared/cache.js";

import { extractLegendUrl, extractTimestamps } from "@/utils/wms";

async function fetchCapabilities(wmsUrl, params) {
  const response = await get(wmsUrl, { params: { ...params } });
  return new WMSCapabilities(response.data, xmldom.DOMParser).toJSON();
}

const wmsGetLayerInfoFromCapabilities = async (
  wmsUrl,
  layerName,
  styleName,
  params = {}
) => {
  try {
    const capabilities = await useCache(
      () => fetchCapabilities(wmsUrl, params),
      "WMS",
      "CAPABILITIES",
      wmsUrl
    );

    const layers = capabilities?.Capability?.Layer?.Layer || [];
    const match = layers.find((l) => l.Name === layerName) || {};

    const result = {};

    const timestamps = extractTimestamps(match);
    if (timestamps) {
      result.timestamps = timestamps;
    }

    const legendUrl = extractLegendUrl(match, styleName);
    if (legendUrl) {
      result.legendUrl = legendUrl;
    }

    return result;
  } catch (error) {
    console.error(
      `Error fetching or parsing GetCapabilities document: ${error.message}`
    );
    return {};
  }
};

const api = {
  wmsGetLayerInfoFromCapabilities,
};

Comlink.expose(api);
