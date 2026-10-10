import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BookingSection } from "@/components/BookingSection";
import { CutPickers } from "@/components/CutPickers";
import { DEFAULT_CUT, type Cut } from "@/lib/booking";

export const Route = createFileRoute("/embed")({
  head: () => ({
    meta: [
      { title: "Book a Cut — Leo's Cutz" },
      {
        name: "description",
        content: "Embeddable booking form for Leo's Cutz — $25 haircuts in Irvine, CA.",
      },
      { property: "og:title", content: "Book a Cut — Leo's Cutz" },
      { property: "og:description", content: "Request a $25 cut with Leo in Irvine, CA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Embed,
});

function Embed() {
  const [cut, setCut] = useState<Cut>(DEFAULT_CUT);

  return (
    <div className="leo">
      <section className="build build--embed" id="build">
        <div className="wrap pickers">
          <CutPickers cut={cut} onChange={setCut} />
        </div>
      </section>
      <BookingSection cut={cut} />
    </div>
  );
}
