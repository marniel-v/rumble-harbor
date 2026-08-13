# Rumble Harbor

Single-page site for the Rumble Harbor custom software studio. Built with Next.js (App Router) and React.

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

## What's inside

- **`app/layout.js`** — loads the fonts (Michroma for display, Inter for body) via `next/font`, sets page metadata.
- **`app/page.js`** — composes the four sections.
- **`app/globals.css`** — all design tokens (colours, type, spacing) and section styling, including the static ripple.
- **`components/`** — one file per section: `Nav`, `Hero`, `Services`, `Portfolio`, `Contact`, `Footer`, plus `WaveMark` (logo) and `Icons`.
- **`app/api/contact/route.js`** — receives contact-form submissions.

## Sections

1. **Hero** — name, statement, calls to action.
2. **Services** — what we do, with the left-edge gradient ripple.
3. **Work** — portfolio grid (image-ready cards).
4. **Contact** — working form with validation.

## Things you'll want to change

- **Logo** — `components/WaveMark.jsx` is a placeholder wave mark. Drop your real logo SVG in here.
- **Typeface** — display type uses **Michroma** (a free Google Font, the closest web-embeddable match to Bank Gothic). If you license Bank Gothic, self-host it and replace the `Michroma` import in `app/layout.js` and the `--font-display` references.
- **Colours** — every colour is a token at the top of `app/globals.css` (`--bg`, `--blue`, `--cyan`, …).
- **Portfolio images** — set the `image` field for each project in `components/Portfolio.jsx` to a path like `/work/fintech.jpg` (put files in `public/work/`). Cards render a placeholder until then.
- **Contact delivery** — `app/api/contact/route.js` currently logs submissions. Plug in an email provider (Resend, Postmark, SendGrid, Nodemailer) where the comment marks the spot.

## Notes

- Fully responsive down to mobile (nav collapses to a menu, grids stack).
- Respects `prefers-reduced-motion` and has visible keyboard focus styles.
