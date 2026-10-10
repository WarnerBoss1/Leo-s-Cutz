import { useEffect, useRef, useState, type CSSProperties } from "react";

import { createBuzz } from "@/lib/buzz";
import { mountHair, type Dye, type FadeHeight, type Hair } from "@/lib/hair";

const GUARDS = [
  { id: 0, name: "#0", length: "skin" },
  { id: 1, name: "#1", length: "⅛ in" },
  { id: 2, name: "#2", length: "¼ in" },
];

const FADES: { id: FadeHeight; name: string }[] = [
  { id: "low", name: "Low" },
  { id: "mid", name: "Mid" },
  { id: "high", name: "High" },
];

const DYE_SWATCHES: { id: Dye; name: string; swatch: string }[] = [
  {
    id: "pole",
    name: "Barber pole",
    swatch: "linear-gradient(90deg,#e5202e 0 33%,#f5f6fa 33% 66%,#2748e8 66%)",
  },
  { id: "blonde", name: "Blonde", swatch: "#e9c766" },
  { id: "silver", name: "Silver", swatch: "#cfd5e2" },
  { id: "red", name: "Red", swatch: "#e5202e" },
  { id: "blue", name: "Blue", swatch: "#2748e8" },
];

/** The block of hair at the top of the page, and the clipper station under it. */
export function HairBlock() {
  const box = useRef<HTMLDivElement>(null);
  const hairCanvas = useRef<HTMLCanvasElement>(null);
  const fxCanvas = useRef<HTMLCanvasElement>(null);
  const hair = useRef<Hair | null>(null);
  const buzz = useRef<ReturnType<typeof createBuzz> | null>(null);
  const [guard, setGuard] = useState(0);
  const [fade, setFade] = useState<FadeHeight>("mid");
  const [dye, setDye] = useState<Dye>("pole");
  const [sound, setSound] = useState(false);

  useEffect(() => {
    if (!box.current || !hairCanvas.current || !fxCanvas.current) return;
    const clipperSound = createBuzz();
    const mounted = mountHair(box.current, hairCanvas.current, fxCanvas.current, {
      onState: (s) => clipperSound.state(s),
    });
    hair.current = mounted;
    buzz.current = clipperSound;
    return () => {
      mounted.destroy();
      clipperSound.destroy();
      hair.current = null;
      buzz.current = null;
    };
  }, []);

  useEffect(() => hair.current?.setGuard(guard), [guard]);
  useEffect(() => hair.current?.setFade(fade), [fade]);
  useEffect(() => hair.current?.setDye(dye), [dye]);

  return (
    <>
      <div className="hairbox" ref={box}>
        <canvas
          ref={hairCanvas}
          className="hairbox__hair"
          role="img"
          aria-label="A block of hair with LEO'S CUTZ shaved into it. Drag across it to cut your own design."
        />
        <canvas ref={fxCanvas} className="hairbox__fx" aria-hidden="true" />
      </div>
      <div className="station">
        <p className="station__hint">Drag across the hair to cut your own design.</p>
        <div className="ctl" role="radiogroup" aria-label="Clipper guard">
          <span className="ctl__name" aria-hidden="true">
            Guard
          </span>
          {GUARDS.map((g) => (
            <button
              key={g.id}
              className="tool"
              type="button"
              role="radio"
              aria-checked={guard === g.id}
              onClick={() => setGuard(g.id)}
            >
              {g.name}
              <small>{g.length}</small>
            </button>
          ))}
        </div>
        <div className="ctl" role="radiogroup" aria-label="Fade height">
          <span className="ctl__name" aria-hidden="true">
            Fade
          </span>
          {FADES.map((f) => (
            <button
              key={f.id}
              className="tool"
              type="button"
              role="radio"
              aria-checked={fade === f.id}
              onClick={() => setFade(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="ctl" role="radiogroup" aria-label="Hair color">
          <span className="ctl__name" aria-hidden="true">
            Dye
          </span>
          {DYE_SWATCHES.map((d) => (
            <button
              key={d.id}
              className="swatch"
              type="button"
              role="radio"
              aria-checked={dye === d.id}
              aria-label={d.name}
              title={d.name}
              style={{ "--sw": d.swatch } as CSSProperties}
              onClick={() => setDye(d.id)}
            />
          ))}
        </div>
        <button
          className="tool"
          type="button"
          aria-pressed={sound}
          onClick={() => {
            buzz.current?.setOn(!sound);
            setSound(!sound);
          }}
        >
          {sound ? "Clipper sound on" : "Clipper sound off"}
        </button>
        <button className="tool" type="button" onClick={() => hair.current?.grow()}>
          Grow it back
        </button>
      </div>
    </>
  );
}
