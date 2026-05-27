import { createSelector, createStructuredSelector } from "reselect";
import flatten from "lodash/flatten";
import isEmpty from "lodash/isEmpty";
import flatMap from "lodash/flatMap";
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/unionBy";

import { defined } from "@/utils/core";
import { selectActiveLang, getMapboxLang } from "@/utils/lang";
import { getActiveArea } from "@/providers/aoi-provider/selectors";

// map state
const selectMapLoading = (state) => state.map && state.map.loading;
const selectGeostoreLoading = (state) =>
  state.geostore && state.geostore.loading;
const selectDatasetsLoading = (state) =>
  state.datasets && state.datasets.loading;
const selectMapData = (state) => state.map && state.map.data;
const selectDatasets = (state) => state.datasets && state.datasets.data;
export const selectGeostore = (state) => state.geostore && state.geostore.data;
const getLocation = (state) => state.location;
const selectLocation = (state) => state.location && state.location.payload;
const selectLayersGeojsonData = (state) =>
  state.datasets && state.datasets.geojsonData;
const selectHoverFeature = (state) =>
  state.map && state.map.data.hoverInteraction.feature;

const selectLayersUpdatingStatus = (state) =>
  state.datasets && state.datasets.layerUpdatingStatus;

const selectLayersLoadingStatus = (state) =>
  state.datasets && state.datasets.layerLoadingStatus;

const selectDatasetParams = (state) => state.datasets?.params;
const selectCogUrls = (state) => state.datasets?.cogUrls || {};
const selectMapPrinting = (state) => state.map && state.map?.settings?.printing;
const getMainMapSettings = (state) => state.mainMap || {};
export const getBasemaps = (state) => state.config?.basemaps || {};
const selectBoundaryBounds = (state) => state.config?.bounds || [];
const getVectorLayerIcons = (state) => state.config?.vectorLayerIcons || [];
const getSvgById = (state) => state.config?.svgById || {};

// CONSTS
export const getMapSettings = (state) => state.map?.settings || {};

// SELECTORS
export const getMapViewport = createSelector([getMapSettings], (settings) => {
  const { zoom, bearing, pitch, center } = settings;

  return {
    zoom,
    bearing,
    pitch,
    latitude: center?.lat,
    longitude: center?.lng,
    transitionDuration: 500,
  };
});

export const getDatasetMetadata = (state) => state.datasets?.meta;
export const getLatestMetadata = (state) => state?.latest?.data;

export const getMapLatLng = createSelector(
  [getMapSettings],
  (settings) => settings.center
);

export const getMapZoom = createSelector(
  [getMapSettings],
  (settings) => settings.zoom
);

export const getMapMinZoom = createSelector(
  [getMapSettings],
  (settings) => settings.minZoom
);

export const getMapMaxZoom = createSelector(
  [getMapSettings],
  (settings) => settings.maxZoom
);

export const getMapBounds = createSelector(
  [getMapSettings],
  (settings) => settings.mapBounds
);

export const getBasemapFromState = createSelector(
  getMapSettings,
  (settings) => settings.basemap
);

export const getDefaultApiBaseMap = createSelector(
  [getBasemaps],
  (apiBaseMaps) =>
    apiBaseMaps && Object.values(apiBaseMaps).find((b) => b.default)
);

export const getBasemap = createSelector(
  [getBasemapFromState, getLocation, getBasemaps],
  (basemapState, location, basemaps) => {
    const isDashboard = location.pathname.includes("/dashboards/");

    let basemap = {
      ...basemaps[basemapState?.value],
      ...basemapState,
    };

    if (isDashboard && basemapState.value !== "default") {
      basemap = basemaps.default;
    }

    let url = basemap && basemap.url;
    if (url) {
      Object.keys(basemap).forEach((key) => {
        if (url.includes(`{${key}}`)) {
          url = url.replace(`{${key}}`, basemap[key]);
        }
      });
    }
    return {
      ...basemap,
      ...(url && { url }),
    };
  }
);

export const getMapStyle = createSelector(
  getBasemap,
  (basemap) => basemap?.mapStyle
);

export const getMapLabels = createSelector(
  getMapSettings,
  (settings) => settings.labels
);

export const getMapRoads = createSelector(
  getMapSettings,
  (settings) => settings.roads
);

export const getDrawing = createSelector(
  [getMapSettings],
  (settings) => settings.drawing
);

