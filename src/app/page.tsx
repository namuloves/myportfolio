"use client";

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import CaseStudyCard from "../components/CaseStudyCard";
import styles from "../styles/home.module.css";
import { applyThemeWithTransition } from "../lib/themeTransition";
import {
  type Theme,
  getSystemTheme,
  getStoredThemePreference,
  setStoredThemePreference,
} from "../lib/themePreference";

const headlineText = "Namu Park is a product designer based in Brooklyn, New York.";
const headlineWords = headlineText.split(" ");
const englishHeadlineLines = ["Namu Park is a product designer", "based in Brooklyn, New York."];
const englishHeadlineWordsByLine = englishHeadlineLines.map((line) => line.split(" "));
const englishLineStartIndices = englishHeadlineWordsByLine.reduce<number[]>((acc, lineWords, index) => {
  if (index === 0) {
    acc.push(0);
    return acc;
  }

  acc.push(acc[index - 1] + englishHeadlineWordsByLine[index - 1].length);
  return acc;
}, []);
const englishHeadlineWordCount = englishHeadlineWordsByLine.flat().length;
const koreanHeadlineLines = ["안녕하세요!", "제 웹사이트에 오신것을 환영합니다."];
const koreanHeadlineWordsByLine = koreanHeadlineLines.map((line) => line.split(" "));
const koreanHeadlineCharsByLine = koreanHeadlineWordsByLine.map((lineWords) =>
  lineWords.map((word) => Array.from(word)),
);
const koreanLineStartIndices = koreanHeadlineWordsByLine.reduce<number[]>((acc, lineWords, index) => {
  if (index === 0) {
    acc.push(0);
    return acc;
  }

  acc.push(acc[index - 1] + koreanHeadlineWordsByLine[index - 1].length);
  return acc;
}, []);
const koreanHeadlineWordCount = koreanHeadlineWordsByLine.flat().length;
const koreanHeadlineCharsFlatByWord = koreanHeadlineCharsByLine.flat();
const koreanWordCharCounts = koreanHeadlineCharsFlatByWord.map((chars) => chars.length);
const koreanWordCharStartIndices = koreanWordCharCounts.reduce<number[]>((acc, charCount, index) => {
  if (index === 0) {
    acc.push(0);
    return acc;
  }

  acc.push(acc[index - 1] + koreanWordCharCounts[index - 1]);
  return acc;
}, []);
const englishToKoreanWordMap = Array.from({ length: englishHeadlineWordCount }, (_, index) => {
  if (englishHeadlineWordCount <= 1 || koreanHeadlineWordCount <= 1) return 0;
  return Math.round((index / (englishHeadlineWordCount - 1)) * (koreanHeadlineWordCount - 1));
});
const HERO_WORD_REVEAL_RADIUS = 70;
const ENGLISH_PROXIMITY_HIDE_STEP_MS = 42;
const ENGLISH_LINE_EXIT_MAX_DELAY_MS = 360;
const ENGLISH_LINE_HIDE_DURATION_MS = 460;
const ENGLISH_LINE_HIDE_COMPLETE_MS = ENGLISH_LINE_EXIT_MAX_DELAY_MS + ENGLISH_LINE_HIDE_DURATION_MS;
const ENGLISH_RETURN_STAGGER_MS = 80;
const ENGLISH_MAX_LINE_WORD_COUNT = Math.max(...englishHeadlineWordsByLine.map((lineWords) => lineWords.length));
const ENGLISH_RETURN_MAX_DELAY_MS = Math.max(0, ENGLISH_MAX_LINE_WORD_COUNT - 1) * ENGLISH_RETURN_STAGGER_MS;
const FIRST_LINE_KOREAN_REVEAL_DELAY_MS = ENGLISH_LINE_HIDE_COMPLETE_MS + 40;
const SECOND_LINE_KOREAN_REVEAL_DELAY_MS = FIRST_LINE_KOREAN_REVEAL_DELAY_MS;
const KOREAN_EXIT_FADE_OUT_MS = 600;
const KOREAN_EXIT_CHAR_FADE_MS = 180;
const KOREAN_EXIT_MAX_DELAY_MS = Math.max(0, KOREAN_EXIT_FADE_OUT_MS - KOREAN_EXIT_CHAR_FADE_MS);
const KOREAN_EXIT_TO_ENGLISH_BUFFER_MS = 80;
const KOREAN_EXIT_COMPLETE_MS = KOREAN_EXIT_FADE_OUT_MS + KOREAN_EXIT_TO_ENGLISH_BUFFER_MS;
const ENGLISH_RETURN_FADE_IN_MS = 640;
const INTRO_HOLD_MS = 2000;
const OVERLAY_BLUR_MS = 800;
const OVERLAY_REMOVE_MS = 800;
const ENABLE_SCROLL_BG_MORPH = false;
type EmailPreviewTarget = "main" | "footer";
type NearbyWordEntry = {
  distanceSquared: number;
  index: number;
};

