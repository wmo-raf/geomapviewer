export function getRuntimeConfig() {
  if (typeof window !== "undefined") {
    // In Docker, window.RUNTIME_CONFIG is set by docker-entrypoint.sh.
    // In local dev (npm run dev), it is not set so fall back to process.env.*
    // which Next.js populates from .env.local.
    const runtimeConfig = window.RUNTIME_CONFIG || {};
    return {
      CMS_API: runtimeConfig.CMS_API || process.env.CMS_API,
      ANALYTICS_PROPERTY_ID: runtimeConfig.ANALYTICS_PROPERTY_ID || process.env.ANALYTICS_PROPERTY_ID,
      BASE_PATH: runtimeConfig.BASE_PATH || process.env.BASE_PATH,
      BITLY_TOKEN: runtimeConfig.BITLY_TOKEN || process.env.BITLY_TOKEN,
      GOOGLE_CUSTOM_SEARCH_CX: runtimeConfig.GOOGLE_CUSTOM_SEARCH_CX || process.env.GOOGLE_CUSTOM_SEARCH_CX,
      GOOGLE_SEARCH_API_KEY: runtimeConfig.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY,
    };
  }

  // server-side fallback
  return {
    CMS_API: process.env.CMS_API,
    ANALYTICS_PROPERTY_ID: process.env.ANALYTICS_PROPERTY_ID,
    BASE_PATH: process.env.BASE_PATH,
    BITLY_TOKEN: process.env.BITLY_TOKEN,
    GOOGLE_CUSTOM_SEARCH_CX: process.env.GOOGLE_CUSTOM_SEARCH_CX,
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
  };
}