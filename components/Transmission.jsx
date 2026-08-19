import PulseMark from "@/components/PulseMark";
import { hash } from "@/components/Icons";

/**
 * Transmission — from the brand's graphic language, and the only field that
 * says what the studio does rather than just setting a texture: noise goes in
 * one side of the wordmark, a clean periodic signal comes out the other. The
 * mark is the thing in the middle that does the work.
 *
 * Three pieces on one centre line — noise trace, stacked wordmark, signal
 * trace. The wordmark is real text, not paths, so it takes the display face and
 * the theme colour like the nav lockup does and stays selectable; the traces
 * are the flexible items either side of it and take whatever width is left.
 *
 * Both traces stretch (`preserveAspectRatio="none"`) with non-scaling strokes,
 * so weights hold at any width. The noise bars are vertical and the wave only
 * gets longer, so nothing distorts except the arrowheads, which is why they are
 * kept short.
 *
 * Unlike FrequencyField this does *not* follow PULSE_FLIPPED. Its direction is
 * reading order — in on the left, out on the right — and mirroring it would put
 * the noise downstream of the mark. The mark inside the wordmark still flips,
 * through PulseMark.
 */

const W = 300;
const H = 96;
const MID = H / 2;
const AMP = 40; // half-height of the tallest excursion, either side
const TIP = W - 1; // arrow point, kept off the edge so the stroke isn't halved
const HEAD = 10;
/* One weight for everything on the axis — the shaft, both arrowheads and the
   signal trace are read as a single line running through the wordmark, so they
   have to match. The noise bars stay hairline underneath it. */
const AXIS_W = 2.2;

const bell = (d, sigma) => Math.exp(-(d * d) / (2 * sigma * sigma));

const arrow = `M${TIP - HEAD} ${MID - 5.5}L${TIP} ${MID}L${TIP - HEAD} ${MID + 5.5}`;

/* ── in: noise ──────────────────────────────────────────────────────────────
   Mirror-symmetric bars on the axis, hashed off the bar index. The envelope is
   sin(π·t^0.72): zero at both ends, peaking at 38% across, so the field builds
   quickly out of the left edge and then spends a long taper resolving into the
   mark. Raising the exponent moves the peak right and shortens that taper. */
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

/* ── out: signal ────────────────────────────────────────────────────────────
   One beat shape repeated on a fixed 0.24 spacing. The even spacing is what
   reads as stable; the bell over the beat weights keeps one of them dominant so
   the trace still has a subject, in the same way the coral band of
   SpectrumField peaks once.

   The beat is a sine under a bell — odd about its own centre, so every
   excursion above the axis is matched by an equal one below and the trace has
   the same mass either side of it. That balance is the whole reason it reads as
   a driven signal rather than a twitch: a one-sided spike, however tall, looks
   like something failing, and an even (cosine) burst leans off the axis. The
   ringing runs five lobes each side, down to a tenth of the peak, so the beats
   are dense enough to look sustained while LOBE and SIGMA together keep them
   individually separated.

   Sign is negated so the strong lobe above the axis leads and its twin follows,
   rather than the other way round. Apexes land on odd multiples of LOBE/4 — 3,
   9, 15 units off centre — and every beat centre is a whole number, so the
   1-unit sampling hits each one exactly and no lobe gets clipped short. */
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

/* One element per glyph, so each line can spread its own letters to a shared
   width — the justification lives in the .transmission__word rule. */
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
          {/* Both fade out of the left edge on the same schedule, or the axis
              arrives before the noise it is supposed to be carrying. */}
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

        {/* vector-effect does not inherit — it goes on every path, not the g. */}
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

      {/* Labelled as one image: the glyphs are separate elements only so the
          lines can be justified, and letting a screen reader walk them
          individually would spell the name out. */}
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
        {/* No gradient on this one: it leaves the mark at full strength and
            ends on a point rather than fading off an edge. The ring is the tap
            — where the signal is taken off, just clear of the wordmark. */}
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
