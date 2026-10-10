import { useEffect, useRef } from "react";

/** How heavy letter number `k` of `total` is when nobody is pointing at the headline. */
function restWeight(k: number, total: number) {
  const t = total > 1 ? k / (total - 1) : 1;
  return Math.round(120 + 780 * Math.pow(t, 0.85));
}

/**
 * A headline whose letters get heavier as they go, like a fade.
 * With a mouse, the heavy part follows the pointer.
 */
export function FadeHeadline({ text }: { text: string }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const total = text.replace(/\s/g, "").length;

  useEffect(() => {
    const el = h1.current;
    if (!el) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduce) return;

    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-i]"));
    let mids: number[] | null = null;
    const enter = () => {
      mids = letters.map((l) => {
        const r = l.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    };
    const move = (e: PointerEvent) => {
      if (!mids) return;
      const reach = el.getBoundingClientRect().width * 0.3;
      letters.forEach((l, i) => {
        const d = Math.min(1, Math.abs((mids?.[i] ?? 0) - e.clientX) / reach);
        l.style.fontWeight = String(Math.round(900 - 760 * Math.pow(d, 0.8)));
      });
    };
    const leave = () => {
      mids = null;
      letters.forEach((l, i) => {
        l.style.fontWeight = String(restWeight(i, letters.length));
      });
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [text]);

  let k = 0;
  return (
    <h1 ref={h1}>
      <span className="vh">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, wi) => (
          <span key={wi}>
            {wi > 0 && " "}
            <span className="w">
              {word.split("").map((ch, ci) => {
                const i = k++;
                return (
                  <span key={ci} data-i={i} style={{ fontWeight: restWeight(i, total) }}>
                    {ch}
                  </span>
                );
              })}
            </span>
          </span>
        ))}
      </span>
    </h1>
  );
}
