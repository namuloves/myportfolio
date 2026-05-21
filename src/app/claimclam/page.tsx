"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import cs from "../../styles/casestudy.module.css";
import local from "./claimclam.module.css";
import mainNavStyles from "../../styles/home.module.css";
import SiteFooter from "../../components/SiteFooter";
import ClaimClamPageNav from "./ClaimClamPageNav";
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

export default function ClaimClam() {
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
        <div className={mainNavStyles.navLeftGroup}>
          <Link href="/" className={mainNavStyles.navLeft}>
            Namu Park
          </Link>
          <Link href="/about" className={mainNavStyles.navAbout}>
            About
          </Link>
        </div>
        <div className={mainNavStyles.navRightGroup}>
          <span className={mainNavStyles.navRight}>
            <span className={mainNavStyles.navRightFull}>Brooklyn, New York</span>
            <span className={mainNavStyles.navRightShort}>Brooklyn, NY</span>
            {" "}{brooklynTime}
          </span>
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

      <ClaimClamPageNav />

      <div className={`${cs.content} ${local.contentShift}`}>
        {/* Hero Section */}
        <section id="overview" className={`${cs.hero} ${local.hero}`}>
          <div className={cs.logoWrapper}>
            <div className={`${cs.logo} ${local.logo}`}>
          <Image src="/images/ClaimClam_Logo.png" alt="ClaimClam Logo" width={200} height={200} unoptimized />
            </div>
          </div>
          <h3 className={cs.title}>ClaimClam</h3>
          <div className={cs.projectMeta}>
            <div className={cs.projectMetaCol}>
              <span className={cs.projectMetaLabel}>Role &amp; Timeline</span>
              <p className={cs.projectMetaValue}>
                Founding Product
                <br />Designer
                <br />2023 &ndash; 2024
              </p>
            </div>
            <div className={cs.projectMetaCol}>
              <span className={cs.projectMetaLabel}>Team</span>
              <p className={cs.projectMetaValue}>
                1 CEO
                <br />3 Engineers
                <br />1 Designer (me!)
              </p>
            </div>
            <div className={cs.projectMetaCol}>
              <span className={cs.projectMetaLabel}>Skills</span>
              <p className={cs.projectMetaValue}>
                Product Design
                <br />User Research
                <br />Prototyping
              </p>
            </div>
          </div>
          <div className={cs.navPills} style={{ display: 'none' }}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/thesloth" className={cs.navPill}>View next</Link>
          </div>
        </section>

        {/* Intro Text */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h1 style={{ fontSize: '40px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
              Bringing class action claims to everyone
            </h1>
            <p>
              Before joining the team as a Founding Product Designer in 2023, I had been consulting as a freelance product designer for ClaimClam pre-seed. I designed prototypes and pitch decks reflecting founder&apos;s vision for the company, and learned how complex and confusing class-action settlements can be for users.
            </p>
            <p>
              In 2024, the top 10 U.S. class action settlements totaled ~$42 billion, yet FTC research shows that only 4&ndash;9% of eligible consumers typically filed a claim.
            </p>
            <p>
              I joined the team to not only expand my design experience in B2B2C but also to help design a product where clear and thoughtful user experience can be a meaningful differentiator for the product.
            </p>
            <div className={cs.phoneContainer}>
              <div className={cs.phone}>
                <video
                  src="/video/claimclam_mobile.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={true}
                  preload="auto"
                  style={{ width: "100%", height: "auto", display: "block" }}
                >
                  <p>Your browser does not support video playback.</p>
                </video>
              </div>
            </div>
          </section>
        </div>

        {/* Text Section 2 */}
        <div id="trust" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h2 style={{ fontSize: '32px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>In its early days, ClaimClam faced skepticism from both users and regulators.</h2>
            <p>
            In the early days, ClaimClam faced real pushback from users and regulators who questioned its credibility. So I centered my design process around one signal above all else: trust. There weren&rsquo;t many tech startups serving users in the class action settlement space; most people only encountered settlements through paper mail or emails buried in their spam folder. I saw this as an opportunity to position ClaimClam as a more cohesive, put-together alternative.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots */}
        <div className={cs.twoPhones}>
          <div className={cs.phone}>
            <Image src="/images/1. Explore.png" alt="Claims App Home Screen" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
          <div className={cs.phone}>
            <Image src="/images/2. Claim detailsv2.png" alt="Claims App Apple iPhone 7 Audio Issues" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
        </div>

        <div id="filing-flow" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h2 style={{ fontSize: '32px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Making class action filing feel credible and approachable</h2>
            <p>
              The window between submitting a claim and seeing money in your account can stretch weeks or months. As of today, after you file, you have no idea what happens. Did they accept? When am I getting paid? Instead of leaving users to refresh and wonder, we treated the wait as a design surface.
            </p>
            <p>
              Two decisions came out of that. First, a bold cover for each state &mdash; easy to recognize at a glance, and a real moment to celebrate when a claim is approved.
            </p>
            <p>
              Second, a step-by-step timeline that sets expectations and quietly educates users on how the process actually works. The dual benefit: less anxiety while waiting, and a reason to come back to the app between updates.
            </p>
          </section>
        </div>

        {/* Three Phone Screenshots */}
        <div className={cs.threePhones}>
          <div className={cs.phone}>
            <Image src="/images/3. Filed.png" alt="Claims App Payout History Accepted" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
          <div className={cs.phone}>
            <Image src="/images/3. Accepted.png" alt="Claims App Accepted" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
          <div className={cs.phone}>
            <Image src="/images/3. Error.png" alt="Claims App Error" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
        </div>

        <div id="payouts" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h2 style={{ fontSize: '32px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Designing to reduce risk, not innovate.</h2>
            <p>In payments, sending money is harder than receiving it. Mass-payout infrastructure (ACH, PayPal mass pay, KYC checks) is fragile &mdash; a single typo in an account number means returned funds, fees, and broken trust.</p>
            <p>While the Company was working through payment infrastructure setup, I focused on what design could control: one question per screen to reduce errors, re-entry validation for the account number, and an explicit confirmation step before submit.</p>
            <p>The goal wasn&rsquo;t to innovate &mdash; it was to make sure every user got paid the first time.</p>
          </section>
        </div>

        {/* Three Phone Screenshots 2 */}
        <div className={cs.threePhones}>
          <div className={cs.phone}>
            <Image src="/images/4. View balance.png" alt="Claims App View Balance" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
          <div className={cs.phone}>
            <Image src="/images/5. Connect account.png" alt="Claims App Connect Bank account" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
          <div className={cs.phone}>
            <Image src="/images/6. my account.png" alt="Claims App My Account" width={300} height={600} unoptimized style={{ border: '1px solid #E8E8E9', borderRadius: '24px' }} />
          </div>
        </div>

        <div id="design-system" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h2 style={{ fontSize: '32px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Design System</h2>
            <p>
              Class action is a unique niche dominated by law firms. I saw this as an opportunity to bring a fresh and modern perspective as a start-up. For example, we employed vibrant colors and design elements like dialogs and timelines to anticipate questions and clearly communicate the overall process.
            </p>
            <p>
              We used user-friendly fonts for better legibility and aimed to create a sense of excitement throughout the filing process and set clear expectations of payout amount & schedule.
            </p>
          </section>
        </div>

        <div className={cs.desktopBottomImageSection}>
          <div className={cs.desktopBottomImageFrame}>
            <Image
              src="/images/9.claimclam_components.png"
              alt=""
              width={1365}
              height={768}
              unoptimized
              className={cs.desktopBottomImage}
              onError={(event) => {
                const parent = event.currentTarget.parentElement?.parentElement;
                if (parent) parent.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Closing Section */}
        <div id="outcome" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <h2 style={{ fontSize: '32px', color: 'var(--foreground)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>Impact &amp; Reflection</h2>
            <p>The Company served about 8 settlements and processed up to ~$2M in total claims value, serving more than ~22k users in America before they pivoted its business model to B2B in 2024. My design helped the Company process massive user payouts en mass, while while discovery section led to improved LTV and lowering CAC for users. </p> <p> The Company changed its name to Chariot Claim as of 2025.</p>
          </section>
        </div>

        {/* Bottom Nav Pills */}
        <div className={`${cs.hero} ${local.hero}`} style={{ display: 'none' }}>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/thesloth" className={cs.navPill}>View next</Link>
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

          <Link href="/thesloth" className={cs.nextCase}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className={cs.nextCaseLabel}>Next</span>
          </Link>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
