import { PureComponent } from "react";
import PropTypes from "prop-types";
import isEqual from "lodash/isEqual";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";

import { trackEvent } from "@/utils/analytics";

import "./styles.scss";

import drawConfig from "./config";
import { addExclusiveDraw, removeExclusiveDraw } from "./exclusive-draw";

class Draw extends PureComponent {
  state = {
    featureId: null,
  };

  componentDidMount() {
    if (this.props.drawing) {
      this.initDrawing();
    }
  }

  componentDidUpdate(prevProps) {
    const { drawing } = this.props;

    // start drawing
    if (drawing && !isEqual(drawing, prevProps.drawing)) {
      this.initDrawing();
    }

    // stop drawing
    if (!drawing && !isEqual(drawing, prevProps.drawing)) {
      this.closeDrawing();
    }
  }

  initDrawing = () => {
    const { map, onDrawComplete, drawingMode } = this.props;

    const modes = MapboxDraw.modes;
    modes.draw_rectangle = DrawRectangle;

    this.draw = new MapboxDraw({ ...drawConfig, modes: modes });

    addExclusiveDraw(map, this.draw);

    if (this.draw.changeMode) {
      this.draw.changeMode(drawingMode);
    }

    map.on("draw.create", this.handleDrawCreate);
  };

  // kept as an instance ref so closeDrawing removes only this listener, not the
  // cap-alert draw's draw.create handler that shares the same map event
  handleDrawCreate = (e) => {
    const { onDrawComplete } = this.props;
    const geoJSON = e.features && e.features[0];
    const { featureId } = this.state;
    const { id } = geoJSON;

    if (id !== featureId) {
      if (geoJSON) {
        // we set the drawn feature id to state to avoid duplicates features being sent.
        // Not sure why this event is fired multiple times when drawing polygon
        this.setState({ featureId: id }, () => {
          onDrawComplete(geoJSON);
          trackEvent({
            category: "Map analysis",
            action: "User drawn shape",
            label: "Complete",
          });
        });
      }
    }
  };

  closeDrawing = () => {
    const { map } = this.props;
    map.off("draw.create", this.handleDrawCreate);
    removeExclusiveDraw(map, this.draw);
  };

  render() {
    return null;
  }
}

Draw.propTypes = {
  map: PropTypes.object,
  drawing: PropTypes.bool,
  onDrawComplete: PropTypes.func,
};

export default Draw;
