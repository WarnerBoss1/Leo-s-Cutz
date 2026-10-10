import { useEffect, useState } from "react";

import { CLOSE_HOUR, OPEN_HOUR, TIME_ZONE, hourLabel } from "@/lib/booking";

/** What hour it is in Irvine right now, 0 to 23. */
function shopHour(): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour = parts.find((p) => p.type === "hour")?.value;
    return hour === undefined ? null : Number(hour) % 24;
  } catch {
    return null;
  }
}

/** The neon sign. It lights up when Leo is open right now and goes dark when he's closed. */
export function OpenSign() {
  // Starts dark, then switches on in the browser, so the server and the visitor never disagree.
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(shopHour());
    const timer = window.setInterval(() => setHour(shopHour()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const open = hour !== null && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  const state = hour === null ? "off" : open ? "open" : "closed";
  const sub =
    hour === null
      ? `${hourLabel(OPEN_HOUR)} to ${hourLabel(CLOSE_HOUR)}`
      : open
        ? `until ${hourLabel(CLOSE_HOUR)} today`
        : hour < OPEN_HOUR
          ? `Opens ${hourLabel(OPEN_HOUR)} today`
          : `Opens ${hourLabel(OPEN_HOUR)} tomorrow`;

  return (
    <div className="neon" data-state={state} role="status">
      <span className="neon__word">{state === "closed" ? "Closed" : "Open"}</span>
      <span className="neon__sub">{sub}</span>
    </div>
  );
}
