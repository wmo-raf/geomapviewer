import React from "react";
import PropTypes from "prop-types";

import "./styles.scss";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "n/a";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const WmsFeatureInfo = ({ data }) => {
  const { wmsFeatures = [], loading, error } = data?.data || {};

  if (loading) {
    return <div className="c-wms-feature-info loading">Loading…</div>;
  }

  if (error) {
    return <div className="c-wms-feature-info error">{error}</div>;
  }

  if (!wmsFeatures.length) {
    return <div className="c-wms-feature-info">No feature info returned.</div>;
  }

  return (
    <div className="c-wms-feature-info">
      {wmsFeatures.map((feature, idx) => {
        const properties = feature?.properties || {};
        const entries = Object.entries(properties);

        return (
          <div key={idx} className="feature">
            {wmsFeatures.length > 1 && (
              <div className="feature-title">Feature {idx + 1}</div>
            )}
            {entries.length === 0 ? (
              <div className="empty">No attributes.</div>
            ) : (
              <div className="table">
                {entries.map(([key, value]) => (
                  <div key={key} className="wrapper">
                    <div className="label">{key}:</div>
                    <div className="value">{formatValue(value)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

WmsFeatureInfo.propTypes = {
  data: PropTypes.object,
};

export default WmsFeatureInfo;
