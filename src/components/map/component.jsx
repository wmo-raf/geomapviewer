import React, { Component, PureComponent, createRef } from "react";
import PropTypes from "prop-types";
import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import debounce from "lodash/debounce";
import cx from "classnames";
import maplibregl from "maplibre-gl";
import { Protocol as PmtilesProtocol } from "pmtiles";
import { cogProtocol } from "@geomatico/maplibre-cog-protocol";

import { trackMapLatLon, trackEvent } from "@/utils/analytics";
import { fetchGetFeatureInfo } from "@/services/wms-feature-info";

import Loader from "@/components/ui/loader";
import Icon from "@/components/ui/icon";
import Map from "@/components/ui/map";
import MapboxCompare from "./mapbox-compare";

import iconCrosshair from "@/assets/icons/crosshair.svg?sprite";

import Scale from "./components/scale";
import Popup from "./components/popup";
import MapToolTip from "./components/map-tooltip";
import Draw from "./components/draw";
import Attributions from "./components/attributions";

// Components
import LayerManagerWrapper from "./components/layer-manager";
// import { pulsingDot } from "./mapImages";

import mapStyleForNoStyle from "./defautlStyle";

// Styles
import "./styles.scss";

class RenderMap extends PureComponent {
  render() {
    const {
      mapStyle,
      viewport,
      bounds,
      onViewportChange,
      onClick,
      onMouseMove,
      onLoad,
      interactiveLayerIds,
      minZoom,
      maxZoom,
      onClickAnalysis,
      drawing,
      onDrawComplete,
      drawingMode,
      mapSide,
      style,
    } = this.props;

    return (
      <Map
        comparing={!!mapSide}
        mapStyle={mapStyle || mapStyleForNoStyle}
        viewport={viewport}
        bounds={bounds}
        onViewportChange={onViewportChange}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onLoad={({ ...args }) => onLoad(args, mapSide)}
        interactiveLayerIds={interactiveLayerIds}
        attributionControl={false}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={style}
        getCursor={({ isHovering, isDragging }) => {
          if (drawing) return "crosshair";
          if (isDragging) return "grabbing";
          if (isHovering) return "pointer";
          return "grab";
        }}
      >
        {(map) => (
          <>
            {/* LAYER MANAGER */}
            <LayerManagerWrapper map={map} mapSide={mapSide} />

            {!mapSide && (
              <>
                {/* POPUP */}
                <Popup map={map} onClickAnalysis={onClickAnalysis} />
                {/* Hover POPUP */}
                <MapToolTip />
                {/* DRAWING */}
                <Draw
                  map={map}
                  drawing={drawing}
                  onDrawComplete={onDrawComplete}
                  drawingMode={drawingMode}
                />
                {/* SCALE */}
                <Scale className="map-scale" map={map} viewport={viewport} />
                {/* ATTRIBUTIONS */}
                <Attributions
                  className="map-attributions"
                  map={map}
                  viewport={viewport}
                />
              </>
            )}
          </>
        )}
      </Map>
    );
  }
}

class MapComponent extends Component {
  static propTypes = {
    className: PropTypes.string,
    viewport: PropTypes.shape().isRequired,
    mapStyle: PropTypes.string,
    setMapSettings: PropTypes.func.isRequired,
    setMapInteractions: PropTypes.func.isRequired,
    addMapInteraction: PropTypes.func,
    activeLayers: PropTypes.array,
    clearMapInteractions: PropTypes.func.isRequired,
    setMapHoverInteraction: PropTypes.func.isRequired,
    clearMapHoverInteraction: PropTypes.func.isRequired,
    hasHoverFeature: PropTypes.bool,
    mapLabels: PropTypes.bool,
    mapRoads: PropTypes.bool,
    location: PropTypes.object,
    interactiveLayerIds: PropTypes.array,
    hoverableLayerIds: PropTypes.array,
    canBound: PropTypes.bool,
    stateBbox: PropTypes.array,
    geostoreBbox: PropTypes.array,
    interaction: PropTypes.object,
    minZoom: PropTypes.number.isRequired,
    maxZoom: PropTypes.number.isRequired,
    drawing: PropTypes.bool,
    loading: PropTypes.bool,
    loadingMessage: PropTypes.string,
    basemap: PropTypes.object,
    onClickAnalysis: PropTypes.func,
    onDrawComplete: PropTypes.func,
    lang: PropTypes.string,
    printRequests: PropTypes.number,
    mapPrinting: PropTypes.bool,
    onMapGetStyle: PropTypes.func,
    vectorLayerIcons: PropTypes.array,
  };

