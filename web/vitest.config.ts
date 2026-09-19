import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Unit tests for the logic the site's claims rest on.
 *
 * Deliberately narrow: these cover the pure functions that decide what a dataset page
 * asserts - the six analysis verdicts and the dataset agent's need matching - not the
 * rendering. A wrong verdict is the one defect here that misleads a researcher, so it
 * is the one the test suite exists to catch.
 */
export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, ".") } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
