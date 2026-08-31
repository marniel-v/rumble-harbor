import PulseMark from "@/components/PulseMark";
import PulseText from "@/components/PulseText";
import SignalMarker from "@/components/SignalMarker";

/* Structured light — the one piece of work on this site that is shown as
 * itself. Everything else in Selected Work is described at a coarse grain
 * because it belongs to a client; this is a university project, so the real
 * report, the real figures and the real measured failure can all be on the
 * page.
 *
 * Every number below is traceable to a section of the report:
 *   M. Vosloo, "Low Cost 3D Mapping using Structured Light", project EPR400,
 *   Dept. Electrical, Electronic and Computer Engineering,
 *   University of Pretoria, November 2012.
 *
 * Two figures are DERIVED here rather than quoted, deliberately. Table 2's
 * own error column is a fraction printed under a "%" heading, so quoting it
 * would overstate accuracy by 100x; the deviation and relative columns below
 * are recomputed from the table's own measurements against the 2.00 cm
 * ground truth. Same for the turntable: 1 degree over 18 rotations is
 * 0.056 deg/step, not the 0.05% the summary claims. See SCANS and the note
 * under the table.
 */

/* Table 2, p.47. Four gaps per scan, each 2.00 cm by tape measure, read back
   off the point cloud. `dev` is the mean absolute deviation over the row's
   four gaps and `rel` is that against the 2.00 cm truth — both computed from
   `gaps`, not transcribed, so they cannot drift from the measurements. */
const TRUTH = 2.0;
const SCANS = [
  { n: 1, gaps: [1.92, 1.94, 1.92, 1.94], focused: true },
  { n: 2, gaps: [1.87, 1.88, 1.91, 1.95] },
  { n: 3, gaps: [1.96, 1.98, 1.84, 1.93] },
  { n: 4, gaps: [1.94, 1.96, 1.7, 1.8] },
  { n: 5, gaps: [1.96, 1.84, 1.79, 1.93] },
];

const meanDevCm = (gaps) =>
  gaps.reduce((a, g) => a + Math.abs(TRUTH - g), 0) / gaps.length;

const rows = SCANS.map((s) => {
  const cm = meanDevCm(s.gaps);
  return { ...s, mm: cm * 10, rel: (cm / TRUTH) * 100 };
});
const allDevCm =
  SCANS.reduce((a, s) => a + meanDevCm(s.gaps), 0) / SCANS.length;

/* System facts, each one a single readout. */
/* Global relaxation, five iterations, §3.5.2 / Fig 40. It started at 1.33 cm,
   so anything at or above that is the algorithm having made things no better
   — which is what the colouring marks, rather than alternating for effect. */
const RELAX_START = 1.33;
const relaxation = [1.33, 0.96, 2.03, 1.09, 2.41];

const facts = [
  { value: "18 × 20°", label: "SCANS PER ROTATION" },
  { value: "0.056°", label: "TURNTABLE ERROR PER STEP" },
  { value: "1.25 cm", label: "PIN SETS ABSOLUTE SCALE" },
  { value: "> 100k", label: "POINTS PER SINGLE SCAN" },
];

/* The pipeline, in the order the system actually runs it — which puts the
   stage that failed in its true position, in the middle, where it damaged
   everything downstream of it. */
