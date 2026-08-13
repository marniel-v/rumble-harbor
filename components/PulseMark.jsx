/**
 * The Pulse — Rumble Harbor's mark.
 * Energy in motion: three forms compressing left to right, the last resolving
 * to a point. Always Signal Coral unless placed on coral itself.
 */
export default function PulseMark({ size = 16, className, color = "#F25F57" }) {
  return (
    <svg
      className={className}
      width={(size * 100) / 60}
      height={size}
      viewBox="0 0 100 60"
      fill={color}
      aria-hidden="true"
      style={{ display: "block", flex: "none" }}
    >
      <path d="M0 0 L34 11.4 L34 48.6 L0 60 Z" />
      <path d="M42 8 L70 16.4 L70 43.6 L42 52 Z" />
      <path d="M78 15 L100 30 L78 45 Z" />
    </svg>
  );
}
