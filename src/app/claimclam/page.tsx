import Link from "next/link";
import Image from "next/image";
import styles from "./claimclam.module.css";

export default function ClaimClam() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.homeLink}>Back</Link>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.logoWrapper}>
            <div className={styles.logo}>
              <Image src="/images/ClaimClam_Logo.png" alt="ClaimClam Logo" width={80} height={80} />
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

        {/* Phone Screenshot 1 */}
        <div className={styles.phoneContainer}>
          <div className={styles.phone}>
            <video
              src="/images/claimclam_mobile.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
            />
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
            <Image src="/images/1.home_mockup.png" alt="Hi Tina Screen" width={600} height={1200} />
          </div>
          <div className={styles.phone}>
            <Image src="/images/2.claims%20details_mockup.png" alt="Apple iPhone 7 Audio Issues" width={600} height={1200} />
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
            <Image src="/images/3.payout-1-hq.png" alt="Payout History Accepted" width={600} height={1200} />
          </div>
          <div className={styles.phone}>
            <Image src="/images/5.%20claims%20history_mockup.png" alt="Dole Fruit Lawsuit" width={600} height={1200} />
          </div>
        </div>

        {/* Two Phone Screenshots 3 */}
        <div className={styles.twoPhones}>
          <div className={styles.phone}>
            <Image src="/images/8.connect%20account.png" alt="My Claims" width={600} height={1200} />
          </div>
          <div className={styles.phone}>
            <Image src="/images/4.payout-fail.png" alt="Claim Needs Attention" width={600} height={1200} />
          </div>
        </div>
      </div>
    </main>
  );
}
