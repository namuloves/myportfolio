"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./claimclam.module.css";
import { applyThemeWithTransition } from "../../lib/themeTransition";

type Theme = "light" | "dark";

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / documentHeight) * 100;
      
      setShowNavigation(scrollPercentage > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const systemTheme: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

    document.documentElement.setAttribute("data-theme", systemTheme);
    setTheme(systemTheme);
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
    applyThemeWithTransition(nextTheme);
    setTheme(nextTheme);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className={styles.container}>
      <nav className={styles.nav} aria-label="Site header">
        <span className={styles.navLeft}>Namu Park</span>
        <div className={styles.navRightGroup}>
          <span className={styles.navRight}>Brooklyn, New York {brooklynTime}</span>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={handleThemeToggle}
            disabled={!theme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={styles.themeToggleIcon} aria-hidden="true">
              {theme === "dark" ? "☀" : "☾"}
            </span>
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
          <Image src="/images/ClaimClam_Logo.png" alt="ClaimClam Logo" width={200} height={200} unoptimized />
            </div>
          </div>
          <h1 className={styles.title}>ClaimClam</h1>
          <div className={styles.metaInfo}>
            <p className={styles.role}>Role: Founding Product Designer</p>
            <p className={styles.timeline}>Timeline: 2022 - 2024</p>
          </div>

        </section>

        {/* Intro Text */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              I had been consulting as a freelance product designer for ClaimClam pre-seed. I designed prototypes and pitch decks reflecting founder&apos;s vision for the company, and learned how complex and confusing class-action settlements can be for users. When the founder offered a position to join the company as a Founding Product Designer, I joined the team to not only expand my design experience in B2B2C but also to help design a product where clear and thoughtful user experience can be a meaningful differentiator. 
            </p>
            <p>
              Class action is a unique niche dominated by law firms. I saw this as an opportunity to bring a fresh and modern perspective as a start-up. For example, we employed vibrant colors and design elements like dialogs and timelines to anticipate questions and clearly communicate the overall process.
            </p>
            <p>
              We used user-friendly fonts for better legibility and aimed to create a sense of excitement throughout the filing process and set clear expectations of payout amount & schedule.
            </p>
          </section>
        </div>

        {/* Video Section */}
        <div className={styles.phoneContainer}>
          <div className={styles.phone}>
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

        {/* Text Section 2 */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
            Filing for class action claims can be stressful for users with lots of legalese and confusing terminology. As a designer, I iterated on which elements of class action settlements would be most helpful for users when determining the relevance of a claim. My focus was on presenting complex information in a simple, easy-to-digest way.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/images/1.home_mockup.png" alt="Claims App Home Screen" width={300} height={600} unoptimized />
          </div>
          <div className={styles.phone}>
            <Image src="/images/2.claims details_mockup.png" alt="Claims App Apple iPhone 7 Audio Issues" width={300} height={600} unoptimized />
          </div>
        </div>

        {/* Text Section 3 */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              Throughout the process, I designed with these key questions in mind: how can I make this complicated filing process clear? How can we strike the right balance between approachability while establishing trust and credibility?
            </p>
            <p>
              Because there&apos;s a lot of scammers and spammers online, users are understandably skeptical about any service that claims to help them – especially one that involves recouping unclaimed money. Since we ask for sensitive personal information to file a claim, I tried to embed elements of trust and incentives to create a feeling that we&apos;re guiding users throughout the process.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots 2 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/images/3.payout-1-hq.png" alt="Claims App Payout History Accepted" width={300} height={600} unoptimized />
          </div>
          <div className={styles.phone}>
            <Image src="/images/4.payout-fail.png" alt="Claims App Error" width={300} height={600} unoptimized />
          </div>
        </div>

        {/* Two Phone Screenshots 3 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/images/8.connect account.png" alt="Claims App Connect Bank account" width={300} height={600} unoptimized />
          </div>
          <div className={styles.phone}>
            <Image src="/images/7.account_mockup.png" alt="Claim Needs Attention" width={300} height={600} unoptimized />
          </div>
        </div>

        {/* Closing Section */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>The Company served about 8 settlements and processed up to ~$2M in total claims value, serving more than ~22k users in America before they pivoted its business model to B2B in 2024. My design helped the Company process massive user payouts en mass, while while discovery section led to improved LTV and lowering CAC for users. </p> <p> The Company changed its name to Chariot Claim as of 2025.</p>
          </section>
        </div>
      </div>

      {/* Floating Navigation */}
      {showNavigation && (
        <>
          {/* Back to Home Arrow - Left Side */}
          <Link href="/" className={styles.backToHome}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className={styles.backToHomeLabel}>Back</span>
          </Link>

          {/* Back to Top Button - Right Side */}
        <button onClick={scrollToTop} className={styles.backToTop}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
        </>
      )}
    </main>
  );
}
