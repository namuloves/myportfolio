/**
 * Dev-only request handler factory for the design-spec overlay.
 *
 * Actions (POST body { action, ... }):
 *   - "update": change existing token values in the globals stylesheet
 *               (base/light :root rules only — dark theme is never touched)
 *   - "add":    insert a new token into the first editable :root rule
 *   - "rename": rename a token in the globals file AND every var(--old) in scope
 *   - "find":   list every CSS occurrence of a hex value (read-only)
 *
 * Hard-gated to development: in production it returns 404 so the route is inert.
 * It only edits .css files inside the resolved scan roots, and token names/values
 * are validated by shape (TOKEN_NAME_RE / VALUE_RE), so it cannot be coaxed into
 * writing arbitrary files or content.
 *
 * The globals path and scan roots are RESOLVED per request (config file / env /
 * auto-detect) rather than hardcoded, and the light/dark split + token insertion
 * use a real CSS AST (postcss) keyed on :root rule structure — not on any one
 * project's exact `color-scheme: light;` convention.
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  scoreGlobalsCandidate,
  updateTokens,
  addToken as addTokenToCss,
} from "./designSpecCss";

const IS_DEV = process.env.NODE_ENV !== "production";

// Token name shape: --kebab-case.
const TOKEN_NAME_RE = /^--[a-z][a-z0-9-]*$/;
// Value shape. Accepts:
//   - hex: #fff, #ffffff, #ffffffaa
//   - any CSS color function: rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color(...)
//     with comma- OR space-separated args, negatives, %, decimals, and the
//     `/ alpha` slash syntax (these chars are all that's inside the parens).
//   - lengths: 16px, 1.5rem, .5em, etc.
//   - a bare keyword: transparent, currentColor, inherit, etc.
const COLOR_FN =
  /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([0-9a-zA-Z.,\s%/+-]+\)$/;
const VALUE_RE =
  /^(#[0-9a-fA-F]{3,8}|[0-9.]+(px|rem|em)|[a-zA-Z-]+)$/;
/** True if `value` is an acceptable token value (color, length, or keyword).
    Exported for unit testing the accepted/rejected value shapes. */
export function isValidValue(value: string): boolean {
  const v = value.trim();
  return VALUE_RE.test(v) || COLOR_FN.test(v);
}

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

// Cap how many tokens a single update can carry (defense against a pathological
// request; the UI never sends more than a few dozen).
const MAX_TOKENS = 200;

// Directories never worth scanning, regardless of project layout.
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
]);

/* ------------------------------------------------------------------ */
/* CSS roots resolution (config → env → auto-detect)                  */
/* ------------------------------------------------------------------ */

export type ResolvedCssRoots = {
  globalsPath: string;
  scanRoots: string[];
  source: "config" | "env" | "auto";
};

/** Read an optional config: package.json#designSpec or design-spec.config.json.
    Shape: { globals?: string, scan?: string[] } (paths relative to cwd). */
async function readConfig(
  cwd: string
): Promise<{ globals?: string; scan?: string[] } | null> {
  try {
    const pkg = JSON.parse(
      await fs.readFile(path.join(cwd, "package.json"), "utf8")
    );
    if (pkg.designSpec) return pkg.designSpec;
  } catch {
    /* no package.json or no key */
  }
  try {
    return JSON.parse(
      await fs.readFile(path.join(cwd, "design-spec.config.json"), "utf8")
    );
  } catch {
    /* no config file */
  }
  return null;
}

/** Filename preference for tie-breaking (lower = better). */
function filenameRank(file: string): number {
  const base = path.basename(file).toLowerCase();
  const order = ["globals.css", "global.css", "app.css", "index.css", "styles.css"];
  const i = order.indexOf(base);
  return i === -1 ? order.length : i;
}

/** Find the most likely globals stylesheet by scanning likely roots. */
async function detectGlobals(cwd: string, scanRoots: string[]): Promise<string | null> {
  const files: string[] = [];
  for (const root of scanRoots) {
    try {
      files.push(...(await collectCssFiles(root)));
    } catch {
      /* root may not exist */
    }
  }
  let best: { file: string; score: number } | null = null;
  for (const file of files) {
    let css: string;
    try {
      css = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const score = scoreGlobalsCandidate(css);
    if (score < 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score &&
        (filenameRank(file) < filenameRank(best.file) ||
          (filenameRank(file) === filenameRank(best.file) &&
            file.length < best.file.length)))
    ) {
      best = { file, score };
    }
  }
  return best?.file ?? null;
}

