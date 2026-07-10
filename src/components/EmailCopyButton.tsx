"use client";

import { useEffect, useRef } from "react";
import { slotText, type SlotTextController } from "slot-text";
import styles from "../styles/home.module.css";

const CONTACT_EMAIL = "hello@namupark.com";

interface EmailCopyButtonProps {
  /** True right after a successful copy — triggers the "Copied!" flash. */
  copied: boolean;
  onClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * The email address button. Uses slot-text's imperative controller so that on
 * copy the label rolls to "Copied!" and auto-reverts back to the address.
 */
export default function EmailCopyButton({ copied, onClick, onFocus, onBlur }: EmailCopyButtonProps) {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const controllerRef = useRef<SlotTextController | null>(null);

  useEffect(() => {
    if (!labelRef.current) return;
    const controller = slotText(labelRef.current, CONTACT_EMAIL);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (copied) {
      controllerRef.current?.flash("Copied!", { revertAfter: 1400 });
    }
  }, [copied]);

  return (
    <button
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      className={styles.emailButton}
      aria-label="Copy email address"
    >
      <span ref={labelRef}>{CONTACT_EMAIL}</span>
    </button>
  );
}
