import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { BookingSection } from "@/components/BookingSection";
import { Bill, CutPickers } from "@/components/CutPickers";
import { FadeHeadline } from "@/components/FadeHeadline";
import { HairBlock } from "@/components/HairBlock";
import { OpenSign } from "@/components/OpenSign";
import { PhotoViewer } from "@/components/PhotoViewer";
import { PoleBar } from "@/components/PoleBar";
import {
  DEFAULT_CUT,
  HOURS,
  INSTAGRAM,
  OWNER_EMAIL,
  OWNER_PHONE,
  OWNER_PHONE_DISPLAY,
  PRICE,
  type Cut,
} from "@/lib/booking";
import cut1 from "@/assets/cut-1.webp";
import cut2 from "@/assets/cut-2.webp";
import cut3 from "@/assets/cut-3.webp";
import cut4 from "@/assets/cut-4.webp";
import cut5 from "@/assets/cut-5.webp";
import cut6 from "@/assets/cut-6.webp";
import cut7 from "@/assets/cut-7.webp";
import cut8 from "@/assets/cut-8.webp";
import cut9 from "@/assets/cut-9.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leo's Cutz — $25 Fades in Irvine, CA" },
      {
        name: "description",
        content:
          "Leo's Cutz: every haircut $25 in Irvine, CA — beard designs and line-ups free. Always accepting new clients. Request your cut online.",
      },
      { property: "og:title", content: "Leo's Cutz — $25 Fades in Irvine, CA" },
      {
        property: "og:description",
        content:
          "$25 cuts in Irvine, CA. Beard designs and line-ups free. Always accepting new clients.",
      },
    ],
  }),
  component: Index,
});

/** The photo wall. `name` is what shows under the photo and what gets sent to Leo when someone asks for it. */
const WORK = [
  { src: cut1, name: "Textured taper fade with a sharp line-up" },
  { src: cut2, name: "Buzz cut with a low taper" },
  { src: cut3, name: "Messy top taper with a hair design" },
  { src: cut4, name: "Curly top with a low fade" },
  { src: cut5, name: "Textured fringe with a blurry taper" },
  { src: cut6, name: "Blonde textured cut with a mid fade" },
  { src: cut7, name: "Wavy taper fade from the back" },
  { src: cut8, name: "Blonde burst fade with a textured top" },
  { src: cut9, name: "Hair design carved into a taper fade" },
];

function Index() {
  const [cut, setCut] = useState<Cut>(DEFAULT_CUT);
  const [viewing, setViewing] = useState<number | null>(null);

  return (
    <div className="leo">
      <header className="top">
        <div className="wrap top__in">
          <a className="mark" href="#top">
            Leo<b>'</b>s Cutz
          </a>
          <nav aria-label="Page sections">
            <a href="#build">Build your cut</a>
            <a href="#work">Recent cuts</a>
          </nav>
          <a className="btn btn--sm" href="#book">
            Book a cut
          </a>
        </div>
        <PoleBar />
      </header>

      <main>
        <section className="hero wrap" id="top">
          <HairBlock />
          <div className="hero__text">
            <FadeHeadline text={`Every cut is ${PRICE}.`} />
            <div className="hero__side">
              <OpenSign />
              <p className="lead">
                Fades, tapers and scissor cuts in Irvine, CA. Your line-up is free. So is a beard
                line-up or a hair design. Always taking new clients.
              </p>
              <div className="cta">
                <a className="btn" href="#book">
                  Book a cut
                </a>
                <span>
                  or text{" "}
                  <a className="link phone" href={`sms:${OWNER_PHONE}`}>
                    {OWNER_PHONE_DISPLAY}
                  </a>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="build" id="build">
          <div className="wrap">
            <h2>Add whatever you want. It's still {PRICE}.</h2>
            <div className="build__grid">
              <div className="pickers">
                <CutPickers cut={cut} onChange={setCut} />
                <div className="build__go">
                  <a className="btn" href="#book">
                    Book this cut
                  </a>
                  <a className="link" href="#work">
                    or pick one from a photo
                  </a>
                </div>
              </div>
              <Bill cut={cut} />
            </div>
          </div>
        </section>

        <section className="work" id="work">
          <div className="wrap">
            <div className="work__head">
              <h2>Recent cuts</h2>
              <p className="lead">
                Tap a photo to see it bigger. See one you like? Ask for it and Leo will know what
                you mean. There's more on Instagram at{" "}
                <a className="link" href={INSTAGRAM} target="_blank" rel="noreferrer">
                  @leos.cutz
                </a>
                .
              </p>
            </div>
            <div className="cuts">
              {WORK.map((photo, i) => {
                const picked = cut.photo === photo.name;
                return (
                  <figure key={photo.src} className={picked ? "cut is-picked" : "cut"}>
                    <div className="cut__pic">
                      <button
                        className="cut__open"
                        type="button"
                        aria-label={`See it bigger: ${photo.name}`}
                        onClick={() => setViewing(i)}
                      >
                        <img
                          src={photo.src}
                          alt={photo.name}
                          width={887}
                          height={1920}
                          loading="lazy"
                        />
                      </button>
                      {picked && <span className="cut__tag">On your request</span>}
                    </div>
                    <figcaption>{photo.name}</figcaption>
                    <button
                      className="pick"
                      type="button"
                      aria-pressed={picked}
                      onClick={() => setCut({ ...cut, photo: picked ? null : photo.name })}
                    >
                      {picked ? "Picked. Tap to undo" : "Ask for this cut"}
                    </button>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        <BookingSection cut={cut} />
      </main>

      <footer className="foot">
        <div className="wrap foot__grid">
          <div>
            <a className="mark" href="#top">
              Leo<b>'</b>s Cutz
            </a>
            <p style={{ marginTop: "0.6rem" }}>
              Barber in Irvine, CA.
              <br />
              {HOURS}.
            </p>
          </div>
          <ul>
            <li>
              <span>Text or call</span>
              <a className="plain" href={`tel:${OWNER_PHONE}`}>
                {OWNER_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <span>Email</span>
              <a className="plain" href={`mailto:${OWNER_EMAIL}`}>
                {OWNER_EMAIL}
              </a>
            </li>
          </ul>
          <ul>
            <li>
              <a className="link" href={INSTAGRAM} target="_blank" rel="noreferrer">
                Instagram @leos.cutz
              </a>
            </li>
            <li>
              <a className="link" href="#book">
                Book a cut
              </a>
            </li>
            <li>
              <Link to="/owner" className="owner">
                Owner login
              </Link>
            </li>
          </ul>
        </div>
      </footer>

      <PhotoViewer
        photos={WORK}
        index={viewing}
        picked={cut.photo}
        onShow={setViewing}
        onPick={(name) => setCut({ ...cut, photo: name })}
      />
    </div>
  );
}