  state = {
    bounds: {},
    drawClicks: 0,
    leftMap: null,
    rightMap: null,
    compareMap: null,
  };

  mapCompareContainer = createRef();

  componentDidUpdate(prevProps, prevState) {
    const {
      mapLabels,
      mapRoads,
      setMapSettings,
      canBound,
      stateBbox,
      geostoreBbox,
      interaction,
      viewport,
      lang,
      drawing,
      clearMapInteractions,
      basemap,
      location,
      geostoreType,
      printRequests,
      boundaryBounds,
      vectorLayerIcons,
    } = this.props;

    const {
      mapLabels: prevMapLabels,
      mapRoads: prevMapRoads,
      stateBbox: prevStateBbox,
      geostoreBbox: prevGeostoreBbox,
      interaction: prevInteraction,
      lang: prevLang,
      drawing: prevDrawing,
      basemap: prevBasemap,
      location: prevLocation,
      printRequests: prevPrintRequests,
      boundaryBounds: prevBoundaryBounds,
      vectorLayerIcons: prevVectorLayerIcons,
    } = prevProps;

    if (!drawing && prevDrawing) {
      this.resetClicks();
    }

    if (drawing && !prevDrawing) {
      clearMapInteractions();
    }

    if (basemap?.basemapGroup !== prevBasemap.basemapGroup) {
      this.applyBaseMap();
      this.applyLabels();
    }

    if (mapLabels !== prevMapLabels || lang !== prevLang) {
      this.applyLabels();
    }

    if (mapRoads !== prevMapRoads) {
      this.applyRoads();
    }

    // if bbox is change by action fit bounds
    if (canBound && stateBbox?.length && stateBbox !== prevStateBbox) {
      // eslint-disable-next-line
      this.setState({ bounds: { bbox: stateBbox, options: { padding: 50 } } });
    }

    // if geostore changes
    if (canBound && geostoreBbox?.length && geostoreBbox !== prevGeostoreBbox) {
      if (location && location.type === "use" && geostoreType === "Point") {
        setMapSettings({
          zoom: 7,
          center: {
            lat: geostoreBbox[1],
            lng: geostoreBbox[0],
          },
        });
      } else {
        // eslint-disable-next-line
        this.setState({
          bounds: { bbox: geostoreBbox, options: { padding: 50 } },
        });
      }
    }

    // if clicked point changes
    if (location && location.type === "point") {
      // eslint-disable-next-line
      const { adm0, adm1 } = location;
      const prevLat = prevLocation.adm0;
      const prevLong = prevLocation.adm1;

      if (adm0 !== prevLat || adm1 !== prevLong) {
        const lat = parseFloat(adm0);
        const lng = parseFloat(adm1);

        setMapSettings({
          center: {
            lat: lat,
            lng: lng,
          },
        });
      }
    }

    // reset canBound after fitting bounds
    if (
      canBound &&
      !isEmpty(this.state.bounds) &&
      !isEqual(this.state.bounds, prevState.bounds)
    ) {
      setMapSettings({ canBound: false, bbox: [] });
      // eslint-disable-next-line
      this.setState({ bounds: {} });
    }

    // fit bounds on cluster if clicked
    if (interaction && !isEqual(interaction, prevInteraction)) {
      trackEvent({
        category: "Map analysis",
        action: "User opens analysis popup infowindow",
        label: interaction.label,
      });

      if (interaction.data.cluster) {
        const { data, layer, geometry } = interaction;
        this.map
          .getSource(layer.id)
          .getClusterExpansionZoom(data.cluster_id, (err, newZoom) => {
            if (err) return;
            const { coordinates } = geometry;
            const difference = Math.abs(viewport.zoom - newZoom);
            setMapSettings({
              center: {
                lat: coordinates[1],
                lng: coordinates[0],
              },
              zoom: newZoom,
              transitionDuration: 400 + difference * 100,
            });
          });
      }
    }

    // if print request incremented
    if (this.map && printRequests && printRequests !== prevPrintRequests) {
      this.requestPrintMap();
    }

    if (!isEqual(boundaryBounds, prevBoundaryBounds)) {
      this.setMapBoundaryBounds();
    }

    if (!isEqual(vectorLayerIcons, prevVectorLayerIcons)) {
      this.loadMapImages();
    }
  }

  componentWillUnmount() {
    if (this.state.compareMap) {
      this.state.compareMap.remove();
    }
  }

