"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@/components/Icons";

export const THEME_KEY = "rh-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = (e) => {
      try {
        if (localStorage.getItem(THEME_KEY)) return;
      } catch {}
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
    } catch {}
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
