import { useEffect, useRef, useState } from "react";

export type EmailPreviewTarget = "main" | "footer";

const CONTACT_EMAIL = "hello@namupark.com";

/**
 * State + handlers for the Contra link preview and the email copy-to-clipboard
 * preview (which can appear on the main note or the footer). Hover/focus opens a
 * preview; clicking the email copies it and briefly shows a "Copied!" state.
 */
export function useEmailPreview() {
  const [showContraPreview, setShowContraPreview] = useState(false);
  const [activeEmailPreviewTarget, setActiveEmailPreviewTarget] =
    useState<EmailPreviewTarget | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const contraHideTimeoutRef = useRef<number | null>(null);
  const emailHideTimeoutRef = useRef<number | null>(null);
  const emailResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (contraHideTimeoutRef.current !== null) {
        window.clearTimeout(contraHideTimeoutRef.current);
      }
      if (emailHideTimeoutRef.current !== null) {
        window.clearTimeout(emailHideTimeoutRef.current);
      }
      if (emailResetTimeoutRef.current !== null) {
        window.clearTimeout(emailResetTimeoutRef.current);
      }
    };
  }, []);

  const clearContraHideTimeout = () => {
    if (contraHideTimeoutRef.current !== null) {
      window.clearTimeout(contraHideTimeoutRef.current);
      contraHideTimeoutRef.current = null;
    }
  };

  const openContraPreview = () => {
    clearContraHideTimeout();
    setShowContraPreview(true);
  };

  const closeContraPreview = () => {
    clearContraHideTimeout();
    contraHideTimeoutRef.current = window.setTimeout(() => {
      setShowContraPreview(false);
    }, 140);
  };

  const clearEmailCopiedTimeout = () => {
    if (emailResetTimeoutRef.current !== null) {
      window.clearTimeout(emailResetTimeoutRef.current);
      emailResetTimeoutRef.current = null;
    }
  };

  const clearEmailHideTimeout = () => {
    if (emailHideTimeoutRef.current !== null) {
      window.clearTimeout(emailHideTimeoutRef.current);
      emailHideTimeoutRef.current = null;
    }
  };

  const handleEmailMouseEnter = (target: EmailPreviewTarget) => {
    clearEmailHideTimeout();
    setActiveEmailPreviewTarget(target);
  };

  const handleEmailMouseLeave = () => {
    clearEmailHideTimeout();
    emailHideTimeoutRef.current = window.setTimeout(() => {
      setActiveEmailPreviewTarget(null);
      setEmailCopied(false);
      clearEmailCopiedTimeout();
    }, 140);
  };

  const handleEmailCopy = async (target: EmailPreviewTarget) => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setActiveEmailPreviewTarget(target);
      setEmailCopied(true);
      clearEmailHideTimeout();
      clearEmailCopiedTimeout();
      emailResetTimeoutRef.current = window.setTimeout(() => {
        setEmailCopied(false);
      }, 1600);
    } catch {
      setEmailCopied(false);
    }
  };

  return {
    showContraPreview,
    activeEmailPreviewTarget,
    emailCopied,
    openContraPreview,
    closeContraPreview,
    handleEmailMouseEnter,
    handleEmailMouseLeave,
    handleEmailCopy,
  };
}
