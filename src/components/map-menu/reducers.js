import * as actions from "./actions";

export const initialState = {
  loading: false,
  settings: {
    menuSection: "",
    datasetCategory: "",
    exploreType: "topics",
    myHWType: "myAOI",
    selectedCountries: [],
    subCategoryGroupsSelected: {},
  },
};

const setMenuSettings = (state, { payload }) => ({
  ...state,
  settings: {
    ...state.settings,
    ...payload,
  },
});

const setMenuLoading = (state, { payload }) => ({
  ...state,
  loading: payload,
});

export default {
  [actions.setMenuSettings]: setMenuSettings,
  [actions.setMenuLoading]: setMenuLoading,
};
