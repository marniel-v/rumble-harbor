export const PULSE_W = 155;
export const PULSE_H = 129;
export const PULSE_VIEWBOX = `0 0 ${PULSE_W} ${PULSE_H}`;

export const PULSE_SHAPES = [
  "M0 0 L45 15 L45 115 L0 129 Z",
  "M65 23 L104 35 L104 96 L65 107 Z",
  "M124 42 L155 51 L155 80 L124 89 Z",
];

export const PULSE_FLIPPED = true;

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
