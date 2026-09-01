/**
 * The capability set, ordered as the run goes.
 *
 * This is the plan's build order, which lands `vision-3d` last on purpose: it
 * is the one work with no facade behind it — the real final-year project shown
 * as itself — so it reads as where the vision work started rather than as the
 * ceiling of what it became.
 *
 * `capability` and `qualifier` are one claim in two pieces — the competence,
 * then the part of it that was actually hard. Split because a single uppercase
 * run gives the reader nothing to land on and costs three lines to say it; set
 * as a heading and a subheading it is shorter and it leads. They join with a
 * plain space to reconstruct the sentence, which is what the page title does.
 *
 * `views[].id` names a directory under facades/, which is gitignored and served
 * at runtime by app/capabilities/facade/[slug]/route.js. `ready: false` works
 * have no page yet; the band still renders their tick, so the length of the run
 * is honest even while most of it is unbuilt.
 */

export const DISCLOSURE =
  "Reference implementation. The original is under NDA.";

export const works = [
  {
    slug: "analytics",
    short: "Risk scoring over telemetry",
    n: "01",
    product: "Bellwether",
    kicker: "Analytics · Insights",
    capability: "Risk scoring over high-volume telemetry",
    qualifier: "with per-signal attribution",
    lead: "A degradation model ranks 1,284 assets by a derived 0–100 score. The thirteen that clear the threshold are sorted worst-first, and every score itemises the signals that produced it, so the engineer deciding where to send a technician can see why the model said what it said.",
    body: [
      "The vertical is misdirection, deliberately. What is being claimed is the structure (entity × time-series × derived score × cohort × drill-down), and the plant here could be anything that emits telemetry. The substitution costs nothing, because the structure is the part that was hard.",
      "Open either screen and check it. The distribution buckets sum to the monitored count, the contributing signals sum to the score, and the weights sum to 1.00. Nothing on these screens is a number that was typed in to look plausible.",
    ],
    views: [
      {
        id: "bellwether-01-fleet-overview",
        n: "01",
        title: "Fleet overview",
        note: "Thirteen assets over a 70-point threshold, worst first. The five buckets of the distribution chart sum to the 1,284 monitored; the top asset's contributing signals sum to its score of 91 exactly.",
      },
      {
        id: "bellwether-02-model-thresholds",
        n: "02",
        title: "Model & thresholds",
        note: "The same score as configured policy: seven active signals weighted to 1.00, and a threshold sweep whose value at the current cut of 70 reproduces view 01's at-risk count. One signal sits below its coverage minimum and is weighted anyway.",
      },
    ],
    ready: true,
  },
  {
    slug: "cloud",
    short: "Multi-cloud control planes",
    n: "02",
    product: "Slipstream",
    kicker: "Cloud · Control Plane",
    capability: "Multi-cloud control planes",
    qualifier: "and policy-driven protection at the edge",
    lead: "A rollout is a gated, per-region process with an auditable trail, not a deploy button. Three views: the rollout in flight, the gates that halted it as editable policy, and the ruleset sitting in front of the same estate.",
    body: [
      "The three screens describe one estate rather than three unrelated ones. Region names, instance counts and node counts agree across all of them, and view 02's audit trail records view 01's halt and rollback to the second.",
      "The headline error rate on view 01 is an instance-weighted mean over fresh regions only: wrong under any naive reading of the table below it, right under the one the tile states. That is the class of detail that is expensive to fabricate and cheap to check.",
    ],
    views: [
      {
        id: "slipstream-01-rollout-console",
        n: "01",
        title: "Rollout console",
        note: "Eight regions in four waves, 204 of 372 instances on the new version. One region holding on a failed gate, one rolled back after peaking at 1.874%, one with metrics 30 minutes stale and excluded from the headline.",
      },
      {
        id: "slipstream-02-gates-policy",
        n: "02",
        title: "Gates & policy",
        note: "Six gates, five enforced. Firings partition by action into the 90-day outcomes: 25 halted plus 12 rolled back equals the 37 halt-gate firings. A tighter policy version is on record as rolled back for being less precise.",
      },
      {
        id: "slipstream-03-edge-protection",
        n: "03",
        title: "Edge protection",
        note: "38.4M requests, 206 rules, 0.559% blocked. One rule group held in monitor since June because enforcing it would break two named consumers. Per-region node counts equal view 01's instance counts.",
      },
    ],
    ready: true,
  },
  {
    slug: "erp",
    short: "Systems of record",
    n: "03",
    product: "Millrace",
    kicker: "Operations · ERP",
    capability: "Systems of record at operational scale",
    qualifier: "with unit-level traceability",
    lead: "One serialised unit, scanned at the line, and everything that has happened to it: fourteen stations across three segments, each with its own duration, operator and verdict, including the test it failed, the rework that followed, and the return it came back on eleven weeks later.",
    body: [
      "The strongest figure here is not written in the data anywhere. Queue time is the sum of the gaps between consecutive stations (read out of the whitespace in the timeline), and it comes to 7h 16m 10s against 4h 58m 31s of actual work. Queue outweighs work, which is what real shop-floor data does and what an invented timeline almost never produces.",
      "The scanned unit is also a line in the shipment on the second screen. Its revision and firmware rebuild from the first screen's identity block, it carries the repair work order the route names, and the one line held back on a failed seal check is the same serial the first screen shows on hold. 224 assertions check all of it, scraped from the rendered markup rather than from a second copy of the data.",
    ],
    views: [
      {
        id: "erp-01-portal",
        n: "01",
        title: "Traceability portal",
        note: "A meter scanned at the station, its route newest-first. Every rendered duration is exactly end − start, and the failure loop is left visible rather than summarised away: functional test fails on RTC drift, one rework station, then a passing retest at the same station.",
      },
      {
        id: "erp-02-shipment",
        n: "02",
        title: "Shipment PKG-4471",
        note: "26 lines, 25 shippable. Chargeable weight resolves to the volumetric figure rather than the actual one, the held line is excluded from every total, and the commercial invoice is disabled because a single line has no HS code; the notice bar names which.",
      },
    ],
    ready: true,
  },
  {
    slug: "logistics",
    short: "Corridor scheduling & cost",
    n: "04",
    product: "TRAMOS",
    kicker: "Logistics · Estimation",
    capability: "Scheduling, cost and storage modelling",
    qualifier: "across multi-leg corridors",
    lead: "Which orders move on which legs this fortnight. A corridor plan across road, rail and port, where the schedule, the storage charges and the route candidates are all computed from one set of timestamps rather than asserted separately.",
    body: [
      "Storage cost is nobody's typed-in figure. It is charged on dwell (tonnes × rate × days), and the occupancy curve on the cost view can be rebuilt from nothing but the bar timestamps on the schedule view. 488 assertions do exactly that, including one that checks the deferral offered against a breach actually clears it.",
      "Three of the seven route candidates read Infeasible, and the reason is on the screen rather than asserted. DO-51243's rail leg departs 1h 45m before the road leg feeding it has finished outturning. DO-51248 has no vessel nomination at all, so it sits in the topology as an origin with no outbound lane, holding 2,460 t that no lane carries.",
    ],
    views: [
      {
        id: "tramos-01-corridor-schedule",
        n: "01",
        title: "Corridor schedule",
        note: "A fortnight of legs across road, rail and port. Every bar's position and width recompute from its own timestamps to within a hundredth of a pixel, and Albany Berth 1 is over-granted: a 32.0 h window against 17.2 h assigned, 53.8%.",
      },
      {
        id: "tramos-02-cost-storage",
        n: "02",
        title: "Cost & storage",
        note: "Storage charged on dwell rather than quoted. The KWI-C4 occupancy peak is the real maximum of the series, not a label sitting near it, and the deferral offered against the breach is checked to actually clear it.",
      },
      {
        id: "tramos-03-routing-utilisation",
        n: "03",
        title: "Routing & utilisation",
        note: "The corridor network ranked by leg rather than by echelon, so every lane spans exactly one column gap. All 17 nodes are laid out in world coordinates and the canvas is a window onto them; the 14 in view are derived from what fits, not from a filtered list.",
      },
    ],
    ready: true,
  },
  {
    slug: "vision-detection",
    short: "Label detection",
    n: "05",
    product: "Verso",
    kicker: "Vision · Detection",
    capability: "Locating and decoding a label",
    qualifier: "at any orientation",
    lead: "An accession label photographed at whatever angle it was glued on, located, deskewed and read into catalogue fields, with a confidence on every field, a stated threshold, and a human queue for the records that do not clear it.",
    body: [
      "The field confidences are the product of their own per-character confidences, which is what a sequence model actually emits. The accession number reads 0.973 across eight characters. The inscription reads 0.406 across ten, dragged under the 0.940 auto-accept threshold by a single glyph at 0.697, and that is precisely why this record is in review rather than accepted.",
      "What the detector found second is not a label at all. It is the tile's own painted cartouche, MATHE 13V3: real, photographed, and exactly the kind of mark a detector locates and a field parser cannot map. It is shown as a rejected candidate rather than quietly dropped. Every capture in both screens is a different object on the stand: no two frames anywhere show the same photograph.",
    ],
    views: [
      {
        id: "verso-01-object-record",
        n: "01",
        title: "Object record",
        note: "Two oriented boxes on the canvas at their measured angles, a four-stage pipeline naming its own model builds and per-stage milliseconds on cuda:0, and character-level confidence tinted per glyph on both read fields.",
      },
      {
        id: "verso-02-review-queue",
        n: "02",
        title: "Review queue",
        note: "The run partitions: 1,257 auto-accepted, 118 in review, 37 rejected, 1,412 captures. The two rejected for blur are actually blurred, C-0851 fell below the detector minimum, and the day-book concordance is three days stale.",
      },
    ],
    ready: true,
  },
  {
    slug: "vision-3d",
    short: "Structured-light 3D",
    n: "06",
    product: null,
    kicker: "Vision · 3D Capture",
    capability: "Dense 3D reconstruction",
    qualifier: "from coded structured light",
    lead: "Not a facade. A final-year engineering project, shown as itself: the turntable, its firmware and the reconstruction pipeline, built from first principles. It is the one piece of this work under no confidentiality obligation at all.",
    /**
     * The exception, and the reason the run ends here.
     *
     * Every other capability is illustrated by a reconstruction and stamped as
     * one. This one is the real thing, so it carries no filmstrip, no facade
     * overlay and no NDA line — it renders the StructuredLight exhibit instead.
     * Five pages that disclose a substitution and one that has nothing to
     * disclose is what proves the stamp means something on the other five.
     */
    exhibit: true,
    views: [],
    ready: true,
  },
];

export const liveWorks = works.filter((w) => w.ready);

export const bySlug = (slug) => works.find((w) => w.slug === slug) ?? null;

/**
 * Neighbours in the run, over the works that actually have pages.
 *
 * The run is a line, not a ring: the first work has no back step and the last
 * has no forward one. Wrapping would make the end of the set indistinguishable
 * from the middle of it, and the order carries an argument — the facades first,
 * the one real exhibit last.
 */
export function neighbours(slug) {
  const i = liveWorks.findIndex((w) => w.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return {
    prev: i > 0 ? liveWorks[i - 1] : null,
    next: i < liveWorks.length - 1 ? liveWorks[i + 1] : null,
  };
}
