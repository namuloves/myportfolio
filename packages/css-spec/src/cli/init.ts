/**
 * `npx css-spec init` — wire the overlay into a Next.js App Router project.
 *
 * Does three things, idempotently (safe to run twice):
 *   1. Creates app/api/design-spec-dev/route.ts mounting the handler.
 *   2. Adds the dev-only dynamic import + render to app/layout.tsx.
 *   3. Adds `import "css-spec/style.css"` to app/layout.tsx.
 *
 * It never overwrites existing files blindly: the route is only created if
 * absent, and layout edits are skipped if css-spec is already referenced.
 */

import { promises as fs } from "fs";
import path from "path";

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};
const ok = (m: string) => console.log(`${C.green}✓${C.reset} ${m}`);
const skip = (m: string) => console.log(`${C.yellow}•${C.reset} ${m} ${C.dim}(skipped)${C.reset}`);
const info = (m: string) => console.log(`  ${C.dim}${m}${C.reset}`);

const ROUTE_BODY = `import { createDesignSpecHandler } from "css-spec/server";

// Dev-only: the handler hard-404s in production. Uses fs, so it must run on the
// Node runtime, not Edge.
export const POST = createDesignSpecHandler();
export const runtime = "nodejs";
`;

/** Find the App Router directory: app/ or src/app/. */
async function findAppDir(cwd: string): Promise<string | null> {
  for (const rel of ["app", "src/app"]) {
    const dir = path.join(cwd, rel);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) return dir;
    } catch {
      /* not here */
    }
  }
  return null;
}

/** Locate layout.{tsx,jsx,ts,js} inside the app dir. */
async function findLayout(appDir: string): Promise<string | null> {
  for (const name of ["layout.tsx", "layout.jsx", "layout.ts", "layout.js"]) {
    const file = path.join(appDir, name);
    try {
      await fs.access(file);
      return file;
    } catch {
      /* next */
    }
  }
  return null;
}

async function createRoute(appDir: string): Promise<void> {
  const routeDir = path.join(appDir, "api", "design-spec-dev");
  const routeFile = path.join(routeDir, "route.ts");
  try {
    await fs.access(routeFile);
    skip(`API route already exists at ${path.relative(process.cwd(), routeFile)}`);
    return;
  } catch {
    /* create it */
  }
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(routeFile, ROUTE_BODY, "utf8");
  ok(`Created ${path.relative(process.cwd(), routeFile)}`);
}

async function patchLayout(layoutFile: string): Promise<void> {
  const rel = path.relative(process.cwd(), layoutFile);
  let src = await fs.readFile(layoutFile, "utf8");

  if (src.includes("css-spec")) {
    skip(`${rel} already references css-spec`);
    return;
  }

  const lines = src.split("\n");

  // 1. Insert imports after the last top-of-file import line.
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s/.test(lines[i])) lastImport = i;
    // Stop scanning once we hit real code (a non-import, non-comment, non-blank).
    else if (lastImport !== -1 && lines[i].trim() && !lines[i].trim().startsWith("//")) break;
  }
  const importBlock = [
    `import dynamic from "next/dynamic";`,
    `import "css-spec/style.css";`,
    ``,
    `// Dev-only css-spec overlay — toggle with ⌥D. Tree-shaken in production.`,
    `const DesignSpecOverlay =`,
    `  process.env.NODE_ENV !== "production"`,
    `    ? dynamic(() => import("css-spec/client").then((m) => m.DesignSpecOverlay))`,
    `    : () => null;`,
  ];
  // Drop a duplicate `import dynamic` if the file already imports it.
  const block = src.includes("next/dynamic")
    ? importBlock.filter((l) => !l.includes(`import dynamic from "next/dynamic"`))
    : importBlock;
  const insertAt = lastImport >= 0 ? lastImport + 1 : 0;
  lines.splice(insertAt, 0, ...block);

  // 2. Render <DesignSpecOverlay /> just before </body>, putting it on its own
  //    line with the indentation of the </body> tag (handles both a multi-line
  //    body and an inline `<body>{children}</body>`).
  const joined = lines.join("\n");
  let patched: string;
  if (joined.includes("</body>")) {
    patched = joined.replace(
      /([ \t]*)([^\n]*?)<\/body>/,
      (_m, indent: string, before: string) => {
        const trimmed = before.trimEnd();
        // Keep whatever preceded </body> on its own line, then the overlay.
        return `${indent}${trimmed}\n${indent}  <DesignSpecOverlay />\n${indent}</body>`;
      }
    );
  } else {
    // No <body> (unusual) — leave a note rather than guessing.
    patched = joined;
  }

  await fs.writeFile(layoutFile, patched, "utf8");
  ok(`Patched ${rel}`);
  if (!joined.includes("</body>")) {
    info(`Couldn't find </body> — add <DesignSpecOverlay /> to your layout manually.`);
  }
}

async function main() {
  const cwd = process.cwd();
  console.log(`\n${C.bold}${C.cyan}css-spec init${C.reset}\n`);

  const appDir = await findAppDir(cwd);
  if (!appDir) {
    console.error(
      `${C.yellow}!${C.reset} Couldn't find an App Router directory (app/ or src/app/).\n` +
        `  Run this from the root of a Next.js App Router project.`
    );
    process.exit(1);
  }
  info(`Using app dir: ${path.relative(cwd, appDir) || "app"}`);

  await createRoute(appDir);

  const layout = await findLayout(appDir);
  if (!layout) {
    console.error(
      `${C.yellow}!${C.reset} No layout file found in ${path.relative(cwd, appDir)}.\n` +
        `  Add the overlay manually (see the css-spec README).`
    );
    process.exit(1);
  }
  await patchLayout(layout);

  console.log(
    `\n${C.green}${C.bold}Done.${C.reset} Start your dev server and press ${C.bold}⌥D${C.reset} (Alt+D) to open the overlay.\n`
  );
}

main().catch((e) => {
  console.error(`${C.yellow}!${C.reset} css-spec init failed:`, e?.message ?? e);
  process.exit(1);
});
