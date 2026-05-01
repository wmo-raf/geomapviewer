import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Legend, {
  LegendListItem,
  LegendItemToolbar,
  LegendItemButtonOpacity,
  LegendItemButtonInfo,
  LegendItemButtonRemove,
} from "@/components/legend";

import LegendItemTypes from "./components/legend-item-types";

import Loader from "@/components/ui/loader";
import NoContent from "@/components/ui/no-content";
import SentenceSelector from "@/components/sentence-selector";
import DateTimeSelector from "@/components/datetime-selector";
import LayerFilterSelector from "@/components/layer-filter-selector";
import WidgetCaution from "@/components/widget/components/widget-caution";
import Icon from "@/components/ui/icon";

import LayerListMenu from "./components/layer-list-menu";
import LayerSelectMenu from "./components/layer-select-menu";
import LayerSelectorMenu from "./components/layer-selector-menu";
import LayerStatement from "./components/layer-statement";
import LayerAnalysisStatement from "./components/layer-analysis-statement";
import LayerMoreInfo from "./components/layer-more-info";
import LayerCapabilities from "@/components/layer-capabilities/component";

import SubNavMenu from "@/components/subnav-menu";

import updateIcon from "@/assets/icons/refresh.svg?sprite";
import moveLeftIcon from "@/assets/icons/move-left.svg?sprite";
import moveRightIcon from "@/assets/icons/move-right.svg?sprite";

import "./styles.scss";
import "./themes/vizzuality-legend.scss";
import LayerSettings from "@/components/layer-settings/component";

