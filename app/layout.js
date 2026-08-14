import localFont from "next/font/local";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { PULSE_FLIPPED } from "@/components/PulseMark";
import "./globals.css";

/**
 * Bristone Medium — the brand display face. Single weight, unicase, and very
 * extended (cap 'H' is 0.958em), so it is headings only: never body copy, and
 * never asked for a weight other than 500 or the browser fakes a bold.
 */
const bristone = localFont({
  src: "./fonts/BristoneMedium.ttf",
  weight: "500",
  style: "normal",
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

/**
 * Runs before first paint, ahead of React: resolves the theme from a pinned
 * choice, falling back to the system preference, and stamps it on <html> so
 * the page never renders in one theme and corrects to the other.
 *
 * The key must match THEME_KEY in components/ThemeToggle.jsx.
 */
const themeScript = `
(function () {
  try {
    var pinned = localStorage.getItem("rh-theme");
    var theme =
      pinned === "light" || pinned === "dark"
        ? pinned
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export const metadata = {
  title: "Rumble Harbor — Software Engineering for Complex Systems",
  description:
    "Complexity is inevitable. Fragility isn't. Rumble Harbor builds software systems that hold under pressure — across web, mobile, and cloud.",
};

export default function RootLayout({ children }) {
  return (
    // data-theme is rewritten by themeScript before hydration; React must not
    // treat that as a mismatch.
    <html
      lang="en"
      suppressHydrationWarning
      data-pulse={PULSE_FLIPPED ? "flipped" : "normal"}
      data-theme="dark"
      className={`${bristone.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
