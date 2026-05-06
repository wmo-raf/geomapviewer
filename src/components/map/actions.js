import { createAction } from "@/redux/actions";

export const setMapLoading = createAction("setMapLoading");
export const setMapSettings = createAction("setMapSettings");
export const setMapInteractions = createAction("setMapInteractions");
export const addMapInteraction = createAction("addMapInteraction");
export const setMapInteractionSelected = createAction(
  "setMapInteractionSelected"
);

export const setMapHoverInteraction = createAction("setMapHoverInteraction");
export const clearMapHoverInteraction = createAction(
  "clearMapHoverInteraction"
);

export const clearMapInteractions = createAction("clearMapInteractions");

export const setBasemapFromLegend = createAction("setBasemapFromLegend");

export const setMapBasemap = createAction("setMapBasemap");
