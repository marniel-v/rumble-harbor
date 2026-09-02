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
 * `role` states what part of the work was actually mine. It sits in the same
 * slot on every page for the same reason the disclosure does: a scope note that
 * always appears in one place reads as a spec line, where the same note dropped
 * into the prose of some pages and not others reads as something being slid
 * past the reader. Optional, and absent on works still being written up.
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
    short: "Prototype to platform",
    n: "01",
    product: "Bellwether",
    kicker: "Analytics · Insights",
    capability: "B2B analytics at organization scale",
    qualifier: "from prototype to platform",
    role: {
      title: "Lead developer",
      team: "Two-person team",
      span: "One year",
      scope:
        "Backend architecture, data layer, caching and access control. Front-end structure, components, and part of the interface design.",
    },
    lead: "A B2B analytics platform that existed as a working prototype, with most of the logic still in the front end. Over a year I gave it a domain model, a query layer, and access control across tenants, and took it to two dozen client organizations reading data collected by a mobile app with twenty thousand users.",
    body: [
      "Its job was not to hand an organization a dashboard and wish them luck. It had to turn raw activity into a few readable statements they could act on, for an audience that wasn't analysts and would have got nothing from a wall of charts. That takes a lot of derived numbers: global, country, organization, down to a single person. All of them were computed on demand, and an organization's view took three to five minutes to build while someone watched it load.",
      "Making the queries cheaper helped the database and barely moved the page. The problem wasn't how fast the aggregation ran. It was that it ran while someone was waiting, and nobody had ever needed the number to be newer than a day.",
      "So it moved to a nightly job that builds the hierarchy once, top down, each level derived from the one above. The query layer makes the chain you write the key it caches under, so anything sharing a prefix picks up where it diverges. A second organization's view is a filter over work already done, not a query of its own. Views went to under three seconds.",
    ],
    views: [
      {
        id: "bellwether-01-fleet-overview",
        n: "01",
        title: "Fleet overview",
        note: "An aggregate over the whole population, a ranked list under it, and one entity broken into the signals behind its score. Three levels of the same data, all wanted on one screen, and in the naive version each one is its own query.",
      },
      {
        id: "bellwether-02-model-thresholds",
        n: "02",
        title: "Model & thresholds",
        note: "The weights and the cut as configuration rather than code. Moving the threshold changes the population it selects, so the sweep beside it shows what each cut would flag before you commit to one.",
      },
    ],
    ready: true,
  },
  {
    slug: "cloud",
    short: "Billing under failure",
    n: "02",
    product: "Slipstream",
    kicker: "Cloud · Control Plane",
    capability: "Multi-cloud control planes",
    qualifier: "metered down to the invoice",
    role: {
      title: "Full-stack developer",
      team: "Three-person team",
      span: "Three and a half years",
      scope:
        "Metered billing and invoicing, timeseries integration, and cloud provider integrations. The interfaces over them, including provisioning, live deployment progress and security policy. The migration of the existing front end onto the new stack during the UI overhaul.",
    },
    lead: "A control plane for deploying and securing application services across cloud providers. It was two years old and already had paying customers when I joined, with the basics working and not much beyond them. Over three and a half years on a team of three I built its metered billing, its timeseries layer and the integrations that brought new providers in, and shared the rebuild of its front end as it grew to a hundred tenants across six clouds.",
    body: [
      "It already had billing when I arrived, of the kind that charges for a discrete action and nothing else. What the platform needed was to charge for consumption, metered continuously and opted into per customer, which changed what an invoice was. The amount stopped being a fact anyone could look up and became something the system worked out. Every other feature on the platform fails in front of the person using it. Billing fails behind them, once a month, against their card.",
      "So the rule was that no failure anywhere in the pipeline could end in a wrong charge. It could end in an error someone could see, or in a state the customer could carry on from, and nowhere else. Holding it to that took seven versions. Six of them worked. Each one went back because working was not the bar, and billing is a bad place to find out what you missed.",
      "The seventh ran every billing cycle for the rest of the engagement, across every tenant on the platform, and did not fail once.",
    ],
    views: [
      {
        id: "slipstream-01-rollout-console",
        n: "01",
        title: "Rollout console",
        note: "A change going out in waves rather than all at once, with each region's progress and health visible while it moves. The interesting state is not the one where everything succeeded. It is the region that stopped, and what the system did about it without being asked.",
      },
      {
        id: "slipstream-02-gates-policy",
        n: "02",
        title: "Gates & policy",
        note: "The conditions that halt a rollout, held as configuration rather than buried in the code that enforces them. A rule you can read is a rule you can argue with before it fires, which is most of the difference between a policy and a behaviour.",
      },
      {
        id: "slipstream-03-edge-protection",
        n: "03",
        title: "Edge protection",
        note: "Rules in front of the same estate, some enforcing and some only watching. Turning one on is a decision with a blast radius, so monitor mode exists to say what enforcement would have done before anyone commits to it.",
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
