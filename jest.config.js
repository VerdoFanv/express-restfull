/** @type {import("jest").Config} */
const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          isolatedModules: true,
        },
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/test/setup.ts"],
  clearMocks: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/worker.ts",
    "!src/types/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
};

export default config;
