import { PureComponent, createRef } from "react";
import bbox from "@turf/bbox";
import { isEmpty } from "lodash";
import { connect } from "react-redux";
import { wrap } from "comlink";

import * as ownActions from "./actions";
import { getDatasetProps } from "./selectors";
import { setMapSettings } from "@/components/map/actions";
import { parseISO } from "date-fns";

const actions = {
  ...ownActions,
  setMapSettings,
};

class LayerUpdate extends PureComponent {
  wmsWorkerRef = createRef();

  componentDidMount() {
    const { updateInterval } = this.props;
    this.doUpdate({ isInitial: true });

    if (updateInterval) {
      this.interval = setInterval(() => this.doUpdate({}), updateInterval);
    }
  }

  initWmsWorker = () => {
    if (!this.wmsWorkerRef.current) {
      this.wmsWorkerRef.current = wrap(
        new Worker(new URL("./wms-getcaps-worker.js", import.meta.url))
      );
    }
  };

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  getWMSLayerInfo = async () => {
    const { layer, legendFromCapabilities } = this.props;

    const {
      getCapabilitiesUrl,
      layerName,
      getCapabilitiesLayerName,
      styles,
    } = layer;

    this.initWmsWorker();

    if (this.wmsWorkerRef.current) {
      const styleName = legendFromCapabilities && Array.isArray(styles)
        ? styles.join(',')
        : null;

      return await this.wmsWorkerRef.current.wmsGetLayerInfoFromCapabilities(
        getCapabilitiesUrl,
        getCapabilitiesLayerName || layerName,
        styleName
      );
    }

    return {};
  };

  processTimestamps = (timestamps) => {
    const {
      layer,
      setMapSettings,
      setTimestamps,
      getCurrentLayerTime,
      activeDatasets,
    } = this.props;

    const { id: layerId, linkedLayers } = layer;

    setTimestamps({ [layerId]: [...timestamps] });

    if (linkedLayers && !!linkedLayers.length) {
      linkedLayers.forEach((linkedLayer) => {
        setTimestamps({ [linkedLayer]: [...timestamps] });
      });
    }

    if (timestamps.length) {
      const newParams = {
        time: timestamps[timestamps.length - 1],
      };

      if (getCurrentLayerTime) {
        const sortedTimestamps = timestamps
          .slice()
          .sort((a, b) => parseISO(a) - parseISO(b));
        newParams.time = getCurrentLayerTime(sortedTimestamps);
      }

      const newDatasets = activeDatasets.map((l) => {
        const dataset = { ...l };
        if (l.layers.includes(layerId)) {
          dataset.params = { ...dataset.params, ...newParams };
        }
        return dataset;
      });

      setMapSettings({ datasets: newDatasets });
    }
  };

  doUpdate = async ({ isInitial }) => {
    const {
      layer,
      getTimestamps,
      getData,
      setMapSettings,
      setTimestamps,
      setLayerLegend,
      setGeojsonData,
      activeDatasets,
      setLayerUpdatingStatus,
      setLayerLoadingStatus,
      zoomToDataExtent,
      legendFromCapabilities,
    } = this.props;

    const {
      id: layerId,
      layerType,
      isMultiLayer,
      isDefault,
      multiTemporal,
    } = layer;

    const needsWmsCapabilities =
      layerType === "wms" &&
      ((!getTimestamps && multiTemporal) || legendFromCapabilities);

    let getLayerTimestamps = getTimestamps;

    if (isMultiLayer && !isDefault) {
      getLayerTimestamps = null;
    }

    if (needsWmsCapabilities) {
      console.log(`Updating layer : ${layerId}, fetching capabilities`);

      setLayerUpdatingStatus({ [layerId]: true });

      if (isInitial) {
        setLayerLoadingStatus({ [layerId]: true });
      }

      try {
        const info = await this.getWMSLayerInfo();

        if (info.legendUrl) {
          setLayerLegend({ [layerId]: info.legendUrl });
        }

        if (!getTimestamps && multiTemporal) {
          this.processTimestamps(info.timestamps || []);
        }

        setLayerUpdatingStatus({ [layerId]: false });
        if (isInitial) {
          setLayerLoadingStatus({ [layerId]: false });
        }
      } catch (err) {
        setTimestamps({ [layerId]: [] });
        setLayerUpdatingStatus({ [layerId]: false });
        setLayerLoadingStatus({ [layerId]: false });
      }
    } else if (getLayerTimestamps) {
      console.log(`Updating layer : ${layerId}, fetching latest timestamps`);

      setLayerUpdatingStatus({ [layerId]: true });

      if (isInitial) {
        setLayerLoadingStatus({ [layerId]: true });
      }

      getLayerTimestamps()
        .then((timestamps) => {
          this.processTimestamps(timestamps);

          setLayerUpdatingStatus({ [layerId]: false });

          if (isInitial) {
            setLayerLoadingStatus({ [layerId]: false });
          }
        })
        .catch((err) => {
          setTimestamps({ [layerId]: [] });
          setLayerUpdatingStatus({ [layerId]: false });
          setLayerLoadingStatus({ [layerId]: false });
        });
    }

    // update data
    if (getData) {
      console.log(`Updating layer : ${layerId}, fetching latest data`);

      setLayerUpdatingStatus({ [layerId]: true });

      if (isInitial) {
        setLayerLoadingStatus({ [layerId]: true });
      }

      getData()
        .then((data) => {
          if (data) {
            setGeojsonData({ [layerId]: data });
            setLayerUpdatingStatus({ [layerId]: false });

            if (isInitial) {
              setLayerLoadingStatus({ [layerId]: false });
            }

            // zoom to data extents
            if (isInitial && zoomToDataExtent && !isEmpty(data.features)) {
              setMapSettings({ bbox: bbox(data), padding: 20 });
            }
          }
        })
        .catch((err) => {
          setLayerUpdatingStatus({ [layerId]: false });
          setLayerLoadingStatus({ [layerId]: false });
        });
    }
  };

  render() {
    return null;
  }
}

export default connect(getDatasetProps, actions)(LayerUpdate);