  loadMapImages = async () => {
    const { vectorLayerIcons } = this.props;

    if (!vectorLayerIcons || !vectorLayerIcons.length || !this.map) return;

    await Promise.all(
      vectorLayerIcons.map(async (icon) => {
        try {
          const response = await this.map.loadImage(icon.url);
          const image = response?.data || response;
          if (image && !this.map.hasImage(icon.name)) {
            this.map.addImage(icon.name, image);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to load map image ${icon.name}:`, err);
        }
      })
    );
  };

  fitMapBoundaryBounds = () => {
    const { mapBounds, boundaryBounds, location } = this.props;

    const { type, adm0 } = location;

    const hasMapBounds = mapBounds && !!mapBounds.length;

    if (
      (!type || (type === "country" && !adm0)) &&
      !hasMapBounds &&
      boundaryBounds &&
      !!boundaryBounds.length
    ) {
      this.setState({
        bounds: { bbox: boundaryBounds, options: { padding: 50 } },
      });
    }
  };

  onViewportChange = debounce((viewport, mapSide) => {
    const { setMapSettings, location } = this.props;
    const { latitude, longitude, bearing, pitch, zoom } = viewport;

    let mapBounds = this.map && this.map.getBounds().toArray();

    setMapSettings({
      center: {
        lat: latitude,
        lng: longitude,
      },
      mapBounds,
      bearing,
      pitch,
      zoom,
    });
    trackMapLatLon(location);
  }, 250);

  onStyleLoad = () => {
    this.applyBaseMap();
    this.applyLabels();
    this.applyRoads();
  };

  onLoad = ({ map, mapContainer }, mapSide) => {
    const { setMapSettings } = this.props;

    // Register PMTiles protocol once
    if (!MapComponent._pmtilesRegistered) {
      const protocol = new PmtilesProtocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
      MapComponent._pmtilesRegistered = true;
    }

    // Register COG protocol once
    if (!MapComponent._cogRegistered) {
      maplibregl.addProtocol("cog", cogProtocol);
      MapComponent._cogRegistered = true;
    }

    // remove any if existing
    if (this.state.compareMap) {
      this.state.compareMap.remove();
      this.setState({ compareMap: null });
    }

    this.map = null;

    if (mapSide) {
      if (mapSide === "left") {
        this.setState({ leftMap: map }, this.checkCompareMapsLoad);
      } else {
        this.setState({ rightMap: map }, this.checkCompareMapsLoad);
      }
    } else {
      this.map = map;
    }

    // Labels
    this.applyBaseMap();
    this.applyLabels();
    this.applyRoads();

    // const mapBounds = this.map.getBounds().toArray();

    // setMapSettings({
    //   mapBounds,
    // });

    if (this.map) {
      this.fitMapBoundaryBounds();

      // Listeners
      this.map.once("styledata", this.onStyleLoad);
    }

    this.loadMapImages();

    // add images

    // map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });
  };

  checkCompareMapsLoad = () => {
    const { comparing } = this.props;
    const { leftMap, rightMap } = this.state;

    if (comparing && leftMap && rightMap) {
      const compareMap = new MapboxCompare(
        leftMap,
        rightMap,
        this.mapCompareContainer.current,
        { orientation: "vertical" }
      );

      this.setState({ compareMap: compareMap });
    }
  };

  requestPrintMap = () => {
    const { mapPrinting, setMapSettings, onGetMapPrintConfig, viewport } =
      this.props;

    if (!mapPrinting && onGetMapPrintConfig) {
      setMapSettings({ printing: true });

      onGetMapPrintConfig({
        mapStyle: this.map.getStyle(),
        viewport: viewport,
        bounds: this.map.getBounds().toArray(),
      });
    }
  };

  onClick = (e) => {
    const {
      drawing,
      clearMapInteractions,
      setMapInteractions,
      addMapInteraction,
      activeLayers,
    } = this.props;

    if (drawing) {
      this.setState({ drawClicks: this.state.drawClicks + 1 });
      return;
    }

    const { features = [], lngLat } = e;
    const lng = Array.isArray(lngLat) ? lngLat[0] : lngLat?.lng;
    const lat = Array.isArray(lngLat) ? lngLat[1] : lngLat?.lat;
    const wmsLayers = (activeLayers || []).filter(
      (l) => l?.interactionConfig?.type === "wmsGetFeatureInfo"
    );

    if (!features.length && !wmsLayers.length) {
      clearMapInteractions();
      return;
    }

    setMapInteractions({
      features: features.map((f) => ({
        ...f,
        geometry: f.geometry,
        // _vectorTileFeature cannot be serialized by redux
        // so we must remove them before dispatching the action
        _vectorTileFeature: null,
      })),
      lngLat,
    });

    if (!wmsLayers.length || !this.map) return;

    wmsLayers.forEach((layer) => {
      addMapInteraction({
        id: layer.id,
        interaction: {
          id: layer.id,
          geometry: { type: "Point", coordinates: [lng, lat] },
          data: { properties: {}, wmsFeatures: [], loading: true },
        },
      });

      fetchGetFeatureInfo({ layer, map: this.map, lngLat: { lng, lat } })
        .then((results) => {
          addMapInteraction({
            id: layer.id,
            interaction: {
              id: layer.id,
              geometry: { type: "Point", coordinates: [lng, lat] },
              data: {
                properties: results[0]?.properties || {},
                wmsFeatures: results,
                loading: false,
              },
            },
          });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error("WMS GetFeatureInfo failed", err);
          addMapInteraction({
            id: layer.id,
            interaction: {
              id: layer.id,
              geometry: { type: "Point", coordinates: [lng, lat] },
              data: {
                properties: {},
                wmsFeatures: [],
                loading: false,
                error: err?.message || "Request failed",
              },
            },
          });
        });
    });
  };

  onMouseMove = (e) => {
    const {
      hoverableLayerIds,
      clearMapHoverInteraction,
      hasHoverFeature,
      setMapHoverInteraction,
    } = this.props;

    if (hoverableLayerIds && !!hoverableLayerIds.length) {
      const features =
        this.map &&
        this.map.queryRenderedFeatures(e.point, { layers: hoverableLayerIds });
      if (features && !!features.length) {
        const { lngLat } = e;

        setMapHoverInteraction({ feature: features[0], lngLat });
      } else {
        hasHoverFeature && clearMapHoverInteraction();
      }
    }
  };

  applyBaseMap = () => {
    const { leftMap, rightMap } = this.state;

    if (!this.map) {
      if (leftMap) {
        this.setBasemap(leftMap);
      }
      if (rightMap) {
        this.setBasemap(rightMap);
      }
    } else {
      this.setBasemap(this.map);
    }
  };

  setBasemap = (map) => {
    const { basemap } = this.props;
    const BASEMAP_GROUPS = ["basemap"];

    if (map && map.getStyle()) {
      const { layers, metadata } = map.getStyle();

      const basemapGroups = Object.keys(metadata["mapbox:groups"]).filter(
        (k) => {
          const { name } = metadata["mapbox:groups"][k];

          const matchedGroups = BASEMAP_GROUPS.map((rgr) =>
            name?.toLowerCase()?.includes(rgr)
          );

          return matchedGroups.some((bool) => bool);
        }
      );

      const basemapsWithMeta = basemapGroups.map((_groupId) => ({
        ...metadata["mapbox:groups"][_groupId],
        id: _groupId,
      }));
      const basemapToDisplay = basemapsWithMeta.find((_basemap) =>
        _basemap.name.includes(basemap.basemapGroup)
      );

      const basemapLayers = layers.filter((l) => {
        const { metadata: layerMetadata } = l;
        if (!layerMetadata) return false;

        const gr = layerMetadata["mapbox:group"];
        return basemapGroups.includes(gr);
      });

      if (!basemapToDisplay) return false;

      basemapLayers.forEach((_layer) => {
        const match = _layer.metadata["mapbox:group"] === basemapToDisplay.id;

        if (!match) {
          map.setLayoutProperty(_layer.id, "visibility", "none");
        } else {
          map.setLayoutProperty(_layer.id, "visibility", "visible");
        }
      });
    }

    return true;
  };

  applyLabels = () => {
    const { leftMap, rightMap } = this.state;
    if (!this.map) {
      if (leftMap) {
        this.setLabels(leftMap);
      }

      if (rightMap) {
        this.setLabels(rightMap);
      }
    } else {
      this.setLabels(this.map);
    }
  };

  setLabels = (map) => {
    const { basemap, lang, mapLabels } = this.props;

    const LABELS_GROUP = ["labels"];

    if (map && map.getStyle()) {
      const { layers, metadata } = map.getStyle();

      const labelGroups = Object.keys(metadata["mapbox:groups"]).filter((k) => {
        const { name } = metadata["mapbox:groups"][k];

        const matchedGroups = LABELS_GROUP.filter((rgr) =>
          name.toLowerCase().includes(rgr)
        );

        return matchedGroups.some((bool) => bool);
      });

      const labelsWithMeta = labelGroups.map((_groupId) => ({
        ...metadata["mapbox:groups"][_groupId],
        id: _groupId,
      }));
      const labelsToDisplay =
        labelsWithMeta.find((_basemap) =>
          _basemap.name.includes(basemap?.labelsGroup)
        ) || {};

      const labelLayers = layers.filter((l) => {
        const { metadata: layerMetadata } = l;
        if (!layerMetadata) return false;

        const gr = layerMetadata["mapbox:group"];
        return labelGroups.includes(gr);
      });

      labelLayers.forEach((_layer) => {
        const match = _layer.metadata["mapbox:group"] === labelsToDisplay.id;
        map.setLayoutProperty(
          _layer.id,
          "visibility",
          match && mapLabels ? "visible" : "none"
        );
        map.setLayoutProperty(_layer.id, "text-field", ["get", `name_${lang}`]);
      });
    }

    return true;
  };

  applyRoads = () => {
    const { leftMap, rightMap } = this.state;
    if (!this.map) {
      if (leftMap) {
        this.setRoads(leftMap);
      }

      if (rightMap) {
        this.setRoads(rightMap);
      }
    } else {
      this.setRoads(this.map);
    }
  };

  setRoads = (map) => {
    const ROADS_GROUP = ["roads"];

    if (map && map.getStyle()) {
      const { mapRoads } = this.props;
      const { layers, metadata } = map.getStyle();

      const groups =
        metadata &&
        Object.keys(metadata["mapbox:groups"]).filter((k) => {
          const { name } = metadata["mapbox:groups"][k];
          const roadGroups = ROADS_GROUP.map((rgr) =>
            name?.toLowerCase()?.includes(rgr)
          );

          return roadGroups.some((bool) => bool);
        });

      const roadLayers = layers.filter((l) => {
        const roadMetadata = l.metadata;
        if (!roadMetadata) return false;

        const gr = roadMetadata["mapbox:group"];
        return groups.includes(gr);
      });

      roadLayers.forEach((l) => {
        const visibility = mapRoads ? "visible" : "none";
        map.setLayoutProperty(l.id, "visibility", visibility);
      });
    }
  };

  resetClicks() {
    this.setState({ drawClicks: 0 });
  }

  render() {
    const {
      className,
      mapStyle,
      viewport,
      minZoom,
      maxZoom,
      interactiveLayerIds,
      hoverableLayerIds,
      drawing,
      loading,
      loadingMessage,
      basemap,
      onClickAnalysis,
      onDrawComplete,
      drawingMode,
      comparing,
    } = this.props;

    let tipText;
    if (this.state.drawClicks <= 0) {
      tipText = "Click an origin point to start drawing.";
    } else if (this.state.drawClicks < 3) {
      tipText = "Click to add another point.";
    } else {
      tipText = "Click to add a point or close shape.";
    }

    const mapInteractiveLayerIds = [
      ...interactiveLayerIds,
      ...hoverableLayerIds,
    ];

    const style = {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
    };

    return (
      <div
        className={cx("c-map", { "no-pointer-events": drawing }, className)}
        style={{ backgroundColor: basemap && basemap.color }}
      >
        {comparing ? (
          <div
            ref={this.mapCompareContainer}
            style={{ ...style, width: "100%" }}
          >
            <RenderMap
              comparing={comparing}
              mapSide="left"
              mapStyle={mapStyle || ""}
              viewport={viewport}
              bounds={this.state.bounds}
              onClick={this.onClick}
              onMouseMove={this.onMouseMove}
              onLoad={this.onLoad}
              attributionControl={false}
              minZoom={minZoom}
              maxZoom={maxZoom}
              style={style}
            />
            <RenderMap
              comparing={comparing}
              mapSide="right"
              mapStyle={mapStyle || ""}
              viewport={viewport}
              bounds={this.state.bounds}
              onClick={this.onClick}
              onMouseMove={this.onMouseMove}
              onLoad={this.onLoad}
              attributionControl={false}
              minZoom={minZoom}
              maxZoom={maxZoom}
              style={style}
            />
          </div>
        ) : (
          <RenderMap
            comparing={comparing}
            mapStyle={mapStyle || ""}
            viewport={viewport}
            bounds={this.state.bounds}
            onViewportChange={this.onViewportChange}
            onClick={this.onClick}
            onMouseMove={this.onMouseMove}
            onLoad={this.onLoad}
            interactiveLayerIds={mapInteractiveLayerIds}
            attributionControl={false}
            minZoom={minZoom}
            maxZoom={maxZoom}
            onClickAnalysis={onClickAnalysis}
            drawing={drawing}
            onDrawComplete={onDrawComplete}
            drawingMode={drawingMode}
          />
        )}

        <Icon className="map-icon-crosshair" icon={iconCrosshair} />
        {loading && (
          <Loader
            className="map-loader"
            theme="theme-loader-light"
            message={loadingMessage}
          />
        )}
      </div>
    );
  }
}

export default MapComponent;
