import { type CSSProperties } from "react";
import styles from "../styles/home.module.css";
import {
  KOREAN_EXIT_CHAR_FADE_MS,
  englishHeadlineWordsByLine,
  englishLineStartIndices,
  headlineText,
  koreanHeadlineCharsByLine,
  koreanHeadlineWordsByLine,
  koreanLineStartIndices,
  koreanWordCharStartIndices,
} from "../lib/headlineMorph";

interface HeadlineMorphProps {
  entranceStyle: (ms: number, durationMs?: number) => CSSProperties;
  entranceDelay: number;
  isHeadlineMorphed: boolean;
  setIsHeadlineMorphed: (value: boolean) => void;
  activeEnglishWordIndexSet: Set<number>;
  activeEnglishWordHideOrders: Record<number, number>;
  activeEnglishWordReturnDelays: Record<number, number>;
  isEnglishReturning: boolean;
  activeKoreanWordIndexSet: Set<number>;
  isKoreanExiting: boolean;
  koreanExitWordIndexSet: Set<number>;
  koreanExitCharDelays: Record<number, number>;
}

/**
 * The hero headline that morphs English → Korean on hover. Renders both the
 * English word spans (which hide on a staggered cascade) and the Korean
 * character spans (which reveal / exit per-character), driven entirely by the
 * sets and delay maps from useHeadlineMorph.
 */
export default function HeadlineMorph({
  entranceStyle,
  entranceDelay,
  isHeadlineMorphed,
  setIsHeadlineMorphed,
  activeEnglishWordIndexSet,
  activeEnglishWordHideOrders,
  activeEnglishWordReturnDelays,
  isEnglishReturning,
  activeKoreanWordIndexSet,
  isKoreanExiting,
  koreanExitWordIndexSet,
  koreanExitCharDelays,
}: HeadlineMorphProps) {
  return (
    <div
      className={`${styles.heroInteractive} ${styles.entranceItem} ${
        isHeadlineMorphed ? styles.heroInteractiveMorphed : ""
      }`}
      style={entranceStyle(entranceDelay, 650)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        setIsHeadlineMorphed(true);
      }}
      onPointerLeave={() => setIsHeadlineMorphed(false)}
    >
      <h1 className={`${styles.hero} ${styles.heroBase}`} aria-label={headlineText}>
        {englishHeadlineWordsByLine.map((lineWords, lineIndex) => (
          <span key={`eng-line-${lineIndex}`} className={styles.heroEnglishLine}>
            {lineWords.map((word, wordIndex) => {
              const globalWordIndex = englishLineStartIndices[lineIndex] + wordIndex;

              return (
                <span
                  key={`eng-word-${globalWordIndex}`}
                  className={`${styles.heroWord} ${isEnglishReturning ? styles.heroWordReturning : ""} ${
                    activeEnglishWordIndexSet.has(globalWordIndex) ? styles.heroWordHidden : ""
                  }`}
                  style={
                    {
                      "--word-order": `${wordIndex}`,
                      "--hide-delay": `${activeEnglishWordHideOrders[globalWordIndex] ?? 0}ms`,
                      "--return-delay": `${activeEnglishWordReturnDelays[globalWordIndex] ?? 0}ms`,
                    } as CSSProperties
                  }
                >
                  {word}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
      <div className={`${styles.hero} ${styles.heroKorean}`} aria-hidden="true">
        {koreanHeadlineWordsByLine.map((lineWords, lineIndex) => (
          <span key={`kr-line-${lineIndex}`} className={styles.heroKoreanLine}>
            {lineWords.map((word, wordIndex) => {
              const globalWordIndex = koreanLineStartIndices[lineIndex] + wordIndex;
              const wordChars = koreanHeadlineCharsByLine[lineIndex]?.[wordIndex] ?? [];

              return (
                <span
                  key={`kr-word-${globalWordIndex}`}
                  className={`${styles.heroWord} ${styles.heroKoreanWord} ${
                    isKoreanExiting && koreanExitWordIndexSet.has(globalWordIndex)
                      ? styles.heroKoreanWordExiting
                      : ""
                  } ${activeKoreanWordIndexSet.has(globalWordIndex) ? styles.heroKoreanWordVisible : ""}`}
                >
                  {wordChars.map((char, charIndex) => {
                    const globalCharIndex =
                      (koreanWordCharStartIndices[globalWordIndex] ?? 0) + charIndex;

                    return (
                      <span
                        key={`kr-char-${globalWordIndex}-${charIndex}`}
                        className={styles.heroKoreanChar}
                        style={
                          {
                            "--kr-char-exit-delay": `${koreanExitCharDelays[globalCharIndex] ?? 0}ms`,
                            "--kr-char-exit-duration": `${KOREAN_EXIT_CHAR_FADE_MS}ms`,
                          } as CSSProperties
                        }
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
