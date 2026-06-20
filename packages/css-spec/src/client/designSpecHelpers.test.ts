import { describe, it, expect } from "vitest";
import {
  rgbToHex,
  colorKey,
  shorten,
  shortFont,
  hexToRgba,
  hexLuminance,
  isCleanPx,
  suggestSpaceName,
  suggestTokenName,
  inferKind,
  mergeSavedTokenBase,
  migrateTokenKey,
  reconcileUpdateResponse,
  humanizeChange,
  buildClaudePromptFor,
} from "./designSpecHelpers";

describe("rgbToHex", () => {
  it("converts rgb() to #hex", () => {
    expect(rgbToHex("rgb(255, 0, 0)")).toBe("#ff0000");
    expect(rgbToHex("rgb(22, 22, 22)")).toBe("#161616");
  });
  it("appends alpha when < 1", () => {
    expect(rgbToHex("rgba(255, 255, 255, 0.9)")).toBe("#ffffffe6");
  });
  it("passes through values it can't parse", () => {
    expect(rgbToHex("transparent")).toBe("transparent");
    expect(rgbToHex("#abc")).toBe("#abc");
  });
});

describe("colorKey", () => {
  it("normalizes to lowercase hex for de-duping", () => {
    expect(colorKey("rgb(133, 141, 151)")).toBe("#858d97");
  });
});

describe("shorten", () => {
  it("leaves short strings intact", () => {
    expect(shorten("div.foo", 30)).toBe("div.foo");
  });
  it("truncates with an ellipsis past the max", () => {
    expect(shorten("abcdefghij", 5)).toBe("abcd…");
  });
});

describe("shortFont", () => {
  it("takes the first family and strips quotes", () => {
    expect(shortFont('"Suisse Intl", Arial, sans-serif')).toBe("Suisse Intl");
    expect(shortFont("var(--font-x), system-ui")).toBe("var(--font-x)");
  });
});

describe("hexToRgba", () => {
  it("expands a 6-digit hex with the given alpha", () => {
    expect(hexToRgba("#161616", 0.14)).toBe("rgba(22, 22, 22, 0.14)");
  });
  it("returns short hex untouched", () => {
    expect(hexToRgba("#abc", 0.5)).toBe("#abc");
  });
});

describe("hexLuminance", () => {
  it("ranks black darker than white", () => {
    expect(hexLuminance("#000000")).toBeLessThan(hexLuminance("#ffffff"));
  });
  it("puts mid-grays in the middle band", () => {
    const lum = hexLuminance("#858d97");
    expect(lum).toBeGreaterThan(0.25);
    expect(lum).toBeLessThan(0.6);
  });
});

describe("isCleanPx", () => {
  it("accepts whole and half pixels", () => {
    expect(isCleanPx("16px")).toBe(true);
    expect(isCleanPx("6px")).toBe(true);
    expect(isCleanPx("0.5px")).toBe(true);
  });
  it("rejects clamp() snapshots (fractional)", () => {
    // This is the bug class that polluted the spacing list.
    expect(isCleanPx("6.4128px")).toBe(false);
    expect(isCleanPx("205.568px")).toBe(false);
  });
  it("rejects zero and negatives", () => {
    expect(isCleanPx("0px")).toBe(false);
    expect(isCleanPx("-16px")).toBe(false);
  });
});

describe("suggestSpaceName", () => {
  it("maps px to a base-4 scale name", () => {
    expect(suggestSpaceName("16px", new Set())).toBe("--space-4");
    expect(suggestSpaceName("8px", new Set())).toBe("--space-2");
  });
  it("avoids collisions with taken names", () => {
    expect(suggestSpaceName("16px", new Set(["--space-4"]))).toBe("--space-4-2");
  });
});

describe("suggestTokenName", () => {
  const usage = (text: number, bg: number, border: number) => ({ text, bg, border });

  it("suggests a surface name for a light background color", () => {
    // The #ffffff -> --text-tertiary bug: white used mostly as bg must NOT
    // become a text token.
    const name = suggestTokenName(
      { value: "#ffffff", usage: usage(0, 5, 0) },
      new Set()
    );
    expect(name).toMatch(/surface/);
    expect(name).not.toMatch(/text/);
  });

  it("suggests a text tier for a text-dominant mid-gray", () => {
    const name = suggestTokenName(
      { value: "#858d97", usage: usage(6, 0, 0) },
      new Set()
    );
    expect(name).toBe("--text-secondary");
  });

  it("suggests primary ink for near-black text", () => {
    const name = suggestTokenName(
      { value: "#161616", usage: usage(40, 0, 0) },
      new Set()
    );
    expect(name).toBe("--text-primary");
  });

  it("suggests a border name for border-dominant colors", () => {
    const name = suggestTokenName(
      { value: "#f3f3f3", usage: usage(0, 0, 4) },
      new Set()
    );
    expect(name).toMatch(/border/);
  });

  it("avoids an already-taken name (the dedup bug)", () => {
    // text-secondary already exists -> must not suggest it again.
    const name = suggestTokenName(
      { value: "#666666", usage: usage(4, 0, 0) },
      new Set(["--text-secondary"])
    );
    expect(name).toBe("--text-secondary-2");
  });
});

