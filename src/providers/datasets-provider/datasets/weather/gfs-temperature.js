import { GFS_TEMPERATURE_FORECAST } from "@/data/layers";
import { fetchTimestamps } from "@/services/timestamps";
import { getNextDate } from "@/utils/time";

const datasetName = "Temperature Forecast ";
const layerName = GFS_TEMPERATURE_FORECAST;
const metadataId = "73c163c2-606c-4f27-85dc-4762268c8b9f";
const timestampsDataPath = "/gskydata/gfs/gfs-temperature-2-m";

const category = 2;
const subCategory = 1;

const datasets = [
  {
    name: datasetName,
    id: layerName,
    dataset: layerName,
    layer: layerName,
    category: category,
    sub_category: subCategory,
    metadata: metadataId,
    summary: "GFS, Hourly for the next 5 days",
    group: "gfs",
    global: true,
    capabilities: ["clip", "timeseries", "analysis"],
    layers: [
      {
        name: datasetName,
        id: layerName,
        type: "layer",
        default: true,
        dataset: layerName,
        layerConfig: {
          type: "raster",
          source: {
            type: "raster",
            tiles: [
              `http://20.56.94.119/gsky/ows/gfs?service=WMS&request=GetMap&version=1.1.1&width=256&height=256&styles=&transparent=true&srs=EPSG:3857&bbox={bbox-epsg-3857}&format=image/png&time={time}&layers={height}&geojson_feature_id={geojson_feature_id}`,
            ],
            minzoom: 3,
            maxzoom: 12,
          },
          canClipToGeom: true,
        },
        interactionConfig: {
          type: "wmsGetFeatureInfo",
        },
        legendConfig: {
          type: "gradient",
          items: [
            { name: -20, color: "#9589D3" },
            { name: "", color: "#96d1d8" },
            { name: "-10", color: "#81ccc5" },
            { name: "", color: "#67b4ba" },
            { name: "0", color: "#5f8fc5" },
            { name: "", color: "#508c3e" },
            { name: "10", color: "#79921c" },
            { name: "", color: "#aba10e" },
            { name: "20", color: "#dfb106" },
            { name: "", color: "#f39606" },
            { name: "30", color: "#ec5f15" },
            { name: "", color: "#be4112" },
            { name: "40 °C", color: "#8A2B0A" },
          ],
        },
        params: {
          time: "",
          geojson_feature_id: "",
          height: "gfs_temperature_2_m",
        },
        paramsSelectorColumnView: true,
        paramsSelectorConfig: [
          {
            key: "time",
            required: true,
            sentence: "{selector}",
            type: "datetime",
            dateFormat: { currentTime: "yyyy-MM-dd HH:mm" },
            availableDates: [],
          },
          {
            key: "height",
            required: true,
            type: "radio",
            options: [
              { label: "Surface", value: "gfs_temperature_2_m" },
              { label: "Cloud - 500 mb", value: "gfs_temperature_500_mb" },
              { label: "Cruise - 200 mb", value: "gfs_temperature_200_mb" },
            ],
            sentence: "Height {selector}",
          },
        ],
        timeParamSentenceConfig: {
          param: "time",
          format: "do MMM y hh:mm",
          add: 7,
          template: "Selected Period : {time}",
        },
      },
    ],
  },
];

const updates = [
  {
    layer: GFS_TEMPERATURE_FORECAST,
    getTimestamps: (params = {}, token) => {
      return fetchTimestamps(timestampsDataPath).then((res) => {
        const timestamps = (res.data && res.data.timestamps) || [];

        return timestamps;
      });
    },
    getCurrentLayerTime: (timestamps) => {
      const nextDate = getNextDate(timestamps);

      if (nextDate) {
        return nextDate;
      }

      return timestamps[timestamps.length - 1];
    },
    updateInterval: 300000, // 5 minutes
  },
];

export default { datasets, updates };
