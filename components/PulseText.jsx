"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 3; // seconds for the front to cross the whole block
const AMP = 6; // peak displacement at the crest, px
const WIDTH = 110; // half-width of the wavefront, px — how thick the pulse is
const RIPPLE = 2.2; // push-then-pull cycles across the front
const DOWN = 0.4; // downward bias added to the radial direction
const SPAN = WIDTH * 3;
const TAIL = WIDTH * 1.6; // front is past the last glyph by a still-visible margin
const RAMP = 24;
const PAD = 32;
const VISIBLE = 0.25;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

function parseRGB(css) {
  if (css.startsWith("#")) {
    const n = parseInt(css.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  return css
    .match(/[\d.]+/g)
    .slice(0, 3)
    .map(Number);
}

function buildRamp(from, to) {
  return Array.from({ length: RAMP }, (_, k) => {
    const t = k / (RAMP - 1);
    const [r, g, b] = from.map((v, i) => Math.round(v + (to[i] - v) * t));
    return `rgb(${r},${g},${b})`;
  });
}

export default function PulseText({ children, className = "" }) {
  const blockRef = useRef(null);
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    const block = blockRef.current;
    const canvas = canvasRef.current;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let glyphs = [];
    let nearest = 0;
    let reach = 0;
    let start = 0; // timestamp of the strike
    let raf = 0;
    let cancelled = false;

    function measure() {
      const blockRect = block.getBoundingClientRect();
      const blockW = block.clientWidth;
      const blockH = block.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.ceil((blockW + PAD * 2) * dpr);
      canvas.height = Math.ceil((blockH + PAD * 2) * dpr);
      canvas.style.width = `${blockW + PAD * 2}px`;
      canvas.style.height = `${blockH + PAD * 2}px`;

      ctx.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
      ctx.textBaseline = "alphabetic";

      const originX = window.innerWidth / 2 - blockRect.left;

      if (blockRect.top < window.innerHeight / 2) {
        var originY = 0;
      } else {
        var originY = window.innerHeight / 2 - blockRect.top;
      }

      glyphs = [];
      reach = 0;
      nearest = Infinity;

      const range = document.createRange();
      const coral = parseRGB(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--coral")
          .trim(),
      );

      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent;
        if (text.trim() === "") continue;

        const cs = getComputedStyle(node.parentElement);
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
        const ramp = buildRamp(parseRGB(cs.color), coral);

        ctx.font = font;
        ctx.letterSpacing = cs.letterSpacing;

        const ascent = ctx.measureText("x").fontBoundingBoxAscent;

        for (let i = 0; i < text.length; ) {
          const ch = String.fromCodePoint(text.codePointAt(i));
          i += ch.length;
          if (ch.trim() === "") continue;

          range.setStart(node, i - ch.length);
          range.setEnd(node, i);
          const r = range.getBoundingClientRect();

          const gx = r.left - blockRect.left;
          const gy = r.top - blockRect.top + ascent;

          const dx = gx - originX;
          const dy = gy - originY;
          const dist = Math.hypot(dx, dy) || 1;
          const uy = dy / dist + DOWN;
          const len = Math.hypot(dx / dist, uy) || 1;

          glyphs.push({
            ch,
            x: gx,
            y: gy,
            font,
            ramp,
            dist,
            ux: dx / dist / len,
            uy: uy / len,
          });
          if (dist > reach) reach = dist;
          if (dist < nearest) nearest = dist;
        }
      }

      if (nearest === Infinity) nearest = 0; // nothing to draw
    }

    function frame(now) {
      const progress = clamp01((now - start) / (DURATION * 1000));
      const eased = 1 - (1 - progress) ** 2.2;
      const front = nearest - SPAN + eased * (reach - nearest + SPAN * 2);

      if (progress >= 1 || front >= reach + TAIL) {
        setPhase("settled");
        ro.disconnect();
        return;
      }
      setPhase("running");

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      let font = null;
      let color = null;
      for (const g of glyphs) {
        if (g.font !== font) {
          font = g.font;
          ctx.font = font;
        }

        const s = (g.dist - front) / WIDTH;
        const env = s * s > 9 ? 0 : Math.exp(-s * s);

        const next = g.ramp[Math.round(env * (RAMP - 1))];
        if (next !== color) {
          color = next;
          ctx.fillStyle = color;
        }

        if (env === 0) {
          ctx.fillText(g.ch, g.x, g.y);
          continue;
        }

        const mag = AMP * env * Math.cos(s * RIPPLE);
        ctx.fillText(g.ch, g.x + g.ux * mag, g.y + g.uy * mag);
      }

      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => glyphs.length && measure());

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        document.fonts.ready.then(() => {
          if (cancelled) return;
          measure();
          ro.observe(block);
          raf = requestAnimationFrame((now) => {
            start = now;
            frame(now);
          });
        });
      },
      { threshold: VISIBLE },
    );
    io.observe(block);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className={`pulse-text ${className}`.trim()}
      data-phase={phase}
      ref={blockRef}
    >
      {children}
      <canvas
        className="pulse-text__canvas"
        ref={canvasRef}
        aria-hidden="true"
      />
    </div>
  );
}
