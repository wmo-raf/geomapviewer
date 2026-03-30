import findIndex from "lodash/findIndex";
import * as actions from "./actions";

export const initialState = {
  loading: true,
  error: false,
  meta: null,
  data: [],
  layerUpdatingStatus: {},
  layerLoadingStatus: {},
  timestamps: {},
  layerLegends: {},
  params: {},
  geojsonData: {},
};

const setDatasetsLoading = (state, { payload }) => ({
  ...state,
  ...payload,
});

const setDatasets = (state, { payload }) => ({
  ...state,
  data: payload,
  loading: false,
});

const updateDatasets = (state, { payload }) => {
  const newDatasets = [...payload];

  const { data: datasets } = state;

  const data = [...datasets];

  for (let i = 0; i < newDatasets.length; i++) {
    const dataset = newDatasets[i];

    const index = findIndex(datasets, ["id", dataset.id]);

    if (index > -1) {
      data.splice(index, 1, dataset); // substitution
    } else {
      data.push(dataset); // addition
    }
  }

  return {
    ...state,
    data,
  };
};

const removeDataset = (state, { payload }) => {
  const datasetToRemove = { ...payload };

  const { data: datasets } = state;

  const data = [...datasets];

  const index = findIndex(datasets, ["id", datasetToRemove.id]);

  if (index > -1) {
    data.splice(index, 1); // remove from array
  }

  return {
    ...state,
    data,
  };
};

const setLayerUpdatingStatus = (state, { payload }) => ({
  ...state,
  layerUpdatingStatus: { ...state.layerUpdatingStatus, ...payload },
});

const setLayerLoadingStatus = (state, { payload }) => ({
  ...state,
  layerLoadingStatus: { ...state.layerLoadingStatus, ...payload },
});

const setTimestamps = (state, { payload }) => ({
  ...state,
  timestamps: { ...state.timestamps, ...payload },
});

const setLayerLegend = (state, { payload }) => ({
  ...state,
  layerLegends: { ...state.layerLegends, ...payload },
});

const setDatasetParams = (state, { payload }) => {
  const { dataset, params } = payload;

  if (dataset) {
    if (state.params[dataset]) {
      const dParams = { ...state.params[dataset] };
      const newDParams = { ...dParams, ...params };

      return {
        ...state,
        params: { ...state.params, [dataset]: newDParams },
      };
    } else {
      return {
        ...state,
        params: { ...state.params, [dataset]: { ...params } },
      };
    }
  }

  return {
    ...state,
    params: { ...state.params },
  };
};

const setGeojsonData = (state, { payload }) => ({
  ...state,
  geojsonData: { ...state.geojsonData, ...payload },
});

export default {
  [actions.setDatasets]: setDatasets,
  [actions.setDatasetsLoading]: setDatasetsLoading,
  [actions.updateDatasets]: updateDatasets,
  [actions.removeDataset]: removeDataset,
  [actions.setTimestamps]: setTimestamps,
  [actions.setLayerLegend]: setLayerLegend,
  [actions.setDatasetParams]: setDatasetParams,
  [actions.setGeojsonData]: setGeojsonData,
  [actions.setLayerUpdatingStatus]: setLayerUpdatingStatus,
  [actions.setLayerLoadingStatus]: setLayerLoadingStatus,
};
