import { connect } from "react-redux";
import { createSelector, createStructuredSelector } from "reselect";
import sortBy from "lodash/sortBy";

import { handleClickLocation } from "@/components/map-menu/actions";
import { setMapSettings } from "@/components/map/actions";
import { getActiveDatasetsFromState } from "@/components/map/selectors";
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
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { dispatch } = dispatchProps;
  const { activeDatasets, ...restState } = stateProps;

  return {
    ...ownProps,
    ...restState,
    handleClickLocation: (loc) => dispatch(handleClickLocation(loc)),
    onToggleDataset: (dataset) => {
      const enable = !dataset.active;
      const current = activeDatasets || [];

      const next = enable
        ? [
            {
              dataset: dataset.id,
              opacity: 1,
              visibility: true,
              layers: [dataset.layer],
            },
            ...current.filter((l) => l.dataset !== dataset.id),
          ]
        : current.filter((l) => l.dataset !== dataset.id);

      dispatch(
        setMapSettings({
          datasets: next,
          ...(enable && { canBound: true }),
        })
      );
    },
  };
};

export default connect(mapStateToProps, null, mergeProps)(Component);
