"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles/home.module.css";

export default function SiteFooter() {
  const [emailCopied, setEmailCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText("hello@namupark.com");
      setEmailCopied(true);
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = window.setTimeout(() => {
        setEmailCopied(false);
      }, 1600);
    } catch {
      setEmailCopied(false);
    }
  };

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.footer} aria-label="Footer">
      <div className={styles.footerContact}>
        <span className={styles.footerIcon} aria-hidden="true">
          📧
        </span>
        <span>say</span>
        <button
          type="button"
          onClick={handleEmailCopy}
          className={`${styles.emailButton} ${styles.footerEmail}`}
          aria-label="Copy email address"
        >
          {emailCopied ? "Copied!" : "hello@namupark.com"}
        </button>
      </div>
    </div>
  );
}
