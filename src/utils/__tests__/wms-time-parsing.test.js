/**
 * Tests for WMS TIME dimension parsing logic from src/utils/wms.js
 *
 * WMS 1.3.0 spec reference: OGC 06-042, Annex C (Table C.2) and Annex D.
 *
 * Table C.2 — Syntax for listing one or more extent values:
 *   value                              A single value
 *   value1,value2,value3,...           A list of multiple values
 *   min/max/resolution                An interval with bounds and resolution
 *   min1/max1/res1,min2/max2/res2,... A list of multiple intervals
 *   (and mixed combinations of the above)
 *
 * Annex D — ISO 8601 profile for WMS:
 *   Timestamps: ccyy-mm-ddThh:mm:ss.sssZ (precision may be reduced)
 *   Compact:    ccyymmdd (basic format without separators)
 *   Periods:    P[nY][nM][nD][T[nH][nM][nS]]
 */

const {
  parseISO8601Duration,
  normalizeDate,
  getValidTimestamps,
  parseTimeValues,
  extractTimestamps,
} = require("../wms");

// Helper: builds a mock WMS layer object for extractTimestamps
function mockLayer(timeValues) {
  return { Dimension: [{ name: "time", values: timeValues }] };
}

// ===========================================================================
//  normalizeDate
// ===========================================================================

describe("normalizeDate", () => {
  test("passes through extended ISO timestamps unchanged", () => {
    expect(normalizeDate("2024-01-15T00:00:00Z")).toBe("2024-01-15T00:00:00Z");
  });

  test("passes through extended ISO dates unchanged", () => {
    expect(normalizeDate("2024-01-15")).toBe("2024-01-15");
  });

  test("converts compact YYYYMMDD to extended format", () => {
    expect(normalizeDate("19830101")).toBe("1983-01-01");
  });

  test("converts compact date 20260331", () => {
    expect(normalizeDate("20260331")).toBe("2026-03-31");
  });
});

// ===========================================================================
//  parseISO8601Duration
// ===========================================================================

describe("parseISO8601Duration", () => {
  test("P1D — 1 day", () => {
    expect(parseISO8601Duration("P1D")).toBe(86400000);
  });

  test("P7D — 7 days", () => {
    expect(parseISO8601Duration("P7D")).toBe(7 * 86400000);
  });

  test("PT15M — 15 minutes", () => {
    expect(parseISO8601Duration("PT15M")).toBe(15 * 60 * 1000);
  });

  test("PT30M — 30 minutes", () => {
    expect(parseISO8601Duration("PT30M")).toBe(30 * 60 * 1000);
  });

  test("PT1H — 1 hour", () => {
    expect(parseISO8601Duration("PT1H")).toBe(3600000);
  });

  test("PT3H — 3 hours", () => {
    expect(parseISO8601Duration("PT3H")).toBe(3 * 3600000);
  });

  test("PT6H — 6 hours", () => {
    expect(parseISO8601Duration("PT6H")).toBe(6 * 3600000);
  });

  test("PT5M — 5 minutes", () => {
    expect(parseISO8601Duration("PT5M")).toBe(5 * 60 * 1000);
  });

  test("PT30S — 30 seconds", () => {
    expect(parseISO8601Duration("PT30S")).toBe(30000);
  });

  test("PT1.5S — 1.5 seconds (fractional)", () => {
    expect(parseISO8601Duration("PT1.5S")).toBe(1500);
  });

  test("P1Y — 1 year", () => {
    expect(parseISO8601Duration("P1Y")).toBeGreaterThan(364 * 86400000);
  });

  test("P1M — 1 month", () => {
    expect(parseISO8601Duration("P1M")).toBeGreaterThan(27 * 86400000);
  });
});

// ===========================================================================
//  getValidTimestamps
// ===========================================================================

