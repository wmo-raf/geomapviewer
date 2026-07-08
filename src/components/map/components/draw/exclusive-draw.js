// Only one @mapbox/mapbox-gl-draw control can live on a map at a time: every
// instance uses the same fixed source ids ("mapbox-gl-draw-cold"/"-hot"), so
// adding a second throws `Source "mapbox-gl-draw-cold" already exists`. The
// analysis draw and the cap-alert freehand draw are separate controls in
// separate components, and React can commit the incoming one's addControl
// before the outgoing one's removeControl. Tracking the active instance on the
// map lets whoever adds a draw evict the previous one first, order-independent.

export const addExclusiveDraw = (map, draw) => {
  if (map.__activeDraw && map.__activeDraw !== draw) {
    removeExclusiveDraw(map, map.__activeDraw);
  }
  map.addControl(draw);
  map.__activeDraw = draw;
};

export const removeExclusiveDraw = (map, draw) => {
  if (map.__activeDraw !== draw) return; // already evicted by another draw
  try {
    map.removeControl(draw);
  } catch (e) {
    // control already detached from the map
  }
  map.__activeDraw = null;
};
