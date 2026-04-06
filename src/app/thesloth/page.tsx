"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import cs from "../../styles/casestudy.module.css";
import local from "./thesloth.module.css";
import mainNavStyles from "../../styles/home.module.css";
import TheSlothLogo from "../../components/TheSlothLogo";
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

export default function TheSloth() {
  const [showNavigation, setShowNavigation] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [brooklynTime, setBrooklynTime] = useState(getBrooklynTime);
  const hasManualThemeOverrideRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const root = document.documentElement;
      const { body } = document;
      const scrollTop = Math.max(window.scrollY, root.scrollTop, body.scrollTop);
      setShowNavigation(scrollTop > 24);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  const scrollToTop = () => {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    const scrollingElement = document.scrollingElement as HTMLElement | null;

    window.scrollTo({ top: 0, behavior });
    scrollingElement?.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTo({ top: 0, behavior });
    document.body.scrollTo({ top: 0, behavior });
  };

  return (
    <main className={cs.container}>
      <nav className={`${mainNavStyles.nav} ${cs.fixedNav}`} aria-label="Site header">
        <Link href="/" className={mainNavStyles.navLeft}>
          Namu Park
        </Link>
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

      <div className={cs.content}>
        {/* Hero Section */}
        <section className={cs.hero}>
          <div className={cs.logoWrapper}>
            <div className={`${cs.logo} ${local.logo}`}>
              <TheSlothLogo className={local.logoImage} />
            </div>
          </div>
          <h1 className={cs.title}>The Sloth</h1>
          <div className={cs.metaInfo}>
            <p className={cs.role}>Role: Founder, Designer</p>
            <p className={cs.timeline}>Years: 2019-2023</p>
          </div>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </section>

        {/* Intro Text */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              In 2019, I started The Sloth to rethink how we buy and sell secondhand clothing online. The internet was built for businesses to sell – and for people to buy. While shopping takes one-click, selling peer-to-peer was a hassle. Even with popular resale platforms like Poshmark, tools that helped individuals to sell remained limited. Users still handled most of the work &ndash; setting up shops, creating listings, and managing shipping.
            </p>
            <p>
              Resale is a $26 billion market growing at 23% yoy, and according to our survey of online shoppers, 58% of shoppers gave up creating a resale listing because they found the process too complicated. Of all the respondents who initiated creating a listing, the completion time was about 16 minutes and completion rate was below 50%. The number one reason for abandoning the process was inconvenience.
            </p>
          </section>
        </div>

        {/* Photo Collage - hidden until correct photo is found */}
        {/* <div className={local.photoCollage}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/sloth preview twitter-cover.png" alt="" width={1200} height={600} unoptimized />
          </div>
        </div> */}

        {/* More Text */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              I ended up reselling over 100 articles of clothing for 13 women in New York where I made on average ~$106 for them, and averted 120 pounds of textile waste from going to the landfill. I identified the most challenging process of reselling, found opportunities for automation, and learned that shoppers value clear product information, original photos, and detailed descriptions.
            </p>
            <p>
              I built a Chrome Extension that functioned like Pinterest but specifically for clothing, capturing key product data like photos, descriptions, measurements, and materials. Within a month, I grew the user base by unlocking the niche group of professional stylists and aggregated over ~$1M in GMV and facilitated 100+ in resale transactions. A few weeks after launch, I raised from angels like Sahil Lavingia (Gumroad) and Shrug Capital.
            </p>
          </section>
        </div>

        {/* Resale & Shopping Automation Tool */}
        <div className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Resale &amp; Shopping Automation Tool</h3>
            </section>
          </div>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/sloth_Chrome extension_preview_ssense.png" alt="The Sloth Chrome Extension on SSENSE showing resale data overlay" width={1200} height={700} unoptimized />
          </div>
        </div>

        {/* Product Screenshots */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/The Sloth board view_v1_OCT 2024.png" alt="The Sloth product discovery grid" width={1200} height={800} unoptimized />
          </div>
        </div>

        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Product page_101624portfolio.png" alt="The Sloth product detail page" width={1200} height={800} unoptimized />
          </div>
        </div>

        {/* Listing Flow Screenshots */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Create a listing_v1_102224portfolio.png" alt="Listing flow - create a listing" width={1200} height={800} unoptimized />
          </div>
        </div>

        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Creating a listing_v2_102224_previewportfolio.png" alt="Listing flow - ready to publish" width={1200} height={800} unoptimized />
          </div>
        </div>

        {/* Marketplace Product Page */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Product page_101624portfolio_shop.png" alt="The Sloth marketplace product detail page" width={1200} height={700} unoptimized />
          </div>
        </div>

        {/* Discovery for Resale P2P Marketplace */}
        <div className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Discovery for Resale P2P Marketplace</h3>
              <p>
                Navigating discovery feeds on secondhand resale marketplaces can be frustrating. Poor photos and unclear product details make it hard for shoppers seeking quality items. To address this, I streamlined the feed design, removing the usual promotional clutter found on e-commerce platforms. I envisioned a space where fashion-forward consumers can connect over what truly inspires them: fashion and design.
              </p>
            </section>
          </div>
          <div className={cs.phoneMockups}>
            <div className={cs.phone}>
              <Image src="/sloth/1.home_mockup.png" alt="Mobile home feed" width={300} height={600} unoptimized />
            </div>
            <div className={cs.phone}>
              <Image src="/sloth/2. feed_mockup.png" alt="Mobile social feed with listings" width={300} height={600} unoptimized />
            </div>
          </div>
        </div>

        {/* Resale Listing Process */}
        <div className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Resale listing process</h3>
              <p>
                By pulling in details about the item from the PDP, a high quality resale listing can be created in minutes.
              </p>
            </section>
          </div>
          <div className={cs.phoneMockups}>
            <div className={cs.phone}>
              <Image
                src="/sloth/5. list popup_mockups.png"
                alt="Resale listing popup mockups"
                width={1311}
                height={2652}
                unoptimized
              />
            </div>
            <div className={cs.phone}>
              <Image
                src="/sloth/7. list price_mockup.png"
                alt="Resale listing price mockup"
                width={1311}
                height={2652}
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Mobile Product Detail */}
        <div className={cs.screenshotSection}>
          <div className={cs.phoneMockups}>
            <div className={cs.phone}>
              <Image src="/sloth/3. product_listing.png" alt="Mobile product detail page" width={300} height={600} unoptimized />
            </div>
            <div className={cs.phone}>
              <Image src="/sloth/4.listing - public.png" alt="Mobile listing with secondhand prices" width={300} height={600} unoptimized />
            </div>
          </div>
        </div>

        {/* Closing Reflection */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              I built a lot &ndash; a newsletter, a community, a Shopify plug-in, a Chrome extension, an Instagram account, a closet app using no-code tools, and a mobile app. I had a hypothesis and used a variety of approach to test it. I learned that resale is a challenging market, and my hypothesis required a more fundamental approach on data.
            </p>
            <p>
              Building a business from scratch was no easy feat &ndash; I learned what it means to fail, persevere, face rejections, pivot, and still find a courage and focus to build again. I realized that I am passionate about building tools that make it easy for people to be kind and responsible. I wanted be a small part of the force that would contribute to making internet more equitable and sustainable, and decided to deepen my practice in design.
            </p>
          </section>
        </div>

        {/* Bottom Nav Pills */}
        <div className={cs.hero} style={{ padding: 0 }}>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </div>

      </div>

      {/* Floating Navigation */}
      {showNavigation && (
        <div className={cs.floatingNavigation}>
          <Link href="/" className={cs.backToHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className={cs.backToHomeLabel}>Back</span>
          </Link>

          <button onClick={scrollToTop} className={cs.backToTop}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span className={cs.backToTopLabel}>Top</span>
          </button>
        </div>
      )}
    </main>
  );
}
