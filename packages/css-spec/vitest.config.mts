import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure helpers only — node env (no jsdom), mirroring the source project.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // Exclude macOS AppleDouble "._" sidecar files (present on this volume) and
    // built output so tests aren't double-collected.
    exclude: ["**/._*", "**/node_modules/**", "**/dist/**"],
    // REQUIRED: designSpecHelpers.ts imports ./DesignSpecOverlay.module.css at
    // module load, and a test imports that file — css:true lets it resolve.
    css: true,
  },
});
