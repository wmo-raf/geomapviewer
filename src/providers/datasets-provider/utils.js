import { fetchUrlTimestamps } from "@/services/timestamps";
import { getNextDate, getPreviousDate } from "@/utils/time";

import { POLITICAL_BOUNDARIES_DATASET } from "@/data/datasets";
import { POLITICAL_BOUNDARIES } from "@/data/layers";

const getLayerTime = (timestamps, currentTimeMethod) => {
  let currentTime = timestamps[timestamps.length - 1];

  switch (currentTimeMethod) {
    case "next_to_now":
      const nextDate = getNextDate(timestamps);
      if (nextDate) {
        currentTime = nextDate;
      }
      break;
    case "previous_to_now":
      const previousDate = getPreviousDate(timestamps);
      if (previousDate) {
        currentTime = previousDate;
      }
      break;
    case "latest_from_source":
      currentTime = timestamps[timestamps.length - 1];
      break;
    case "earliest_from_source":
      currentTime = timestamps[0];
      break;
    default:
      break;
  }

  return currentTime;
};

const rasterFileUpdateProvider = (layer) => {
  const {
    id: layerId,
    currentTimeMethod,
    autoUpdateInterval,
    settings = {},
    tileJsonUrl,
  } = layer;

  const { autoUpdateActive = true } = settings;

  return {
    layer: layer,
    getTimestamps: () => {
      return fetchUrlTimestamps(tileJsonUrl, "timestamps").then(
        (timestamps) => {
          return timestamps;
        }
      );
    },
    getCurrentLayerTime: (timestamps) => {
      return getLayerTime(timestamps, currentTimeMethod);
    },
    ...(!!autoUpdateInterval &&
      autoUpdateActive && {
        updateInterval: autoUpdateInterval,
      }),
  };
};

const wmsUpdateProvider = (layer) => {
  const {
    id: layerId,
    getCapabilitiesUrl,
    layerName,
    autoUpdateInterval,
    currentTimeMethod,
    multiTemporal,
    legendConfig,
  } = layer;

  const legendFromCapabilities = legendConfig?.type === "wms_capabilities";

  return {
    layer: layer,
    legendFromCapabilities,
    ...(multiTemporal && {
      getCurrentLayerTime: (timestamps) => {
        return getLayerTime(timestamps, currentTimeMethod);
      },
    }),
    ...(!!autoUpdateInterval && {
      updateInterval: autoUpdateInterval,
    }),
  };
};

const tileLayerUpdateProvider = (layer) => {
  const {
    currentTimeMethod,
    autoUpdateInterval,
    settings = {},
    tileJsonUrl,
    timestampsResponseObjectKey,
  } = layer;

  const { autoUpdateActive = true } = settings;

  return {
    layer: layer,
    getTimestamps: () => {
      return fetchUrlTimestamps(tileJsonUrl, timestampsResponseObjectKey).then(
        (timestamps) => {
          return timestamps;
        }
      );
    },
    getCurrentLayerTime: (timestamps) => {
      return getLayerTime(timestamps, currentTimeMethod);
    },
    ...(!!autoUpdateInterval &&
      autoUpdateActive && {
        updateInterval: autoUpdateInterval,
      }),
  };
};

export const createUpdateProviders = (activeLayers) => {
  const providers = activeLayers.reduce((all, layer) => {
    const { layerType, multiTemporal, legendConfig } = layer;

    let provider;

    const legendFromCapabilities = legendConfig?.type === "wms_capabilities";

    if (multiTemporal && layerType) {
      switch (layerType) {
        case "raster_file":
          provider = rasterFileUpdateProvider(layer);
          break;
        case "wms":
          provider = wmsUpdateProvider(layer);
          break;
        case "raster_tile":
          provider = tileLayerUpdateProvider(layer);
        case "vector_tile":
          provider = tileLayerUpdateProvider(layer);
        default:
          break;
      }
    } else if (!multiTemporal && layerType === "wms" && legendFromCapabilities) {
      provider = wmsUpdateProvider(layer);
    }

    if (provider) {
      all.push(provider);
    }

    return all;
  }, []);

  return providers;
};

export const getTimeseriesConfig = (layer, analysisType) => {
  let config = layer.analysisConfig.pointTimeseriesAnalysis;

  if (analysisType !== "point") {
    config = layer.analysisConfig.areaTimeseriesAnalysis;
  }

  const { chartType, chartColor } = config;

  return {
    widget: `widget-${layer.id}`,
    layerId: layer.id,
    datasetId: layer.dataset,
    title: `${layer.name} - Timeseries Analysis for {location}`,
    categories: [""],
    types: ["country", "geostore", "point", "aoi", "use"],
    admins: ["adm0", "adm1", "adm2"],
    large: true,
    metaKey: "",
    sortOrder: {},
    visible: ["analysis"],
    chartType: "composedChart",
    colors: "weather",
    sentences: {},
    settings: {
      time: "",
    },
    refetchKeys: ["time"],
    requiresTime: true,
    datasets: [
      {
        dataset: POLITICAL_BOUNDARIES_DATASET,
        layers: [POLITICAL_BOUNDARIES],
        boundary: true,
      },
      {
        dataset: layer.dataset,
        layers: [layer.id],
      },
    ],
    plotConfig: {
      simpleNeedsAxis: true,
      height: 250,
      yKeys: {
        [chartType]: {
          value: {
            yAxisId: "value",
            fill: chartColor,
            stroke: chartColor,
          },
        },
      },
      unit: config.unit || "",
      yAxis: {
        yAxisId: "value",
        domain: ["auto", "auto"],
      },
      xAxis: {
        dataKey: "date",
        tickDateFormat: "dd MMM yy",
      },
      tooltip: [
        {
          key: "date",
          label: "Date",
          formatConfig: {
            formatDate: true,
            dateFormat: "yyyy-MM-dd HH:mm",
          },
        },
        {
          key: "value",
          label: "Value",
          formatConfig: { formatNumber: true, units: config.unit || "" },
        },
      ],
    },
  };
};