const areIndexListsEqual = (first: number[], second: number[]) => {
  if (first.length !== second.length) return false;
  return first.every((value, index) => value === second[index]);
};

const areWordOrderMapsEqual = (first: Record<number, number>, second: Record<number, number>) => {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  if (firstKeys.length !== secondKeys.length) return false;

  return firstKeys.every((key) => first[Number(key)] === second[Number(key)]);
};

const getRandomizedDelayMap = (indices: number[], maxDelay: number) => {
  if (indices.length === 0) return {};

  const shuffledIndices = [...indices];
  for (let index = shuffledIndices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledIndices[index], shuffledIndices[swapIndex]] = [shuffledIndices[swapIndex], shuffledIndices[index]];
  }

  if (shuffledIndices.length === 1) {
    return { [shuffledIndices[0]]: 0 };
  }

  return shuffledIndices.reduce<Record<number, number>>((delayMap, charIndex, order) => {
    delayMap[charIndex] = Math.round((order / (shuffledIndices.length - 1)) * maxDelay);
    return delayMap;
  }, {});
};

const getNearbyWordEntries = (
  wordRefs: Array<HTMLSpanElement | null>,
  clientX: number,
  clientY: number,
  radius: number,
) => {
  const nearbyEntries: NearbyWordEntry[] = [];
  const radiusSquared = radius * radius;

  wordRefs.forEach((element, index) => {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;

    const distanceSquared = deltaX * deltaX + deltaY * deltaY;

    if (distanceSquared <= radiusSquared) {
      nearbyEntries.push({ distanceSquared, index });
    }
  });

  return nearbyEntries;
};

