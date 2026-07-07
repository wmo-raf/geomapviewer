import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Desktop, Mobile } from "@erick-otenyo/hw-components";

import ConfigProvider from "@/providers/config-provider";
import CountryDataProvider from "@/providers/country-data-provider";
import GeostoreProvider from "@/providers/geostore-provider";
import DatasetsProvider from "@/providers/datasets-provider";
import AuthProvider from "@/providers/auth-provider";
import AOIProvider from "@/providers/aoi-provider";

import ModalWelcome from "@/components/modals/welcome";
import MetaModal from "@/components/modals/meta";
import ShareModal from "@/components/modals/share";
import ProfileModal from "@/components/modals/profile";
import AreaOfInterestModal from "@/components/modals/area-of-interest";

import MapPrint from "@/components/map-print";
import Map from "@/components/map";
import MapPrompts from "@/components/prompts/map-prompts";
import MapMenu from "@/components/map-menu";

import DataAnalysisMenu from "./components/data-analysis-menu";
import MapControlButtons from "./components/map-controls";
import CapAlertControl from "./components/cap-alert-control";
import MapHeader from "./components/map-header";

import "./styles.scss";

class MainMapComponent extends PureComponent {
  state = { locationReady: false, mapPrintConfig: null };

  handleOnGetMapPrintConfig = (mapPrintConfig) => {
    this.setState({ mapPrintConfig: mapPrintConfig });
  };

  handleonPrintCancel = () => {
    const { setMapSettings } = this.props;
    setMapSettings({ printing: false });
    this.setState({ mapPrintConfig: null });
  };

  static propTypes = {
    onDrawComplete: PropTypes.func,
    handleClickAnalysis: PropTypes.func,
    handleClickMap: PropTypes.func,
    hidePanels: PropTypes.bool,
    embed: PropTypes.bool,
    mapPrinting: PropTypes.bool,
  };

  render() {
    const {
      embed,
      hidePanels,
      handleClickMap,
      handleClickAnalysis,
      onDrawComplete,
      mapPrinting,
    } = this.props;

    const { mapPrintConfig } = this.state;

    return (
      <div className={cx("c-map-main", { embed })}>
        {mapPrinting && (
          <MapPrint
            mapPrintConfig={mapPrintConfig}
            onCancel={this.handleonPrintCancel}
          />
        )}
        <Desktop>
          <MapMenu className="map-menu" embed={embed} isDesktop />
        </Desktop>
        <Mobile>
          <MapMenu className="map-menu" embed={embed} />
        </Mobile>
        {!embed && <MapHeader />}
        <div
          className="main-map-container"
          role="button"
          tabIndex={0}
          onClick={handleClickMap}
        >
          <ConfigProvider>
            <Map
              className="main-map"
              onDrawComplete={onDrawComplete}
              onClickAnalysis={handleClickAnalysis}
              onGetMapPrintConfig={this.handleOnGetMapPrintConfig}
            />
          </ConfigProvider>
        </div>
        {!hidePanels && (
          <Desktop>
            <DataAnalysisMenu className="data-analysis-menu" embed={embed} />
          </Desktop>
        )}
        {!embed && (
          <>
            <Desktop>
              <>
                {!embed && <MapPrompts />}
                <ModalWelcome />
                <MapControlButtons className="main-map-controls" isDesktop />
              </>
            </Desktop>
            <Mobile>
              <>
                <MapControlButtons
                  className="main-map-controls"
                  isDesktop={false}
                />
              </>
            </Mobile>
            <CapAlertControl />
          </>
        )}
        <DatasetsProvider />
        <ShareModal />
        <MetaModal />
        <CountryDataProvider />
        <GeostoreProvider />
        <AuthProvider />
        <AreaOfInterestModal viewAfterSave clearAfterDelete canDelete />
        <ProfileModal />
        <AOIProvider />
      </div>
    );
  }
}
export default MainMapComponent;
