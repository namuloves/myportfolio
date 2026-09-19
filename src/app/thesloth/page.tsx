"use client";

import Link from "next/link";
import Image from "next/image";
import cs from "../../styles/casestudy.module.css";
import local from "./thesloth.module.css";
import SiteFooter from "../../components/SiteFooter";
import CaseStudyNav from "../../components/CaseStudyNav";
import CaseStudyFloatingNav from "../../components/CaseStudyFloatingNav";
import TheSlothLogo from "../../components/TheSlothLogo";
import StickyPageNav from "./StickyPageNav";

export default function TheSloth() {
  return (
    <main className={cs.container}>
      <CaseStudyNav />

      <div className={local.layout}>
        <aside className={local.layoutAside}>
          <StickyPageNav />
        </aside>

        <div className={local.layoutContent}>
        {/* Hero Section */}
        <section className={`${cs.hero} ${local.hero}`}>
          <div className={cs.logoWrapper}>
            <div className={`${cs.logo} ${local.logo}`}>
              <TheSlothLogo className={local.logoImage} />
            </div>
          </div>
          <h3 className={cs.title}>The Sloth</h3>
          <div className={cs.metaInfo}>
            <p className={cs.role}>Role: Founder, Designer</p>
            <p className={cs.timeline}>Years: 2021-2024</p>
          </div>
          <div className={cs.navPills} style={{ display: 'none' }}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </section>

        {/* Intro Text */}
        <div id="context" className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              In 2019, I started The Sloth to rethink how we buy and sell secondhand clothing online. The internet was built for businesses to sell – and for people to buy. While shopping takes one-click, selling peer-to-peer was a hassle. Even with popular resale platforms like Poshmark, tools that helped individuals to sell remained limited. Users still handled most of the work &ndash; setting up shops, creating listings, and managing shipping.
            </p>
            <p>
              Resale is a $26 billion market growing at 23% yoy, and according to our survey of online shoppers, 58% of shoppers gave up creating a resale listing because they found the process too complicated. Of all the respondents who initiated creating a listing, the completion time was about 16 minutes and completion rate was below 50%. The number one reason for abandoning the process was inconvenience.
            </p>
            <p>
              To understand the problem firsthand, I ran an experiment: I offered to resell clothing for women in New York in exchange for candid feedback about their experience. Over a few months, I resold 100+ items for 13 women &mdash; averaging ~$106 per seller &mdash; and diverted 120 pounds of textile waste from landfills. More importantly, I learned exactly where the process broke down and where technology could help.
            </p>
            <p>
              I built a Chrome Extension that functioned like Pinterest but specifically for clothing, capturing key product data like photos, descriptions, measurements, and materials. Within a month, I grew the user base by unlocking the niche group of professional stylists and aggregated over ~$1M in GMV and facilitated 100+ in resale transactions. A few weeks after launch, I raised from angels like Sahil Lavingia (Gumroad) and Responsibly VC.
            </p>
          </section>
        </div>

        {/* Resale & Shopping Automation Tool */}
        <div id="desktop" className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image
              src="/sloth/sloth_resale_collage.png"
              alt="The Sloth resale collage"
              width={1600}
              height={900}
              unoptimized
            />
          </div>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3 id="desktop-chrome">Chrome Extension: The Shopping &amp; Resale Layer</h3>
            </section>
          </div>
          <div className={`${cs.fullWidthImage} ${local.extensionVideoFrame}`}>
            <div className={local.extensionVideoCrop}>
              <video
                className={local.extensionVideo}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="The Sloth Chrome Extension demo video"
              >
                <source src="/sloth/TheSloth_chrome extension_04.06.2026.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <p>
                The Chrome extension adds a layer of context to any product you&rsquo;re viewing online. <strong>Brand signals:</strong> see community ratings and the item&rsquo;s average resale value at a glance. <strong>Saved items:</strong> capture photos, descriptions, prices, sizes, and materials with one click. <strong>Matching listings:</strong> if the same item is already being resold, you&rsquo;ll see who&rsquo;s selling it and for how much. Together, these give shoppers the social and economic context they usually have to hunt for.
              </p>
            </section>
          </div>
        </div>

        {/* Product Screenshots */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Product page_101624portfolio.png" alt="The Sloth product detail page" width={1200} height={800} unoptimized />
          </div>
        </div>

        {/* Listing Flow Screenshots */}
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Create a listing_v1_102224portfolio.png" alt="Listing flow - create a listing" width={1200} height={800} unoptimized />
          </div>
        </div>

        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Creating a listing_v2_102224_previewportfolio.png" alt="Listing flow - ready to publish" width={1200} height={800} unoptimized />
          </div>
        </div>

        {/* Marketplace Product Page */}
        <div id="desktop-p2p" className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/Product page_101624portfolio_shop.png" alt="The Sloth marketplace product detail page" width={1200} height={700} unoptimized />
          </div>
        </div>
        <div className={cs.screenshotSection}>
          <div className={cs.fullWidthImage}>
            <Image src="/sloth/The Sloth board view_v1_OCT 2024.png" alt="The Sloth product discovery grid" width={1200} height={800} unoptimized />
          </div>
        </div>


        {/* Anchor for the Mobile parent nav item */}
        <div id="mobile" aria-hidden="true" />

        {/* Onboarding & Email Integration */}
        <div id="mobile-onboarding" className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Onboarding &amp; Email Integration</h3>
              <p>
                A guided first-time experience that introduces new users to resale and sets them up to discover, save, and list items in minutes.
              </p>
            </section>
          </div>
          <div className={cs.phoneContainer}>
            <div className={local.onboardingPhone}>
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label="The Sloth onboarding demo video"
              >
                <source src="/sloth/sloth_onboarding_demo_april 7 2026.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>

        {/* Resale Listing Process */}
        <div id="mobile-listing" className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Resale listing process</h3>
              <p>
                By pulling in details about the item from the PDP, a high quality resale listing can be created in minutes.
              </p>
            </section>
          </div>
          <div className={cs.phoneMockups}>
            <div className={cs.phone}>
              <Image
                src="/sloth/5. list popup_mockups.png"
                alt="Resale listing popup mockups"
                width={1311}
                height={2652}
                unoptimized
              />
            </div>
            <div className={cs.phone}>
              <Image
                src="/sloth/7. list price_mockup.png"
                alt="Resale listing price mockup"
                width={1311}
                height={2652}
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Mobile Product Detail */}
        <div className={cs.screenshotSection}>
          <div className={cs.phoneMockups}>
            <div className={cs.phone}>
              <Image src="/sloth/3. product_listing.png" alt="Mobile product detail page" width={300} height={600} unoptimized />
            </div>
            <div className={cs.phone}>
              <Image src="/sloth/4.listing - public.png" alt="Mobile listing with secondhand prices" width={300} height={600} unoptimized />
            </div>
          </div>
        </div>

        {/* Marketing */}
        <div id="marketing" className={cs.screenshotSection}>
          <div className={cs.textWrapper}>
            <section className={cs.textSection}>
              <h3>Marketing</h3>
            </section>
          </div>
          <div className={local.marketingTagWrapper}>
            <Image
              src="/sloth/sloth-tag-flip-animation-v2.gif"
              alt="The Sloth hangtag flip animation"
              width={1200}
              height={1200}
              unoptimized
            />
          </div>
          <div className={`${local.marketingPackaging} ${local.marketingTape}`}>
            <Image
              src="/sloth/thesloth_packaging.png"
              alt="The Sloth packaging tape design"
              width={1920}
              height={407}
              unoptimized
            />
          </div>
          <div className={local.marketingPackaging}>
            <Image
              src="/sloth/thesloth_packaging2.png"
              alt="The Sloth packaging tape applied to a shipping package"
              width={738}
              height={545}
              unoptimized
            />
          </div>
        </div>

        {/* Closing Reflection */}
        <div className={cs.textWrapper}>
          <section className={cs.textSection}>
            <p>
              I built a lot &ndash; a newsletter, a community, a Shopify plug-in, a Chrome extension, an Instagram account, a closet app using no-code tools, and a mobile app. I had a hypothesis and used a variety of approach to test it. I learned that resale is a challenging market, and my hypothesis required a more fundamental approach on data.
            </p>
            <p>
              Building a business from scratch was no easy feat &ndash; I learned what it means to fail, persevere, face rejections, pivot, and still find a courage and focus to build again. I realized that I am passionate about building tools that make it easy for people to be kind and responsible. I wanted be a small part of the force that would contribute to making internet more equitable and sustainable, and decided to deepen my practice in design.
            </p>
          </section>
        </div>

        {/* Bottom Nav Pills */}
        <div className={cs.hero} style={{ padding: 0, display: 'none' }}>
          <div className={cs.navPills}>
            <Link href="/" className={cs.navPill}>Home</Link>
            <Link href="/claimclam" className={cs.navPill}>View next</Link>
          </div>
        </div>

        </div>
      </div>

      <CaseStudyFloatingNav nextHref="/claimclam" />

      <SiteFooter />
    </main>
  );
}
