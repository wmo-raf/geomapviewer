import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import cx from "classnames";

import Icon from "@/components/ui/icon";
import MyAccount from "@/components/map-menu/components/sections/my-account";

import userIcon from "@/assets/icons/user.svg?sprite";
import closeIcon from "@/assets/icons/close.svg?sprite";

import "./styles.scss";

class MapHeaderUser extends Component {
  static propTypes = {
    loggedIn: PropTypes.bool,
    userData: PropTypes.object,
    enableMyAccount: PropTypes.bool,
  };

  state = { open: false };

  containerRef = createRef();

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.loggedIn && this.props.loggedIn && this.state.open) {
      this.setState({ open: false });
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  closePanel = () => {
    this.setState({ open: false });
  };

  handleClickOutside = (e) => {
    if (
      this.containerRef.current &&
      !this.containerRef.current.contains(e.target)
    ) {
      this.setState({ open: false });
    }
  };

  toggleOpen = () => {
    this.setState((s) => ({ open: !s.open }));
  };

  renderTrigger() {
    const { loggedIn, userData } = this.props;

    if (!loggedIn) {
      return (
        <button
          type="button"
          className="map-header-user__login"
          onClick={this.toggleOpen}
        >
          Log in
        </button>
      );
    }

    const { full_name, first_name, username, email, avatar } = userData || {};
    const label = full_name || first_name || username || email || "Account";

    return (
      <button
        type="button"
        className="map-header-user__trigger"
        onClick={this.toggleOpen}
        aria-haspopup="true"
        aria-expanded={this.state.open}
      >
        <span className="map-header-user__name">{label}</span>
        <span className="map-header-user__avatar">
          {avatar ? (
            <img
              src={avatar}
              alt={label}
              className="map-header-user__avatar-image"
            />
          ) : (
            <Icon icon={userIcon} className="map-header-user__avatar-icon" />
          )}
        </span>
      </button>
    );
  }

  render() {
    const { enableMyAccount } = this.props;
    const { open } = this.state;

    if (enableMyAccount === false) return null;

    return (
      <div
        className={cx("c-map-header-user", { open })}
        ref={this.containerRef}
      >
        {this.renderTrigger()}
        {open && (
          <div className="map-header-user__dropdown">
            <button
              type="button"
              className="map-header-user__close"
              onClick={this.closePanel}
              aria-label="Close"
            >
              <Icon icon={closeIcon} className="map-header-user__close-icon" />
            </button>
            <div className="map-header-user__dropdown-body">
              <MyAccount isDesktop />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default MapHeaderUser;
