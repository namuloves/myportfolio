"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import cs from "../styles/casestudy.module.css";

interface CaseStudyFloatingNavProps {
  /** Route of the next case study; omit to hide the Next button. */
  nextHref?: string;
}

/**
 * Floating Back / Top / Next buttons on case-study pages. Appears once the
 * page is scrolled past 24px. Listens on window, document, and body because
 * the scroll container differs across layouts (html is overflow: hidden and
 * body scrolls on some pages).
 */
export default function CaseStudyFloatingNav({ nextHref }: CaseStudyFloatingNavProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const root = document.documentElement;
      const { body } = document;
      const scrollTop = Math.max(window.scrollY, root.scrollTop, body.scrollTop);
      setIsVisible(scrollTop > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const scrollingElement = document.scrollingElement as HTMLElement | null;

    window.scrollTo({ top: 0, behavior });
    scrollingElement?.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTo({ top: 0, behavior });
    document.body.scrollTo({ top: 0, behavior });
  };

  if (!isVisible) return null;

  return (
    <div className={cs.floatingNavigation}>
      <Link href="/" className={cs.backToHome}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className={cs.backToHomeLabel}>Back</span>
      </Link>

      <button onClick={scrollToTop} className={cs.backToTop}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span className={cs.backToTopLabel}>Top</span>
      </button>

      {nextHref && (
        <Link href={nextHref} className={cs.nextCase}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span className={cs.nextCaseLabel}>Next</span>
        </Link>
      )}
    </div>
  );
}
