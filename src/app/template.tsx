import styles from "./template.module.css";

/**
 * Route template — re-mounts on every navigation, so each page fades and
 * slides up gently as it enters. Pure CSS so it can never get stuck mid-state
 * (no JS/hydration dependency); content is always visible if animations are off.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className={styles.pageTransition}>{children}</div>;
}
