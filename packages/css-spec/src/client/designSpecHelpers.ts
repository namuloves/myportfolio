/**
 * Pure helpers + shared types for the design-spec overlay.
 *
 * All stateless: color/DOM/inventory/spec/token utilities. No React state.
 * Extracted from DesignSpecOverlay so the component file stays focused on
 * wiring and rendering.
 */

import styles from "./DesignSpecOverlay.module.css";
import {
  TOKEN_OVERRIDES,
  spacingLabel,
  type TokenDef,
  type TokenKind,
} from "./designSpecTokens";

export const IS_DEV = process.env.NODE_ENV !== "production";

/** Join class names, dropping falsy entries. Keeps conditional classes
    (`cx(styles.input, dirty && styles.dirty)`) readable instead of nested
    template-literal ternaries. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export const isTransparent = (color: string) =>
  !color ||
  color === "transparent" ||
  color === "rgba(0, 0, 0, 0)" ||
  color === "rgba(0,0,0,0)";

/** A barely-visible color (very low alpha) — e.g. the faint rgba(0,0,0,0.05) of
    a soft shadow. We skip these so the inventory isn't cluttered with shadow
    tints the user can't even see. Returns the alpha (0–1), or 1 if none. */
export function colorAlpha(color: string): number {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const a = m[1].split(",")[3];
    return a !== undefined ? parseFloat(a) : 1;
  }
  // hex with alpha: #rrggbbaa / #rgba
  const hex = color.match(/^#([0-9a-fA-F]{4}|[0-9a-fA-F]{8})$/);
  if (hex) {
    const h = hex[1];
    const aa = h.length === 4 ? h[3] + h[3] : h.slice(6, 8);
    return parseInt(aa, 16) / 255;
  }
  return 1;
}

/** Convert an rgb()/rgba() computed color to #hex (with alpha when < 1). */
export function rgbToHex(color: string): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return color;
  const parts = match[1].split(",").map((p) => p.trim());
  const [r, g, b] = parts.map((p) => parseInt(p, 10));
  if ([r, g, b].some((n) => Number.isNaN(n))) return color;
  const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const base = `#${hex(r)}${hex(g)}${hex(b)}`;
  if (a < 1) return `${base}${hex(Math.round(a * 255))}`;
  return base;
}

/** A normalized color key used for de-duping in the inventory. */
export const colorKey = (color: string) => rgbToHex(color).toLowerCase();

