import { createSelector, createStructuredSelector } from "reselect";
import isEmpty from "lodash/isEmpty";
import startCase from "lodash/startCase";

import {
  getActiveDatasetsFromState,
  getLayerGroups,
  getMapZoom,
  getActiveCompareSide,
  getComparing,
  selectGeostore,
} from "@/components/map/selectors";

import { getEmbed } from "@/layouts/map/selectors";

import { mobileSections } from "./sections";
import Datasets from "./components/sections/datasets";
import icons from "./icons";

const getMenuSettings = (state) => state.mapMenu?.settings || {};
const getLoading = (state) =>
  (state.datasets && state.datasets.loading) ||
  (state.countryData && state.countryData.loading);
const getAnalysisLoading = (state) => state.analysis && state.analysis.loading;
const getDatasets = (state) => state.datasets && state.datasets.data;
const getLocation = (state) => state.location && state.location.payload;
const getApiSections = (state) => (state.config && state.config.sections) || [];
export const selectmapLocationGeostore = (state) =>
  state.geostore && state.geostore.mapLocationGeostore;
const selectLoggedIn = (state) => state.auth?.data?.loggedIn;

export const getMenuSection = createSelector(
  [getMenuSettings],
  (settings) => settings.menuSection
);

export const getSubCategoryGroupsSelected = createSelector(
  [getMenuSettings],
  (settings) => settings.subCategoryGroupsSelected
);

export const getDatasetCategory = createSelector(
  [getMenuSettings],
  (settings) => settings.datasetCategory
);

export const getExploreType = createSelector(
  [getMenuSettings],
  (settings) => settings.exploreType
);

// build datasets with available countries data
export const getDatasetSections = createSelector(
  [getApiSections, getDatasets, selectLoggedIn],
  (apiSections, allDatasets, loggedIn) => {
    const sections = apiSections.map((section) => ({
      ...section,
      icon: icons[section.icon] ? icons[section.icon] : { id: section.icon },
      Component: Datasets,
    }));

    if (isEmpty(allDatasets)) return sections;

    let datasets = allDatasets;

    // show only public datasets if not logged in
    if (!loggedIn) {
      datasets = allDatasets.filter((d) => d.public);
    }

    // loop thru each section
    return (
      sections &&
      sections.map((s) => {
        // get the section id (category) and the subcategories under the section e.g (rainfall) and
        // (rainfallForecast, extremeRainfall)
        const { id, subCategories } = s;

        // get all datasets that belong to this specific section e.g datasets under rainfall.
        // datasets with no matching category will not appear henceforth
        const sectionDatasets =
          datasets && datasets.filter((d) => d.category === id);

        let subCategoriesWithDatasets = [];

        if (subCategories) {
          // loop thru each subcategory
          subCategoriesWithDatasets = subCategories.map((subCat) => ({
            ...subCat,
            // get datasets that have this subcategory's slug (id).
            // This filters subcategories to ensure we only show subcategories that actually have data.
            // Datasets with no matching subcategory slug will not appear henceforth
            datasets:
              sectionDatasets &&
              sectionDatasets.filter((d) => d.sub_category === subCat.id),
          }));
        }

        return {
          ...s,
          datasets: sectionDatasets,
          subCategories: subCategoriesWithDatasets,
        };
      })
    );
  }
);

export const getDatasetSectionsWithData = createSelector(
  [
    getDatasetSections,
    getActiveDatasetsFromState,
    getDatasetCategory,
    getMenuSection,
  ],
  (sections, activeDatasets, datasetCategory, menuSection) => {
    if (!activeDatasets) return sections;
    const datasetIds = activeDatasets.map((d) => d.dataset);

    return (
      (sections &&
        sections.length &&
        sections.map((s) => {
          const { datasets, subCategories } = s;

          return {
            ...s,
            active: datasetCategory === s.category && menuSection === s.slug,
            layerCount:
              datasets &&
              datasets.filter(
                (d) => activeDatasets && datasetIds.includes(d.id)
              ).length,
            datasets:
              datasets &&
              datasets.map((d) => ({
                ...d,
                active: datasetIds.includes(d.id),
              })),
            subCategories:
              subCategories &&
              subCategories.map((subCat) => ({
                ...subCat,
                datasets:
                  subCat.datasets &&
                  subCat.datasets.map((d) => ({
                    ...d,
                    active: datasetIds.includes(d.id),
                  })),
              })),
          };
        })) ||
      []
    );
  }
);

export const getAllSections = createSelector(
  [getDatasetSectionsWithData],
  (datasetSections) => {
    if (!datasetSections) return null;

    return datasetSections.concat(mobileSections);
  }
);

export const getActiveSection = createSelector(
  [getAllSections, getMenuSection, getDatasetCategory],
  (sections, menuSection, datasetCategory) => {
    if (!sections || !menuSection) return null;

    return sections.find((s) =>
      s.category
        ? s.category === datasetCategory && s.slug === menuSection
        : s.slug === menuSection
    );
  }
);

export const getActiveSectionWithData = createSelector(
  [getActiveSection],
  (section) => {
    if (!section) return null;

    const subCatsWithData =
      section.subCategories &&
      section.subCategories.filter((s) => !isEmpty(s.datasets));

    return {
      ...section,
      ...(!isEmpty(subCatsWithData) && {
        subCategories: subCatsWithData,
      }),
    };
  }
);

const getLegendLayerGroups = createSelector([getLayerGroups], (groups) => {
  if (!groups) return null;
  return groups.filter(
    (g) => !g.isBoundary && !g.isRecentImagery && !g.isLiveImagery
  );
});

export const getMobileSections = createSelector(
  [getMenuSection, getLegendLayerGroups, getLocation, getEmbed],
  (menuSection, activeDatasets, location, embed) =>
    mobileSections
      .filter((s) => !embed || s.embed)
      .map((s) => ({
        ...s,
        ...(s.slug === "datasets" && {
          layerCount: activeDatasets && activeDatasets.length,
        }),
        ...(s.slug === "analysis" && {
          highlight: location && !!location.type && !!location.adm0,
        }),
        active: menuSection === s.slug,
      }))
);

export const getDatasetCategories = createSelector(
  [getDatasetSectionsWithData],
  (datasets) =>
    datasets &&
    datasets.map((s) => ({
      ...s,
      label: startCase(s.category),
    }))
);

export const getMenuProps = createStructuredSelector({
  datasetSections: getDatasetSectionsWithData,
  mobileSections: getMobileSections,
  activeSection: getActiveSectionWithData,
  menuSection: getMenuSection,
  activeDatasets: getActiveDatasetsFromState,
  datasetCategory: getDatasetCategory,
  datasetCategories: getDatasetCategories,
  location: getLocation,
  loading: getLoading,
  analysisLoading: getAnalysisLoading,
  zoom: getMapZoom,
  comparing: getComparing,
  activeCompareSide: getActiveCompareSide,
  geostore: selectGeostore,
  mapLocationGeostore: selectmapLocationGeostore,
  allDatasets: getDatasets,
  subCategoryGroupsSelected: getSubCategoryGroupsSelected,
  loggedIn: selectLoggedIn,
});
