import {
  generatePulse,
  PULSE_FLIPPED,
  PULSE_FLIP_TRANSFORM,
} from "@/components/PulseMark";

/** 32-bit integer hash — exact in doubles, so it is stable across engines.
    Every field that needs noise reads off this, so server and client agree. */
export const hash = (i) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

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
          {generatePulse().map((d) => (
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
 *
 * The box reads left to right as the five finding each other. They enter out of
 * phase and off frequency, and both disagreements close by `settled` — from
 * there on it is the stepped-phase figure and nothing else, which is where the
 * mark sits. The chaos is added to that figure rather than replacing it, so the
 * right of the box is the resonance and the left is it not having arrived yet.
 */
export function Resonance({ className }) {
  const W = 320;
  const mid = 60;
  const amp = 34;
  const k = (2 * Math.PI) / 160; // two cycles across the box
  const settled = 0.6; // where the disagreement is gone — the mark's own x

  // 1 at the left edge, 0 from `settled` on. Smoothstep run backwards: flat at
  // both ends, so the field holds its chaos for a moment and then eases out of
  // it instead of visibly closing on a deadline.
  const unsettled = (t) => {
    const u = Math.min(1, t / settled);
    return (1 - u) * (1 - u) * (1 + 2 * u);
  };

  const wave = (j) => {
    let d = "";
    for (let x = 0; x <= W; x += 4) {
      const c = unsettled(x / W);
      // Louder on the way in, closing to the figure's own amplitude: out of
      // step alone reads as the same quiet wave merely offset. Swell, fan and
      // drift together stay inside the box — 34 · 1.3 · 1.16 + 5 ≈ 56 against
      // the 60 from `mid` to the edge — so raising any of them needs the other
      // two checked.
      const swell = 1 + 0.3 * c;
      // The fan on its own reads as five tidy copies sliding apart, so each
      // copy also carries a second wave at its own frequency — that is what
      // makes them disagree rather than merely spread.
      const drift = c * 5 * Math.sin(k * x * (1 + 0.37 * j) + 2.1 * j);
      const y =
        mid +
        amp *
          swell *
          (1 + 0.08 * c * j) *
          Math.sin(k * x + j * 0.4 + c * j * 1.7) +
        drift;
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
          {/* In earlier than the trailing edge fades out: the unsettled stretch
              runs to 0.6, and a 0.26 ramp would spend most of it on ink that is
              not there yet. */}
          <stop
            offset="0.16"
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
          <path key={j} d={wave(j)} />
        ))}
      </g>

      {/* 155 x 129 at 0.2 = 31 x 25.8, centred on (198, 60). */}
      <g transform="translate(185.5 50.1) scale(0.2)" fill="var(--coral)">
        <g transform={PULSE_FLIPPED ? PULSE_FLIP_TRANSFORM : undefined}>
          {generatePulse().map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/**
 * Spectrum — from the brand's graphic language. Three frequency bands stacked
 * back to front, each running the full width, one per brand colour: fog grey
 * behind, warm ivory carrying, coral in front. The two behind are noise floors;
 * the coral one is the signal — it stays low across the band and takes the
 * resonance at a point, which is the only place anything reaches full height.
 *
 * Every band is the same construction at different weights, so the shape is in
 * the numbers rather than in three separate bits of code: a hashed noise floor,
 * a broad `shoulder` working on the band around the resonance, and `peak`/
 * `flank` giving the spike its tip and its ragged base. The bands share a
 * resonance but not a seed — they agree about where the signal is and disagree
 * everywhere else, and that disagreement is the depth.
 *
 * They sit on one grid rather than interleaving: a taller bar behind shows its
 * top above the one in front, which is what makes the stack read as depth
 * instead of as three times the bars. Nothing is dimmed to sell that depth —
 * the bands are opaque and separate on colour alone.
 *
 * Heights are hashed off the bar index, not Math.random, so the server and the
 * client draw the same field. The resonance sits at 42% across; moving `centre`
 * moves all three bands together, since they read off the same curves.
 */
export function SpectrumField({ className }) {
  const W = 600;
  const H = 200;
  const bars = 96;
  const barW = 4.2; // against a 6.25 step — bars read as a band, not a comb
  const centre = 0.42;

  // The palette in prominence order, which is also the order the bands are
  // drawn in — fog at the back, coral in front.
  const tones = {
    fog: "var(--field-fog)",
    ivory: "var(--field-ivory)",
    coral: "var(--coral)",
  };

  // Back to front, as fractions of the height. The coral band is the odd one:
  // almost no floor, so it runs as a low rumble the noise bands sit on top of
  // until the resonance takes it past them.
  const bands = [
    { tone: "fog", seed: 977, base: 0.055, noise: 0.33, shoulder: -0.06, peak: 0.03, flank: 0.05 }, // prettier-ignore
    { tone: "ivory", seed: 431, base: 0.055, noise: 0.33, shoulder: -0.04, peak: 0.05, flank: 0.08 }, // prettier-ignore
    { tone: "coral", seed: 0, base: 0.02, noise: 0.08, shoulder: 0.05, peak: 0.78, flank: 0.24 }, // prettier-ignore
  ];

  const bell = (d, sigma) => Math.exp(-(d * d) / (2 * sigma * sigma));

  const bar = (i, band) => {
    const t = i / (bars - 1);
    const d = t - centre;
    // The tip alone is a needle; the flank under it is what gives the spike a
    // base wide enough to read as a peak rather than a stray bar.
    const signal = band.peak * bell(d, 0.026) + band.flank * bell(d, 0.045);
    const shoulder = bell(d, 0.1); // the band the resonance works on
    const n = hash(i + band.seed);
    // Noise is damped by the signal it sits under, or the spike comes out
    // ragged instead of tapering. A negative `shoulder` thins a band out where
    // the coral rises — the noise bands take it that way so they stay flat and
    // grainy and leave the spike the only thing with height.
    const floor =
      (band.base + band.noise * n + band.shoulder * shoulder * (0.45 + 0.55 * n)) * // prettier-ignore
      (1 - 0.55 * signal);
    // Clamped, since a band ducking harder than its own floor would otherwise
    // ask for a negative bar.
    const h = Math.max(0.02, Math.min(1, floor + signal));
    return { x: t * (W - barW), h: h * H };
  };

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* All three fade on the same schedule, or one outlasts the others at the
          edges and the field ends on a colour it never starts on. */}
      <defs>
        {Object.entries(tones).map(([tone, colour]) => (
          <linearGradient
            key={tone}
            id={`rh-spectrum-${tone}`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={W}
            y2="0"
          >
            <stop offset="0" stopColor={colour} stopOpacity="0" />
            <stop offset="0.1" stopColor={colour} stopOpacity="1" />
            <stop offset="0.9" stopColor={colour} stopOpacity="1" />
            <stop offset="1" stopColor={colour} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {bands.map((band, b) => (
        <g key={b} fill={`url(#rh-spectrum-${band.tone})`}>
          {Array.from({ length: bars }, (_, i) => bar(i, band)).map(
            ({ x, h }, i) => (
              <rect
                key={i}
                x={x.toFixed(2)}
                y={(H - h).toFixed(2)}
                width={barW}
                height={h.toFixed(2)}
              />
            ),
          )}
        </g>
      ))}
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
        />
      ))}
    </svg>
  );
}
