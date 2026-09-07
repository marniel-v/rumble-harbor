"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import PulseMark from "@/components/PulseMark";
import SignalMarker from "@/components/SignalMarker";
import StructuredLight from "@/components/StructuredLight";
import FacadeOverlay from "@/components/capabilities/FacadeOverlay";
import { works, DISCLOSURE } from "@/components/capabilities/works";
import {
  prefersReducedMotion,
  runSignal,
} from "@/components/capabilities/signal";

/**
 * One work: the filmstrip of its own screens on the left, the claim on the
 * right, the live facade over the top of both.
 *
 * Hovering a frame does not open anything — it highlights the matching line in
 * the claim, and the reverse. Opening is a click. An overlay that appears on
 * hover cannot be moved into, read, or scrolled, and is dead on touch.
 *
 * The transition between works hands off through sessionStorage: the outgoing
 * page dissolves its claim into the noise field and then navigates, and the
 * incoming page reads the flag and resolves the same front back into type. See
 * signal.js for how the panel is broken up and put back together.
 */

const HANDOFF = "rh-cap-front";

export default function CapabilityView({ work, prev, next }) {
  const router = useRouter();
  const panelRef = useRef(null);
  const dispRef = useRef(null);
  const turbRef = useRef(null);
  const [open, setOpen] = useState(null);
  const [active, setActive] = useState(0);

  const parts = () => ({
    panel: panelRef.current,
    disp: dispRef.current,
    turb: turbRef.current,
  });

  // Resolve in. Layout effect so the arriving panel is already broken up on the
  // first paint — a formed frame before the animation starts reads as a flash,
  // not as an arrival.
  useLayoutEffect(() => {
    let back;
    try {
      back = sessionStorage.getItem(HANDOFF);
      if (back) sessionStorage.removeItem(HANDOFF);
    } catch {
      return;
    }
    if (!back || prefersReducedMotion() || !panelRef.current) return;

    panelRef.current.style.opacity = "0";
    runSignal({ ...parts(), mode: "in", back: back === "back" });
  }, [work.slug]);

  const go = useCallback(
    async (target, back) => {
      if (!target) return;
      const href = `/capabilities/${target.slug}`;
      if (prefersReducedMotion() || !panelRef.current) {
        router.push(href);
        return;
      }
      try {
        sessionStorage.setItem(HANDOFF, back ? "back" : "fwd");
      } catch {}
      await runSignal({ ...parts(), mode: "out", back });
      router.push(href);
    },
    [router],
  );

  // Page-level arrows move between works; the overlay takes them over while it
  // is open, so the two never both fire.
  useEffect(() => {
    if (open !== null) return;
    const onKey = (e) => {
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(next, false);
      else if (e.key === "ArrowLeft") go(prev, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, next, prev]);

  const nav = (target, back) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(target, back);
  };

  return (
    <>
      <section
        className="cap section"
        data-exhibit={work.exhibit ? "" : undefined}
      >
        <div className="container">
          <SignalMarker
            label="CAPABILITY"
            meta={work.n}
            status={work.product ?? "FIRST PLACE · 2012"}
            className="marker--section"
          />

          {/* The filter the transition drives. Attached to the panel only
              while it runs — a permanent filter costs a compositing layer and softens
              the text under it. */}
          <svg className="cap__filter" aria-hidden="true" focusable="false">
            <filter
              id="rh-signal"
              x="-18%"
              y="-18%"
              width="136%"
              height="136%"
              colorInterpolationFilters="sRGB"
            >
              {/* Anisotropic on purpose: slow across, fast down, so the
                  displacement tears the panel into horizontal bands instead of
                  fogging it evenly. */}
              <feTurbulence
                ref={turbRef}
                type="fractalNoise"
                baseFrequency="0.0016 0.045"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="noise"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </svg>

          {/* The exhibit has no facade behind it, so it has no filmstrip,
              no overlay and no disclosure — it renders the real thing. */}
          {!work.exhibit && (
            <>
              <div className="cap__grid" ref={panelRef}>
                {/* Left: this work's screens, and only this work's. */}
                <div className="cap__strip" key={work.slug}>
                  {work.views.map((v, i) => (
                    <button
                      key={v.id}
                      className="cap__frame"
                      style={{ "--i": i }}
                      data-active={active === i ? "" : undefined}
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setOpen(i)}
                      aria-label={`Open ${v.title}`}
                    >
                      <img
                        src={`/capabilities/${work.slug}/${v.n}.jpg`}
                        alt=""
                        width={480}
                        height={300}
                        loading={i > 1 ? "lazy" : undefined}
                      />
                      <span className="cap__frame-n">{v.n}</span>
                    </button>
                  ))}
                  <p className="cap__strip-hint">
                    {work.views.length} screens · click to open live
                  </p>
                </div>

                {/* Right: what is being claimed, and what each screen shows. */}
                <div className="cap__text">
                  {/* One heading, set as two. The qualifier stays inside the
                      h1 so the accessible name is still the whole claim —
                      the split is typographic, not structural. */}
                  <h1 className="cap__title">
                    {work.capability}{" "}
                    <span className="cap__qualifier">{work.qualifier}</span>
                  </h1>
                  <p className="cap__lead">{work.lead}</p>
                  {work.body?.map((p) => (
                    <p key={p} className="cap__body">
                      {p}
                    </p>
                  ))}

                  {/* Closes the prose: the claim, then what part of it was
                      actually mine. Everything below this line is about the
                      screens rather than about the work. */}
                  {work.role && (
                    <div className="cap__role">
                      <span className="cap__role-label">
                        <PulseMark size={8} inline />
                        ROLE
                      </span>
                      <p className="cap__role-line">
                        {work.role.title} · {work.role.team} · {work.role.span}
                      </p>
                      <p className="cap__role-scope">{work.role.scope}</p>
                    </div>
                  )}
                </div>

                {/* The screen list is its own grid child rather than the tail
                    of the claim, so the narrow layout can put the filmstrip
                    between the two — the notes name frames, and stacked they
                    have to follow the frames they name. On desktop it sits
                    under the claim in the same column and reads as one block. */}
                <div className="cap__notes">
                  <ul className="cap__views">
                    {work.views.map((v, i) => (
                      <li
                        key={v.id}
                        className="cap__view"
                        data-active={active === i ? "" : undefined}
                        onMouseEnter={() => setActive(i)}
                      >
                        <button
                          className="cap__view-hit"
                          onClick={() => setOpen(i)}
                        >
                          <span className="cap__view-n">{v.n}</span>
                          <span className="cap__view-title">{v.title}</span>
                        </button>
                        <p className="cap__view-note">{v.note}</p>
                      </li>
                    ))}
                  </ul>

                  <p className="cap__disclosure">{DISCLOSURE}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* The exhibit is its own panel for the transition. */}
        {work.exhibit && (
          <div ref={panelRef}>
            <StructuredLight />
          </div>
        )}
      </section>

      {/* The run, which is this page's footer — the site footer is deliberately
          not rendered here. Pinned to the bottom of the window so the way into
          the next capability is always in reach rather than something you have
          to scroll to the end of the argument to find.

          Every tick shows, including the works with no page yet: the length of
          the set is not something to hide.

          The run is a line, so the ends are real ends: no back step on the
          first work, no forward step on the last. The absent one leaves a
          spacer rather than collapsing, or the ticks would slide off centre at
          either end of the set. */}
      <nav className="cap__band" aria-label="Capabilities">
        <div className="container cap__band-inner">
          {prev ? (
            <Link
              className="cap__step"
              href={`/capabilities/${prev.slug}`}
              onClick={nav(prev, true)}
            >
              ← {prev.short}
            </Link>
          ) : (
            <span className="cap__step" aria-hidden="true" />
          )}

          <ol className="cap__ticks">
            {works.map((w) => {
              const here = w.slug === work.slug;
              return (
                <li key={w.slug}>
                  {w.ready ? (
                    <Link
                      className="cap__tick"
                      href={`/capabilities/${w.slug}`}
                      onClick={nav(w, w.n < work.n)}
                      data-here={here ? "" : undefined}
                      aria-current={here ? "page" : undefined}
                    >
                      <span>{w.n}</span>
                    </Link>
                  ) : (
                    <span className="cap__tick" data-soon="">
                      <span>{w.n}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {next ? (
            <Link
              className="cap__step cap__step--next"
              href={`/capabilities/${next.slug}`}
              onClick={nav(next, false)}
            >
              {next.short} →
            </Link>
          ) : (
            <span className="cap__step" aria-hidden="true" />
          )}
        </div>
      </nav>

      {open !== null && (
        <FacadeOverlay
          work={work}
          index={open}
          onIndex={(i) => {
            setOpen(i);
            setActive(i);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
