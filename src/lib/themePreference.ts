export type Theme = "light" | "dark";

const THEME_PREFERENCE_KEY = "theme-preference";

export const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const getStoredThemePreference = (): Theme | null => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    // localStorage can be unavailable in private mode or restricted contexts.
  }
  return null;
};

export const setStoredThemePreference = (theme: Theme) => {
  try {
    window.localStorage.setItem(THEME_PREFERENCE_KEY, theme);
  } catch {
    // Ignore persistence failures and keep in-memory theme behavior.
  }
};
