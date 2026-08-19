export const PULSE_W = 155;
export const PULSE_H = 129;
export const PULSE_VIEWBOX = `0 0 ${PULSE_W} ${PULSE_H}`;

const PULSE_BARS = [45, 39, 31]; // relative widths, left to right

export const generatePulse = (gap = 24) => {
  const span = PULSE_W - gap * (PULSE_BARS.length - 1);
  const scale = span / PULSE_BARS.reduce((a, b) => a + b, 0);
  const r = (v) => +v.toFixed(1);
  let x = 0;
  return PULSE_BARS.map((w) => {
    const x0 = x;
    const x1 = x + w * scale;
    x = x1 + gap;
    return `M${r(x0)} ${r(x0 / 3)} L${r(x1)} ${r(x1 / 3)} L${r(x1)} ${r(PULSE_H - x1 / 3)} L${r(x0)} ${r(PULSE_H - x0 / 3)} Z`;
  });
};

export const PULSE_FLIPPED = true;
export const PULSE_FLIP_TRANSFORM = `translate(${PULSE_W} 0) scale(-1 1)`;

export default function PulseMark({
  size = 16,
  className,
  color = "var(--coral)",
  flip = PULSE_FLIPPED,
  inline = false,
  gap = 24,
}) {
  const PULSE_SHAPES = generatePulse(gap);

  return (
    <svg
      className={[inline && "pulse--inline", className]
        .filter(Boolean)
        .join(" ")}
      width={(size * PULSE_W) / PULSE_H}
      height={size}
      viewBox={PULSE_VIEWBOX}
      fill={color}
      aria-hidden="true"
      style={inline ? undefined : { display: "block", flex: "none" }}
    >
      <g transform={flip ? PULSE_FLIP_TRANSFORM : undefined}>
        {PULSE_SHAPES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
