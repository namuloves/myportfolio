# css-spec — npm extraction plan (monorepo packages/css-spec/)

Status tracker for extracting the dev-only design-spec overlay into a publishable
package named `css-spec`. Source repo: Next.js 15 App Router portfolio.

## Key facts discovered (corrected vs earlier assumptions)
1. NO `apiPath` prop exists yet — `DesignSpecOverlay.tsx` hardcodes
   `const API_PATH = "/api/design-spec-dev"` (~line 71); exported class takes no props.
   Must add `DesignSpecOverlayProps = { apiPath?: string }` and thread it through.
2. NO route factory yet — `route.ts` exports `POST` directly. Must create
   `createDesignSpecHandler(options)` wrapping the POST body, parameterizing cwd.
3. CSS module is a hard dep of the TESTED helper file (`designSpecHelpers.ts`
   imports `./DesignSpecOverlay.module.css`, uses `styles.root`). Package vitest
   MUST keep `css: true`.
4. No portfolio-specific coupling beyond the above. Only external imports:
   react, next/server, postcss, node fs/path, vitest.
5. Filesystem has AppleDouble `._*` files — keep vitest `exclude: ["**/._*"]`.

## Package layout
packages/css-spec/{package.json,tsconfig.json,tsup.config.ts,vitest.config.mts,README.md,LICENSE}
src/client/  index.ts(+"use client") DesignSpecOverlay.tsx +.module.css
             designSpecComponents.tsx designSpecHooks.ts designSpecHelpers.ts(+.test)
             designSpecTokens.ts
src/server/  index.ts handler.ts(NEW from route.ts) designSpecCss.ts(+.test)
src/shared/  constants.ts  (DEFAULT_API_PATH = "/api/design-spec-dev")

## Entry points / exports (subpath only, no root)
- css-spec/client → DesignSpecOverlay + DesignSpecOverlayProps
- css-spec/server → createDesignSpecHandler + resolveCssRoots + types
exports map: ./client and ./server each {types,import(esm .js),require(cjs)}.

## Build: tsup (esbuild), 2 builds (client gets `banner: {js:'"use client";'}`)
- ESM+CJS+dts, splitting:false, sourcemap, external react/react-dom (client) & next/postcss (server, platform:node)
- CSS: esbuild local-css loader → inline + emit dist/client/index.css
- sideEffects: ["**/*.css","./dist/client/index.js","./dist/client/index.cjs"]

## package.json: name css-spec, version 0.1.0, type module,
  peerDeps react>=18<20, react-dom>=18<20, next>=14<16; deps postcss^8.4;
  publishConfig.access public; files [dist,README,LICENSE].

## Workspace consumption: root package.json add "workspaces":["packages/*"] +
  "css-spec":"*"; npm install (symlink). Run tsup --watch alongside next dev.

## Portfolio changes
- layout.tsx dynamic import → import("css-spec/client").then(m=>m.DesignSpecOverlay)
- src/app/api/design-spec-dev/route.ts → 2-liner:
  import { createDesignSpecHandler } from "css-spec/server";
  export const POST = createDesignSpecHandler();  + export const runtime="nodejs";
- delete the 9 originals from src/

## Tests: move .test.ts with their files; package vitest mirrors root
  (node env, css:true, exclude ._* /node_modules/ /dist/). Root vitest keeps
  scanning only src/** (package owns its tests). Optional: add handler factory test.

## Ordered steps (verify after each)
1 scaffold dirs+config
2 move 9 files verbatim (relative imports survive)
3 add apiPath prop (remove hardcoded API_PATH, thread through class→Inner)
4 create handler.ts factory from route.ts (param cwd, reuse resolveCssRoots)
5 write client/index.ts (+"use client") and server/index.ts
6 wire workspace (root workspaces + dep, npm install → symlink)
7 build: dist/client/{index.js,cjs,d.ts,css}+server; head -1 client/index.js == "use client";
8 package tests pass (css:true resolves .module.css)
9 repoint portfolio (layout import, 2-line route, delete originals)
10 portfolio root tests pass
11 browser smoke: ⌥D renders (no RSC error → use client survived), styles apply, token edit POSTs + writes globals.css
12 prod gate: NODE_ENV=production → overlay tree-shaken, route 404
13 npm publish --dry-run (human does login+publish)

## NOTE: npm login / npm publish are HUMAN-ONLY (auth + public release). I prep everything incl. --dry-run.