const steps = [
  {
    n: "01",
    title: "The object",
    fig: "Fig 35 · p.49",
    caption:
      "A soft toy on the turntable platform. Rigid enough to hold its shape, matte enough to take a projected pattern.",
    images: [
      {
        src: "/structured-light/fig35-object.jpg",
        w: 316,
        h: 475,
        alt: "The soft toy used as the scan subject, photographed before scanning.",
      },
    ],
  },
  {
    n: "02",
    title: "Capture",
    fig: "ORIGINAL FOOTAGE",
    lit: true,
    caption:
      "The rig running, room darkened. Gray-coded patterns step from coarse to fine across the object and the webcam reads each one back; line-plane intersection then gives every decoded pixel a depth.",
    motion: {
      src: "/structured-light/capture.mp4",
      poster: "/structured-light/capture-poster.jpg",
      w: 720,
      h: 404,
      alt: "Footage of the scanner running: Gray-coded stripe patterns projected onto the object on the turntable in a darkened room, stepping from coarse bands to fine lines.",
    },
  },
  {
    n: "03",
    title: "Point cloud",
    fig: "Fig 33 · p.43",
    caption:
      "One view, thresholded against a background scan and rendered in the WPF viewer. Over a hundred thousand points from a single exposure.",
    images: [
      {
        src: "/structured-light/fig33-pointcloud.png",
        w: 528,
        h: 671,
        alt: "A dense point cloud of the object rendered in the WPF virtual environment.",
      },
    ],
  },
  {
    n: "04",
    title: "Pairwise registration",
    fig: "Fig 39 · p.52",
    caption:
      "Three clouds, colour-coded, merged by ICP. Left: a good initial alignment. Right: the same scans seeded from the rotation axis instead. Same data, converging much tighter.",
    paper: true,
    wide: true,
    images: [
      {
        src: "/structured-light/fig39-registration-before.png",
        w: 314,
        h: 543,
        alt: "Three registered point clouds with a good initial alignment, showing visible spread between them.",
      },
      {
        src: "/structured-light/fig39-registration-after.png",
        w: 316,
        h: 525,
        alt: "The same three point clouds with an improved initial alignment, visibly tighter.",
      },
    ],
  },
  {
    n: "05",
    title: "Surface & texture",
    fig: "Fig 43 · p.57",
    caption:
      "Marching Cubes over the merged cloud, then Taubin smoothing. Left: the raw isosurface at MC 10. Right: smoothed at MC 16, with per-face colour averaged from the points it was cut from.",
    paper: true,
    wide: true,
    images: [
      {
        src: "/structured-light/fig43-surface-raw.png",
        w: 413,
        h: 442,
        alt: "The reconstructed surface straight out of Marching Cubes, visibly faceted.",
      },
      {
        src: "/structured-light/fig43-surface-smoothed.png",
        w: 412,
        h: 449,
        alt: "The same surface after Taubin smoothing, visibly cleaner without having shrunk.",
      },
    ],
  },
];

const build = [
  {
    label: "CAPTURE",
    body: "Projector and webcam, both at least 800×600, calibrated with ProCamCalib. Gray coding rather than phase shift: flood-fill phase assignment gives no unique row or column identity, so line-plane intersection has nothing to key against.",
  },
  {
    label: "TURNTABLE",
    body: "PMG4250 geared bipolar stepper, 0.15° resolution at ±7%, driven by an A4988 and a PIC32MX320F032H over RS-232 through a MAX3232. 133 steps lands 19.95° against a 20° target at 166.25 Hz; 2.5 kg·cm required at a safety factor of 2, against 10 kg·cm available. Carries 4 kg.",
  },
  {
    label: "RECONSTRUCTION",
    body: "C#, OpenCV 2.4 and WPF. ICP over Canny critical points, nearest neighbours through a KD-tree, non-overlapping points trimmed to remove alignment bias. Marching Cubes then Taubin smoothing: vertex-to-cloud distance falls 0.122 → 0.065 cm as the sampling cube goes 43 → 13 mm, and smoothing improves it at every size without shrinking the model.",
  },
  {
    label: "WHERE IT BREAKS",
    body: "Transparent and reflective surfaces, ambient light, an over-exposed camera, a mis-calibration, or a centre pin out of focus. Marching Cubes ambiguity leaves occasional holes in the mesh. Anything past 30 × 30 × 30 cm runs out of memory: WPF degrades near a million points and eighteen scans clear a hundred thousand each.",
  },
];

