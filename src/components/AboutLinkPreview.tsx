"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./AboutLinkPreview.module.css";

type Props = {
  href: string;
  images: string[];
  children: React.ReactNode;
};

const CYCLE_INTERVAL_MS = 1500;
const CROSSFADE_MS = 360;

export default function AboutLinkPreview({ href, images, children }: Props) {
  const [isHovering, setIsHovering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHovering) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, CYCLE_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovering, images.length]);

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setActiveIndex(0);
      }}
    >
      <Link
        href={href}
        className={styles.link}
        onFocus={() => setIsHovering(true)}
        onBlur={() => {
          setIsHovering(false);
          setActiveIndex(0);
        }}
      >
        <em>{children}</em>
      </Link>
      <span
        className={`${styles.preview} ${isHovering ? styles.previewVisible : ""}`}
        aria-hidden="true"
      >
        <span className={styles.imageFrame}>
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={styles.image}
              style={{
                opacity: i === activeIndex ? 1 : 0,
                transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.215, 0.61, 0.355, 1)`,
              }}
            />
          ))}
        </span>
      </span>
    </span>
  );
}
