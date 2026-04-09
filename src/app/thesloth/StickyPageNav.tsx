"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./stickyPageNav.module.css";

type NavItem = {
  id: string;
  label: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "context",
    label: "Context",
  },
  {
    id: "desktop",
    label: "Desktop",
    children: [
      { id: "desktop-chrome", label: "Chrome Extension" },
      { id: "desktop-p2p", label: "P2P marketplace" },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    children: [
      { id: "mobile-onboarding", label: "Onboarding" },
      { id: "mobile-listing", label: "Resale workflow" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
  },
];

// Flatten nav items so we can build a single observer over every tracked id
function flattenIds(items: NavItem[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    out.push(item.id);
    if (item.children) {
      for (const child of item.children) out.push(child.id);
    }
  }
  return out;
}

const ALL_IDS = flattenIds(NAV_ITEMS);

export default function StickyPageNav() {
  const [activeId, setActiveId] = useState<string>(NAV_ITEMS[0].id);
  const [visible, setVisible] = useState(false);
  const [slothProgress, setSlothProgress] = useState(0); // 0..1 along the line
  const [slothRotation, setSlothRotation] = useState(0); // degrees
  // Drag state for the sloth: when the user grabs it, we override its position
  // and live-scroll the page so the sloth acts as a scrubber.
  const [isDragging, setIsDragging] = useState(false);
  const [dragTopPct, setDragTopPct] = useState<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  // Fade in only after the rest of the page has finished loading (images,
  // videos, fonts). If the window has already fired `load` by the time we
  // mount, reveal immediately. A short delay after load lets the layout
  // settle before the nav appears.
  useEffect(() => {
    const REVEAL_DELAY_MS = 300;
    let timer: number | null = null;

    const reveal = () => {
      timer = window.setTimeout(() => setVisible(true), REVEAL_DELAY_MS);
    };

    if (document.readyState === "complete") {
      reveal();
    } else {
      window.addEventListener("load", reveal, { once: true });
    }

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener("load", reveal);
    };
  }, []);

  // Sloth climbing state: track scroll progress & rotate while scrolling
  useEffect(() => {
    const getScrollTop = () => {
      const body = document.body;
      const root = document.documentElement;
      return Math.max(window.scrollY, root.scrollTop, body.scrollTop);
    };

    const getMaxScroll = () => {
      const body = document.body;
      const root = document.documentElement;
      return Math.max(
        body.scrollHeight - window.innerHeight,
        root.scrollHeight - window.innerHeight,
        1
      );
    };

    let isScrolling = false;
    let rafId: number | null = null;
    let stopTimer: number | null = null;

    const updateProgress = () => {
      const scrollTop = getScrollTop();
      const maxScroll = getMaxScroll();
      const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
      setSlothProgress(progress);
    };

    const rotateLoop = () => {
      if (!isScrolling) {
        rafId = null;
        return;
      }
      setSlothRotation((r) => (r + 2) % 360); // slow rotate
      rafId = requestAnimationFrame(rotateLoop);
    };

    const handleScroll = () => {
      updateProgress();
      if (!isScrolling) {
        isScrolling = true;
        if (rafId === null) rafId = requestAnimationFrame(rotateLoop);
      }
      // Stop rotating 150ms after the last scroll event
      if (stopTimer) window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    updateProgress();

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (stopTimer) window.clearTimeout(stopTimer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      document.body.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  // Update active id based on scroll. Positions are measured fresh on every
  // scroll tick so content shifts (images loading, dynamic sizing) don't cause
  // a stale active state.
  useEffect(() => {
    const getScrollTop = () => {
      const body = document.body;
      const root = document.documentElement;
      return Math.max(window.scrollY, root.scrollTop, body.scrollTop);
    };

    const computeActive = () => {
      const scrollTop = getScrollTop();
      // Use a line ~35% down the viewport as the "you are here" cursor
      const cursor = scrollTop + window.innerHeight * 0.35;

      let current: string = NAV_ITEMS[0].id;
      for (const id of ALL_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const top = rect.top + scrollTop;
        if (top <= cursor) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    // Run on next frame so we always use up-to-date DOM
    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        computeActive();
      });
    };

    computeActive();

    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("scroll", schedule, { passive: true });
    document.body.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("scroll", schedule);
      document.body.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

    // Account for fixed nav height (~72px)
    const offset = 96;
    const rect = el.getBoundingClientRect();
    const scrollTop = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
    const targetTop = rect.top + scrollTop - offset;

    window.scrollTo({ top: targetTop, behavior });
    document.documentElement.scrollTo({ top: targetTop, behavior });
    document.body.scrollTo({ top: targetTop, behavior });
  };

  // Determine active index in the flattened list for line fill
  const activeIndex = ALL_IDS.indexOf(activeId);

  // Explicit vertical % for every nav id. The sloth moves through each of
  // these positions as the active section changes, producing a smooth descent
  // down the tree as the user reads through the page.
  const SLOTH_POSITION_MAP: Record<string, number> = {
    context: 8,
    desktop: 22,
    "desktop-chrome": 32,
    "desktop-p2p": 44,
    mobile: 56,
    "mobile-onboarding": 62,
    "mobile-listing": 74,
    marketing: 88,
  };
  const slothTopPct = SLOTH_POSITION_MAP[activeId] ?? 10;

  // While dragging, the sloth follows the pointer (dragTopPct overrides the
  // auto-computed resting position).
  const displayTopPct = isDragging && dragTopPct !== null ? dragTopPct : slothTopPct;

  // Scrub-scroll helpers ---------------------------------------------------

  // Scroll the page so a given nav id sits near the top of the viewport.
  // Uses "instant" behavior while dragging for live feedback; "smooth" when
  // snapping on release.
  const scrollToId = (id: string, smooth: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 96;
    const rect = el.getBoundingClientRect();
    const scrollTop = Math.max(
      window.scrollY,
      document.documentElement.scrollTop,
      document.body.scrollTop
    );
    const targetTop = rect.top + scrollTop - offset;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = smooth && !prefersReduced ? "smooth" : "auto";
    // The scroll container on this page is <body> (html has overflow:hidden),
    // so we must scroll body as well as window/documentElement.
    window.scrollTo({ top: targetTop, behavior });
    document.documentElement.scrollTo({ top: targetTop, behavior });
    document.body.scrollTo({ top: targetTop, behavior });
  };

  // Given a vertical percentage (0..100 within the nav), pick the nearest
  // section id from the sloth position map.
  const idForPct = (pct: number): string => {
    let closestId = ALL_IDS[0];
    let minDist = Infinity;
    for (const id of ALL_IDS) {
      const p = SLOTH_POSITION_MAP[id];
      if (p === undefined) continue;
      const dist = Math.abs(p - pct);
      if (dist < minDist) {
        minDist = dist;
        closestId = id;
      }
    }
    return closestId;
  };

  // Convert a clientY (from a pointer event) to a vertical % inside the nav,
  // clamped to the valid sloth range [10, 70].
  const clientYToPct = (clientY: number): number => {
    const nav = navRef.current;
    if (!nav) return 10;
    const rect = nav.getBoundingClientRect();
    const raw = ((clientY - rect.top) / rect.height) * 100;
    return Math.max(8, Math.min(88, raw));
  };

  const handleSlothPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const pct = clientYToPct(e.clientY);
    setIsDragging(true);
    setDragTopPct(pct);
    scrollToId(idForPct(pct), false);
  };

  const handleSlothPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const pct = clientYToPct(e.clientY);
    setDragTopPct(pct);
    scrollToId(idForPct(pct), false);
  };

  const handleSlothPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    const pct = clientYToPct(e.clientY);
    const targetId = idForPct(pct);
    setIsDragging(false);
    setDragTopPct(null);
    // Smooth-scroll to final target so the page settles cleanly.
    scrollToId(targetId, true);
  };

  return (
    <nav
      ref={navRef}
      className={`${styles.sideNav} ${visible ? styles.visible : ""} ${isDragging ? styles.dragging : ""}`}
      aria-label="Page sections"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tree_asset3.svg"
        alt=""
        className={styles.tree}
        aria-hidden="true"
        draggable={false}
      />


      <div
        className={`${styles.slothWrapper} ${isDragging ? styles.slothWrapperDragging : ""}`}
        style={{
          /* Sloth rests next to the active section, or follows the pointer
             while the user is dragging it. */
          top: `${displayTopPct}%`,
          transform: `rotate(${slothRotation}deg)`,
        }}
        onPointerDown={handleSlothPointerDown}
        onPointerMove={handleSlothPointerMove}
        onPointerUp={handleSlothPointerUp}
        onPointerCancel={handleSlothPointerUp}
        role="slider"
        aria-label="Scroll position. Drag to navigate sections."
        aria-valuemin={0}
        aria-valuemax={ALL_IDS.length - 1}
        aria-valuenow={Math.max(0, activeIndex)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sloth_vector.svg"
          alt=""
          className={styles.sloth}
          draggable={false}
        />
      </div>

      <ol ref={listRef} className={styles.list}>
        {NAV_ITEMS.map((item, topIdx) => {
          const itemFlatIndex = ALL_IDS.indexOf(item.id);
          const isItemActive = activeId === item.id;
          const isItemPassed = itemFlatIndex <= activeIndex;

          // Sub-items are shown only when the active section belongs to this
          // parent — either the parent itself or one of its children.
          const childIds = item.children?.map((c) => c.id) ?? [];
          const isGroupActive =
            isItemActive || childIds.includes(activeId);

          return (
            <li key={item.id} className={styles.group}>
              <div className={styles.topRow}>
                <span
                  className={`${styles.dot} ${isItemPassed ? styles.dotPassed : ""} ${
                    isItemActive ? styles.dotActive : ""
                  }`}
                  aria-hidden="true"
                />
                <a
                  href={`#${item.id}`}
                  className={`${styles.topLabel} ${isItemActive || isGroupActive ? styles.labelActive : ""}`}
                  onClick={handleClick(item.id)}
                >
                  {topIdx + 1}. {item.label}
                </a>
              </div>

              {item.children && (
                <div
                  className={`${styles.collapsible} ${isGroupActive ? styles.collapsibleOpen : ""}`}
                  aria-hidden={!isGroupActive}
                >
                  <div className={styles.collapsibleInner}>
                    <ul className={styles.subList}>
                      {item.children.map((child) => {
                        const childFlatIndex = ALL_IDS.indexOf(child.id);
                        const isChildActive = activeId === child.id;
                        const isChildPassed = childFlatIndex <= activeIndex;
                        return (
                          <li key={child.id} className={styles.subItem}>
                            <span
                              className={`${styles.subDot} ${isChildPassed ? styles.dotPassed : ""} ${
                                isChildActive ? styles.dotActive : ""
                              }`}
                              aria-hidden="true"
                            />
                            <a
                              href={`#${child.id}`}
                              className={`${styles.subLabel} ${isChildActive ? styles.labelActive : ""}`}
                              onClick={handleClick(child.id)}
                              tabIndex={isGroupActive ? 0 : -1}
                            >
                              {child.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
