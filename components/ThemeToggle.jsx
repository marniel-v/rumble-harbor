"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/Icons";

/**
 * Theme control.
 *
 * The system preference is the default and stays live — while the visitor has
 * made no choice, flipping the OS between light and dark flips the page with
 * it. Pressing this button is that choice: it pins a theme in localStorage and
 * the system stops being consulted.
 *
 * `data-theme` is already on <html> before first paint (see the inline script
 * in app/layout.js), so this component only ever reads it back — it must not
 * be the thing that sets the initial theme, or the page flashes.
 */
export const THEME_KEY = "rh-theme";

export default function ThemeToggle() {
  // Deliberately not seeded from localStorage: the server can't read it, so
  // seeding here would mismatch on hydrate. The effect below fills it in.
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = (e) => {
      // A pinned choice outranks the system.
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {
        // Storage blocked — nothing is pinned, so follow the system.
      }
      const next = e.matches ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const flip = () => {
    const next = theme === "light" ? "dark" : "light";
    const root = document.documentElement;

    root.classList.add("theme-anim");
    root.dataset.theme = next;
    window.setTimeout(() => root.classList.remove("theme-anim"), 320);

    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode / storage disabled: the flip still applies, it just
      // won't survive a reload.
    }
    setTheme(next);
  };

  const label = theme === "light" ? "Switch to dark theme" : "Switch to light";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={flip}
      title={label}
      aria-label={label}
    >
      {theme === "light" ? <IconMoon /> : <IconSun />}
    </button>
  );
}
