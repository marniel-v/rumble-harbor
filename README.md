# Rumble Harbor

Single-page site for the Rumble Harbor software studio — _software engineering for complex systems_. Built with Next.js (App Router) and React.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

To build for production:

```bash
npm run build
npm start
```

## Brand

The site is built directly on the Rumble Harbor identity.

| Token     | Colour                 | Role                                      |
| --------- | ---------------------- | ----------------------------------------- |
| `--ink`   | `#171A19` Harbor Ink   | ~65% — the page                           |
| `--ivory` | `#F2E9DC` Warm Ivory   | ~25% — type, and the About band           |
| `--fog`   | `#A5AAA7` Fog Grey     | ~8% — secondary type, diagram structure   |
| `--coral` | `#F25F57` Signal Coral | ~2% — **the signal, used with intention** |

**Coral rule:** coral only ever appears on the pulse mark, the live `status` slot of a
signal marker, the primary button, focus rings, the contact address, a coral full stop
after a headline, and exactly one element per portfolio motif. If you're adding coral
somewhere else, you're probably overspending it.

- **Type** — three roles, wired up via `next/font` in `app/layout.js` (all self-hosted,
  no external requests):
  - **Bristone Medium** (`app/fonts/BristoneMedium.ttf`) — display only. It is
    **single-weight**, so always request `font-weight: 500`; asking for 700 makes the
    browser fake a bold. It is also **unicase** (x-height = cap height) and very
    extended (`H` is 0.958em, ~33% wider than a normal grotesque), which is why it
    never touches body copy and why headings are sized well below their old values.
  - **Inter** — paragraphs, leads, form inputs.
  - **IBM Plex Mono** — every technical label: markers, nav, buttons, chips, field
    labels, card indices.
- **Voice** — _Complexity is inevitable. Fragility isn't._ Architecture before
  abstraction. We don't just ship features, we build systems.
- **Tagline** — _Built to hold._ (alternates: _Complexity, anchored._ / _Software under
  pressure._ / _Systems that hold._)

## What's inside

- **`app/layout.js`** — declares the three fonts via `next/font` and exposes them as
  `--font-display` / `--font-body` / `--font-mono` on `<html>`, sets page metadata.
- **`app/page.js`** — composes the five sections.
- **`app/globals.css`** — all design tokens (palette, type, spacing) and section styling.
- **`app/icon.svg`** — favicon: the pulse on Harbor Ink.
- **`components/`** — one file per section: `Nav`, `Hero`, `About`, `Services`,
  `Portfolio`, `Contact`, `Footer`, plus `PulseMark` (the logo), `SignalMarker`
  (the `▸▸ LABEL / META / STATUS` eyebrow), and `Icons`.
- **`app/api/contact/route.js`** — receives contact-form submissions.

## Sections

1. **Hero** — descriptor, "Systems that hold under pressure.", the convergence field.
2. **About** — the Warm Ivory band. Voice statement plus the three pillars
   (Architecture / Control / Stability).
3. **Services** — four core modules over a faint frequency-field texture.
4. **Work** — portfolio grid, each card a line diagram carrying a single coral accent.
5. **Contact** — working form with validation.

## Things you'll want to change

- **Logo** — `components/PulseMark.jsx` holds the pulse as three vector paths on a
  `155 x 129` viewBox. Swap those three paths and everything follows: nav, footer,
  signal markers, About pillars and the hero field. `app/icon.svg` is a static asset
  and carries its own copy, so update it alongside.
- **Mark direction** — `PULSE_FLIPPED` in `components/PulseMark.jsx` mirrors the mark
  on its Y axis. It is the single switch for the whole site: flip it and the JSX
  instances take an SVG transform while `<html data-pulse>` flips the CSS-drawn
  work-card chevrons to match. `app/icon.svg` can't read it — that file has a one-line
  note showing the same flip. Individual instances can override with the `flip` prop
  (`<PulseMark flip />`) if you want both directions on screen at once.
- **Graphic language** — `PulseField` in `components/Icons.jsx` is the _convergence_
  motif. _Propagation_, _resonance_, _compression_, and _damping_ are the other forms
  in the brand's graphic language if you want variants per section.
- **Portfolio images** — the cards currently render inline SVG motifs. To use photos,
  replace `<Motif />` in `components/Portfolio.jsx` with an `<img>` / `next/image`
  pointing at `public/work/`.
- **Contact delivery** — `app/api/contact/route.js` currently logs submissions. Plug in
  an email provider (Resend, Postmark, SendGrid, Nodemailer) where the comment marks
  the spot.

## Notes

- Fully responsive down to mobile (nav collapses to a menu, grids stack).
- Respects `prefers-reduced-motion` and has visible keyboard focus styles.
