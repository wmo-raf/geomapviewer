/**
 * Tests for WMS capabilities reading from src/utils/wms.js, on top of ogc-client
 *
 * WMS 1.3.0 spec reference: OGC 06-042, Annex C (Table C.2) and Annex D.
 *
 * Table C.2 — Syntax for listing one or more extent values:
 *   value                              A single value
 *   value1,value2,value3,...           A list of multiple values
 *   min/max/resolution                An interval with bounds and resolution
 *   min1/max1/res1,min2/max2/res2,... A list of multiple intervals
 *   (and mixed combinations of the above)
 */

// a timezone with DST: the change on 2026-10-25 must not shift the timestamps
process.env.TZ = "Europe/Paris";

const {
  extractTimestamps,
  extractLegendUrl,
  getWmsLayerInfo,
} = require("../wms");

const WMS_URL = "https://example.com/wms";

// Helper: builds a WMS 1.3.0 capabilities document, with a nested layer
function capabilities(layerContent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Test</Title></Service>
  <Capability>
    <Layer>
      <Title>Root</Title>
      <Layer>
        <Title>Group</Title>
        <Layer queryable="1">
          <Name>test</Name>
          <Title>Test</Title>
          ${layerContent}
        </Layer>
      </Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
}

// Helper: reads a layer time dimension through ogc-client
async function timestampsOf(dimensionValues, max) {
  global.fetch = jest.fn(
    async () =>
      new Response(
        capabilities(
          `<Dimension name="time" units="ISO8601">${dimensionValues}</Dimension>`
        ),
        { headers: { "Content-Type": "text/xml" } }
      )
  );
  const { WmsEndpoint } = require("@camptocamp/ogc-client");
  const endpoint = await new WmsEndpoint(WMS_URL).isReady();
  return extractTimestamps(endpoint.getLayerByName("test"), max);
}

// ===========================================================================
//  extractTimestamps
// ===========================================================================

describe("extractTimestamps", () => {
  test("single value", async () => {
    expect(await timestampsOf("2024-01-15T00:00:00Z")).toEqual([
      "2024-01-15T00:00:00.000Z",
    ]);
  });

  test("comma-separated values, sorted", async () => {
    expect(
      await timestampsOf("2024-03-01T00:00:00Z,2024-01-01T00:00:00Z")
    ).toEqual(["2024-01-01T00:00:00.000Z", "2024-03-01T00:00:00.000Z"]);
  });

  test("interval, end included", async () => {
    expect(
      await timestampsOf("2024-01-01T00:00:00Z/2024-01-01T12:00:00Z/PT6H")
    ).toEqual([
      "2024-01-01T00:00:00.000Z",
      "2024-01-01T06:00:00.000Z",
      "2024-01-01T12:00:00.000Z",
    ]);
  });

  test("interval with months", async () => {
    const result = await timestampsOf(
      "2024-01-01T00:00:00Z/2024-06-01T00:00:00Z/P1M"
    );
    expect(result).toHaveLength(6);
    expect(result[5]).toBe("2024-06-01T00:00:00.000Z");
  });

  test("mixed values and intervals from a real WMS server", async () => {
    const result = await timestampsOf(
      "2026-10-15T00:00:00Z,2026-10-15T03:00:00Z/2026-10-26T06:00:00Z/PT3H,2026-10-26T12:00:00Z/2026-10-30T00:00:00Z/PT6H"
    );

    // 1 value + 90 values every 3 hours + 15 values every 6 hours
    expect(result).toHaveLength(106);
    expect(result[0]).toBe("2026-10-15T00:00:00.000Z");
    expect(result).toContain("2026-10-20T06:00:00.000Z");
    expect(result).toContain("2026-10-26T06:00:00.000Z");
    expect(result).toContain("2026-10-26T12:00:00.000Z");
    expect(result[105]).toBe("2026-10-30T00:00:00.000Z");
    // no timestamp shifted by the DST change
    result.forEach((t) => expect(new Date(t).getUTCHours() % 3).toBe(0));
  });

  test("keeps the latest timestamps of a large interval", async () => {
    const result = await timestampsOf(
      "2024-01-01T00:00:00Z/2024-12-31T00:00:00Z/PT1H",
      48
    );
    expect(result).toHaveLength(48);
    expect(result[0]).toBe("2024-12-29T01:00:00.000Z");
    expect(result[47]).toBe("2024-12-31T00:00:00.000Z");
  });

  test("keeps the latest timestamps across intervals", async () => {
    const result = await timestampsOf(
      "2024-01-01T00:00:00Z/2024-01-10T00:00:00Z/P1D,2024-01-10T00:00:00Z/2024-01-11T00:00:00Z/PT6H",
      6
    );
    expect(result).toEqual([
      "2024-01-09T00:00:00.000Z",
      "2024-01-10T00:00:00.000Z",
      "2024-01-10T06:00:00.000Z",
      "2024-01-10T12:00:00.000Z",
      "2024-01-10T18:00:00.000Z",
      "2024-01-11T00:00:00.000Z",
    ]);
  });

  test("ignores intervals with bounds ogc-client cannot parse", async () => {
    expect(await timestampsOf("19830101/20260331/PT5M")).toEqual([]);
  });

  test("handles values read from the ogc-client cache, as ISO strings", () => {
    const layer = {
      timeDimension: {
        values: [
          "2024-01-01T00:00:00.000Z",
          {
            begin: "2024-01-02T00:00:00.000Z",
            end: "2024-01-03T00:00:00.000Z",
            period: { years: 0, months: 0, days: 1, hours: 0, minutes: 0, seconds: 0 },
          },
        ],
      },
    };
    expect(extractTimestamps(layer)).toEqual([
      "2024-01-01T00:00:00.000Z",
      "2024-01-02T00:00:00.000Z",
      "2024-01-03T00:00:00.000Z",
    ]);
  });

  test("returns null without time dimension", () => {
    expect(extractTimestamps({})).toBeNull();
    expect(extractTimestamps(null)).toBeNull();
  });
});

