/**
 * Presentational sub-components for the design-spec overlay panel.
 * Pure UI — local state only, no app wiring.
 */

import { useState } from "react";
import styles from "./DesignSpecOverlay.module.css";

export function SectionHeader({
  title,
  count,
  isCollapsed,
  onToggle,
}: {
  title: string;
  count?: number;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={styles.collapseHeader}
      onClick={onToggle}
      aria-expanded={!isCollapsed}
    >
      <span className={isCollapsed ? styles.caretCollapsed : styles.caret}>▸</span>
      <span className={styles.collapseTitle}>
        {title}
        {count !== undefined ? ` · ${count}` : ""}
      </span>
    </button>
  );
}

/** A value shown as a button that turns into a text input on click. Commits on
    Enter/blur, cancels on Escape. `live` (no persisted token) shows a hint. */
export function InlineValueEdit({
  value,
  placeholder,
  live,
  dirty,
  onCommit,
}: {
  value: string;
  placeholder?: string;
  live?: boolean;
  /** Value differs from the saved token — highlight until saved. */
  dirty?: boolean;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) {
    return (
      <button
        className={`${styles.inlineValueBtn}${dirty ? ` ${styles.dirty}` : ""}`}
        title={live ? "Edit (live preview only — no token to save)" : "Edit value"}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
        {live && <span className={styles.liveDot}>~</span>}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== value) onCommit(v);
  };
  return (
    <input
      className={styles.inlineValueInput}
      value={draft}
      autoFocus
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      spellCheck={false}
    />
  );
}

/** A tokenized inventory row: `name · value` where the NAME is single-click to
    rename and the VALUE is single-click to edit. Two separate tap targets, no
    double-click. Used by both Type scale and Spacing. */
export function EditableTokenLabel({
  label,
  fullName,
  value,
  dirty,
  onRename,
  onEditValue,
}: {
  label: string;
  fullName: string;
  value: string;
  /** Value differs from the saved token — highlight the value field. */
  dirty?: boolean;
  onRename: (next: string) => void;
  onEditValue: (next: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(fullName);
  if (renaming) {
    const commit = () => {
      setRenaming(false);
      const v = draft.trim();
      if (v && v !== fullName) onRename(v);
    };
    return (
      <span className={styles.namingWrap}>
        <input
          className={styles.namingInput}
          value={draft}
          autoFocus
          placeholder={fullName}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setRenaming(false);
          }}
          spellCheck={false}
        />
      </span>
    );
  }
  return (
    <>
      <button
        className={styles.tokenNameBtn}
        title={`${fullName} — click to rename`}
        onClick={() => {
          setDraft(fullName);
          setRenaming(true);
        }}
      >
        {label}
      </button>
      <span className={styles.invSub}> · </span>
      <InlineValueEdit
        value={value}
        placeholder="16px"
        dirty={dirty}
        onCommit={onEditValue}
      />
    </>
  );
}

/** Pending token-edit summary. Makes the outcome of an edit explicit: what
    changed, how many places it affects, and that it's a live preview until
    "Update CSS" writes it to globals.css. Pure UI — counts come from `useCount`. */
export function PendingChanges({
  edits,
  baseValues,
  useCount,
}: {
  edits: Record<string, string>;
  baseValues: Record<string, string>;
  useCount: (name: string) => number;
}) {
  const names = Object.keys(edits);
  if (names.length === 0) return null;
  return (
    <div className={styles.pendingBox}>
      <div className={styles.pendingHead}>
        Previewing {names.length} change{names.length === 1 ? "" : "s"} live — not
        saved yet
      </div>
      {names.map((name) => {
        const uses = useCount(name);
        return (
          <div key={name} className={styles.pendingRow}>
            <code>{name}</code>: {baseValues[name] ?? "?"}{" "}
            <span aria-hidden>→</span> <strong>{edits[name]}</strong>
            {uses > 0 && (
              <span className={styles.pendingUses}>
                {" "}
                · {uses} place{uses === 1 ? "" : "s"}
              </span>
            )}
          </div>
        );
      })}
      <div className={styles.pendingFoot}>
        <strong>Update CSS</strong> saves to globals.css (every use of the token
        updates). <strong>reset</strong> discards the preview.
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