export const getComparing = createSelector(
  [getMapSettings, getLocation],
  (settings, location) => {
    const isMapPage = location.pathname.includes("mapviewer");

    const { type } = location?.payload || {};

    return settings.comparing && isMapPage && !type;
  }
);

export const getActiveCompareSide = createSelector(
  [getMapSettings],
  (settings) => settings.activeCompareSide
);

export const getDrawingMode = createSelector(
  [getMapSettings],
  (settings) => settings.drawingMode
);

export const getCanBound = createSelector(
  getMapSettings,
  (settings) => settings.canBound
);

export const getGeostoreBbox = createSelector(
  [selectGeostore],
  (geostore) => geostore && geostore.bbox
);

export const getStateBbox = createSelector(
  [getMapSettings],
  (settings) => settings && settings.bbox
);

export const getGeostoreType = createSelector([selectGeostore], (geostore) => {
  const feature =
    geostore.geojson &&
    geostore.geojson.features &&
    geostore.geojson.features[0];

  if (feature) {
    return feature.geometry.type;
  }

  return null;
});

const someDataLayerLoading = createSelector(
  [selectLayersLoadingStatus],
  (layerLoadingStatus) => {
    const loading = Object.keys(layerLoadingStatus)
      .map((k) => {
        return { layer: k, loading: layerLoadingStatus[k] };
      })
      .some((item) => item.loading);

    return loading;
  }
);

export const getMapLoading = createSelector(
  [
    selectMapLoading,
    selectGeostoreLoading,
    selectDatasetsLoading,
    someDataLayerLoading,
  ],
  (
    mapLoading,
    geostoreLoading,
    datasetsLoading,
    recentLoading,
    someLayerLoading
  ) => {
    return (
      mapLoading ||
      geostoreLoading ||
      datasetsLoading ||
      recentLoading ||
      someLayerLoading
    );
  }
);

export const getLoadingMessage = createSelector(
  [someDataLayerLoading],
  (someLayerLoading) => {
    if (someLayerLoading) return "Fetching data...";
    return "";
  }
);

export const getActiveDatasetsFromState = createSelector(
  getMapSettings,
  (settings) => {
    return settings?.datasets || [];
  }
);

export const getActiveDatasetIds = createSelector(
  [getActiveDatasetsFromState],
  (activeDatasetsState) => {
    if (!activeDatasetsState || !activeDatasetsState.length) return null;
    return activeDatasetsState?.map((l) => l.dataset);
  }
);

export const getActiveDatasets = createSelector(
  [selectDatasets, getActiveDatasetIds],
  (datasets, datasetIds) => {
    if (isEmpty(datasets) || isEmpty(datasetIds)) return null;
    return datasets.filter((d) => datasetIds.includes(d.id));
  }
);

// parse active datasets to add config from url
export const getDatasetsWithConfig = createSelector(
  [getActiveDatasets, getActiveDatasetsFromState],
  (datasets, activeDatasetsState) => {
    if (isEmpty(datasets) || isEmpty(activeDatasetsState)) return null;

    return datasets.map((d) => {
      const layerConfig =
        activeDatasetsState.find((l) => l.dataset === d.id) || {};

      const {
        layers,
        params,
        visibility,
        opacity,
        bbox,
        summary = null,
        layerFilterParams,
        mapSide,
        settings = {},
      } = layerConfig || {};

      return {
        ...d,
        ...layerConfig,
        ...(d.selectorLayerConfig && {
          selectorLayerConfig: {
            ...d.selectorLayerConfig,
            selected: d.selectorLayerConfig.options.find(
              (l) => l.value === layers[0]
            ),
          },
        }),
        layers: d.layers.map((l) => {
          const layerParams = {
            ...l.params,
          };

          return {
            ...l,
            visibility,
            opacity,
            bbox,
            summary,
            mapSide,
            color: d.color,
            active: layers && layers.length && layers.includes(l.id),
            ...(!isEmpty(layerParams) && {
              params: {
                ...layerParams,
                ...params,
              },
            }),
            ...(!isEmpty(l.layerFilterParams) && {
              layerFilterParams: {
                ...l.layerFilterParams,
                ...layerFilterParams,
              },
            }),
            ...(!isEmpty(settings) && {
              settings: {
                ...settings,
              },
            }),
          };
        }),
      };
    });
  }
);

