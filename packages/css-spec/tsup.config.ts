import { defineConfig } from "tsup";

// Two separate builds so the server's node-builtin imports (fs/path) never get
// pulled into the client bundle, and the `"use client"` banner is applied ONLY
// to the client output. esbuild strips top-of-file directives during bundling,
// so without this banner Next's RSC compiler would treat the overlay as a
// Server Component and error at runtime — the #1 React-library packaging gotcha.
export default defineConfig([
  {
    entry: { "client/index": "src/client/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react", "react-dom", "react/jsx-runtime"],
    banner: { js: '"use client";' },
    // CSS-modules: esbuild hashes class names into the JS (styles.* lookups) and
    // emits the rules to dist/client/index.css. The consumer imports that file
    // once (`import "css-spec/style.css"`) — the standard component-library
    // contract; documented in the README and exposed via the package exports.
    loader: { ".css": "local-css" },
  },
  {
    entry: { "server/index": "src/server/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    platform: "node",
    external: ["next", "next/server", "postcss"],
  },
  {
    // CLI scripts — plain Node, no deps, ESM. init.ts gets a shebang (it's the
    // `bin`); postinstall.ts runs via `node` from the npm lifecycle script.
    entry: {
      "cli/init": "src/cli/init.ts",
      "cli/postinstall": "src/cli/postinstall.ts",
    },
    format: ["esm"],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    platform: "node",
    banner: { js: "#!/usr/bin/env node" },
  },
]);
