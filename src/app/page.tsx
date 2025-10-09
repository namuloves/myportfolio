"use client";

import { useEffect, useState } from "react";
import styles from '../styles/home.module.css'
import CaseStudyCard from '../components/CaseStudyCard'
import Image from "next/image";

const faviconSources = [
  "/namu_favicon.png",
  "/namu_favicon5.png",
  "/namu_favicon12.png",
];

export default function Home() {
  const [showPreview, setShowPreview] = useState(false);
  const [activeFavicon, setActiveFavicon] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFavicon((prev) => (prev + 1) % faviconSources.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);
  return (
    <main className={styles.container}>
      <nav className={styles.nav}>Navigation</nav>
      <div className={styles.content}>
      <div className={styles.heroWrapper}>
        <h1 className={styles.hero}>
          Namu Park is a product designer based in Brooklyn, New York.
        </h1>
        <p className={styles.constructionNote}>
          Website update is in progress. In the meantime, check out my work at{' '}
          <span className={styles.contraLinkWrapper}>
            <a
              href="https://contra.com/namupark/work"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setShowPreview(true)}
              onMouseLeave={() => setShowPreview(false)}
            >
              Contra
            </a>
            {showPreview && (
              <div className={styles.contraPreview}>
                <div className={styles.contraPreviewContent}>
                  <p>View my portfolio on Contra →</p>
                </div>
              </div>
            )}
          </span>
          {' '}and email <button onClick={() => navigator.clipboard.writeText('namu.d.park@gmail.com')} className={styles.emailButton}>namu.d.park@gmail.com</button>
        </p>
      </div>
      {/* <section className={styles.bio}>
  <p>
    I'm a product designer with founder experience. 
  </p>

  <p>
    I started a company in fashion tech, designed interfaces as a founding product
    designer at a legal-tech start-up, and am currently working with early stage start-ups as a freelance product designer.
  </p>

  <p>
I love making beautiful things that work.
  </p>

  <p>
    Say hi if you'd like at <strong>@namupaak</strong>.<br />
    Thank you!<br />
    – Namu
  </p>
</section> */}

      <section className={styles.caseGrid}>
        <CaseStudyCard title="ClaimClam" href="/claimclam" image="/images/namupark_claimclam.png" hoverLabel="Read case study" />
        <CaseStudyCard title="The Sloth" video="/video/slothvideo2.mp4" hoverLabel="Case study coming soon" />
        <CaseStudyCard title="Heart in the Cloud" image="/images/HITC_namupark_cover1.png" subtitle="Logo Design" disableHoverDim />
        <CaseStudyCard title="AI Deal Home" href="/termblock" image="/images/A.NamuPark_AIDealHome.png" disableHoverDim />
      </section>
      <footer className={styles.footer} aria-hidden="true">
        <div className={styles.faviconStack}>
          {faviconSources.map((src, index) => (
            <div
              key={src}
              className={`${styles.faviconFrame} ${
                activeFavicon === index ? styles.faviconFrameActive : ""
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={index === 0}
                sizes="(min-width: 768px) 96px, 72px"
                style={{ objectFit: "contain" }}
              />
            </div>
          ))}
        </div>
      </footer>
    </div>
    </main>
  )
}
