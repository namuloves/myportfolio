"use client";

import Link from "next/link";
import Image from "next/image";
import cs from "../../styles/casestudy.module.css";
import local from "./aidealhome.module.css";
import CaseStudyNav from "../../components/CaseStudyNav";
import CaseStudyFloatingNav from "../../components/CaseStudyFloatingNav";

export default function AIDealHome() {
  return (
    <main className={cs.container}>
      <CaseStudyNav />

      <div className={cs.content}>
        {/* Hero Section */}
        <section className={cs.hero}>
          <div className={cs.logoWrapper}>
            <div className={`${cs.logo} ${local.logo}`}>
              <span className={local.logoText}>AI</span>
            </div>
          </div>
          <h1 className={cs.title}>AI Deal Home</h1>
          <div className={cs.metaInfo}>
            <p className={cs.role}>Role: Design Partner</p>
            <p className={cs.timeline}>Timeline: June – August 2025</p>
          </div>
          <div className={local.badges}>
            <span className={local.badge}>Fintech</span>
            <span className={local.badge}>Stealth 2025</span>
            <span className={local.badge}>$15T Asset Finance</span>
          </div>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </section>

        {/* Intro */}
        <div id="challenge" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              Over the summer of 2025, I partnered with a stealth-mode founding team as their sole Design Partner. My brief was to translate their vision into <strong>three hero screens and a complete workflow</strong> covering two stakeholder perspectives &mdash; the artifacts they would use to validate the product with users and unlock their friends-and-family round.
            </p>
          </section>
        </div>

        {/* Hero Visual */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image
              src="/aidealhome/dashboard.webp"
              alt="AI Deal Home dashboard — Good morning, Jason — credit analyst overview"
              width={2880}
              height={2048}
              unoptimized
            />
          </div>
        </div>

        {/* The Company */}
        <div id="problem" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>The company</p>
            <h3>An AI-native platform for the $15 trillion asset finance industry</h3>
            <p>
              The client is an AI-native portfolio management platform revolutionizing the $15 trillion Asset Finance industry. Traditionally operated through a labor-intensive web of spreadsheets and manual processes, asset-backed financing has been ripe for disruption.
            </p>
            <p>
              Their thesis: replace the operational bottleneck with a modern, scalable system that automates document verification, credit agreement management, and loan servicing &mdash; dramatically improving efficiency, transparency, and decision-making for institutional lenders and originators alike.
            </p>
          </section>
        </div>

        {/* Workshops */}
        <div id="solution" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Process</p>
            <h3>Workshops first, pixels second</h3>
            <p>
              The founding team came from finance &mdash; not product. Working with executives who were unfamiliar with product development, I led the early workshops to clarify our MVP goals and articulate the key user problem we wanted to solve. From there, we mapped the initial user flow to align on the screens we would design.
            </p>
            <div className={local.pullquote}>
              What would a software-native experience for credit analysts actually look like?
            </div>
          </section>
        </div>

        {/* 6-step process table */}
        <div className={cs.screenshotSection}>
          <div className={local.processTableWrap}>
            <table className={local.processTable}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Process</th>
                  <th>User activity</th>
                  <th>Primary user</th>
                  <th>Secondary user</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Deal is onboarded with a loan package</td>
                  <td>Empty dashboard with Deal Overview &amp; drag-and-drop document intake for Data Room</td>
                  <td>Deal teams</td>
                  <td className={local.stake}>Bankers · Legal counsel</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Credit agreement uploaded and reviewed</td>
                  <td>Document parser &amp; terms verification summary</td>
                  <td>Deal teams</td>
                  <td className={local.stake}>—</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Verification of third-party docs</td>
                  <td>Underlying loan or collateral documents (mortgages, auto-loans)</td>
                  <td>Admin agents</td>
                  <td className={local.stake}>Collateral auditors</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Terms negotiated / updated</td>
                  <td>Version control + redlining + approval workflow</td>
                  <td>Deal teams</td>
                  <td className={local.stake}>—</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Lender commits funds</td>
                  <td>Funding tracker with notification &amp; audit trail</td>
                  <td>Capital markets ops</td>
                  <td className={local.stake}>Fund admin analysts</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Monthly reporting &amp; servicing</td>
                  <td>Timeline view &amp; automatic quarterly updates</td>
                  <td>Capital markets ops</td>
                  <td className={local.stake}>Investors / trustees</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sitemap */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Sitemap</p>
            <h3>Aligning on the surface area</h3>
            <p>
              We created a sitemap to (1) align on what the key screens would include and how they would function, and (2) test and validate the overall flow before committing to high-fidelity design.
            </p>
          </section>
        </div>

        <div className={cs.screenshotSection}>
          <div className={local.wideArtifact}>
            <Image
              src="/aidealhome/sitemap.png"
              alt="Product sitemap branching from Home into Charts & Graphics, Deal Home, and Contract Tracking"
              width={2000}
              height={1041}
              unoptimized
            />
          </div>
        </div>

        {/* Wireframes */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Wireframes</p>
            <h3>Three hero screens, sketched first</h3>
            <p>
              Before any visual polish, I wireframed the three hero screens &mdash; Home, Deal Home, and Contract Viewer &mdash; to lock in information hierarchy and the panel-based layout that would carry across the product.
            </p>
          </section>
        </div>

        <div className={cs.screenshotSection}>
          <div className={local.desktopTwoUp}>
            <div>
              <Image
                src="/aidealhome/wireframe-home.png"
                alt="Wireframes for Home and Deal Home screens"
                width={2000}
                height={1041}
                unoptimized
              />
            </div>
            <div>
              <Image
                src="/aidealhome/wireframe-contract.png"
                alt="Wireframe for Contract Viewer screen"
                width={2000}
                height={1041}
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Final mockups intro */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Final mockups</p>
            <h3>Designing for two stakeholder perspectives</h3>
            <p>
              The final hi-fi screens covered the credit analyst&rsquo;s daily orbit &mdash; a home dashboard for situational awareness, a deal page for the live company they&rsquo;re financing, and a contract viewer for the work that consumes most of their day. Each was designed against both stakeholder perspectives mapped in the workflow above.
            </p>
          </section>
        </div>

        {/* Deal detail + chart components two-up */}
        <div className={cs.screenshotSection}>
          <div className={local.desktopTwoUp}>
            <div>
              <Image
                src="/aidealhome/deal-detail.webp"
                alt="Deal detail view — Accordion Inc. on tablet"
                width={2400}
                height={1600}
                unoptimized
              />
            </div>
            <div>
              <Image
                src="/aidealhome/chart-components.webp"
                alt="Chart components — Credit Facility, Annual Financials, Shareholders"
                width={2512}
                height={4512}
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Design decisions */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Design decisions</p>
            <h3>The deal page as analyst home base</h3>
            <p>
              <strong>Latest and most relevant PDFs surfaced per deal.</strong> Analysts spend their day chasing documents through inbox attachments. Pulling the most recent versions to the deal page &mdash; labelled by status &mdash; replaces that scavenger hunt with a single source of truth.
            </p>
            <p>
              <strong>Debt obligations ordered by payment due date.</strong> The Credit Facility chart isn&rsquo;t sorted alphabetically; it&rsquo;s sorted by what the borrower owes next. Small, but it reframes the chart from a static disclosure into an actionable schedule.
            </p>
            <p>
              <strong>Recent activity routes straight to the document.</strong> Comments on the home page link directly into the contract viewer, so collaboration between bankers stays anchored to the underlying agreement rather than fragmented across tools.
            </p>
          </section>
        </div>

        {/* Contract viewer two-up */}
        <div className={cs.screenshotSection}>
          <div className={local.desktopTwoUp}>
            <div>
              <Image
                src="/aidealhome/contract-viewer.webp"
                alt="Term Loan Agreement contract viewer with AI panel"
                width={2880}
                height={2048}
                unoptimized
              />
            </div>
            <div>
              <Image
                src="/aidealhome/contract-viewer-detail.webp"
                alt="Contract viewer detail — AI-assisted comment thread"
                width={3808}
                height={3016}
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* AI panel reflection */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              For the contract viewer, I borrowed the comment-tracking UI from book and PDF reader apps &mdash; a familiar pattern that lets analysts review comments without learning a new mental model. The same comment thread is mirrored on the home page&rsquo;s recent-activity feed, so a banker can jump from a notification straight to the line of contract being discussed.
            </p>
            <p>
              The AI panel sits on the right rail, not at the center: it surfaces summaries, term extraction, and answers to natural-language questions, but the document stays the source of truth. AI should be a faster pencil, not a louder voice.
            </p>
          </section>
        </div>

        {/* Outcome */}
        <div id="outcome" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p className={local.sectionLabel}>Outcome</p>
            <h3>Next steps</h3>
            <p>
              As the sole designer on the project, I helped the founders align on the MVP and the initial product direction. They used the work to set realistic engineering timelines for implementation, gather early feedback from analysts and managing directors, and secure initial funding for their friends-and-family round.
            </p>
            <p>
              The project is ongoing. We&rsquo;re iterating on every section based on user feedback, with special attention to how AI capabilities are embedded while remaining compliant.
            </p>
          </section>
        </div>

        {/* NDA disclaimer */}
        <div className={cs.textWrapper}>
          <div className={local.ndaNote}>
            This case study will be updated after revisions for NDA requirements, as the founders wish to remain in stealth until launch.
          </div>
        </div>

        {/* Bottom Nav Pills */}
        <div className={cs.hero} style={{ padding: 0 }}>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </div>
      </div>

      <CaseStudyFloatingNav />
    </main>
  );
}
