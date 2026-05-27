import request from "@/utils/request";
import { getRuntimeConfig } from "@/utils/runtime-config";

export const getSearchQuery = ({ query, page }) => {
  const { GOOGLE_SEARCH_API_KEY, GOOGLE_CUSTOM_SEARCH_CX } = getRuntimeConfig();
  return request.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: GOOGLE_SEARCH_API_KEY,
      cx: GOOGLE_CUSTOM_SEARCH_CX,
      q: query,
      start: page || 1,
      filter: 0,
    },
  });
};
