"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PulseText — a pulse that travels through its text once, the first time it
 * comes into view.
 *
 * The usual way to animate individual letters is to split the text into a
 * <span> per glyph. That hands the browser a thousand extra layout boxes,
 * re-runs line breaking whenever they move, and destroys selection and
 * copy-paste. A canvas has no layout at all, so the letters are free to move.
 *
 * The catch is knowing where to draw them, and the answer is that the browser
 * has already worked it out: the children are ordinary elements, laid out
 * normally. One Range per character reads back the position the browser gave
 * it — kerning, line breaks, bidi and all — as a single batch of layout reads.
 * After that the per-frame loop is pure arithmetic and never touches the DOM.
 *
 * While the pulse is passing, the text is hidden with -webkit-text-fill-color
 * (which leaves `color` readable, and is what the canvas draws with) and the
 * overlaid canvas draws the same letters displaced and tinted toward coral.
 * Once the pulse clears the block the canvas is hidden, the real text comes
 * back, and the loop stops for good — so what's left is selectable, themeable,
 * zoomable text rather than a bitmap of it.
 *
 * Strictly additive: the text renders normally on the server and stays that way
 * until the canvas has something to show. No JS, no canvas, reduced motion, a
 * font that never loads — all land on plain text.
 *
 * Wraps whatever you give it and takes its type from the host, so the children
 * should be styled by the surrounding section, not by this component:
 *
 *   <PulseText>
 *     <p>…</p>
 *     <p>…</p>
 *   </PulseText>
 *
 * It renders a real <div>, which is free inside a block container but not
 * inside a flex or grid one: there the wrapper becomes the item and the
 * children stop participating in the parent's layout. Pass a className that
 * restores it — see .hero__pulse, which re-centres Hero's column. The symptom
 * is boxes sitting flush left while their text still looks centred, because
 * text-align inherits through the wrapper and box alignment doesn't.
 */

/**
 * The pulse. A gaussian wavefront leaves a point above the text, on the
 * viewport's centre line, and expands; a letter is displaced only while the
 * front is passing over it, so the block settles behind the wave on its own.
 */
const DURATION = 3; // seconds for the front to cross the whole block
const AMP = 6; // peak displacement at the crest, px
const WIDTH = 110; // half-width of the wavefront, px — how thick the pulse is
const RIPPLE = 2.2; // push-then-pull cycles across the front
const DOWN = 0.4; // downward bias added to the radial direction

/**
 * Where the gaussian is close enough to zero to skip. The front starts this far
 * before the first letter and finishes this far past the last, so every glyph
 * is provably at rest on the first and last frame — otherwise they'd snap.
 */
const SPAN = WIDTH * 3;

/** Steps in the rest-colour → coral ramp. Enough to look continuous. */
const RAMP = 24;

/** Room for letters to be thrown past the block's own bounds without clipping.
 *  Must match the offsets on .pulse-text__canvas. */
const PAD = 32;

/** How much of the block must be on screen before the pulse is struck. */
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

