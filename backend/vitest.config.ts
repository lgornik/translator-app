import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    testTimeout: 10000,
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      exclude: [
        "node_modules",
        "dist",
        "src/__tests__",
        "**/*.d.ts",
        "src/index.ts",
        "src/**/index.ts",
        "seed.ts",
        "drizzle.config.ts",
        "src/infrastructure/data/**",
        "src/infrastructure/di/**",
        "src/infrastructure/persistence/postgres/**",
        "src/infrastructure/persistence/Redis*",
        "src/infrastructure/persistence/repositoryFactory.ts",
        "src/infrastructure/http/server.ts",
        "src/infrastructure/http/middleware.ts",
        "src/infrastructure/graphql/errorFormatter.ts",
        "src/infrastructure/monitoring/errorTracking.ts",
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
