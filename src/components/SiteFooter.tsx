"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  const [emailCopied, setEmailCopied] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const clearResetTimeout = () => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  const handleEnter = () => {
    clearHideTimeout();
    setIsPreviewVisible(true);
  };

  const handleLeave = () => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsPreviewVisible(false);
      setEmailCopied(false);
      clearResetTimeout();
    }, 140);
  };

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText("hello@namupark.com");
      setIsPreviewVisible(true);
      setEmailCopied(true);
      clearHideTimeout();
      clearResetTimeout();
      resetTimeoutRef.current = window.setTimeout(() => {
        setEmailCopied(false);
      }, 1600);
    } catch {
      setEmailCopied(false);
    }
  };

  useEffect(() => {
    return () => {
      clearHideTimeout();
      clearResetTimeout();
    };
  }, []);

  return (
    <footer className={styles.footer} aria-label="Footer">
      <div className={styles.left}>
        <span>Designed &amp; developed by Namu &amp; Claude</span>
      </div>
      <div className={styles.right}>
        <a
          className={styles.link}
          href="https://www.linkedin.com/in/namupark"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
        <span
          className={styles.emailLinkWrapper}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <button
            type="button"
            className={styles.link}
            onClick={handleEmailCopy}
            onFocus={handleEnter}
            onBlur={handleLeave}
            aria-label="Copy email address"
          >
            Email
          </button>
          <div
            className={`${styles.emailPreview} ${isPreviewVisible ? styles.emailPreviewVisible : ""}`}
            role="status"
            aria-live="polite"
            aria-hidden={!isPreviewVisible}
          >
              <div className={styles.emailPreviewContent}>
                {emailCopied ? (
                  <svg
                    className={styles.previewIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className={styles.previewIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="14"
                      height="6"
                      rx="2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    />
                    <path
                      d="M13 10v4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M13 14.5l4.5 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16.8 18.3l2.2 2.2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <button
                  type="button"
                  className={styles.emailPreviewAction}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleEmailCopy}
                  aria-label="Copy email address"
                >
                  {emailCopied ? "Copied!" : "Copy the email address"}
                </button>
              </div>
            </div>
        </span>
        <a
          className={styles.link}
          href="https://x.com/namu_paak"
          target="_blank"
          rel="noopener noreferrer"
        >
          X
        </a>
      </div>
    </footer>
  );
}
