"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DISCLOSURE } from "@/components/capabilities/works";
import { IconClose } from "@/components/Icons";

/**
 * The facade itself, live, in an iframe — not a screenshot of it.
 *
 * That distinction is the whole point of this overlay. The screens are dense
 * business UI whose argument lives in 11px numerals, and a still of one scaled
 * into a panel is a postage stamp. Served as the document it actually is, the
 * text is real text: selectable, zoomable, and checkable. A viewer who wants to
 * add up the column can add up the column.
 *
 * So the frame is laid out at the size the screen was built for and scaled to
 * fit, never reflowed — and "1:1" drops the scale to 1 and lets the stage
 * scroll, which is the only way the smallest type is honestly legible.
 *
 * The disclosure lives here, on the chrome around the frame, and never inside
 * the facade markup. The facades carry no disclaimer text by design: they have
 * to photograph as product screens.
 */

const NATIVE_W = 1440;
const NATIVE_H = 900;

export default function FacadeOverlay({ work, index, onIndex, onClose }) {
  const stageRef = useRef(null);
  const dialogRef = useRef(null);
  const [fit, setFit] = useState(0);
  const [actual, setActual] = useState(false);
  const [note, setNote] = useState(true);

  const view = work.views[index];
  const count = work.views.length;

  const step = useCallback(
    (d) => onIndex((index + d + count) % count),
    [index, count, onIndex],
  );

  // Measure the stage and derive the fit scale from it. Layout effect so the
  // frame never paints once at the wrong size and then corrects.
  //
  // Read live off the element rather than from the observer's contentRect, and
  // re-run when `actual` flips: toggling to 1:1 turns the stage into a scroll
  // container, and the scrollbar it may take changes the width that "Fit" then
  // has to fit into. The extra rAF read covers the first frame, before the bar
  // and the frame have finished resolving.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const read = () =>
      setFit(
        Math.min(
          stage.clientWidth / NATIVE_W,
          stage.clientHeight / NATIVE_H,
        ),
      );

    read();
    const raf = requestAnimationFrame(read);
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [actual]);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && count > 1) step(1);
      else if (e.key === "ArrowLeft" && count > 1) step(-1);
    };
    document.addEventListener("keydown", onKey);
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = scrollLock;
    };
  }, [onClose, step, count]);

  const scale = actual ? 1 : fit;

  return (
    <div
      className="facade"
      role="dialog"
      aria-modal="true"
      aria-label={`${work.product}, ${view.title}`}
    >
      <button
        className="facade__scrim"
        onClick={onClose}
        aria-label="Close facade"
        tabIndex={-1}
      />

      <div className="facade__shell" ref={dialogRef} tabIndex={-1}>
        <header className="facade__bar">
          {/* The view title is its own element so it can truncate. As a bare
              text node it was an anonymous flex item, which cannot take
              text-overflow, and the bar overflowed instead. */}
          <span className="facade__id">
            <b>{work.product}</b>
            <i>/</i>
            <span className="facade__id-view">
              {view.n} · {view.title}
            </span>
          </span>

          <span className="facade__note">{DISCLOSURE}</span>

          <span className="facade__tools">
            {count > 1 && (
              <>
                <button
                  className="facade__btn"
                  onClick={() => step(-1)}
                  aria-label="Previous view"
                >
                  ←
                </button>
                <span className="facade__count">
                  {index + 1} / {count}
                </span>
                <button
                  className="facade__btn"
                  onClick={() => step(1)}
                  aria-label="Next view"
                >
                  →
                </button>
              </>
            )}
            <button
              className="facade__btn"
              onClick={() => setNote((v) => !v)}
              aria-pressed={note}
            >
              NOTE
            </button>
            <button
              className="facade__btn facade__btn--wide"
              onClick={() => setActual((v) => !v)}
              aria-pressed={actual}
            >
              {actual ? "Fit" : "1:1"}
            </button>
            <button
              className="facade__btn facade__btn--close"
              onClick={onClose}
              aria-label="Close"
            >
              <IconClose />
            </button>
          </span>
        </header>

        <div
          className="facade__stage"
          data-actual={actual ? "" : undefined}
          ref={stageRef}
        >
          {/* Sized to the scaled footprint so the scaled frame still centres and,
              at 1:1, still drives the scroll extent. */}
          <div
            className="facade__fit"
            style={{
              width: NATIVE_W * scale,
              height: NATIVE_H * scale,
            }}
          >
            <iframe
              className="facade__frame"
              title={`${work.product}, ${view.title}`}
              src={`/capabilities/facade/${view.id}`}
              width={NATIVE_W}
              height={NATIVE_H}
              loading="lazy"
              sandbox="allow-same-origin"
              style={{ transform: `scale(${scale})`, opacity: fit ? 1 : 0 }}
            />
          </div>
        </div>

        {/* The same note the capability page runs beside this screen, kept with
            the screen it is about. The notes are written to be read against the
            thing — "three levels of the same data, all wanted on one screen" is
            an instruction about where to look — and the page they live on is
            behind the overlay for exactly as long as you are looking.

            Floated over the stage rather than added as a footer, because the
            fit scale is min(stageW/1440, stageH/900) and on any laptop it is
            the height that binds: a strip of chrome would come off the size of
            the screen it annotates. This way it costs the facade nothing, and
            NOTE in the bar clears it when it sits over something you want.

            Keyed on the view so stepping through a work re-states the note
            rather than swapping text under a box that never moved. */}
        {note && (
          <div className="facade__caption" key={view.id}>
            <span className="facade__caption-n">{view.n}</span>
            <h2 className="facade__caption-title">{view.title}</h2>
            <p className="facade__caption-note">{view.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