// map active datasets into correct order based on url state (drag and drop)
export const getLayerGroups = createSelector(
  [getDatasetsWithConfig, getActiveDatasetsFromState],
  (datasets, activeDatasetsState) => {
    if (isEmpty(datasets) || isEmpty(activeDatasetsState)) return null;

    const layerGroups = uniqBy(
      activeDatasetsState
        .map((layer) => {
          const dataset = datasets.find((d) => d.id === layer.dataset);

          const { metadata } =
            (dataset && dataset.layers.find((l) => l.active)) || {};
          const newMetadata = metadata || (dataset && dataset.metadata);

          return {
            ...dataset,
            ...(dataset && { mapSide: layer.mapSide }),
            ...(newMetadata && {
              metadata: newMetadata,
            }),
          };
        })
        .filter((d) => !isEmpty(d)),
      "id"
    );

    return layerGroups;
  }
);

// flatten datasets into layers for the layer manager
export const getLayersFlattened = createSelector(
  getLayerGroups,
  (layerGroups) => {
    if (isEmpty(layerGroups)) return null;

    return sortBy(
      flatten(layerGroups.map((d) => d.layers))
        .filter((l) => l && l.active && (!l.isRecentImagery || l.params.url))
        .map((l, i) => {
          let zIndex = 1000 - i;
          if (l.isRecentImagery) zIndex = 500;
          if (l.isBoundary) zIndex = 1050 - i;
          return {
            ...l,
            zIndex,
            ...(l.isRecentImagery && {
              id: l.params.url,
            }),
          };
        }),
      "zIndex"
    );
  }
);

export const getLayersWithData = createSelector(
  [
    getLayersFlattened,
    selectLayersGeojsonData,
    selectLayersUpdatingStatus,
    selectLayersLoadingStatus,
  ],
  (layers, geojsonData, layersUpdatingStatus, layersLoadingStatus) => {
    if (isEmpty(layers)) return null;

    return layers.map((l) => {
      const layerConfig = { ...l.layerConfig };

      if (geojsonData[l.id]) {
        layerConfig.source = {
          ...layerConfig.source,
          data: geojsonData[l.id],
        };
      }

      if (defined(layersUpdatingStatus[l.id])) {
        l.isUpdating = layersUpdatingStatus[l.id];
      }

      if (defined(layersLoadingStatus[l.id])) {
        l.isLoading = layersLoadingStatus[l.id];
      }

      return { ...l, layerConfig: layerConfig };
    });
  }
);

export const getLayersWithParams = createSelector(
  [getLayersWithData, selectDatasetParams, selectGeostore],
  (layers, datasetParams, geostore) => {
    if (isEmpty(layers)) return null;

    return layers.map((l) => {
      const layer = { ...l };

      if (
        layer.dataset &&
        !isEmpty(datasetParams) &&
        datasetParams[layer.dataset] &&
        !isEmpty(datasetParams[layer.dataset])
      ) {
        layer.params = {
          ...layer.params,
          ...datasetParams[layer.dataset],
        };
      }
      return layer;
    });
  }
);

export const getLayersWithSettingsParams = createSelector(
  [getLayersWithParams, selectGeostore],
  (layers, geostore) => {
    if (isEmpty(layers)) return null;

    return layers.map((l) => {
      const layer = { ...l };

      const { settings = {}, canClip } = layer;
      const settingsParams = {};

      if (canClip) {
        if (settings.clippingActive && geostore && geostore.id) {
          settingsParams["geostore_id"] = geostore.id;
        } else {
          settingsParams["geostore_id"] = "";
        }
      }

      if (layer.dataset && !isEmpty(settingsParams)) {
        layer.params = {
          ...layer.params,
          ...settingsParams,
        };
      }
      return layer;
    });
  }
);

// Rewrite raster_cog layers to use a `cog://` raster source for the current
// selected time. Coloring is handled client-side by setColorFunction, so the
// render layer stays a vanilla raster layer with no special paint.
// 1x1 transparent PNG used as a placeholder tile while we wait for the COG
// TileJSON fetch to resolve. An empty `tiles: []` crashes maplibre in
// production (tiles[NaN].replace(...) during the first render); a no-op data
// URL keeps the source valid and inert until the real cog:// URL lands.
const COG_PLACEHOLDER_TILE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";

