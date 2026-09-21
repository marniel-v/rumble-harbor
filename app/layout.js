import localFont from "next/font/local";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { PULSE_FLIPPED } from "@/components/PulseMark";
import "./globals.css";

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
  title: "Rumble Harbor — From Signal to System",
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
