import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/recommendation/**/*.test.ts"],
    exclude: ["lib/recommendationEngine.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/recommendation/**/*.ts"],
      exclude: [
        "lib/recommendation/**/*.test.ts",
        "lib/recommendation/testFixtures.ts",
      ],
    },
  },
  css: {
    postcss: {},
  },
});
