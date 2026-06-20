/**
 * Shared design-token definitions for the dev-only design-spec overlay.
 *
 * Single source of truth imported by BOTH the overlay component and the
 * /api/design-spec-dev route, so the editable list and the server-side
 * allowlist can never drift apart.
 */

export type TokenKind = "color" | "size";
export type TokenDef = { name: string; label: string; kind: TokenKind };

/** Tokens the panel exposes for live editing + write-back to globals.css. */
export const EDITABLE_TOKENS: { group: string; tokens: TokenDef[] }[] = [
  {
    group: "Colors",
    tokens: [
      { name: "--foreground", label: "Foreground", kind: "color" },
      { name: "--muted", label: "Muted", kind: "color" },
      { name: "--muted-strong", label: "Muted strong", kind: "color" },
      { name: "--background", label: "Background", kind: "color" },
      { name: "--surface", label: "Surface", kind: "color" },
      { name: "--border-subtle", label: "Border", kind: "color" },
    ],
  },
  {
    group: "Type scale",
    tokens: [
      { name: "--text-display", label: "Display", kind: "size" },
      { name: "--text-title", label: "Title", kind: "size" },
      { name: "--text-body", label: "Body", kind: "size" },
      { name: "--text-meta", label: "Meta", kind: "size" },
      { name: "--text-micro", label: "Micro", kind: "size" },
    ],
  },
];

/** Curated overrides keyed by token name: nicer label + group than the derived
    defaults. OPTIONAL — a project with no curation still gets a populated panel
    from the live CSS (see buildEditableGroups). For this portfolio it keeps the
    hand-picked labels ("Display" not "text display"). */
export const TOKEN_OVERRIDES: Record<
  string,
  { label?: string; group?: string }
> = Object.fromEntries(
  EDITABLE_TOKENS.flatMap((g) =>
    g.tokens.map((t) => [t.name, { label: t.label, group: g.group }])
  )
);

/** Short label for a spacing token, e.g. "--space-4" -> "space-4". */
export const spacingLabel = (name: string) => name.replace(/^--/, "");
