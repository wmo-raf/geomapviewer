import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import { trackEvent } from "@/utils/analytics";
import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";

import alertIcon from "@/assets/icons/alert.svg?sprite";

import "./styles.scss";

// Standalone "Create alert" overlay: a top-right toggle that starts a
// geostore-free polygon draw, then a small confirm popup once a zone is drawn.
class CapAlertControl extends PureComponent {
  static propTypes = {
    capAlertActive: PropTypes.bool,
    capAlertGeometry: PropTypes.object,
    capConfig: PropTypes.object,
    loggedIn: PropTypes.bool,
    setMapSettings: PropTypes.func,
    setMainMapSettings: PropTypes.func,
  };

  get enabled() {
    const { loggedIn, capConfig } = this.props;
    return !!(
      loggedIn &&
      capConfig &&
      capConfig.enabled &&
      capConfig.createAlertUrl
    );
  }

  handleToggle = () => {
    const { capAlertActive, setMapSettings, setMainMapSettings } = this.props;

    if (capAlertActive) {
      setMapSettings({ capAlertActive: false, capAlertGeometry: null });
    } else {
      // starting the alert draw: turn off the analysis draw and close the
      // analysis panel so the alert flow isn't stuck in the geostore view left
      // over from a previous analysis draw
      setMapSettings({
        capAlertActive: true,
        capAlertGeometry: null,
        drawing: false,
      });
      setMainMapSettings({ showAnalysis: false });
    }
  };

  handleRestart = () => {
    // keep the session active, just clear the drawn zone -> CapAlertDraw resets
    this.props.setMapSettings({ capAlertGeometry: null });
  };

  handleCancel = () => {
    this.props.setMapSettings({ capAlertActive: false, capAlertGeometry: null });
  };

  handleCreate = () => {
    const { capConfig, capAlertGeometry, setMapSettings } = this.props;

    if (!capAlertGeometry || !capConfig?.createAlertUrl) return;

    // POST the geometry via a hidden auto-submitted form so a detailed polygon
    // can't blow past GET URL length limits. Opens the prefilled Wagtail add
    // form in a new tab.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = capConfig.createAlertUrl;
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "geometry";
    input.value = JSON.stringify(capAlertGeometry);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);

    trackEvent({
      category: "Map alert",
      action: "User creates CAP alert from area",
    });

    setMapSettings({ capAlertActive: false, capAlertGeometry: null });
  };

  render() {
    const { capAlertActive, capAlertGeometry } = this.props;

    if (!this.enabled) return null;

    return (
      <div className="c-cap-alert-control">
        <Button
          className="cap-alert-btn"
          active={capAlertActive}
          onClick={this.handleToggle}
          tooltip={{
            text: capAlertActive
              ? "Click and drag on the map to draw the area"
              : "Draw an area to create an alert",
            position: "left",
          }}
        >
          <Icon
            icon={alertIcon}
            className={cx("cap-alert-icon", { "-active": capAlertActive })}
          />
          <span className="cap-alert-btn__label">
            {capAlertActive ? "Drawing…" : "Create an alert"}
          </span>
        </Button>

        {capAlertActive && capAlertGeometry && (
          <div className="cap-alert-popup">
            <p className="cap-alert-popup__title">Area drawn</p>
            <div className="cap-alert-popup__actions">
              <Button
                theme="theme-button-light"
                className="cap-alert-popup__btn cap-alert-popup__btn--primary"
                onClick={this.handleCreate}
              >
                Create alert
              </Button>
              <Button
                theme="theme-button-grey"
                className="cap-alert-popup__btn"
                onClick={this.handleRestart}
              >
                Start over
              </Button>
              <Button
                theme="theme-button-clear"
                className="cap-alert-popup__btn"
                onClick={this.handleCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default CapAlertControl;