export const shorten = (value: string, max = 32) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Short font-family label: first family, stripped of quotes & var fallbacks. */
export function shortFont(family: string): string {
  const first = family.split(",")[0]?.trim().replace(/["']/g, "") ?? family;
  return first || family;
}

/** Elements we never want to inspect / collect: our own overlay UI, and the
    Next.js dev-tools portal (which injects its own colors/sizes that aren't
    part of the user's design — e.g. a stray #757575). */
export const isOverlayNode = (el: Element) =>
  el.closest(`.${styles.root}`) !== null ||
  el.hasAttribute("data-ds-ignore") ||
  (el as HTMLElement).dataset?.dsOverlay === "true" ||
  el.closest("nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog]") !== null ||
  el.tagName.toLowerCase() === "nextjs-portal";

export type SubLayers = {
  callout: boolean;
  box: boolean;
  padding: boolean;
  dimensions: boolean;
  inventory: boolean;
  outline: boolean;
};

export const DEFAULT_LAYERS: SubLayers = {
  callout: true,
  box: true,
  padding: true,
  dimensions: true,
  inventory: true,
  outline: false,
};

/** Author-CSS source declarations matching an element, read from the page's
    stylesheets. Used to explain WHY a computed value is what it is
    (e.g. 6.4px came from `gap: 0.4em`). Returns the raw author values. */
export function getAuthorSpacing(el: HTMLElement): { prop: string; value: string; selector: string }[] {
  const props = [
    "gap",
    "rowGap",
    "columnGap",
    "margin",
    "marginTop",
    "marginRight",
    "marginBottom",
    "marginLeft",
    "padding",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
  ];
  const out: { prop: string; value: string; selector: string }[] = [];
  // Inline styles win; check them first.
  for (const p of props) {
    const v = (el.style as unknown as Record<string, string>)[p];
    if (v) out.push({ prop: p, value: v, selector: "(inline)" });
  }
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      const styleRule = rule as CSSStyleRule;
      if (!styleRule.selectorText) continue;
      let matches = false;
      try {
        matches = el.matches(styleRule.selectorText);
      } catch {
        continue; // unsupported selector syntax (e.g. ::part)
      }
      if (!matches) continue;
      const s = styleRule.style;
      for (const p of props) {
        const v = s.getPropertyValue(p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
        // Skip the universal-reset 0s and ignore plain px (those are already clear).
        if (v && v !== "0px" && v !== "0" && styleRule.selectorText !== "*") {
          out.push({ prop: p, value: v.trim(), selector: styleRule.selectorText });
        }
      }
    }
  }
  return out;
}

/** Given an element, return the author spacing declarations whose value is NOT
    a plain px (i.e. the interesting ones: em, rem, clamp, %, calc, var). */
export function explainSpacing(el: HTMLElement): { prop: string; value: string }[] {
  const seen = new Set<string>();
  return getAuthorSpacing(el)
    .filter((d) => !/^-?\d+(\.\d+)?px$/.test(d.value)) // skip plain px
    .filter((d) => {
      const k = `${d.prop}:${d.value}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((d) => ({ prop: shortProp(d.prop), value: d.value }));
}

/** "marginTop" -> "margin-top", "rowGap" -> "row-gap". */
export function shortProp(p: string): string {
  return p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** Does an author value (e.g. "0.4em", "1rem") resolve, on `el`, to `targetPx`
    (e.g. "6.4px")? Handles px/em/rem statically; clamp/calc/%/var are fluid and
    return false (we can't statically prove them, and shouldn't rewrite them). */
export function authorResolvesTo(el: HTMLElement, authorValue: string, targetPx: string): boolean {
  const target = parseFloat(targetPx);
  if (Number.isNaN(target)) return false;
  const v = authorValue.trim();
  const near = (a: number, b: number) => Math.abs(a - b) < 0.6;
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^(-?\d+(?:\.\d+)?)px$/))) return near(parseFloat(m[1]), target);
  if ((m = v.match(/^(-?\d+(?:\.\d+)?)em$/))) {
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    return near(parseFloat(m[1]) * fs, target);
  }
  if ((m = v.match(/^(-?\d+(?:\.\d+)?)rem$/))) {
    const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return near(parseFloat(m[1]) * rootFs, target);
  }
  return false; // clamp(), calc(), %, var() — fluid, not snap-eligible
}

/** Whether an author value is a literal we can safely rewrite to a token. */
export function isLiteralLength(value: string): boolean {
  return /^-?\d+(\.\d+)?(px|em|rem)$/.test(value.trim());
}

/** Nearest --space-* token to a px value, with whether it's an exact match. */
export function nearestSpaceToken(
  targetPx: string
): { name: string; px: number; exact: boolean } | null {
  const target = parseFloat(targetPx);
  if (Number.isNaN(target)) return null;
  const cs = getComputedStyle(document.documentElement);
  let best: { name: string; px: number } | null = null;
  for (const name of getSpacingTokenNames()) {
    const px = parseFloat(cs.getPropertyValue(name).trim());
    if (Number.isNaN(px)) continue;
    if (!best || Math.abs(px - target) < Math.abs(best.px - target)) {
      best = { name, px };
    }
  }
  if (!best) return null;
  return { ...best, exact: Math.abs(best.px - target) < 0.01 };
}

/** Lightweight box + tag for the always-on outline (architecture) mode. */
export type OutlineItem = {
  left: number;
  top: number;
  width: number;
  height: number;
  tag: string;
};

/** Build a short selector-style tag for an element. */
export function elementTag(el: HTMLElement): string {
  return (
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim()
      ? `.${el.className.trim().split(/\s+/)[0]}`
      : "")
  );
}

/* A precise, copy-paste instruction for Claude Code to change ONE element's
   CSS rule. Used everywhere we'd otherwise risk a global find-replace: element
   "Save to CSS", token "Create token", and spacing "copy → token". The locator
   (selector + optional text snippet) lets Claude find the exact rule and edit
   only that, never touching unrelated elements that share the value. */
export function buildClaudePromptFor(
  selector: string,
  snippet: string,
  prop: string,
  from: string,
  to: string
): string {
  // Lead with a plain-English statement of the intent so the command reads like
  // a request, not just a diff: "Change the text color ... from X to Y".
  const intent = humanizeChange(prop, from, to);
  return (
    `${intent} ` +
    `The element matches \`${selector}\`` +
    `${snippet ? ` (its text starts with: "${snippet}")` : ""}. ` +
    `In my codebase, find the exact CSS rule that styles this element and set ` +
    `its \`${prop}\` to \`${to}\` — edit ONLY that rule. Do not do a global ` +
    `find-replace, and don't touch other elements that happen to use \`${from}\`.`
  );
}

/** Plain-English description of a single CSS-property change, used to lead the
    copy-for-Claude command. Maps the raw property to a friendlier phrase
    ("text color", "font size") and falls back to the property name otherwise. */
export function humanizeChange(prop: string, from: string, to: string): string {
  const FRIENDLY: Record<string, string> = {
    color: "text color",
    "background-color": "background color",
    background: "background",
    "font-size": "font size",
    "font-weight": "font weight",
    "line-height": "line height",
    "letter-spacing": "letter spacing",
    "border-color": "border color",
    "border-radius": "corner radius",
    margin: "margin",
    padding: "padding",
    gap: "gap",
    width: "width",
    height: "height",
  };
  const label = FRIENDLY[prop] ?? prop.replace(/-/g, " ");
  return `Change the ${label} from \`${from}\` to \`${to}\`.`;
}

/** Convenience: build the prompt from a live element (derives selector + text). */
export function buildClaudePrompt(
  el: HTMLElement,
  prop: string,
  from: string,
  to: string
): string {
  const cls =
    typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).join(".")
      : "";
  const selector = `${el.tagName.toLowerCase()}${cls}`;
  // Sanitize the text snippet before it goes into the clipboard prompt: strip
  // quotes/backticks/newlines so page content can't break out of the quoted
  // context and bias the Claude Code agent the user pastes it into.
  const snippet = (el.textContent || "")
    .replace(/["'`\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return buildClaudePromptFor(selector, snippet, prop, from, to);
}

/** Collect a box for every rendered element, for the static outline layer. */
export function collectOutline(): OutlineItem[] {
  const items: OutlineItem[] = [];
  const all = document.body.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    if (isOverlayNode(el)) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const rect = el.getBoundingClientRect();
    // Skip zero-size and fully off-screen elements.
    if (rect.width < 1 || rect.height < 1) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    items.push({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      tag: elementTag(el),
    });
  });
  return items;
}

/* ------------------------------------------------------------------ */
/* Per-element spec extraction                                         */
/* ------------------------------------------------------------------ */

export type Sides = { top: number; right: number; bottom: number; left: number };
/** A callout row: [label, value, swatch?, note?].
    - swatch: a raw color for the color chip (color rows only).
    - note: an explanation shown via an ⓘ hint when the displayed value needs
      context (e.g. why the editable width differs from the rendered size). */
export type SpecRow = [string, string, (string | undefined)?, (string | undefined)?];
export type Spec = {
  rect: DOMRect;
  padding: Sides;
  margin: Sides;
  tag: string;
  groups: { title: string; rows: SpecRow[] }[];
  width: number;
  height: number;
  // The inspected element, so callout edits can write inline styles to it.
  el: HTMLElement;
};

/* Callout rows that can be written back. Maps the row LABEL shown in the
   callout to the real CSS property it edits, the picker type, and whether the
   field can map to a design token. `tokenable: false` rows (geometry, layout)
   are element-only — they write an inline style on the hovered element but
   have no token to feed, so they're disabled in token mode.

   `text: true` marks a free-text value (e.g. shorthand "16 8 16 8", or an
   enum like display) that gets a plain text input, no color/number picker. */
export const EDITABLE_FIELDS: Record<
  string,
  { prop: string; kind: "color" | "size"; tokenable: boolean; text?: boolean }
> = {
  // Type — tokenable (these feed --text-* / token values).
  size: { prop: "font-size", kind: "size", tokenable: true },
  weight: { prop: "font-weight", kind: "size", tokenable: true },
  "line-height": { prop: "line-height", kind: "size", tokenable: true },
  "letter-spacing": { prop: "letter-spacing", kind: "size", tokenable: true },
  // Color — tokenable.
  color: { prop: "color", kind: "color", tokenable: true },
  background: { prop: "background-color", kind: "color", tokenable: true },
  // Box model — element-only. Shorthand-friendly free text.
  width: { prop: "width", kind: "size", tokenable: false, text: true },
  height: { prop: "height", kind: "size", tokenable: false, text: true },
  "max-width": { prop: "max-width", kind: "size", tokenable: false, text: true },
  margin: { prop: "margin", kind: "size", tokenable: false, text: true },
  padding: { prop: "padding", kind: "size", tokenable: false, text: true },
  gap: { prop: "gap", kind: "size", tokenable: false, text: true },
  // Layout — element-only enums, free text.
  display: { prop: "display", kind: "size", tokenable: false, text: true },
  position: { prop: "position", kind: "size", tokenable: false, text: true },
  align: { prop: "text-align", kind: "size", tokenable: false, text: true },
  // Effects — element-only.
  radius: { prop: "border-radius", kind: "size", tokenable: false, text: true },
};

/** Explain why an element's rendered size (getBoundingClientRect) differs from
    its CSS width/height (the editable value). The displayed number is the CSS
    value; this note tells the user what the extra/missing pixels are — border,
    padding (under content-box), or a transform — so the two numbers don't look
    like a glitch. Returns undefined when they match (no note needed). */
export function dimensionNote(
  axis: "width" | "height",
  cs: CSSStyleDeclaration,
  renderedPx: number
): string | undefined {
  const cssPx = parseFloat(axis === "width" ? cs.width : cs.height);
  if (Number.isNaN(cssPx)) return undefined;
  const diff = renderedPx - cssPx;
  // Ignore sub-pixel rounding (< 1.5px) — not worth a hint, and it'd put an ⓘ on
  // nearly every element.
  if (Math.abs(diff) < 1.5) return undefined;

  const r = (n: number) => Math.round(n * 10) / 10;
  const sideA = axis === "width" ? "borderLeftWidth" : "borderTopWidth";
  const sideB = axis === "width" ? "borderRightWidth" : "borderBottomWidth";
  const padA = axis === "width" ? "paddingLeft" : "paddingTop";
  const padB = axis === "width" ? "paddingRight" : "paddingBottom";
  const border =
    parseFloat(cs[sideA as keyof CSSStyleDeclaration] as string) +
    parseFloat(cs[sideB as keyof CSSStyleDeclaration] as string);
  const padding =
    parseFloat(cs[padA as keyof CSSStyleDeclaration] as string) +
    parseFloat(cs[padB as keyof CSSStyleDeclaration] as string);
  const contentBox = cs.boxSizing === "content-box";

  const causes: string[] = [];
  if (border > 0.5) causes.push(`${r(border)}px border`);
  if (contentBox && padding > 0.5) causes.push(`${r(padding)}px padding`);
  if (cs.transform && cs.transform !== "none") causes.push("a transform");

  const rendered = `Rendered ${r(renderedPx)}px on screen`;
  if (causes.length === 0) {
    // Diff exists but none of the usual suspects — likely a transform/zoom.
    return `${rendered}. The editable value is the CSS ${axis} (${r(cssPx)}px), which the rendered size differs from.`;
  }
  const sign = diff > 0 ? "adds" : "removes";
  return `${rendered} — ${causes.join(" + ")} ${sign} ${r(Math.abs(diff))}px outside the CSS ${axis}. The editable value is the CSS ${axis} (${r(cssPx)}px).`;
}

export function buildSpec(el: HTMLElement): Spec {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  const pad = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  const mar = {
    top: parseFloat(cs.marginTop) || 0,
    right: parseFloat(cs.marginRight) || 0,
    bottom: parseFloat(cs.marginBottom) || 0,
    left: parseFloat(cs.marginLeft) || 0,
  };

  const round = (n: number) => Math.round(n * 10) / 10;
  const px = (v: string) => {
    const n = parseFloat(v);
    return Number.isNaN(n) ? v : `${round(n)}px`;
  };

  const tag =
    el.tagName.toLowerCase() +
    (el.id ? `#${el.id}` : "") +
    (typeof el.className === "string" && el.className.trim()
      ? `.${el.className.trim().split(/\s+/)[0]}`
      : "");

  // Compact box-model shorthand: "16" if all sides equal, else "t r b l".
  const sidesStr = (s: Sides) => {
    const r = (n: number) => round(n);
    if (s.top === s.right && s.right === s.bottom && s.bottom === s.left)
      return `${r(s.top)}`;
    if (s.top === s.bottom && s.left === s.right) return `${r(s.top)} ${r(s.left)}`;
    return `${r(s.top)} ${r(s.right)} ${r(s.bottom)} ${r(s.left)}`;
  };

  // Box model — always show margin & padding (even when 0) for examination.
  // Use the COMPUTED width/height (the CSS content-box value, e.g. 167.336px),
  // not the rendered rect (which includes borders, e.g. 172.3px). This keeps the
  // displayed number identical to what the editor seeds when you click to edit,
  // so it never appears to "jump" on edit. Fall back to the rect if the computed
  // value isn't a concrete pixel length (rare). The highlight boxes still use
  // `rect` for true on-screen size.
  const computedLen = (cssVal: string, fallback: number) =>
    /^-?\d*\.?\d+px$/.test(cssVal) ? `${round(parseFloat(cssVal))}px` : `${round(fallback)}px`;
  const boxRows: SpecRow[] = [
    ["width", computedLen(cs.width, rect.width), undefined, dimensionNote("width", cs, rect.width)],
    ["height", computedLen(cs.height, rect.height), undefined, dimensionNote("height", cs, rect.height)],
  ];
  if (cs.maxWidth !== "none") boxRows.push(["max-width", px(cs.maxWidth)]);
  boxRows.push(["margin", sidesStr(mar)]);
  boxRows.push(["padding", sidesStr(pad)]);

  // Typography
  const typeRows: SpecRow[] = [
    ["font", shortFont(cs.fontFamily)],
    ["size", px(cs.fontSize)],
    ["weight", cs.fontWeight],
    ["line-height", cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight)],
  ];
  if (cs.letterSpacing !== "normal")
    typeRows.push(["letter-spacing", px(cs.letterSpacing)]);
  typeRows.push(["align", cs.textAlign]);

  // Color (value carries a third "swatch" entry = the raw color)
  const colorRows: SpecRow[] = [];
  const textColor = cs.color;
  colorRows.push(["color", rgbToHex(textColor), textColor]);
  const bg = cs.backgroundColor;
  if (!isTransparent(bg)) colorRows.push(["background", rgbToHex(bg), bg]);

  // Layout
  const layoutRows: SpecRow[] = [
    ["display", cs.display],
    ["position", cs.position],
  ];
  const isFlexOrGrid = /flex|grid/.test(cs.display);
  if (isFlexOrGrid && cs.gap && cs.gap !== "normal" && cs.gap !== "0px") {
    layoutRows.push(["gap", cs.gap]);
  }

  // Effects
  const effectRows: SpecRow[] = [];
  if (cs.borderRadius && cs.borderRadius !== "0px")
    effectRows.push(["radius", cs.borderRadius]);
  if (cs.boxShadow && cs.boxShadow !== "none")
    effectRows.push(["shadow", shorten(cs.boxShadow, 34)]);
  const borderColor = cs.borderTopColor;
  if (parseFloat(cs.borderTopWidth) > 0 && !isTransparent(borderColor)) {
    effectRows.push(["border", `${px(cs.borderTopWidth)} ${rgbToHex(borderColor)}`, borderColor]);
  }

  const groups = [
    { title: "Box", rows: boxRows },
    { title: "Type", rows: typeRows },
    { title: "Color", rows: colorRows },
    { title: "Layout", rows: layoutRows },
  ];
  if (effectRows.length) groups.push({ title: "Effects", rows: effectRows });

  return {
    rect,
    padding: pad,
    margin: mar,
    tag,
    groups,
    width: rect.width,
    height: rect.height,
    el,
  };
}

