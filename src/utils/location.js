import { createSelector } from "reselect";
import isEmpty from "lodash/isEmpty";
import sortBy from "lodash/sortBy";

export const selectLocation = (state) => state.location;

export const isMapPage = (location) =>
  location.pathname && location.pathname.includes("mapviewer");
export const isDashboardPage = (location) =>
  location.pathname && location.pathname.includes("dashboard");
export const isEmbedPage = (location) =>
  location.pathname && location.pathname.includes("embed");

export const getAllAreas = (state) =>
  state && state.areas && sortBy(state.areas.data, "name");

export const getActiveArea = createSelector(
  [selectLocation, getAllAreas],
  (location, areas) => {
    if (isEmpty(areas)) return null;

    return areas.find((a) => a.id === location?.payload?.adm0);
  }
);

export const getDataLocation = createSelector(
  [getActiveArea, selectLocation],
  (area, location) => {
    const { payload, pathname } = location || {};
    const newLocation = {
      ...payload,
      pathname,
      ...(payload?.type === "aoi" && {
        areaId: payload?.adm0,
      }),
      locationType: payload?.type,
    };
    if (!area) return newLocation;
    const { location: areaLocation } = area;
    return {
      ...newLocation,
      ...areaLocation,
    };
  }
);
export const buildFullLocationName = (
  { adm0, adm1, adm2 },
  { adm0s, adm1s, adm2s }
) => {
  let location = "";
  if (
    (adm0 && isEmpty(adm0s)) ||
    (adm1 && isEmpty(adm1s)) ||
    (adm2 && isEmpty(adm2s))
  ) {
    return "";
  }
  if (adm0) {
    const adm0Obj = adm0s && adm0s.find((a) => a.value === adm0);
    location = adm0Obj ? adm0Obj.label : "";
  }

  if (adm1) {
    const adm1Obj =
      adm1s &&
      adm1s.find((a) => a.value === adm1 || a.value === parseInt(adm1, 10));

    location = adm1Obj
      ? `${adm1Obj.label || "unnamed region"}, ${location}`
      : location;
  }
  if (adm2) {
    const adm2Obj =
      adm2s &&
      adm2s.find((a) => a.value === adm2 || a.value === parseInt(adm2, 10));
    location = adm2Obj
      ? `${adm2Obj.label || "unnamed region"}, ${location}`
      : location;
  }
  return location;
};

export const locationLevelToStr = (location) => {
  const { type, adm0, adm1, adm2 } = location;
  if (adm2) return "adm2";
  if (adm1) return "adm1";
  if (adm0) return "adm0";
  return type;
};

const DMS_DEGREE = "[0-9]{1,2}[°|º]\\s*";
const DMS_MINUTE = "[0-9]{1,2}['|′]";
const DMS_SECOND =
  "(?:\\b[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+\\b)(\"|''|′′|″)";
const DMS_NORTH = "[N]";
const DMS_EAST = "[E]";

const regexpDMSN = new RegExp(
  `${DMS_DEGREE}(${DMS_MINUTE})?\\s*(${DMS_SECOND})?\\s*${DMS_NORTH}`,
  "g"
);
const regexpDMSE = new RegExp(
  `${DMS_DEGREE}(${DMS_MINUTE})?\\s*(${DMS_SECOND})?\\s*${DMS_EAST}`,
  "g"
);
const regexpDMSDegree = new RegExp(DMS_DEGREE, "g");
const regexpCoordinate = /^\s*(-?[\d.']+)[\s,]+(-?[\d.']+)/;

const stripDegree = (str) => str.replace("°", "").replace("º", "");
const stripMinute = (str) => str.replace("'", "").replace("′", "");
const stripSecond = (str) =>
  str.replace('"', "").replace("''", "").replace("′′", "").replace("″", "");

const dmsPartToDecimal = (match) => {
  let value = parseFloat(stripDegree(match.match(regexpDMSDegree)[0]));
  const minute = match.match(DMS_MINUTE) ? match.match(DMS_MINUTE)[0] : "0";
  value += parseFloat(stripMinute(minute)) / 60;
  const second = match.match(DMS_SECOND) ? match.match(DMS_SECOND)[0] : "0";
  value += parseFloat(stripSecond(second)) / 3600;
  return value;
};

/**
 * Parse a coordinate from a free-text query.
 *
 * Supports two formats:
 *   - DMS with N/E suffixes, e.g. `46° 12' 8.4"N 6° 8' 33.6"E`
 *   - Decimal pair separated by space or comma, e.g. `-1.286, 36.817`
 *     (interpreted as `lat, lng`)
 *
 * Returns `{ lat, lng }` on success, `null` otherwise.
 */
export const parseCoordinate = (query) => {
  if (!query || typeof query !== "string") return null;

  const matchDMSN = query.match(regexpDMSN);
  const matchDMSE = query.match(regexpDMSE);

  if (
    matchDMSN &&
    matchDMSN.length === 1 &&
    matchDMSE &&
    matchDMSE.length === 1
  ) {
    const lat = dmsPartToDecimal(matchDMSN[0]);
    const lng = dmsPartToDecimal(matchDMSE[0]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const match = query.match(regexpCoordinate);
  if (match) {
    const a = parseFloat(match[1].replace("'", ""));
    const b = parseFloat(match[2].replace("'", ""));
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { lat: a, lng: b };
    }
  }

  return null;
};
