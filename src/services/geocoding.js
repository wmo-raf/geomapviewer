import { nominatimGeocodingRequest } from "@/utils/request";

import { POLITICAL_BOUNDARIES } from "@/data/layers";

const EA_BBOX = [21.838949, -11.745695, 51.415695, 23.145147];

const parseNominatimRes = (data) =>
  data.map((f) => {
    return {
      ...f,
      source: "nominatim",
      id: POLITICAL_BOUNDARIES,
      bbox: f.bbox,
      center: f.geometry.coordinates,
      place_name: f.properties.display_name,
    };
  });

export const fetchGeocodeNominatim = (
  searchQuery = "",
  lang = "en",
  cancelToken
) => {
  return nominatimGeocodingRequest
    .get(
      `/search?q=${searchQuery}&format=geojson&&viewbox=${EA_BBOX.toString()}&bounded=1`,
      {
        cancelToken,
      }
    )
    .then((res) => {
      const features =
        res?.data?.features && parseNominatimRes(res.data.features);
      return features;
    })
    .catch((err) => {
      return [];
    });
};

export const fetchReverseGeocodePoint = ({ lat, lng, cancelToken }) => {
  return nominatimGeocodingRequest({
    method: "get",
    url: `/reverse?lat=${lat}&lon=${lng}&format=geojson`,
    cancelToken: cancelToken,
  }).then((res) => {
    return res?.data?.features?.map((f) => {
      return {
        ...f,
        source: "nominatim",
        id: POLITICAL_BOUNDARIES,
        bbox: f.bbox,
        center: f.geometry.coordinates,
        place_name: f.properties.name
          ? f.properties.name
          : f.properties.display_name,
      };
    });
  });
};
