import { subDays } from "date-fns";
import { parse, toSeconds } from "iso8601-duration";

export function parseISO8601Duration(durationString) {
  const seconds = toSeconds(parse(durationString));
  return seconds * 1000; // convert to milliseconds
}

/**
 * Normalize compact ISO 8601 dates (e.g. "19830101") to extended format ("1983-01-01").
 * Passes through dates that are already in extended format or full ISO timestamps.
 */
export function normalizeDate(dateStr) {
  // Already contains hyphens or T -> extended format, pass through
  if (dateStr.includes("-") || dateStr.includes("T")) {
    return dateStr;
  }
  // Compact date: YYYYMMDD (8 digits)
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

export function getValidTimestamps(startStr, endStr, isoDuration) {
  const start_time = new Date(normalizeDate(startStr));
  const end_time = new Date(normalizeDate(endStr));
  const duration = parseISO8601Duration(isoDuration);

  let current_time = start_time.getTime();
  const valid_timestamps = [];

  while (current_time < end_time.getTime()) {
    valid_timestamps.push(new Date(current_time).toISOString());
    current_time += duration;
  }

  return valid_timestamps;
}

/**
 * Expand a single range item "start/end/period" into individual timestamps.
 * Applies the 2-day limitation for sub-daily intervals.
 */
function expandRange(start, end, isoDuration) {
  const durationMilliseconds = parseISO8601Duration(isoDuration);
  const durationDays = durationMilliseconds / 8.64e7;

  // if the interval is less than 24 hours, return dates for the past 2 days only
  // to avoid the browser hanging on large time ranges
  if (durationDays < 1) {
    const endTime = new Date(normalizeDate(end));
    const startTime = subDays(endTime, 2);
    return getValidTimestamps(
      startTime.toISOString(),
      endTime.toISOString(),
      isoDuration
    );
  }

  return getValidTimestamps(start, end, isoDuration);
}

/**
 * Parse a WMS time dimension value string into an array of ISO timestamps.
 *
 * Supports all WMS 1.3.0 Table C.2 formats:
 *   - Single value:            "2024-01-01T00:00:00Z"
 *   - Comma-separated list:    "val1,val2,val3"
 *   - Interval:                "start/end/period"
 *   - Multiple intervals:      "s1/e1/P1,s2/e2/P2"
 *   - Mixed values+intervals:  "val1,s1/e1/P1,val2"
 *   - Compact ISO dates:       "19830101/20260331/PT5M"
 */
export function parseTimeValues(timeValueStr) {
  if (!timeValueStr) return null;

  const items = timeValueStr.split(",");
  const allTimestamps = [];

  for (const item of items) {
    const trimmed = item.trim();
    const parts = trimmed.split("/");

    if (parts.length === 3) {
      allTimestamps.push(...expandRange(parts[0], parts[1], parts[2]));
    } else {
      allTimestamps.push(normalizeDate(trimmed));
    }
  }

  allTimestamps.sort((a, b) => new Date(a) - new Date(b));
  return allTimestamps;
}

export function extractTimestamps(layer) {
  const timeValueStr =
    layer?.Dimension?.find((d) => d.name === "time")?.values || "";

  return parseTimeValues(timeValueStr);
}

export function extractLegendUrl(layer, styleName) {
  const styles = layer?.Style || [];
  let style;

  if (styleName) {
    const styleNameLower = styleName.toLowerCase();
    style = styles.find((s) => s.Name?.toLowerCase() === styleNameLower);
  }

  // fall back to first style if no match or no style name specified
  if (!style) {
    style = styles[0];
  }

  return style?.LegendURL?.[0]?.OnlineResource || null;
}
