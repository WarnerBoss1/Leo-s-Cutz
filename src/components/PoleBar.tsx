import { useEffect, useRef } from "react";

/** The barber pole under the top bar. Its stripes turn as the page scrolls. */
export function PoleBar() {
  const stripes = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = stripes.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let queued = false;
    const spin = () => {
      queued = false;
      el.style.setProperty("--spin", `${(-((window.scrollY * 0.45) % 64)).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(spin);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pole" aria-hidden="true">
      <i ref={stripes} />
    </div>
  );
}
