import PulseMark from "@/components/PulseMark";
import { hash } from "@/components/Icons";

const W = 300;
const H = 96;
const MID = H / 2;
const AMP = 40; // half-height of the tallest excursion, either side
const TIP = W - 1; // arrow point, kept off the edge so the stroke isn't halved
const HEAD = 10;
const AXIS_W = 2.2;

const bell = (d, sigma) => Math.exp(-(d * d) / (2 * sigma * sigma));

const arrow = `M${TIP - HEAD} ${MID - 5.5}L${TIP} ${MID}L${TIP - HEAD} ${MID + 5.5}`;

const BARS = 104;
const NOISE_END = 236; // bare shaft from here to the tip — the noise is spent

const noisePath = () => {
  let d = "";
  for (let i = 0; i < BARS; i++) {
    const t = i / (BARS - 1);
    const h = AMP * Math.sin(Math.PI * t ** 0.72) * (0.16 + 0.84 * hash(i));
    const x = (t * NOISE_END).toFixed(1);
    d += `M${x} ${(MID - h).toFixed(1)}V${(MID + h).toFixed(1)}`;
  }
  return d;
};

const BEATS = [0.26, 0.5, 0.74];
const LOBE = 0.04; // wavelength of the ringing, in fractions of the width
const SIGMA = 0.042; // how long it rings before it settles

const beat = (u) => Math.sin((-2 * Math.PI * u) / LOBE) * bell(u, SIGMA);

const level = (t) =>
  BEATS.reduce(
    (sum, c) => sum + (0.55 + 0.45 * bell(c - 0.5, 0.14)) * beat(t - c),
    0,
  );

const signalPath = () => {
  let d = "";
  for (let x = 0; x <= TIP; x += 1) {
    const y = MID - AMP * level(x / W);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)}`;
  }
  return d;
};

const glyphs = (word) => [...word].map((c, i) => <span key={i}>{c}</span>);

export default function Transmission({ className }) {
  return (
    <div className={["transmission", className].filter(Boolean).join(" ")}>
      <svg
        className="transmission__trace"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {[
            ["rh-tx-noise", "var(--field-stroke)", 0.75],
            ["rh-tx-axis", "var(--coral)", 1],
          ].map(([id, colour, peak]) => (
            <linearGradient
              key={id}
              id={id}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={W}
              y2="0"
            >
              <stop offset="0" stopColor={colour} stopOpacity="0" />
              <stop offset="0.45" stopColor={colour} stopOpacity={peak} />
              <stop offset="1" stopColor={colour} stopOpacity={peak} />
            </linearGradient>
          ))}
        </defs>

        <g fill="none" strokeWidth="1">
          <path
            d={noisePath()}
            stroke="url(#rh-tx-noise)"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M0 ${MID}H${TIP}`}
            stroke="url(#rh-tx-axis)"
            strokeWidth={AXIS_W}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={arrow}
            stroke="var(--coral)"
            strokeWidth={AXIS_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>

      <div className="transmission__mark" role="img" aria-label="Rumble Harbor">
        <span className="transmission__word">
          {glyphs("Ru")}
          <PulseMark inline color="currentColor" gap={30} />
          {glyphs("ble")}
        </span>
        <span className="transmission__word">{glyphs("Harbor")}</span>
      </div>

      <svg
        className="transmission__trace"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke="var(--coral)"
          strokeWidth={AXIS_W}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={signalPath()} vectorEffect="non-scaling-stroke" />
          <path d={arrow} vectorEffect="non-scaling-stroke" />
          <ellipse
            cx="15"
            cy={MID}
            rx="4.5"
            ry="4.5"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </div>
  );
}
