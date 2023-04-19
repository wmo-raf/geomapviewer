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
  swcMinify: true,
  trailingSlash: true,
  env: {
    ANALYTICS_PROPERTY_ID: process.env.ANALYTICS_PROPERTY_ID,
    BITLY_TOKEN: process.env.BITLY_TOKEN,
    DEBUG: process.env.DEBUG,
    FACEBOOK_PIXEL_ID: process.env.FACEBOOK_PIXEL_ID,
    FEATURE_ENV: process.env.FEATURE_ENV,
    GOOGLE_CUSTOM_SEARCH_CX: process.env.GOOGLE_CUSTOM_SEARCH_CX,
    GOOGLE_SEARCH_API_KEY: process.env.GOOGLE_SEARCH_API_KEY,
    HW_API: process.env.HW_API,
    HW_CMS_API: process.env.HW_CMS_API,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    TWITTER_CONVERSION_ID: process.env.TWITTER_CONVERSION_ID,
  },
};

module.exports = () => {
  const plugins = [optimizedImages, withBundleAnalyzer];
  return plugins.reduce((acc, next) => next(acc), nextConfig);
};
