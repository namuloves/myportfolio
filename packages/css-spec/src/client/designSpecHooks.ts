"use client";

/**
 * Custom hooks for DesignSpecOverlay.
 *
 * Each hook owns one cohesive slice of the overlay's state + behaviour and
 * loads/persists its own localStorage keys, so the main component composes a
 * handful of hooks instead of carrying ~40 useState calls inline. Pure
 * extraction — no behaviour change.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IS_DEV, type Inventory } from "./designSpecHelpers";

type Pos = { x: number; y: number } | null;
type DragRef = React.MutableRefObject<{
  dx: number;
  dy: number;
  moved: boolean;
} | null>;

/** Shared drag-handler factory: mousedown starts, mousemove repositions
    (clamped on-screen), mouseup persists. The `moved` flag lets a plain click
    still fire its onClick (e.g. chip expand). */
function makeDragHandler(
  dragRef: DragRef,
  setPos: React.Dispatch<React.SetStateAction<Pos>>,
  storageKey: string,
  keepW: number,
  keepH: number,
  // Exposes a "detach the in-flight drag listeners" fn so the hook can call it
  // on unmount — otherwise an unmount mid-drag leaks window listeners.
  detachRef: React.MutableRefObject<(() => void) | null>
) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
      moved: false,
    };
    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.moved = true;
      const x = Math.max(0, Math.min(window.innerWidth - keepW, ev.clientX - d.dx));
      const y = Math.max(0, Math.min(window.innerHeight - keepH, ev.clientY - d.dy));
      setPos({ x, y });
    };
    const detach = () => {
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      detachRef.current = null;
    };
    const onUp = () => {
      detach();
      const d = dragRef.current;
      dragRef.current = null;
      if (d?.moved) {
        setPos((p) => {
          try {
            if (p) window.localStorage.setItem(storageKey, JSON.stringify(p));
          } catch {
            /* ignore */
          }
          return p;
        });
      }
    };
    detachRef.current = detach;
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
  };
}

/** Draggable, persisted positions for the minimized chip and the expanded
    control box, plus the minimized flag. Returns the two mousedown handlers
    and the live drag refs (so a click-vs-drag check can read `.moved`). */
export function useFloatingPanels() {
  const [minimized, setMinimized] = useState(false);
  const [chipPos, setChipPos] = useState<Pos>(null);
  const [panelPos, setPanelPos] = useState<Pos>(null);
  const chipDrag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const panelDrag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  // Holds a "detach in-flight drag listeners" fn per draggable, so an unmount
  // mid-drag can clean up the window listeners.
  const chipDetach = useRef<(() => void) | null>(null);
  const panelDetach = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!IS_DEV) return;
    try {
      const pos = window.localStorage.getItem("ds-chip-pos");
      if (pos) setChipPos(JSON.parse(pos));
      const ppos = window.localStorage.getItem("ds-panel-pos");
      if (ppos) setPanelPos(JSON.parse(ppos));
    } catch {
      /* ignore */
    }
    return () => {
      chipDetach.current?.();
      panelDetach.current?.();
    };
  }, []);

  const onChipMouseDown = useMemo(
    () => makeDragHandler(chipDrag, setChipPos, "ds-chip-pos", 60, 28, chipDetach),
    []
  );
  const onPanelMouseDown = useMemo(
    () => makeDragHandler(panelDrag, setPanelPos, "ds-panel-pos", 100, 60, panelDetach),
    []
  );

  return {
    minimized,
    setMinimized,
    chipPos,
    panelPos,
    chipDrag,
    panelDrag,
    onChipMouseDown,
    onPanelMouseDown,
  };
}

/** Type-scale live preview. Weight & line-height aren't design tokens, so
    instead of writing CSS we set an inline style on every element matching a
    row's exact size/weight/line-height combo — tracked for reset. The user
    applies the change in their CSS by hand. */
