import styles from "./claimclam.module.css";

export default function ClaimClam() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <a href="/" className={styles.homeLink}>Home</a>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
              <img src="/images/ClaimClam_Logo.png" alt="ClaimClam Logo" />
            </div>
          </div>
          <h1 className={styles.title}>ClaimClam</h1>
          <p className={styles.role}>Role: Founding Product Designer</p>
          <p className={styles.timeline}>Timeline: 2022 - 2024</p>

          <div className={styles.buttonGroup}>
            <button className={styles.buttonSecondary}>Figma</button>
            <button className={styles.buttonPrimary}>View now</button>
          </div>
        </section>

        {/* Intro Text */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              I had been consulting as a designer for ClaimClam pre-seed. I designed prototypes and pitch decks that reflected founder's vision for the company where I learned more about the complexities of class action settlements, and how convoluted it was for users. I joined the team full time as a Founding Product Designer. I was excited to not only expand my design practice in B2B2C but also to use their mission to capture the value that is rightfully owed to claimants.
            </p>
            <p>
              Class action is a unique niche dominated by law firms and traditional operations. I saw this as an opportunity to bring a fresh and modern perspective as a start-up. We employed vibrant colors and design elements like dialogs and timelines to anticipate questions and clearly communicate the overall process.
            </p>
            <p>
              We used user-friendly fonts for better legibility and aimed to create a sense of excitement throughout the filing process and provide clear timeline to set expectations of payout.
            </p>
          </section>
        </div>

        {/* Phone Screenshot 1 */}
        <div className={styles.phoneContainer}>
          <div className={styles.phone}>
            <img src="/images/claimclam-screen1.png" alt="Claims App Payout History Screen" />
          </div>
        </div>

        {/* Text Section 2 */}
        <section className={styles.textSection}>
          <p>
            Filing for class action claims can be stressful for users with lots of repetitive and marketing terminology. As a designer, I focused on which elements of class action settlements were most important to highlight for users in order to file and check status of claim. My focus was on presenting complex information in a simple, easy-to-use way.
          </p>
        </section>

        {/* Two Phone Screenshots */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <img src="/images/1.home_mockup.png" alt="Claims App Home Screen" />
          </div>
          <div className={styles.phone}>
            <img src="/images/2.claims details_mockup.png" alt="Claims App Apple iPhone 7 Audio Issues" />
          </div>
        </div>

        {/* Text Section 3 */}
        <div className={styles.textWrapper}>
          <section className={styles.textSection}>
            <p>
              Throughout the process, I designed with these key questions in mind: how can I make this complicated filing process clear. How can we strike the right balance between approachability while establishing trust and credibility?
            </p>
            <p>
              Because there's a lot of legalisms and jargonisms online, users are understandably skeptical about any service that claims to help them - especially one that involves requesting validation of identity. It was important to build elements of credibility. We chose to include elements of trust and incentives to create a feeling that we're guiding users throughout the process.
            </p>
          </section>
        </div>

        {/* Two Phone Screenshots 2 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <img src="/images/3.payout-1-hq.png" alt="Claims App Payout History Accepted" />
          </div>
          <div className={styles.phone}>
            <img src="/images/4.payout-fail.png" alt="Claims App Error" />
          </div>
        </div>

        {/* Two Phone Screenshots 3 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <img src="/images/8.connect account.png" alt="Claims App Connect Bank account" />
          </div>
          <div className={styles.phone}>
            <img src="/images/7.account_mockup.png" alt="Claim Needs Attention" />
          </div>
        </div>
      </div>
    </main>
  );
}
