"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CaseStudyCard from "@/components/CaseStudyCardTest";
import styles from "@/styles/landing-test.module.css";

const faviconSources = [
  "/namu_favicon.png",
  "/namu_favicon5.png",
  "/namu_favicon12.png",
];

const headlineText = "Namu Park is a product designer based in Brooklyn, New York.";
const headlineWords = headlineText.split(" ");
const INTRO_HOLD_MS = 2300;
const OVERLAY_BLUR_MS = 1600;
const OVERLAY_REMOVE_MS = 1600;

const getBrooklynTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(new Date());

export default function Home() {
  const [showPreview, setShowPreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isOverlayBlurring, setIsOverlayBlurring] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [activeFavicon, setActiveFavicon] = useState(0);
  const [brooklynTime, setBrooklynTime] = useState(getBrooklynTime);
  const [entranceDelays] = useState(() => ({
    hero: 0,
    note: 40 + Math.floor(Math.random() * 60),
    cards: Array.from({ length: 4 }, (_, index) => 90 + index * 70 + Math.floor(Math.random() * 50)),
    footer: 300 + Math.floor(Math.random() * 80),
  }));

  const contraHideTimeoutRef = useRef<number | null>(null);
  const emailHideTimeoutRef = useRef<number | null>(null);
  const emailResetTimeoutRef = useRef<number | null>(null);
  const introTimeoutRef = useRef<number | null>(null);
  const overlayBlurTimeoutRef = useRef<number | null>(null);
  const overlayRemoveTimeoutRef = useRef<number | null>(null);
  const brooklynTimeIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFavicon((prev) => (prev + 1) % faviconSources.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setBrooklynTime(getBrooklynTime());
    brooklynTimeIntervalRef.current = window.setInterval(() => {
      setBrooklynTime(getBrooklynTime());
    }, 30000);

    return () => {
      if (brooklynTimeIntervalRef.current !== null) {
        window.clearInterval(brooklynTimeIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    introTimeoutRef.current = window.setTimeout(() => {
      setIsOverlayBlurring(true);
      overlayBlurTimeoutRef.current = window.setTimeout(() => {
        setIsPageVisible(true);

        overlayRemoveTimeoutRef.current = window.setTimeout(() => {
          setIsOverlayVisible(false);
        }, OVERLAY_REMOVE_MS);
      }, OVERLAY_BLUR_MS);
    }, INTRO_HOLD_MS);

    return () => {
      if (introTimeoutRef.current !== null) {
        window.clearTimeout(introTimeoutRef.current);
      }
      if (overlayBlurTimeoutRef.current !== null) {
        window.clearTimeout(overlayBlurTimeoutRef.current);
      }
      if (overlayRemoveTimeoutRef.current !== null) {
        window.clearTimeout(overlayRemoveTimeoutRef.current);
      }
    };
  }, []);

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
    setShowPreview(true);
  };

  const closeContraPreview = () => {
    clearContraHideTimeout();
    contraHideTimeoutRef.current = window.setTimeout(() => {
      setShowPreview(false);
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

  const handleEmailMouseEnter = () => {
    clearEmailHideTimeout();
    setShowEmailPreview(true);
  };

  const handleEmailMouseLeave = () => {
    clearEmailHideTimeout();
    emailHideTimeoutRef.current = window.setTimeout(() => {
      setShowEmailPreview(false);
      setEmailCopied(false);
      clearEmailCopiedTimeout();
    }, 140);
  };

  const handleEmailCopy = async () => {
    try {
      await navigator.clipboard.writeText("namu.d.park@gmail.com");
      setShowEmailPreview(true);
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

  const pageLayerClassName = [
    styles.pageLayer,
    isPageVisible ? styles.pageLayerVisible : styles.pageLayerHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const introOverlayClassName = [
    styles.introOverlay,
    isOverlayBlurring ? styles.introOverlayBlur : "",
  ]
    .filter(Boolean)
    .join(" ");

  const navClassName = [
    styles.nav,
    isPageVisible ? styles.navVisible : styles.navHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const entranceStyle = (ms: number, durationMs?: number): CSSProperties =>
    ({
      "--entrance-delay": `${ms}ms`,
      ...(durationMs !== undefined ? { "--entrance-duration": `${durationMs}ms` } : {}),
    }) as CSSProperties;

  return (
    <main className={styles.container}>
      {isOverlayVisible && (
        <div className={introOverlayClassName} aria-hidden="true">
          <h1 className={styles.introHeadline}>
            {headlineWords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={styles.introWord}
                style={{ animationDelay: `${index * 85}ms` }}
              >
                {word}
              </span>
            ))}
          </h1>
        </div>
      )}

      <nav className={navClassName} style={entranceStyle(20, 1200)} aria-label="Site header">
        <Link href="/" className={styles.navLeft}>
          Namu Park
        </Link>
        <span className={styles.navRight}>Brooklyn, New York {brooklynTime}</span>
      </nav>

      <div className={pageLayerClassName}>
        <div className={styles.heroWrapper}>
          <h1
            className={`${styles.hero} ${styles.entranceItem}`}
            style={entranceStyle(entranceDelays.hero, 650)}
          >
            {headlineText}
          </h1>
          <p
            className={`${styles.constructionNote} ${styles.entranceItem}`}
            style={entranceStyle(entranceDelays.note)}
          >
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
              {showPreview && (
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
              onMouseEnter={handleEmailMouseEnter}
              onMouseLeave={handleEmailMouseLeave}
            >
              <button
                onClick={handleEmailCopy}
                onFocus={handleEmailMouseEnter}
                onBlur={handleEmailMouseLeave}
                className={styles.emailButton}
                aria-label="Copy email address"
              >
                namu.d.park@gmail.com
              </button>
              {showEmailPreview && (
                <div className={styles.emailPreview} role="status" aria-live="polite">
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
              )}
            </span>
          </p>
        </div>

        <section className={styles.caseGrid}>
          <div className={styles.entranceItem} style={entranceStyle(entranceDelays.cards[0])}>
            <CaseStudyCard
              title="ClaimClam"
              href="/claimclam"
              image="/images/namupark_claimclam.png"
              hoverLabel="Read case study"
            />
          </div>
          <div className={styles.entranceItem} style={entranceStyle(entranceDelays.cards[1])}>
            <CaseStudyCard
              title="The Sloth"
              video="/video/slothvideo2.mp4"
              hoverLabel="Case study coming soon"
            />
          </div>
          <div className={styles.entranceItem} style={entranceStyle(entranceDelays.cards[2])}>
            <CaseStudyCard
              title="Heart in the Cloud"
              image="/images/HITC_namupark_cover1.png"
              subtitle="Logo Design"
              disableHoverDim
            />
          </div>
          <div className={styles.entranceItem} style={entranceStyle(entranceDelays.cards[3])}>
            <CaseStudyCard
              title="AI Deal Home"
              image="/images/A.NamuPark_AIDealHome.png"
              disableHoverDim
            />
          </div>
        </section>

        <footer
          className={`${styles.footer} ${styles.entranceItem}`}
          style={entranceStyle(entranceDelays.footer)}
          aria-hidden="true"
        >
          <div className={styles.faviconStack}>
            {faviconSources.map((src, index) => (
              <div
                key={src}
                className={`${styles.faviconFrame} ${
                  activeFavicon === index ? styles.faviconFrameActive : ""
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="(min-width: 768px) 96px, 72px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
