import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure helpers only — node env (no jsdom). Keeps the runner light and
    // avoids jsdom's CSS-parsing deps fighting this CommonJS project.
    environment: "node",
    // Match real test files; exclude macOS AppleDouble "._" sidecar files that
    // appear on this volume and would otherwise be picked up as tests.
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/._*", "**/node_modules/**", "**/packages/**"],
    // The design-spec tests now live in packages/css-spec (run via its own
    // workspace test script). The portfolio currently has no unit tests of its
    // own, so don't fail when none are found.
    passWithNoTests: true,
    css: true,
  },
});
