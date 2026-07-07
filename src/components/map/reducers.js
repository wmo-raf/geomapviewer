import { POLITICAL_BOUNDARIES_DATASET } from "@/data/datasets";
import { POLITICAL_BOUNDARIES } from "@/data/layers";

import * as actions from "./actions";

export const initialState = {
  loading: false,
  data: {
    interactions: {
      latlng: {},
      interactions: {},
      selected: "",
    },
    hoverInteraction: {
      feature: null,
      latlng: {},
    },
  },
  settings: {
    center: {
      lat: 2,
      lng: 24,
    },
    zoom: 3,
    bearing: 0,
    pitch: 0,
    minZoom: 2,
    maxZoom: 19,
    basemap: {
      value: "",
    },
    labels: true,
    roads: false,
    bbox: [],
    canBound: true,
    drawing: false,
    printing: false,
    comparing: false,
    activeCompareSide: null,
    drawingMode: "draw_polygon",
    // "Create alert" flow: lightweight draw, decoupled from the geostore.
    capAlertActive: false,
    capAlertGeometry: null,
    mapBounds: [],
    datasets: [
      // admin boundaries
      {
        dataset: POLITICAL_BOUNDARIES_DATASET,
        layers: [POLITICAL_BOUNDARIES],
        opacity: 1,
        visibility: true,
      },
    ],
  },
};

const setMapLoading = (state, { payload }) => ({
  ...state,
  loading: payload,
});

const setMapSettings = (state, { payload }) => ({
  ...state,
  settings: {
    ...state.settings,
    ...payload,
  },
});

const setMapBasemap = (state, { payload }) => ({
  ...state,
  settings: {
    ...state.settings,
    basemap: {
      ...state.settings.basemap,
      ...payload,
    },
  },
});

const setMapInteractions = (state, { payload }) => {
  const interactions = payload?.features?.reduce(
    (obj, { layer, id, geometry, ...data }) => ({
      ...obj,
      [layer?.source || id]: {
        id: layer?.source || id,
        geometry,
        data,
      },
    }),
    {}
  );

  return {
    ...state,
    data: {
      ...state.data,
      interactions: {
        ...state.data.interactions,
        interactions,
        latlng: {
          lat: payload.lngLat[1],
          lng: payload.lngLat[0],
        },
      },
    },
  };
};

const addMapInteraction = (state, { payload }) => {
  if (!payload || !payload.id || !payload.interaction) return state;

  return {
    ...state,
    data: {
      ...state.data,
      interactions: {
        ...state.data.interactions,
        interactions: {
          ...state.data.interactions.interactions,
          [payload.id]: payload.interaction,
        },
        ...(payload.lngLat && {
          latlng: {
            lat: payload.lngLat[1] ?? payload.lngLat.lat,
            lng: payload.lngLat[0] ?? payload.lngLat.lng,
          },
        }),
      },
    },
  };
};

const setMapInteractionSelected = (state, { payload }) => ({
  ...state,
  data: {
    ...state.data,
    interactions: {
      ...state.data.interactions,
      selected: payload,
    },
  },
});

const clearMapInteractions = (state) => ({
  ...state,
  data: {
    ...state.data,
    interactions: {
      interactions: {},
      latlng: null,
      selected: "",
    },
  },
});

const setMapHoverInteraction = (state, { payload }) => {
  const hoverFeature = payload && {
    id: payload.feature.id,
    data: payload.feature.properties,
    geometry: payload.feature.geometry,
    source: payload.feature.source,
    layer: payload.feature.layer,
  };

  return {
    ...state,
    data: {
      ...state.data,
      hoverInteraction: {
        feature: hoverFeature,
        latlng: {
          lat: payload.lngLat[1],
          lng: payload.lngLat[0],
        },
      },
    },
  };
};

const clearMapHoverInteraction = (state) => ({
  ...state,
  data: {
    ...state.data,
    hoverInteraction: {
      feature: null,
      latlng: null,
    },
  },
});

export default {
  [actions.setMapBasemap]: setMapBasemap,
  [actions.setMapLoading]: setMapLoading,
  [actions.setMapSettings]: setMapSettings,
  [actions.setMapInteractions]: setMapInteractions,
  [actions.addMapInteraction]: addMapInteraction,
  [actions.setMapInteractionSelected]: setMapInteractionSelected,
  [actions.clearMapInteractions]: clearMapInteractions,
  [actions.setMapHoverInteraction]: setMapHoverInteraction,
  [actions.clearMapHoverInteraction]: clearMapHoverInteraction,
};
