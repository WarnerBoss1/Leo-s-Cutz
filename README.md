# Leo's Cutz — booking site

Single-page barbershop site in red, blue and black. It has a hair block you can cut and dye,
a neon sign that shows if Leo is open right now, a "build your cut" picker, a photo wall
with a full-size viewer, a booking form, and a private owner dashboard. Built with TanStack Start
(React + TypeScript + Tailwind v4).

## What's inside

| Path | What it is |
| --- | --- |
| `src/routes/index.tsx` | Landing page: hair block, headline, build your cut, photo wall, booking form |
| `src/routes/embed.tsx` | Cut picker + booking form only, for dropping into a Shopify page |
| `src/routes/owner.tsx` | Your dashboard at `/owner` — sign up once, then confirm or cancel requests |
| `src/components/HairBlock.tsx` + `src/lib/hair.ts` | The hair at the top of the page: cutting, guards, fade height, dye colors |
| `src/lib/buzz.ts` | The clipper sound (off until a visitor turns it on) |
| `src/components/OpenSign.tsx` | The neon OPEN / CLOSED sign |
| `src/components/PoleBar.tsx` | The barber pole under the top bar that turns when you scroll |
| `src/components/FadeHeadline.tsx` | The big headline that goes from thin to bold |
| `src/components/PhotoViewer.tsx` | The full-size photo viewer |
| `src/components/CutPickers.tsx` | The cut chips and the $25 bill |
| `src/components/BookingSection.tsx` | The booking form |
| `src/lib/booking.ts` | Price, cut names, phone, email, hours — edit them here |
| `src/leo.css` | The look of the public pages |
| `src/styles.css` | Colors and fonts shared with the dashboard |
| `src/assets/` | Your 9 cut photos |
| `supabase/migrations/` | The database schema (already applied to your live database) |
| `wrangler.jsonc` | Free-hosting deploy config |

## Run it on your computer

Needs Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the address it prints (usually `http://localhost:5173`).

## Host it for free (Cloudflare)

The build is already set up for Cloudflare Workers, which has a free tier with no
card required.

```sh
npm install
npm run build          # produces dist/
npx wrangler login     # opens your browser once
npx wrangler deploy    # publishes it and prints your live URL
```

To check the production build before publishing:

```sh
npx wrangler dev
```

Your live URL looks like `https://leos-cutz.<your-account>.workers.dev`.

To use your own domain instead: Cloudflare dashboard → Workers & Pages → your
worker → Settings → Domains and routes → Add custom domain.

## Put it in Shopify

Option A — booking form inside a Shopify page:
Shopify admin → Online Store → Pages → Add page → click the `<>` (Show HTML)
button in the editor toolbar → paste:

```html
<iframe src="https://YOUR-LIVE-URL/embed" style="width:100%;height:1100px;border:0"></iframe>
```

Option B — link out:
Online Store → Navigation → add a menu item "Book a cut" pointing at
`https://YOUR-LIVE-URL`.

## Your dashboard

Visit `https://YOUR-LIVE-URL/owner`, create an account with
`29chavezleo@gmail.com`, and every booking shows up there. Only that account
can see them.

## The database

`.env` already points at your database, so bookings from any host land in the
same place your dashboard reads. The keys in it are public keys — safe to ship.

## Changing things

- Price, cut names, phone, email: `src/lib/booking.ts`
- Hours: `OPEN_HOUR` and `CLOSE_HOUR` in `src/lib/booking.ts`. The neon sign and the
  hours text both follow them.
- Hair dye colors and fade heights: the `DYES` and `FADE_START` lists in `src/lib/hair.ts`
- Colors: the list at the top of `src/leo.css` (and `src/styles.css` for the dashboard)
- Fonts: the Google Fonts link in `src/routes/__root.tsx`
- The words shaved into the hair: the `words` setting in `src/lib/hair.ts`
- Photos: drop new files in `src/assets/`, import them at the top of
  `src/routes/index.tsx`, and add them to the `WORK` list with a short name.
- Reviews: the page does not show reviews right now. The old review text is still in
  `src/lib/booking.ts`. Only post a review if a real client wrote it.

## What a booking sends

The form asks for a name, phone, day, time, and optional email and notes. When someone
taps "Send booking request", two things happen:

1. The request is saved to the database, with the day and time they asked for. It shows
   up on the dashboard.
2. Their texting app opens with a message to Leo already written, like this:

   ```
   Hi Leo, this is Sam Rivera.
   I'd like a mid fade with a line-up and beard line-up, like your photo "Curly top with a low fade".
   Are you free Monday, Oct 12 at 4:30 PM?
   ```

   They still have to hit send. A website can't send a text from someone's phone by itself.
   If the app doesn't open, the page shows an "Open my texts" button.

To change the wording of the text, edit `textForLeo` in `src/lib/booking.ts`.
