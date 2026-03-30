import { createAction, createThunkAction } from "@/redux/actions";

import { setMapSettings } from "@/components/map/actions";
import { getApiDatasets } from "@/services/datasets";

import { getTimeseriesConfig } from "./utils";

export const setDatasetsLoading = createAction("setDatasetsLoading");
export const setDatasets = createAction("setDatasets");
export const updateDatasets = createAction("updateDatasets");
export const removeDataset = createAction("removeDataset");

export const setLayerUpdatingStatus = createAction("setLayerUpdatingStatus");
export const setLayerLoadingStatus = createAction("setLayerLoadingStatus");
export const setGeojsonData = createAction("setGeojsonData");
export const setTimestamps = createAction("setTimestamps");
export const setLayerLegend = createAction("setLayerLegend");
export const setDatasetParams = createAction("setDatasetParams");

export const fetchDatasets = createThunkAction(
  "fetchDatasets",
  (activeDatasets) => (dispatch, getState) => {
    dispatch(setDatasetsLoading({ loading: true, error: false }));

    const currentActiveDatasets = [...activeDatasets];

    getApiDatasets()
      .then((apiDatasets) => {
        const initialVisibleDatasets = apiDatasets.filter(
          (d) => d.initialVisible
        );

        const datasetsWithAnalysis = apiDatasets.reduce(
          (allDatasets, dataset) => {
            const layers = dataset.layers.reduce((dLayers, layer) => {
              if (
                layer.analysisConfig &&
                (layer.analysisConfig.pointTimeseriesAnalysis ||
                  layer.analysisConfig.areaTimeseriesAnalysis)
              ) {
                // mark as has analysis
                layer.hasTimeseriesAnalysis = true;

                if (layer.layerType === "raster_file") {
                  if (layer.analysisConfig.pointTimeseriesAnalysis) {
                    layer.analysisConfig.pointTimeseriesAnalysis.config =
                      getTimeseriesConfig(layer, "point");
                  }

                  if (layer.analysisConfig.areaTimeseriesAnalysis) {
                    layer.analysisConfig.areaTimeseriesAnalysis.config =
                      getTimeseriesConfig(layer, "area");
                  }
                }
              }
              dLayers.push(layer);
              return dLayers;
            }, []);

            dataset.layers = layers;

            allDatasets.push(dataset);

            return allDatasets;
          },
          []
        );

        const { query } = getState().location;

        const hasDatasetsInUrlState =
          query &&
          query.map &&
          query.map.datasets &&
          !!query.map.datasets.length;

        // set default visible datasets when no datasets in map url state
        if (!hasDatasetsInUrlState && !!initialVisibleDatasets.length) {
          const newDatasets = [...currentActiveDatasets].concat(
            initialVisibleDatasets.reduce((all, dataset) => {
              const config = {
                dataset: dataset.id,
                layers: dataset.layers.map((l) => l.id),
                opacity: 1,
                visibility: true,
              };
              all.push(config);
              return all;
            }, [])
          );

          // set new active Datasets
          dispatch(setMapSettings({ datasets: newDatasets }));
        }

        dispatch(updateDatasets(datasetsWithAnalysis));
        dispatch(setDatasetsLoading({ loading: false, error: false }));
      })
      .catch((err) => {
        dispatch(setDatasetsLoading({ loading: false, error: true }));
      });
  }
);