describe("getValidTimestamps", () => {
  test("expands daily range", () => {
    const result = getValidTimestamps(
      "2024-01-01T00:00:00Z",
      "2024-01-04T00:00:00Z",
      "P1D"
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toContain("2024-01-01");
    expect(result[2]).toContain("2024-01-03");
  });

  test("end time is exclusive", () => {
    const result = getValidTimestamps(
      "2024-01-01T00:00:00Z",
      "2024-01-04T00:00:00Z",
      "P1D"
    );
    expect(result).not.toContainEqual(expect.stringContaining("2024-01-04"));
  });

  test("handles compact dates", () => {
    const result = getValidTimestamps("20240101", "20240104", "P1D");
    expect(result).toHaveLength(3);
    expect(result[0]).toContain("2024-01-01");
  });
});

// ===========================================================================
//  parseTimeValues — Format 1: comma-separated discrete values
// ===========================================================================

describe("parseTimeValues — comma-separated values", () => {
  test("single ISO timestamp", () => {
    const result = parseTimeValues("2024-01-15T00:00:00Z");
    expect(result).toEqual(["2024-01-15T00:00:00Z"]);
  });

  test("multiple ISO timestamps (sorted on output)", () => {
    const input =
      "2024-03-01T00:00:00Z,2024-01-01T00:00:00Z,2024-02-01T00:00:00Z";
    const result = parseTimeValues(input);
    expect(result).toEqual([
      "2024-01-01T00:00:00Z",
      "2024-02-01T00:00:00Z",
      "2024-03-01T00:00:00Z",
    ]);
  });

  test("date-only values — spec allows reduced precision", () => {
    const input = "2024-01-01,2024-01-02,2024-01-03";
    const result = parseTimeValues(input);
    expect(result).toHaveLength(3);
  });

  test("returns null for empty string", () => {
    expect(parseTimeValues("")).toBeNull();
    expect(parseTimeValues(null)).toBeNull();
    expect(parseTimeValues(undefined)).toBeNull();
  });
});

// ===========================================================================
//  parseTimeValues — Format 2: single range start/end/period
// ===========================================================================

describe("parseTimeValues — single range", () => {
  test("daily interval — P1D", () => {
    const input = "1995-04-22T12:00Z/1995-04-25T12:00Z/P1D";
    const result = parseTimeValues(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toContain("1995-04-22");
    expect(result[2]).toContain("1995-04-24");
  });

  test("sub-daily PT15M — truncated to last 2 days", () => {
    const input =
      "2020-09-01T00:00:00.000Z/2026-04-04T10:15:00.000Z/PT15M";
    const result = parseTimeValues(input);
    // 2 days / 15 min = 192 timestamps
    expect(result).toHaveLength(192);
  });

  test("sub-daily PT3H — truncated to last 2 days", () => {
    const input =
      "2026-03-30T03:00:00Z/2026-04-10T00:00:00Z/PT3H";
    const result = parseTimeValues(input);
    // 2 days / 3 hours = 16 timestamps
    expect(result).toHaveLength(16);
  });

  test("large daily range", () => {
    const input = "1996-01-01/2003-10-17/P1D";
    const result = parseTimeValues(input);
    expect(result.length).toBeGreaterThan(2800);
  });
});

// ===========================================================================
//  parseTimeValues — Format 3: compact dates (YYYYMMDD)
// ===========================================================================

describe("parseTimeValues — compact ISO dates", () => {
  test("19830101/20260331/PT5M — compact dates with sub-daily interval", () => {
    const input = "19830101/20260331/PT5M";
    const result = parseTimeValues(input);
    // Sub-daily -> limited to last 2 days before end date (2026-03-31)
    // Exact count depends on timezone offset of subDays result
    expect(result.length).toBeGreaterThan(500);
    expect(result.length).toBeLessThanOrEqual(576);
    // Dates should be valid ISO
    expect(new Date(result[0]).toString()).not.toBe("Invalid Date");
    // Last timestamps should be near 2026-03-31
    expect(result[result.length - 1]).toContain("2026-03-30");
  });

  test("compact dates with daily interval", () => {
    const input = "20240101/20240105/P1D";
    const result = parseTimeValues(input);
    expect(result).toHaveLength(4);
    expect(result[0]).toContain("2024-01-01");
    expect(result[3]).toContain("2024-01-04");
  });
});

// ===========================================================================
//  parseTimeValues — Mixed format: values + intervals
// ===========================================================================

describe("parseTimeValues — mixed values and intervals", () => {
  test("real-world: single value + two intervals with different steps", () => {
    const input =
      "2026-03-30T00:00:00Z,2026-03-30T03:00:00Z/2026-04-10T00:00:00Z/PT3H,2026-04-10T06:00:00Z/2026-04-14T00:00:00Z/PT6H";
    const result = parseTimeValues(input);

    // First item: single value "2026-03-30T00:00:00Z"
    expect(result).toContainEqual(
      expect.stringContaining("2026-03-30T00:00:00")
    );

    // Second item: PT3H interval (sub-daily -> 2 days limit)
    // 2 days / 3h = 16 timestamps from that range

    // Third item: PT6H interval (sub-daily -> 2 days limit)
    // 2 days / 6h = 8 timestamps from that range

    // Total: 1 + 16 + 8 = 25
    expect(result).toHaveLength(25);

    // Results are sorted chronologically
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i]).getTime()).toBeGreaterThanOrEqual(
        new Date(result[i - 1]).getTime()
      );
    }
  });

  test("multiple intervals without single values", () => {
    const input =
      "2024-01-01T00:00:00Z/2024-01-04T00:00:00Z/P1D,2024-06-01T00:00:00Z/2024-06-04T00:00:00Z/P1D";
    const result = parseTimeValues(input);
    // 3 + 3 = 6 timestamps
    expect(result).toHaveLength(6);
    expect(result[0]).toContain("2024-01-01");
    expect(result[5]).toContain("2024-06-03");
  });

  test("single values mixed with intervals", () => {
    const input =
      "2024-01-15T00:00:00Z,2024-02-01T00:00:00Z/2024-02-04T00:00:00Z/P1D,2024-12-25T00:00:00Z";
    const result = parseTimeValues(input);
    // 1 + 3 + 1 = 5 timestamps
    expect(result).toHaveLength(5);
    expect(result[0]).toContain("2024-01-15");
    expect(result[4]).toContain("2024-12-25");
  });
});

// ===========================================================================
//  extractTimestamps — integration with layer object
// ===========================================================================

describe("extractTimestamps — with layer object", () => {
  test("extracts timestamps from layer Dimension", () => {
    const layer = mockLayer(
      "2024-01-01T00:00:00Z,2024-02-01T00:00:00Z,2024-03-01T00:00:00Z"
    );
    const result = extractTimestamps(layer);
    expect(result).toHaveLength(3);
  });

  test("returns null when no time dimension", () => {
    const layer = { Dimension: [{ name: "elevation", values: "0/100/10" }] };
    expect(extractTimestamps(layer)).toBeNull();
  });

  test("returns null when Dimension is missing", () => {
    expect(extractTimestamps({})).toBeNull();
  });

  test("handles mixed format from real WMS server", () => {
    const layer = mockLayer(
      "2026-03-30T00:00:00Z,2026-03-30T03:00:00Z/2026-04-10T00:00:00Z/PT3H,2026-04-10T06:00:00Z/2026-04-14T00:00:00Z/PT6H"
    );
    const result = extractTimestamps(layer);
    expect(result.length).toBeGreaterThan(1);
    expect(result).toContainEqual(
      expect.stringContaining("2026-03-30T00:00:00")
    );
  });
});