/** Precomputed so the draw loop sets fillStyle from a string it already has. */
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
  // "idle" until the canvas has something to paint, so the plain text is what
  // shows if we never get there.
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    const block = blockRef.current;
    const canvas = canvasRef.current;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    let glyphs = [];
    // Distance from the strike point to the nearest and furthest letters. The
    // origin can be outside the block, so the near edge isn't necessarily zero.
    let nearest = 0;
    let reach = 0;
    let start = 0; // timestamp of the strike
    let raf = 0;
    let cancelled = false;

    // Everything the canvas needs to repaint the block exactly as the browser
    // already has. One batch of layout reads, no writes in between, so the
    // whole pass costs a single layout. Re-run on resize; the per-frame loop
    // below only does arithmetic.
    function measure() {
      const blockRect = block.getBoundingClientRect();
      const blockW = block.clientWidth;
      const blockH = block.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.ceil((blockW + PAD * 2) * dpr);
      canvas.height = Math.ceil((blockH + PAD * 2) * dpr);
      canvas.style.width = `${blockW + PAD * 2}px`;
      canvas.style.height = `${blockH + PAD * 2}px`;

      // Sizing the canvas resets the context, so all state is set after it.
      // The PAD offset lives in the transform, so glyph coordinates below are
      // plain block coordinates.
      ctx.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
      ctx.textBaseline = "alphabetic";

      // Struck at the horizontal centre of the *viewport*, level with the top
      // of the block.
      //
      // Centring on the viewport rather than the block matters wherever the
      // text isn't the full width of the page — About's body sits in the right
      // hand grid column, so its own centre is well right of the screen's and
      // the wave would visibly arrive off-axis.
      //
      // The vertical stays pinned to the block top on purpose. Using the
      // viewport's centre there too makes the direction depend on where the
      // block happens to sit when it's struck: high on screen and the centre
      // falls below the text, so the wave rolls upwards instead of down.
      //
      // Captured once, here, rather than tracked per frame — a strike happens
      // at an instant, so scrolling during the pulse must not drag the origin
      // along behind it.
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

      // Every text node under the block, whatever the markup is. Styles come
      // from each node's own parent, so an emphasised or coloured run inside a
      // paragraph keeps its own colour and face.
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent;
        if (text.trim() === "") continue;

        const cs = getComputedStyle(node.parentElement);
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily}`;
        const ramp = buildRamp(parseRGB(cs.color), coral);

        ctx.font = font;
        ctx.letterSpacing = cs.letterSpacing;

        // A Range rect is the font bounding box the browser actually laid out,
        // so the baseline is its top plus the ascent. Deriving it from
        // line-height instead would use the rounded metrics measureText
        // reports and land ~0.6px off.
        const ascent = ctx.measureText("x").fontBoundingBoxAscent;

        // Range offsets are UTF-16 code units, so step by code point to keep
        // surrogate pairs whole.
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
          // Radial, tipped downwards so the block is pushed away from the
          // strike point rather than just splayed sideways.
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

      // Both calls are no-ops after the first: React bails on an unchanged
      // value, so this stays a plain arithmetic loop.
      if (progress >= 1) {
        setPhase("settled");
        ro.disconnect(); // one-shot: nothing left to re-measure for
        return;
      }
      setPhase("running");

      // The wavefront sweeps from a full envelope before the nearest letter to
      // a full envelope past the furthest, so every glyph is provably at rest
      // on the first and last frame and none of the duration is spent crossing
      // empty space. It decelerates on the way out, which is what makes it read
      // as a strike rather than a wipe.
      const eased = 1 - (1 - progress) ** 2.2;
      const front = nearest - SPAN + eased * (reach - nearest + SPAN * 2);

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

        // Distance from the wavefront, in pulse widths.
        const s = (g.dist - front) / WIDTH;
        // Outside the pulse's influence: still waiting, or already settled.
        // ramp[0] is the resting colour, so this is also the settled state.
        const env = s * s > 9 ? 0 : Math.exp(-s * s);

        // Quantised, so neighbouring letters in the band share a string and
        // fillStyle is only reassigned when the bucket actually changes.
        const next = g.ramp[Math.round(env * (RAMP - 1))];
        if (next !== color) {
          color = next;
          ctx.fillStyle = color;
        }

        if (env === 0) {
          ctx.fillText(g.ch, g.x, g.y);
          continue;
        }
        // Push at the crest, a shallower pull behind it, back to rest as the
        // front moves on — so each letter settles the moment the pulse clears.
        const mag = AMP * env * Math.cos(s * RIPPLE);
        ctx.fillText(g.ch, g.x + g.ux * mag, g.y + g.uy * mag);
      }

      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => glyphs.length && measure());

    // Struck on first sight rather than on mount — a block below the fold
    // would otherwise play the whole pulse before anyone scrolled to it.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        // next/font loads with display:swap, so measuring before the face
        // arrives would lay the text out in the fallback metrics.
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
