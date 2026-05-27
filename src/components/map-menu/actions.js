import { createAction, createThunkAction } from "@/redux/actions";

import { setMapSettings, setMapInteractions } from "@/components/map/actions";
import { setAnalysisSettings } from "@/components/analysis/actions";

export const setMenuLoading = createAction("setMenuLoading");
export const setMenuSettings = createAction("setMenuSettings");

export const handleClickLocation = createThunkAction(
  "handleClickLocation",
  ({ center, bbox: featureBbox, ...feature }) => (dispatch) => {
    if (featureBbox) {
      dispatch(setMapSettings({ canBound: true, bbox: featureBbox }));
    } else {
      dispatch(
        setMapSettings({ center: { lat: center[1], lng: center[0] }, zoom: 12 })
      );
    }
    dispatch(setMapInteractions({ features: [feature], lngLat: center }));
    dispatch(setMenuSettings({ menuSection: "" }));
  }
);

export const handleViewOnMap = createThunkAction(
  "handleViewOnMap",
  ({ analysis, mapMenu, map }) => (dispatch) => {
    if (map) {
      dispatch(setMapSettings({ ...map, canBound: true }));
    }

    dispatch(
      setMenuSettings({
        ...mapMenu,
        menuSection: "",
      })
    );

    if (analysis) {
      dispatch(setAnalysisSettings(analysis));
    }
  }
);

export const showAnalysis = createThunkAction(
  "showAnalysis",
  () => (dispatch) => {
    dispatch(
      setMenuSettings({
        menuSection: "analysis",
      })
    );
  }
);
