import { type CSSProperties } from "react";
import CaseStudyCard from "./CaseStudyCard";
import styles from "../styles/home.module.css";

interface CaseStudyGridProps {
  entranceStyle: (ms: number, durationMs?: number) => CSSProperties;
  cardDelays: number[];
}

/** The home grid of case-study cards, each entering on its own staggered delay. */
export default function CaseStudyGrid({ entranceStyle, cardDelays }: CaseStudyGridProps) {
  return (
    <section className={styles.caseGrid}>
      <div className={styles.entranceItem} style={entranceStyle(cardDelays[0])}>
        <CaseStudyCard
          title="ClaimClam"
          href="/claimclam"
          image="/images/ClaimClam_NamuPark_cover.png"
          hoverLabel="Read case study"
        />
      </div>
      <div className={styles.entranceItem} style={entranceStyle(cardDelays[1])}>
        <CaseStudyCard
          title="The Sloth"
          video="/video/slothvideo2.mp4"
          href="/thesloth"
          hoverLabel="Read case study"
        />
      </div>
      <div className={styles.entranceItem} style={entranceStyle(cardDelays[2])}>
        <CaseStudyCard
          title="Heart in the Cloud"
          image="/images/HITC_namupark_cover1.png"
          subtitle="Logo Design"
          disableHoverDim
        />
      </div>
      <div className={styles.entranceItem} style={entranceStyle(cardDelays[3])}>
        <CaseStudyCard title="Gena AI" video="/video/NamuPark_Gena.mp4" disableHoverDim />
      </div>
      <div className={styles.entranceItem} style={entranceStyle(cardDelays[4])}>
        <CaseStudyCard
          title="AI Deal Home"
          image="/images/A.NamuPark_AIDealHome.png"
          disableHoverDim
        />
      </div>
    </section>
  );
}
