import { useEffect, useRef } from "react";

import { CUT_STYLES, PRICE, type Cut } from "@/lib/booking";

type Props = {
  cut: Cut;
  onChange: (next: Cut) => void;
};

/** The chips for picking a cut and adding the free extras. */
export function CutPickers({ cut, onChange }: Props) {
  return (
    <>
      <fieldset>
        <legend>Pick the cut</legend>
        <div className="chips">
          {CUT_STYLES.map((style) => (
            <label className="chip" key={style}>
              <input
                type="radio"
                name="style"
                value={style}
                checked={cut.style === style}
                onChange={() => onChange({ ...cut, style })}
              />
              <span>{style}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Add the free stuff</legend>
        <div className="chips">
          <label className="chip">
            <input
              type="checkbox"
              name="extra"
              checked={cut.beard}
              onChange={(e) => onChange({ ...cut, beard: e.target.checked })}
            />
            <span>
              Beard line-up <em>+$0</em>
            </span>
          </label>
          <label className="chip">
            <input
              type="checkbox"
              name="extra"
              checked={cut.design}
              onChange={(e) => onChange({ ...cut, design: e.target.checked })}
            />
            <span>
              Hair design <em>+$0</em>
            </span>
          </label>
        </div>
        <p className="included" style={{ marginTop: "0.75rem" }}>
          A line-up comes with every cut. You don't have to ask.
        </p>
      </fieldset>
    </>
  );
}

/** One row on the bill. It flashes once when it's added after the page has loaded. */
function BillLine({ name, price, live }: { name: string; price: string; live: boolean }) {
  const fresh = useRef(live).current;
  return (
    <li className={fresh ? "new" : undefined}>
      <span>{name}</span>
      <span>{price}</span>
    </li>
  );
}

/** The total gives a little bump whenever the bill changes, and stays the same. */
function BillTotal({ live }: { live: boolean }) {
  const fresh = useRef(live).current;
  return <strong className={fresh ? "bump" : undefined}>{PRICE}</strong>;
}

/** The $25 bill: whatever gets added, the total never moves. With a mouse, it tips toward the pointer. */
export function Bill({ cut }: { cut: Cut }) {
  const live = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    live.current = true;
    const area = stage.current;
    const bill = paper.current;
    if (!area || !bill) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduce) return;

    const tip = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      bill.style.setProperty("--ry", `${((x - 0.5) * 16).toFixed(1)}deg`);
      bill.style.setProperty("--rx", `${((0.5 - y) * 14).toFixed(1)}deg`);
      bill.style.setProperty("--mx", `${(x * 100).toFixed(0)}%`);
      bill.style.setProperty("--my", `${(y * 100).toFixed(0)}%`);
      bill.style.setProperty("--shine", "1");
    };
    const rest = () => {
      for (const p of ["--rx", "--ry", "--shine"]) bill.style.removeProperty(p);
    };
    area.addEventListener("pointermove", tip);
    area.addEventListener("pointerleave", rest);
    return () => {
      area.removeEventListener("pointermove", tip);
      area.removeEventListener("pointerleave", rest);
    };
  }, []);

  const lines: [string, string][] = [
    [cut.style, PRICE],
    ["Line-up", "$0"],
  ];
  if (cut.beard) lines.push(["Beard line-up", "$0"]);
  if (cut.design) lines.push(["Hair design", "$0"]);
  const corner = PRICE.replace("$", "");

  return (
    <div className="bill-stage" ref={stage}>
      <div className="bill" ref={paper} role="group" aria-label="Your total" aria-live="polite">
        {["tl", "tr", "bl", "br"].map((c) => (
          <span key={c} className={`bill__corner ${c}`} aria-hidden="true">
            {corner}
          </span>
        ))}
        <div className="bill__frame">
          <p className="bill__bank">Leo's Cutz of Irvine</p>
          <ul className="bill__lines">
            {lines.map(([name, price]) => (
              <BillLine key={name} name={name} price={price} live={live.current} />
            ))}
          </ul>
          <p className="bill__total">
            <span>Total, every time</span>
            <BillTotal key={lines.map((l) => l[0]).join("|")} live={live.current} />
          </p>
        </div>
      </div>
    </div>
  );
}
