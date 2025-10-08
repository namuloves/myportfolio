"use client";

import { useState } from "react";
import styles from '../styles/home.module.css'
import CaseStudyCard from '../components/CaseStudyCard'

export default function Home() {
  const [showPreview, setShowPreview] = useState(false);
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
        <CaseStudyCard title="ClaimClam" href="/claimclam" image="/images/namupark-claimclam.png" />
        <CaseStudyCard title="The Sloth" video="/video/slothvideo2.mp4" comingSoon={true} />
      </section>
    </div>
    </main>
  )
}