// ===========================================================================
//  extractLegendUrl
// ===========================================================================

describe("extractLegendUrl", () => {
  const layer = {
    styles: [
      { name: "default", legendUrl: "https://example.com/default.png" },
      { name: "Temperature", legendUrl: "https://example.com/temp.png" },
    ],
  };

  test("returns the legend of the given style, case-insensitive", () => {
    expect(extractLegendUrl(layer, "temperature")).toBe(
      "https://example.com/temp.png"
    );
  });

  test("falls back to the first style", () => {
    expect(extractLegendUrl(layer, "unknown")).toBe(
      "https://example.com/default.png"
    );
    expect(extractLegendUrl(layer, null)).toBe(
      "https://example.com/default.png"
    );
  });

  test("returns null without styles", () => {
    expect(extractLegendUrl({}, "default")).toBeNull();
  });
});

// ===========================================================================
//  getWmsLayerInfo — integration with ogc-client
// ===========================================================================

describe("getWmsLayerInfo", () => {
  const xml = capabilities(`
    <Style>
      <Name>default</Name>
      <Title>Default</Title>
      <LegendURL width="20" height="20">
        <Format>image/png</Format>
        <OnlineResource xlink:type="simple" xlink:href="https://example.com/legend.png"/>
      </LegendURL>
    </Style>
    <Dimension name="time" units="ISO8601" default="2024-01-02T00:00:00Z">2024-01-01T00:00:00Z/2024-01-03T00:00:00Z/P1D</Dimension>`);

  beforeEach(() => {
    global.fetch = jest.fn(
      async () =>
        new Response(xml, { headers: { "Content-Type": "text/xml" } })
    );
  });

  test("reads timestamps and legend of a nested layer", async () => {
    expect(await getWmsLayerInfo(WMS_URL, "test", "default")).toEqual({
      timestamps: [
        "2024-01-01T00:00:00.000Z",
        "2024-01-02T00:00:00.000Z",
        "2024-01-03T00:00:00.000Z",
      ],
      legendUrl: "https://example.com/legend.png",
    });
  });

  test("returns an empty object for an unknown layer", async () => {
    expect(await getWmsLayerInfo(WMS_URL, "unknown")).toEqual({});
  });

  test("returns an empty object when the capabilities cannot be fetched", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn(async () => {
      throw new Error("network error");
    });
    expect(await getWmsLayerInfo("https://example.com/other", "test")).toEqual(
      {}
    );
  });
});