/** Resolve where the globals file lives and which roots to scan. */
export async function resolveCssRoots(cwd: string): Promise<ResolvedCssRoots> {
  const candidateScanRoots = ["src", "app", "styles", "."]
    .map((p) => path.join(cwd, p))
    .filter((p, i, arr) => arr.indexOf(p) === i);

  const config = await readConfig(cwd);
  if (config?.globals) {
    const globalsPath = path.resolve(cwd, config.globals);
    const scanRoots = (config.scan ?? ["src", "app", "styles", "."]).map((p) =>
      path.resolve(cwd, p)
    );
    return { globalsPath, scanRoots, source: "config" };
  }

  const env = process.env.DESIGN_SPEC_GLOBALS;
  if (env) {
    return {
      globalsPath: path.resolve(cwd, env),
      scanRoots: candidateScanRoots,
      source: "env",
    };
  }

  const detected = await detectGlobals(cwd, candidateScanRoots);
  return {
    globalsPath: detected ?? path.join(cwd, "src", "styles", "globals.css"),
    scanRoots: candidateScanRoots,
    source: "auto",
  };
}

/* ------------------------------------------------------------------ */
/* File IO                                                            */
/* ------------------------------------------------------------------ */

/** Write a file, but ONLY if it resolves inside one of the allowed roots.
    Defense in depth against a path escaping the scanned tree. */
async function safeWrite(file: string, content: string, allowedRoots: string[]) {
  const resolved = path.resolve(file);
  const ok = allowedRoots.some(
    (root) => resolved === root || resolved.startsWith(root + path.sep)
  );
  if (!ok) throw new Error(`Refusing to write outside allowed roots: ${file}`);
  await fs.writeFile(resolved, content, "utf8");
}

