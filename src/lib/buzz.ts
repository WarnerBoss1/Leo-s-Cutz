/**
 * The clipper sound: a low buzz that digs in when the clippers hit hair.
 * It stays silent until a visitor turns it on. Phones that can vibrate also get a small shake.
 */

import type { ClipperState } from "@/lib/hair";

type Rig = {
  ac: AudioContext;
  out: GainNode;
  low: OscillatorNode;
  high: OscillatorNode;
};

function build(): Rig | null {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ac = new AC();
  const out = ac.createGain();
  const filter = ac.createBiquadFilter();
  out.gain.value = 0;
  filter.type = "lowpass";
  filter.frequency.value = 1500;

  const low = ac.createOscillator();
  const high = ac.createOscillator();
  const highGain = ac.createGain();
  const wobble = ac.createOscillator();
  const wobbleGain = ac.createGain();
  low.type = "sawtooth";
  low.frequency.value = 118;
  high.type = "square";
  high.frequency.value = 236;
  highGain.gain.value = 0.22;
  wobble.frequency.value = 29;
  wobbleGain.gain.value = 5;

  wobble.connect(wobbleGain);
  wobbleGain.connect(low.frequency);
  low.connect(filter);
  high.connect(highGain);
  highGain.connect(filter);
  filter.connect(out);
  out.connect(ac.destination);
  low.start();
  high.start();
  wobble.start();
  return { ac, out, low, high };
}

export function createBuzz() {
  let on = false;
  let rig: Rig | null = null;
  let lastShake = 0;

  return {
    /** Turn the sound on or off. Must be called from a click so the browser allows audio. */
    setOn(next: boolean) {
      on = next;
      if (on && !rig) {
        try {
          rig = build();
        } catch {
          rig = null;
        }
      }
      if (!rig) return;
      void rig.ac.resume().catch(() => {});
      if (!on) rig.out.gain.setTargetAtTime(0, rig.ac.currentTime, 0.02);
    },
    state(s: ClipperState) {
      if (!on) return;
      if (rig) {
        const t = rig.ac.currentTime;
        rig.out.gain.setTargetAtTime(s === 2 ? 0.085 : s === 1 ? 0.03 : 0, t, 0.03);
        rig.low.frequency.setTargetAtTime(s === 2 ? 104 : 118, t, 0.04);
        rig.high.frequency.setTargetAtTime(s === 2 ? 208 : 236, t, 0.04);
      }
      if (s === 2 && "vibrate" in navigator && Date.now() - lastShake > 90) {
        lastShake = Date.now();
        try {
          navigator.vibrate(14);
        } catch {
          /* no vibration on this device */
        }
      }
    },
    destroy() {
      on = false;
      void rig?.ac.close().catch(() => {});
      rig = null;
    },
  };
}
