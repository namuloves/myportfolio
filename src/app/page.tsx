"use client";

import { type CSSProperties, useState } from "react";
import SiteFooter from "../components/SiteFooter";
import IntroOverlay from "../components/IntroOverlay";
import SiteNav from "../components/SiteNav";
import HeadlineMorph from "../components/HeadlineMorph";
import ConstructionNote from "../components/ConstructionNote";
import CaseStudyGrid from "../components/CaseStudyGrid";
import styles from "../styles/home.module.css";
import { useBrooklynClock } from "../hooks/useBrooklynClock";
import { useTheme } from "../hooks/useTheme";
import { useEmailPreview } from "../hooks/useEmailPreview";
import { useIntroOverlay } from "../hooks/useIntroOverlay";
import { useHeadlineMorph } from "../hooks/useHeadlineMorph";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const emailPreview = useEmailPreview();
  const { isOverlayVisible, isOverlayBlurring, isPageVisible, hasSeenIntroRef } = useIntroOverlay();
  const morph = useHeadlineMorph();
  const brooklynTime = useBrooklynClock();
  const [entranceDelays] = useState(() => ({
    hero: 0,
    note: 40 + Math.floor(Math.random() * 60),
    cards: Array.from({ length: 5 }, (_, index) => 90 + index * 70 + Math.floor(Math.random() * 50)),
  }));

  const pageLayerClassName = [
    styles.pageLayer,
    isPageVisible ? styles.pageLayerVisible : styles.pageLayerHidden,
  ]
    .filter(Boolean)
    .join(" ");

  const introOverlayClassName = [styles.introOverlay, isOverlayBlurring ? styles.introOverlayBlur : ""]
    .filter(Boolean)
    .join(" ");

  const navClassName = [styles.nav, isPageVisible ? styles.navVisible : styles.navHidden]
    .filter(Boolean)
    .join(" ");

  const entranceStyle = (ms: number, durationMs?: number): CSSProperties =>
    hasSeenIntroRef.current
      ? ({ "--entrance-delay": "0ms", "--entrance-duration": "0ms" } as CSSProperties)
      : ({
          "--entrance-delay": `${ms}ms`,
          ...(durationMs !== undefined ? { "--entrance-duration": `${durationMs}ms` } : {}),
        } as CSSProperties);

  return (
    <main className={styles.container}>
      {isOverlayVisible && <IntroOverlay className={introOverlayClassName} />}

      <SiteNav
        className={navClassName}
        theme={theme}
        brooklynTime={brooklynTime}
        onToggleTheme={toggleTheme}
        entranceStyle={entranceStyle}
      />

      <div className={pageLayerClassName}>
        <div className={styles.heroWrapper}>
          <HeadlineMorph
            entranceStyle={entranceStyle}
            entranceDelay={entranceDelays.hero}
            isHeadlineMorphed={morph.isHeadlineMorphed}
            setIsHeadlineMorphed={morph.setIsHeadlineMorphed}
            activeEnglishWordIndexSet={morph.activeEnglishWordIndexSet}
            activeEnglishWordHideOrders={morph.activeEnglishWordHideOrders}
            activeEnglishWordReturnDelays={morph.activeEnglishWordReturnDelays}
            isEnglishReturning={morph.isEnglishReturning}
            activeKoreanWordIndexSet={morph.activeKoreanWordIndexSet}
            isKoreanExiting={morph.isKoreanExiting}
            koreanExitWordIndexSet={morph.koreanExitWordIndexSet}
            koreanExitCharDelays={morph.koreanExitCharDelays}
          />
          <ConstructionNote
            entranceStyle={entranceStyle}
            entranceDelay={entranceDelays.note}
            showContraPreview={emailPreview.showContraPreview}
            activeEmailPreviewTarget={emailPreview.activeEmailPreviewTarget}
            emailCopied={emailPreview.emailCopied}
            openContraPreview={emailPreview.openContraPreview}
            closeContraPreview={emailPreview.closeContraPreview}
            handleEmailMouseEnter={emailPreview.handleEmailMouseEnter}
            handleEmailMouseLeave={emailPreview.handleEmailMouseLeave}
            handleEmailCopy={emailPreview.handleEmailCopy}
          />
        </div>

        <CaseStudyGrid entranceStyle={entranceStyle} cardDelays={entranceDelays.cards} />

        <SiteFooter />
      </div>
    </main>
  );
}
