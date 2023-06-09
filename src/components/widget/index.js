import { createElement, Component } from "react";
import PropTypes from "prop-types";
import { CancelToken } from "axios";
import isEqual from "lodash/isEqual";
import pick from "lodash/pick";
import has from "lodash/has";
import { trackEvent } from "@/utils/analytics";

import WidgetComponent from "./component";
import { isEmpty } from "lodash";

class WidgetContainer extends Component {
  static propTypes = {
    widget: PropTypes.string,
    location: PropTypes.object,
    getData: PropTypes.func,
    setWidgetData: PropTypes.func,
    refetchKeys: PropTypes.array,
    settings: PropTypes.object,
    handleChangeSettings: PropTypes.func,
    geostore: PropTypes.object,
    meta: PropTypes.object,
    status: PropTypes.string,
    maxDownloadSize: PropTypes.object,
  };

  static defaultProps = {
    widget: "",
    location: {},
    getData: fetch,
    setWidgetData: () => {},
  };

  state = {
    loading: false,
    error: false,
    maxSize: null,
    downloadDisabled: false,
    filterSelected: false,
  };

  _mounted = false;

  componentDidMount() {
    this._mounted = true;

    this.handleGetWidgetData();
  }

  componentDidUpdate(prevProps, prevState) {
    const { location, settings, refetchKeys, timestamps } = this.props;

    const { error } = this.state;

    const hasLocationChanged =
      location && !isEqual(location, prevProps.location);
    const hasErrorChanged =
      !error &&
      prevState.error !== undefined &&
      !isEqual(error, prevState.error);

    const hasTimestampsChanged =
      timestamps && !isEqual(timestamps, prevProps.timestamps);

    const refetchSettings = pick(settings, refetchKeys);

    const refetchPrevSettings = pick(prevProps.settings, refetchKeys);
    const hasSettingsChanged = !isEqual(refetchSettings, refetchPrevSettings);

    // refetch data if error, settings, or location changes
    if (
      hasSettingsChanged ||
      hasLocationChanged ||
      hasErrorChanged ||
      hasTimestampsChanged
    ) {
      this.handleGetWidgetData();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  handleMaxRowSize(data) {
    const { maxDownloadSize = null } = this.props;
    if (!maxDownloadSize) return { downloadDisabled: false };
    const { key, subKey = null, maxSize } = maxDownloadSize;

    const dataEntry = data[key];
    let dataKey = key;
    if (subKey) {
      dataKey = subKey;
    }

    if (
      has(dataEntry, dataKey) &&
      Array.isArray(dataEntry[dataKey]) &&
      maxSize
    ) {
      return {
        maxSize,
        filterSelected,
      };
    }
    return { downloadDisabled: false, maxSize };
  }

  handleGetWidgetData = () => {
    const {
      location,
      settings,
      refetchKeys,
      status,
      meta,
      layerId,
      requiresTime,
      timestamps,
      aggregationMethod,
    } = this.props;

    const params = {
      ...location,
      ...settings,
      status,
      layerId,
      timestamps,
      aggregationMethod,
    };

    const isPoint = Boolean(
      location.type &&
        location.type === "point" &&
        location.adm0 &&
        location.adm1
    );

    params.isPoint = isPoint;

    if (params?.type) {
      const { getData, setWidgetData, geostore } = this.props;
      this.cancelWidgetDataFetch();
      this.widgetDataFetch = CancelToken.source();
      this.setState({ loading: true, error: false });

      let canFetch = true;

      if (requiresTime && !params.time && !!timestamps.length) {
        canFetch = false;
      }

      if (location.type !== "point" && isEmpty(geostore)) {
        canFetch = false;
      }

      if (canFetch) {
        getData({
          ...params,
          geostore,
          token: this.widgetDataFetch.token,
        })
          .then((data) => {
            setWidgetData(data);
            setTimeout(() => {
              if (this._mounted) {
                this.setState({
                  ...this.handleMaxRowSize(data),
                  loading: false,
                  error: false,
                });
              }
            }, 200);
          })
          .catch((error) => {
            if (this._mounted) {
              this.setState({
                error:
                  error.message !== `Cancelling ${this.props.widget} fetch`,
                loading: false,
              });
            }
          });
      }
    }
  };

  handleRefetchData = () => {
    const { settings, location, widget } = this.props;
    const params = { ...location, ...settings };
    this.handleGetWidgetData({ ...params });
    trackEvent({
      category: "Refetch data",
      action: "Data failed to fetch, user clicks to refetch",
      label: `Widget: ${widget}`,
    });
  };

  handleDataHighlight = (highlighted) => {
    this.props.handleChangeSettings({ highlighted });
  };

  cancelWidgetDataFetch = () => {
    if (this.widgetDataFetch) {
      this.widgetDataFetch.cancel(`Cancelling ${this.props.widget} fetch`);
    }
  };

  render() {
    return createElement(WidgetComponent, {
      ...this.props,
      ...this.state,
      handleRefetchData: this.handleRefetchData,
      handleDataHighlight: this.handleDataHighlight,
    });
  }
}

export default WidgetContainer;
