// Note: the "use client" directive is added by tsup's banner at build time (see
// tsup.config.ts) so it lands on the emitted chunk reliably; we don't repeat it
// here to avoid a duplicate directive in the output.
export { default as DesignSpecOverlay } from "./DesignSpecOverlay";
export type { DesignSpecOverlayProps } from "./DesignSpecOverlay";