/* Map a callout color/size value back to a matching token name, if one feeds
   it. Returns the token name (e.g. "--foreground", "--text-title") or null.
   For colors we compare normalized hex; for sizes we compare px values. */
export function tokenForValue(
  kind: "color" | "size",
  value: string
): string | null {
  const root = getComputedStyle(document.documentElement);
  const defs = allTokenDefs();
  const names = defs.filter((t) => t.kind === kind).map((t) => t.name);
  if (kind === "color") {
    const want = value.toLowerCase();
    for (const name of names) {
      const v = root.getPropertyValue(name).trim();
      if (v && rgbToHex(v).toLowerCase() === want) return name;
    }
    return null;
  }
  const want = parseFloat(value);
  if (Number.isNaN(want)) return null;
  for (const name of names) {
    const v = root.getPropertyValue(name).trim();
    if (v && Math.abs(parseFloat(v) - want) < 0.5) return name;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Page-wide inventory collection                                     */
/* ------------------------------------------------------------------ */

export type ColorUsage = { text: number; bg: number; border: number };

/** Pull every color token out of a CSS value string (e.g. a gradient or a
    multi-color box-shadow). getComputedStyle resolves colors to rgb()/rgba(),
    so we match those plus any lab()/oklab()/lch()/oklch()/hsl()/color() and hex.
    Used to surface gradient/shadow colors the per-property scan would miss. */
export function extractColors(value: string): string[] {
  if (!value || value === "none") return [];
  const re =
    /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)|#[0-9a-fA-F]{3,8}\b/g;
  return value.match(re) ?? [];
}

/** Below this alpha a shadow tint is effectively invisible — don't inventory it. */
const MIN_VISIBLE_ALPHA = 0.12;

/** Feed every paintable color on `el` to `emit(color, role)`. One place for all
    the color sources — text, background, borders, gradients, SVG fill/stroke,
    outline, and box-shadow — so the inventory loop stays readable and the set of
    sources is easy to see and test. `hasText` gates the inherited text color so
    structural wrappers don't pollute the text bucket. */
export function collectElementColors(
  el: HTMLElement,
  cs: CSSStyleDeclaration,
  hasText: boolean,
  emit: (color: string, role: keyof ColorUsage) => void
): void {
  if (hasText) emit(cs.color, "text");
  emit(cs.backgroundColor, "bg");
  if (parseFloat(cs.borderTopWidth) > 0) emit(cs.borderTopColor, "border");

  // Gradient stops in background-image (treated as bg fills).
  if (cs.backgroundImage && cs.backgroundImage.includes("gradient")) {
    for (const c of extractColors(cs.backgroundImage)) emit(c, "bg");
  }
  // SVG fill/stroke — only real SVG nodes, and skip the UA-default black fill
  // (which would otherwise inject black from every iconless SVG).
  const isSvg = el.namespaceURI === "http://www.w3.org/2000/svg";
  if (isSvg && cs.fill && cs.fill !== "none" && cs.fill !== "rgb(0, 0, 0)")
    emit(cs.fill, "bg");
  if (isSvg && cs.stroke && cs.stroke !== "none") emit(cs.stroke, "border");
  // The outline ring (border-like) — only when it's a REAL, visible outline.
  // `outline-color` defaults to the element's text `color` (e.g. #161616), so
  // counting every element with an outline width would flood the border bucket
  // with the text color. Require a visible outline-style AND a color that isn't
  // just the inherited text color.
  if (
    parseFloat(cs.outlineWidth) > 0 &&
    cs.outlineStyle !== "none" &&
    colorKey(cs.outlineColor) !== colorKey(cs.color)
  ) {
    emit(cs.outlineColor, "border");
  }
  // box-shadow colors (a shadow may carry several); drop near-invisible tints.
  if (cs.boxShadow && cs.boxShadow !== "none") {
    for (const c of extractColors(cs.boxShadow)) {
      if (!isTransparent(c) && colorAlpha(c) >= MIN_VISIBLE_ALPHA) emit(c, "border");
    }
  }
}

export type Inventory = {
  colors: { value: string; raw: string; count: number; usage: ColorUsage }[];
  typeScale: { size: number; weight: string; lineHeight: string; count: number }[];
  spacing: { value: string; count: number }[];
  fonts: { value: string; count: number }[];
  // Live element refs per value, for click-to-highlight ("show where used").
  spacingEls: Map<string, HTMLElement[]>;
  colorEls: Map<string, HTMLElement[]>; // keyed by normalized color value
  typeEls: Map<string, HTMLElement[]>; // keyed by "32px" font-size
};

export function collectInventory(): Inventory {
  const colors = new Map<string, { raw: string; count: number; usage: ColorUsage }>();
  const type = new Map<string, { size: number; weight: string; lineHeight: string; count: number }>();
  const spacing = new Map<string, number>();
  const fonts = new Map<string, number>();

  const bump = (map: Map<string, number>, key: string) =>
    map.set(key, (map.get(key) ?? 0) + 1);

  const colorEls = new Map<string, HTMLElement[]>();
  const addColor = (raw: string, role: keyof ColorUsage, el: HTMLElement) => {
    if (isTransparent(raw)) return;
    const key = colorKey(raw);
    let entry = colors.get(key);
    if (!entry) {
      entry = { raw, count: 0, usage: { text: 0, bg: 0, border: 0 } };
      colors.set(key, entry);
    }
    entry.count += 1;
    entry.usage[role] += 1;
    const arr = colorEls.get(key);
    if (arr) {
      if (!arr.includes(el)) arr.push(el);
    } else colorEls.set(key, [el]);
  };

  const typeEls = new Map<string, HTMLElement[]>();

  // Element refs per spacing value, so a click can highlight where it's used.
  const spacingEls = new Map<string, HTMLElement[]>();
  const addSpacing = (value: string, el: HTMLElement) => {
    value
      .split(/\s+/)
      .filter((v) => v && v !== "0px" && v !== "normal" && v !== "auto")
      .forEach((v) => {
        bump(spacing, v);
        const arr = spacingEls.get(v);
        if (arr) {
          if (!arr.includes(el)) arr.push(el);
        } else spacingEls.set(v, [el]);
      });
  };

  const all = document.body.querySelectorAll<HTMLElement>("*");
  all.forEach((el) => {
    if (isOverlayNode(el)) return;
    const cs = getComputedStyle(el);

    // Skip non-rendered nodes to keep the inventory meaningful.
    if (cs.display === "none" || cs.visibility === "hidden") return;

    // Does this node actually paint its own text? Every element inherits a
    // `color`, but only text-bearing ones use it as a TEXT color. Counting the
    // inherited color on every wrapper <div> inflated structural colors (e.g.
    // white) into the "text" bucket, producing absurd suggestions like
    // "#ffffff -> --text-tertiary". Gate the text role on real text content.
    const hasText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
    );

    collectElementColors(el, cs, hasText, (color, role) => addColor(color, role, el));

    const rawSize = parseFloat(cs.fontSize);
    // Skip nodes whose font-size doesn't resolve to a real number — they'd
    // otherwise show up as a bogus "NaNpx / NaNpx" row in the type scale.
    if (hasText && Number.isFinite(rawSize)) {
      const size = Math.round(rawSize * 10) / 10;
      const rawLh = parseFloat(cs.lineHeight);
      const lh =
        cs.lineHeight === "normal" || !Number.isFinite(rawLh)
          ? "normal"
          : `${Math.round(rawLh * 10) / 10}px`;
      const key = `${size}|${cs.fontWeight}|${lh}`;
      const entry = type.get(key);
      if (entry) entry.count += 1;
      else type.set(key, { size, weight: cs.fontWeight, lineHeight: lh, count: 1 });

      const sizeKey = `${size}px`;
      const arr = typeEls.get(sizeKey);
      if (arr) {
        if (!arr.includes(el)) arr.push(el);
      } else typeEls.set(sizeKey, [el]);

      bump(fonts, shortFont(cs.fontFamily));
    }

    addSpacing(cs.margin, el);
    addSpacing(cs.padding, el);
    if (/flex|grid/.test(cs.display) && cs.gap && cs.gap !== "normal") {
      addSpacing(cs.gap, el);
    }
  });

  // Normalize spacing values for sorting (px numeric first, then the rest).
  const spacingArr = Array.from(spacing.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      const na = parseFloat(a.value);
      const nb = parseFloat(b.value);
      if (Number.isNaN(na) && Number.isNaN(nb)) return b.count - a.count;
      if (Number.isNaN(na)) return 1;
      if (Number.isNaN(nb)) return -1;
      return na - nb;
    });

  return {
    colors: Array.from(colors.entries())
      .map(([value, { raw, count, usage }]) => ({ value, raw, count, usage }))
      .sort((a, b) => b.count - a.count),
    typeScale: Array.from(type.values()).sort((a, b) => b.size - a.size),
    spacing: spacingArr,
    fonts: Array.from(fonts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    spacingEls,
    colorEls,
    typeEls,
  };
}

