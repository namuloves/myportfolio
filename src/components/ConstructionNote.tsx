import { type CSSProperties } from "react";
import styles from "../styles/home.module.css";
import { type EmailPreviewTarget } from "../hooks/useEmailPreview";

interface ConstructionNoteProps {
  entranceStyle: (ms: number, durationMs?: number) => CSSProperties;
  entranceDelay: number;
  showContraPreview: boolean;
  activeEmailPreviewTarget: EmailPreviewTarget | null;
  emailCopied: boolean;
  openContraPreview: () => void;
  closeContraPreview: () => void;
  handleEmailMouseEnter: (target: EmailPreviewTarget) => void;
  handleEmailMouseLeave: () => void;
  handleEmailCopy: (target: EmailPreviewTarget) => void;
}

/** The "website update in progress" note with Contra link + email copy previews. */
export default function ConstructionNote({
  entranceStyle,
  entranceDelay,
  showContraPreview,
  activeEmailPreviewTarget,
  emailCopied,
  openContraPreview,
  closeContraPreview,
  handleEmailMouseEnter,
  handleEmailMouseLeave,
  handleEmailCopy,
}: ConstructionNoteProps) {
  const renderEmailPreview = (target: EmailPreviewTarget) => (
    <div className={styles.emailPreview} role="status" aria-live="polite">
      <div className={styles.emailPreviewContent}>
        {emailCopied ? (
          <svg className={styles.previewIcon} viewBox="0 0 24 24" aria-hidden="true">
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
          <svg className={styles.previewIcon} viewBox="0 0 24 24" aria-hidden="true">
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
            <path d="M13 10v4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M13 14.5l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M16.8 18.3l2.2 2.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
        <button
          type="button"
          className={styles.emailPreviewAction}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleEmailCopy(target)}
          aria-label="Copy email address"
        >
          {emailCopied ? "Copied!" : "Copy the email address"}
        </button>
      </div>
    </div>
  );

  return (
    <p className={`${styles.constructionNote} ${styles.entranceItem}`} style={entranceStyle(entranceDelay)}>
      Website update is in progress. In the meantime, check out my work at{" "}
      <span
        className={styles.contraLinkWrapper}
        onMouseEnter={openContraPreview}
        onMouseLeave={closeContraPreview}
      >
        <a
          href="https://contra.com/namupark/work"
          target="_blank"
          rel="noopener noreferrer"
          onFocus={openContraPreview}
          onBlur={closeContraPreview}
        >
          Contra
        </a>
        {showContraPreview && (
          <div className={styles.contraPreview}>
            <div className={styles.contraPreviewContent}>
              <a
                href="https://contra.com/namupark/work"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View portfolio on Contra"
              >
                View my portfolio on Contra →
              </a>
            </div>
          </div>
        )}
      </span>
      {" "}and email{" "}
      <span
        className={styles.emailLinkWrapper}
        onMouseEnter={() => handleEmailMouseEnter("main")}
        onMouseLeave={handleEmailMouseLeave}
      >
        <button
          onClick={() => handleEmailCopy("main")}
          onFocus={() => handleEmailMouseEnter("main")}
          onBlur={handleEmailMouseLeave}
          className={styles.emailButton}
          aria-label="Copy email address"
        >
          hello@namupark.com
        </button>
        {activeEmailPreviewTarget === "main" && renderEmailPreview("main")}
      </span>
    </p>
  );
}
