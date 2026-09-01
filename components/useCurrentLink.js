"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Which nav link the reader is currently at.
 *
 * Two different questions wearing one answer. A route link is current when the
 * pathname matches, which the router already knows. A hash link is current when
 * its section is the one under the nav — and nothing knows that, because the
 * URL does not change as you scroll — so it is tracked here.
 *
 * In document order, and only the sections both navs actually link. A reader
 * inside an unlinked stretch of the page keeps the last linked section lit,
 * because that is still the one they are reading out of.
 */
const SECTIONS = ["about", "services", "work", "testimonials", "contact"];

export default function useCurrentLink() {
  const pathname = usePathname();
  const [section, setSection] = useState(null);

  useEffect(() => {
    // The sections only exist on the home page; anywhere else there is nothing
    // to spy on and the route half of the answer carries it alone.
    if (pathname !== "/") {
      setSection(null);
      return;
    }

    // The probe sits just under the fixed bar, so a section becomes current the
    // moment its own top slides out of sight behind it.
    const navH =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
        10,
      ) || 64;
    const probe = navH + 24;

    const onScroll = () => {
      const tops = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top : Infinity;
      });

      // The last section to have passed the probe. Nothing is lit above the
      // first of them, which is the whole of the hero.
      let i = -1;
      while (i + 1 < tops.length && tops[i + 1] <= probe) i += 1;

      // The final section is short enough that its top may never reach the
      // probe, so reaching the bottom of the page counts as being in it.
      const atEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;

      setSection(atEnd ? SECTIONS[SECTIONS.length - 1] : (SECTIONS[i] ?? null));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /* The aria-current value for a link, or undefined when it is not the current
     one — React drops the attribute entirely, so the CSS can key off its mere
     presence. "page" is the route match; "location" is the section, which is
     the value ARIA defines for a position within a page rather than a
     destination. */
  return (href) => {
    if (href.startsWith("/capabilities")) {
      return pathname.startsWith("/capabilities") ? "page" : undefined;
    }
    const hash = href.split("#")[1];
    return hash && hash === section ? "location" : undefined;
  };
}