/* ------------------------------------------------------------------ */
/* Editable design tokens (definitions live in ./designSpecTokens)     */
/* ------------------------------------------------------------------ */

/** #rrggbb -> "rgba(r,g,b,a)" — used to derive the soft accent fill. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "");
  if (m.length < 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** A "clean" fixed spacing value worth tokenizing: a positive px on a whole
    or half pixel. Excludes clamp() snapshots (fractional) and negatives. */
export function isCleanPx(value: string): boolean {
  const m = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (!m) return false;
  const n = parseFloat(m[1]);
  if (n <= 0) return false;
  // Whole or .5 only — clamp snapshots like 6.4128px are rejected.
  return Math.abs(n * 2 - Math.round(n * 2)) < 1e-6;
}

/** Suggest a --space-N name for a clean px value (N = px/4, base-8 scale). */
export function suggestSpaceName(value: string, takenNames: Set<string>): string {
  const n = parseFloat(value);
  const step = n / 4; // 4px = space-1, 8 = space-2, 16 = space-4 ...
  const base =
    Number.isInteger(step) ? `space-${step}` : `space-${String(step).replace(".", "-")}`;
  if (!takenNames.has(`--${base}`)) return `--${base}`;
  for (let i = 2; i < 20; i++) {
    if (!takenNames.has(`--${base}-${i}`)) return `--${base}-${i}`;
  }
  return `--${base}`;
}

