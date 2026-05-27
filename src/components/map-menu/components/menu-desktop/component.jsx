import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { trackEvent } from "@/utils/analytics";

import MenuTile from "../menu-tile";

import "./styles.scss";

class MenuDesktop extends PureComponent {
  render() {
    const { className, datasetSections, setMenuSettings } = this.props;

    return (
      <div className={cx("c-menu-desktop", className)}>
        <ul className="datasets-menu">
          {datasetSections &&
            datasetSections
              .filter((s) => !s.hiddenMobile)
              .map((s) => (
                <MenuTile
                  className="datasets-tile"
                  key={`${s.slug}_${s.category}`}
                  {...s}
                  label={s.category}
                  onClick={() => {
                    setMenuSettings({
                      datasetCategory: s.active ? "" : s.category,
                      menuSection: s.active ? "" : s.slug,
                    });
                    if (!s.active) {
                      trackEvent({
                        category: "Map menu",
                        action: "Select Map menu",
                        label: s.slug,
                      });
                    }
                  }}
                />
              ))}
        </ul>
      </div>
    );
  }
}

MenuDesktop.propTypes = {
  datasetSections: PropTypes.array,
  setMenuSettings: PropTypes.func,
  className: PropTypes.string,
};

export default MenuDesktop;
