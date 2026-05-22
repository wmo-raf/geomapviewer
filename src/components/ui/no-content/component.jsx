import React from "react";
import PropTypes from "prop-types";

import satellite from "@/assets/icons/satellite.png";

import "./styles.scss";

const NoContent = ({ className, message, icon = false, children }) => (
  <div className={`c-no-content ${className}`}>
    <p className="message">
      {children || message}
      {icon && <img className="message-icon" src={satellite} alt="tree" />}
    </p>
  </div>
);

NoContent.propTypes = {
  icon: PropTypes.bool,
  className: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node,
};

export default NoContent;
