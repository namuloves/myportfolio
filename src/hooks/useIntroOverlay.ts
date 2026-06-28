import { useEffect, useLayoutEffect, useRef, useState } from "react";

const INTRO_HOLD_MS = 2000;
const OVERLAY_BLUR_MS = 800;
const OVERLAY_REMOVE_MS = 800;

/**
 * Drives the one-time intro overlay: holds briefly, blurs out, reveals the page,
 * then removes the overlay. Skips immediately on wheel/touch, and is bypassed
 * entirely once seen this session (sessionStorage). Also smooth-scrolls to
 * #about when the page becomes visible with that hash.
 *
 * Exposes `hasSeenIntroRef` so entrance animations can skip their delays on
 * subsequent views.
 */
export function useIntroOverlay() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isOverlayBlurring, setIsOverlayBlurring] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const hasSeenIntroRef = useRef(false);

  const introTimeoutRef = useRef<number | null>(null);
  const overlayBlurTimeoutRef = useRef<number | null>(null);
  const overlayRemoveTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (sessionStorage.getItem("hasSeenIntro") === "1") {
      hasSeenIntroRef.current = true;
      setIsPageVisible(true);
      setIsOverlayVisible(false);
    }
  }, []);

  useEffect(() => {
    if (hasSeenIntroRef.current) return;

    const clearIntroSequenceTimeouts = () => {
      if (introTimeoutRef.current !== null) {
        window.clearTimeout(introTimeoutRef.current);
        introTimeoutRef.current = null;
      }
      if (overlayBlurTimeoutRef.current !== null) {
        window.clearTimeout(overlayBlurTimeoutRef.current);
        overlayBlurTimeoutRef.current = null;
      }
      if (overlayRemoveTimeoutRef.current !== null) {
        window.clearTimeout(overlayRemoveTimeoutRef.current);
        overlayRemoveTimeoutRef.current = null;
      }
    };

    const skipIntroImmediately = () => {
      clearIntroSequenceTimeouts();
      sessionStorage.setItem("hasSeenIntro", "1");
      setIsPageVisible(true);
      setIsOverlayBlurring(false);
      setIsOverlayVisible(false);
    };

    introTimeoutRef.current = window.setTimeout(() => {
      setIsOverlayBlurring(true);
      overlayBlurTimeoutRef.current = window.setTimeout(() => {
        setIsPageVisible(true);
        sessionStorage.setItem("hasSeenIntro", "1");

        overlayRemoveTimeoutRef.current = window.setTimeout(() => {
          setIsOverlayVisible(false);
        }, OVERLAY_REMOVE_MS);
      }, OVERLAY_BLUR_MS);
    }, INTRO_HOLD_MS);

    window.addEventListener("wheel", skipIntroImmediately, { passive: true, once: true });
    window.addEventListener("touchstart", skipIntroImmediately, { passive: true, once: true });

    return () => {
      window.removeEventListener("wheel", skipIntroImmediately);
      window.removeEventListener("touchstart", skipIntroImmediately);
      clearIntroSequenceTimeouts();
    };
  }, []);

  useEffect(() => {
    if (!isPageVisible) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#about") return;

    const aboutSection = document.getElementById("about");
    if (!aboutSection) return;

    const scrollTimeout = window.setTimeout(() => {
      aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);

    return () => {
      window.clearTimeout(scrollTimeout);
    };
  }, [isPageVisible]);

  return { isOverlayVisible, isOverlayBlurring, isPageVisible, hasSeenIntroRef };
}
