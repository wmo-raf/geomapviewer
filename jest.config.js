const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const jestConfig = createJestConfig({
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
});

// ogc-client is published as ES modules only: let jest transform it
module.exports = async () => {
  const config = await jestConfig();
  return {
    ...config,
    transformIgnorePatterns: config.transformIgnorePatterns.map((pattern) =>
      pattern === "/node_modules/"
        ? "/node_modules/(?!@camptocamp/ogc-client/)"
        : pattern
    ),
  };
};
