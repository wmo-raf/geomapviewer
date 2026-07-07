import findIndex from "lodash/findIndex";
import * as actions from "./actions";

export const initialState = {
  loading: true,
  error: false,
  sections: [],
  basemaps: {},
  bounds: null,
  boundaryDataSource: "",
  vectorLayerIcons: [],
  logo: {},
  countries: [],
  links: {},
  navigation: [],
  disclaimerText: "",
  enableMyAccount: false,
  allowSignups: false,
  capConfig: null,
};

const setConfigLoading = (state, { payload }) => ({
  ...state,
  ...payload,
});

const setConfig = (state, { payload }) => ({
  ...state,
  ...payload,
  loading: false,
});

const setSubCategorySettings = (state, { payload }) => {
  const { sections: dataSections } = state;

  const sectionIndex = findIndex(dataSections, ["id", payload.sectionId]);

  const sections = [...dataSections];

  if (sectionIndex > -1) {
    const subCategories = [...sections[sectionIndex].subCategories];

    if (subCategories) {
      const subCatIndex = findIndex(subCategories, [
        "id",
        payload.subCategoryId,
      ]);

      if (subCatIndex > -1) {
        const subCategory = subCategories[subCatIndex];

        subCategories.splice(subCatIndex, 1, {
          ...subCategory,
          ...payload.settings,
        });

        sections.splice(sectionIndex, 1, {
          ...sections[sectionIndex],
          subCategories: subCategories,
        });
      }
    }
  }

  return {
    ...state,
    sections: sections,
  };
};

export default {
  [actions.setConfigLoading]: setConfigLoading,
  [actions.setConfig]: setConfig,
  [actions.setSubCategorySettings]: setSubCategorySettings,
};
