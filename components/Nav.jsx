"use client";

import { useState, useEffect } from "react";
import PulseMark from "@/components/PulseMark";
import ThemeToggle from "@/components/ThemeToggle";
import { IconMenu, IconClose } from "@/components/Icons";

const links = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__inner">
        <a href="#top" className="nav__brand" aria-label="Rumble Harbor home">
          <span className="nav__name">
            Ru
            <PulseMark inline />
            ble Harbor
          </span>
        </a>

        {/* Links collapse into the mobile sheet; the theme control never does
            — it stays reachable at every width. */}
        <div className="nav__end">
          <nav className="nav__links" aria-label="Primary">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="nav__link">
                {l.label}
              </a>
            ))}
          </nav>

          <ThemeToggle />

          <button
            className="nav__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="nav__mobile" aria-label="Mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav__mobile-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
