import { PureComponent } from "react";
import PropTypes from "prop-types";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import { trackEvent } from "@/utils/analytics";

import drawConfig from "../draw/config";

// Lightweight polygon draw for the "Create alert" flow.
// Deliberately NOT wired to the geostore: onComplete just hands the geometry
// back to Redux. The completed polygon stays visible (mapbox-gl-draw switches
// to simple_select) while the confirm popup is shown.
class CapAlertDraw extends PureComponent {
  componentDidMount() {
    if (this.props.active) this.start();
  }

  componentDidUpdate(prevProps) {
    const { active, geometry } = this.props;

    if (active && !prevProps.active) this.start();
    if (!active && prevProps.active) this.stop();
    // "Start over": geometry cleared while still active -> wipe and redraw.
    if (active && prevProps.geometry && !geometry) this.reset();
  }

  componentWillUnmount() {
    if (this.draw) this.stop();
  }

  handleCreate = (e) => {
    const feature = e.features && e.features[0];

    if (!feature) return;

    this.props.onComplete(feature.geometry);

    trackEvent({
      category: "Map alert",
      action: "User drew alert area",
    });
  };

  start = () => {
    const { map } = this.props;

    this.draw = new MapboxDraw({ ...drawConfig });
    map.addControl(this.draw);
    this.draw.changeMode("draw_polygon");
    map.on("draw.create", this.handleCreate);
  };

  reset = () => {
    if (!this.draw) return;

    this.draw.deleteAll();
    this.draw.changeMode("draw_polygon");
  };

  stop = () => {
    const { map } = this.props;

    map.off("draw.create", this.handleCreate);

    if (this.draw) {
      map.removeControl(this.draw);
      this.draw = null;
    }
  };

  render() {
    return null;
  }
}

CapAlertDraw.propTypes = {
  map: PropTypes.object,
  active: PropTypes.bool,
  geometry: PropTypes.object,
  onComplete: PropTypes.func,
};

export default CapAlertDraw;
