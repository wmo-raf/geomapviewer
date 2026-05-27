import { PureComponent, createRef } from "react";
import bbox from "@turf/bbox";
import { isEmpty } from "lodash";
import { connect } from "react-redux";
import { wrap } from "comlink";
import { setColorFunction } from "@geomatico/maplibre-cog-protocol";

import * as ownActions from "./actions";
import { getDatasetProps } from "./selectors";
import { setMapSettings } from "@/components/map/actions";
import { parseISO } from "date-fns";
import { buildColorFunction } from "@/utils/color-ramp";

const registeredCogColorUrls = new Set();

const registerCogColorFunctions = (urlsMap, colorRamp) => {
  if (!urlsMap || !colorRamp) return;
  const fn = buildColorFunction(colorRamp);
  if (!fn) return;
  Object.values(urlsMap).forEach((cogUrl) => {
    if (!cogUrl || registeredCogColorUrls.has(cogUrl)) return;
    try {
      setColorFunction(cogUrl, fn);
      registeredCogColorUrls.add(cogUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("setColorFunction failed for", cogUrl, err);
    }
  });
};

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
      getTileJson,
      getData,
      setMapSettings,
      setTimestamps,
      setCogUrls,
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

    if (getTileJson && !(isMultiLayer && !isDefault)) {
      console.log(`Updating layer : ${layerId}, fetching COG TileJSON`);

      setLayerUpdatingStatus({ [layerId]: true });
      if (isInitial) setLayerLoadingStatus({ [layerId]: true });

      try {
        const tileJson = await getTileJson();
        const urls = tileJson?.urls || {};
        const timestamps = tileJson?.timestamps || [];

        registerCogColorFunctions(urls, layer.colorRamp);
        setCogUrls({ [layerId]: urls });

        if (multiTemporal) {
          this.processTimestamps(timestamps);
        } else {
          setTimestamps({ [layerId]: timestamps });
        }

        setLayerUpdatingStatus({ [layerId]: false });
        if (isInitial) setLayerLoadingStatus({ [layerId]: false });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("raster_cog TileJSON fetch failed", err);
        setTimestamps({ [layerId]: [] });
        setLayerUpdatingStatus({ [layerId]: false });
        setLayerLoadingStatus({ [layerId]: false });
      }
    } else if (needsWmsCapabilities) {
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
