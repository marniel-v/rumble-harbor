import {
  PULSE_SHAPES,
  PULSE_FLIPPED,
  PULSE_FLIP_TRANSFORM,
} from "@/components/PulseMark";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconWorld({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

export function IconMobile({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

export function IconChip({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
    </svg>
  );
}

export function IconGamepad({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M8 12H4.5M6.25 10.25v3.5" />
      <circle cx="15" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7 7h10a4 4 0 0 1 4 4l-.6 5.2A2.6 2.6 0 0 1 16 17.5l-1.3-1.7a2 2 0 0 0-1.6-.8h-2.2a2 2 0 0 0-1.6.8L8 17.5a2.6 2.6 0 0 1-4.4-1.3L3 11a4 4 0 0 1 4-4Z" />
    </svg>
  );
}

export function IconScan({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function IconArrow({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function IconMenu({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose({ size = 22 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Shown in dark mode: press for light. */
export function IconSun({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </svg>
  );
}

/** Shown in light mode: press for dark. */
export function IconMoon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

/**
 * Convergence — from the brand's graphic language. Frequency lines collapse
 * from both edges into the pulse. Force, focused and held.
 */
export function PulseField({ className }) {
  const rows = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const mid = 38; // centre line of the 76-unit band
  const apexL = 250;
  const apexR = 350;

  return (
    <svg
      className={className}
      viewBox="0 0 600 76"
      width="100%"
      height="76"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rh-converge-l"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={apexL}
          y2="0"
        >
          <stop offset="0" stopColor="var(--field-stroke)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--field-stroke)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient
          id="rh-converge-r"
          gradientUnits="userSpaceOnUse"
          x1="600"
          y1="0"
          x2={apexR}
          y2="0"
        >
          <stop offset="0" stopColor="var(--field-stroke)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--field-stroke)" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      <g strokeWidth="1" fill="none">
        {rows.map((i) => (
          <line
            key={`l${i}`}
            x1="0"
            y1={mid + i * 6.8}
            x2={apexL}
            y2={mid}
            stroke="url(#rh-converge-l)"
          />
        ))}
        {rows.map((i) => (
          <line
            key={`r${i}`}
            x1="600"
            y1={mid + i * 6.8}
            x2={apexR}
            y2={mid}
            stroke="url(#rh-converge-r)"
          />
        ))}
      </g>

      {/* 155 x 129 scaled to 55.8 x 46.44, centred on (300, 38). The field is
          symmetrical, so only the mark itself responds to PULSE_FLIPPED. */}
      <g transform="translate(272.1 14.78) scale(0.36)" fill="var(--coral)">
        <g transform={PULSE_FLIPPED ? PULSE_FLIP_TRANSFORM : undefined}>
          {PULSE_SHAPES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