const getClosestLineIndex = (lineRefs: Array<HTMLSpanElement | null>, clientY: number) => {
  let closestIndex = -1;
  let closestDistance = Number.POSITIVE_INFINITY;

  lineRefs.forEach((lineElement, index) => {
    if (!lineElement) return;

    const rect = lineElement.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const distance = Math.abs(clientY - centerY);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

const getBrooklynTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(new Date());

export default function Home() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeEmailPreviewTarget, setActiveEmailPreviewTarget] = useState<EmailPreviewTarget | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [activeEnglishWordIndices, setActiveEnglishWordIndices] = useState<number[]>([]);
  const [activeEnglishWordHideOrders, setActiveEnglishWordHideOrders] = useState<Record<number, number>>({});
  const [activeEnglishWordReturnDelays, setActiveEnglishWordReturnDelays] = useState<Record<number, number>>({});
  const [activeKoreanWordIndices, setActiveKoreanWordIndices] = useState<number[]>([]);
  const [koreanExitWordIndices, setKoreanExitWordIndices] = useState<number[]>([]);
  const [koreanExitCharDelays, setKoreanExitCharDelays] = useState<Record<number, number>>({});
  const [isFirstEnglishLineTouched, setIsFirstEnglishLineTouched] = useState(false);
  const [isFirstLineKoreanVisible, setIsFirstLineKoreanVisible] = useState(false);
  const [isSecondEnglishLineTouched, setIsSecondEnglishLineTouched] = useState(false);
  const [isSecondLineKoreanVisible, setIsSecondLineKoreanVisible] = useState(false);
  const [isKoreanExiting, setIsKoreanExiting] = useState(false);
  const [isEnglishReturning, setIsEnglishReturning] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isOverlayBlurring, setIsOverlayBlurring] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [brooklynTime, setBrooklynTime] = useState(getBrooklynTime);
  const [entranceDelays] = useState(() => ({
    hero: 0,
    note: 40 + Math.floor(Math.random() * 60),
    cards: Array.from({ length: 4 }, (_, index) => 90 + index * 70 + Math.floor(Math.random() * 50)),
  }));

  const contraHideTimeoutRef = useRef<number | null>(null);
  const emailHideTimeoutRef = useRef<number | null>(null);
  const emailResetTimeoutRef = useRef<number | null>(null);
  const introTimeoutRef = useRef<number | null>(null);
  const overlayBlurTimeoutRef = useRef<number | null>(null);
  const overlayRemoveTimeoutRef = useRef<number | null>(null);
  const brooklynTimeIntervalRef = useRef<number | null>(null);
  const firstLineRevealTimeoutRef = useRef<number | null>(null);
  const secondLineRevealTimeoutRef = useRef<number | null>(null);
  const koreanExitTimeoutRef = useRef<number | null>(null);
  const englishReturnTimeoutRef = useRef<number | null>(null);
  const englishLineExitIndexRef = useRef<number | null>(null);
  const heroBackgroundExitActiveRef = useRef(false);
  const englishWordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const englishLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const footerParallaxSectionRef = useRef<HTMLDivElement | null>(null);
  const hasManualThemeOverrideRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = getStoredThemePreference();
    const initialTheme = storedTheme ?? getSystemTheme();

    hasManualThemeOverrideRef.current = storedTheme !== null;

    root.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (hasManualThemeOverrideRef.current) return;

      const nextTheme: Theme = event.matches ? "dark" : "light";
      root.setAttribute("data-theme", nextTheme);
      setTheme(nextTheme);
    };

    if (typeof systemThemeQuery.addEventListener === "function") {
      systemThemeQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      systemThemeQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (typeof systemThemeQuery.removeEventListener === "function") {
        systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        systemThemeQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!ENABLE_SCROLL_BG_MORPH) {
      root.classList.remove("home-bg-morph");
      root.classList.remove("home-footer-nav-dark");
      root.style.removeProperty("--home-scroll-bg");
      root.style.removeProperty("--home-scroll-fg");
      return;
    }

    if (theme !== "light") {
      root.classList.remove("home-bg-morph");
      root.classList.remove("home-footer-nav-dark");
      root.style.removeProperty("--home-scroll-bg");
      root.style.removeProperty("--home-scroll-fg");
      return;
    }

    root.classList.add("home-bg-morph");
    root.style.setProperty("--home-scroll-bg", "#ffffff");
    root.style.setProperty("--home-scroll-fg", "#171717");

    let frameId: number | null = null;

    const updateBackgroundByFooterProgress = () => {
      frameId = null;

      const footerSection = footerParallaxSectionRef.current;
      if (!footerSection) return;

      const viewportHeight = window.innerHeight;
      const footerRect = footerSection.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      const isFooterInView = footerRect.top < viewportHeight && footerRect.bottom > 0;

      const transitionStartScrollY = currentScrollY + footerRect.top - viewportHeight * 0.3;
      const transitionEndScrollY = currentScrollY + footerRect.bottom - viewportHeight;
      const transitionRange = Math.max(1, transitionEndScrollY - transitionStartScrollY);
      const rawProgress = (currentScrollY - transitionStartScrollY) / transitionRange;
      const clampedProgress = Math.min(1, Math.max(0, rawProgress));
      const backgroundLightness = 100 - clampedProgress * 100;
      root.style.setProperty("--home-scroll-bg", `hsl(0 0% ${backgroundLightness.toFixed(2)}%)`);

      const foregroundLightness = 12 + clampedProgress * 88;
      root.style.setProperty("--home-scroll-fg", `hsl(0 0% ${foregroundLightness.toFixed(2)}%)`);

      const shouldUseDarkNav = isFooterInView && backgroundLightness <= 24;
      root.classList.toggle("home-footer-nav-dark", shouldUseDarkNav);
    };

    const requestUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateBackgroundByFooterProgress);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      root.style.removeProperty("--home-scroll-bg");
      root.style.removeProperty("--home-scroll-fg");
      root.classList.remove("home-bg-morph");
      root.classList.remove("home-footer-nav-dark");
    };
  }, [theme]);

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
      setIsPageVisible(true);
      setIsOverlayBlurring(false);
      setIsOverlayVisible(false);
    };

    introTimeoutRef.current = window.setTimeout(() => {
      setIsOverlayBlurring(true);
      overlayBlurTimeoutRef.current = window.setTimeout(() => {
        setIsPageVisible(true);

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
    if (firstLineRevealTimeoutRef.current !== null) {
      window.clearTimeout(firstLineRevealTimeoutRef.current);
      firstLineRevealTimeoutRef.current = null;
    }

    if (isFirstEnglishLineTouched && !isSecondEnglishLineTouched) {
      setIsFirstLineKoreanVisible(false);
      firstLineRevealTimeoutRef.current = window.setTimeout(() => {
        setIsFirstLineKoreanVisible(true);
      }, FIRST_LINE_KOREAN_REVEAL_DELAY_MS);
      return;
    }

    setIsFirstLineKoreanVisible(false);
  }, [isFirstEnglishLineTouched, isSecondEnglishLineTouched]);

  useEffect(() => {
    if (secondLineRevealTimeoutRef.current !== null) {
      window.clearTimeout(secondLineRevealTimeoutRef.current);
      secondLineRevealTimeoutRef.current = null;
    }

    if (isSecondEnglishLineTouched) {
      setIsSecondLineKoreanVisible(false);
      secondLineRevealTimeoutRef.current = window.setTimeout(() => {
        setIsSecondLineKoreanVisible(true);
      }, SECOND_LINE_KOREAN_REVEAL_DELAY_MS);
      return;
    }

    setIsSecondLineKoreanVisible(false);
  }, [isSecondEnglishLineTouched]);

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
      if (firstLineRevealTimeoutRef.current !== null) {
        window.clearTimeout(firstLineRevealTimeoutRef.current);
      }
      if (secondLineRevealTimeoutRef.current !== null) {
        window.clearTimeout(secondLineRevealTimeoutRef.current);
      }
      if (koreanExitTimeoutRef.current !== null) {
        window.clearTimeout(koreanExitTimeoutRef.current);
      }
      if (englishReturnTimeoutRef.current !== null) {
        window.clearTimeout(englishReturnTimeoutRef.current);
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
      await navigator.clipboard.writeText("namu.d.park@gmail.com");
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

  const handleThemeToggle = () => {
    if (!theme) return;

    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    hasManualThemeOverrideRef.current = true;
    setStoredThemePreference(nextTheme);
    applyThemeWithTransition(nextTheme);
    setTheme(nextTheme);
  };

  const clearKoreanExitTimeout = () => {
    if (koreanExitTimeoutRef.current !== null) {
      window.clearTimeout(koreanExitTimeoutRef.current);
      koreanExitTimeoutRef.current = null;
    }
  };

  const clearEnglishReturnTimeout = () => {
    if (englishReturnTimeoutRef.current !== null) {
      window.clearTimeout(englishReturnTimeoutRef.current);
      englishReturnTimeoutRef.current = null;
    }
  };

  const startEnglishReturn = () => {
    englishLineExitIndexRef.current = null;
    const hiddenEnglishWordIndices = [...activeEnglishWordIndices];
    const nextEnglishWordReturnDelays = hiddenEnglishWordIndices
      .slice()
      .sort((first, second) => (activeEnglishWordHideOrders[first] ?? first) - (activeEnglishWordHideOrders[second] ?? second))
      .reduce<Record<number, number>>((delayMap, wordIndex, order) => {
        delayMap[wordIndex] = hiddenEnglishWordIndices.length <= 1
          ? 0
          : Math.round((order / (hiddenEnglishWordIndices.length - 1)) * ENGLISH_RETURN_MAX_DELAY_MS);
        return delayMap;
      }, {});

    setActiveEnglishWordReturnDelays((prev) =>
      areWordOrderMapsEqual(prev, nextEnglishWordReturnDelays) ? prev : nextEnglishWordReturnDelays,
    );
    setActiveEnglishWordIndices((prev) => (prev.length === 0 ? prev : []));
    setActiveEnglishWordHideOrders((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    clearEnglishReturnTimeout();
    setIsEnglishReturning(true);

    englishReturnTimeoutRef.current = window.setTimeout(() => {
      setIsEnglishReturning(false);
      setActiveEnglishWordReturnDelays((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      heroBackgroundExitActiveRef.current = false;
      englishReturnTimeoutRef.current = null;
    }, ENGLISH_RETURN_FADE_IN_MS + ENGLISH_RETURN_MAX_DELAY_MS);
  };

  const handleHeroPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;

    const firstLineWordCount = englishHeadlineWordsByLine[0]?.length ?? 0;
    const secondLineStartIndex = englishLineStartIndices[1] ?? firstLineWordCount;
    const activeLineIndex = getClosestLineIndex(englishLineRefs.current, event.clientY);
    const nextEnglishActiveEntriesRaw = getNearbyWordEntries(
      englishWordRefs.current,
      event.clientX,
      event.clientY,
      HERO_WORD_REVEAL_RADIUS,
    );
    const nearbyWordsOnActiveLine = activeLineIndex === 0
      ? nextEnglishActiveEntriesRaw.filter((entry) => entry.index < firstLineWordCount)
      : activeLineIndex === 1
        ? nextEnglishActiveEntriesRaw.filter((entry) => entry.index >= secondLineStartIndex)
        : nextEnglishActiveEntriesRaw;
    const isTouchingFirstLine = activeLineIndex === 0 && nearbyWordsOnActiveLine.length > 0;
    const isTouchingSecondLine = activeLineIndex === 1 && nearbyWordsOnActiveLine.length > 0;
    const hadLineInteraction =
      isFirstEnglishLineTouched || isSecondEnglishLineTouched || isFirstLineKoreanVisible || isSecondLineKoreanVisible;

    if (!isTouchingFirstLine && !isTouchingSecondLine && hadLineInteraction) {
      if (!heroBackgroundExitActiveRef.current) {
        handleHeroPointerLeave();
      }
      return;
    }

    heroBackgroundExitActiveRef.current = false;
    clearKoreanExitTimeout();
    clearEnglishReturnTimeout();
    setIsKoreanExiting((prev) => (prev ? false : prev));
    setKoreanExitWordIndices((prev) => (prev.length === 0 ? prev : []));
    setKoreanExitCharDelays((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    setIsEnglishReturning((prev) => (prev ? false : prev));
    setActiveEnglishWordReturnDelays((prev) => (Object.keys(prev).length === 0 ? prev : {}));

    const activeLineStartIndex =
      activeLineIndex === 0 ? 0 : activeLineIndex === 1 ? secondLineStartIndex : -1;
    const activeLineWordCount = englishHeadlineWordsByLine[activeLineIndex]?.length ?? 0;
    const activeLineWordIndices =
      activeLineStartIndex >= 0
        ? Array.from({ length: activeLineWordCount }, (_, index) => activeLineStartIndex + index)
        : [];
    const nextEnglishActiveIndices =
      isTouchingFirstLine || isTouchingSecondLine
        ? activeLineWordIndices
        : nearbyWordsOnActiveLine.map((entry) => entry.index).sort((a, b) => a - b);
    const nextEnglishWordHideOrders =
      isTouchingFirstLine || isTouchingSecondLine
        ? (() => {
            const isSameLineAsExisting = englishLineExitIndexRef.current === activeLineIndex;
            const hasCompleteDelaysForLine =
              Object.keys(activeEnglishWordHideOrders).length === activeLineWordIndices.length &&
              activeLineWordIndices.every((index) => activeEnglishWordHideOrders[index] !== undefined);

            if (isSameLineAsExisting && hasCompleteDelaysForLine) {
              return activeEnglishWordHideOrders;
            }

            englishLineExitIndexRef.current = activeLineIndex;
            return getRandomizedDelayMap(activeLineWordIndices, ENGLISH_LINE_EXIT_MAX_DELAY_MS);
          })()
        : nearbyWordsOnActiveLine
            .slice()
            .sort((first, second) => first.distanceSquared - second.distanceSquared)
            .reduce<Record<number, number>>((delayMap, entry, order) => {
              delayMap[entry.index] = order * ENGLISH_PROXIMITY_HIDE_STEP_MS;
              return delayMap;
            }, {});
    if (!isTouchingFirstLine && !isTouchingSecondLine) {
      englishLineExitIndexRef.current = null;
    }
    const nextEnglishWordHideDelays = nextEnglishWordHideOrders;
    const nextKoreanActiveIndices = isTouchingSecondLine || isTouchingFirstLine
      ? []
      : Array.from(new Set(nextEnglishActiveIndices.map((index) => englishToKoreanWordMap[index] ?? 0))).sort(
          (first, second) => first - second,
        );

    setActiveEnglishWordIndices((prev) =>
      areIndexListsEqual(prev, nextEnglishActiveIndices) ? prev : nextEnglishActiveIndices,
    );
    setActiveEnglishWordHideOrders((prev) =>
      areWordOrderMapsEqual(prev, nextEnglishWordHideDelays) ? prev : nextEnglishWordHideDelays,
    );
    setActiveKoreanWordIndices((prev) =>
      areIndexListsEqual(prev, nextKoreanActiveIndices) ? prev : nextKoreanActiveIndices,
    );
    setIsFirstEnglishLineTouched((prev) => (prev === isTouchingFirstLine ? prev : isTouchingFirstLine));
    setIsSecondEnglishLineTouched((prev) => (prev === isTouchingSecondLine ? prev : isTouchingSecondLine));
  };

  const handleHeroPointerLeave = () => {
    heroBackgroundExitActiveRef.current = true;
    clearKoreanExitTimeout();
    englishLineExitIndexRef.current = null;
    const hasVisibleKoreanLine =
      isFirstLineKoreanVisible || isSecondLineKoreanVisible || activeKoreanWordIndices.length > 0;
    const visibleKoreanWordIndexSet = new Set<number>(activeKoreanWordIndices);
    const firstLineWordCount = koreanHeadlineWordsByLine[0]?.length ?? 0;
    const secondLineStartIndex = koreanLineStartIndices[1] ?? firstLineWordCount;
    const secondLineWordCount = koreanHeadlineWordsByLine[1]?.length ?? 0;

    if (isFirstLineKoreanVisible) {
      Array.from({ length: firstLineWordCount }, (_, index) => index).forEach((index) => {
        visibleKoreanWordIndexSet.add(index);
      });
    }

    if (isSecondLineKoreanVisible) {
      Array.from({ length: secondLineWordCount }, (_, index) => secondLineStartIndex + index).forEach((index) => {
        visibleKoreanWordIndexSet.add(index);
      });
    }

    const visibleKoreanWordIndices = Array.from(visibleKoreanWordIndexSet).sort((a, b) => a - b);
    const visibleKoreanCharIndices = visibleKoreanWordIndices.flatMap((wordIndex) => {
      const charStartIndex = koreanWordCharStartIndices[wordIndex] ?? 0;
      const charCount = koreanWordCharCounts[wordIndex] ?? 0;
      return Array.from({ length: charCount }, (_, index) => charStartIndex + index);
    });
    const nextKoreanExitCharDelays = getRandomizedDelayMap(visibleKoreanCharIndices, KOREAN_EXIT_MAX_DELAY_MS);

    setActiveKoreanWordIndices((prev) => (prev.length === 0 ? prev : []));
    setIsFirstEnglishLineTouched((prev) => (prev ? false : prev));
    setIsSecondEnglishLineTouched((prev) => (prev ? false : prev));

    if (hasVisibleKoreanLine) {
      setIsKoreanExiting(true);
      setKoreanExitWordIndices((prev) => (areIndexListsEqual(prev, visibleKoreanWordIndices) ? prev : visibleKoreanWordIndices));
      setKoreanExitCharDelays((prev) =>
        areWordOrderMapsEqual(prev, nextKoreanExitCharDelays) ? prev : nextKoreanExitCharDelays,
      );
      koreanExitTimeoutRef.current = window.setTimeout(() => {
        startEnglishReturn();
        koreanExitTimeoutRef.current = null;
      }, KOREAN_EXIT_COMPLETE_MS);
      return;
    }

    setIsKoreanExiting((prev) => (prev ? false : prev));
    setKoreanExitWordIndices((prev) => (prev.length === 0 ? prev : []));
    setKoreanExitCharDelays((prev) => (Object.keys(prev).length === 0 ? prev : {}));
    startEnglishReturn();
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

  const renderEmailPreview = (target: EmailPreviewTarget) => (
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
          onClick={() => handleEmailCopy(target)}
          aria-label="Copy email address"
        >
          {emailCopied ? "Copied!" : "Copy the email address"}
        </button>
      </div>
    </div>
  );
  const activeEnglishWordIndexSet = useMemo(
    () => new Set(activeEnglishWordIndices),
    [activeEnglishWordIndices],
  );
  const activeKoreanWordIndexSet = useMemo(
    () => new Set(activeKoreanWordIndices),
    [activeKoreanWordIndices],
  );
  const koreanExitWordIndexSet = useMemo(
    () => new Set(koreanExitWordIndices),
    [koreanExitWordIndices],
  );

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
        <div className={styles.navRightGroup}>
          <span className={styles.navRight}>Brooklyn, New York {brooklynTime}</span>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={handleThemeToggle}
            disabled={!theme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={styles.themeToggleIcon} aria-hidden="true">
              {theme === "dark" ? "☼" : "☾"}
            </span>
            <span className={`${styles.themeToggleLabel} ${theme === "dark" ? "" : styles.themeToggleLabelDark}`}>
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </nav>

      <div className={pageLayerClassName}>
        <div className={styles.heroWrapper}>
          <div
            className={`${styles.heroInteractive} ${styles.entranceItem}`}
            style={entranceStyle(entranceDelays.hero, 650)}
            onPointerMove={handleHeroPointerMove}
            onPointerLeave={handleHeroPointerLeave}
          >
            <h1 className={`${styles.hero} ${styles.heroBase}`} aria-label={headlineText}>
              {englishHeadlineWordsByLine.map((lineWords, lineIndex) => (
                <span
                  key={`eng-line-${lineIndex}`}
                  ref={(element) => {
                    englishLineRefs.current[lineIndex] = element;
                  }}
                  className={styles.heroEnglishLine}
                >
                  {lineWords.map((word, wordIndex) => {
                    const globalWordIndex = englishLineStartIndices[lineIndex] + wordIndex;

                    return (
                      <span
                        key={`eng-word-${globalWordIndex}`}
                        ref={(element) => {
                          englishWordRefs.current[globalWordIndex] = element;
                        }}
                        className={`${styles.heroWord} ${isEnglishReturning ? styles.heroWordReturning : ""} ${
                          activeEnglishWordIndexSet.has(globalWordIndex)
                            ? styles.heroWordHidden
                            : ""
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
            <div
              className={`${styles.hero} ${styles.heroKorean} ${
                isFirstLineKoreanVisible ? styles.heroKoreanFirstLineVisible : ""
              } ${
                isSecondLineKoreanVisible ? styles.heroKoreanSecondLineVisible : ""
              }`}
              aria-hidden="true"
            >
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
                        } ${
                          activeKoreanWordIndexSet.has(globalWordIndex)
                            ? styles.heroKoreanWordVisible
                            : ""
                        }`}
                      >
                        {wordChars.map((char, charIndex) => {
                          const globalCharIndex = (koreanWordCharStartIndices[globalWordIndex] ?? 0) + charIndex;

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
                namu.d.park@gmail.com
              </button>
              {activeEmailPreviewTarget === "main" && renderEmailPreview("main")}
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

        <div className={styles.footer} aria-label="Footer">
          <div className={styles.footerContact}>
            <span className={styles.footerIcon} aria-hidden="true">
              📧
            </span>
            <span
              className={styles.emailLinkWrapper}
              onMouseEnter={() => handleEmailMouseEnter("footer")}
              onMouseLeave={handleEmailMouseLeave}
            >
              <button
                onClick={() => handleEmailCopy("footer")}
                onFocus={() => handleEmailMouseEnter("footer")}
                onBlur={handleEmailMouseLeave}
                className={`${styles.emailButton} ${styles.footerEmail}`}
                aria-label="Copy email address"
              >
                namu.d.park@gmail.com
              </button>
              {activeEmailPreviewTarget === "footer" && renderEmailPreview("footer")}
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