/** Read the current resolved value of every editable token. */
export function readTokenValues(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  allTokenDefs().forEach((t) => {
    out[t.name] = cs.getPropertyValue(t.name).trim();
  });
  return out;
}

/** Relative luminance (0=black, 1=white) of a #hex (Rec. 709 weights). */
export function hexLuminance(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length < 6) return 0.5;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export type SuggestColor = { value: string; usage: ColorUsage };

/** Suggest a role-based token name for an untokenized color, from its dominant
    usage and luminance band. e.g. a text-only mid-gray -> --text-secondary. */
export function suggestTokenName(target: SuggestColor, takenNames: Set<string>): string {
  const { usage } = target;
  // Dominant role = whichever usage is highest.
  const role =
    usage.bg >= usage.text && usage.bg >= usage.border
      ? "bg"
      : usage.border >= usage.text && usage.border >= usage.bg
      ? "border"
      : "text";

  const uniq = (base: string) => {
    // Append a tier number until the name is free.
    if (!takenNames.has(`--${base}`)) return `--${base}`;
    for (let i = 2; i < 20; i++) {
      if (!takenNames.has(`--${base}-${i}`)) return `--${base}-${i}`;
    }
    return `--${base}`;
  };

  if (role === "bg") {
    // Light bg = a surface; darker bg = an overlay/inverse.
    return uniq(hexLuminance(target.value) > 0.5 ? "surface-2" : "surface-inverse");
  }
  if (role === "border") return uniq("border-2");

  // Text tier by luminance band, not raw rank: near-black is primary ink,
  // mid grays are secondary, light grays tertiary. Avoids over-counting the
  // many near-identical dark inks as separate tiers.
  const lum = hexLuminance(target.value);
  const tierName =
    lum < 0.25 ? "text-primary" : lum < 0.6 ? "text-secondary" : "text-tertiary";
  return uniq(tierName);
}

