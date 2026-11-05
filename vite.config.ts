import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "es2022",
    sourcemap: true,
    // three.js alone is ~560 kB minified (~140 kB gzip); the emulator is a separate lazy chunk.
    chunkSizeWarningLimit: 650,
  },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
