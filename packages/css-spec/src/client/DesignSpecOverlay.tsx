"use client";

/**
 * Dev-only CSS design-spec overlay.
 *
 * A personal review tool that draws Figma-style redline annotations over the
 * rendered page: per-element box-model + typography + color callouts, and a
 * docked inventory panel that collects every color, font-size, spacing value
 * and font-family actually in use.
 *
 * Guarded so it NEVER renders in production. The component returns null when
 * NODE_ENV === "production", and layout.tsx only mounts it in development, so
 * it is tree-shaken out of the production bundle.
 *
 * Toggle the overlay with ⌥D (Alt+D). A floating control toggles sub-layers.
 */

import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import styles from "./DesignSpecOverlay.module.css";
import {
  type TokenKind,
  type TokenDef,
} from "./designSpecTokens";
import {
  IS_DEV,
  buildEditableGroups,
  shorten,
  isOverlayNode,
  explainSpacing,
  authorResolvesTo,
  isLiteralLength,
  nearestSpaceToken,
  elementTag,
  buildClaudePrompt,
  buildClaudePromptFor,
  collectOutline,
  buildSpec,
  collectInventory,
  hexToRgba,
  isCleanPx,
  suggestSpaceName,
  readTokenValues,
  readDeclaredTokens,
  explainSuggestion,
  suggestTokenName,
  buildColorTokenLabels,
  buildSpacingTokenLabels,
  buildSpacingTokenNames,
  buildTypeTokenNames,
  toHexColor,
  mergeSavedTokenBase,
  migrateTokenKey,
  reconcileUpdateResponse,
  EDITABLE_FIELDS,
  tokenForValue,
  DEFAULT_LAYERS,
  type SubLayers,
  type OutlineItem,
  type Spec,
  type Inventory,
} from "./designSpecHelpers";
import {
  SectionHeader,
  EditableTokenLabel,
} from "./designSpecComponents";
import { useFloatingPanels, useTypePreview, useToast } from "./designSpecHooks";
import { DEFAULT_API_PATH } from "../shared/constants";

/** Props for the overlay. `apiPath` is where the dev route is mounted; it must
    match where the consumer mounted `createDesignSpecHandler()`. */
export type DesignSpecOverlayProps = {
  /** Defaults to `/api/design-spec-dev`. */
  apiPath?: string;
};

/* A crisp checkmark — replaces the thin/off-center unicode ✓ glyph. Inherits
   the button's color via currentColor. */
function Check() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 6.5 5 9l4.5-5.5" />
    </svg>
  );
}

/* Normalize a user-typed token name to a valid `--kebab-case` custom property,
   or return an error string. Tolerant of leading dashes ("-x", "---x", "x" all
   become "--x") and uppercase, so a near-miss like "-text-secondary" doesn't
   silently fail. */
