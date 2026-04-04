import * as Comlink from "comlink";
import xmldom from "xmldom";
import WMSCapabilities from "wms-capabilities";
import { get } from "axios";
import { subDays } from "date-fns";

import { parse, toSeconds } from "iso8601-duration";
import {extractLegendUrl, extractTimestamps} from '@/utils/wms'


const wmsGetLayerInfoFromCapabilities = async (
  wmsUrl,
  layerName,
  styleName,
  params = {}
) => {
  try {
    const response = await get(wmsUrl, {
      params: { ...params },
    });

    const capabilities = new WMSCapabilities(
      response.data,
      xmldom.DOMParser
    ).toJSON();

    const layers = capabilities?.Capability?.Layer?.Layer || [];
    const match = layers.find((l) => l.Name === layerName) || {};

    const result = {};

    const timestamps = extractTimestamps(match);
    if (timestamps) {
      result.timestamps = timestamps;
    }

    if (styleName) {
      const legendUrl = extractLegendUrl(match, styleName);
      if (legendUrl) {
        result.legendUrl = legendUrl;
      }
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
