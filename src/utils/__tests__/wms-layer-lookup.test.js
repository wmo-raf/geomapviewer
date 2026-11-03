const { findLayerByName, extractLegendUrl } = require("../wms");

const legend = (layer) => ({
  Name: "default",
  LegendURL: [{ OnlineResource: `https://example.com/legend?layer=${layer}` }],
});

// Shape of the GloFAS capabilities: root > groups > layers
const rootLayer = {
  Title: "GLOFAS WMS",
  Layer: [
    {
      Name: "Static",
      Style: [legend("Static")],
      Layer: [
        { Name: "FloodHazard100y", Style: [legend("FloodHazard100y")] },
        { Name: "MajorRivers1", Style: [legend("MajorRivers1")] },
      ],
    },
    {
      Name: "Hydrological",
      Layer: [{ Name: "sumAL41EGE", Style: [legend("sumAL41EGE")] }],
    },
  ],
};

describe("findLayerByName", () => {
  test("finds a layer nested two levels deep", () => {
    const layer = findLayerByName(rootLayer, "sumAL41EGE");
    expect(layer?.Name).toBe("sumAL41EGE");
    expect(extractLegendUrl(layer)).toBe(
      "https://example.com/legend?layer=sumAL41EGE"
    );
  });

  test("finds a group layer", () => {
    expect(findLayerByName(rootLayer, "Static")?.Name).toBe("Static");
  });

  test("finds a first-level layer in a flat capabilities tree", () => {
    const flat = { Layer: [{ Name: "a" }, { Name: "b" }] };
    expect(findLayerByName(flat, "b")?.Name).toBe("b");
  });

  test("returns null when the layer does not exist", () => {
    expect(findLayerByName(rootLayer, "unknown")).toBeNull();
  });

  test("returns null for missing inputs", () => {
    expect(findLayerByName(undefined, "a")).toBeNull();
    expect(findLayerByName(rootLayer, undefined)).toBeNull();
  });
});