/** Plain-English rationale for the suggested name: how the dominant role and
    luminance led to it. Shown as a "why" tooltip so the suggestion isn't a
    black box. */
export function explainSuggestion(target: SuggestColor): string {
  const { usage } = target;
  const total = usage.text + usage.bg + usage.border || 1;
  const role =
    usage.bg >= usage.text && usage.bg >= usage.border
      ? "bg"
      : usage.border >= usage.text && usage.border >= usage.bg
      ? "border"
      : "text";
  const pct = (n: number) => Math.round((n / total) * 100);
  const lum = hexLuminance(target.value);
  const band =
    lum < 0.25 ? "very dark" : lum < 0.6 ? "mid-tone" : "light";

  if (role === "bg") {
    return `Mostly a background (${pct(usage.bg)}% of ${total} uses). ${
      lum > 0.5 ? "Light → a surface." : "Dark → an inverse/overlay surface."
    }`;
  }
  if (role === "border") {
    return `Mostly a border (${pct(usage.border)}% of ${total} uses) → a border token.`;
  }
  return `Mostly text (${pct(usage.text)}% of ${total} uses), ${band} → ${
    lum < 0.25
      ? "primary ink."
      : lum < 0.6
      ? "secondary text."
      : "tertiary text."
  }`;
}

/** Map a normalized hex -> friendly token label (first match wins), for the
    color color-token tokens only. Used to annotate the rendered-color list. */
