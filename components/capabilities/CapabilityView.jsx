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
import {
  works,
  DISCLOSURE,
  CONSTRUCTION,
} from "@/components/capabilities/works";
import {
  prefersReducedMotion,
  runSignal,
} from "@/components/capabilities/signal";

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
      const href = `/portfolio/${target.slug}`;
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

  // Warm the HTTP cache with this work's screens once the page has finished
  // loading, so opening the overlay reads the facade document from cache and
  // pays only parse and paint. Low priority and after `load` so it never
  // competes with the page itself.
  useEffect(() => {
    const warm = () => {
      for (const v of work.views) {
        fetch(`/portfolio/facade/${v.id}`, { priority: "low" }).catch(() => {});
      }
    };
    if (document.readyState === "complete") {
      warm();
      return;
    }
    window.addEventListener("load", warm, { once: true });
    return () => window.removeEventListener("load", warm);
  }, [work.views]);

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
            label="PORTFOLIO"
            meta={work.n}
            status={work.product ?? "FIRST PLACE · 2012"}
            className="marker--section"
          />

          <svg className="cap__filter" aria-hidden="true" focusable="false">
            <filter
              id="rh-signal"
              x="-18%"
              y="-18%"
              width="136%"
              height="136%"
              colorInterpolationFilters="sRGB"
            >
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

          {work.bio && (
            <div className="cap__grid cap__grid--bio" ref={panelRef}>
              <figure className="cap__portrait">
                <img
                  src={`/portfolio/${work.slug}/portrait.jpg`}
                  alt={`${work.capability}, ${work.qualifier}`}
                  width={480}
                  height={600}
                />
              </figure>
              <div className="cap__text">
                <h1 className="cap__title">
                  {work.capability}{" "}
                  <span className="cap__qualifier">{work.qualifier}</span>
                </h1>
                <p className="cap__lead">{work.lead}</p>
                {work.body.map((p) => (
                  <p key={p} className="cap__body">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!work.exhibit && !work.bio && (
            <>
              <div className="cap__grid" ref={panelRef}>
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
                        src={`/portfolio/${work.slug}/${v.n}.jpg`}
                        alt={`${work.product} — ${v.title}`}
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

                <div className="cap__text">
                  <h1 className="cap__title">
                    {work.capability}{" "}
                    <span className="cap__qualifier">{work.qualifier}</span>
                  </h1>
                  {work.construction ? (
                    <div className="cap__construction">
                      <svg
                        className="cap__cone"
                        viewBox="0 0 24 24"
                        width="128"
                        height="128"
                        aria-hidden="true"
                      >
                        <path d="M10 3h4l4.5 15H5.5z" fill="var(--signal)" />
                        <path
                          d="M8.6 8.5h6.8l.9 3H7.7zM6.9 14h10.2l.9 3H6z"
                          fill="var(--bg)"
                        />
                        <path d="M3 18h18v2H3z" fill="currentColor" />
                      </svg>
                      <p className="cap__construction-note">{CONSTRUCTION}</p>
                    </div>
                  ) : (
                    <>
                      <p className="cap__lead">{work.lead}</p>
                      {work.body?.map((p) => (
                        <p key={p} className="cap__body">
                          {p}
                        </p>
                      ))}
                    </>
                  )}

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

                  {work.disclosure !== false && (
                    <p className="cap__disclosure">{DISCLOSURE}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {work.exhibit && (
          <div ref={panelRef}>
            <StructuredLight />
          </div>
        )}
      </section>

      <nav className="cap__band" aria-label="Portfolio">
        <div className="container cap__band-inner">
          {prev ? (
            <Link
              className="cap__step"
              href={`/portfolio/${prev.slug}`}
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
                      href={`/portfolio/${w.slug}`}
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
              href={`/portfolio/${next.slug}`}
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