export function useTypePreview(inventory: Inventory | null) {
  // Which row's value is being edited ("sizeKey|field"), and its draft.
  const [typeEditing, setTypeEditing] = useState<string | null>(null);
  const [typeDraft, setTypeDraft] = useState("");
  // element -> the set of props WE set (so reset removes only ours).
  const typeEdits = useRef<Map<HTMLElement, Set<string>>>(new Map());
  const [typePreviewCount, setTypePreviewCount] = useState(0);

  const previewType = useCallback(
    (
      row: { size: number; weight: string; lineHeight: string },
      prop: "font-weight" | "line-height",
      nextValue: string
    ): string | null => {
      const value = nextValue.trim();
      if (!value) return "empty";
      const sizeStr = `${row.size}px`;
      const candidates = inventory?.typeEls.get(sizeStr) ?? [];
      // Narrow to elements that match this row's full combo, so editing the
      // "14px / 500 / 21px" row doesn't also hit "14px / 400 / normal".
      const targets = candidates.filter((el) => {
        if (!el.isConnected) return false;
        const cs = getComputedStyle(el);
        const lh =
          cs.lineHeight === "normal"
            ? "normal"
            : `${Math.round(parseFloat(cs.lineHeight) * 10) / 10}px`;
        return cs.fontWeight === row.weight && lh === row.lineHeight;
      });
      if (targets.length === 0) return "no live elements";
      // Prune elements that detached since (e.g. HMR) so the Map can't grow
      // unbounded with dead nodes across a long dev session.
      for (const node of typeEdits.current.keys()) {
        if (!node.isConnected) typeEdits.current.delete(node);
      }
      targets.forEach((el) => {
        el.style.setProperty(prop, value);
        const props = typeEdits.current.get(el) ?? new Set<string>();
        props.add(prop);
        typeEdits.current.set(el, props);
      });
      setTypePreviewCount(typeEdits.current.size);
      return null;
    },
    [inventory]
  );

  /* Remove only the type props we previewed, leaving the page's own styles. */
  const resetTypePreviews = useCallback(() => {
    typeEdits.current.forEach((props, el) => {
      props.forEach((p) => el.style.removeProperty(p));
    });
    typeEdits.current.clear();
    setTypePreviewCount(0);
  }, []);

  return {
    typeEditing,
    setTypeEditing,
    typeDraft,
    setTypeDraft,
    typePreviewCount,
    previewType,
    resetTypePreviews,
  };
}

export type Toast = {
  kind: "success" | "error" | "info";
  message: string;
  /** Optional full command for the user to copy manually — shown with a Copy
      button when auto-copy to the clipboard failed. A click is a direct user
      gesture, so it succeeds where the programmatic writeText was blocked. */
  command?: string;
};

/** Time-on-screen scaled to reading length on top of a generous base; errors
    linger longest; capped so it never feels stuck. */
function toastDuration(message: string, kind: Toast["kind"]): number {
  const base = kind === "error" ? 6000 : 5000;
  return Math.min(base + message.length * 45, 12000);
}

/** Transient toast with an auto-dismiss timer. ALL timer manipulation lives in
    this hook (raise / hover-pause / resume / dismiss) against a single timer
    ref, so the JSX never touches the timer directly — that removes the
    multi-path race where show/hover/leave/close all wrote the same slot. */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Remember the live toast so `resumeToast` can recompute its duration.
  const current = useRef<Toast | null>(null);

  const clear = () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  };

  const showToast = useCallback(
    (message: string, kind: Toast["kind"] = "success", command?: string) => {
      const t = { message, kind, command };
      current.current = t;
      setToast(t);
      clear();
      // A toast carrying a copyable command needs to linger — the user has to
      // read it and click Copy. Pad the duration by the command's length too.
      const dwell = toastDuration(message + (command ?? ""), kind);
      toastTimer.current = setTimeout(() => {
        current.current = null;
        setToast(null);
      }, dwell);
    },
    []
  );

  /** Pause auto-dismiss while the cursor is over the toast. */
  const pauseToast = useCallback(() => clear(), []);

  /** Resume after the cursor leaves (short grace so it doesn't snap away). */
  const resumeToast = useCallback(() => {
    if (!current.current) return;
    clear();
    toastTimer.current = setTimeout(() => {
      current.current = null;
      setToast(null);
    }, 1500);
  }, []);

  /** Close button: kill the toast and its timer immediately. */
  const dismissToast = useCallback(() => {
    clear();
    current.current = null;
    setToast(null);
  }, []);

  useEffect(() => () => clear(), []);

  return { toast, showToast, pauseToast, resumeToast, dismissToast };
}
