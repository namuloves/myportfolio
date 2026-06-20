import { describe, it, expect } from "vitest";
import {
  updateTokens,
  addToken,
  scoreGlobalsCandidate,
} from "./designSpecCss";

// Normal order: base/light first, dark last (this project's layout).
const NORMAL = `:root {
  --fg: #000;
  --size: 16px;
  color-scheme: light;
}
:root[data-theme="dark"] {
  --fg: #fff;
}`;

// Dark FIRST — the case the old single-cut splitLightDark mishandled.
const DARK_FIRST = `:root[data-theme="dark"] {
  --fg: #fff;
}
:root {
  --fg: #000;
}`;

// Dark via media query (no data-theme selector).
const MEDIA_DARK = `:root {
  --fg: #000;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fg: #fff;
  }
}`;

describe("updateTokens — never touches dark", () => {
  it("updates base/light, leaves dark[data-theme] untouched", () => {
    const { css, updated, missed } = updateTokens(NORMAL, { "--fg": "#111" });
    expect(updated).toEqual(["--fg"]);
    expect(missed).toEqual([]);
    // light changed, dark kept
    expect(css).toContain("--fg: #111");
    expect(css).toContain("--fg: #fff"); // dark value preserved
    expect(css).not.toContain("--fg: #000");
  });

  it("handles DARK-FIRST order without polluting dark", () => {
    const { css } = updateTokens(DARK_FIRST, { "--fg": "#111" });
    // The dark block still says #fff; only the base :root became #111.
    expect(css).toContain(`:root[data-theme="dark"] {\n  --fg: #fff;`);
    expect(css).toContain("--fg: #111");
  });

  it("does not edit a :root inside a prefers-color-scheme: dark media query", () => {
    const { css, updated } = updateTokens(MEDIA_DARK, { "--fg": "#111" });
    expect(updated).toEqual(["--fg"]);
    // base :root updated, media-dark :root preserved
    expect(css).toContain("--fg: #111");
    expect(css).toContain("--fg: #fff");
  });

  it("reports tokens not present as missed", () => {
    const { updated, missed } = updateTokens(NORMAL, {
      "--fg": "#111",
      "--nope": "#222",
    });
    expect(updated).toEqual(["--fg"]);
    expect(missed).toEqual(["--nope"]);
  });
});

describe("addToken", () => {
  it("appends to the first editable :root, not dark", () => {
    const { css, existed } = addToken(NORMAL, "--brand", "#f0f");
    expect(existed).toBe(false);
    expect(css).toContain("--brand: #f0f");
    // dark block unchanged (no --brand inside it)
    const darkBlock = css.slice(css.indexOf('data-theme="dark"'));
    expect(darkBlock).not.toContain("--brand");
  });

  it("reports existed=true when the token already exists", () => {
    const { existed } = addToken(NORMAL, "--fg", "#999");
    expect(existed).toBe(true);
  });

  it("preserves surrounding formatting (comments, indentation)", () => {
    const withComment = `:root {\n  /* tokens */\n  --fg: #000;\n}`;
    const { css } = addToken(withComment, "--bg", "#fff");
    expect(css).toContain("/* tokens */");
    expect(css).toContain("--fg: #000;");
    expect(css).toContain("--bg: #fff");
  });
});

describe("scoreGlobalsCandidate", () => {
  it("returns token count for files with :root", () => {
    expect(scoreGlobalsCandidate(NORMAL)).toBe(3); // --fg, --size, dark --fg
  });
  it("returns -1 for files with no :root", () => {
    expect(scoreGlobalsCandidate(".foo { color: red; }")).toBe(-1);
  });
  it("returns -1 for unparseable garbage gracefully", () => {
    // postcss is lenient, but a non-:root file still scores -1
    expect(scoreGlobalsCandidate("not even css {{{")).toBe(-1);
  });
});
