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
  extractColors,
  colorAlpha,
  collectElementColors,
  dimensionNote,
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

describe("dimensionNote (rect vs computed width explanation)", () => {
  // Stub just the CSSStyleDeclaration fields dimensionNote reads.
  const cs = (o: Record<string, string>) =>
    ({
      width: "0px", height: "0px",
      borderLeftWidth: "0px", borderRightWidth: "0px",
      borderTopWidth: "0px", borderBottomWidth: "0px",
      paddingLeft: "0px", paddingRight: "0px",
      paddingTop: "0px", paddingBottom: "0px",
      boxSizing: "border-box", transform: "none",
      ...o,
    }) as unknown as CSSStyleDeclaration;

  it("returns undefined when rendered ≈ CSS width", () => {
    expect(dimensionNote("width", cs({ width: "167.336px" }), 167.4)).toBeUndefined();
  });

  it("attributes the extra pixels to a border", () => {
    // CSS width 167.336, rendered 172.3 → +~5px from a 5px border.
    const note = dimensionNote(
      "width",
      cs({ width: "167.336px", borderLeftWidth: "2.5px", borderRightWidth: "2.5px" }),
      172.336
    );
    expect(note).toContain("border");
    expect(note).toContain("167.3px"); // the editable CSS value
    expect(note).toMatch(/Rendered 172\.3px/);
  });

  it("counts padding only under content-box", () => {
    const withPad = dimensionNote(
      "width",
      cs({ width: "100px", boxSizing: "content-box", paddingLeft: "10px", paddingRight: "10px" }),
      120
    );
    expect(withPad).toContain("padding");
    // Under border-box, padding is inside the width → not the cause.
    const borderBox = dimensionNote(
      "width",
      cs({ width: "100px", boxSizing: "border-box", paddingLeft: "10px", paddingRight: "10px" }),
      100
    );
    expect(borderBox).toBeUndefined();
  });
});

describe("extractColors (gradient / multi-color values)", () => {
  it("pulls every rgb stop out of a linear-gradient", () => {
    const got = extractColors("linear-gradient(116deg, rgb(0, 199, 76) 7.97%, rgb(10, 157, 50) 100%)");
    expect(got).toEqual(["rgb(0, 199, 76)", "rgb(10, 157, 50)"]);
  });
  it("handles lab()/oklab() (SVG stroke, wide-gamut)", () => {
    expect(extractColors("lab(65.9269 -0.832707 -8.17473)")).toEqual(["lab(65.9269 -0.832707 -8.17473)"]);
  });
  it("pulls hex out of a box-shadow", () => {
    expect(extractColors("0 2px 8px #1e1e1ee6")).toEqual(["#1e1e1ee6"]);
  });
  it("returns [] for none/empty", () => {
    expect(extractColors("none")).toEqual([]);
    expect(extractColors("")).toEqual([]);
  });
});

describe("colorAlpha (skip near-invisible shadow tints)", () => {
  it("reads alpha from rgba()", () => {
    expect(colorAlpha("rgba(0, 0, 0, 0.05)")).toBeCloseTo(0.05);
    expect(colorAlpha("rgba(0, 0, 0, 0.5)")).toBeCloseTo(0.5);
  });
  it("returns 1 for opaque rgb()/named", () => {
    expect(colorAlpha("rgb(0, 0, 0)")).toBe(1);
    expect(colorAlpha("red")).toBe(1);
  });
  it("reads alpha from 8-digit hex", () => {
    expect(colorAlpha("#000000ff")).toBeCloseTo(1);
    expect(colorAlpha("#00000080")).toBeCloseTo(0.5, 1);
  });
});

describe("collectElementColors (all sources in one place)", () => {
  // Stub the CSSStyleDeclaration fields the collector reads.
  const cs = (o: Record<string, string>) =>
    ({
      color: "rgb(0,0,0)", backgroundColor: "rgba(0, 0, 0, 0)",
      borderTopWidth: "0px", borderTopColor: "rgb(0,0,0)",
      backgroundImage: "none", fill: "", stroke: "",
      outlineWidth: "0px", outlineColor: "rgb(0,0,0)", boxShadow: "none",
      ...o,
    }) as unknown as CSSStyleDeclaration;
  const svgEl = { namespaceURI: "http://www.w3.org/2000/svg" } as unknown as HTMLElement;
  const htmlEl = { namespaceURI: "http://www.w3.org/1999/xhtml" } as unknown as HTMLElement;

  const emitted = (el: HTMLElement, style: CSSStyleDeclaration, hasText: boolean) => {
    const out: Array<[string, string]> = [];
    collectElementColors(el, style, hasText, (c, role) => out.push([c, role]));
    return out;
  };

  it("emits text color only when hasText", () => {
    expect(emitted(htmlEl, cs({ color: "rgb(1,2,3)" }), false).some(([c]) => c === "rgb(1,2,3)")).toBe(false);
    expect(emitted(htmlEl, cs({ color: "rgb(1,2,3)" }), true)).toContainEqual(["rgb(1,2,3)", "text"]);
  });

  it("emits gradient stops as bg", () => {
    const out = emitted(htmlEl, cs({ backgroundImage: "linear-gradient(90deg, rgb(7,77,177), rgb(0,90,146))" }), false);
    expect(out).toContainEqual(["rgb(7,77,177)", "bg"]);
    expect(out).toContainEqual(["rgb(0,90,146)", "bg"]);
  });

  it("emits SVG fill/stroke but skips the UA-default black fill", () => {
    const out = emitted(svgEl, cs({ fill: "rgb(50,160,80)", stroke: "rgb(220,40,90)" }), false);
    expect(out).toContainEqual(["rgb(50,160,80)", "bg"]);
    expect(out).toContainEqual(["rgb(220,40,90)", "border"]);
    // default black fill is dropped:
    expect(emitted(svgEl, cs({ fill: "rgb(0, 0, 0)" }), false).some(([c]) => c === "rgb(0, 0, 0)")).toBe(false);
  });

  it("emits visible box-shadow colors and drops faint tints", () => {
    const out = emitted(htmlEl, cs({ boxShadow: "0 4px 12px rgba(220, 40, 90, 0.4), 0 1px 2px rgba(0, 0, 0, 0.04)" }), false);
    expect(out).toContainEqual(["rgba(220, 40, 90, 0.4)", "border"]);
    expect(out.some(([c]) => c === "rgba(0, 0, 0, 0.04)")).toBe(false);
  });

  it("emits outline color when there's an outline", () => {
    expect(emitted(htmlEl, cs({ outlineWidth: "2px", outlineColor: "rgb(12,69,167)" }), false))
      .toContainEqual(["rgb(12,69,167)", "border"]);
  });
});
