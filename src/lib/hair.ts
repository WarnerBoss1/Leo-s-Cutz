/**
 * The hair block in the hero.
 *
 * A field of short strokes ("strands") drawn on a canvas. Leo's name is shaved into it,
 * the bottom fades out like a taper, and visitors can drag across it to cut their own design.
 * They can also change the clipper guard, the fade height and the hair color.
 *
 * Usage:
 *   const hair = mountHair(box, hairCanvas, fxCanvas, { onState });
 *   hair.setGuard(1); hair.setFade("high"); hair.setDye("blonde"); hair.grow(); hair.destroy();
 */

/** How short each clipper guard cuts, as a share of full length. #0 is skin. */
const GUARD_LENGTH = [0, 0.13, 0.3];

/** Where the fade starts, as a share of the block's height. Higher fade = starts further up. */
const FADE_START = { low: 0.76, mid: 0.64, high: 0.5 } as const;
export type FadeHeight = keyof typeof FADE_START;

/** Six strand colors per dye. The pole runs red, white, blue across the block. */
export const DYES = {
  pole: ["#ff4250", "#c91c29", "#f5f6fa", "#aab2c6", "#5c86ff", "#2748e8"],
  blonde: ["#f6e2a4", "#e9c766", "#d2a945", "#b08730", "#f1d27a", "#8f6c22"],
  silver: ["#f5f6fa", "#d7dce8", "#aab2c6", "#7d8599", "#e6e9f1", "#5c6475"],
  red: ["#ff7a84", "#ff4250", "#e5202e", "#b01522", "#ff5c68", "#7e0f18"],
  blue: ["#9bb5ff", "#5c86ff", "#2748e8", "#1b32ad", "#7a9cff", "#132378"],
} as const;
export type Dye = keyof typeof DYES;

const RING = "#f5f6fa";

const STRETCH: [number, string][] = [
  [50, "ultra-condensed"],
  [62.5, "extra-condensed"],
  [75, "condensed"],
  [87.5, "semi-condensed"],
  [100, "normal"],
  [112.5, "semi-expanded"],
  [125, "expanded"],
  [150, "extra-expanded"],
];

type Point = { x: number; y: number };
type Clipping = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  va: number;
  l: number;
  life: number;
  c: string;
};

/** 0 = clippers off, 1 = running, 2 = cutting hair. Used to drive the clipper sound. */
export type ClipperState = 0 | 1 | 2;

export type HairOptions = {
  words?: { wide: string; stacked: [string, string] };
  onState?: (state: ClipperState) => void;
};

