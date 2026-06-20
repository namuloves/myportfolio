/**
 * Pure, theme-aware CSS token operations (postcss). Extracted from the route so
 * they can be unit-tested without filesystem/HTTP. Every editing op operates on
 * BASE/LIGHT :root rules only — dark-theme blocks are never touched.
 */

import postcss, { Root, Rule, AtRule } from "postcss";

/** Is this :root rule a DARK-theme block? (by selector, or because it lives in
    a prefers-color-scheme: dark media query). */
export function isDarkRule(rule: Rule): boolean {
  if (/\[data-theme=["']?dark["']?\]/.test(rule.selector)) return true;
  let p: import("postcss").Container | import("postcss").Document | undefined =
    rule.parent;
  while (p) {
    if (p.type === "atrule") {
      const at = p as AtRule;
      if (at.name === "media" && /prefers-color-scheme:\s*dark/.test(at.params)) {
        return true;
      }
    }
    p = (p as { parent?: typeof p }).parent;
  }
  return false;
}

/** Every EDITABLE :root rule (base + light, never dark). */
export function editableRootRules(root: Root): Rule[] {
  const rules: Rule[] = [];
  root.walkRules((rule) => {
    if (!rule.selector || !rule.selector.includes(":root")) return;
    if (isDarkRule(rule)) return;
    rules.push(rule);
  });
  return rules;
}

/** Score a CSS string as a globals candidate: -1 = not a candidate (no :root),
    else the count of `--token:` declarations inside its :root rules. */
export function scoreGlobalsCandidate(css: string): number {
  let root: Root;
  try {
    root = postcss.parse(css);
  } catch {
    return -1;
  }
  let hasRoot = false;
  let tokenDecls = 0;
  root.walkRules((rule) => {
    if (!rule.selector || !rule.selector.includes(":root")) return;
    hasRoot = true;
    rule.walkDecls((d) => {
      if (d.prop.startsWith("--")) tokenDecls += 1;
    });
  });
  return hasRoot ? tokenDecls : -1;
}

/** Update existing token values in editable :root rules only. Returns the new
    CSS plus which tokens were found (`updated`) vs not (`missed`). */
export function updateTokens(
  css: string,
  tokens: Record<string, string>
): { css: string; updated: string[]; missed: string[] } {
  const root = postcss.parse(css);
  const editable = editableRootRules(root);
  const want = new Map(Object.entries(tokens).map(([k, v]) => [k, v.trim()]));
  const hit = new Set<string>();
  for (const rule of editable) {
    rule.walkDecls((d) => {
      if (want.has(d.prop)) {
        d.value = want.get(d.prop)!;
        hit.add(d.prop);
      }
    });
  }
  const names = Object.keys(tokens);
  return {
    css: root.toString(),
    updated: names.filter((n) => hit.has(n)),
    missed: names.filter((n) => !hit.has(n)),
  };
}

/** Add a new token to the END of the first editable :root rule. Throws if no
    editable rule exists. Returns `{ css, existed }` — existed=true means the
    token was already present (caller treats as 409). */
export function addToken(
  css: string,
  name: string,
  value: string
): { css: string; existed: boolean } {
  const root = postcss.parse(css);
  const editable = editableRootRules(root);
  if (editable.length === 0) {
    throw new Error("No editable :root rule found to add the token to");
  }
  let exists = false;
  for (const rule of editable) {
    rule.walkDecls((d) => {
      if (d.prop === name) exists = true;
    });
  }
  if (exists) return { css, existed: true };
  editable[0].append({ prop: name, value });
  return { css: root.toString(), existed: false };
}
