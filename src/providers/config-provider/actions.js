import { createAction, createThunkAction } from "@/redux/actions";
import { getConfig } from "@/services/config";

export const setConfigLoading = createAction("setConfigLoading");
export const setConfig = createAction("setConfig");
export const setSubCategorySettings = createAction("setSubCategorySettings");

export const fetchConfig = createThunkAction(
  "fetchConfig",
  () => async (dispatch) => {
    dispatch(setConfigLoading({ loading: true, error: false }));

    try {
      const config = await getConfig();
      const {
        categories,
        basemaps,
        countries,
        logo,
        bounds,
        boundaryDataSource,
        vectorLayerIcons,
        links,
        disclaimerText,
        enableMyAccount,
        allowSignups,
        navigation,
        capConfig,
      } = config;

      const sections = categories
        .filter((c) => c.active)
        .map((s) => ({
          label: "layers",
          slug: "datasets",
          category: s.title,
          id: s.id,
          icon: s.icon,
          subCategories: s.sub_categories
            .filter((s_1) => s_1.active)
            .map((subcat) => ({
              ...subcat,
              id: subcat.id,
              title: subcat.title,
              slug: subcat.id,
            })),
        }));

      const appConfig = {
        logo,
        countries,
        boundaryDataSource,
        vectorLayerIcons,
        bounds,
        links,
        disclaimerText,
        enableMyAccount,
        allowSignups,
        navigation: navigation || [],
        capConfig: capConfig || null,
        sections: sections,
        basemaps: basemaps.reduce((all, item) => {
          item.value = item.label;
          all[item.label] = item;
          return all;
        }, {}),
      };

      dispatch(setConfig(appConfig));

      return appConfig;
    } catch (err) {
      dispatch(setConfigLoading({ loading: false, error: true }));
    }
  }
);
