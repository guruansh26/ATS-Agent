import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    environment: "node",
    pool: "forks"
  },
  resolve: {
    alias: {
      "@ats/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
      "@ats/llm": new URL("../../packages/llm/src/index.ts", import.meta.url).pathname
    }
  }
});
