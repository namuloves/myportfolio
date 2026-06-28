// Static headline data, timing constants, and pure helpers shared by the
// headline morph hook (state machine) and the HeadlineMorph component (render).

export const englishHeadlineLines = [
  "I help early-stage founders turn complex product",
  "ideas into clear, trustworthy digital products.",
];
export const headlineText = englishHeadlineLines.join(" ");
export const englishHeadlineWordsByLine = englishHeadlineLines.map((line) => line.split(" "));
export const englishLineStartIndices = englishHeadlineWordsByLine.reduce<number[]>(
  (acc, _lineWords, index) => {
    if (index === 0) {
      acc.push(0);
      return acc;
    }
    acc.push(acc[index - 1] + englishHeadlineWordsByLine[index - 1].length);
    return acc;
  },
  [],
);
export const englishHeadlineWordCount = englishHeadlineWordsByLine.flat().length;

export const koreanHeadlineLines = ["안녕하세요!", "제 웹사이트에 오신것을 환영합니다."];
export const koreanHeadlineWordsByLine = koreanHeadlineLines.map((line) => line.split(" "));
export const koreanHeadlineCharsByLine = koreanHeadlineWordsByLine.map((lineWords) =>
  lineWords.map((word) => Array.from(word)),
);
export const koreanLineStartIndices = koreanHeadlineWordsByLine.reduce<number[]>(
  (acc, _lineWords, index) => {
    if (index === 0) {
      acc.push(0);
      return acc;
    }
    acc.push(acc[index - 1] + koreanHeadlineWordsByLine[index - 1].length);
    return acc;
  },
  [],
);
export const koreanHeadlineWordCount = koreanHeadlineWordsByLine.flat().length;
const koreanHeadlineCharsFlatByWord = koreanHeadlineCharsByLine.flat();
const koreanWordCharCounts = koreanHeadlineCharsFlatByWord.map((chars) => chars.length);
export const koreanWordCharStartIndices = koreanWordCharCounts.reduce<number[]>(
  (acc, _charCount, index) => {
    if (index === 0) {
      acc.push(0);
      return acc;
    }
    acc.push(acc[index - 1] + koreanWordCharCounts[index - 1]);
    return acc;
  },
  [],
);

export const allEnglishWordIndices = Array.from({ length: englishHeadlineWordCount }, (_, i) => i);
export const allKoreanWordIndices = Array.from({ length: koreanHeadlineWordCount }, (_, i) => i);
const koreanHeadlineCharCount = koreanWordCharCounts.reduce((sum, count) => sum + count, 0);
export const allKoreanCharIndices = Array.from({ length: koreanHeadlineCharCount }, (_, i) => i);

export const ENGLISH_LINE_EXIT_MAX_DELAY_MS = 360;
const ENGLISH_RETURN_STAGGER_MS = 80;
const ENGLISH_MAX_LINE_WORD_COUNT = Math.max(
  ...englishHeadlineWordsByLine.map((lineWords) => lineWords.length),
);
export const ENGLISH_RETURN_MAX_DELAY_MS =
  Math.max(0, ENGLISH_MAX_LINE_WORD_COUNT - 1) * ENGLISH_RETURN_STAGGER_MS;
const KOREAN_EXIT_FADE_OUT_MS = 600;
export const KOREAN_EXIT_CHAR_FADE_MS = 180;
export const KOREAN_EXIT_MAX_DELAY_MS = Math.max(0, KOREAN_EXIT_FADE_OUT_MS - KOREAN_EXIT_CHAR_FADE_MS);
const KOREAN_EXIT_TO_ENGLISH_BUFFER_MS = 80;
export const KOREAN_EXIT_COMPLETE_MS = KOREAN_EXIT_FADE_OUT_MS + KOREAN_EXIT_TO_ENGLISH_BUFFER_MS;
export const ENGLISH_RETURN_FADE_IN_MS = 640;

export const areWordOrderMapsEqual = (
  first: Record<number, number>,
  second: Record<number, number>,
) => {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);
  if (firstKeys.length !== secondKeys.length) return false;
  return firstKeys.every((key) => first[Number(key)] === second[Number(key)]);
};

export const getRandomizedDelayMap = (indices: number[], maxDelay: number) => {
  if (indices.length === 0) return {};

  const shuffledIndices = [...indices];
  for (let index = shuffledIndices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledIndices[index], shuffledIndices[swapIndex]] = [
      shuffledIndices[swapIndex],
      shuffledIndices[index],
    ];
  }

  if (shuffledIndices.length === 1) {
    return { [shuffledIndices[0]]: 0 };
  }

  return shuffledIndices.reduce<Record<number, number>>((delayMap, charIndex, order) => {
    delayMap[charIndex] = Math.round((order / (shuffledIndices.length - 1)) * maxDelay);
    return delayMap;
  }, {});
};