/** Recursively collect every .css file under dir (skipping ignore dirs). */
async function collectCssFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      out.push(...(await collectCssFiles(full)));
    } else if (e.name.endsWith(".css")) {
      out.push(full);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Handler factory                                                    */
/* ------------------------------------------------------------------ */

export type DesignSpecHandlerOptions = {
  /** Working directory used to resolve the globals file and scan roots.
      A string, or a function called per request. Defaults to process.cwd(). */
  cwd?: string | (() => string);
  /** Override root resolution entirely. Defaults to resolveCssRoots(cwd). */
  resolveRoots?: (cwd: string) => Promise<ResolvedCssRoots>;
};

/** Build the dev-only POST handler. Mount it in your route:
 *
 *   import { createDesignSpecHandler } from "css-spec/server";
 *   export const POST = createDesignSpecHandler();
 *   export const runtime = "nodejs";
 */
export function createDesignSpecHandler(
  options: DesignSpecHandlerOptions = {}
): (request: Request) => Promise<Response> {
  return async function POST(request: Request) {
    if (!IS_DEV) return new NextResponse("Not found", { status: 404 });

    let body: {
      action?: string;
      tokens?: Record<string, string>;
      name?: string;
      value?: string;
      kind?: string;
      from?: string;
      to?: string;
    };
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const action = body.action ?? "update";
    const cwd =
      typeof options.cwd === "function"
        ? options.cwd()
        : options.cwd ?? process.cwd();
    const roots = await (options.resolveRoots ?? resolveCssRoots)(cwd);

    // rename/find scan many files; update/add read the single globals file.
    let css: string;
    try {
      css = await fs.readFile(roots.globalsPath, "utf8");
    } catch (e) {
      return json(
        {
          error: `Could not read globals stylesheet at ${path.relative(
            cwd,
            roots.globalsPath
          )} (source: ${roots.source}). Set "designSpec.globals" in package.json or DESIGN_SPEC_GLOBALS. ${String(
            e
          )}`,
        },
        500
      );
    }

    /* ---------------------------------------------------------------- */
    /* update — change existing token values (base/light rules only)     */
    /* ---------------------------------------------------------------- */
    if (action === "update") {
      const entries = Object.entries(body.tokens ?? {});
      if (entries.length === 0) return json({ error: "No tokens provided" }, 400);
      if (entries.length > MAX_TOKENS)
        return json({ error: `Too many tokens (max ${MAX_TOKENS})` }, 400);
      for (const [name, value] of entries) {
        if (!TOKEN_NAME_RE.test(name)) return json({ error: `Bad token name: ${name}` }, 400);
        if (typeof value !== "string" || !isValidValue(value))
          return json({ error: `Invalid value for ${name}: ${value}` }, 400);
      }

      let result;
      try {
        result = updateTokens(css, Object.fromEntries(entries));
      } catch (e) {
        return json({ error: `Could not parse CSS: ${String(e)}` }, 500);
      }
      await safeWrite(roots.globalsPath, result.css, roots.scanRoots);
      return json({ ok: true, updated: result.updated, missed: result.missed });
    }

    /* ---------------------------------------------------------------- */
    /* add — insert a new token at the end of the first editable :root    */
    /* ---------------------------------------------------------------- */
    if (action === "add") {
      const name = (body.name ?? "").trim();
      const value = (body.value ?? "").trim();
      if (!TOKEN_NAME_RE.test(name)) return json({ error: `Bad token name: ${name}` }, 400);
      if (!isValidValue(value)) return json({ error: `Invalid value: ${value}` }, 400);

      let result;
      try {
        result = addTokenToCss(css, name, value);
      } catch (e) {
        return json({ error: String((e as Error).message) }, 500);
      }
      if (result.existed) return json({ error: `Token already exists: ${name}` }, 409);
      await safeWrite(roots.globalsPath, result.css, roots.scanRoots);
      return json({ ok: true, added: name, blocks: 1 });
    }

    /* ---------------------------------------------------------------- */
    /* rename — rename token in globals + every var(--old) in scope      */
    /* ---------------------------------------------------------------- */
    if (action === "rename") {
      const from = (body.from ?? "").trim();
      const to = (body.to ?? "").trim();
      if (!TOKEN_NAME_RE.test(from) || !TOKEN_NAME_RE.test(to))
        return json({ error: "Bad token name" }, 400);
      if (from === to) return json({ error: "Names are identical" }, 400);

      let files: string[];
      try {
        files = [];
        for (const r of roots.scanRoots) {
          try {
            files.push(...(await collectCssFiles(r)));
          } catch {
            /* root may not exist */
          }
        }
        files = Array.from(new Set(files));
      } catch (e) {
        return json({ error: `Could not scan: ${String(e)}` }, 500);
      }

      // Match the token name as a definition (`--old:`) or inside var(--old).
      // Word-boundary via negative lookahead so --old doesn't match --old-foo.
      const defRe = new RegExp(`(^|[^a-zA-Z0-9-])${from}(?![a-zA-Z0-9-])`, "g");
      const changedFiles: string[] = [];
      let totalReplacements = 0;

      for (const file of files) {
        const original = await fs.readFile(file, "utf8");
        let count = 0;
        const next = original.replace(defRe, (_m, pre) => {
          count += 1;
          return `${pre}${to}`;
        });
        if (count > 0) {
          await safeWrite(file, next, roots.scanRoots);
          changedFiles.push(path.relative(cwd, file));
          totalReplacements += count;
        }
      }

      return json({ ok: true, from, to, files: changedFiles, replacements: totalReplacements });
    }

    /* ---------------------------------------------------------------- */
    /* find — list every CSS occurrence of a hex value (no writes)       */
    /* ---------------------------------------------------------------- */
    if (action === "find") {
      const value = (body.value ?? "").trim();
      if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) {
        return json({ error: `Expected a hex value, got: ${value}` }, 400);
      }

      let files: string[] = [];
      try {
        for (const r of roots.scanRoots) {
          try {
            files.push(...(await collectCssFiles(r)));
          } catch {
            /* root may not exist */
          }
        }
        files = Array.from(new Set(files));
      } catch (e) {
        return json({ error: `Could not scan: ${String(e)}` }, 500);
      }

      const hexRe = new RegExp(
        `${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![0-9a-fA-F])`,
        "gi"
      );
      const matches: { file: string; line: number; text: string }[] = [];
      for (const file of files) {
        const content = await fs.readFile(file, "utf8");
        content.split("\n").forEach((lineText, i) => {
          if (hexRe.test(lineText)) {
            matches.push({
              file: path.relative(cwd, file),
              line: i + 1,
              text: lineText.trim().slice(0, 120),
            });
          }
          hexRe.lastIndex = 0;
        });
      }
      return json({ ok: true, value, matches });
    }

    /* ---------------------------------------------------------------- */
    /* Note: there is intentionally no "rewrite a property across files"
       action. Pointing an element at a token is done via a copy-paste
       instruction to Claude Code (so only the intended rule changes), never a
       blind global find-replace. */

    return json({ error: `Unknown action: ${action}` }, 400);
  };
}