/** Every `--name` custom property declared in a :root rule across the page's
    own stylesheets. Picks up tokens written to CSS in a PRIOR session (e.g.
    --text-secondary), which the hardcoded built-in list doesn't know about.
    Cross-origin sheets are skipped (their cssRules throw). */
export function readDeclaredTokens(): { name: string; value: string }[] {
  const found = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      // :root (and the dark-theme :root[data-theme="dark"]) hold the tokens.
      if (!rule.selectorText || !rule.selectorText.includes(":root")) continue;
      const style = rule.style;
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        if (prop.startsWith("--") && !found.has(prop)) {
          found.set(prop, style.getPropertyValue(prop).trim());
        }
      }
    }
  }
  return Array.from(found, ([name, value]) => ({ name, value }));
}

/** Memo for isCssColor: a value's color-ness never changes, so probe each
    distinct value once. buildEditableGroups re-runs on every inventory change
    (token save/edit/refresh); on a token-heavy design system this turns N forced
    style recalcs per sweep into N cache hits. Measured ~16× faster at 300 tokens
    (0.30ms vs ~5ms), negligible but harmless at this portfolio's 39. */
const cssColorCache = new Map<string, boolean>();

/** Does the browser accept `value` as a color? Uses the probe technique (set it
    on a throwaway element after a sentinel; if it sticks it's a real color).
    Rejects "440ms", "16px", "cubic-bezier(...)" without guessing by regex.
    Result is cached per value (see cssColorCache). */
export function isCssColor(value: string): boolean {
  const cached = cssColorCache.get(value);
  if (cached !== undefined) return cached;
  const probe = document.createElement("div");
  probe.style.color = "rgb(1, 2, 3)";
  probe.style.color = value;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const result = !!resolved && resolved !== "rgb(1, 2, 3)";
  cssColorCache.set(value, result);
  return result;
}

/** Classify a token by VALUE (color sniff → length regex). Returns null for
    values that are neither (durations, easings, font stacks) so they're left
    out of the editable panel rather than guessed at. Name only sub-classifies
    sizes (type/space) later — never decides color-vs-size. */
