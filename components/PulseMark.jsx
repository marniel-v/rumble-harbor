/**
 * The Pulse — Rumble Harbor's mark.
 * Energy in motion: three forms receding across the mark, each stepping down and
 * tapering harder than the last. Always Signal Coral unless placed on coral.
 *
 * Official vector. These three paths are the source of truth for the mark —
 * `PulseField` in Icons.jsx imports them. `app/icon.svg` is a static asset and
 * has to carry its own copy; update it alongside any change here.
 */
export const PULSE_W = 155;
export const PULSE_H = 129;
export const PULSE_VIEWBOX = `0 0 ${PULSE_W} ${PULSE_H}`;

export const PULSE_SHAPES = [
  "M0 0 L45 15 L45 115 L0 129 Z",
  "M65 23 L104 35 L104 96 L65 107 Z",
  "M124 42 L155 51 L155 80 L124 89 Z",
];

/**
 * ── The direction switch ─────────────────────────────────────────────────────
 * Which way the pulse travels:
 *   false — forms recede left to right, largest first (the supplied vector)
 *   true  — mirrored on the Y axis, receding right to left
 *
 * Flip this one constant to change the whole site: nav, footer, signal markers,
 * About pillars, the hero convergence field, and the work-card chips all follow.
 * `app/icon.svg` is a static file and cannot read this — it carries a one-line
 * note showing the same flip.
 *
 * Individual instances can still override with the `flip` prop, e.g. to show
 * both directions side by side.
 */
export const PULSE_FLIPPED = true;

/** Mirrors in place: x -> PULSE_W - x, so the forms stay inside the viewBox. */
export const PULSE_FLIP_TRANSFORM = `translate(${PULSE_W} 0) scale(-1 1)`;

export default function PulseMark({
  size = 16,
  className,
  color = "var(--coral)",
  flip = PULSE_FLIPPED,
  inline = false,
}) {
  return (
    <svg
      className={className}
      width={(size * PULSE_W) / PULSE_H}
      height={size}
      viewBox={PULSE_VIEWBOX}
      fill={color}
      aria-hidden="true"
      style={
        inline
          ? // Standing in for a letter: it has to sit in the text run, so it
            // takes an inline box and centres on the cap height rather than
            // riding the baseline.
            { display: "inline-block", verticalAlign: "0.08em", flex: "none" }
          : // Beside text in a flex row: block avoids the inline descender gap.
            { display: "block", flex: "none" }
      }
    >
      <g transform={flip ? PULSE_FLIP_TRANSFORM : undefined}>
        {PULSE_SHAPES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
