import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import remove from "lodash/remove";
import { trackEvent } from "@/utils/analytics";

import MenuPanel from "./components/menu-panel";
import MenuDesktop from "./components/menu-desktop";
import MenuMobile from "./components/menu-mobile";

import "./styles.scss";

class MapMenu extends PureComponent {
  componentDidUpdate(prevProps) {
    const { comparing, activeDatasets, activeCompareSide, setMapSettings } =
      this.props;
    const { comparing: prevComparing } = prevProps;

    // set all existing layers to a default map side
    if (prevComparing !== comparing) {
      let newActiveDatasets = [...activeDatasets];

      const datasets = newActiveDatasets.map((d) => ({
        ...d,
        mapSide: activeCompareSide,
      }));

      setMapSettings({
        datasets: datasets,
      });
    }
  }

  onToggleLayer = (data, enable) => {
    const { activeDatasets, activeCompareSide } = this.props;
    const { dataset, layer } = data;

    let newActiveDatasets = [...activeDatasets];
    if (!enable) {
      newActiveDatasets = remove(
        newActiveDatasets,
        (l) => l.dataset !== dataset
      );
    } else {
      newActiveDatasets = [
        {
          dataset,
          opacity: 1,
          visibility: true,
          layers: [layer],
          ...(activeCompareSide && {
            mapSide: activeCompareSide,
          }),
        },
      ].concat([...newActiveDatasets]);
    }

    this.props.setMapSettings({
      datasets: newActiveDatasets || [],
      ...(enable && { canBound: true }),
    });

    trackEvent({
      category: "Map data",
      action: enable ? "User turns on a layer" : "User turns off a layer",
      label: layer,
    });
  };

  onToggleMobileMenu = (slug) => {
    const { setMenuSettings } = this.props;

    if (slug) {
      setMenuSettings({ menuSection: slug });
      trackEvent({
        category: "Map menu",
        action: "Select Map menu",
        label: slug,
      });
    } else {
      setMenuSettings({
        menuSection: "",
      });
    }
  };

  render() {
    const {
      className,
      datasetSections,
      mobileSections,
      activeSection,
      setMenuSettings,
      setSubCategorySettings,
      menuSection,
      loading,
      analysisLoading,
      embed,
      isDesktop,
      recentActive,
      subCategoryGroupsSelected,
      ...props
    } = this.props;
    const {
      Component,
      label,
      category,
      large,
      icon,
      collapsed,
      openSection,
      ...rest
    } = activeSection || {};

    return (
      <div className={cx("c-map-menu", className)}>
        <div className={cx("menu-tiles", "map-tour-data-layers", { embed })}>
          {isDesktop && !embed && (
            <MenuDesktop
              className="menu-desktop"
              datasetSections={datasetSections}
              setMenuSettings={setMenuSettings}
            />
          )}
          {!isDesktop && (
            <MenuMobile
              sections={mobileSections}
              onToggleMenu={this.onToggleMobileMenu}
            />
          )}
        </div>
        <MenuPanel
          className={cx("menu-panel", menuSection)}
          label={label}
          category={category}
          active={!!menuSection}
          large={large}
          isDesktop={isDesktop}
          setMenuSettings={setMenuSettings}
          loading={loading}
          collapsed={collapsed}
          onClose={() =>
            setMenuSettings({
              menuSection: "",
              datasetCategory: "",
            })
          }
          onOpen={() => setMenuSettings({ menuSection: openSection })}
        >
          {Component && (
            <Component
              menuSection={menuSection}
              isDesktop={isDesktop}
              setMenuSettings={setMenuSettings}
              onToggleLayer={this.onToggleLayer}
              onToggleSubCategoryCollapse={setSubCategorySettings}
              subCategoryGroupsSelected={subCategoryGroupsSelected}
              onToggleGroupOption={(groupKey, groupOptionValue) => {
                setMenuSettings({
                  subCategoryGroupsSelected: {
                    ...subCategoryGroupsSelected,
                    [groupKey]: groupOptionValue,
                  },
                });
              }}
              {...props}
              {...(menuSection === "datasets" && {
                ...rest,
              })}
            />
          )}
        </MenuPanel>
      </div>
    );
  }
}

MapMenu.propTypes = {
  sections: PropTypes.array,
  className: PropTypes.string,
  datasetSections: PropTypes.array,
  mobileSections: PropTypes.array,
  activeSection: PropTypes.object,
  setMenuSettings: PropTypes.func,
  layers: PropTypes.array,
  zoom: PropTypes.number,
  loading: PropTypes.bool,
  analysisLoading: PropTypes.bool,
  countries: PropTypes.array,
  countriesWithoutData: PropTypes.array,
  activeDatasets: PropTypes.array,
  setMapSettings: PropTypes.func,
  handleClickLocation: PropTypes.func,
  exploreSection: PropTypes.string,
  menuSection: PropTypes.string,
  datasetCategory: PropTypes.string,
  showAnalysis: PropTypes.func,
  location: PropTypes.object,
  isDesktop: PropTypes.bool,
  embed: PropTypes.bool,
  setMapPromptsSettings: PropTypes.func,
};

export default MapMenu;
