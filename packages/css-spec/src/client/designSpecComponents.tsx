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
  onCommit,
}: {
  value: string;
  placeholder?: string;
  live?: boolean;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) {
    return (
      <button
        className={styles.inlineValueBtn}
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
  onRename,
  onEditValue,
}: {
  label: string;
  fullName: string;
  value: string;
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
      <InlineValueEdit value={value} placeholder="16px" onCommit={onEditValue} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

