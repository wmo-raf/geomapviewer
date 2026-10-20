/** @type {import('next').NextConfig} */
const path = require("path");
const optimizedImages = require("next-optimized-images");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

// Worker files shipped already minified and emitted as assets through
// `new URL(..., import.meta.url)`. Next 13's minifier parses them as classic
// scripts and fails on their ESM syntax, so flag them as minimized.
const PREMINIFIED_ASSETS = [/maplibre-gl-worker\.[^/]*\.mjs$/];

class SkipPreminifiedAssetsPlugin {
  apply(compiler) {
    const { Compilation } = compiler.webpack;
    compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.constructor.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        (assets) => {
          Object.keys(assets)
            .filter((name) => PREMINIFIED_ASSETS.some((re) => re.test(name)))
            .forEach((name) =>
              compilation.updateAsset(name, (source) => source, (info) => ({
                ...info,
                minimized: true,
              }))
            );
        }
      );
    });
  }
}

const nextConfig = {
  // disable css-modules component styling
  webpack(config, { isServer }) {
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
      // react-map-gl 5 imports `mapbox-gl`: serve it maplibre-gl through the
      // compat shim (maplibre-gl 6 has no default export)
      "mapbox-gl": path.resolve(__dirname, "src/utils/maplibre-compat.js"),
    };

    // The maplibre worker URL only matters in the browser: on the server, Next
    // rejects `new URL("maplibre-gl/...", import.meta.url)` as an ESM external.
    if (isServer) {
      config.module.rules.push({
        test: path.resolve(__dirname, "src/utils/maplibre-compat.js"),
        parser: { url: false },
      });
    } else {
      config.plugins.push(new SkipPreminifiedAssetsPlugin());

      // Next emits relative asset URLs, which the Open-Meteo package resolves
      // again against `import.meta.url` (rewritten to a file:// URL) to load
      // its render worker and WebAssembly binary: make them absolute.
      config.module.rules.push({
        test: /[\\/]node_modules[\\/]@openmeteo[\\/]weather-map-layer[\\/]/,
        parser: { url: true },
      });
    }

    // webpack 5.86 (bundled by Next 13) wrongly flags classes of maplibre-gl 6
    // (ES2022) as unused and rewrites them to `class extends (null && Parent)`,
    // which throws "Super constructor null" when creating the map.
    config.optimization.innerGraph = false;

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
