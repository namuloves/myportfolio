"use client";

import { type ComponentProps, type MouseEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ViewTransitionLinkProps = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for next/link that runs the App Router navigation inside
 * document.startViewTransition, so any matching `view-transition-name` elements
 * on the two pages morph between each other. Falls back to a normal navigation
 * when the API is unavailable or the user prefers reduced motion.
 */
export default function ViewTransitionLink({
  href,
  onClick,
  ...rest
}: ViewTransitionLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;

      // Respect new-tab / modifier clicks and external targets.
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (
        typeof document === "undefined" ||
        typeof document.startViewTransition !== "function" ||
        prefersReducedMotion
      ) {
        return; // let next/link handle it normally
      }

      event.preventDefault();
      document.startViewTransition(() => {
        router.push(href.toString());
      });
    },
    [href, onClick, router],
  );

  return <Link href={href} onClick={handleClick} {...rest} />;
}