export default function StructuredLight() {
  return (
    <section className="section slight" id="structured-light">
      <div className="container">
        <SignalMarker
          label="STRUCTURED LIGHT"
          meta="UNIVERSITY OF PRETORIA · 2012"
          status="FIRST PLACE"
          className="marker--section"
        />
        <div className="slight__head">
          {/* The marker directly above already reads STRUCTURED LIGHT, so
                the heading does not repeat it — that redundancy is what forced
                the title into four ragged lines. The full formal title is
                given verbatim in the provenance note at the foot. */}
          <div>
            <h2 className="slight__title">
              Low Cost
              <br />
              3D Mapping
            </h2>
            <p className="slight__throughline">
              This is where the computer vision work on this site starts.
              Detection, extraction and vision in production all run on the
              geometry learned here.
            </p>
          </div>
          <div className="slight__lead">
            <p>
              A final-year project in the Department of Electrical, Electronic
              and Computer Engineering at the University of Pretoria: a 3D
              scanner made from a projector, a webcam, and a turntable I
              specified, built and wrote the firmware for. Gray-coded patterns
              go onto the object, line-plane intersection turns every decoded
              pixel into a depth, and eighteen scans taken 20° apart merge into
              one textured model.
            </p>
            <p>
              Three months, and it runs the whole stack: stepper selection and
              PIC32 firmware at one end, ICP registration, Marching Cubes and
              Taubin smoothing at the other. It also has a measured failure in
              the middle that was never fixed, and that is on this page too.
            </p>
          </div>
        </div>

        {/* The headline figure. Everything else on the page is in service of
            this number being checkable, so it gets the largest type on the page
            and leads the right column, with the reading that backs it directly
            underneath and the plate standing alone on the left. That block
            leads in source order so the number stays first once the grid
            collapses to one column. */}
        <div className="slight__readout">
          <div className="slight__readout-display">
            <p className="slight__hero-fig">
              <span className="slight__hero-value">0.7</span>
              <span className="slight__hero-unit">mm</span>
            </p>
            <p className="slight__hero-say">
              About the thickness of a credit card
            </p>

            <div className="slight__readout-text">
              <div className="slight__hero-note">
                <p>
                  Three cardboard markers set 2.00 cm apart, measured back off
                  the point cloud. Across all five trials it averages{" "}
                  <b>1.0 mm</b>, and the worst single reading in the set is{" "}
                  <b>3 mm</b>.
                </p>
                <p>
                  That is the figure the whole rig stands on. Every scan after
                  it inherits it, so a single view being accurate is what makes
                  a merged model worth measuring at all.
                </p>
              </div>

              <div className="slight__facts">
                {facts.map((f) => (
                  <div className="slight__fact" key={f.label}>
                    <span className="slight__fact-value">{f.value}</span>
                    <span className="slight__fact-label">
                      <PulseMark size={8} />
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="slight__readout-plate">
            <span className="slight__hero-label">
              <PulseMark size={8} />
              MEAN DEVIATION · BEST SCAN
            </span>
            <figure className="slight__hero-plate">
              <span className="slight__plate slight__plate--free">
                <img
                  src="/structured-light/fig34-markers.png"
                  width={514}
                  height={376}
                  alt="Point clouds of the three cardboard markers with the centre-of-rotation pin between them."
                  loading="lazy"
                />
              </span>
              <figcaption>
                Fig 34 · p.46. The three measured markers, with the 1.25 cm
                centre pin standing between them.
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Table 2. Wrapped so the table scrolls inside its own box rather than
            pushing the page sideways at narrow widths. */}
        <div className="slight__block">
          <SignalMarker label="MEASURED" meta="TABLE 2 · P.47" />
          <div className="slight__table-wrap">
            <table
              className="slight__table"
              aria-label="Single-view accuracy, five scans"
            >
              <thead>
                <tr>
                  <th scope="col">Scan (cm)</th>
                  <th scope="col">1 → 2 (cm)</th>
                  <th scope="col">2 → 3 (cm)</th>
                  <th scope="col">2 behind 1 (cm)</th>
                  <th scope="col">3 behind 2 (cm)</th>
                  <th scope="col">Mean dev. (mm)</th>
                  <th scope="col">Rel. (%)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n} className={r.focused ? "is-best" : undefined}>
                    <th scope="row">
                      {r.n}
                      {r.focused && <span className="slight__dagger">†</span>}
                    </th>
                    {r.gaps.map((g, i) => (
                      <td key={i}>{g.toFixed(2)}</td>
                    ))}
                    <td className="slight__num-key">{r.mm.toFixed(1)}</td>
                    <td>{r.rel.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">All</th>
                  <td colSpan={4}>five trials, twenty gaps</td>
                  <td className="slight__num-key">
                    {(allDevCm * 10).toFixed(1)}
                  </td>
                  <td>{((allDevCm / TRUTH) * 100).toFixed(1)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Kept outside the scroll box, or it clips with the table. */}
          <p className="slight__foot">
            Four gaps per scan, each 2.00 cm by tape measure, read back off the
            point cloud. Deviation and relative error are computed from those
            measurements against the 2.00 cm truth. † Scanned inside the
            calibrated focus area; the remaining four were positioned randomly
            around it, which is what the spread in the last two columns is
            measuring.
          </p>
        </div>

        {/* The sequence. Numbered, and in the order the pipeline runs. */}
        <div className="slight__block">
          <SignalMarker label="CAPTURE TO MODEL" meta="FIVE STAGES" />
          <ol className="slight__seq">
            {steps.map((s) => (
              <li
                className={`slight__step${s.wide ? " slight__step--wide" : ""}`}
                key={s.n}
              >
                <div
                  className={`slight__plate${s.paper ? " slight__plate--paper" : ""}${s.lit ? " slight__plate--lit" : ""}`}
                >
                  <span className="slight__step-n" aria-hidden>
                    {s.n}
                  </span>
                  {s.motion ? (
                    /* The still is rendered alongside and swapped in by CSS
                       under prefers-reduced-motion. The poster frame carries
                       the pattern on the object, so the stage still reads
                       when the clip is suppressed. */
                    <>
                      <video
                        className="slight__motion"
                        width={s.motion.w}
                        height={s.motion.h}
                        poster={s.motion.poster}
                        aria-label={s.motion.alt}
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={s.motion.src} type="video/mp4" />
                      </video>
                      <img
                        className="slight__motion-still"
                        src={s.motion.poster}
                        width={s.motion.w}
                        height={s.motion.h}
                        alt={s.motion.alt}
                        loading="lazy"
                      />
                    </>
                  ) : (
                    s.images.map((im) => (
                      <img
                        key={im.src}
                        src={im.src}
                        width={im.w}
                        height={im.h}
                        alt={im.alt}
                        loading="lazy"
                      />
                    ))
                  )}
                </div>
                <div className="slight__step-head">
                  <h3 className="slight__step-title">{s.title}</h3>
                  <span className="slight__step-fig">{s.fig}</span>
                </div>
                <p className="slight__step-caption">{s.caption}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="slight__block slight__split">
          <div className="slight__panel">
            <SignalMarker label="THE INSIGHT" meta="§2.2.3.3" />
            <p className="slight__body">
              ICP needs a decent starting pose or it settles into a local
              minimum, and every cloud merged after it is then wrong. Rather
              than have an operator align each scan by hand, a 1.25 cm square
              pin stands at the centre of the platform and is scanned once. Its
              orientation gives the rotation axis; that corrects the camera tilt
              out of every cloud and lets each new scan be seeded with the
              rotation the turntable has just made, a known 20°.
            </p>
            <p className="slight__result">
              <span className="slight__result-a">0.40 cm</span>
              <span className="slight__result-arrow" aria-hidden>
                →
              </span>
              <span className="slight__result-b">0.16 cm</span>
              <span className="slight__result-delta">60% better</span>
            </p>
            <figure className="slight__chart">
              <span className="slight__plate slight__plate--paper slight__plate--free">
                <img
                  src="/structured-light/fig21-icp-alignment.png"
                  width={1107}
                  height={693}
                  alt="Four diagrams: a good initial alignment converging to an ideal result, and a 180-degree rotated initial alignment converging to a misalignment."
                  loading="lazy"
                />
              </span>
              <figcaption>
                Fig 21 · p.29. The same two curves, same algorithm. Only the
                starting pose differs.
              </figcaption>
            </figure>
            <p className="slight__foot">
              Average misalignment across seventeen pairwise registrations,
              first full scan against second. §3.4.2.2
            </p>
          </div>

          <div className="slight__panel slight__panel--failure">
            <SignalMarker label="THE FAILURE" meta="§3.5.2" />
            <p className="slight__body">
              Merging eighteen clouds in sequence accumulates error, so the
              first and the last no longer meet: a 1.33 cm seam, and a sea-shell
              fold where they overlap. Global relaxation was meant to
              redistribute that error across every cloud and close it. Over five
              iterations it did not converge:
            </p>
            <p className="slight__series">
              {relaxation.map((v, i) => (
                <span
                  className={`slight__series-v${v >= RELAX_START ? " is-worse" : ""}`}
                  key={i}
                >
                  {v.toFixed(2)}
                </span>
              ))}
              <span className="slight__series-unit">cm</span>
            </p>
            <figure className="slight__chart">
              <span className="slight__plate slight__plate--paper slight__plate--free">
                <img
                  src="/structured-light/fig40-relaxation.png"
                  width={1254}
                  height={781}
                  alt="A line chart of alignment distance in centimetres against five global relaxation iterations, wandering rather than converging."
                  loading="lazy"
                />
              </span>
              <figcaption>
                Fig 40 · p.54. Alignment distance against iteration. It was
                supposed to fall.
              </figcaption>
            </figure>
            <p className="slight__foot">
              Diagnosed in the report itself: the error was spread evenly across
              the merged clouds instead of weighted. The fix was identified too
              late in the timeline to re-run the results. §4.2
            </p>
          </div>
        </div>

        <div className="slight__block">
          <SignalMarker label="BUILD" meta="HARDWARE & STACK" />
          <div className="slight__build">
            {build.map((b) => (
              <div className="slight__build-item" key={b.label}>
                <span className="slight__build-label">
                  <PulseMark size={8} />
                  {b.label}
                </span>
                <p className="slight__build-body">{b.body}</p>
              </div>
            ))}
            <figure className="slight__inline-fig slight__inline-fig--wide slight__build-fig">
              <span className="slight__plate slight__plate--inline slight__plate--paper">
                <img
                  src="/structured-light/fig04-motor-profile.png"
                  width={851}
                  height={513}
                  alt="Trapezoidal operating pulse speed profile for the stepper motor, peaking at 166.25 Hz over a one second positioning period."
                  loading="lazy"
                />
              </span>
              <figcaption>
                Fig 4 · p.13. The motor&rsquo;s operating profile. One 20° index
                in one second: 0.25 s ramping up, 0.25 s down, 166.25 Hz across
                the plateau.
              </figcaption>
            </figure>
          </div>
        </div>

        <p className="slight__provenance">
          Every figure and measurement on this page is reproduced from{" "}
          <i>Low Cost 3D Mapping using Structured Light</i>, M. Vosloo,
          Department of Electrical, Electronic and Computer Engineering,
          University of Pretoria, project EPR400, November 2012. The capture
          footage in stage 02 is from the original build rather than the report.
          Scope, stated plainly: the Gray-code decode is a port of Lanman &amp;
          Taubin&rsquo;s <i>cvStructuredLight</i>
          {" from C++/OpenCV 1.1 to C#/OpenCV 2.4, "}
          disclosed in the report&rsquo;s own engineering change proposal.
          Everything else was built from first principles: the initial-alignment
          method, ICP, global relaxation, Marching Cubes, Taubin smoothing,
          texturing, artefact removal, and the whole turntable from motor
          selection through firmware and housing. The project took first place
          for Computer Engineering in the final-year project competition and
          exhibition, and was invited for poster presentation at PRASA, the
          Pattern Recognition Association of South Africa.
        </p>
      </div>
    </section>
  );
}
