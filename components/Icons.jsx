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

/**
 * Frequency Fields — from the brand's graphic language. Rays leave one source
 * at the back edge and spread as they travel. Ambient only: no mark, no coral.
 *
 * Stretches to whatever box it is given (`preserveAspectRatio="none"`) — rays
 * are straight, so non-uniform scale costs nothing and the strokes hold their
 * weight. Being directional it follows PULSE_FLIPPED, but through
 * `html[data-pulse]` in globals.css rather than a transform of its own.
 */
export function FrequencyField({ className }) {
  const rays = Array.from({ length: 21 }, (_, i) => i - 10);

  return (
    <svg
      className={className}
      viewBox="0 0 600 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rh-freq"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="600"
          y2="0"
        >
          <stop offset="0" stopColor="var(--field-stroke)" stopOpacity="0.75" />
          <stop
            offset="0.5"
            stopColor="var(--field-stroke)"
            stopOpacity="0.3"
          />
          <stop offset="1" stopColor="var(--field-stroke)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The source is a short bundle, not a point — 2.6 apart at the edge
          against 17 at full spread. Both signs match, or the rays cross and
          the field reads as convergence instead. */}
      <g fill="none">
        {rays.map((i) => (
          <line
            key={i}
            x1="0"
            y1={200 + i * 2.6}
            x2="600"
            y2={200 + i * 17}
            stroke="url(#rh-freq)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Resonance — from the brand's graphic language. One wave carried five times
 * at stepped phase: they pinch at the crossings and open between them. Same
 * frequency reinforcing itself, with the mark riding it.
 */
export function Resonance({ className }) {
  const W = 320;
  const mid = 60;
  const amp = 34;
  const k = (2 * Math.PI) / 160; // two cycles across the box

  const wave = (phase) => {
    let d = "";
    for (let x = 0; x <= W; x += 4) {
      const y = mid + amp * Math.sin(k * x + phase);
      d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <svg
      className={className}
      viewBox="0 0 320 120"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="rh-resonance"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={W}
          y2="0"
        >
          <stop offset="0" stopColor="var(--field-stroke)" stopOpacity="0" />
          <stop
            offset="0.26"
            stopColor="var(--field-stroke)"
            stopOpacity="0.8"
          />
          <stop
            offset="0.76"
            stopColor="var(--field-stroke)"
            stopOpacity="0.8"
          />
          <stop offset="1" stopColor="var(--field-stroke)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g stroke="url(#rh-resonance)" strokeWidth="1" fill="none">
        {[-2, -1, 0, 1, 2].map((j) => (
          <path key={j} d={wave(j * 0.4)} />
        ))}
      </g>

      {/* 155 x 129 at 0.2 = 31 x 25.8, centred on (198, 60). */}
      <g transform="translate(182.5 47.1) scale(0.2)" fill="var(--coral)">
        <g transform={PULSE_FLIPPED ? PULSE_FLIP_TRANSFORM : undefined}>
          {PULSE_SHAPES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/**
 * Pattern & Texture — from the brand's graphic language. A dot grid lifted by
 * two waves at different wavelengths, so the sheet reads as a moving surface
 * rather than a grid. A few marks sit on it, at the height the surface gives
 * them.
 *
 * Stepping the phase by row runs the crests diagonally, but the step is what
 * risks rows crossing: the per-row swing is amp·0.72·0.45 ≈ 16 against a 26
 * step, so the sheet stays one surface. Raising either needs the other checked.
 *
 * Each row is one path — the dots are round line caps on 0.01-long segments,
 * so the whole field is 11 nodes rather than 660.
 */
export function PatternField({ className }) {
  const cols = 60;
  const rows = 11;
  const colStep = 20;
  const rowStep = 26;
  const x0 = 10;
  const y0 = 60;
  const amp = 50;

  const lift = (x, row) =>
    amp *
    (0.72 * Math.sin(x / 165 + row * 0.45) +
      0.28 * Math.sin(x / 78 - row * 0.2));

  const surface = (x, row) => y0 + row * rowStep + lift(x, row);

  const rowPath = (row) => {
    let d = "";
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * colStep;
      d += `M${x} ${surface(x, row).toFixed(1)}h.01`;
    }
    return d;
  };

  const marks = [
    { x: 250, row: 2, scale: 0.085 },
    { x: 690, row: 7, scale: 0.06 },
    { x: 980, row: 4, scale: 0.07 },
  ];

  return (
    <svg
      className={className}
      viewBox="0 0 1200 380"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g
        stroke="var(--field-stroke)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      >
        {Array.from({ length: rows }, (_, row) => (
          <path
            key={row}
            d={rowPath(row)}
            opacity={(0.3 + row * 0.032).toFixed(3)}
          />
        ))}
      </g>

      {marks.map(({ x, row, scale }) => (
        <g
          key={`${x}-${row}`}
          transform={`translate(${(x - (155 * scale) / 2).toFixed(1)} ${(
            surface(x, row) -
            (129 * scale) / 2
          ).toFixed(1)}) scale(${scale})`}
          fill="var(--coral)"
        >
          <g transform={PULSE_FLIPPED ? PULSE_FLIP_TRANSFORM : undefined}>
            {PULSE_SHAPES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      ))}
    </svg>
  );
}