export const getLayersWithCogSource = createSelector(
  [getLayersWithSettingsParams, selectCogUrls],
  (layers, cogUrls) => {
    if (isEmpty(layers)) return layers;

    return layers.map((l) => {
      if (l.layerType !== "raster_cog") return l;

      const urlsMap = cogUrls[l.id] || {};
      const selectedTime = l?.params?.time;
      const cogUrl =
        (selectedTime && urlsMap[selectedTime]) ||
        Object.values(urlsMap)[0] ||
        null;

      const source = cogUrl
        ? {
            type: "raster",
            url: `cog://${cogUrl}`,
            tileSize: 256,
          }
        : {
            type: "raster",
            tiles: [COG_PLACEHOLDER_TILE],
            tileSize: 256,
          };

      return {
        ...l,
        layerConfig: {
          ...l.layerConfig,
          type: "raster",
          source,
        },
      };
    });
  }
);

// flatten datasets into layers for the layer manager
export const getAllLayers = createSelector(
  getLayersWithCogSource,
  (layers) => {
    if (isEmpty(layers)) return null;

    return layers;
  }
);

// all layers for importing by other components
export const getActiveLayers = createSelector(
  [getAllLayers, selectGeostore, selectLocation, getActiveArea],
  (layers, geostore, location, activeArea) => {
    if (isEmpty(layers)) return [];

    const hasClickedPoint =
      location.type === "point" && location.adm0 && location.adm1;

    if (!hasClickedPoint) {
      if (!geostore || !geostore.id) return layers;

      const { type, adm0 } = location || {};
      const isAoI = type === "aoi" && adm0;

      const geojson = {
        ...geostore.geojson,
        ...(activeArea && {
          features: [
            {
              ...geostore.geojson.features?.[0],
              properties: activeArea,
            },
          ],
        }),
      };

      const parsedLayers = layers.concat({
        id: geostore.id,
        name: isAoI ? "Area of Interest" : "Geojson",
        config: {
          type: "geojson",
          source: {
            data: geojson,
            type: "geojson",
          },
          render: {
            layers: [
              {
                type: "fill",
                paint: {
                  "fill-color": "transparent",
                },
              },
              {
                type: "line",
                paint: {
                  "line-color": "#C0FF24",
                  "line-width": isAoI ? 2 : 1,
                  "line-offset": isAoI ? 1.5 : 0,
                },
              },
              {
                type: "line",
                paint: {
                  "line-color": "#000",
                  "line-width": 1.5,
                },
                metadata: {
                  position: "top",
                },
              },
            ],
          },
        },
        ...(isAoI && {
          interactionConfig: {
            output: [],
          },
        }),
        zIndex: 1060,
      });

      return parsedLayers;
    }

    const { adm0, adm1 } = location || {};

    const point = {
      type: "Feature",
      id: "clicked-point",
      geometry: {
        type: "Point",
        coordinates: [adm1, adm0],
      },
      properties: {},
    };

    const geojson = {
      ...point,
    };

    return layers.concat({
      id: geojson.id,
      name: "Geojson",
      layerConfig: {
        type: "geojson",
        source: {
          data: geojson,
          type: "geojson",
        },
        render: {
          layers: [
            {
              type: "circle",
              paint: {
                "circle-color": "#fff",
                "circle-radius": 8,
                "circle-stroke-width": 4,
                "circle-stroke-color": "#4e8ecb",
              },
              metadata: {
                position: "top",
              },
            },
          ],
        },
      },
    });
  }
);

export const getInteractiveLayerIds = createSelector(
  getActiveLayers,
  (layers) => {
    if (isEmpty(layers)) return [];

    const interactiveLayers = layers.filter(
      (l) =>
        !isEmpty(l.interactionConfig) &&
        l.layerConfig &&
        l.layerConfig.render &&
        l.layerConfig.render.layers
    );

    return flatMap(
      interactiveLayers.reduce((arr, layer) => {
        const clickableLayers =
          layer.layerConfig.render && layer.layerConfig.render.layers;

        return [
          ...arr,
          clickableLayers.map((l, i) => `${layer.id}-${l.type}-${i}`),
        ];
      }, [])
    );
  }
);

export const getHoverableLayerIds = createSelector(
  getActiveLayers,
  (layers) => {
    if (isEmpty(layers)) return [];

    const hoverableLayers = layers.filter(
      (l) =>
        !isEmpty(l.hoverInteractionConfig) &&
        l.layerConfig &&
        l.layerConfig.render &&
        l.layerConfig.render.layers
    );

    return flatMap(
      hoverableLayers.reduce((arr, layer) => {
        const hoverLayers =
          layer.layerConfig.render &&
          layer.layerConfig.render.layers
            .map((l, i) => ({ ...l, pIndex: i }))
            .filter((l) => l.metadata && l.metadata.hoverable);

        return [
          ...arr,
          hoverLayers.map((l, i) => `${layer.id}-${l.type}-${l.pIndex}`),
        ];
      }, [])
    );
  }
);

