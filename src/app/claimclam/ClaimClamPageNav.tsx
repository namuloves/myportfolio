"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./pageNav.module.css";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "trust", label: "Trust & Credibility" },
  { id: "filing-flow", label: "Filing Flow" },
  { id: "payouts", label: "Payouts" },
  { id: "design-system", label: "Design System" },
  { id: "outcome", label: "Outcome" },
];

export default function ClaimClamPageNav() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);

  useEffect(() => {
    const getScrollTop = () => {
      const root = document.documentElement;
      const body = document.body;
      return Math.max(window.scrollY, root.scrollTop, body.scrollTop);
    };

    const updateActive = () => {
      const scrollTop = getScrollTop();
      const cursor = scrollTop + window.innerHeight * 0.35;
      let current = sections[0].id;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + scrollTop;
        if (top <= cursor) {
          current = id;
        }
      }
      setActiveId(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    document.addEventListener("scroll", updateActive, { passive: true });
    document.body.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      document.removeEventListener("scroll", updateActive);
      document.body.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, []);

  return (
    <nav className={styles.pageNav} aria-label="Case study sections">
      <ul className={styles.list}>
        {sections.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <li key={id} className={styles.item}>
              <Link
                href={`#${id}`}
                className={`${styles.link} ${isActive ? styles.linkActive : ""}`}
              >
                <span
                  className={`${styles.dot} ${isActive ? styles.dotActive : ""}`}
                  aria-hidden="true"
                />
                <span className={styles.label}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
