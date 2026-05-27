/** @type {import('next').NextConfig} */
const path = require("path");
const optimizedImages = require("next-optimized-images");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // disable css-modules component styling
  webpack(config) {
    config.module.rules.forEach((rule) => {
      const { oneOf } = rule;
      if (oneOf) {
        oneOf.forEach((one) => {
          if (!`${one.issuer?.and}`.includes("_app")) return;
          one.issuer.and = [path.resolve(__dirname)];
        });
      }
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "mapbox-gl": "maplibre-gl",
    };

    config.infrastructureLogging = { level: "error" };

    config.resolve.fallback = { fs: false };

    return config;
  },
  images: {
    disableStaticImages: true,
    unoptimized: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  // Expose env vars to the browser for local development (npm run dev).
  // In Docker these are overridden at runtime via window.RUNTIME_CONFIG.
  env: {
    CMS_API: process.env.CMS_API || "",
    ANALYTICS_PROPERTY_ID: process.env.ANALYTICS_PROPERTY_ID || "",
    BASE_PATH: process.env.BASE_PATH || "",
    BITLY_TOKEN: process.env.BITLY_TOKEN || "",
    GOOGLE_CUSTOM_SEARCH_CX: process.env.GOOGLE_CUSTOM_SEARCH_CX || "",
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY || "",
  },
};

module.exports = () => {
  const plugins = [optimizedImages, withBundleAnalyzer];
  return plugins.reduce((acc, next) => next(acc), nextConfig);
};
