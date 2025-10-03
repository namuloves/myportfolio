import Image from "next/image";
import styles from '../styles/home.module.css'
import CaseStudyCard from '../components/CaseStudyCard'

export default function Home() {
  return (
    <main className={styles.container}>
      <nav className={styles.nav}>Navigation</nav>
      <div className={styles.content}>
      <div className={styles.heroWrapper}>
        <h1 className={styles.hero}>
          Namu Park is a product designer based in Brooklyn, New York.
        </h1>
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
        <CaseStudyCard title="ClaimClam" href="/claimclam" image="/images/namupark_claimclam.png" />
        <CaseStudyCard title="The Sloth" video="/video/slothvideo2.mp4" />
      </section>
    </div>
    </main>
  )
}