const MapLegendContent = ({
  layerGroups,
  onChangeOrder,
  onToggleLayer,
  onSelectLayer,
  onChangeLayer,
  onChangeParam,
  onChangeFilterParam,
  onChangeLayerSetting,
  onChangeInfo,
  loading,
  className,
  activeLayers,
  onChangeMapSide,
  activeCompareSide,
  comparing,
  mapSide,
  location,
  ...rest
}) => {
  let filteredLayerGroups = layerGroups;

  // filter by mapSide
  if (mapSide) {
    filteredLayerGroups =
      filteredLayerGroups &&
      filteredLayerGroups.length &&
      filteredLayerGroups.filter((l) => l.mapSide === mapSide);
  }

  const noLayers = !filteredLayerGroups || !filteredLayerGroups.length;

  if (noLayers) {
    return <NoContent message="No layers selected" />;
  }

  return (
    <Legend
      layerGroups={layerGroups}
      collapsable={false}
      onChangeOrder={onChangeOrder}
    >
      {filteredLayerGroups.map((lg, i) => {
        const {
          isSelectorLayer,
          isMultiLayer,
          isMultiSelectorLayer,
          selectorLayerConfig,
          color,
          metadata,
          id,
          layers,
          statementConfig,
          caution,
          name,
          dataset,
          summary,
          capabilities,
        } = lg || {};

        const activeLayer = layers && layers.find((l) => l.active);

        const {
          params,
          paramsSelectorConfig,
          paramsSelectorColumnView,
          moreInfo,
          statement,
          disclaimer,
          layerFilterParams,
          layerFilterParamsConfig,
        } = activeLayer || {};

        const isUpdating =
          activeLayer &&
          activeLayers.find((l) => l.id === activeLayer.id && l.isUpdating);

        const moveTo =
          activeCompareSide &&
          (activeCompareSide === "left" ? "Right" : "Left");

        return (
          <LegendListItem
            index={i}
            key={id}
            layerGroup={lg}
            title={isMultiLayer ? name : null}
            toolbar={
              <LegendItemToolbar
                {...rest}
                enabledStyle={{
                  fill: color,
                }}
                defaultStyle={{
                  fill: "#999",
                }}
                disabledStyle={{
                  fill: "#d6d6d9",
                }}
                focusStyle={{
                  fill: "#676867",
                }}
                onChangeInfo={() => onChangeInfo(metadata)}
              >
                <LegendItemButtonOpacity
                  className="-plain"
                  handleStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    border: 0,
                    boxShadow: "rgba(0, 0, 0, 0.29) 0px 1px 2px 0px",
                  }}
                />
                {metadata && <LegendItemButtonInfo />}
                <LegendItemButtonRemove />
              </LegendItemToolbar>
            }
          >
            {comparing && (
              <div className="compare-move-controls">
                <div
                  className="action"
                  onClick={() => onChangeMapSide(dataset)}
                >
                  <Icon
                    icon={
                      activeCompareSide === "left"
                        ? moveRightIcon
                        : moveLeftIcon
                    }
                  />
                  <div> Move {moveTo}</div>
                </div>
              </div>
            )}

            {summary && <div>{summary}</div>}
            {disclaimer && <div className="disclaimer">{disclaimer}</div>}
            {isUpdating && (
              <div className="updating-indicator">
                <Icon icon={updateIcon} />
                <div>Updating ...</div>
              </div>
            )}
            <LayerCapabilities capabilities={capabilities} />
            {!isMultiLayer && <LegendItemTypes />}
            {statement && <LayerAnalysisStatement statementHtml={statement} />}
            {statementConfig && (
              <LayerStatement
                className="layer-statement"
                {...statementConfig}
              />
            )}

            {isMultiLayer && (
              <LayerSelectMenu
                className="sub-layer-menu"
                layers={lg.layers}
                onSelectLayer={onSelectLayer}
                onInfoClick={onChangeInfo}
              />
            )}

            <div
              className={cx("param-selectors", {
                "-column": paramsSelectorColumnView,
              })}
            >
              {activeLayer &&
                paramsSelectorConfig &&
                params &&
                paramsSelectorConfig.map((paramConfig) => {
                  // hidden
                  if (paramConfig.hidden) {
                    return null;
                  }

                  const { autoUpdateInterval, settings = {} } = activeLayer;

                  const { autoUpdateActive = true } = settings;

                  // `paramConfig.key` is a domain field ("time", "height", ...).
                  // Strip it before spreading so it doesn't collide with React's
                  // special `key` prop.
                  const { key: paramKey, ...paramConfigRest } = paramConfig;

                  //datetime selector
                  if (
                    paramConfig.type === "datetime" &&
                    !isUpdating &&
                    paramConfig.availableDates &&
                    !!paramConfig.availableDates.length
                  ) {
                    return (
                      <DateTimeSelector
                        key={`${activeLayer.name}-${paramKey}`}
                        name={name}
                        className="param-selector"
                        {...paramConfigRest}
                        availableDates={paramConfig.availableDates}
                        selectedTime={
                          params[paramKey] || paramConfig.default
                        }
                        onChange={(value) => {
                          onChangeParam(activeLayer, {
                            [paramKey]: value,
                          });
                        }}
                        autoUpdate={Boolean(autoUpdateInterval)}
                        autoUpdateActive={autoUpdateActive}
                        onToggleAutoUpdate={() => {
                          onChangeLayerSetting(activeLayer, {
                            autoUpdateActive: !autoUpdateActive,
                          });
                        }}
                      />
                    );
                  }
                  // options
                  if (paramConfig.options) {
                    return (
                      <SentenceSelector
                        key={`${activeLayer.name}-${paramKey}`}
                        name={name}
                        className="param-selector"
                        {...paramConfigRest}
                        value={params[paramKey] || paramConfig.default}
                        columnView={paramsSelectorColumnView}
                        onChange={(value) => {
                          const selectedOption = paramConfig.options.find(
                            (o) => o.value === value
                          );
                          onChangeParam(
                            activeLayer,
                            {
                              [paramKey]: value,
                            },
                            selectedOption
                          );
                        }}
                      />
                    );
                  }

                  return null;
                })}
            </div>

            {activeLayer && (
              <div className="settings-toggle">
                <LayerSettings
                  layer={activeLayer}
                  location={location}
                  onToggleSetting={(setting, isActive) => {
                    onChangeLayerSetting(activeLayer, {
                      [setting]: isActive,
                    });
                  }}
                />
              </div>
            )}

            {activeLayer &&
              layerFilterParams &&
              layerFilterParamsConfig &&
              layerFilterParamsConfig.map((filterParam) => {
                if (filterParam.options) {
                  const { key: filterKey, ...filterParamRest } = filterParam;
                  return (
                    <LayerFilterSelector
                      key={`${activeLayer.name}-${filterKey}`}
                      uiType={filterParam}
                      name={name}
                      className="param-selector"
                      {...filterParamRest}
                      value={
                        layerFilterParams[filterKey] ||
                        filterParam.default
                      }
                      onChange={(e) =>
                        onChangeFilterParam(activeLayer, {
                          [filterKey]: e,
                        })
                      }
                    />
                  );
                }

                return null;
              })}

            {(isSelectorLayer || isMultiSelectorLayer) &&
              selectorLayerConfig && (
                <LayerSelectorMenu
                  className="layer-selector"
                  layerGroup={lg}
                  name={name}
                  multi={isMultiSelectorLayer}
                  onChange={onChangeLayer}
                  {...selectorLayerConfig}
                />
              )}

            {isMultiLayer && (
              <LayerListMenu
                className="sub-layer-menu"
                layers={lg.layers}
                onToggle={onToggleLayer}
                onInfoClick={onChangeInfo}
              />
            )}
            {statementConfig && (
              <LayerStatement
                className="layer-statement"
                {...statementConfig}
              />
            )}
            {caution && (
              <WidgetCaution
                locationType="map"
                caution={{
                  text: caution,
                  visible: ["country", "aoi", "geostore", "dashboard", "map"],
                }}
              />
            )}
            {moreInfo && <LayerMoreInfo className="more-info" {...moreInfo} />}
          </LegendListItem>
        );
      })}
    </Legend>
  );
};

