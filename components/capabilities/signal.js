/**
 * The work-to-work transition: the whole panel breaks into signal, travels, and
 * reforms.
 *
 * The previous version drew glyphs to a canvas, which meant it could only
 * animate text — the filmstrip sat perfectly still while the prose rippled, so
 * it never read as one component moving. This drives an SVG displacement filter
 * over the live DOM instead, so everything inside the panel distorts together:
 * images, rules, borders and type, with no snapshot step and nothing duplicated.
 *
 * The look comes from the turbulence being deliberately anisotropic. A low x
 * frequency against a high y frequency makes noise that varies fast down the
 * panel and slowly across it, so the displacement tears the content into
 * horizontal bands rather than fogging it — the visual grammar of a signal
 * losing lock, and the same horizontal-bar texture Transmission draws as its
 * noise field.
 *
 * Direction is reading order: forward through the run, the panel breaks up and
 * leaves to the right, and the next one arrives from the left. Going back, both
 * reverse.
 */

const SHIFT = 58; // px of travel at full break-up
const PEAK = 96; // displacement scale at full break-up

export const OUT_MS = 300;
export const IN_MS = 440;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Run one half of the transition.
 *
 * mode "out" — formed → signal, then navigate.
 * mode "in"  — signal → formed, on arrival.
 *
 * The filter is attached for the duration and removed at the end. Leaving an
 * element on the filter path permanently costs a compositing layer and softens
 * its text, and the settled page has no use for either.
 */
export function runSignal({ panel, disp, turb, mode, back = false }) {
  return new Promise((resolve) => {
    if (!panel || !disp || !turb) {
      resolve();
      return;
    }

    const duration = mode === "out" ? OUT_MS : IN_MS;
    const dir = back ? -1 : 1;
    let start = 0;

    panel.style.filter = "url(#rh-signal)";
    panel.style.willChange = "transform, opacity";

    function frame(now) {
      if (!start) start = now;
      const p = clamp01((now - start) / duration);

      // `e` is how broken the panel is: 0 formed, 1 pure signal.
      //
      // Breaking up accelerates — it holds its shape and then goes — while
      // resolving decelerates on the same 2.2 curve PulseText uses for its
      // front, so the settle is the part that reads.
      const e = mode === "out" ? p ** 1.7 : (1 - p) ** 2.2;

      disp.setAttribute("scale", (PEAK * e).toFixed(2));
      turb.setAttribute(
        "baseFrequency",
        `${(0.0016 + 0.0042 * e).toFixed(5)} ${(0.045 + 0.075 * e).toFixed(4)}`,
      );

      // Out leaves along the direction of travel; in arrives from behind it.
      const x = (mode === "out" ? dir : -dir) * SHIFT * e;
      panel.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      panel.style.opacity = (1 - e).toFixed(3);

      if (p >= 1) {
        // Out hands over to the next page mid-flight and must not repaint
        // itself formed before the navigation commits.
        if (mode === "in") {
          panel.style.filter = "";
          panel.style.transform = "";
          panel.style.opacity = "";
          panel.style.willChange = "";
        }
        resolve();
        return;
      }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
}
