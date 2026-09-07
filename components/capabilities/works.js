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
    capability: "B2B analytics at organisation scale",
    qualifier: "from prototype to platform",
    role: {
      title: "Lead Engineer",
      team: "Two-person team",
      span: "One year",
      scope:
        "Backend architecture, data layer, caching and access control. Front-end structure, components, and part of the interface design.",
    },
    lead: "A B2B analytics platform existed as a working prototype, with most of its logic in the frontend. Over a year, I built the backend that replaced it: the domain model, query layer, multi-tenant access control, and caching architecture. Two dozen client organisations used it against data collected by a mobile app with 20,000 users.",
    body: [
      "I was the lead engineer on a two-person team. My manager had built the original prototype and set the product direction, while interface design was shared between us. I owned the technical design, backend, and frontend architecture. The product already worked; the challenge was moving its business logic out of the browser and into a backend that could scale.",
      "The platform was designed to turn raw activity into a small set of actionable statements rather than expose clients to a wall of charts. Almost nothing displayed was stored. Every figure was derived across a hierarchy spanning global, country, organisation, and individual levels.",
      "That became the central performance problem. An organisation view could execute around twenty queries, many repeating work performed elsewhere, and take three to five minutes to complete. Reducing the query count lowered database load but did little for the user, because the expensive part was the aggregation itself, and the data only needed to be a day old.",
      "I moved those calculations into a nightly processing pipeline that built the hierarchy once, top down. Each level reused the work already completed above it, and the query layer turned the structure of each query into its cache key. Queries sharing a prefix therefore shared the same cached work rather than recomputing it.",
      "The result was a backend that could derive organisation-level, global, and individual views from a common calculation chain rather than treating each as a separate query problem. Pages that had taken several minutes to assemble now loaded in under three seconds.",
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
      title: "Full-stack Engineer",
      team: "Three-person team",
      span: "Three and a half years",
      scope:
        "Metered billing and invoicing, time-series integration, and cloud-provider integrations. The interfaces over them, including provisioning, live deployment progress, and security policy. Migration of the existing frontend onto the new stack.",
    },
    lead: "A control plane for deploying and securing application services across cloud providers. It was already two years old and carrying paying customers when I joined, with the core platform working but much of the infrastructure still to be built. Over three and a half years, I developed its metered billing, time-series layer, cloud-provider integrations, and the interfaces over them as the platform grew to 100 tenants across six clouds.",
    body: [
      "I was one of three full-stack engineers, with a frontend developer joining in the final year. At that size, ownership was end to end rather than divided by layer: each of us was responsible for complete subsystems. The platform was already in production and generating revenue, so every capability had to be introduced without taking it offline.",
      "The work therefore came as complete subsystems rather than isolated tickets. The time-series integration let the platform report what it had actually done rather than what it had been configured to do. Provider integrations added new clouds, node provisioning, and live installation feedback so stalled deployments could be identified before they failed. I also built the WAF user interface and migrated the existing frontend onto the new stack.",
      "Billing was the most demanding problem. The existing model charged for discrete actions; the platform now needed to charge for continuous consumption, metered over time and enabled independently for each customer. That changed billing from a lookup into a calculation.",
      "The requirement was stronger than simply avoiding errors. A failed request, a partial calculation, a retry, missing telemetry, or a process that stopped halfway through a billing run could never turn into a duplicate or incorrect charge. Failures had to be visible and recoverable, with the same inputs producing the same result when processing resumed.",
      "That constraint took seven iterations to satisfy. Six versions worked under normal conditions; each went back because normal conditions were not the bar. The seventh shipped and has completed every billing cycle across every tenant without a single billing failure.",
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
    role: {
      title: "Sole Full-stack Engineer",
      team: "Three-person team",
      span: "Six years",
      scope:
        "Data model, backend architecture, frontend application, and deployment. I also managed the company network and IT infrastructure that supported it",
    },
    lead: "An electronics manufacturer was running its operational history on spreadsheets. Over six years, I built the platform that replaced them: item master data and inventory, the manufacturing floor and its procedures, outbound shipping, and version-controlled engineering packages. Forty people used it daily across thousands of items.",
    body: [
      "I was the sole developer and also responsible for the company’s IT infrastructure. My manager provided the operational direction and feature requirements, while a CS designer helped shape UI from the halfway point. I owned the technical design, implementation, and day-to-day evolution of the system. The platform stayed in production throughout the six-year build, so there was no greenfield rewrite or clean migration window. Every capability had to be introduced without disrupting an active manufacturing operation.",
      "The company was not ISO 9001 certified when the project began. The platform helped achieve certification by enforcing manufacturing procedures, maintaining complete traceability for every unit, and providing the documentation needed to support them.",
      "The hardest problem was unit-level traceability. A barcode scan needed to reconstruct a unit’s entire history: where its components came from, which build they entered, and every station, procedure, and production event they passed through. Common table expressions allowed me to build the traceability chain once, while indexes were designed around the path the lookup actually followed. The result was typical lookups in around half a second, with more complex views covering hundreds of items completing in roughly three seconds.",
      "The engineering packages carried the same requirement from the other direction. BoMs, schematics, and configuration files were versioned per module, access was controlled by department and category, changes notified dependent users, and production was protected from superseded revisions.",
      "The same constraints shaped how I approached requirements. In a live manufacturing environment, technically possible was not enough; changes had to be safe to introduce and maintain in place. When a proposed solution created operational risk, I pushed back and solved the underlying problem another way.",
      "The platform remains in production to this day.",
    ],
    views: [
      {
        id: "erp-01-portal",
        n: "01",
        title: "Traceability portal",
        note: "One unit scanned at a station and its whole route back: every station it passed, how long it took, who ran it and what it said. The failure and the rework it caused are left in rather than summarised away, because a record that only keeps the good outcomes is not the record. All of it comes back from one scan.",
      },
      {
        id: "erp-02-shipment",
        n: "02",
        title: "Shipment PKG-4471",
        note: "The same units further along, as lines on an outbound shipment, where one held line stops the paperwork for all of them. A single item identity has to serve the floor that built it and the documents that ship it, which is most of the argument for one system rather than several.",
      },
    ],
    ready: true,
  },
  {
    slug: "logistics",
    short: "Topology to budget",
    n: "04",
    product: "TRAMOS",
    kicker: "Logistics · Estimation",
    capability: "Cost modelling for multi-leg transport networks",
    qualifier: "over a thirty-year horizon",
    role: {
      title: "Sole Full-stack Engineer",
      team: "Four-person team",
      span: "Four months",
      scope:
        "Application architecture on Power Platform, with custom React components for the interactive parts. The Python calculation service on Azure Functions, the schedule import, and the Entra identity and access setup.",
    },
    lead: "A transport estimation tool existed as a console script that calculated containers, trucks, trips, and the kilometres behind a fuel estimate. Over four months, I built the application that replaced it: a network designer, costing engine, and budget workflow. A package could contain up to 1,000 commodities; networks could span twenty nodes across six legs; costing resolved month by month across thirty years.",
    body: [
      "I was the only engineer on a four-person team. Three logistics specialists owned the domain calculations and guided the interface; I owned the architecture, calculation engine, and application around it. With only four months to deliver, I chose Power Platform because it made an enterprise solution practical to develop within that timeframe, providing the multi-user shell, shared components, and approval workflow while leaving the engineering effort for what had to be built from scratch. I implemented authentication through Entra and the authorisation rules governing who could generate budgets.",
      "The core problem was modelling a network rather than simply routing a shipment. Planners defined origins, demand splits, transport modes, utilisation, legs, and destinations, then assigned those networks to commodities and material groups. The costing engine expanded that model into tonnes by node and month across the project lifetime before producing the final budget.",
      "The network editor was my first wrong turn. Power Apps galleries could represent the data but were not capable of editing the network effectively, so I replaced them with custom React components hosted inside the platform. It was more complex to own, but it produced an editor planners could actually work with.",
      "The calculation engine ran as a Python service on Azure Functions. I redesigned and optimised the routing algorithms to solve complex networks efficiently, including manually defined road sections, then expanded demand into commodity-by-node-by-month quantities and priced them. Runs were parallelised, and recurring routes were cached rather than solved repeatedly. A full network returned in under thirty seconds; a re-run in under ten, making scenario analysis practical.",
      "Designed networks also became reusable. Planners could apply an existing network to different commodities, building a shared library instead of recreating the same transport model. Budgets then emerged as line-by-line capex and opex proposals, routed through review and approval so competing scenarios could be evaluated before one was selected.",
    ],
    views: [
      {
        id: "tramos-01-corridor-schedule",
        n: "01",
        title: "Corridor schedule",
        note: "The same network in time rather than in space. Once demand resolves to a node and a month, the movements carrying it have positions and durations, and the plan becomes a view of the same figures the cost was computed from.",
      },
      {
        id: "tramos-02-cost-storage",
        n: "02",
        title: "Cost & storage",
        note: "Cost that nobody types in. Storage is charged on how long material sits, so the figure follows from the schedule that put it there, and changing the schedule changes the charge. Everything on this screen is downstream of the network on the previous one.",
      },
      {
        id: "tramos-03-routing-utilisation",
        n: "03",
        title: "Routing & utilisation",
        note: "A network read as a graph rather than as rows. The shape is the thing being edited: which origins feed which legs, and how demand splits before any of it is priced. As a table it is all present and none of it is legible.",
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
