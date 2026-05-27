import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import "./styles.scss";

class LegendTypeChoroplethVertical extends PureComponent {
  static propTypes = {
    activeLayer: PropTypes.shape({}),
  };

  static defaultProps = {
    activeLayer: {},
  };

  render() {
    const { activeLayer } = this.props;
    const { legendConfig } = activeLayer;

    if (!legendConfig || legendConfig.type !== "choropleth_vertical") {
      return null;
    }

    return (
      <div className="c-legend-type-choropleth-vertical">
        {legendConfig.units && (
          <div className="units">{legendConfig.units}</div>
        )}
        <table>
          <tbody>
            {legendConfig.items.map(({ color, name }, i) => {
              return (
                <tr key={`${name}-${color}-${i}`}>
                  <th>
                    <span style={{ backgroundColor: color }}></span>
                  </th>
                  <td>{name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default LegendTypeChoroplethVertical;
