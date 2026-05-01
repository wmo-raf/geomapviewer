// Converts a backend `colorRamp` into a pixel color function compatible with
// @geomatico/maplibre-cog-protocol `setColorFunction`.
//
// Backend shape:
//   {
//     type: "step" | "interpolate",
//     min: number, max: number,
//     stops: [{ value: number, color: "#rrggbb" | "rgba(...)" }],
//     restColor?: string,   // color for values > last stop.value
//     noDataColor?: string  // optional; defaults to transparent
//   }

const TRANSPARENT = [0, 0, 0, 0];

const parseColor = (input) => {
  if (!input) return null;
  const s = String(input).trim();

  if (s.startsWith("#")) {
    const hex = s.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    if (full.length !== 6 && full.length !== 8) return null;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) : 255;
    return [r, g, b, a];
  }

  const rgbMatch = s.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i
  );
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    const a =
      rgbMatch[4] !== undefined
        ? Math.round(parseFloat(rgbMatch[4]) * 255)
        : 255;
    return [r, g, b, a];
  }

  return null;
};

const lerp = (a, b, t) => a + (b - a) * t;

const interpolateColor = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
  Math.round(lerp(c1[3], c2[3], t)),
];

// Builds a `(pixel, color, metadata) => void` function suitable for
// `setColorFunction(cogUrl, fn)` from the COG protocol library.
export const buildColorFunction = (colorRamp) => {
  if (!colorRamp || !Array.isArray(colorRamp.stops) || !colorRamp.stops.length) {
    return null;
  }

  const stops = colorRamp.stops
    .map((s) => ({ value: s.value, color: parseColor(s.color) }))
    .filter((s) => s.color)
    .sort((a, b) => a.value - b.value);

  if (!stops.length) return null;

  const restColor =
    parseColor(colorRamp.restColor) || stops[stops.length - 1].color;
  const noDataColor = parseColor(colorRamp.noDataColor) || TRANSPARENT;
  const isInterpolate = colorRamp.type === "interpolate";

  return (pixel, color, metadata) => {
    const v = pixel[0];
    const noData = metadata && metadata.noData;
    if (
      v === undefined ||
      v === null ||
      Number.isNaN(v) ||
      (noData !== undefined && noData !== null && v === noData)
    ) {
      color.set(noDataColor);
      return;
    }

    if (isInterpolate) {
      if (v <= stops[0].value) {
        color.set(stops[0].color);
        return;
      }
      if (v >= stops[stops.length - 1].value) {
        color.set(restColor);
        return;
      }
      for (let i = 1; i < stops.length; i++) {
        if (v <= stops[i].value) {
          const prev = stops[i - 1];
          const curr = stops[i];
          const span = curr.value - prev.value;
          const t = span === 0 ? 0 : (v - prev.value) / span;
          color.set(interpolateColor(prev.color, curr.color, t));
          return;
        }
      }
      color.set(restColor);
      return;
    }

    // step / discrete: each stop.color applies up to and including stop.value
    for (let i = 0; i < stops.length; i++) {
      if (v <= stops[i].value) {
        color.set(stops[i].color);
        return;
      }
    }
    color.set(restColor);
  };
};
