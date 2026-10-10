import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CUT,
  HOURS,
  OWNER_PHONE,
  OWNER_PHONE_DISPLAY,
  PRICE,
  cutExtras,
  cutNotes,
  cutService,
  listWords,
  textForLeo,
  timeLabel,
  timeSlots,
  todayISO,
  type Cut,
} from "@/lib/booking";

type Props = {
  /** What the visitor picked in "Build your cut". Falls back to a plain taper. */
  cut?: Cut;
  /** Where "Change the cut" points. */
  changeHref?: string;
};

type Missing = { name: boolean; phone: boolean; day: boolean; time: boolean };
const NOTHING_MISSING: Missing = { name: false, phone: false, day: false, time: false };

/** A link that opens the visitor's texting app with a message to Leo already written. */
function smsLink(message: string) {
  return `sms:${OWNER_PHONE}?&body=${encodeURIComponent(message)}`;
}

export function BookingSection({ cut = DEFAULT_CUT, changeHref = "#build" }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [missing, setMissing] = useState<Missing>(NOTHING_MISSING);
  /** The text that was handed to the texting app, once the request is saved. */
  const [sentText, setSentText] = useState<string | null>(null);
  /** Today's date, set in the browser so the server and the visitor never disagree. */
  const [today, setToday] = useState("");
  const inputs = {
    name: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    day: useRef<HTMLInputElement>(null),
    time: useRef<HTMLSelectElement>(null),
  };

  useEffect(() => setToday(todayISO()), []);

  const message = textForLeo(cut, { name, day, time, notes });

  const booking = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("appointments").insert({
        client_name: name.trim(),
        client_phone: phone.trim(),
        client_email: email.trim() || null,
        service: cutService(cut),
        appointment_date: day,
        appointment_time: time,
        notes: cutNotes(cut, notes),
        status: "pending",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setSentText(message);
      // Hand the message to the visitor's texting app. They hit send.
      window.location.href = smsLink(message);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const now: Missing = {
      name: !name.trim(),
      phone: phone.replace(/\D/g, "").length < 7,
      day: !day || day < todayISO(),
      time: !time,
    };
    setMissing(now);
    const first = (Object.keys(now) as (keyof Missing)[]).find((k) => now[k]);
    if (first) {
      inputs[first].current?.focus();
    } else {
      booking.mutate();
    }
  };

  return (
    <section className="book" id="book">
      <div className="wrap book__grid">
        <div className="book__intro">
          <h2>Book your cut</h2>
          <p className="lead">
            Pick a day and time, then text it to Leo. He texts you back to lock it in. {HOURS}.
          </p>
          <div className="order" aria-live="polite">
            <div className="order__top">
              <span>{cut.style}</span>
              <span>{PRICE}</span>
            </div>
            <p>With a free {listWords(cutExtras(cut))}.</p>
            {cut.photo && <p>Like the photo: {cut.photo}.</p>}
            <p>
              <a href={changeHref}>Change the cut</a>
            </p>
          </div>
        </div>

        {sentText !== null ? (
          <div className="sent" role="status">
            <h3>Now send the text</h3>
            <p>
              Your texting app opens with this message to Leo at {OWNER_PHONE_DISPLAY}. Hit send and
              he will text you back.
            </p>
            <p className="sent__msg">{sentText}</p>
            <div className="sent__go">
              <a className="btn btn--sm" href={smsLink(sentText)}>
                Open my texts
              </a>
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => {
                  booking.reset();
                  setSentText(null);
                }}
              >
                Change my request
              </button>
            </div>
          </div>
        ) : (
          <form className="form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="bk-name">Your name</label>
              <input
                id="bk-name"
                ref={inputs.name}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={missing.name}
                required
              />
              {missing.name && (
                <span className="err">Add your name so Leo knows who's coming.</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="bk-phone">Phone</label>
              <input
                id="bk-phone"
                ref={inputs.phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={missing.phone}
                required
              />
              {missing.phone && <span className="err">Add a phone number Leo can text.</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-day">Day you want</label>
              <input
                id="bk-day"
                ref={inputs.day}
                type="date"
                min={today || undefined}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                aria-invalid={missing.day}
                required
              />
              {missing.day && <span className="err">Pick a day, today or later.</span>}
            </div>
            <div className="field">
              <label htmlFor="bk-time">Time you want</label>
              <select
                id="bk-time"
                ref={inputs.time}
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-invalid={missing.time}
                required
              >
                <option value="">Pick a time</option>
                {timeSlots().map((slot) => (
                  <option key={slot} value={slot}>
                    {timeLabel(slot)}
                  </option>
                ))}
              </select>
              {missing.time && <span className="err">Pick a time.</span>}
            </div>
            <div className="field full">
              <label htmlFor="bk-email">
                Email <small>(optional)</small>
              </label>
              <input
                id="bk-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field full">
              <label htmlFor="bk-notes">
                Notes <small>(optional)</small>
              </label>
              <textarea
                id="bk-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Other times that work, or anything else Leo should know."
              />
            </div>
            {booking.isError && (
              <p className="form__fail full" role="alert">
                The request didn't save. Check your connection and try again, or{" "}
                <a className="link" href={smsLink(message)}>
                  text it to Leo right now
                </a>
                .
              </p>
            )}
            <div className="form__go full">
              <button className="btn" type="submit" disabled={booking.isPending}>
                {booking.isPending ? "Sending…" : "Send booking request"}
              </button>
              <p>Next, your texting app opens with a message to Leo. Hit send.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
