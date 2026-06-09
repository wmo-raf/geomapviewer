import { connect } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import sortBy from "lodash/sortBy";

import { handleClickLocation } from "@/components/map-menu/actions";
import { setMenuSettings } from "@/components/map-menu/actions";
import {
  setMapSettings,
  setMapInteractions,
} from "@/components/map/actions";
import { setModalMetaSettings } from "@/components/modals/meta/actions";
import { getActiveDatasetsFromState } from "@/components/map/selectors";
import { selectConfigBounds } from "@/providers/config-provider/selectors";
import { selectActiveLang, translateText } from "@/utils/lang";

import Component from "./component";

const selectDatasets = (state) => state.datasets && state.datasets.data;

const getDatasetsWithActive = createSelector(
  [selectDatasets, getActiveDatasetsFromState, selectActiveLang],
  (datasets, activeDatasetsState, lang) => {
    if (!datasets) return [];
    const activeIds = (activeDatasetsState || []).map((d) => d.dataset);
    return sortBy(
      datasets.map((d) => ({
        ...d,
        active: activeIds.includes(d.id),
        localeName: lang === "en" ? d.name : translateText(d.name),
      })),
      ["name", "localeName"]
    );
  }
);

const mapStateToProps = createStructuredSelector({
  datasets: getDatasetsWithActive,
  lang: selectActiveLang,
  activeDatasets: getActiveDatasetsFromState,
  bounds: selectConfigBounds,
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { dispatch } = dispatchProps;
  const { activeDatasets, ...restState } = stateProps;

  return {
    ...ownProps,
    ...restState,
    handleClickLocation: (loc) => dispatch(handleClickLocation(loc)),
    handleClickCoordinate: ({ lat, lng }) => {
      dispatch(setMapSettings({ center: { lat, lng }, zoom: 12 }));
      dispatch(setMapInteractions({ features: [], lngLat: [lng, lat] }));
      dispatch(setMenuSettings({ menuSection: "" }));
    },
    onToggleDataset: ({ dataset, layer }, enable) => {
      const current = activeDatasets || [];

      const next = enable
        ? [
            {
              dataset,
              opacity: 1,
              visibility: true,
              layers: [layer],
            },
            ...current.filter((l) => l.dataset !== dataset),
          ]
        : current.filter((l) => l.dataset !== dataset);

      dispatch(
        setMapSettings({
          datasets: next,
          ...(enable && { canBound: true }),
        })
      );
    },
    onInfoClick: (metadata) => dispatch(setModalMetaSettings(metadata)),
  };
};

export default connect(mapStateToProps, null, mergeProps)(Component);
