import { useEffect, useMemo, useRef, useState } from "react";
import {
  allEnglishWordIndices,
  allKoreanCharIndices,
  allKoreanWordIndices,
  areWordOrderMapsEqual,
  ENGLISH_LINE_EXIT_MAX_DELAY_MS,
  ENGLISH_RETURN_FADE_IN_MS,
  ENGLISH_RETURN_MAX_DELAY_MS,
  getRandomizedDelayMap,
  KOREAN_EXIT_COMPLETE_MS,
  KOREAN_EXIT_MAX_DELAY_MS,
} from "../lib/headlineMorph";

/**
 * State machine for the English→Korean headline morph. Hovering the headline
 * sets `isHeadlineMorphed` true (via the returned setter): all English words
 * hide in a randomized cascade and all Korean words reveal. Un-hovering runs
 * the Korean per-character exit, then staggers the English back in.
 *
 * Returns the membership sets and delay maps the render needs, keyed by the
 * same global word/char indices used in the headline data.
 */
export function useHeadlineMorph() {
  const [isHeadlineMorphed, setIsHeadlineMorphed] = useState(false);
  const [activeEnglishWordIndices, setActiveEnglishWordIndices] = useState<number[]>([]);
  const [activeEnglishWordHideOrders, setActiveEnglishWordHideOrders] = useState<
    Record<number, number>
  >({});
  const [activeEnglishWordReturnDelays, setActiveEnglishWordReturnDelays] = useState<
    Record<number, number>
  >({});
  const [activeKoreanWordIndices, setActiveKoreanWordIndices] = useState<number[]>([]);
  const [koreanExitWordIndices, setKoreanExitWordIndices] = useState<number[]>([]);
  const [koreanExitCharDelays, setKoreanExitCharDelays] = useState<Record<number, number>>({});
  const [isKoreanExiting, setIsKoreanExiting] = useState(false);
  const [isEnglishReturning, setIsEnglishReturning] = useState(false);

  const koreanExitTimeoutRef = useRef<number | null>(null);
  const englishReturnTimeoutRef = useRef<number | null>(null);

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
    const hiddenEnglishWordIndices = [...activeEnglishWordIndices];
    const nextEnglishWordReturnDelays = hiddenEnglishWordIndices
      .slice()
      .sort(
        (first, second) =>
          (activeEnglishWordHideOrders[first] ?? first) -
          (activeEnglishWordHideOrders[second] ?? second),
      )
      .reduce<Record<number, number>>((delayMap, wordIndex, order) => {
        delayMap[wordIndex] =
          hiddenEnglishWordIndices.length <= 1
            ? 0
            : Math.round(
                (order / (hiddenEnglishWordIndices.length - 1)) * ENGLISH_RETURN_MAX_DELAY_MS,
              );
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
      englishReturnTimeoutRef.current = null;
    }, ENGLISH_RETURN_FADE_IN_MS + ENGLISH_RETURN_MAX_DELAY_MS);
  };

  useEffect(() => {
    if (isHeadlineMorphed) {
      clearKoreanExitTimeout();
      clearEnglishReturnTimeout();
      setIsKoreanExiting(false);
      setKoreanExitWordIndices([]);
      setKoreanExitCharDelays({});
      setIsEnglishReturning(false);
      setActiveEnglishWordReturnDelays({});
      setActiveEnglishWordHideOrders(
        getRandomizedDelayMap(allEnglishWordIndices, ENGLISH_LINE_EXIT_MAX_DELAY_MS),
      );
      setActiveEnglishWordIndices(allEnglishWordIndices);
      setActiveKoreanWordIndices(allKoreanWordIndices);
      return;
    }

    // Un-hover: only animate the exit if Korean is currently shown.
    if (activeKoreanWordIndices.length === 0 && !isKoreanExiting) {
      return;
    }

    clearKoreanExitTimeout();
    setActiveKoreanWordIndices([]);
    setIsKoreanExiting(true);
    setKoreanExitWordIndices(allKoreanWordIndices);
    setKoreanExitCharDelays(getRandomizedDelayMap(allKoreanCharIndices, KOREAN_EXIT_MAX_DELAY_MS));
    koreanExitTimeoutRef.current = window.setTimeout(() => {
      startEnglishReturn();
      koreanExitTimeoutRef.current = null;
    }, KOREAN_EXIT_COMPLETE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHeadlineMorphed]);

  useEffect(() => {
    return () => {
      if (koreanExitTimeoutRef.current !== null) {
        window.clearTimeout(koreanExitTimeoutRef.current);
      }
      if (englishReturnTimeoutRef.current !== null) {
        window.clearTimeout(englishReturnTimeoutRef.current);
      }
    };
  }, []);

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

  return {
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
  };
}
