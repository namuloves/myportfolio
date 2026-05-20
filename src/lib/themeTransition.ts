type Theme = "light" | "dark";

const THEME_TRANSITION_DURATION_MS = 600;
const THEME_TRANSITION_CLEANUP_BUFFER_MS = 110;

let themeTransitionCleanupTimeout: number | null = null;

export const applyThemeWithTransition = (nextTheme: Theme) => {
  const root = document.documentElement;

  if (themeTransitionCleanupTimeout !== null) {
    window.clearTimeout(themeTransitionCleanupTimeout);
    themeTransitionCleanupTimeout = null;
  }

  root.style.setProperty("--theme-transition-duration", `${THEME_TRANSITION_DURATION_MS}ms`);
  root.classList.add("theme-transitioning", "theme-fx-blur");

  window.requestAnimationFrame(() => {
    root.setAttribute("data-theme", nextTheme);
  });

  themeTransitionCleanupTimeout = window.setTimeout(() => {
    root.classList.remove("theme-transitioning", "theme-fx-blur");
    themeTransitionCleanupTimeout = null;
  }, THEME_TRANSITION_DURATION_MS + THEME_TRANSITION_CLEANUP_BUFFER_MS);
};