function normalizeTokenName(
  raw: string
): { name: string } | { error: string } {
  let name = raw.trim().toLowerCase();
  if (!name) return { error: "Name required" };
  // Collapse any number of leading dashes to exactly two.
  name = `--${name.replace(/^-+/, "")}`;
  if (!/^--[a-z][a-z0-9-]*$/.test(name)) {
    return { error: "Use letters, numbers, dashes (e.g. --text-secondary)" };
  }
  return { name };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function DesignSpecOverlayInner({ apiPath }: { apiPath: string }) {
  const [enabled, setEnabled] = useState(false);
  // Minimized chip + draggable control-box / chip positions (own hook).
  const {
    minimized,
    setMinimized,
    chipPos,
    panelPos,
    chipDrag,
    onChipMouseDown,
    onPanelMouseDown,
  } = useFloatingPanels();
  const [layers, setLayers] = useState<SubLayers>(DEFAULT_LAYERS);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [pinned, setPinned] = useState(false);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  // Live token edits: token name -> new value. Empty = no override.
  const [tokenEdits, setTokenEdits] = useState<Record<string, string>>({});
  // Baseline values read once when the panel opens, for the picker defaults.
  const [tokenBase, setTokenBase] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  // Add-token form.
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newKind, setNewKind] = useState<TokenKind>("color");
  // Rename form: which token is being renamed + its draft new name.
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  // Tokens added/renamed this session, so the editor can show them too.
  const [extraTokens, setExtraTokens] = useState<TokenDef[]>([]);
  const [renameMap, setRenameMap] = useState<Record<string, string>>({});
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  // Toast: a transient confirmation when something is written to the CSS files
  // (the changes that actually persist + propagate).
  const { toast, showToast, pauseToast, resumeToast, dismissToast } = useToast();
  // Inline "name this color" from an inventory row: which hex + draft name.
  const [namingColor, setNamingColor] = useState<string | null>(null);
  const [colorNameDraft, setColorNameDraft] = useState("");
  // Inline validation error shown right next to the naming input (color or
  // spacing), so the user isn't sent to the collapsed EDIT TOKENS message.
  const [nameError, setNameError] = useState<string | null>(null);
  // After creating a token from a color, the matches the user can convert.
  // `existed` = the token was already in the CSS (vs newly written just now).
  const [colorMatches, setColorMatches] = useState<
    {
      token: string;
      value: string;
      existed: boolean;
      matches: { file: string; line: number; text: string }[];
    } | null
  >(null);
  // Inline "name this spacing" from a row.
  const [namingSpace, setNamingSpace] = useState<string | null>(null);
  const [spaceNameDraft, setSpaceNameDraft] = useState("");
  // Custom drag order for the Spacing list (cosmetic, persisted).
  const [spacingOrder, setSpacingOrder] = useState<string[]>([]);
  const [dragValue, setDragValue] = useState<string | null>(null);
  // Click-to-locate: which spacing value is highlighted, + the elements using it.
  const [locatedSpace, setLocatedSpace] = useState<{
    value: string;
    items: {
      rect: DOMRect;
      tag: string;
      // Author source declarations on this element (for the "why" + snap).
      sources: { prop: string; value: string }[];
    }[];
  } | null>(null);
  // Snap status messages keyed by "tag|prop" so each row reflects its own state.
  const [snapMsg, setSnapMsg] = useState<Record<string, string>>({});
  // Instant custom tooltip (replaces the slow native title) for "why" hovers.
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  // Collapsed panel sections (Figma-style), persisted in localStorage.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // User-chosen highlight accent (null = theme default). Persisted.
  const [accent, setAccent] = useState<string | null>(null);
  // Which side the inventory panel docks to. Default left so the top-right of
  // the page (nav, links) stays examinable. Persisted.
  const [panelSide, setPanelSide] = useState<"left" | "right">("left");
  // Callout edit mode: "token" writes the design token behind the value
  // (propagates everywhere); "element" writes an inline style on just the
  // hovered element. Persisted so it sticks across hovers.
  const [calloutMode, setCalloutMode] = useState<"token" | "element">("token");
  // Which callout row is being edited (group title + row label), + its draft.
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState("");
  const [rowError, setRowError] = useState<string | null>(null);
  // When a token-mode edit finds no matching token, we don't error — we ask:
  // create a token for this value, or change just this element? This holds the
  // pending edit while the user chooses.
  // `source` distinguishes the two callout edit paths that need a choice:
  //  - "token": token mode found no matching token → Create token / Just element
  //  - "element": element mode → Save to CSS / Preview only
  const [noTokenChoice, setNoTokenChoice] = useState<{
    rowKey: string;
    prop: string;
    kind: "color" | "size";
    value: string;
    currentValue: string;
    source: "token" | "element";
  } | null>(null);
  // Inline overrides this session: element -> the set of CSS props WE set, so
  // reset removes only ours (not styles the page itself put inline).
  const elementEdits = useRef<Map<HTMLElement, Set<string>>>(new Map());

  /* Record that we set `prop` inline on `el`, AND prune any elements that have
     since detached from the DOM (e.g. via HMR) so the Map never holds dead
     nodes — without this a long dev session leaks every edited element. */
  const trackElementEdit = useCallback((el: HTMLElement, prop: string) => {
    for (const node of elementEdits.current.keys()) {
      if (node !== el && !node.isConnected) elementEdits.current.delete(node);
    }
    const props = elementEdits.current.get(el) ?? new Set<string>();
    props.add(prop);
    elementEdits.current.set(el, props);
  }, []);

  /* Load persisted collapse state + spacing order + accent once. */
  useEffect(() => {
    if (!IS_DEV) return;
    try {
      const raw = window.localStorage.getItem("ds-collapsed");
      if (raw) setCollapsed(JSON.parse(raw));
      const order = window.localStorage.getItem("ds-spacing-order");
      if (order) setSpacingOrder(JSON.parse(order));
      const acc = window.localStorage.getItem("ds-accent");
      if (acc) setAccent(acc);
      const mode = window.localStorage.getItem("ds-callout-mode");
      if (mode === "element" || mode === "token") setCalloutMode(mode);
      const side = window.localStorage.getItem("ds-panel-side");
      if (side === "left" || side === "right") setPanelSide(side);
    } catch {
      /* ignore */
    }
  }, []);

  const chooseAccent = useCallback((hex: string | null) => {
    setAccent(hex);
    try {
      if (hex) window.localStorage.setItem("ds-accent", hex);
      else window.localStorage.removeItem("ds-accent");
    } catch {
      /* ignore */
    }
  }, []);

  /* Persist a new spacing drag-order. */
  const saveSpacingOrder = useCallback((order: string[]) => {
    setSpacingOrder(order);
    try {
      window.localStorage.setItem("ds-spacing-order", JSON.stringify(order));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem("ds-collapsed", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  // The element currently pinned, so an Alt-click on it can toggle off.
  const pinnedElRef = useRef<HTMLElement | null>(null);
  // True while the cursor is over the spec callout, so hover updates freeze and
  // you can travel into the callout to edit a value without it vanishing.
  const overCalloutRef = useRef(false);
  // True when the CURRENT pin was created just to hold the spec steady during a
  // callout edit (vs the user explicitly Alt-pinning). Finishing the edit then
  // releases the pin so hover inspection resumes.
  const pinForEditRef = useRef(false);
  const locatedRef = useRef(locatedSpace);
  locatedRef.current = locatedSpace;

  /* ⌥D toggles the whole overlay. Esc unpins / hides. */
  useEffect(() => {
    if (!IS_DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "d" || e.key === "D" || e.code === "KeyD")) {
        e.preventDefault();
        setEnabled((v) => !v);
      } else if (
        e.altKey &&
        (e.key === "m" || e.key === "M" || e.code === "KeyM") &&
        enabledRef.current
      ) {
        e.preventDefault();
        setMinimized((v) => !v);
      } else if (e.key === "Escape" && enabledRef.current) {
        if (locatedRef.current) {
          setLocatedSpace(null);
        } else if (pinnedRef.current) {
          // Release the pin AND all edit/freeze flags via the single exit path,
          // so an interrupted edit can't leave overCalloutRef/pinForEditRef
          // stuck (which would kill hover or silently drop a later pin).
          finishEditRef.current(true);
        } else {
          setEnabled(false);
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  /* Hover / click inspection. */
  useEffect(() => {
    if (!IS_DEV || !enabled) return;

    // rAF-throttle the hover spec build: buildSpec calls getComputedStyle +
    // getBoundingClientRect (a style recalc), and mousemove fires on every
    // pixel. Coalesce to one build per frame, and skip if the element under
    // the cursor hasn't changed since the last build.
    let moveRaf = 0;
    let lastTarget: HTMLElement | null = null;
    let pendingTarget: HTMLElement | null = null;
    // When the hovered element CHANGES, defer the rebuild briefly. This creates
    // a grace window so the cursor can cross the gap from the element to the
    // callout (to edit a value) without the in-between elements stealing the
    // spec. If the cursor reaches the callout first, overCalloutRef freezes it.
    let switchTimer: ReturnType<typeof setTimeout> | null = null;
    const clearSwitch = () => {
      if (switchTimer) {
        clearTimeout(switchTimer);
        switchTimer = null;
      }
    };
    const onMove = (e: MouseEvent) => {
      // Self-heal a stuck callout-freeze flag: if the cursor is genuinely over a
      // PAGE element (not any overlay node) yet `overCalloutRef` is still true,
      // the callout's onMouseLeave never fired (it unmounted under the cursor).
      // Clear it here so hover can resume instead of dying.
      if (
        overCalloutRef.current &&
        !pinnedRef.current &&
        e.target &&
        !isOverlayNode(e.target as HTMLElement)
      ) {
        overCalloutRef.current = false;
      }
      if (pinnedRef.current || overCalloutRef.current) {
        clearSwitch();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (!target || isOverlayNode(target)) return;
      pendingTarget = target;
      if (moveRaf) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = 0;
        if (!pendingTarget || pendingTarget === lastTarget) return;
        const next = pendingTarget;
        // First hover (no spec yet) is instant; switching FROM an existing
        // callout waits out the grace window so you can travel to it.
        if (!lastTarget) {
          lastTarget = next;
          setSpec(buildSpec(next));
          return;
        }
        clearSwitch();
        switchTimer = setTimeout(() => {
          switchTimer = null;
          if (overCalloutRef.current || pinnedRef.current) return;
          lastTarget = next;
          setSpec(buildSpec(next));
        }, 90);
      });
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || isOverlayNode(target)) return;
      // Only HIJACK the click to pin when Alt is held (Chrome-style pick). A
      // plain click passes straight through, so links/buttons on the page keep
      // working while the overlay is on.
      if (!e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      // Alt-click the already-pinned element to unpin; otherwise pin the
      // (new) target.
      if (pinnedRef.current && pinnedElRef.current === target) {
        setPinned(false);
        setSpec(null);
      } else {
        pinnedElRef.current = target;
        setPinned(true);
        setSpec(buildSpec(target));
      }
    };

    const onLeave = () => {
      if (!pinnedRef.current && !overCalloutRef.current) {
        clearSwitch();
        lastTarget = null;
        setSpec(null);
      }
    };

    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("click", onClick, true);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      if (moveRaf) cancelAnimationFrame(moveRaf);
      clearSwitch();
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  /* On scroll/resize: drop the hover spec, but keep located highlight boxes
     attached by recomputing their rects from the still-live elements. */
  useEffect(() => {
    if (!IS_DEV || !enabled) return;
    let raf = 0;
    const onScrollResize = () => {
      // Coalesce bursts of scroll events into one update per frame.
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        run();
      });
    };
    const run = () => {
      // Don't drop the spec while the cursor is over the callout or an edit is
      // open — otherwise the callout unmounts mid-interaction and, because no
      // onMouseLeave fires on an unmounting node, `overCalloutRef` would stay
      // stuck true and kill all subsequent hover. (Pinned specs also persist.)
      if (!overCalloutRef.current && !pinnedRef.current) {
        setSpec(null);
      }
      const located = locatedRef.current;
      if (located) {
        // Refresh only the rects; keep each item's tag + sources. The value may
        // belong to any inventory kind, so check all three element maps.
        const v = located.value;
        const els = (
          inventory?.spacingEls.get(v) ??
          inventory?.colorEls.get(v.toLowerCase()) ??
          inventory?.typeEls.get(v) ??
          []
        ).filter((el) => el.isConnected);
        const items = located.items.map((it, i) => ({
          ...it,
          rect: els[i] ? els[i].getBoundingClientRect() : it.rect,
        }));
        setLocatedSpace({ value: located.value, items });
      }
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [enabled, inventory]);

  const refreshInventory = useCallback(() => {
    setInventory(collectInventory());
  }, []);

  // Type-scale live preview (weight / line-height aren't tokens).
  const {
    typeEditing,
    setTypeEditing,
    typeDraft,
    setTypeDraft,
    typePreviewCount,
    previewType,
    resetTypePreviews,
  } = useTypePreview(inventory);

  /* Collect inventory when the panel is first opened. */
  useEffect(() => {
    if (!IS_DEV || !enabled || !layers.inventory) return;
    if (!inventory) refreshInventory();
  }, [enabled, layers.inventory, inventory, refreshInventory]);

  /* Re-scan after token edits so the inventory's scanned sizes stay in sync
     with the live token values (otherwise a label can go stale after editing
     a value and changing it back). Debounced so rapid typing doesn't thrash. */
  const editKey = Object.entries(tokenEdits)
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const didInitialScan = useRef(false);
  useEffect(() => {
    if (!IS_DEV || !enabled || !layers.inventory) return;
    // Skip the very first run (initial scan handles it); only react to edits.
    if (!didInitialScan.current) {
      didInitialScan.current = true;
      return;
    }
    const t = setTimeout(refreshInventory, 250);
    return () => clearTimeout(t);
  }, [editKey, enabled, layers.inventory, refreshInventory]);

  /* hex -> token label, recomputed when tokens change so labels stay accurate
     after live edits. Keyed by inventory/tokenEdits so it refreshes together. */
  const colorTokenLabels = useMemo(() => {
    if (!enabled || !layers.inventory) return {};
    return buildColorTokenLabels();
  }, [enabled, layers.inventory, inventory, tokenEdits]);

  /* px value -> spacing token label (e.g. "16px" -> "space-4"). */
  const spacingTokenLabels = useMemo(() => {
    if (!enabled || !layers.inventory) return {};
    return buildSpacingTokenLabels();
  }, [enabled, layers.inventory, inventory, tokenEdits]);

  /* px value -> token NAME, for editing inventory rows in place. */
  const spacingTokenNames = useMemo(() => {
    if (!enabled || !layers.inventory) return {};
    return buildSpacingTokenNames();
  }, [enabled, layers.inventory, inventory, tokenEdits]);
  const typeTokenNames = useMemo(() => {
    if (!enabled || !layers.inventory) return {};
    return buildTypeTokenNames();
  }, [enabled, layers.inventory, inventory, tokenEdits]);

  /* Spacing rows ordered: tokenized first (by scale value), unnamed below
     (by numeric value); then any saved drag-order is applied on top. */
  const orderedSpacing = useMemo(() => {
    if (!inventory) return [];
    const rows = inventory.spacing.map((s) => {
      // Aggregate the distinct author expressions behind this value, so a
      // tooltip can explain WHY it computes to e.g. 6.4px (gap: 0.4em).
      const els = inventory.spacingEls.get(s.value) ?? [];
      const exprs = new Set<string>();
      els.slice(0, 12).forEach((el) => {
        if (!el.isConnected) return;
        explainSpacing(el).forEach((d) => {
          // Only keep an expression if it could plausibly produce this value.
          exprs.add(`${d.prop}: ${d.value}`);
        });
      });
      const why = Array.from(exprs).slice(0, 4).join("  ·  ");
      return {
        ...s,
        token: spacingTokenLabels[s.value] ?? null,
        num: parseFloat(s.value),
        why,
      };
    });
    rows.sort((a, b) => {
      // Tokenized before untokenized.
      if (!!a.token !== !!b.token) return a.token ? -1 : 1;
      // Within each group, by numeric px value ascending.
      const na = Number.isNaN(a.num) ? Infinity : a.num;
      const nb = Number.isNaN(b.num) ? Infinity : b.num;
      return na - nb;
    });
    // Apply persisted custom order (drag), if any: listed values first in
    // saved order, the rest keep the auto-sort.
    if (spacingOrder.length) {
      const pos = new Map(spacingOrder.map((v, i) => [v, i]));
      rows.sort((a, b) => {
        const ia = pos.has(a.value) ? pos.get(a.value)! : Infinity;
        const ib = pos.has(b.value) ? pos.get(b.value)! : Infinity;
        if (ia !== ib) return ia - ib;
        return 0;
      });
    }
    return rows;
  }, [inventory, spacingTokenLabels, spacingOrder]);

  /* Always-on outline mode: collect every box, and keep it in sync with
     scroll/resize (boxes are viewport-positioned). */
  useEffect(() => {
    if (!IS_DEV || !enabled || !layers.outline) {
      setOutlineItems([]);
      return;
    }
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setOutlineItems(collectOutline()));
    };
    recompute();
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
    };
  }, [enabled, layers.outline]);

  /* Read baseline token values when the inventory panel opens. */
  useEffect(() => {
    if (!IS_DEV || !enabled || !layers.inventory) return;
    setTokenBase(readTokenValues());
  }, [enabled, layers.inventory]);

  /* Apply live token edits via a single injected <style> on :root. This
     remaps the token everywhere it's used, so the whole page updates. */
  useEffect(() => {
    if (!IS_DEV) return;
    const id = "ds-token-overrides";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    const entries = Object.entries(tokenEdits);
    if (entries.length === 0) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `:root{${entries
      .map(([k, v]) => `${k}:${v} !important;`)
      .join("")}}`;
  }, [tokenEdits]);

  /* Clean up the override style when the overlay unmounts. */
  useEffect(() => {
    if (!IS_DEV) return;
    return () => {
      document.getElementById("ds-token-overrides")?.remove();
    };
  }, []);

  /* Close a callout edit and restore inspection. Always clears edit state and
     the callout-freeze flag (`overCalloutRef`) so a stuck flag can't kill
     hover. With `force`, also release any pin (used by Escape, which is an
     explicit "get me out"); otherwise only release a pin that WE created to
     hold the spec during the edit (`pinForEditRef`), keeping a user's Alt-pin. */
  const finishEdit = useCallback((force = false) => {
    setEditingRow(null);
    setNoTokenChoice(null);
    setRowError(null);
    overCalloutRef.current = false;
    if (force || pinForEditRef.current) {
      pinForEditRef.current = false;
      setPinned(false);
      setSpec(null);
    }
  }, [setPinned]);
  // Latest finishEdit for the mount-once keydown effect to call without going
  // stale (the effect is keyed on [] so it can't close over the live function).
  const finishEditRef = useRef(finishEdit);
  finishEditRef.current = finishEdit;

  const setToken = useCallback((name: string, value: string) => {
    setSaveState("idle");
    setTokenEdits((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetTokens = useCallback(() => {
    setTokenEdits({});
    setSaveState("idle");
  }, []);

  const chooseCalloutMode = useCallback((mode: "token" | "element") => {
    setCalloutMode(mode);
    try {
      window.localStorage.setItem("ds-callout-mode", mode);
    } catch {
      /* ignore */
    }
  }, []);

  const togglePanelSide = useCallback(() => {
    setPanelSide((s) => {
      const next = s === "left" ? "right" : "left";
      try {
        window.localStorage.setItem("ds-panel-side", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /* Commit an edit from the callout. In "token" mode it writes the token
     feeding the value (same live-override + Update CSS path as the panel); in
     "element" mode it sets an inline style on just the inspected element.
     Returns: null on success, an error string to show inline, or { ask: true }
     when token mode found no matching token (caller shows the create-or-element
     fork). */
  const applyCalloutEdit = useCallback(
    (
      field: { prop: string; kind: "color" | "size"; tokenable: boolean },
      currentValue: string,
      nextValue: string
    ): string | null | { ask: true } => {
      const value = nextValue.trim();
      if (!value) return "empty";
      if (calloutMode === "token") {
        if (!field.tokenable) return "element-only — switch to Element";
        const token = tokenForValue(field.kind, currentValue);
        if (!token) {
          // No token maps to this value. Ask: create a new token, or change
          // just this element? The caller renders the fork.
          return { ask: true };
        }
        setToken(token, value);
        showToast(
          `Previewing ${token} = ${value} across the page. Click “Update CSS” to save it to globals.css.`,
          "info"
        );
        return null;
      }
      // Element mode: don't silently preview — ASK whether to write the change
      // into the CSS source (persists) or just preview it. The caller renders
      // the Save-to-CSS / Preview-only fork.
      return { ask: true };
    },
    [calloutMode, setToken, showToast]
  );

  /* Preview-only: apply the edit as an inline style on the live element. Not
     written to CSS — lost on reload. (Used by both the token-mode "just this
     element" and element-mode "preview only" choices.) */
  const resolveAsElement = useCallback(() => {
    const c = noTokenChoice;
    if (!c || !spec?.el) {
      finishEdit();
      return;
    }
    spec.el.style.setProperty(c.prop, c.value);
    trackElementEdit(spec.el, c.prop);
    showToast(
      `Previewing ${c.prop}: ${c.value} on this element (not saved — lost on reload).`,
      "info"
    );
    finishEdit();
  }, [noTokenChoice, spec, showToast, finishEdit]);

  /* Save to CSS — for users running this inside Claude Code on localhost.
     Rather than risk a blind global find-replace, copy a precise instruction to
     the clipboard that the user pastes into Claude Code, which then locates the
     exact CSS rule for THIS element and edits only that. Safe + reviewable. */
  const resolveAsCssWrite = useCallback(async () => {
    const c = noTokenChoice;
    if (!c || !spec?.el) {
      finishEdit();
      return;
    }
    const el = spec.el;
    const prompt = buildClaudePrompt(el, c.prop, c.currentValue, c.value);
    let copied = false;
    try {
      await navigator.clipboard.writeText(prompt);
      copied = true;
    } catch {
      /* clipboard may be blocked */
    }

    // Show the change live so the user sees the intended result immediately.
    el.style.setProperty(c.prop, c.value);
    trackElementEdit(el, c.prop);

    showToast(
      copied
        ? `Copied an instruction — paste it into Claude Code to set ${c.prop}: ${c.value} on this element (that rule only). Previewing meanwhile.`
        : `Couldn't auto-copy. Here's the command — Copy it and paste into Claude Code. Previewing meanwhile.`,
      copied ? "success" : "info",
      copied ? undefined : prompt
    );
    finishEdit();
  }, [noTokenChoice, spec, showToast, finishEdit]);

  /* Resolve a no-token edit by CREATING a new token for the value and pointing
     this element's property at it. Writes the token to globals.css, then sets
     the element to use var(--name) inline so it adopts it immediately. */
  const resolveAsToken = useCallback(async () => {
    const c = noTokenChoice;
    if (!c || !spec?.el) {
      finishEdit();
      return;
    }
    // Suggest a name from the CSS property (e.g. font-size -> --text-custom),
    // uniquified against tokens already declared in the live CSS.
    const taken = new Set(readDeclaredTokens().map((t) => t.name));
    const base =
      c.prop === "font-size"
        ? "text-custom"
        : `${c.prop.replace(/[^a-z]/g, "-")}-custom`;
    let name = `--${base}`;
    for (let i = 2; taken.has(name) && i < 50; i++) {
      name = `--${base}-${i}`;
    }
    const kind = c.kind;
    try {
      // 1. Create the token in globals.css (or, if it already exists, update
      //    its value so we never silently reuse a stale value — the 409 bug).
      const addRes = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name, value: c.value, kind }),
      });
      const addData = await addRes.json();
      if (!addRes.ok && addRes.status !== 409) {
        throw new Error(addData.error || "add failed");
      }
      if (addRes.status === 409) {
        // Already exists — overwrite its value with the one just entered.
        await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            tokens: { [name]: c.value },
          }),
        });
      }
      const label = name.replace(/^--/, "").replace(/-/g, " ");
      setExtraTokens((prev) =>
        prev.some((t) => t.name === name) ? prev : [...prev, { name, label, kind }]
      );
      setTokenBase((prev) => ({ ...prev, [name]: c.value }));

      // 2. Connect THIS element to the token. We do NOT auto-rewrite the CSS
      //    (a global find-replace wires unrelated elements that share the value
      //    — it's unsafe). Instead, copy a precise instruction to the clipboard
      //    for the user to paste into Claude Code, which edits only this rule.
      const prompt = buildClaudePrompt(spec.el, c.prop, c.currentValue, `var(${name})`);
      let copied = false;
      try {
        await navigator.clipboard.writeText(prompt);
        copied = true;
      } catch {
        /* clipboard may be blocked */
      }

      // 3. Live preview so the change shows immediately.
      spec.el.style.setProperty(c.prop, `var(${name})`);
      trackElementEdit(spec.el, c.prop);

      showToast(
        copied
          ? `Created ${name} = ${c.value} in globals.css. Copied an instruction — paste it into Claude Code to point this element at the token (that rule only). Previewing meanwhile.`
          : `Created ${name} = ${c.value} in globals.css. Couldn't auto-copy — here's the command to point this element at the token.`,
        "success",
        copied ? undefined : prompt
      );
      finishEdit();
    } catch (e) {
      showToast(`Couldn't create token: ${(e as Error).message}`, "error");
      finishEdit();
    }
  }, [noTokenChoice, spec, showToast, finishEdit]);

  /* Clear only the inline props this session set, leaving the page's own
     inline styles intact. */
  const resetElementEdits = useCallback(() => {
    elementEdits.current.forEach((props, el) => {
      props.forEach((p) => el.style.removeProperty(p));
    });
    elementEdits.current.clear();
    if (spec?.el) setSpec(buildSpec(spec.el));
  }, [spec]);

  const saveTokens = useCallback(async () => {
    const entries = Object.entries(tokenEdits);
    if (entries.length === 0) return;
    setSaveState("saving");
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", tokens: tokenEdits }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json().catch(() => ({}));
      const { updated, missed } = reconcileUpdateResponse(
        entries.map(([n]) => n),
        data
      );
      // Keep tokenBase in sync with what was actually written, so the editor
      // shows the saved values (not the pre-edit baseline) after the override
      // is cleared. Only the tokens that really landed in the file.
      if (updated.length) {
        setTokenBase((prev) =>
          mergeSavedTokenBase(prev, Object.fromEntries(entries), updated)
        );
      }
      if (missed.length > 0) {
        // Some tokens weren't found in an editable :root block — the live
        // preview made them LOOK changed, but the file wasn't touched. Tell
        // the user instead of a false "saved".
        setSaveState(updated.length ? "saved" : "error");
        showToast(
          `${updated.length} saved, but ${missed.length} not found in globals.css (${missed.join(
            ", "
          )}) — those weren't changed.`,
          "error"
        );
      } else {
        setSaveState("saved");
        const n = updated.length;
        showToast(
          `Saved to globals.css — ${
            n === 1 ? updated[0] : `${n} tokens`
          } updated. Every use of ${
            n === 1 ? "it" : "them"
          } on the page now reflects the change.`
        );
      }
      // The file write triggers HMR; the override can drop so the real CSS shows.
      setTimeout(() => {
        setTokenEdits({});
        setSaveState("idle");
      }, 1200);
    } catch (e) {
      setSaveState("error");
      showToast(`Couldn't save: ${(e as Error).message}`, "error");
    }
  }, [tokenEdits, showToast]);

  /* Add a new token: validate, POST, then register it in the editor list. */
  const addToken = useCallback(async () => {
    let name = newName.trim();
    if (!name.startsWith("--")) name = `--${name}`;
    const value = newValue.trim();
    if (!/^--[a-z][a-z0-9-]*$/.test(name)) {
      setActionMsg("Name must be --kebab-case");
      return;
    }
    if (!value) {
      setActionMsg("Value required");
      return;
    }
    setActionMsg("adding…");
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name, value, kind: newKind }),
      });
      const data = await res.json();
      // 409 = already exists. Treat as success and overwrite its value (same as
      // resolveAsToken), so adding a name that exists never silently fails.
      if (!res.ok && res.status !== 409) throw new Error(data.error || "failed");
      const existed = res.status === 409;
      if (existed) {
        await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", tokens: { [name]: value } }),
        });
      }
      const label = name.replace(/^--/, "").replace(/-/g, " ");
      setExtraTokens((prev) =>
        prev.some((t) => t.name === name)
          ? prev
          : [...prev, { name, label, kind: newKind }]
      );
      setTokenBase((prev) => ({ ...prev, [name]: value }));
      setAdding(false);
      setNewName("");
      setNewValue("");
      setActionMsg(existed ? `updated ${name}` : `added ${name}`);
      showToast(
        existed
          ? `${name} already existed — set to ${value} in globals.css.`
          : `Added ${name}: ${value} to globals.css.`
      );
    } catch (e) {
      setActionMsg(`error: ${(e as Error).message}`);
      showToast(`Couldn't add token: ${(e as Error).message}`, "error");
    }
  }, [newName, newValue, newKind, showToast]);

  /* Rename a token across globals.css and every var() reference. `nextName`
     defaults to the top editor's renameDraft, but callers (inventory rows) can
     pass the new name directly. */
  const renameToken = useCallback(
    async (from: string, nextName?: string) => {
      let to = (nextName ?? renameDraft).trim();
      if (!to.startsWith("--")) to = `--${to}`;
      if (!/^--[a-z][a-z0-9-]*$/.test(to)) {
        setActionMsg("New name must be --kebab-case");
        return;
      }
      if (to === from) {
        setRenaming(null);
        return;
      }
      setActionMsg("renaming…");
      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rename", from, to }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "failed");
        setRenameMap((prev) => ({ ...prev, [from]: to }));
        // The editor row now renders under the NEW name, so carry the value
        // over to the new key (and drop the old) — otherwise tokenBase[to] is
        // undefined and the row shows blank.
        setTokenBase((prev) => migrateTokenKey(prev, from, to));
        setTokenEdits((prev) => migrateTokenKey(prev, from, to));
        setRenaming(null);
        setActionMsg(`renamed → ${to} (${data.replacements} refs in ${data.files.length} files)`);
        showToast(
          `Renamed ${from} → ${to} — ${data.replacements} reference${
            data.replacements === 1 ? "" : "s"
          } updated across ${data.files.length} file${
            data.files.length === 1 ? "" : "s"
          }.`
        );
      } catch (e) {
        setActionMsg(`error: ${(e as Error).message}`);
        showToast(`Rename failed: ${(e as Error).message}`, "error");
      }
    },
    [renameDraft, showToast]
  );

  /* Name an untokenized color from the inventory: create the token, then fetch
     (but do not rewrite) every place the hex is used so the user can decide. */
  const nameColor = useCallback(
    async (hex: string) => {
      const norm = normalizeTokenName(colorNameDraft);
      if ("error" in norm) {
        setNameError(norm.error);
        return;
      }
      const name = norm.name;
      setNameError(null);
      setActionMsg("creating…");
      try {
        const addRes = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", name, value: hex, kind: "color" }),
        });
        const addData = await addRes.json();
        // 409 = the token already exists. That's the user's goal anyway (a
        // named token for this color), so treat it as success and proceed to
        // relabel + show matches rather than erroring out.
        const existed = addRes.status === 409;
        if (!addRes.ok && !existed) {
          setNameError(addData.error || "Couldn't create token");
          setActionMsg(null);
          return;
        }

        // Register it so it shows in the editor + relabels the row.
        const label = name.replace(/^--/, "").replace(/-/g, " ");
        setExtraTokens((prev) =>
          prev.some((t) => t.name === name)
            ? prev
            : [...prev, { name, label, kind: "color" }]
        );
        setTokenBase((prev) => ({ ...prev, [name]: hex }));

        // Read-only: find every occurrence of the hex for the user to review.
        const findRes = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "find", value: hex }),
        });
        const findData = await findRes.json();
        setColorMatches({
          token: name,
          value: hex,
          existed,
          matches: findRes.ok ? findData.matches : [],
        });
        setNamingColor(null);
        setColorNameDraft("");
        setNameError(null);
        setActionMsg(existed ? `${name} already exists` : `created ${name}`);
      } catch (e) {
        setNameError((e as Error).message);
        setActionMsg(null);
      }
    },
    [colorNameDraft]
  );

  /* Name a spacing value -> create a --space-* token in globals.css. */
  const nameSpace = useCallback(
    async (value: string) => {
      const norm = normalizeTokenName(spaceNameDraft);
      if ("error" in norm) {
        setNameError(norm.error);
        return;
      }
      const name = norm.name;
      setNameError(null);
      setActionMsg("creating…");
      try {
        const res = await fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add", name, value, kind: "size" }),
        });
        const data = await res.json();
        // 409 = already exists; that's fine, the named token is what we wanted.
        if (!res.ok && res.status !== 409) {
          setNameError(data.error || "Couldn't create token");
          setActionMsg(null);
          return;
        }
        // Register it so it shows in the editor immediately (matches nameColor).
        const label = name.replace(/^--/, "").replace(/-/g, " ");
        setExtraTokens((prev) =>
          prev.some((t) => t.name === name)
            ? prev
            : [...prev, { name, label, kind: "size" }]
        );
        setTokenBase((prev) => ({ ...prev, [name]: value }));
        setNamingSpace(null);
        setSpaceNameDraft("");
        setNameError(null);
        setActionMsg(`created ${name} = ${value}`);
      } catch (e) {
        setNameError((e as Error).message);
        setActionMsg(null);
      }
    },
    [spaceNameDraft]
  );

  /* Click a value -> highlight every element using it + list selectors. Scrolls
     the first into view. Click again (or Esc) clears. `withSources` is true only
     for spacing (so the snap-to-token action can appear). */
  const locate = useCallback(
    (value: string, els: HTMLElement[], withSources: boolean) => {
      if (locatedSpace?.value === value) {
        setLocatedSpace(null);
        return;
      }
      // Connected AND has a real box — skips zero-size nodes (e.g. dev-tools
      // remnants) that would draw an invisible highlight and look like nothing.
      const live = els.filter((el) => {
        if (!el.isConnected) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (live.length === 0) {
        setLocatedSpace({ value, items: [] });
        return;
      }
      live[0].scrollIntoView({ block: "center", behavior: "smooth" });
      setSnapMsg({});
      setTimeout(() => {
        const items = live.map((el) => {
          const sources = withSources
            ? explainSpacing(el).filter((d) => authorResolvesTo(el, d.value, value))
            : [];
          return { rect: el.getBoundingClientRect(), tag: elementTag(el), sources };
        });
        setLocatedSpace({ value, items });
      }, 320);
    },
    [locatedSpace]
  );

  const locateSpace = useCallback(
    (value: string) => locate(value, inventory?.spacingEls.get(value) ?? [], true),
    [locate, inventory]
  );
  const locateColor = useCallback(
    (value: string) =>
      locate(value, inventory?.colorEls.get(value.toLowerCase()) ?? [], false),
    [locate, inventory]
  );
  const locateType = useCallback(
    (sizePx: string) => locate(sizePx, inventory?.typeEls.get(sizePx) ?? [], false),
    [locate, inventory]
  );

  /* Snap a literal spacing declaration to a token — but DON'T auto-rewrite the
     CSS (a global replace would hit every element sharing the value). Instead
     copy a precise instruction for Claude Code to edit only this element's
     rule. `tag` is the element's selector string from the located list. */
  const snapDecl = useCallback(
    async (tag: string, prop: string, fromValue: string, toToken: string, key: string) => {
      const prompt = buildClaudePromptFor(
        tag,
        "",
        prop,
        fromValue,
        `var(${toToken})`
      );
      try {
        await navigator.clipboard.writeText(prompt);
        setSnapMsg((m) => ({ ...m, [key]: "copied ✓" }));
        showToast(
          `Copied an instruction — paste it into Claude Code to set ${prop}: var(${toToken}) on ${tag} (that rule only).`
        );
      } catch {
        setSnapMsg((m) => ({ ...m, [key]: "copy failed" }));
        showToast(
          `Couldn't auto-copy. Here's the command — Copy it and paste into Claude Code.`,
          "info",
          prompt
        );
      }
    },
    [showToast]
  );

  /* Drop a dragged spacing row before `targetValue`, persist the new order. */
  const dropSpacingBefore = useCallback(
    (targetValue: string) => {
      if (!dragValue || dragValue === targetValue) return;
      const current = orderedSpacing.map((r) => r.value);
      const without = current.filter((v) => v !== dragValue);
      const at = without.indexOf(targetValue);
      without.splice(at < 0 ? without.length : at, 0, dragValue);
      saveSpacingOrder(without);
      setDragValue(null);
    },
    [dragValue, orderedSpacing, saveSpacingOrder]
  );

  // The full editable token list, DERIVED from the live CSS (buildEditableGroups
   // reads the declared :root tokens), with any session renames applied + extras
   // appended. Derived so it works in any project, not just this portfolio.
  const editableGroups = useMemo(() => {
    const apply = (t: TokenDef): TokenDef => {
      const renamed = renameMap[t.name];
      if (!renamed) return t;
      return { name: renamed, label: renamed.replace(/^--/, "").replace(/-/g, " "), kind: t.kind };
    };
    const base = enabled && layers.inventory ? buildEditableGroups() : [];
    const seen = new Set(base.flatMap((g) => g.tokens.map((t) => t.name)));
    const groups = base.map((g) => ({
      group: g.group,
      tokens: g.tokens.map(apply),
    }));
    // Session-added tokens that aren't yet reflected in the live CSS read.
    const fresh = extraTokens.filter((t) => !seen.has(t.name));
    if (fresh.length) {
      groups.push({ group: "Added", tokens: fresh.map(apply) });
    }
    return groups;
  }, [extraTokens, renameMap, enabled, layers.inventory, inventory]);

  /* All token names currently in use, so suggestions don't collide. Includes
     built-ins, session-added tokens, AND every token declared in the live CSS
     (so a name written in a prior session — e.g. --text-secondary — isn't
     suggested again). Keyed off inventory so it re-reads after edits. */
  const takenTokenNames = useMemo(() => {
    const names = new Set(editableGroups.flatMap((g) => g.tokens.map((t) => t.name)));
    if (enabled && layers.inventory) {
      readDeclaredTokens().forEach((t) => names.add(t.name));
    }
    return names;
  }, [editableGroups, enabled, layers.inventory, inventory]);

  /* Position of the callout: avoid covering the inspected element / edges AND
     the docked inventory panel (which can be on either side). */
  const calloutStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!spec) return undefined;
    const { rect } = spec;
    const margin = 12;
    const calloutW = 280;
    const panelW = layers.inventory ? 300 : 0;
    const vw = window.innerWidth;
    // Keep the callout inside the gutter between the two panel edges.
    const minLeft = panelSide === "left" ? panelW + margin : margin;
    const maxRight = panelSide === "right" ? vw - panelW : vw;

    let left = rect.right + margin;
    if (left + calloutW > maxRight) {
      left = rect.left - calloutW - margin; // flip to the element's left
    }
    if (left < minLeft) left = minLeft;

    let top = rect.top;
    if (top < margin) top = margin;
    if (top > window.innerHeight - 160) top = window.innerHeight - 160;

    return { left, top };
  }, [spec, layers.inventory, panelSide]);

  if (!IS_DEV || !enabled) {
    // Render nothing visible; the keydown listener above still flips `enabled`.
    return null;
  }

  const { box, padding, dimensions, callout, inventory: showInventory, outline } = layers;

  return (
    <div
      className={styles.root}
      data-ds-overlay="true"
      aria-hidden="true"
      style={
        accent
          ? ({
              "--ds-accent": accent,
              "--ds-accent-soft": hexToRgba(accent, 0.14),
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Instant "why" tooltip following the cursor */}
      {tip && (
        <div
          className={styles.tip}
          style={{
            left: Math.min(tip.x + 12, window.innerWidth - 280),
            top: tip.y + 14,
          }}
        >
          {tip.text}
        </div>
      )}

      {/* Toast: success = wrote to CSS (persists + propagates); info = live
          preview not yet saved; error = a write failed. */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.kind === "error"
              ? styles.toastError
              : toast.kind === "info"
                ? styles.toastInfo
                : styles.toastSuccess
          }`}
          role="status"
          // Pause the auto-dismiss while hovered so you can read/act on it;
          // resume (briefly) on leave. All timer logic lives in useToast.
          onMouseEnter={pauseToast}
          onMouseLeave={resumeToast}
        >
          <span className={styles.toastIcon}>
            {toast.kind === "error" ? "!" : toast.kind === "info" ? "i" : <Check />}
          </span>
          <span className={styles.toastMsg}>{toast.message}</span>
          {toast.command && (
            <div className={styles.toastCommand}>
              <code id="ds-toast-command" className={styles.toastCommandText}>
                {toast.command}
              </code>
              <button
                className={styles.toastCommandCopy}
                title="Copy this command"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(toast.command!);
                    showToast("Command copied — paste it into Claude Code.", "success");
                  } catch {
                    // Even the click-gesture copy was blocked: select the text
                    // so the user can ⌘C it themselves.
                    const code = document.getElementById("ds-toast-command");
                    if (code) {
                      const range = document.createRange();
                      range.selectNodeContents(code);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                    }
                  }
                }}
              >
                Copy
              </button>
            </div>
          )}
          <button
            className={styles.toastClose}
            onClick={dismissToast}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Located spacing: highlight every element using the clicked value */}
      {locatedSpace?.items.map((it, i) => (
        <div
          key={`loc-${i}`}
          className={styles.locatedBox}
          style={{
            left: it.rect.left,
            top: it.rect.top,
            width: it.rect.width,
            height: it.rect.height,
          }}
        >
          <span className={styles.locatedTag}>{it.tag}</span>
        </div>
      ))}

      {/* Always-on outline (architecture) layer: a box + tag for every element */}
      {outline &&
        outlineItems.map((item, i) => {
          // Tags on tiny/short boxes overlap into noise; hide them by default
          // and let CSS :hover reveal the tag for that box.
          const small = item.width < 60 || item.height < 20;
          return (
            <div
              key={i}
              className={
                small ? `${styles.outlineBox} ${styles.outlineBoxSmall}` : styles.outlineBox
              }
              style={{
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
              }}
            >
              <span className={styles.outlineTag}>{item.tag}</span>
            </div>
          );
        })}

      {/* Pinned: dim the rest of the page so the selected element stands out.
          A single fixed div whose huge spread box-shadow darkens everything
          except the element's rect (the "hole"). */}
      {spec && pinned && box && (
        <div
          className={styles.selScrim}
          style={{
            left: spec.rect.left,
            top: spec.rect.top,
            width: spec.rect.width,
            height: spec.rect.height,
          }}
        />
      )}

      {/* Bounding box + padding ring + dimension tabs */}
      {spec && box && (
        <div
          className={
            pinned ? `${styles.box} ${styles.boxPinned}` : styles.box
          }
          style={{
            left: spec.rect.left,
            top: spec.rect.top,
            width: spec.rect.width,
            height: spec.rect.height,
          }}
        />
      )}
      {spec && box && padding &&
        (spec.padding.top || spec.padding.right || spec.padding.bottom || spec.padding.left) ? (
        <div
          className={styles.padBox}
          style={{
            left: spec.rect.left + spec.padding.left,
            top: spec.rect.top + spec.padding.top,
            width: Math.max(0, spec.rect.width - spec.padding.left - spec.padding.right),
            height: Math.max(0, spec.rect.height - spec.padding.top - spec.padding.bottom),
          }}
        />
      ) : null}
      {/* Margin ring: outset rectangle showing the margin around the element. */}
      {spec && box && padding &&
        (spec.margin.top || spec.margin.right || spec.margin.bottom || spec.margin.left) ? (
        <div
          className={
            pinned ? `${styles.marginBox} ${styles.marginBoxPinned}` : styles.marginBox
          }
          style={{
            left: spec.rect.left - spec.margin.left,
            top: spec.rect.top - spec.margin.top,
            width: spec.rect.width + spec.margin.left + spec.margin.right,
            height: spec.rect.height + spec.margin.top + spec.margin.bottom,
          }}
        />
      ) : null}
      {spec && dimensions && (
        <>
          <div
            className={styles.dimTab}
            style={{ left: spec.rect.left + spec.rect.width / 2, top: spec.rect.top }}
          >
            {Math.round(spec.width)}
          </div>
          <div
            className={styles.dimTab}
            style={{ left: spec.rect.left, top: spec.rect.top + spec.rect.height / 2 }}
          >
            {Math.round(spec.height)}
          </div>
        </>
      )}

      {/* Spec callout */}
      {spec && callout && (
        <div
          className={styles.callout}
          style={calloutStyle}
          // Freeze hover updates while the cursor is over the callout, so you
          // can move into it and edit a value without it disappearing.
          onMouseEnter={() => {
            overCalloutRef.current = true;
          }}
          onMouseLeave={() => {
            overCalloutRef.current = false;
            // Resume hover inspection only if nothing was being edited.
            if (!pinned && editingRow === null) setSpec(null);
          }}
        >
          <span className={styles.calloutTag}>
            {shorten(spec.tag, 30)}
            {pinned ? " · pinned" : ""}
          </span>
          {/* Edit-target toggle: token (propagates) vs this element only */}
          <div className={styles.calloutModeRow}>
            <span className={styles.calloutModeLabel}>edit</span>
            <span className={styles.calloutModeSeg}>
              <button
                className={
                  calloutMode === "token"
                    ? `${styles.calloutModeBtn} ${styles.calloutModeBtnOn}`
                    : styles.calloutModeBtn
                }
                onClick={() => chooseCalloutMode("token")}
                title="Edit the design token behind this value — propagates everywhere"
              >
                token
              </button>
              <button
                className={
                  calloutMode === "element"
                    ? `${styles.calloutModeBtn} ${styles.calloutModeBtnOn}`
                    : styles.calloutModeBtn
                }
                onClick={() => chooseCalloutMode("element")}
                title="Override just this element (inline style)"
              >
                element
              </button>
            </span>
            {elementEdits.current.size > 0 && (
              <button
                className={styles.calloutResetBtn}
                onClick={resetElementEdits}
                title="Remove all element overrides"
              >
                reset {elementEdits.current.size}
              </button>
            )}
          </div>
          {spec.groups.map((group) => (
            <div key={group.title} className={styles.specGroup}>
              <div className={styles.specGroupTitle}>{group.title}</div>
              {group.rows.map(([label, value, swatch], i) => {
                const field = EDITABLE_FIELDS[label];
                const rowKey = `${group.title}|${label}`;
                const isEditing = editingRow === rowKey;
                const commit = () => {
                  const result = applyCalloutEdit(field, value, rowDraft);
                  if (result && typeof result === "object" && result.ask) {
                    // Ask how to apply. Token mode: create token vs just element.
                    // Element mode: save to CSS vs preview only.
                    setNoTokenChoice({
                      rowKey,
                      prop: field.prop,
                      kind: field.kind,
                      value: rowDraft.trim(),
                      currentValue: value,
                      source: calloutMode,
                    });
                    setRowError(null);
                  } else if (typeof result === "string") {
                    setRowError(result);
                  } else {
                    // Success — close the editor and resume inspection.
                    finishEdit();
                  }
                };
                return (
                  <div
                    className={
                      field
                        ? `${styles.specRow} ${styles.specRowEditable}`
                        : styles.specRow
                    }
                    key={`${label}-${i}`}
                  >
                    <span>{label}</span>
                    {isEditing ? (
                      <span className={styles.specEditWrap}>
                        {field.kind === "color" && (
                          <input
                            type="color"
                            className={styles.tokenColor}
                            value={toHexColor(rowDraft || "#000000")}
                            onChange={(e) => setRowDraft(e.target.value)}
                          />
                        )}
                        <input
                          type="text"
                          className={styles.specEditInput}
                          value={rowDraft}
                          autoFocus
                          onChange={(e) => setRowDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") finishEdit();
                          }}
                          spellCheck={false}
                        />
                        <button
                          className={styles.miniBtn}
                          onClick={commit}
                          title="Apply"
                        >
                          <Check />
                        </button>
                        {rowError && (
                          <span className={styles.specRowError}>{rowError}</span>
                        )}
                        {/* Ask how to apply the edit. */}
                        {noTokenChoice?.rowKey === rowKey &&
                          (noTokenChoice.source === "element" ? (
                            // Element mode: write to CSS, or preview only.
                            <span className={styles.noTokenAsk}>
                              <span className={styles.noTokenQ}>
                                {noTokenChoice.prop}: {noTokenChoice.value} — apply
                                it how?
                              </span>
                              <span className={styles.noTokenBtns}>
                                <button
                                  className={styles.noTokenPrimary}
                                  onClick={resolveAsCssWrite}
                                  title="Copy a precise instruction to paste into Claude Code, which edits only this element's CSS rule"
                                >
                                  Copy for Claude
                                </button>
                                <button
                                  className={styles.noTokenSecondary}
                                  onClick={resolveAsElement}
                                  title="Show it now, but don't save (lost on reload)"
                                >
                                  Preview only
                                </button>
                                <button
                                  className={styles.noTokenCancel}
                                  onClick={() => finishEdit()}
                                >
                                  Cancel
                                </button>
                              </span>
                            </span>
                          ) : (
                            // Token mode, no match: make a token, or one-off.
                            <span className={styles.noTokenAsk}>
                              <span className={styles.noTokenQ}>
                                No token for {noTokenChoice.value}. Apply it how?
                              </span>
                              <span className={styles.noTokenBtns}>
                                <button
                                  className={styles.noTokenPrimary}
                                  onClick={resolveAsToken}
                                  title="Create a reusable token and use it here"
                                >
                                  Create token
                                </button>
                                <button
                                  className={styles.noTokenSecondary}
                                  onClick={resolveAsElement}
                                  title="Change only this element (single use)"
                                >
                                  Just this element
                                </button>
                                <button
                                  className={styles.noTokenCancel}
                                  onClick={() => finishEdit()}
                                >
                                  Cancel
                                </button>
                              </span>
                            </span>
                          ))}
                      </span>
                    ) : (
                      <button
                        className={
                          field ? styles.specValueBtn : styles.specValueStatic
                        }
                        disabled={!field}
                        onClick={() => {
                          if (!field) return;
                          // Pin so the hover handler stops rebuilding the spec
                          // out from under the input being edited. Remember if
                          // WE created the pin (so finishEdit releases it) vs
                          // the user having Alt-pinned already.
                          if (!pinned) {
                            pinForEditRef.current = true;
                            setPinned(true);
                          }
                          setEditingRow(rowKey);
                          // Seed from the element's real computed value (with
                          // units) so shorthand rows like "16 8" become a valid
                          // CSS string; type/color rows already are.
                          const seed =
                            field.text && spec?.el
                              ? getComputedStyle(spec.el).getPropertyValue(
                                  field.prop
                                ) || value
                              : value;
                          setRowDraft(seed);
                          setRowError(null);
                        }}
                        title={field ? "Click to edit" : undefined}
                      >
                        {swatch && (
                          <span
                            className={styles.swatch}
                            style={{ background: swatch }}
                          />
                        )}
                        {value}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Floating control — minimized to a chip, or the full box */}
      {minimized ? (
        <button
          className={styles.controlChip}
          style={
            chipPos
              ? { left: chipPos.x, top: chipPos.y, bottom: "auto" }
              : undefined
          }
          onMouseDown={onChipMouseDown}
          onClick={() => {
            // Suppress the click that ends a drag; only expand on a true click.
            if (chipDrag.current?.moved) return;
            setMinimized(false);
          }}
          title="Drag to move · click to expand (⌥M)"
        >
          spec
        </button>
      ) : (
      <div
        className={styles.control}
        style={
          panelPos
            ? { left: panelPos.x, top: panelPos.y, bottom: "auto" }
            : // Default sits bottom-left; if the inventory panel is docked left
              // too, shift the control clear of it (it stays draggable).
              panelSide === "left" && layers.inventory
              ? { left: 316 }
              : undefined
        }
      >
        <div
          className={styles.controlHeader}
          onMouseDown={onPanelMouseDown}
          title="Drag to move"
          style={{ cursor: "grab" }}
        >
          <span className={styles.controlTitle}>Design spec</span>
          <span
            className={styles.controlHeaderBtns}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ cursor: "default" }}
          >
            <button
              className={styles.controlClose}
              onClick={() => setMinimized(true)}
              title="Minimize (⌥M)"
            >
              –
            </button>
            <button
              className={styles.controlClose}
              onClick={() => setEnabled(false)}
              title="Hide (⌥D)"
            >
              ×
            </button>
          </span>
        </div>
        {(
          [
            ["outline", "Outline all (architecture)"],
            ["box", "Bounding box"],
            ["padding", "Padding ring"],
            ["dimensions", "Dimensions"],
            ["callout", "Spec callout"],
            ["inventory", "Inventory panel"],
          ] as [keyof SubLayers, string][]
        ).map(([key, label]) => (
          <label className={styles.toggleRow} key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={(e) =>
                setLayers((l) => ({ ...l, [key]: e.target.checked }))
              }
            />
          </label>
        ))}
        <div className={styles.accentRow}>
          <span>Highlight color</span>
          <span className={styles.accentControls}>
            <input
              type="color"
              className={styles.tokenColor}
              value={accent ?? "#e5377a"}
              onChange={(e) => chooseAccent(e.target.value)}
              title="Pick highlight color"
            />
            {accent && (
              <button
                className={styles.accentReset}
                onClick={() => chooseAccent(null)}
                title="Reset to default"
              >
                reset
              </button>
            )}
          </span>
        </div>
        <div className={styles.hint}>
          <span className={styles.kbd}>⌥D</span> toggle ·{" "}
          <span className={styles.kbd}>⌥M</span> minimize ·{" "}
          <span className={styles.kbd}>⌥click</span> pin ·{" "}
          <span className={styles.kbd}>esc</span> clear
        </div>
        <div className={styles.hint}>
          Page stays clickable — hold <span className={styles.kbd}>⌥</span> to
          inspect.
        </div>
      </div>
      )}

      {/* Inventory side panel */}
      {showInventory && (
        <aside
          className={
            panelSide === "left"
              ? `${styles.inventory} ${styles.inventoryLeft}`
              : styles.inventory
          }
        >
          <div className={styles.inventoryHeader}>
            <h2>Page inventory</h2>
            <span className={styles.inventoryHeaderBtns}>
              <button
                className={styles.refreshBtn}
                onClick={togglePanelSide}
                title={`Move panel to the ${panelSide === "left" ? "right" : "left"}`}
              >
                {panelSide === "left" ? "→ right" : "← left"}
              </button>
              <button className={styles.refreshBtn} onClick={refreshInventory}>
                refresh
              </button>
            </span>
          </div>
          <div className={`${styles.roleCaption} ${styles.roleCaptionInventory}`}>
            Found on the page — naming &amp; snapping write to CSS now.
          </div>

          {/* Editable design tokens */}
          <div className={styles.tokenEditor}>
            <SectionHeader
              title="Edit tokens (live)"
              isCollapsed={!!collapsed.editTokens}
              onToggle={() => toggleSection("editTokens")}
            />
            {!collapsed.editTokens && (
            <>
            <div className={styles.roleCaption}>
              Your tokens — edits preview live, save with Update CSS.
            </div>
            {editableGroups.map((group) => (
              <div key={group.group} className={styles.tokenGroup}>
                <div className={styles.tokenGroupTitle}>{group.group}</div>
                {group.tokens.map((t) => {
                  const current = tokenEdits[t.name] ?? tokenBase[t.name] ?? "";
                  const dirty = tokenEdits[t.name] !== undefined;
                  const isRenaming = renaming === t.name;
                  return (
                    <div className={styles.tokenRow} key={t.name}>
                      {isRenaming ? (
                        <input
                          type="text"
                          className={styles.tokenText}
                          style={{ flex: 1, textAlign: "left" }}
                          value={renameDraft}
                          autoFocus
                          placeholder={t.name}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameToken(t.name);
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          spellCheck={false}
                        />
                      ) : (
                        <span
                          className={styles.tokenLabel}
                          title={`${t.name} — double-click to rename`}
                          onDoubleClick={() => {
                            setRenaming(t.name);
                            setRenameDraft(t.name);
                          }}
                        >
                          {dirty ? "• " : ""}
                          {t.label}
                        </span>
                      )}
                      {isRenaming ? (
                        <span className={styles.tokenColorWrap}>
                          <button
                            className={styles.miniBtn}
                            onClick={() => renameToken(t.name)}
                            title="Rename"
                          >
                            <Check />
                          </button>
                          <button
                            className={styles.miniBtn}
                            onClick={() => setRenaming(null)}
                          >
                            ✕
                          </button>
                        </span>
                      ) : t.kind === "color" ? (
                        <span className={styles.tokenColorWrap}>
                          <input
                            type="color"
                            className={styles.tokenColor}
                            value={toHexColor(current || "#000000")}
                            onChange={(e) => setToken(t.name, e.target.value)}
                          />
                          <input
                            type="text"
                            className={styles.tokenText}
                            value={current}
                            onChange={(e) => setToken(t.name, e.target.value)}
                            spellCheck={false}
                          />
                        </span>
                      ) : (
                        <input
                          type="text"
                          className={styles.tokenText}
                          value={current}
                          onChange={(e) => setToken(t.name, e.target.value)}
                          spellCheck={false}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Add token form */}
            {adding ? (
              <div className={styles.addForm}>
                <div className={styles.tokenGroupTitle}>New token</div>
                <input
                  type="text"
                  className={styles.addInput}
                  placeholder="--token-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  spellCheck={false}
                />
                <input
                  type="text"
                  className={styles.addInput}
                  placeholder={newKind === "color" ? "#aabbcc" : "16px"}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  spellCheck={false}
                />
                <div className={styles.addKindRow}>
                  <label>
                    <input
                      type="radio"
                      checked={newKind === "color"}
                      onChange={() => setNewKind("color")}
                    />{" "}
                    color
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={newKind === "size"}
                      onChange={() => setNewKind("size")}
                    />{" "}
                    size
                  </label>
                </div>
                <div className={styles.tokenActions}>
                  <button className={styles.refreshBtn} onClick={() => setAdding(false)}>
                    cancel
                  </button>
                  <button className={styles.saveBtn} onClick={addToken}>
                    Add token
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.addTokenBtn}
                onClick={() => {
                  setAdding(true);
                  setActionMsg(null);
                }}
              >
                + Add token
              </button>
            )}

            {actionMsg && <div className={styles.actionMsg}>{actionMsg}</div>}

            <div className={styles.tokenActions}>
              <button
                className={styles.refreshBtn}
                onClick={resetTokens}
                disabled={Object.keys(tokenEdits).length === 0}
              >
                reset
              </button>
              <button
                className={styles.saveBtn}
                onClick={saveTokens}
                disabled={
                  Object.keys(tokenEdits).length === 0 || saveState === "saving"
                }
              >
                {saveState === "saving"
                  ? "saving…"
                  : saveState === "saved"
                  ? "saved ✓"
                  : saveState === "error"
                  ? "error — retry"
                  : "Update CSS"}
              </button>
            </div>
            <div className={styles.hint}>Double-click a token name to rename it.</div>
            </>
            )}
          </div>

          <div className={styles.inventoryScroll}>
            {!inventory ? (
              <div className={styles.empty}>Collecting…</div>
            ) : (
              <>
                <div className={styles.section}>
                  <SectionHeader
                    title="Colors"
                    count={inventory.colors.length}
                    isCollapsed={!!collapsed.colors}
                    onToggle={() => toggleSection("colors")}
                  />
                  {!collapsed.colors &&
                    inventory.colors.map((c) => {
                      const label = colorTokenLabels[c.value.toLowerCase()];
                      const isNaming = namingColor === c.value;
                      return (
                        <div className={styles.invRow} key={c.value}>
                          <span className={styles.swatchLg} style={{ background: c.raw }} />
                          {isNaming ? (
                            <span className={styles.namingWrap}>
                              <span className={styles.namingInputRow}>
                                <input
                                  type="text"
                                  className={
                                    nameError
                                      ? `${styles.namingInput} ${styles.namingInputError}`
                                      : styles.namingInput
                                  }
                                  value={colorNameDraft}
                                  autoFocus
                                  placeholder="--token-name"
                                  onChange={(e) => {
                                    setColorNameDraft(e.target.value);
                                    if (nameError) setNameError(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") nameColor(c.value);
                                    if (e.key === "Escape") {
                                      setNamingColor(null);
                                      setNameError(null);
                                    }
                                  }}
                                  spellCheck={false}
                                />
                                <span className={styles.invSub}>{c.value}</span>
                              </span>
                              {nameError && (
                                <span className={styles.nameError}>{nameError}</span>
                              )}
                            </span>
                          ) : (
                            <button
                              className={styles.invRowMainBtn}
                              onMouseEnter={(e) => {
                                const suggestion = suggestTokenName(
                                  { value: c.value, usage: c.usage },
                                  takenTokenNames
                                );
                                setTip({
                                  x: e.clientX,
                                  y: e.clientY,
                                  text: `${
                                    label ? "Click to add another name" : "Click to name"
                                  } → suggests ${suggestion}\n${explainSuggestion({
                                    value: c.value,
                                    usage: c.usage,
                                  })}`,
                                });
                              }}
                              onMouseMove={(e) =>
                                setTip((t) =>
                                  t ? { ...t, x: e.clientX, y: e.clientY } : t
                                )
                              }
                              onMouseLeave={() => setTip(null)}
                              onClick={() => {
                                setTip(null);
                                setNamingColor(c.value);
                                setColorNameDraft(
                                  suggestTokenName(
                                    { value: c.value, usage: c.usage },
                                    takenTokenNames
                                  )
                                );
                                setNameError(null);
                                setActionMsg(null);
                              }}
                            >
                              {label ? (
                                <>
                                  <span className={styles.invToken}>{label}</span>
                                  <span className={styles.invSub}> · {c.value}</span>
                                </>
                              ) : (
                                c.value
                              )}
                            </button>
                          )}
                          <button
                            className={
                              locatedSpace?.value === c.value
                                ? `${styles.locateBtn} ${styles.locateBtnActive}`
                                : styles.locateBtn
                            }
                            title="Show where this is used on the page"
                            onClick={(e) => {
                              e.stopPropagation();
                              locateColor(c.value);
                            }}
                          >
                            {c.count}
                          </button>
                        </div>
                      );
                    })}

                  {/* Success dialog after naming a color */}
                  {colorMatches && (
                    <div className={`${styles.matchesBox} ${styles.successBox}`}>
                      <div className={styles.matchesHead}>
                        <span className={styles.successTitle}>
                          <span className={styles.successCheck}>
                            <Check />
                          </span>
                          {colorMatches.existed ? "Already assigned" : "Assigned"}
                        </span>
                        <button
                          className={styles.miniBtn}
                          onClick={() => setColorMatches(null)}
                          title="Dismiss"
                        >
                          <span style={{ fontSize: 11 }}>✕</span>
                        </button>
                      </div>
                      <div className={styles.successBody}>
                        <span
                          className={styles.swatchLg}
                          style={{ background: colorMatches.value }}
                        />
                        <span>
                          <code className={styles.successToken}>
                            {colorMatches.token}
                          </code>{" "}
                          = {colorMatches.value}
                          <br />
                          {colorMatches.existed
                            ? "Already a token in your CSS · "
                            : "Written to globals.css · "}
                          used in {colorMatches.matches.length} place
                          {colorMatches.matches.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className={styles.matchesHint}>
                        These still use the raw value — convert them to{" "}
                        <code>var({colorMatches.token})</code> yourself, or ask me to.
                      </div>
                      {colorMatches.matches.length === 0 ? (
                        <div className={styles.empty}>No CSS occurrences found.</div>
                      ) : (
                        colorMatches.matches.map((m, i) => (
                          <div className={styles.matchRow} key={`${m.file}-${m.line}-${i}`}>
                            <span className={styles.matchLoc}>
                              {m.file.replace(/^src\//, "")}:{m.line}
                            </span>
                            <span className={styles.matchText}>{m.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.section}>
                  <SectionHeader
                    title="Type scale"
                    count={inventory.typeScale.length}
                    isCollapsed={!!collapsed.type}
                    onToggle={() => toggleSection("type")}
                  />
                  {!collapsed.type && typePreviewCount > 0 && (
                    <div className={styles.previewBanner}>
                      <span>
                        {typePreviewCount} live preview
                        {typePreviewCount === 1 ? "" : "s"} — weight/line-height
                        aren&apos;t tokens; apply in CSS yourself.
                      </span>
                      <button
                        className={styles.miniBtn}
                        onClick={resetTypePreviews}
                        title="Revert previews"
                      >
                        reset
                      </button>
                    </div>
                  )}
                  {!collapsed.type &&
                    inventory.typeScale.map((t) => {
                      const sizeStr = `${t.size}px`;
                      const tokenName = typeTokenNames[sizeStr];
                      return (
                        <div
                          className={styles.invRow}
                          key={`${t.size}-${t.weight}-${t.lineHeight}`}
                        >
                          <span className={styles.invRowMain}>
                            {tokenName ? (
                              <EditableTokenLabel
                                label={tokenName.replace(/^--/, "")}
                                fullName={tokenName}
                                value={tokenEdits[tokenName] ?? sizeStr}
                                onRename={(to) => renameToken(tokenName, to)}
                                onEditValue={(v) => setToken(tokenName, v)}
                              />
                            ) : (
                              sizeStr
                            )}
                            <span className={styles.invSub}> / </span>
                            {/* weight & line-height: live preview only (not
                                tokens, so no Update CSS). */}
                            {(
                              [
                                ["weight", "font-weight", t.weight],
                                ["lh", "line-height", t.lineHeight],
                              ] as [string, "font-weight" | "line-height", string][]
                            ).map(([key, prop, val], idx) => {
                              const editKey = `${sizeStr}|${t.weight}|${t.lineHeight}|${key}`;
                              const isEd = typeEditing === editKey;
                              const commit = () => {
                                const err = previewType(t, prop, typeDraft);
                                if (!err) setTypeEditing(null);
                              };
                              return (
                                <span key={key} className={styles.invSub}>
                                  {idx === 1 && " / "}
                                  {isEd ? (
                                    <input
                                      type="text"
                                      className={styles.typeEditInput}
                                      value={typeDraft}
                                      autoFocus
                                      onChange={(e) => setTypeDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") commit();
                                        if (e.key === "Escape") setTypeEditing(null);
                                      }}
                                      onBlur={() => setTypeEditing(null)}
                                      spellCheck={false}
                                    />
                                  ) : (
                                    <button
                                      className={styles.typeEditBtn}
                                      title="Live preview (not a token — apply in CSS yourself)"
                                      onClick={() => {
                                        setTypeEditing(editKey);
                                        setTypeDraft(val);
                                      }}
                                    >
                                      {val}
                                    </button>
                                  )}
                                </span>
                              );
                            })}
                          </span>
                          <button
                            className={
                              locatedSpace?.value === sizeStr
                                ? `${styles.locateBtn} ${styles.locateBtnActive}`
                                : styles.locateBtn
                            }
                            title="Show where this is used on the page"
                            onClick={(e) => {
                              e.stopPropagation();
                              locateType(sizeStr);
                            }}
                          >
                            {t.count}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <div className={styles.section}>
                  <SectionHeader
                    title="Spacing"
                    count={inventory.spacing.length}
                    isCollapsed={!!collapsed.spacing}
                    onToggle={() => toggleSection("spacing")}
                  />
                  {!collapsed.spacing &&
                    orderedSpacing.map((s) => {
                      const token = s.token;
                      const isNaming = namingSpace === s.value;
                      const clean = isCleanPx(s.value);
                      return (
                        <div
                          className={styles.invRow}
                          key={s.value}
                          draggable={!isNaming}
                          onDragStart={() => setDragValue(s.value)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => dropSpacingBefore(s.value)}
                          style={dragValue === s.value ? { opacity: 0.4 } : undefined}
                        >
                          <span className={styles.dragHandle} title="Drag to reorder">
                            ⠿
                          </span>
                          {isNaming ? (
                            <span className={styles.namingWrap}>
                              <span className={styles.namingInputRow}>
                                <input
                                  type="text"
                                  className={
                                    nameError
                                      ? `${styles.namingInput} ${styles.namingInputError}`
                                      : styles.namingInput
                                  }
                                  value={spaceNameDraft}
                                  autoFocus
                                  placeholder="--space-name"
                                  onChange={(e) => {
                                    setSpaceNameDraft(e.target.value);
                                    if (nameError) setNameError(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") nameSpace(s.value);
                                    if (e.key === "Escape") {
                                      setNamingSpace(null);
                                      setNameError(null);
                                    }
                                  }}
                                  spellCheck={false}
                                />
                                <span className={styles.invSub}>{s.value}</span>
                              </span>
                              {nameError && (
                                <span className={styles.nameError}>{nameError}</span>
                              )}
                            </span>
                          ) : token ? (
                            <span className={styles.invRowMain}>
                              {spacingTokenNames[s.value] ? (
                                <EditableTokenLabel
                                  label={token}
                                  fullName={spacingTokenNames[s.value]}
                                  value={
                                    tokenEdits[spacingTokenNames[s.value]] ?? s.value
                                  }
                                  onRename={(to) =>
                                    renameToken(spacingTokenNames[s.value], to)
                                  }
                                  onEditValue={(v) =>
                                    setToken(spacingTokenNames[s.value], v)
                                  }
                                />
                              ) : (
                                <>
                                  <span className={styles.invToken}>{token}</span>
                                  <span className={styles.invSub}> · {s.value}</span>
                                </>
                              )}
                            </span>
                          ) : clean ? (
                            <button
                              className={styles.invRowMainBtn}
                              title="Click to name this spacing"
                              onClick={() => {
                                setNamingSpace(s.value);
                                setSpaceNameDraft(
                                  suggestSpaceName(s.value, takenTokenNames)
                                );
                                setNameError(null);
                                setActionMsg(null);
                              }}
                            >
                              {s.value}
                            </button>
                          ) : (
                            <span
                              className={styles.invRowMain}
                              onMouseEnter={(e) =>
                                setTip({
                                  x: e.clientX,
                                  y: e.clientY,
                                  text: s.why
                                    ? `${s.value} comes from:\n${s.why.replace(/\s+·\s+/g, "\n")}`
                                    : "Fluid/computed value — not tokenizable",
                                })
                              }
                              onMouseMove={(e) =>
                                setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))
                              }
                              onMouseLeave={() => setTip(null)}
                            >
                              {s.value}
                              {s.why && <span className={styles.whyMark}>ⓘ</span>}
                            </span>
                          )}
                          <button
                            className={
                              locatedSpace?.value === s.value
                                ? `${styles.locateBtn} ${styles.locateBtnActive}`
                                : styles.locateBtn
                            }
                            title="Show where this is used on the page"
                            onClick={(e) => {
                              e.stopPropagation();
                              locateSpace(s.value);
                            }}
                          >
                            {s.count}
                          </button>
                        </div>
                      );
                    })}

                </div>

                <div className={styles.section}>
                  <SectionHeader
                    title="Fonts"
                    count={inventory.fonts.length}
                    isCollapsed={!!collapsed.fonts}
                    onToggle={() => toggleSection("fonts")}
                  />
                  {!collapsed.fonts &&
                    inventory.fonts.map((f) => (
                      <div className={styles.invRow} key={f.value}>
                        <span className={styles.invRowMain}>{f.value}</span>
                        <span className={styles.invCount}>{f.count}</span>
                      </div>
                    ))}
                </div>

                {/* Where the located value is used (any kind: color/type/spacing) */}
                {locatedSpace && (
                  <div className={styles.matchesBox}>
                    <div className={styles.matchesHead}>
                      <span>
                        {locatedSpace.value} · {locatedSpace.items.length} element
                        {locatedSpace.items.length === 1 ? "" : "s"}
                      </span>
                      <button
                        className={styles.miniBtn}
                        onClick={() => setLocatedSpace(null)}
                      >
                        ✕
                      </button>
                    </div>
                    {locatedSpace.items.length === 0 ? (
                      <div className={styles.empty}>
                        Nothing visible to highlight — the only elements using this
                        are zero-size or off-screen.
                      </div>
                    ) : (
                      locatedSpace.items.map((it, i) => {
                        const src = it.sources[0];
                        const literal = src && isLiteralLength(src.value);
                        const near = nearestSpaceToken(locatedSpace.value);
                        const key = `${it.tag}|${src?.prop ?? ""}`;
                        return (
                          <div className={styles.matchRow} key={`${it.tag}-${i}`}>
                            <span className={styles.matchText}>{it.tag}</span>
                            {src && (
                              <span className={styles.matchSrc}>
                                {src.prop}: {src.value}
                                {literal && near && !near.exact && (
                                  <button
                                    className={styles.snapBtn}
                                    title={`Copy a Claude Code instruction to set ${src.prop} → var(${near.name}) (${near.px}px) on this element only`}
                                    onClick={() =>
                                      snapDecl(it.tag, src.prop, src.value, near.name, key)
                                    }
                                  >
                                    {snapMsg[key] ?? `copy → ${near.name}`}
                                  </button>
                                )}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

/**
 * Error boundary so a thrown error anywhere in the overlay (e.g. buildSpec or
 * collectInventory hitting an exotic element) degrades to nothing rendered
 * instead of white-screening the dev page. It logs once, then bows out — the
 * page underneath keeps working. Dev-only, so it's tree-shaken in production.
 */
class DesignSpecOverlay extends Component<
  DesignSpecOverlayProps,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it for debugging without taking down the page.
    console.error("[design-spec] overlay crashed, hiding it:", error, info);
  }

  render(): ReactNode {
    if (this.state.failed) return null;
    return (
      <DesignSpecOverlayInner apiPath={this.props.apiPath ?? DEFAULT_API_PATH} />
    );
  }
}

export default DesignSpecOverlay;