export function inferKind(value: string): TokenKind | null {
  const v = value.trim();
  if (!v) return null;
  // CSS-wide keywords aren't editable values (and `initial` falsely probes as a
  // color). Skip them — these show up on build-tool-injected vars.
  if (/^(initial|inherit|unset|revert|revert-layer|none|auto)$/i.test(v))
    return null;
  // length / fluid length
  if (/^-?\d*\.?\d+(px|rem|em|vh|vw|vmin|vmax|%|ch)$/.test(v)) return "size";
  if (/^(clamp|calc|min|max)\(/.test(v) && /(px|rem|em|vh|vw|%)/.test(v))
    return "size";
  if (isCssColor(v)) return "color";
  return null;
}

/** The live editable token list, grouped, derived from the CSS that's actually
    declared on :root (readDeclaredTokens) + curated TOKEN_OVERRIDES for nicer
    labels/groups. Works with zero curation (a foreign project) and keeps this
    portfolio's hand-picked labels. */
export function buildEditableGroups(): { group: string; tokens: TokenDef[] }[] {
  const order = ["Colors", "Type scale", "Spacing", "Sizes", "Other"];
  const buckets = new Map<string, TokenDef[]>();
  const push = (group: string, t: TokenDef) => {
    const arr = buckets.get(group) ?? [];
    arr.push(t);
    buckets.set(group, arr);
  };
  const derivedLabel = (name: string) =>
    name.replace(/^--/, "").replace(/-/g, " ");

  for (const { name, value } of readDeclaredTokens()) {
    const kind = inferKind(value);
    if (!kind) continue; // not editable (duration/easing/etc.)
    const ov = TOKEN_OVERRIDES[name];
    const label = ov?.label ?? derivedLabel(name);
    let group = ov?.group;
    if (!group) {
      if (kind === "color") group = "Colors";
      else if (/^--text[-_]/.test(name)) group = "Type scale";
      else if (/^--space[-_]/.test(name)) group = "Spacing";
      else group = "Sizes";
    }
    push(group, { name, label, kind });
  }

  // Stable order: known groups first (in `order`), then any extras alphabetical.
  const groupNames = Array.from(buckets.keys()).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
  return groupNames.map((group) => ({ group, tokens: buckets.get(group)! }));
}

/** All editable token defs, flat (replaces the static ALL_TOKEN_DEFS at runtime). */
export function allTokenDefs(): TokenDef[] {
  return buildEditableGroups().flatMap((g) => g.tokens);
}

/** Spacing token names, derived from declared `--space-*` length tokens
    (replaces the hardcoded SPACING_TOKEN_NAMES). */
export function getSpacingTokenNames(): string[] {
  return readDeclaredTokens()
    .filter((t) => /^--space[-_]/.test(t.name) && inferKind(t.value) === "size")
    .map((t) => t.name);
}

export function buildColorTokenLabels(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  // Resolve token values to the SAME canonical form the inventory uses:
  // getComputedStyle yields rgb(...), so push each token through a probe to
  // get its rgb(), then colorKey() it. (A raw "#fff" wouldn't match the
  // inventory's "#ffffff" otherwise.)
  const probe = document.createElement("div");
  document.body.appendChild(probe);
  const label = (name: string) => name.replace(/^--/, "").replace(/-/g, " ");
  const add = (name: string, rawVal?: string) => {
    const raw = (rawVal ?? cs.getPropertyValue(name)).trim();
    if (!raw) return;
    // Validate that the raw value is actually a color before probing: set it
    // on a throwaway property and check the browser kept it. This rejects
    // "440ms", "16px", "cubic-bezier(...)", etc. without guessing by regex.
    // Crucially, reset to a sentinel FIRST so a rejected value can't leave the
    // previous color in place (which mismapped --theme-transition-duration to
    // the body text color).
    probe.style.color = "rgb(1, 2, 3)";
    probe.style.color = raw;
    const resolved = getComputedStyle(probe).color;
    if (!resolved || resolved === "rgb(1, 2, 3)") return; // not a valid color
    const key = colorKey(resolved);
    if (!(key in out)) out[key] = label(name); // first match wins
  };
  // Every token declared in the live CSS (file-written tokens included). Only
  // color-resolving ones land in `out` — `add` rejects non-colors via probe.
  readDeclaredTokens().forEach((t) => add(t.name, t.value));
  document.body.removeChild(probe);
  return out;
}

/** Map a resolved spacing value (e.g. "16px") -> token label (e.g. "space-4").
    First match wins, so duplicate-valued tokens pick the earliest in the list. */
export function buildSpacingTokenLabels(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  getSpacingTokenNames().forEach((name) => {
    const raw = cs.getPropertyValue(name).trim(); // e.g. "16px"
    if (!raw) return;
    if (!(raw in out)) out[raw] = spacingLabel(name);
  });
  return out;
}

/** px value -> spacing token NAME (e.g. "16px" -> "--space-4"), first wins. */
export function buildSpacingTokenNames(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  getSpacingTokenNames().forEach((name) => {
    const raw = cs.getPropertyValue(name).trim();
    if (raw && !(raw in out)) out[raw] = name;
  });
  return out;
}

/** px font-size -> type token NAME (e.g. "32px" -> "--text-display"). */
export function buildTypeTokenNames(): Record<string, string> {
  const cs = getComputedStyle(document.documentElement);
  const out: Record<string, string> = {};
  allTokenDefs()
    .filter((t) => t.kind === "size" && t.name.startsWith("--text-"))
    .forEach((t) => {
      const raw = cs.getPropertyValue(t.name).trim();
      if (raw && !(raw in out)) out[raw] = t.name;
    });
  return out;
}

/* ---------------------------------------------------------------------------
 * Token-edit state transforms (pure)
 *
 * These are the bug-prone reconciliations that used to live inline in the
 * component's setState callbacks. Pulled out so they can be unit-tested without
 * React — they encode the rules that regressed repeatedly: only sync values
 * that actually landed in the file, and carry a token's value to its new key on
 * rename (so the editor row doesn't go blank).
 * ------------------------------------------------------------------------- */

type TokenMap = Record<string, string>;

/** After a save, merge into tokenBase ONLY the edits the server confirmed it
 *  wrote (`updated`). Edits the server reported as `missed` are left at their
 *  prior baseline — the live preview made them look changed, but the file
 *  wasn't touched, so the editor must not show them as saved. */
export function mergeSavedTokenBase(
  base: TokenMap,
  edits: TokenMap,
  updated: string[]
): TokenMap {
  const updatedSet = new Set(updated);
  const next = { ...base };
  for (const [name, value] of Object.entries(edits)) {
    if (updatedSet.has(name)) next[name] = value;
  }
  return next;
}

/** Move a single key's value from `from` to `to` in a token map, dropping the
 *  old key. Used on rename for BOTH tokenBase and tokenEdits so the row keeps
 *  its value under the new name instead of rendering blank. A no-op (returns
 *  the same reference) when `from` isn't present. */
export function migrateTokenKey(
  map: TokenMap,
  from: string,
  to: string
): TokenMap {
  if (!(from in map)) return map;
  const next = { ...map, [to]: map[from] };
  delete next[from];
  return next;
}

/** Reconcile a server update response: returns the names that landed and the
 *  names that were missed, defaulting `updated` to all requested names when the
 *  server omitted the field (older route shape). */
export function reconcileUpdateResponse(
  requested: string[],
  data: { updated?: string[]; missed?: string[] }
): { updated: string[]; missed: string[] } {
  const updated = data.updated ?? requested;
  const missed = data.missed ?? [];
  return { updated, missed };
}

/** Normalize a CSS color to #rrggbb so it fits an <input type=color>. */
export function toHexColor(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  // Resolve named/rgb values via a probe element.
  const probe = document.createElement("div");
  probe.style.color = value;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#000000";
  const hex = (n: string) => parseInt(n, 10).toString(16).padStart(2, "0");
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
}
