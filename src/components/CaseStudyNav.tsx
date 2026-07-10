"use client";

import SiteNav from "./SiteNav";
import cs from "../styles/casestudy.module.css";
import navStyles from "../styles/home.module.css";
import { useTheme } from "../hooks/useTheme";
import { useBrooklynClock } from "../hooks/useBrooklynClock";

/**
 * Site header for case-study pages: the fixed variant of SiteNav, with its own
 * theme and Brooklyn-clock state so pages don't have to wire them up.
 */
export default function CaseStudyNav() {
  const { theme, toggleTheme } = useTheme();
  const brooklynTime = useBrooklynClock();

  return (
    <SiteNav
      className={`${navStyles.nav} ${cs.fixedNav}`}
      theme={theme}
      brooklynTime={brooklynTime}
      onToggleTheme={toggleTheme}
    />
  );
}
