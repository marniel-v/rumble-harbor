export const DISCLOSURE =
  "Reference implementation. The original is under NDA.";

export const CONSTRUCTION = "Under Construction";

export const works = [
  {
    slug: "bio",
    short: "Bio",
    n: "Bio",
    product: "About Me",
    kicker: "Bio",
    capability: "Marniel Vosloo",
    qualifier: "Senior Software Engineer",
    lead: "I’m a senior software engineer specialising in the design and development of complex, production-grade systems. I work across the full stack, with particular strength in backend architecture, data-intensive applications, distributed systems, cloud infrastructure, and algorithmic problem solving.",
    body: [
      "I’m at my best when the problem is complicated, the constraints are real, and there is no clean greenfield solution. I’ve built and evolved systems spanning B2B analytics, multi-cloud infrastructure, manufacturing, and logistics, often taking ownership from architecture and technical design through implementation and long-term operation.",
      "My approach is pragmatic and engineering-led: understand the problem, choose the right tools for the constraints, and build systems that are performant, reliable, maintainable, and capable of evolving with the business.",
    ],
    bio: true,
    views: [],
    ready: true,
  },
  {
    slug: "analytics",
    short: "Prototype to Platform",
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
    lead: "I took a working B2B analytics prototype whose business logic lived largely in the browser and turned it into a backend-driven platform serving two dozen client organisations and data from a mobile app with 20,000 users. Over the course of a year, I designed and built the domain model, query layer, multi-tenant access control, and caching architecture, with the central challenge being how to make increasingly complex hierarchical analytics fast enough to operate at organisational scale.",
    body: [
      "The product was intentionally different from a conventional dashboard. Rather than presenting clients with a wall of charts, it turned raw activity into a small set of actionable statements, deriving figures across global, country, organisation, and individual levels. Almost nothing displayed was stored, so each view depended on calculations against the underlying data.",
      "As the platform grew, that approach exposed a performance problem that could not be solved simply by reducing the number of queries. An organisation view could execute around twenty of them, often repeating work that had already been performed elsewhere, yet even after reducing the query count the page could still take three to five minutes to assemble. The real cost was the aggregation itself, and because the data only needed to be a day old, there was little reason to perform that work while a user was waiting for a page to load.",
      "I moved the calculations into a nightly processing pipeline that built the hierarchy once, from the top down, allowing each level to reuse the work already completed above it. The query layer then used the structure of each query as its cache key, so queries sharing a prefix could reuse the same cached work instead of recomputing the same aggregation independently.",
      "This changed the architecture from a collection of expensive page-level calculations into a common calculation chain that could support organisation, global, and individual views alike. Pages that had previously taken several minutes to assemble now loaded in under three seconds.",
      "I was the lead engineer on a two-person team, owning the technical design, backend, and frontend architecture while my manager continued to set product direction and we shared interface design. The result was not simply a faster application, but a backend that could support the product’s analytical model without pushing its computational cost onto every user request.",
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
    short: "Billing Under Failure",
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
    lead: "I helped grow a production control plane for deploying and securing application services from an established two-year-old platform into a 100-tenant system spanning six clouds. Over three and a half years, I built core capabilities across infrastructure, observability, security, and billing, but the work that demanded the most engineering discipline was metered billing: turning continuous consumption into an accurate, recoverable calculation that could withstand failure without ever producing the wrong invoice.",
    body: [
      "When I joined, the platform already had paying customers and the basic control plane was working, but much of the infrastructure still needed to be built. That meant the work had to happen around a live production system rather than behind one. I was one of three full-stack engineers, with a frontend developer joining in the final year, and ownership was deliberately end to end: each engineer was responsible for complete subsystems rather than working within a particular technical layer.",
      "That model carried through the platform as it expanded. The time-series layer allowed it to report what infrastructure had actually done rather than what it had been configured to do, while provider integrations extended support across clouds and introduced node provisioning and live installation feedback so stalled deployments could be identified before they became failures. Alongside those systems, I built the WAF interface and migrated the existing frontend onto the new stack.",
      "Billing became the most difficult of those subsystems because the requirement changed fundamentally. The existing implementation charged for discrete actions; the platform now needed to charge for continuous consumption, measured over time and enabled independently for each customer. What had previously been a lookup therefore became a calculation, and correctness had to hold even when the process doing that calculation did not.",
      "A failed request, a partial calculation, a retry, missing telemetry, or a billing run that stopped halfway through could never result in a duplicate or incorrect charge. Failures had to be visible and recoverable, with the same inputs producing the same result when processing resumed. Six iterations appeared to work under normal conditions, but each was rejected because normal operation was not sufficient for a production billing system.",
      "The seventh iteration finally satisfied the requirement and shipped. Since then, it has completed every billing cycle across every tenant without a single billing failure.",
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
    short: "Systems of Record",
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
    lead: "Over six years, I replaced a manufacturing operation built around spreadsheets with a production platform that became the system of record for inventory, manufacturing, shipping, and engineering data. As the sole developer and IT infrastructure owner, I evolved it in place through a live factory operation, using the system to enforce manufacturing procedures, establish unit-level traceability, and support the company’s ISO 9001 certification.",
    body: [
      "The starting point was an electronics manufacturer whose operational history was spread across spreadsheets. By the end, forty people were using the platform every day across thousands of items, with functionality covering item master data and inventory, the manufacturing floor and its procedures, outbound shipping, and version-controlled engineering packages. The company was not ISO 9001 certified when the project began; the system helped achieve certification by putting those procedures into the production process, preserving complete traceability for every unit, and providing the documentation needed to support them.",
      "The six-year timescale was not simply a reflection of the amount of functionality involved. The factory had to keep operating throughout the build, so there was no clean migration window and no opportunity for a wholesale rewrite. Each capability had to be introduced into an existing production environment without disrupting the operation, which made the safety and maintainability of every change part of the engineering problem.",
      "Unit-level traceability became the clearest example. A barcode scan needed to reconstruct an individual unit’s history, tracing its components back to their sources, identifying the build they entered, and following the stations, procedures, and production events they passed through. That relationship crossed around fifteen tables, and the initial query took close to two minutes.",
      "Because rebuilding the system was not an option, I tackled the problem at the query layer. Common table expressions allowed the traceability chain to be constructed once, while indexes were designed around the path the lookup actually followed. Typical lookups fell to around half a second, while more complex views covering hundreds of items completed in roughly three seconds.",
      "The same emphasis on control and history shaped the engineering package system. BoMs, schematics, and configuration files were versioned per module, access was controlled by department and category, changes notified dependent users, and production was protected from superseded revisions. Across the platform, the guiding principle was the same: in a live manufacturing environment, a solution was only successful if it could be introduced safely and then maintained without creating operational risk.",
      "My manager provided the operational direction and feature requirements, while a CS designer helped shape the UI from the halfway point, but I owned the technical design, implementation, and day-to-day evolution of the system. After six years of incremental development, the platform remains in production to this day.",
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
    short: "Topology to Budget",
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
    lead: "In four months, I replaced a transport estimation script with an application capable of costing complex multi-leg networks across 1,000+ commodities and more than 30 years of project demand. The solution combined a network designer, costing engine, and budget workflow, with the architecture deliberately split between what Power Platform could provide quickly and what needed to be engineered from scratch.",
    body: [
      "I was the only engineer on a four-person team, working with three logistics specialists who owned the domain calculations and guided the interface. The original tool was a console script that counted containers, trucks, trips, and kilometres behind a fuel estimate; the replacement needed to let planners define origins, demand splits, transport modes, utilisation, legs, and destinations, then apply those networks to commodities and material groups and resolve the resulting cost month by month across the life of the project.",
      "The four-month deadline made technology choice part of the architecture. I used Power Platform for the multi-user shell, shared components, and approval workflow, which kept the delivery practical while allowing the engineering effort to concentrate on the network editor, calculation engine, authentication through Entra, and the authorisation rules governing who could generate a budget.",
      "That decision did not mean keeping everything inside the platform. The first version of the network editor used Power Apps galleries to represent the underlying data, but they proved too restrictive for the way planners actually needed to work. Rather than forcing the workflow into those constraints, I replaced the galleries with custom React components hosted inside the platform. It increased the complexity of the solution, but produced an editor that could properly support network design.",
      "The calculation engine followed the same principle. Running as a Python service on Azure Functions, it expanded the network into commodity-by-node-by-month quantities, priced the resulting movements, and handled complex routing efficiently, including manually defined road sections. I also redesigned and optimised the routing algorithms, parallelised independent work, and cached recurring routes so that repeated calculations did not have to solve the same paths again.",
      "Those changes made the application practical for scenario analysis: a full network could return in under thirty seconds, while a re-run completed in under ten. The work also turned individual network designs into reusable assets, allowing planners to apply an existing network to different commodities rather than recreating it each time.",
      "The final budgets emerged as line-by-line capex and opex proposals that could be routed through review and approval, giving planners a way to compare competing scenarios before selecting one. The result was a substantial step up from the original script, not because every part was custom-built, but because each technology was used where it solved the problem most effectively.",
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
    short: "Label Detection",
    n: "05",
    product: "Verso",
    kicker: "Vision · Detection",
    capability: "Locating and decoding a label",
    qualifier: "at any orientation",
    lead: "An accession label photographed at whatever angle it was glued on, located, deskewed and read into catalogue fields, with a confidence on every field, a stated threshold, and a human queue for the records that do not clear it.",
    disclosure: false,
    construction: true,
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