export type Hair = {
  setGuard: (guard: number) => void;
  setFade: (fade: FadeHeight) => void;
  setDye: (dye: Dye) => void;
  grow: () => void;
  destroy: () => void;
};

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function mountHair(
  box: HTMLElement,
  cvs: HTMLCanvasElement,
  fx: HTMLCanvasElement,
  options: HairOptions = {},
): Hair {
  const words = options.words ?? { wide: "LEO'S CUTZ", stacked: ["LEO'S", "CUTZ"] };
  const tell = options.onState ?? (() => {});
  const ctx = cvs.getContext("2d");
  const fctx = fx.getContext("2d");
  if (!ctx || !fctx) {
    return { setGuard() {}, setFade() {}, setDye() {}, grow() {}, destroy() {} };
  }

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  let W = 0;
  let H = 0;
  let sp = 5;
  let maxLen = 16;
  let pad = 0;
  let cols = 0;
  let rows = 0;
  let N = 0;
  let len = new Float32Array(0); // how long each strand is right now
  let target = new Float32Array(0); // how long Leo's cut leaves it
  let mine = new Float32Array(0); // how short the visitor has cut it
  let hx = new Float32Array(0);
  let hy = new Float32Array(0);
  let ux = new Float32Array(0);
  let uy = new Float32Array(0);
  let thr = new Float32Array(0);
  let cap = new Float32Array(0);
  let tone = new Uint8Array(0);
  let shade = new Uint8Array(0);

  let guard = 0;
  let fade: FadeHeight = "mid";
  let dye: Dye = "pole";
  let ready = false;
  let fontOK = false;
  let dead = false;

  /* Lay the strands out on a jittered grid. The grid runs past the edges so the block stays dense there. */
  function layout() {
    const r = box.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [cvs, fx]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const phone = W < 560;
    sp = phone ? 3.3 : 4.4;
    maxLen = sp * (phone ? 2.9 : 3.6);
    pad = Math.ceil(maxLen / sp);
    cols = Math.ceil(W / sp) + pad * 2;
    rows = Math.ceil(H / sp) + pad * 2;
    N = cols * rows;
    len = new Float32Array(N);
    target = new Float32Array(N);
    mine = new Float32Array(N).fill(1);
    hx = new Float32Array(N);
    hy = new Float32Array(N);
    ux = new Float32Array(N);
    uy = new Float32Array(N);
    thr = new Float32Array(N);
    cap = new Float32Array(N);
    tone = new Uint8Array(N);
    shade = new Uint8Array(N);

    const rand = seeded(25);
    let i = 0;
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++, i++) {
        const x = (c - pad + rand() - 0.5) * sp;
        const y = (r2 - pad + rand() - 0.5) * sp;
        const a =
          Math.PI / 2 +
          0.6 * Math.sin(x * 0.0052 + y * 0.0031 + 0.6) +
          0.34 * Math.sin(y * 0.014 - x * 0.0075) +
          (rand() - 0.5) * 0.7;
        hx[i] = x;
        hy[i] = y;
        ux[i] = Math.cos(a);
        uy[i] = Math.sin(a);
        shade[i] = Math.floor(rand() * 6);
        thr[i] = rand();
      }
    }
    color();
    shape();
  }

  /* Which of the six dye colors each strand gets. */
  function color() {
    for (let i = 0; i < N; i++) {
      if (dye !== "pole") {
        tone[i] = shade[i]!;
        continue;
      }
      const u = hx[i]! / W + (thr[i]! - 0.5) * 0.2;
      tone[i] = (u < 0.36 ? 0 : u < 0.64 ? 2 : 4) + (shade[i]! & 1);
    }
  }

  /* Draw a word so it exactly fills a box, picking the font width that needs the least squeezing. */
  function fit(
    g: CanvasRenderingContext2D,
    str: string,
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ) {
    g.save();
    g.textBaseline = "alphabetic";
    g.font = `900 200px ${fontOK ? "Anybody" : '"Arial Black", Impact, sans-serif'}`;
    let m = g.measureText(str);
    if (fontOK && "fontStretch" in g) {
      const natural =
        ((m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * bh) /
        (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
      const want = (100 * bw) / natural;
      let best = STRETCH[0]!;
      for (const s of STRETCH) if (Math.abs(s[0] - want) < Math.abs(best[0] - want)) best = s;
      try {
        (g as unknown as { fontStretch: string }).fontStretch = best[1];
        m = g.measureText(str);
      } catch {
        /* older browsers: the scale below still makes it fit */
      }
    }
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    g.translate(bx, by);
    g.scale(bw / w, bh / h);
    g.fillText(str, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent);
    g.restore();
  }

  /* What Leo cut: the fade at the bottom, the name shaved in, and one design in the taper. */
  function shape() {
    const mask = document.createElement("canvas");
    mask.width = W;
    mask.height = H;
    const g = mask.getContext("2d", { willReadFrequently: true });
    if (!g) return;
    g.fillStyle = "#000";
    g.strokeStyle = "#000";
    g.lineCap = "round";
    g.lineJoin = "round";

    const narrow = W < 640;
    const fadeA = FADE_START[fade];
    const fadeB = 0.985;
    if (narrow) {
      fit(g, words.stacked[0], W * 0.06, H * 0.06, W * 0.88, H * 0.215);
      fit(g, words.stacked[1], W * 0.06, H * 0.315, W * 0.88, H * 0.215);
    } else {
      fit(g, words.wide, W * 0.045, H * 0.095, W * 0.91, H * 0.38);
    }

    /* the design: two swooping lines, like the one in the last photo */
    const dx0 = narrow ? W * 0.4 : W * 0.66;
    const dw = narrow ? W * 0.53 : W * 0.295;
    const dy0 = H * (narrow ? 0.6 : 0.575);
    const dh = H * (narrow ? 0.045 : 0.055);
    g.lineWidth = narrow ? 4.5 : 6;
    for (let k = 0; k < 2; k++) {
      const oy = k * dh * 1.25;
      const ox = k * dw * 0.05;
      g.beginPath();
      g.moveTo(dx0 + ox, dy0 + oy);
      g.bezierCurveTo(
        dx0 + ox + dw * 0.3,
        dy0 + oy - dh * 1.5,
        dx0 + ox + dw * 0.55,
        dy0 + oy + dh * 1.6,
        dx0 + ox + dw * 0.95,
        dy0 + oy - dh * 0.5,
      );
      g.stroke();
    }

    const d = g.getImageData(0, 0, W, H).data;
    const shaved = (x: number, y: number) => {
      x = Math.round(x);
      y = Math.round(y);
      return x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3]! > 110;
    };

    for (let i = 0; i < N; i++) {
      const x = hx[i]!;
      const y = hy[i]!;
      const t = thr[i]!;
      const f = smooth(fadeA, fadeB, y / H + (t - 0.5) * 0.06);
      let L = 1 - f;
      L = L * L * (0.75 + 0.25 * L);
      if (L < 0.05 + t * 0.12) L = L < 0.012 ? 0 : t < L * 7 ? 0.07 : 0;
      cap[i] = 99;
      if (shaved(x, y)) {
        L = Math.min(L, t < 0.42 ? 0.085 : 0);
      } else if (L > 0.1) {
        /* line-up: a strand stops where the shaved part starts */
        const half = (L * maxLen * (0.75 + t * 0.5)) / 2;
        for (let s = 1; s <= half; s += 1.1) {
          if (shaved(x + ux[i]! * s, y + uy[i]! * s) || shaved(x - ux[i]! * s, y - uy[i]! * s)) {
            cap[i] = Math.max(0.6, s - 1);
            break;
          }
        }
      }
      target[i] = L;
    }
  }

  /* Redraw one rectangle of the block. */
  function draw(x0: number, y0: number, x1: number, y1: number) {
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(W, Math.ceil(x1));
    y1 = Math.min(H, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0) return;
    const colors = DYES[dye];
    const c = ctx!;
    c.save();
    c.beginPath();
    c.rect(x0, y0, x1 - x0, y1 - y0);
    c.clip();
    c.clearRect(x0, y0, x1 - x0, y1 - y0);
    const c0 = Math.max(0, Math.floor((x0 - maxLen) / sp) + pad - 1);
    const c1 = Math.min(cols - 1, Math.ceil((x1 + maxLen) / sp) + pad + 1);
    const r0 = Math.max(0, Math.floor((y0 - maxLen) / sp) + pad - 1);
    const r1 = Math.min(rows - 1, Math.ceil((y1 + maxLen) / sp) + pad + 1);
    c.lineCap = "round";
    c.lineWidth = sp < 4 ? 1 : 1.2;
    for (let b = 0; b < 6; b++) {
      c.strokeStyle = colors[b]!;
      c.beginPath();
      for (let r = r0; r <= r1; r++) {
        let i = r * cols + c0;
        for (let col = c0; col <= c1; col++, i++) {
          if (tone[i] !== b) continue;
          const L = len[i]!;
          if (L < 0.02) continue;
          let h = Math.max(0.5, L * maxLen * (0.75 + thr[i]! * 0.5)) / 2;
          if (h > cap[i]!) h = cap[i]!;
          const x = hx[i]!;
          const y = hy[i]!;
          c.moveTo(x - ux[i]! * h, y - uy[i]! * h);
          c.lineTo(x + ux[i]! * h, y + uy[i]! * h);
        }
      }
      c.stroke();
    }
    c.restore();
  }

  /* Slide every strand to where it should be now. Used by the fade buttons and by "Grow it back". */
  let run = 0;
  function settle(ms: number) {
    const id = ++run;
    if (reduce || !ms) {
      for (let i = 0; i < N; i++) len[i] = Math.min(target[i]!, mine[i]!);
      draw(0, 0, W, H);
      return;
    }
    const from = new Float32Array(len);
    let t0 = 0;
    const step = (now: number) => {
      if (id !== run || dead) return;
      if (!t0) t0 = now;
      const t = Math.min(1, (now - t0) / ms);
      const e = t * t * (3 - 2 * t);
      for (let i = 0; i < N; i++) {
        const to = Math.min(target[i]!, mine[i]!);
        len[i] = from[i]! + (to - from[i]!) * e;
      }
      draw(0, 0, W, H);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* Falling clippings and the ring that shows where the clipper is. */
  let bits: Clipping[] = [];
  let ring: (Point & { r: number }) | null = null;
  let fxOn = false;
  function fxLoop() {
    if (dead) return;
    const f = fctx!;
    f.clearRect(0, 0, W, H);
    f.lineCap = "round";
    f.lineWidth = 1.2;
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i]!;
      p.vy += 0.22;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      p.life -= 0.028;
      if (p.life <= 0 || p.y > H + 10) {
        bits.splice(i, 1);
        continue;
      }
      f.globalAlpha = Math.min(1, p.life * 1.6);
      f.strokeStyle = p.c;
      f.beginPath();
      f.moveTo(p.x - Math.cos(p.a) * p.l, p.y - Math.sin(p.a) * p.l);
      f.lineTo(p.x + Math.cos(p.a) * p.l, p.y + Math.sin(p.a) * p.l);
      f.stroke();
    }
    f.globalAlpha = 1;
    if (ring) {
      f.strokeStyle = RING;
      f.lineWidth = 2;
      f.beginPath();
      f.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      f.stroke();
    }
    if (bits.length) requestAnimationFrame(fxLoop);
    else fxOn = false;
  }
  function fxKick() {
    if (!fxOn) {
      fxOn = true;
      requestAnimationFrame(fxLoop);
    }
  }

  let dirty: [number, number, number, number] | null = null;
  let raf = 0;
  function mark(x0: number, y0: number, x1: number, y1: number) {
    if (!dirty) dirty = [x0, y0, x1, y1];
    else {
      dirty[0] = Math.min(dirty[0], x0);
      dirty[1] = Math.min(dirty[1], y0);
      dirty[2] = Math.max(dirty[2], x1);
      dirty[3] = Math.max(dirty[3], y1);
    }
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        const d = dirty;
        dirty = null;
        if (d && !dead) draw(d[0], d[1], d[2], d[3]);
      });
    }
  }

  const radius = () => (W < 560 ? 11 : 13);

  let down = false;
  let biting = 0;
  function cutAt(x: number, y: number) {
    const R = radius();
    const g = GUARD_LENGTH[guard] ?? 0;
    const colors = DYES[dye];
    const c0 = Math.max(0, Math.floor((x - R) / sp) + pad - 1);
    const c1 = Math.min(cols - 1, Math.ceil((x + R) / sp) + pad + 1);
    const r0 = Math.max(0, Math.floor((y - R) / sp) + pad - 1);
    const r1 = Math.min(rows - 1, Math.ceil((y + R) / sp) + pad + 1);
    let hit = false;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        const dx = hx[i]! - x;
        const dy = hy[i]! - y;
        if (dx * dx + dy * dy > R * R || len[i]! <= g) continue;
        if (!reduce && len[i]! > 0.3 && bits.length < 240 && Math.random() < 0.16) {
          bits.push({
            x: hx[i]!,
            y: hy[i]!,
            vx: (Math.random() - 0.5) * 1.6,
            vy: Math.random() * 0.8 - 0.6,
            a: Math.random() * 6.28,
            va: (Math.random() - 0.5) * 0.3,
            l: 1.5 + Math.random() * 3,
            life: 1,
            c: colors[tone[i]!] ?? RING,
          });
        }
        const to = g === 0 ? 0 : g * (0.8 + thr[i]! * 0.4);
        len[i] = to;
        if (to < mine[i]!) mine[i] = to;
        hit = true;
      }
    }
    if (hit) {
      mark(x - R - maxLen, y - R - maxLen, x + R + maxLen, y + R + maxLen);
      if (bits.length) fxKick();
      tell(2);
      window.clearTimeout(biting);
      biting = window.setTimeout(() => tell(down ? 1 : 0), 110);
    }
  }

  function cutLine(a: Point, b: Point) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
    for (let s = 1; s <= n; s++) cutAt(a.x + ((b.x - a.x) * s) / n, a.y + ((b.y - a.y) * s) / n);
  }

  /* Mouse: press and drag. Touch: sideways drags cut, up-and-down still scrolls the page. */
  let moved = false;
  let last: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  const pos = (e: PointerEvent): Point => {
    const r = cvs.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent) => {
    if (!ready) return;
    down = true;
    last = start = pos(e);
    moved = e.pointerType === "mouse";
    tell(1);
    if (moved) {
      try {
        cvs.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety */
      }
      cutAt(last.x, last.y);
    }
  };
  const onMove = (e: PointerEvent) => {
    const p = pos(e);
    if (e.pointerType === "mouse") {
      ring = { x: p.x, y: p.y, r: radius() };
      fxKick();
    }
    if (!down) return;
    if (!moved) {
      if (Math.hypot(p.x - start.x, p.y - start.y) < 6) return;
      moved = true;
    }
    cutLine(last, p);
    last = p;
  };
  const onUp = () => {
    down = false;
    window.clearTimeout(biting);
    tell(0);
  };
  const onLeave = () => {
    ring = null;
    fxKick();
  };
  cvs.addEventListener("pointerdown", onDown);
  cvs.addEventListener("pointermove", onMove);
  cvs.addEventListener("pointerup", onUp);
  cvs.addEventListener("pointercancel", onUp);
  cvs.addEventListener("pointerleave", onLeave);

  /* One moment on load: the block starts uncut, then the clipper passes across it. */
  function intro() {
    if (reduce) {
      len.set(target);
      draw(0, 0, W, H);
      ready = true;
      return;
    }
    const duration = 1500;
    const soft = 0.22;
    let t0 = 0;
    const step = (now: number) => {
      if (dead) return;
      if (!t0) t0 = now;
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      for (let i = 0; i < N; i++) {
        const p = (e * (1 + soft) - hx[i]! / W - thr[i]! * 0.04) / soft;
        len[i] = p <= 0 ? 1 : p >= 1 ? target[i]! : 1 + (target[i]! - 1) * p;
      }
      draw(0, 0, W, H);
      if (t < 1) requestAnimationFrame(step);
      else {
        len.set(target);
        draw(0, 0, W, H);
        ready = true;
      }
    };
    requestAnimationFrame(step);
  }

  layout();
  len.fill(1);
  draw(0, 0, W, H);

  let started = false;
  const begin = () => {
    if (started || dead) return;
    started = true;
    try {
      fontOK = document.fonts.check("900 100px Anybody");
    } catch {
      fontOK = false;
    }
    shape();
    intro();
  };
  try {
    document.fonts.load("900 100px Anybody").then(begin, begin);
  } catch {
    begin();
  }
  const fallback = window.setTimeout(begin, 1600);

  let lastW = W;
  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const w = Math.round(box.getBoundingClientRect().width);
      if (w === lastW || dead) return;
      lastW = w;
      run++;
      layout();
      len.set(target);
      bits = [];
      draw(0, 0, W, H);
    }, 150);
  };
  window.addEventListener("resize", onResize);

  return {
    setGuard(next) {
      guard = next;
    },
    setFade(next) {
      if (next === fade) return;
      fade = next;
      if (!ready) return;
      shape();
      settle(420);
    },
    setDye(next) {
      if (next === dye) return;
      dye = next;
      color();
      draw(0, 0, W, H);
    },
    grow() {
      if (!ready) return;
      mine.fill(1);
      bits = [];
      settle(650);
    },
    destroy() {
      dead = true;
      window.clearTimeout(fallback);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(biting);
      window.removeEventListener("resize", onResize);
      cvs.removeEventListener("pointerdown", onDown);
      cvs.removeEventListener("pointermove", onMove);
      cvs.removeEventListener("pointerup", onUp);
      cvs.removeEventListener("pointercancel", onUp);
      cvs.removeEventListener("pointerleave", onLeave);
    },
  };
}
