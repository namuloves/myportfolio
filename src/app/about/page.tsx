"use client";

import mainNavStyles from "../../styles/home.module.css";
import SiteNav from "../../components/SiteNav";
import SiteFooter from "../../components/SiteFooter";
import AboutLinkPreview from "../../components/AboutLinkPreview";
import { useTheme } from "../../hooks/useTheme";
import { useBrooklynClock } from "../../hooks/useBrooklynClock";

export default function About() {
  const { theme, toggleTheme } = useTheme();
  const brooklynTime = useBrooklynClock();

  return (
    <main className={mainNavStyles.container}>
      <SiteNav
        className={mainNavStyles.nav}
        theme={theme}
        brooklynTime={brooklynTime}
        onToggleTheme={toggleTheme}
      />

      <section className={mainNavStyles.about} aria-label="About">
        <h1 className={mainNavStyles.aboutHeadline}>
          I design interfaces for early-stage founders, distilling product vision into clarity.
        </h1>

        <div className={mainNavStyles.aboutBody}>
          <p>
            I&rsquo;m currently working as a fractional design partner with founders and entrepreneurs across consumer, B2B, fintech, AI, and healthcare.
          </p>
          <p>
            Previously Founding Product Designer at <AboutLinkPreview href="/claimclam" images={["/images/ClaimClam_NamuPark_cover.png", "/images/1. Explore.png", "/images/3. Filed.png"]}>ClaimClam</AboutLinkPreview> (rebranded to <em>Chariot Claims</em>), where I shaped the visual language and designed the consumer app from scratch &mdash; processing over $2M in payouts.
          </p>
          <p>
            I started out as a founder building my own company, <AboutLinkPreview href="/thesloth" images={["/sloth/sloth_Chrome extension_preview_ssense.png", "/sloth/Product page_101624portfolio.png", "/sloth/The Sloth board view_v1_OCT 2024.png"]}>The Sloth</AboutLinkPreview>, where I fell in love with design and its power to set a product apart and shape a delightful user experience.
          </p>
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
            <li><a href="https://www.asilica.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Asilica</a></li>
            <li><a href="https://joindomos.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Domos</a></li>
            <li><a href="https://excellence-ai.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Excellence</a></li>
            <li><a href="https://www.linkedin.com/company/fastrak-ai/about/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Fastrak AI</a></li>
            <li><a href="https://fertilitybuddyapp.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Fertility Buddy</a></li>
            <li><a href="https://www.unsojo.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Gena AI</a></li>
            <li><a href="https://www.hanoverpark.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Hanover Park</a></li>
            <li><a href="https://www.heartinthe.cloud/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Heart in the Cloud</a></li>
            <li><a href="https://hinthint.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Hint Hint</a></li>
            <li><a href="https://www.jumpspeak.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Jumpspeak</a></li>
            <li><a href="https://www.metabologic.ai/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Metabologic AI</a></li>
            <li><a href="https://www.revivle.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Revivle</a></li>
            <li><a href="https://www.santehq.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Sante</a></li>
            <li><a href="https://www.sitewire.co/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Sitewire</a></li>
            <li><a href="https://www.suits-sandals.com/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Suits &amp; Sandals</a></li>
            <li><a href="https://in.theater/" target="_blank" rel="noopener noreferrer" className={mainNavStyles.aboutLink}>Theater</a></li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