describe("inferKind (non-DOM cases)", () => {
  it("classifies lengths as size", () => {
    expect(inferKind("16px")).toBe("size");
    expect(inferKind("1.5rem")).toBe("size");
    expect(inferKind("100%")).toBe("size");
    expect(inferKind("clamp(1rem, 2vw, 3rem)")).toBe("size");
  });
  it("rejects CSS-wide keywords (the --lightningcss-light: initial bug)", () => {
    expect(inferKind("initial")).toBeNull();
    expect(inferKind("inherit")).toBeNull();
    expect(inferKind("unset")).toBeNull();
    expect(inferKind("none")).toBeNull();
  });
  it("returns null for empty/whitespace", () => {
    expect(inferKind("")).toBeNull();
    expect(inferKind("   ")).toBeNull();
  });
});

describe("mergeSavedTokenBase (the 'saved but not changed' bug)", () => {
  it("syncs only tokens the server confirmed it wrote", () => {
    const base = { "--fg": "#000", "--bg": "#fff" };
    const edits = { "--fg": "#111", "--bg": "#eee" };
    // Server wrote --fg but reported --bg as missed (not in an editable :root).
    const next = mergeSavedTokenBase(base, edits, ["--fg"]);
    expect(next["--fg"]).toBe("#111"); // landed -> synced
    expect(next["--bg"]).toBe("#fff"); // missed -> baseline preserved, NOT #eee
  });
  it("leaves base untouched when nothing landed", () => {
    const base = { "--fg": "#000" };
    const next = mergeSavedTokenBase(base, { "--fg": "#111" }, []);
    expect(next["--fg"]).toBe("#000");
  });
  it("does not mutate the input map", () => {
    const base = { "--fg": "#000" };
    mergeSavedTokenBase(base, { "--fg": "#111" }, ["--fg"]);
    expect(base["--fg"]).toBe("#000");
  });
});

describe("migrateTokenKey (the rename-goes-blank bug)", () => {
  it("carries the value to the new key and drops the old", () => {
    const next = migrateTokenKey({ "--old": "16px" }, "--old", "--new");
    expect(next["--new"]).toBe("16px");
    expect("--old" in next).toBe(false);
  });
  it("returns the same reference (no-op) when the key is absent", () => {
    const map = { "--other": "1px" };
    expect(migrateTokenKey(map, "--missing", "--new")).toBe(map);
  });
  it("does not mutate the input map", () => {
    const map = { "--old": "16px" };
    migrateTokenKey(map, "--old", "--new");
    expect(map["--old"]).toBe("16px");
  });
});

describe("humanizeChange", () => {
  it("maps color to plain 'text color'", () => {
    expect(humanizeChange("color", "#858d97", "#161616")).toBe(
      "Change the text color from `#858d97` to `#161616`."
    );
  });
  it("maps font-size to 'font size'", () => {
    expect(humanizeChange("font-size", "16px", "14px")).toBe(
      "Change the font size from `16px` to `14px`."
    );
  });
  it("falls back to the de-hyphenated property for unknown props", () => {
    expect(humanizeChange("text-transform", "none", "uppercase")).toBe(
      "Change the text transform from `none` to `uppercase`."
    );
  });
});

describe("buildClaudePromptFor", () => {
  it("leads with the human intent and names what/where/from/to", () => {
    const p = buildClaudePromptFor(
      "p.intro",
      "Early-stage founders",
      "color",
      "#858d97",
      "#161616"
    );
    // States the change in plain English up front.
    expect(p).toContain("Change the text color from `#858d97` to `#161616`.");
    // Locates the exact element.
    expect(p).toContain("`p.intro`");
    expect(p).toContain('text starts with: "Early-stage founders"');
    // Guards against the global find-replace that corrupted unrelated files.
    expect(p).toContain("edit ONLY that rule");
    expect(p).toMatch(/do not do a global find-replace/i);
  });
  it("omits the text anchor when there's no snippet", () => {
    const p = buildClaudePromptFor("div.box", "", "padding", "8px", "16px");
    expect(p).not.toContain("text starts with");
    expect(p).toContain("Change the padding from `8px` to `16px`.");
  });
});

describe("reconcileUpdateResponse", () => {
  it("uses server updated/missed when present", () => {
    const r = reconcileUpdateResponse(["--a", "--b"], {
      updated: ["--a"],
      missed: ["--b"],
    });
    expect(r).toEqual({ updated: ["--a"], missed: ["--b"] });
  });
  it("defaults updated to all requested names for the older route shape", () => {
    const r = reconcileUpdateResponse(["--a", "--b"], {});
    expect(r.updated).toEqual(["--a", "--b"]);
    expect(r.missed).toEqual([]);
  });
});