class MapLegendCompare extends Component {
  getLinks = () => {
    const { compareLinks, setMapSettings } = this.props;

    return compareLinks.map((l) => ({
      ...l,
      onClick: () => {
        setMapSettings({ activeCompareSide: l.mapSide });
      },
    }));
  };
  render() {
    const { activeCompareSide, layerGroups } = this.props;

    return (
      <div className="c-maplegend-compare">
        <SubNavMenu
          className="compare-nav"
          theme="theme-subnav-plain"
          links={this.getLinks()}
          checkActive
        />
        {activeCompareSide === "left" && (
          <MapLegendContent
            {...this.props}
            comparing
            mapSide="left"
            layerGroups={layerGroups}
          />
        )}
        {activeCompareSide === "right" && (
          <MapLegendContent
            {...this.props}
            comparing
            mapSide="right"
            layerGroups={layerGroups}
          />
        )}
      </div>
    );
  }
}

const MapLegend = ({
  layerGroups,
  loading,
  className,
  comparing,
  maxHeight = 300,
  LegendItemToolbar: LegendItemToolbarNode = <LegendItemToolbar />,
  LegendItemTypes: LegendItemTypesNode = <LegendItemTypes />,
  ...rest
}) => {
  const sharedProps = {
    maxHeight,
    LegendItemToolbar: LegendItemToolbarNode,
    LegendItemTypes: LegendItemTypesNode,
    ...rest,
  };

  return (
    <div className={cx("c-legend", className)}>
      {loading && <Loader className="datasets-loader" />}

      {comparing && (
        <MapLegendCompare layerGroups={layerGroups} {...sharedProps} />
      )}

      {!comparing && !loading && (
        <MapLegendContent layerGroups={layerGroups} {...sharedProps} />
      )}
    </div>
  );
};

MapLegend.propTypes = {
  maxHeight: PropTypes.number,
  LegendItemToolbar: PropTypes.node,
  LegendItemTypes: PropTypes.node,
  className: PropTypes.string,
  layerGroups: PropTypes.array,
  loading: PropTypes.bool,
  onChangeOrder: PropTypes.func,
  onToggleLayer: PropTypes.func,
  onSelectLayer: PropTypes.func,
  onChangeParam: PropTypes.func,
  onChangeLayer: PropTypes.func,
  onChangeInfo: PropTypes.func,
  layers: PropTypes.array,
  location: PropTypes.object,
};

export default MapLegend;