export const getInteractionsState = createSelector(
  [selectMapData],
  (mapData) => mapData && mapData.interactions
);

export const getInteractionsLatLng = createSelector(
  [getInteractionsState],
  (interactionData) => interactionData && interactionData.latlng
);

export const getInteractionsData = createSelector(
  [getInteractionsState],
  (interactionData) => interactionData && interactionData.interactions
);

export const getInteractionSelectedId = createSelector(
  [getInteractionsState],
  (interactionData) => {
    return interactionData && interactionData.selected;
  }
);

export const getInteractions = createSelector(
  [getInteractionsData, getActiveLayers],
  (interactions, activeLayers) => {
    if (isEmpty(interactions)) return null;

    const interactiveLayers = activeLayers.filter(
      (l) =>
        !isEmpty(l.interactionConfig) &&
        ((l.layerConfig &&
          l.layerConfig.render &&
          l.layerConfig.render.layers) ||
          l.interactionConfig.type === "wmsGetFeatureInfo")
    );

    return Object.keys(interactions).reduce((all, layerId) => {
      const layer = interactiveLayers.find((l) => l.id === layerId);

      if (layer) {
        const { data, ...interaction } = interactions?.[layerId] || {};

        all.push({
          ...interaction,
          data: {
            ...data,
            ...data?.properties,
          },
          layer,
        });
      }

      return all;
    }, []);
  }
);

export const getInteractionSelected = createSelector(
  [getInteractions, getInteractionSelectedId, getActiveLayers],
  (interactions, selected, layers) => {
    if (isEmpty(interactions)) return null;

    const layersWithoutBoundaries = layers.filter(
      (l) => !l.isBoundary && !isEmpty(l.interactionConfig)
    );

    const layersWithoutBoundariesIds =
      layersWithoutBoundaries &&
      layersWithoutBoundaries.length &&
      layersWithoutBoundaries.map((l) => l.id);

    // if there is an article (icon layer) then choose that
    let selectedData = interactions.find((o) => o.data.cluster);
    selectedData = interactions.find((o) => o.article);

    // if there is nothing selected get the top layer
    if (!selected && !!layersWithoutBoundaries.length) {
      selectedData = interactions.find(
        (o) => o.layer && layersWithoutBoundariesIds.includes(o.layer.id)
      );
    }

    // if only one layer then get that
    if (!selectedData && interactions.length === 1) {
      [selectedData] = interactions;
    }

    // otherwise get based on selected
    if (!selectedData) {
      selectedData = interactions.find(
        (o) => o.layer && o.layer.id === selected
      );
    }

    return selectedData;
  }
);

export const getActiveMapLang = createSelector(selectActiveLang, (lang) =>
  getMapboxLang(lang)
);

export const getPrintRequests = createSelector(
  getMainMapSettings,
  (settings) => settings.printRequests
);

export const getMapProps = createStructuredSelector({
  viewport: getMapViewport,
  loading: getMapLoading,
  loadingMessage: getLoadingMessage,
  minZoom: getMapMinZoom,
  maxZoom: getMapMaxZoom,
  mapBounds: getMapBounds,
  boundaryBounds: selectBoundaryBounds,
  mapStyle: getMapStyle,
  mapLabels: getMapLabels,
  mapRoads: getMapRoads,
  drawing: getDrawing,
  drawingMode: getDrawingMode,
  comparing: getComparing,
  canBound: getCanBound,
  geostoreBbox: getGeostoreBbox,
  geostoreType: getGeostoreType,
  stateBbox: getStateBbox,
  interaction: getInteractionSelected,
  interactiveLayerIds: getInteractiveLayerIds,
  hoverableLayerIds: getHoverableLayerIds,
  activeLayers: getActiveLayers,
  basemap: getBasemap,
  lang: getActiveMapLang,
  location: selectLocation,
  hasHoverFeature: selectHoverFeature,
  printRequests: getPrintRequests,
  mapPrinting: selectMapPrinting,
  vectorLayerIcons: getVectorLayerIcons,
  svgById: getSvgById,
});
