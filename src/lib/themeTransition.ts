type Theme = "light" | "dark";

const THEME_TRANSITION_DURATION_MS = 440;
const THEME_TRANSITION_CLEANUP_BUFFER_MS = 110;

let themeTransitionCleanupTimeout: number | null = null;

export const applyThemeWithTransition = (nextTheme: Theme) => {
  const root = document.documentElement;

  if (themeTransitionCleanupTimeout !== null) {
    window.clearTimeout(themeTransitionCleanupTimeout);
    themeTransitionCleanupTimeout = null;
  }

  root.classList.add("theme-transitioning", "theme-crossfade-active");

  window.requestAnimationFrame(() => {
    root.setAttribute("data-theme", nextTheme);
  });

  themeTransitionCleanupTimeout = window.setTimeout(() => {
    root.classList.remove("theme-transitioning", "theme-crossfade-active");
    themeTransitionCleanupTimeout = null;
  }, THEME_TRANSITION_DURATION_MS + THEME_TRANSITION_CLEANUP_BUFFER_MS);
};
