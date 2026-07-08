import { getBasemap } from "@/components/map/selectors";
import { createStructuredSelector } from "reselect";

export const getApiBaseMaps = (state) => state.config && state.config.basemaps;

export const selectConfigBounds = (state) => state.config && state.config.bounds;

export const getConfigProps = createStructuredSelector({
  basemaps: getApiBaseMaps,
  basemap: getBasemap,
});
