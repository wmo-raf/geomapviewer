import { addProtocol } from "maplibre-gl";

import request from "@/utils/request";

const MAX_LEGEND_LABELS = 8;

let openMeteoModule;

// The package is loaded on demand, as importing it starts its pool of render
// workers. The `om` protocol gets registered before any source can use it.
const loadOpenMeteo = () => {
  if (!openMeteoModule) {
    openMeteoModule = import("@openmeteo/weather-map-layer").then((om) => {
      addProtocol("om", om.omProtocol);
      return om;
    });
  }
  return openMeteoModule;
};

const pad = (n) => String(n).padStart(2, "0");

const formatDay = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;

// Path of the `.om` file holding one valid time of a model run:
// {domain}/{YYYY}/{MM}/{DD}/{HH}00Z/{YYYY}-{MM}-{DD}T{HH}00.om
const getOmFilePath = (domain, referenceTime, validTime) =>
  [
    domain,
    formatDay(referenceTime).replace(/-/g, "/"),
    `${pad(referenceTime.getUTCHours())}00Z`,
    `${formatDay(validTime)}T${pad(validTime.getUTCHours())}00.om`,
  ].join("/");

const toCssColor = ([r, g, b, a = 1]) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Choropleth legend matching the color scale the protocol renders with: each
// color spans from its breakpoint up to the next one.
const getLegendConfig = (colorScale) => {
  const { colors, unit } = colorScale;
  const breakpoints =
    colorScale.breakpoints ||
    colors.map(
      (_, i) =>
        colorScale.min +
        (i * (colorScale.max - colorScale.min)) / (colors.length - 1)
    );
  const labelStep = Math.ceil(breakpoints.length / MAX_LEGEND_LABELS);

  return {
    type: "choropleth",
    units: unit,
    items: colors.map((color, i) => {
      const upperBound = breakpoints[i + 1];
      const showLabel = upperBound !== undefined && (i + 1) % labelStep === 0;
      return {
        name: showLabel ? +upperBound.toFixed(2) : "",
        color: toCssColor(color),
      };
    }),
  };
};

// Lists the valid times of the latest run of an Open-Meteo model, with the
// `.om` file URL of each of them for the configured variable.
export const fetchOpenMeteoTimeUrls = ({ baseUrl, domain, variable }) =>
  Promise.all([
    request(`${baseUrl}/${domain}/latest.json`),
    loadOpenMeteo(),
  ]).then(([res, om]) => {
    const { reference_time: referenceTime, valid_times: validTimes = [] } =
      res?.data || {};

    const timestamps = validTimes.map((t) => new Date(t).toISOString());
    const urls = timestamps.reduce((all, timestamp) => {
      const validTime = new Date(timestamp);
      const params = new URLSearchParams({ variable });
      // accumulated variables are shown per hour, whatever the model step
      const timeStepHours = om.timeStepHoursAt(validTime, validTimes);
      if (timeStepHours) {
        params.set("delta_time_hours", timeStepHours);
      }

      all[timestamp] = `${baseUrl}/${getOmFilePath(
        domain,
        new Date(referenceTime),
        validTime
      )}?${params}`;
      return all;
    }, {});

    return {
      timestamps,
      urls,
      legendConfig: getLegendConfig(om.getColorScale(variable, false)),
    };
  });
