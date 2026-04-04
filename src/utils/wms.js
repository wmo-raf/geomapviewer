import { subDays } from "date-fns";
import { parse, toSeconds } from "iso8601-duration";

export function parseISO8601Duration(durationString) {
  const seconds = toSeconds(parse(durationString));
  return seconds * 1000; // convert to milliseconds
}

export function getValidTimestamps(rangeString) {
  const parts = rangeString.split("/");
  const start_time = new Date(parts[0]);
  const end_time = new Date(parts[1]);
  const duration = parseISO8601Duration(parts[2]);

  let current_time = start_time.getTime();
  const valid_timestamps = [];

  while (current_time < end_time.getTime()) {
    valid_timestamps.push(new Date(current_time).toISOString());
    current_time += duration;
  }

  return valid_timestamps;
}

export function extractTimestamps(layer) {
  const timeValueStr =
    layer?.Dimension?.find((d) => d.name === "time")?.values || "";

  if (!timeValueStr) {
    return null;
  }

  const dateRange = timeValueStr.split("/");

  if (dateRange.length > 1) {
    const isoDuration = dateRange[dateRange.length - 1];
    const durationMilliseconds = parseISO8601Duration(isoDuration);
    const durationDays = durationMilliseconds / 8.64e7;

    // if the interval is less than 24 hours, return dates for the past 2 days only
    // to avoid the browser hanging on large time ranges
    if (durationDays < 1) {
      const endTime = new Date(dateRange[1]);
      const startTime = subDays(endTime, 2);

      return getValidTimestamps(
        `${startTime.toISOString()}/${endTime.toISOString()}/${isoDuration}`
      );
    }

    return getValidTimestamps(timeValueStr);
  }

  const timestamps = timeValueStr.split(",");
  timestamps.sort((a, b) => new Date(a) - new Date(b));
  return timestamps;
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
