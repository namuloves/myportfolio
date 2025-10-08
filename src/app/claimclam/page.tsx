"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./claimclam.module.css";

export default function ClaimClam() {
  const [showNavigation, setShowNavigation] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollTop / documentHeight) * 100;
      
      setShowNavigation(scrollPercentage > 25);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.homeLink}>Home</Link>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
          <Image src="/claimclam/claimclam-logo.png" alt="ClaimClam Logo" width={200} height={200} />
            </div>
          </div>
          <h1 className={styles.title}>ClaimClam</h1>
          <p className={styles.role}>Role: Founding Product Designer</p>
          <p className={styles.timeline}>Timeline: 2022 - 2024</p>

        </section>

        {/* Intro Text */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              I had been consulting as a designer for ClaimClam pre-seed. I designed prototypes and pitch decks that reflected founder&apos;s vision for the company where I learned more about the complexities of class action settlements, and how convoluted it was for users. I joined the team full time as a Founding Product Designer. I was excited to not only expand my design practice in B2B2C but also to use their mission to capture the value that is rightfully owed to claimants.
            </p>
            <p>
              Class action is a unique niche dominated by law firms and traditional operations. I saw this as an opportunity to bring a fresh and modern perspective as a start-up. We employed vibrant colors and design elements like dialogs and timelines to anticipate questions and clearly communicate the overall process.
            </p>
            <p>
              We used user-friendly fonts for better legibility and aimed to create a sense of excitement throughout the filing process and provide clear timeline to set expectations of payout.
            </p>
          </section>
        </div>

        {/* Video Section */}
        <div className={styles.phoneContainer}>
          <div className={styles.phone}>
            <video
              src="/claimclam/claimclam_mobile.mp4"
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
              Filing for class action claims can be stressful for users with lots of repetitive and marketing terminology. As a designer, I focused on which elements of class action settlements were most important to highlight for users in order to file and check status of claim. My focus was on presenting complex information in a simple, easy-to-use way.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/claimclam/home-mockup.png" alt="Claims App Home Screen" width={300} height={600} />
          </div>
          <div className={styles.phone}>
            <Image src="/claimclam/claims-details-mockup.png" alt="Claims App Apple iPhone 7 Audio Issues" width={300} height={600} />
          </div>
        </div>

        {/* Text Section 3 */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              Throughout the process, I designed with these key questions in mind: how can I make this complicated filing process clear. How can we strike the right balance between approachability while establishing trust and credibility?
            </p>
            <p>
              Because there&apos;s a lot of legalisms and jargonisms online, users are understandably skeptical about any service that claims to help them - especially one that involves requesting validation of identity. It was important to build elements of credibility. We chose to include elements of trust and incentives to create a feeling that we&apos;re guiding users throughout the process.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots 2 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/claimclam/payout-history.png" alt="Claims App Payout History Accepted" width={300} height={600} />
          </div>
          <div className={styles.phone}>
            <Image src="/claimclam/payout-fail.png" alt="Claims App Error" width={300} height={600} />
          </div>
        </div>

        {/* Two Phone Screenshots 3 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/claimclam/connect-account.png" alt="Claims App Connect Bank account" width={300} height={600} />
          </div>
          <div className={styles.phone}>
            <Image src="/claimclam/account-mockup.png" alt="Claim Needs Attention" width={300} height={600} />
          </div>
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
