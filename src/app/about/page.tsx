"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import mainNavStyles from "../../styles/home.module.css";
import { applyThemeWithTransition } from "../../lib/themeTransition";
import {
  type Theme,
  getSystemTheme,
  getStoredThemePreference,
  setStoredThemePreference,
} from "../../lib/themePreference";

const getBrooklynTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(new Date());

export default function About() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [brooklynTime, setBrooklynTime] = useState(getBrooklynTime);
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
    setBrooklynTime(getBrooklynTime());
    const interval = window.setInterval(() => {
      setBrooklynTime(getBrooklynTime());
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const handleThemeToggle = () => {
    if (!theme) return;
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    hasManualThemeOverrideRef.current = true;
    setStoredThemePreference(nextTheme);
    applyThemeWithTransition(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <main className={mainNavStyles.container}>
      <nav className={mainNavStyles.nav} aria-label="Site header">
        <div className={mainNavStyles.navLeftGroup}>
          <Link href="/" className={mainNavStyles.navLeft}>
            Namu Park
          </Link>
          <Link href="/about" className={mainNavStyles.navAbout}>
            About
          </Link>
        </div>
        <div className={mainNavStyles.navRightGroup}>
          <span className={mainNavStyles.navRight}>Brooklyn, New York {brooklynTime}</span>
          <button
            type="button"
            className={mainNavStyles.themeToggle}
            onClick={handleThemeToggle}
            disabled={!theme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={mainNavStyles.themeToggleIcon} aria-hidden="true">
              {theme === "dark" ? "☼" : "☾"}
            </span>
            <span
              className={`${mainNavStyles.themeToggleLabel} ${theme === "dark" ? "" : mainNavStyles.themeToggleLabelDark}`}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </nav>

      <section className={mainNavStyles.about} aria-label="About">
        <h1 className={mainNavStyles.aboutHeadline}>
          I design interfaces for early-stage founders, distilling product vision into clarity.
        </h1>

        <div className={mainNavStyles.aboutBody}>
          <p>
            I&rsquo;m currently working as a fractional design partner with founders and entrepreneurs across consumer, B2B, fintech, AI, and healthcare.
          </p>
          <p>
            Previously Founding Product Designer at Chariot Claims (formerly Claim Clam), where I shaped the visual language and designed the consumer app from scratch &mdash; processing over $2M in payouts.
          </p>
          <p>
            I started out as a founder building my own company, The Sloth, where I fell in love with design and its power to set a product apart and shape a delightful user experience.
          </p>
        </div>

        <div className={mainNavStyles.aboutBody}>
          <p>
            I believe that good design is kind design. A thoughtful interface can make someone&rsquo;s day easier, and the right tool can shift how they move through the world. I aim to design software that makes it easy for people to be kind &mdash; to themselves, to those around them, and ultimately, to the planet.
          </p>
          <p>
            I was born in America and grew up in South Korea as a child. I lived in the Midwest before moving to New York for college. I analyzed distressed credit in my past life before jumping to tech. I speak Korean, English, Japanese, and can read and write Chinese characters.
          </p>
        </div>

        <div className={mainNavStyles.aboutClients}>
          <h2 className={mainNavStyles.aboutClientsHeading}>Clients</h2>
          <ul className={mainNavStyles.aboutClientsList}>
            <li>Asilica</li>
            <li>Cerv AI</li>
            <li>Domos</li>
            <li>Excellence</li>
            <li>Gena AI</li>
            <li>Hanover Park</li>
            <li>Heart in the Cloud</li>
            <li>Hint Hint</li>
            <li>Metabologic AI</li>
            <li>Revivle</li>
            <li>Sante</li>
            <li>Theater</li>
            <li>Suits &amp; Sandals</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
