import { useEffect, useRef, useState } from "react";

const getBrooklynTime = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(new Date());

/**
 * Returns the current Brooklyn (America/New_York) time as a formatted string,
 * refreshed every 30 seconds.
 */
export function useBrooklynClock() {
  const [brooklynTime, setBrooklynTime] = useState(getBrooklynTime);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setBrooklynTime(getBrooklynTime());
    intervalRef.current = window.setInterval(() => {
      setBrooklynTime(getBrooklynTime());
    }, 30000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return brooklynTime;
}
