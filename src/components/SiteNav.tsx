import { type CSSProperties } from "react";
import Link from "next/link";
import styles from "../styles/home.module.css";
import { type Theme } from "../lib/themePreference";

interface SiteNavProps {
  className: string;
  theme: Theme | null;
  brooklynTime: string;
  onToggleTheme: () => void;
  entranceStyle: (ms: number, durationMs?: number) => CSSProperties;
}

/** Fixed site header: name/about links, Brooklyn clock, and theme toggle. */
export default function SiteNav({
  className,
  theme,
  brooklynTime,
  onToggleTheme,
  entranceStyle,
}: SiteNavProps) {
  return (
    <nav className={className} style={entranceStyle(20, 1200)} aria-label="Site header">
      <div className={styles.navLeftGroup}>
        <Link href="/" className={styles.navLeft}>
          Namu Park
        </Link>
        <Link href="/about" className={styles.navAbout}>
          About
        </Link>
      </div>
      <div className={styles.navRightGroup}>
        <span className={styles.navRight}>
          <span className={styles.navRightFull}>Brooklyn, New York</span>
          <span className={styles.navRightShort}>Brooklyn, NY</span>
          {" "}
          {brooklynTime}
        </span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={onToggleTheme}
          disabled={!theme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className={styles.themeToggleIcon} aria-hidden="true">
            {theme === "dark" ? "☼" : "☾"}
          </span>
          <span
            className={`${styles.themeToggleLabel} ${theme === "dark" ? "" : styles.themeToggleLabelDark}`}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>
      </div>
    </nav>
  );
}
