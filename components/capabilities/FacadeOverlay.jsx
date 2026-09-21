"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { DISCLOSURE } from "@/components/capabilities/works";
import { IconClose } from "@/components/Icons";

const NATIVE_W = 1440;
const NATIVE_H = 900;

export default function FacadeOverlay({ work, index, onIndex, onClose }) {
  const stageRef = useRef(null);
  const dialogRef = useRef(null);
  const [fit, setFit] = useState(0);
  const [actual, setActual] = useState(false);
  const [note, setNote] = useState(true);
  const [loadedId, setLoadedId] = useState(null);

  const view = work.views[index];
  const count = work.views.length;

  const step = useCallback(
    (d) => onIndex((index + d + count) % count),
    [index, count, onIndex],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const read = () =>
      setFit(
        Math.min(stage.clientWidth / NATIVE_W, stage.clientHeight / NATIVE_H),
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
          <span className="facade__id">
            <b>{work.product}</b>
            <i>/</i>
            <span className="facade__id-view">
              {view.n} · {view.title}
            </span>
          </span>

          {work.disclosure !== false && (
            <span className="facade__note">{DISCLOSURE}</span>
          )}

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
              src={`/portfolio/facade/${view.id}`}
              width={NATIVE_W}
              height={NATIVE_H}
              loading="lazy"
              sandbox="allow-same-origin"
              onLoad={() => setLoadedId(view.id)}
              style={{
                transform: `scale(${scale})`,
                opacity: fit && loadedId === view.id ? 1 : 0,
              }}
            />
          </div>
        </div>

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
