export const OWNER_PHONE = "9498480565";
export const OWNER_PHONE_DISPLAY = "(949) 848-0565";
export const OWNER_EMAIL = "29chavezleo@gmail.com";
export const INSTAGRAM = "https://instagram.com/leos.cutz";

/** Opening hours, on a 24-hour clock, in Irvine time. The neon sign and the hours text both use these. */
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 20;
export const TIME_ZONE = "America/Los_Angeles";

/** 9 -> "9:00 AM", 20 -> "8:00 PM" */
export function hourLabel(hour: number): string {
  return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? "AM" : "PM"}`;
}

export const HOURS = `Open every day, ${hourLabel(OPEN_HOUR)} to ${hourLabel(CLOSE_HOUR)}`;

/** Every cut costs this. Change it here and the whole site follows. */
export const PRICE = "$25";

/** The cuts people can pick in "Build your cut". Add or remove names here. */
export const CUT_STYLES = [
  "Taper",
  "Low fade",
  "Mid fade",
  "Burst fade",
  "Buzz cut",
  "Scissor cut",
] as const;

export type CutStyle = (typeof CUT_STYLES)[number];

/** What a visitor has picked so far. `photo` is the caption of a gallery photo they asked for. */
export type Cut = {
  style: CutStyle;
  beard: boolean;
  design: boolean;
  photo: string | null;
};

export const DEFAULT_CUT: Cut = { style: "Taper", beard: false, design: false, photo: null };

/** The free things that come with this cut. A line-up is always one of them. */
export function cutExtras(cut: Cut): string[] {
  const extras = ["line-up"];
  if (cut.beard) extras.push("beard line-up");
  if (cut.design) extras.push("hair design");
  return extras;
}

/** "line-up, beard line-up and hair design" */
export function listWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/** The name the owner dashboard has always used for the service. */
export function cutService(cut: Cut): string {
  return cut.beard ? "Haircut + Beard" : "Haircut";
}

/** Everything Leo needs to know about the request, written into the notes field. */
export function cutNotes(cut: Cut, notes: string): string {
  const parts = [`Cut: ${cut.style}.`, `Free extras: ${listWords(cutExtras(cut))}.`];
  if (cut.photo) parts.push(`Like the photo: ${cut.photo}.`);
  if (notes.trim()) parts.push(`Notes: ${notes.trim()}`);
  return parts.join(" ");
}

/** The times people can ask for: every half hour from opening until just before closing. "14:30" style. */
export function timeSlots(): string[] {
  const slots: string[] = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    const hh = String(h).padStart(2, "0");
    slots.push(`${hh}:00`, `${hh}:30`);
  }
  return slots;
}

/** "14:30" or "14:30:00" -> "2:30 PM" */
export function timeLabel(time: string): string {
  const h = Number(time.slice(0, 2));
  return `${h % 12 === 0 ? 12 : h % 12}:${time.slice(3, 5)} ${h < 12 ? "AM" : "PM"}`;
}

/** "2026-10-12" -> "Monday, Oct 12" */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Today's date on the visitor's device, as "2026-10-12". */
export function todayISO(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/**
 * The text a customer sends Leo after filling out the form: who they are, what they want,
 * and the time they are asking for. Edit the wording here.
 */
export function textForLeo(
  cut: Cut,
  who: { name: string; day: string; time: string; notes: string },
): string {
  const want = `${cut.style.toLowerCase()} with a ${listWords(cutExtras(cut))}`;
  const photo = cut.photo ? `, like your photo "${cut.photo}"` : "";
  const lines = [
    `Hi Leo, this is ${who.name.trim()}.`,
    `I'd like a ${want}${photo}.`,
    `Are you free ${dayLabel(who.day)} at ${timeLabel(who.time)}?`,
  ];
  if (who.notes.trim()) lines.push(`Notes: ${who.notes.trim()}`);
  return lines.join("\n");
}

export const SERVICES = [
  { name: "Haircut", price: "$25", desc: "Fade, taper or scissor cut, cleaned up sharp." },
  { name: "Haircut + Beard", price: "$25", desc: "Full cut with a razor-sharp beard line-up — beard included free." },
  { name: "Line-Up", price: "Free", desc: "Edge-up included free with every cut." },
  { name: "Hair Designs", price: "Free", desc: "Custom designs and parts, free with your $25 cut." },
] as const;

/*
 * Not shown on the site right now. Only put a review back on the page if a real client
 * wrote it and is fine with it being posted.
 */
export const REVIEWS = [
  { name: "Marcus D.", text: "Cleanest fade I've had in OC. Leo takes his time and the line-up is razor sharp." },
  { name: "Jayden R.", text: "Been going for months. Always $25, always fire. He even did a free design for me." },
  { name: "Andres M.", text: "Super easy to book, texted me right back and got me in same day." },
  { name: "Kevin T.", text: "My son won't let anyone else cut his hair now. Patient with kids and quick." },
  { name: "Diego S.", text: "Beard line-up free with the cut? Nobody's doing that. Quality is unmatched." },
  { name: "Tyler W.", text: "Perfect taper every single time. Chill shop vibes and great convo." },
  { name: "Omar H.", text: "Came in with a grown-out mess and left looking brand new. Worth way more than $25." },
  { name: "Chris L.", text: "Best barber in Irvine hands down. Detail on the edges is insane." },
] as const;
