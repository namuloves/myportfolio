import { useEffect, useRef, useState } from "react";
import { applyThemeWithTransition } from "../lib/themeTransition";
import {
  type Theme,
  getSystemTheme,
  getStoredThemePreference,
  setStoredThemePreference,
} from "../lib/themePreference";

/**
 * Manages the light/dark theme. Initializes from stored preference (or system),
 * keeps in sync with the OS preference until the user manually toggles, and
 * exposes a toggle that animates the transition and persists the choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const hasManualOverrideRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = getStoredThemePreference();
    const initialTheme = storedTheme ?? getSystemTheme();

    hasManualOverrideRef.current = storedTheme !== null;

    root.setAttribute("data-theme", initialTheme);
    setTheme(initialTheme);

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (hasManualOverrideRef.current) return;

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

  const toggleTheme = () => {
    if (!theme) return;

    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    hasManualOverrideRef.current = true;
    setStoredThemePreference(nextTheme);
    applyThemeWithTransition(nextTheme);
    setTheme(nextTheme);
  };

  return { theme, toggleTheme };
}
