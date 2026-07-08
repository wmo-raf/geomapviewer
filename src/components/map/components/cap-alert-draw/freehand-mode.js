import MapboxDraw from "@mapbox/mapbox-gl-draw";

// Freehand polygon mode for @mapbox/mapbox-gl-draw: click-drag to trace an area
// instead of placing vertices one click at a time.
//
// Vendored (ISC) from github.com/bemky/mapbox-gl-draw-freehand-mode rather than
// depending on the npm package, which is buggy against our draw 1.5 stack: its
// zoom-based simplify tolerance collapsed the trace into a triangle at low/mid
// zoom (upstream issues #2, #11). We keep the raw trace, which is fine for an
// alert area.
//
// NOTE: this mode is pure geometry — it does not touch panning. Turning panning
// off during the draw is done by the caller, because two mechanisms are live:
// react-map-gl's controller (the `dragPan` prop on <Map>) and maplibre's native
// dragPan handler (disabled in CapAlertDraw). See those two spots.

const { geojsonTypes, cursors, modes } = MapboxDraw.constants;
const DrawPolygon = MapboxDraw.modes.draw_polygon;

const FreehandMode = { ...DrawPolygon };

FreehandMode.onSetup = function () {
  const polygon = this.newFeature({
    type: geojsonTypes.FEATURE,
    properties: {},
    geometry: { type: geojsonTypes.POLYGON, coordinates: [[]] },
  });

  this.addFeature(polygon);
  this.clearSelectedFeatures();
  this.updateUIClasses({ mouse: cursors.ADD });
  this.setActionableState({ trash: true });

  return { polygon, currentVertexPosition: 0, dragMoving: false };
};

FreehandMode.onDrag = FreehandMode.onTouchMove = function (state, e) {
  state.dragMoving = true;
  this.updateUIClasses({ mouse: cursors.ADD });
  state.polygon.updateCoordinate(
    `0.${state.currentVertexPosition}`,
    e.lngLat.lng,
    e.lngLat.lat
  );
  state.currentVertexPosition++;
  state.polygon.updateCoordinate(
    `0.${state.currentVertexPosition}`,
    e.lngLat.lng,
    e.lngLat.lat
  );
};

FreehandMode.onMouseUp = FreehandMode.onTouchEnd = function (state) {
  if (!state.dragMoving) return;
  // Hand the finished ring to simple_select; the mode switch runs draw_polygon's
  // inherited onStop, which trims the trailing vertex and fires draw.create.
  this.changeMode(modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
};

export default FreehandMode;
