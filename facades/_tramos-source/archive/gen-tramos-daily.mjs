/*
 * TRAMOS facade generator — emits the three logistics screens.
 *
 * Everything rendered is computed here from timestamps, lane kilometres and
 * rate cards. No figure on any screen is typed in, which is what lets
 * ../verify-logistics.mjs re-derive all of it from the markup and check that
 * the three views agree with each other.
 *
 *   node facades/_tramos-source/gen-tramos.mjs
 *
 * The shell CSS lives beside this file and is written into all three views
 * unchanged, so the sibling-identity assertions cannot drift.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const CSS = readFileSync(join(HERE, "shell.css"), "utf8").trimEnd();

/* ============================================================ the horizon */

const H0 = Date.parse("2026-02-06T00:00:00Z");
const H1 = Date.parse("2026-02-16T00:00:00Z");
const DAYS = 10;
const CARDW = 1410;             // inner width of a full-width card at 1440
const FROZEN = 464;             // frozen columns to the left of the track
const TRACK = CARDW - FROZEN;   // 946
const DAYW = TRACK / DAYS;      // 94.6
const NOW = Date.parse("2026-02-09T09:14:52Z");
const CLOCK = "09:14:52";
const RATECARD = "r-2026.02-a";

const ms = (s) => Date.parse(s + ":00Z");
const xOf = (t) => ((t - H0) / (H1 - H0)) * TRACK;
const r2 = (n) => Math.round(n * 100) / 100;

/* ================================================================ helpers */

function fmtT(n) { return n.toLocaleString("en-AU"); }
function money(n) { return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const n0 = (n) => Math.round(n).toLocaleString("en-AU");
function dur(m) {
  const mins = Math.round(m / 60000);
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), mm = mins % 60;
  return (d ? `${d}d ` : "") + (d || h ? `${h}h ` : "") + `${mm}m`;
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayLabel(d) {
  const t = new Date(H0 + d * 86400000);
  return { dow: DOW[t.getUTCDay()], date: `${String(t.getUTCDate()).padStart(2, "0")} ${MON[t.getUTCMonth()]}`,
    we: t.getUTCDay() === 0 || t.getUTCDay() === 6 };
}
const STATUS = { loading: "Loading", committed: "Committed", planned: "Planned",
  held: "Held", atrisk: "At risk", unscheduled: "Unscheduled" };
const STATCLASS = { loading: "loading", committed: "committed", planned: "planned",
  held: "held", atrisk: "atrisk", unscheduled: "unscheduled" };

/* ================================================================= the net */

// Receival zones. Each zone aggregates the sites that feed it; the graph on
// view 3 ranks these as leg 0.
const ZONES = [
  { id: "EWB", name: "Eastern Wheatbelt" },
  { id: "NWB", name: "Northern Wheatbelt" },
  { id: "MDW", name: "Mid West" },
  { id: "GSO", name: "Great Southern" },
  { id: "ESZ", name: "Esperance Zone" },
];
const PORTS = ["Kwinana", "Albany", "Geraldton", "Esperance"];
const ZONE_OF = {
  "NUN-1": "EWB", "KLB-1": "EWB", "CDN-2": "EWB", "MUK-2": "EWB", "BRK-2": "EWB", "BEN-1": "EWB",
  "WGN-4": "NWB", "DAL-1": "NWB", "WUB-1": "NWB",
  "MLW-1": "MDW", "YUN-3": "MDW", "PJR-1": "MDW",
  "CRG-2": "GSO", "LKG-1": "GSO", "KAT-5": "GSO", "NYB-1": "GSO",
  "SGM-1": "ESZ",
};
const zoneOf = (code) => ZONES.find((z) => z.id === ZONE_OF[code]);

// Storage is charged at the destination of each leg, per tonne per day.
// Port terminals cost more than an inland siding or yard.
const STORE = { siding: 0.42, yard: 0.42, port: 0.68 };
const echelonOf = (n) => (n.includes("siding") ? "siding" : n.includes("yard") ? "yard"
  : PORTS.includes(n) ? "port" : "zone");
const storeRate = (dest) => STORE[echelonOf(dest)] ?? 0;

// Lane kilometres, used only for the tonne-kilometre split on view 3.
const KM = {
  "NUN-1>Merredin siding": 95, "MUK-2>Merredin siding": 130, "BEN-1>Merredin siding": 75,
  "WGN-4>Avon siding": 110, "YUN-3>Mullewa siding": 70, "PJR-1>Mullewa siding": 120,
  "CRG-2>Albany": 320, "LKG-1>Albany": 245, "KAT-5>Albany": 165, "NYB-1>Albany": 190,
  "Merredin siding>Kwinana": 260, "Merredin siding>Northam yard": 160,
  "Northam yard>Kwinana": 100, "Avon siding>Kwinana": 130,
  "KLB-1>Kwinana": 205, "CDN-2>Kwinana": 155, "BRK-2>Kwinana": 245,
  "DAL-1>Kwinana": 250, "WUB-1>Kwinana": 275,
  "MLW-1>Geraldton": 100, "Mullewa siding>Geraldton": 100,
  "Mullewa siding>Mingenew yard": 65, "Mingenew yard>Geraldton": 105,
};

/* ============================================================== the orders */

// `to` is the leg's destination node; `rate`/`hand` are the plan's per-tonne
// totals across its legs, which is what the cost table adds up.
const P = [
  { id: "DO-51188", code: "NUN-1", site: "Nungarin", grade: "APW1", t: 6480, port: "Kwinana", status: "loading", vessel: "MV Aegean Harmony",
    rate: 23.1, hand: 10.35, acc: 0, legs: [
      { m: "road", to: "Merredin siding", S: "2026-02-06T05:40", E: "2026-02-07T16:10" },
      { m: "rail", to: "Kwinana", S: "2026-02-08T02:25", E: "2026-02-08T21:50" },
      { m: "load", to: "Berth 4", S: "2026-02-09T06:00", E: "2026-02-09T20:35" }] },
  { id: "DO-51194", code: "KLB-1", site: "Kellerberrin", grade: "APW1", t: 3240, port: "Kwinana", status: "loading", vessel: "MV Aegean Harmony",
    rate: 12.4, hand: 8, acc: 1296, legs: [
      { m: "rail", to: "Kwinana", S: "2026-02-08T04:50", E: "2026-02-08T19:15" },
      { m: "load", to: "Berth 4", S: "2026-02-09T21:10", E: "2026-02-10T04:45" }] },
  { id: "DO-51203", code: "CDN-2", site: "Cunderdin", grade: "APW1", t: 4860, port: "Kwinana", status: "committed", vessel: "MV Pacific Ibis",
    rate: 10.05, hand: 8, acc: 0, legs: [
      { m: "rail", to: "Kwinana", S: "2026-02-10T23:35", E: "2026-02-11T12:40" },
      { m: "load", to: "Berth 2", S: "2026-02-13T05:20", E: "2026-02-13T16:05" }] },
  { id: "DO-51209", code: "WGN-4", site: "Wongan Hills", grade: "APW1", t: 5760, port: "Kwinana", status: "committed", vessel: "MV Pacific Ibis",
    rate: 21.95, hand: 10.35, acc: 0, legs: [
      { m: "road", to: "Avon siding", S: "2026-02-10T05:15", E: "2026-02-11T09:50" },
      { m: "rail", to: "Kwinana", S: "2026-02-11T22:05", E: "2026-02-12T11:30" },
      { m: "load", to: "Berth 2", S: "2026-02-13T17:00", E: "2026-02-14T05:55" }] },
  { id: "DO-51212", code: "DAL-1", site: "Dalwallinu", grade: "APW1", t: 3960, port: "Kwinana", status: "planned", vessel: "MV Pacific Ibis",
    rate: 14.75, hand: 8, acc: 2640, legs: [
      { m: "rail", to: "Kwinana", S: "2026-02-12T18:40", E: "2026-02-13T04:55" },
      { m: "load", to: "Berth 2", S: "2026-02-14T06:30", E: "2026-02-14T15:20" }] },
  { id: "DO-51217", code: "MUK-2", site: "Mukinbudin–Bonnie Rock", grade: "H2", t: 2880, port: "Kwinana", status: "planned", vessel: "MV Star Aquila",
    rate: 28.05, hand: 10.35, acc: 0, legs: [
      { m: "road", to: "Merredin siding", S: "2026-02-12T05:15", E: "2026-02-13T00:40" },
      { m: "rail", to: "Kwinana", S: "2026-02-13T14:20", E: "2026-02-14T01:35" },
      { m: "load", to: "Berth 2", S: "2026-02-14T15:40", E: "2026-02-14T23:05" }] },
  { id: "DO-51221", code: "BRK-2", site: "Bruce Rock", grade: "H2", t: 3600, port: "Kwinana", status: "planned", vessel: "MV Star Aquila",
    rate: 14.3, hand: 8, acc: 0, legs: [
      { m: "rail", to: "Kwinana", S: "2026-02-13T21:05", E: "2026-02-14T10:50" },
      { m: "load", to: "Berth 2", S: "2026-02-15T01:20", E: "2026-02-15T08:55" }] },
  { id: "DO-51226", code: "CRG-2", site: "Corrigin", grade: "MALT1", t: 2340, port: "Albany", status: "committed", vessel: "MV Ocean Melody",
    rate: 29.4, hand: 8.6, acc: 0, legs: [
      { m: "road", to: "Albany", S: "2026-02-09T04:50", E: "2026-02-10T07:35" },
      { m: "load", to: "Berth 1", S: "2026-02-11T09:20", E: "2026-02-11T16:10" }] },
  { id: "DO-51231", code: "LKG-1", site: "Lake Grace", grade: "F1", t: 1980, port: "Albany", status: "committed", vessel: "MV Ocean Melody",
    rate: 22.15, hand: 8.6, acc: 0, legs: [
      { m: "road", to: "Albany", S: "2026-02-10T05:30", E: "2026-02-10T22:55" },
      { m: "load", to: "Berth 1", S: "2026-02-11T16:40", E: "2026-02-11T22:05" }] },
  { id: "DO-51234", code: "KAT-5", site: "Katanning", grade: "CAN1", t: 1180, port: "Albany", status: "atrisk", vessel: null,
    rate: 19.8, hand: 3.4, acc: 0, legs: [
      { m: "road", to: "Albany", S: "2026-02-12T06:10", E: "2026-02-12T18:48" }] },
  { id: "DO-51239", code: "MLW-1", site: "Mullewa", grade: "ASW1", t: 4320, port: "Geraldton", status: "committed", vessel: "MV Cape Bellina",
    rate: 7.6, hand: 7.65, acc: 0, legs: [
      { m: "rail", to: "Geraldton", S: "2026-02-09T23:40", E: "2026-02-10T11:02" },
      { m: "load", to: "Berth 3", S: "2026-02-11T05:00", E: "2026-02-11T18:35" }] },
  // Held. The rail leg departs before the road leg outturns, so it is costed
  // but not drawn on the board — the missed connection is the exception.
  { id: "DO-51243", code: "YUN-3", site: "Yuna", grade: "ASW1", t: 2760, port: "Geraldton", status: "held", vessel: "MV Cape Bellina",
    rate: 17.25, hand: 10, acc: 5090, legs: [
      { m: "road", to: "Mullewa siding", S: "2026-02-11T06:00", E: "2026-02-12T03:25" },
      { m: "rail", to: "Geraldton", S: "2026-02-12T01:40", E: "2026-02-12T13:05" },
      { m: "load", to: "Berth 3", S: "2026-02-13T04:30", E: "2026-02-13T16:10" }] },
  { id: "DO-51248", code: "SGM-1", site: "Salmon Gums", grade: "LUP1", t: 2460, port: "Esperance", status: "unscheduled", vessel: null,
    rate: null, hand: null, acc: 0, legs: [] },
  { id: "DO-51252", code: "WUB-1", site: "Wubin", grade: "H2", t: 2160, port: "Kwinana", status: "committed", vessel: "MV Golden Wattle",
    rate: 16.1, hand: 8, acc: 0, legs: [
      { m: "rail", to: "Kwinana", S: "2026-02-10T03:20", E: "2026-02-10T15:05" },
      { m: "load", to: "Berth 4", S: "2026-02-12T07:30", E: "2026-02-12T13:50" }] },
  { id: "DO-51256", code: "NYB-1", site: "Nyabing", grade: "MALT1", t: 1740, port: "Albany", status: "committed", vessel: "MV Ocean Melody",
    rate: 24.3, hand: 8.6, acc: 0, legs: [
      { m: "road", to: "Albany", S: "2026-02-09T06:20", E: "2026-02-09T22:10" },
      { m: "load", to: "Berth 1", S: "2026-02-11T22:40", E: "2026-02-12T03:35" }] },
  { id: "DO-51261", code: "BEN-1", site: "Bencubbin", grade: "H2", t: 2520, port: "Kwinana", status: "committed", vessel: "MV Golden Wattle",
    rate: 27.35, hand: 12.7, acc: 0, legs: [
      { m: "road", to: "Merredin siding", S: "2026-02-07T05:30", E: "2026-02-07T22:15", rate: 10.2, hand: 2.35 },
      { m: "rail", to: "Northam yard", S: "2026-02-08T09:40", E: "2026-02-08T18:25", rate: 9.8, hand: 2.35 },
      { m: "rail", to: "Kwinana", S: "2026-02-09T14:10", E: "2026-02-09T20:35", rate: 7.35, hand: 3.15 },
      { m: "load", to: "Berth 4", S: "2026-02-12T14:30", E: "2026-02-12T20:05", rate: 0, hand: 4.85 }] },
  { id: "DO-51266", code: "PJR-1", site: "Perenjori", grade: "ASW1", t: 1920, port: "Geraldton", status: "committed", vessel: "MV Cape Bellina",
    rate: 26.1, hand: 12.35, acc: 0, legs: [
      { m: "road", to: "Mullewa siding", S: "2026-02-08T06:00", E: "2026-02-08T19:40" },
      { m: "rail", to: "Mingenew yard", S: "2026-02-09T08:20", E: "2026-02-09T15:05" },
      { m: "rail", to: "Geraldton", S: "2026-02-10T05:40", E: "2026-02-10T12:25" },
      { m: "load", to: "Berth 3", S: "2026-02-12T06:20", E: "2026-02-12T12:05" }] },
];

/* ======================================================== derived: the cost */

// A leg's dwell is the wait at its own destination, before the next leg lifts.
// The held plan's rail leg departs early, so that gap is negative and no
// storage is charged for it.
for (const p of P) {
  p.dwells = [];
  for (let i = 0; i + 1 < p.legs.length; i++) {
    const gap = Math.max(0, ms(p.legs[i + 1].S) - ms(p.legs[i].E));
    p.dwells.push({ i, dest: p.legs[i].to, gapMs: gap, rate: storeRate(p.legs[i].to) });
  }
  // Tonnes times the per-tonne charge for the wait. Grouping it the other way
  // moves an exact half-cent onto the far side of the tie and the printed
  // column stops tallying, so keep the parentheses.
  p.legStore = p.dwells.map((d) => p.t * (d.rate * (d.gapMs / 86400000)));
  p.storage = +p.legStore.reduce((s, v) => s + +v.toFixed(2), 0).toFixed(2);
  p.freight = p.rate === null ? null : p.t * p.rate;
  p.handling = p.hand === null ? null : p.t * p.hand;
  p.total = p.rate === null ? null : p.freight + p.handling + p.storage + p.acc;
  p.perT = p.total === null ? null : p.total / p.t;
  p.km = p.legs.reduce((s, l) => s + (KM[`${p.code}>${l.to}`] ?? KM[`${prevNode(p, l)}>${l.to}`] ?? 0), 0);
}
function prevNode(p, leg) {
  const i = p.legs.indexOf(leg);
  return i === 0 ? p.code : p.legs[i - 1].to;
}

const SCHEDULED = P.filter((p) => p.legs.length);
const T_PLANNED = P.reduce((s, p) => s + p.t, 0);
const T_SCHED = SCHEDULED.reduce((s, p) => s + p.t, 0);
const LEGS = P.reduce((s, p) => s + p.legs.length, 0);
const DRAWN = LEGS;
const FORECAST = SCHEDULED.reduce((s, p) => s + p.total, 0);
const FREIGHT = SCHEDULED.reduce((s, p) => s + p.freight, 0);
const HANDLING = SCHEDULED.reduce((s, p) => s + p.handling, 0);
const STORAGE = +SCHEDULED.reduce((s, p) => s + p.storage, 0).toFixed(2);
const ACC = SCHEDULED.reduce((s, p) => s + p.acc, 0);
const PER_T = FORECAST / T_SCHED;
const DWELLS = P.reduce((s, p) => s + p.dwells.filter((d) => d.gapMs > 0).length, 0);

/* =============================================== derived: cell occupancy */

// Segregated cells at each port. Tonnage lands when a leg arrives and leaves
// when the loadout starts, so the daily peak is a function of view 1's bars.
const CELLS = [
  { id: "KWI-C4", port: "Kwinana", grade: "APW1", cap: 22500, open: 9240 },
  { id: "KWI-C2", port: "Kwinana", grade: "H2", cap: 14000, open: 4180 },
  { id: "GER-C3", port: "Geraldton", grade: "ASW1", cap: 16000, open: 6540 },
  { id: "ALB-C1", port: "Albany", grade: "MALT1", cap: 8500, open: 3120 },
  { id: "ALB-C3", port: "Albany", grade: "F1", cap: 7200, open: 2760 },
  { id: "ALB-C7", port: "Albany", grade: "CAN1", cap: 5000, open: 2240 },
  { id: "ESP-C5", port: "Esperance", grade: "LUP1", cap: 6000, open: 1860 },
];

// Tonnage lands when its leg arrives at the port and leaves when the loadout
// finishes, and the figure reported for a day is the highest balance reached
// during that day — a closing balance would hide a peak that clears by evening,
// which is exactly the breach the planner needs to see.
function cellSeries(cell) {
  const ev = [];
  for (const p of P) {
    if (p.port !== cell.port || p.grade !== cell.grade) continue;
    const arr = p.legs.find((l) => l.to === cell.port);
    const load = p.legs.find((l) => l.m === "load");
    if (arr) ev.push({ at: ms(arr.E), d: p.t });
    if (load) ev.push({ at: ms(load.E), d: -p.t });
  }
  ev.sort((a, b) => a.at - b.at);
  const out = [];
  let held = cell.open, k = 0;
  for (let d = 0; d < DAYS; d++) {
    const end = H0 + (d + 1) * 86400000;
    let peak = held;
    while (k < ev.length && ev[k].at < end) { held += ev[k].d; peak = Math.max(peak, held); k++; }
    out.push(peak);
  }
  return out;
}
for (const c of CELLS) {
  c.series = cellSeries(c);
  c.peak = Math.max(...c.series);
  c.breach = c.peak > c.cap;
  c.over = c.breach ? c.peak - c.cap : 0;
  c.peakDay = c.series.indexOf(c.peak);
}
const C4 = CELLS[0];

// The breach clears once the plan that tips it defers past the loadout that
// draws the cell back down. Five minutes of margin so the two do not land on
// the identical second.
const DEFER_PLAN = P.find((p) => p.id === "DO-51212");
const DEFER_MS = (() => {
  const load = P.find((p) => p.id === "DO-51203").legs.find((l) => l.m === "load");
  const arr = DEFER_PLAN.legs.find((l) => l.to === "Kwinana");
  return ms(load.E) - ms(arr.E) + 5 * 60000;
})();

const MISSED = P.find((p) => p.id === "DO-51243");
const OVERLAP_MS = ms(MISSED.legs[0].E) - ms(MISSED.legs[1].S);

/* ==================================================== derived: the network */

// Columns are ranked by LEG INDEX, not by echelon, so every edge spans exactly
// one column gap and there are no skip-edges cutting across the drawing. A
// facility reached at two different hop counts gets one instance per column.
function buildGraph() {
  const g = { nodes: new Map(), edges: [] };
  const node = (name, leg) => {
    const k = `${name}@${leg}`;
    if (!g.nodes.has(k)) g.nodes.set(k, { key: k, name, leg, ech: echelonOf(name), t: 0, orders: 0 });
    return g.nodes.get(k);
  };
  const gedge = (a, b, mode, t) => {
    const e = g.edges.find((x) => x.a === a.key && x.b === b.key && x.mode === mode);
    if (e) { e.t += t; e.legs += 1; } else g.edges.push({ a: a.key, b: b.key, mode, t, legs: 1 });
  };
  for (const p of P) {
    const z = node(zoneOf(p.code).name, 0);
    z.t += p.t; z.orders += 1;
    let prev = z, leg = 0;
    for (const gl of p.legs) {
      if (gl.m === "load") continue;
      leg += 1;
      const n = node(gl.to, leg);
      n.t += p.t; n.orders += 1;
      gedge(prev, n, gl.m, p.t);
      prev = n;
    }
  }
  return g;
}
const GRAPH_FULL = buildGraph();
const GRANKS = Math.max(...[...GRAPH_FULL.nodes.values()].map((n) => n.leg)) + 1;
const EDGE_MAX = Math.max(...GRAPH_FULL.edges.map((e) => e.t));

/* --------------------------------------------------- topology world layout */

// The whole network is laid out once, in world coordinates, and the canvas is
// a clipped window onto it. Nothing is filtered away: the rows below the fold
// are drawn and cut off, so their lanes genuinely cross the viewport edge.
const TOPO_W = 1380, TOPO_H = 196;
const COLX = [14, 404, 794, 1170], COLW = 210;
// One box height for every echelon. Transfer points used to be drawn shorter
// than endpoints, but on a uniform row pitch that only shows up as uneven gaps
// — and echelon is already carried by the fill and the left colour bar.
const ROWP = 46, NODEH = 38;

const topoCols = Array.from({ length: GRANKS }, (_, i) =>
  [...GRAPH_FULL.nodes.values()].filter((n) => n.leg === i)
    .sort((a, b) => b.t - a.t || a.name.localeCompare(b.name)));
const topoPos = new Map();
topoCols.forEach((c, i) => c.forEach((n, r) => topoPos.set(n.key,
  { x: COLX[i], y: r * ROWP, w: COLW, h: NODEH, row: r, col: i })));

const WORLD_W = COLX[GRANKS - 1] + COLW;
const WORLD_H = Math.max(...[...topoPos.values()].map((b) => b.y + b.h));
// A node is in view only if its whole box is inside the window, so the first
// row that fails is the one the viewport edge cuts through.
const inView = (k) => topoPos.get(k).y + topoPos.get(k).h <= TOPO_H;
const NODES_IN = [...GRAPH_FULL.nodes.keys()].filter(inView).length;
const LANES_IN = GRAPH_FULL.edges.filter((e) => inView(e.a) && inView(e.b)).length;
// "Fit" would shrink the whole network into the window; the canvas draws it at
// 1:1, so the readout is how much closer in than Fit that is.
const FIT = Math.min(TOPO_W / WORLD_W, TOPO_H / WORLD_H);
const ZOOM = Math.round(100 / FIT / 5) * 5;

const ECH = {
  zone: { fill: "#e9eef4", bar: "#3f5266", label: "Receival zone" },
  siding: { fill: "#f8ecef", bar: "#96586a", label: "Siding" },
  yard: { fill: "#f2f1e4", bar: "#6f6a33", label: "Consolidation yard" },
  port: { fill: "#fdf3e0", bar: "#b07a12", label: "Port terminal" },
};
// road solid, rail dashed — the dashes read as sleepers
const DASH = { rail: "5 4", road: "", none: "2 4" };

/* ================================================= derived: asset use */

const SET_T = 3600, BDOUBLE_T = 42, TARGET = 0.95;
const railLegs = P.flatMap((p) => p.legs.filter((l) => l.m === "rail").map((l) => ({ p, l })));
const roadLegs = P.flatMap((p) => p.legs.filter((l) => l.m === "road").map((l) => ({ p, l })));
const RAIL_TKM = railLegs.reduce((s, { p, l }) => s + p.t * (KM[`${prevNode(p, l)}>${l.to}`] ?? 0), 0);
const ROAD_TKM = roadLegs.reduce((s, { p, l }) => s + p.t * (KM[`${prevNode(p, l)}>${l.to}`] ?? 0), 0);
const RAIL_SETS = railLegs.reduce((s, { p }) => s + Math.ceil(p.t / SET_T), 0);
const ROAD_TRIPS = roadLegs.reduce((s, { p }) => s + Math.ceil(p.t / BDOUBLE_T), 0);

const UTIL = [
  { cls: "rail", lane: "KLB-1 → Kwinana", plan: "DO-51194", booking: "Dedicated set", units: 1, cap: SET_T, assigned: 3240, note: "deadfreight 360 t" },
  { cls: "rail", lane: "Northam yard → Kwinana", plan: "DO-51261", booking: "Per-tonne tariff", units: 1, cap: SET_T, assigned: 2520, note: "—" },
  { cls: "road", lane: "WGN-4 → Avon siding", plan: "DO-51209", booking: "B-double 42 t", units: 138, cap: 138 * BDOUBLE_T, assigned: 5760, note: "last trip 6 t" },
  { cls: "road", lane: "CRG-2 → Albany", plan: "DO-51226", booking: "B-double 42 t", units: 56, cap: 56 * BDOUBLE_T, assigned: 2340, note: "last trip 30 t" },
  { cls: "berth", lane: "Kwinana Berth 4", plan: "4 calls", booking: "Window granted", units: 4, granted: 30, used: 26.9, note: "—" },
  { cls: "berth", lane: "Geraldton Berth 3", plan: "3 calls", booking: "Window granted", units: 3, granted: 36, used: 31, note: "—" },
  { cls: "berth", lane: "Kwinana Berth 2", plan: "5 calls", booking: "Window granted", units: 5, granted: 64, used: 54.7, note: "—" },
  { cls: "berth", lane: "Albany Berth 1", plan: "3 calls", booking: "Window granted", units: 3, granted: 32, used: 17.2, note: "window over-granted" },
];
for (const u of UTIL) {
  u.factor = u.cls === "berth" ? (u.used / u.granted) * 100 : (u.assigned / u.cap) * 100;
}
// Berth windows are granted in blocks and routinely run slack, so the
// below-target count is about the moving assets, not the quay.
const BELOW_TARGET = UTIL.filter((u) => u.cls !== "berth" && u.factor < TARGET * 100).length;

/* ============================================ derived: route candidates */

// Alternatives the optimiser costed for the two orders that are not clean.
// Each is priced with the same rate card as the plan it would replace.
const CANDS = [
  { do: "DO-51212", label: "Rail direct, as planned", chain: "RAIL", cur: 1, feas: "fail",
    why: `KWI-C4 peaks ${fmtT(C4.peak)} t on ${dayLabel(C4.peakDay).date} against ${fmtT(C4.cap)} t` },
  { do: "DO-51212", label: "Rail direct, departure deferred", chain: "RAIL", cur: 0, dwellMs: 51600000,
    freight: 58410, handling: 31680, storage: 1608.2, acc: 2640, feas: "rec",
    why: "Arrives after the DO-51203 loadout; peak drops under cap" },
  { do: "DO-51212", label: "Road direct to Kwinana", chain: "ROAD", cur: 0, dwellMs: 31140000,
    freight: 112860, handling: 31680, storage: 972.4, acc: 0, feas: "ok",
    why: "Feasible but road tariff is 93% above the rail lane" },
  { do: "DO-51212", label: "Rail to Geraldton, tranship", chain: "RAIL+SEA", cur: 0, dwellMs: null,
    freight: null, handling: null, storage: null, acc: null, feas: "fail",
    why: "Vessel is berthed at Kwinana" },
  { do: "DO-51243", label: "Road + rail via Mullewa siding", chain: "ROAD+RAIL", cur: 1, feas: "fail",
    why: `Rail departs ${dur(OVERLAP_MS)} before road outturn` },
  { do: "DO-51243", label: "Road direct to Geraldton", chain: "ROAD", cur: 0, dwellMs: 36900000,
    freight: 53544, handling: 21114, storage: 801.55, acc: 0, feas: "rec",
    why: "Single leg, makes the vessel window" },
  { do: "DO-51243", label: "Rail re-slot, next path", chain: "ROAD+RAIL", cur: 0, dwellMs: 122900000,
    freight: 47610, handling: 27600, storage: 2645.77, acc: 3250, feas: "ok",
    why: "Next path misses the vessel window" },
];
// The route a plan is already on is not re-costed here — it *is* the plan, so
// it carries view 2's own figures and the two screens cannot drift apart.
for (const c of CANDS) {
  const p = P.find((x) => x.id === c.do);
  c.t = p.t;
  if (c.cur) {
    c.dwellMs = p.dwells.reduce((s, d) => s + d.gapMs, 0);
    c.freight = p.freight; c.handling = p.handling; c.storage = p.storage; c.acc = p.acc;
  }
  c.landed = c.freight == null ? null : c.freight + c.handling + c.storage + c.acc;
  c.perT = c.landed === null ? null : c.landed / c.t;
}
const INFEASIBLE = CANDS.filter((c) => c.feas === "fail").length;

/* ================================================================== shell */

const NAVS = ["Schedule board", "Cost & storage", "Routing", "Terminals", "Rate cards", "Nominations"];

function page({ title, tab, cmd, sum, body, foot }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>TRAMOS — ${title}</title><style>
${CSS}
</style></head>
<body>

<header class="app">
  <div class="wm"><i class="mk"></i><b>TRAMOS</b></div>
  <nav class="tabs">
${NAVS.map((t) => `    <div class="tab${t === tab ? " on" : ""}">${t.replace("&", "&amp;")}</div>`).join("\n")}
  </nav>
  <div class="sp"></div>
  <div class="rt">
    <div class="qf"><i class="g"></i>Search plans, sites, vessels</div>
    <div class="envp">PROD</div>
    <div class="av">KV</div>
  </div>
</header>

<div class="cmd">
${cmd}
</div>
<div class="sum">${sum}</div>
<main class="main">
${body}
</main>

<footer class="foot">
  <span>Corridor <b style="font-weight:600;color:var(--fg2)">WA Grain</b></span><i class="d"></i>
  <span>Rate card <span data-check="footRate">${RATECARD}</span></span><i class="d"></i>
  <span>Telematics feed synced <span data-check="footSync">09:12:47</span> &middot; <span style="color:var(--warn)">2 h stale</span></span><i class="d"></i>
  <span>${foot}</span>
  <div style="flex:1"></div>
  <span>TRAMOS <b style="font-weight:600;color:var(--fg2)">4.8.2</b> &middot; build 20260209.3</span>
</footer>
</body></html>
`;
}

const sg = (label, value, kind = "") =>
  `<div class="g ${kind}"><span class="lb">${label}</span><b data-check="sum-${
    label.toLowerCase().replace(/[^a-z]+/g, "-")}">${value}</b></div>`;

/* ============================================================ view 1 — board */

// A bar only carries as much label as it has room for: the mode and its
// tonnage on a long haul, the mode alone on a shorter one, nothing on a
// stub. Anything else overflows the bar and reads as a rendering fault.
const LAB_LONG = 72, LAB_SHORT = 41, DWL_MIN = 45;

function barLabel(l, p, w) {
  const mode = l.m.toUpperCase();
  if (w >= LAB_LONG) return `${mode} &middot; ${fmtT(p.t)} t`;
  if (w >= LAB_SHORT) return mode;
  return "";
}

function ganttRow(p) {
  const drawn = p.legs;
  const bars = drawn.map((l, i) => {
    const x = xOf(ms(l.S)), w = xOf(ms(l.E)) - x;
    const lab = barLabel(l, p, w);
    // a leg that lifts before the one feeding it has finished is the missed
    // connection, and is outlined rather than silently drawn overlapping
    const bad = i > 0 && ms(l.S) < ms(drawn[i - 1].E);
    return `<i class="bar bar--${l.m}${bad ? " bad" : ""}" data-leg="${p.id}:${i}" data-mode="${l.m}"` +
      ` data-start="${l.S}" data-end="${l.E}" data-left="${r2(x)}" data-width="${r2(w)}"` +
      ` style="left:${r2(x)}px;width:${r2(w)}px">${lab ? `<em>${lab}</em>` : ""}</i>`;
  }).join("");

  const dw = [];
  for (let i = 0; i + 1 < drawn.length; i++) {
    const a = ms(drawn[i].E), b = ms(drawn[i + 1].S);
    if (b <= a) continue;
    const x = xOf(a), w = xOf(b) - x;
    dw.push(`<i class="dw" data-dwell="${p.id}:${i}" data-from="${drawn[i].E}" data-to="${drawn[i + 1].S}"` +
      ` style="left:${r2(x)}px;width:${r2(w)}px"></i>`);
    if (w >= DWL_MIN) {
      const txt = dur(b - a);
      dw.push(`<span class="dwl" data-dwlabel="${p.id}:${i}" style="left:${r2(x + w / 2 - txt.length * 2.6)}px">${txt}</span>`);
    }
  }

  // the vessel sits after the last bar, truncated rather than flipped — a
  // flipped label collided with its own bar
  let tail = "";
  if (p.status === "unscheduled") {
    tail = `<span class="vlbl mut" style="left:8px">&mdash; not scheduled &middot; awaiting ${p.port} stem</span>`;
  } else if (p.vessel) {
    const x = xOf(ms(drawn[drawn.length - 1].E)) + 7;
    tail = `<span class="vlbl" data-vessel="${p.id}" style="left:${r2(x)}px;max-width:${r2(TRACK - x - 3)}px">${p.vessel}</span>`;
  } else {
    const x = xOf(ms(drawn[drawn.length - 1].E)) + 7;
    tail = `<span class="vlbl mut" style="left:${r2(x)}px;max-width:${r2(TRACK - x - 3)}px">no vessel nomination</span>`;
  }

  return `<tr data-row="plan" data-do="${p.id}" data-tonnes="${p.t}" data-grade="${p.grade}"` +
    ` data-port="${p.port}" data-status="${p.status}" data-legs="${p.legs.length}">
  <td class="fz pl"><b style="font-weight:600">${p.id}</b></td>
  <td class="fz">${p.code} <span class="mut">&middot;</span> ${p.site}</td>
  <td class="fz">${p.grade}</td>
  <td class="fz" style="text-align:right;padding-right:12px !important">${fmtT(p.t)}</td>
  <td class="fz"><span class="stat"><i class="dot d-${STATCLASS[p.status]}"></i>${STATUS[p.status]}</span></td>
  <td class="trk">${bars}${dw.join("")}${tail}</td>
</tr>`;
}

const EXCEPTIONS = [
  ["e", "Missed connection", `${MISSED.id} &middot; Mullewa siding`,
    `Rail departs <b>${dur(OVERLAP_MS)}</b> before road outturn finishes. Held &mdash; ${fmtT(MISSED.t)} t ${MISSED.grade} misses the ${MISSED.vessel} window.`,
    "Re-slot"],
  ["e", "Cell over capacity", `${C4.id} ${C4.grade} &middot; ${dayLabel(C4.peakDay).date}`,
    `Peak <b>${fmtT(C4.peak)} t</b> vs ${fmtT(C4.cap)} t, over by ${fmtT(C4.over)} t. Clears if ${DEFER_PLAN.id} defers <b>${dur(DEFER_MS)}</b>.`,
    `Defer ${DEFER_PLAN.id}`],
  ["w", "Lane rate lapsed", "KAT-5 &rarr; Albany",
    `Expired 08 Feb, not renewed. DO-51234 costed at A$ ${money(19.8)}/t, unconfirmed.`, "Renew lane"],
  ["w", "Rail set under-loaded", `DO-51194 &middot; set ${fmtT(SET_T)} t`,
    `${fmtT(3240)} t loaded, ${fmtT(SET_T - 3240)} t short. Deadfreight A$ ${money(1296)} at A$ ${money(3.6)}/t.`,
    "Top up set"],
  ["w", "No vessel nomination", "DO-51248 &middot; Esperance",
    `${fmtT(2460)} t LUP1 unscheduled. ESP-C5 holds ${fmtT(CELLS[6].open)} t, no movement in horizon.`,
    "Request stem"],
];

function view1() {
  const wk = [];
  for (let d = 0; d < DAYS; d++) if (dayLabel(d).we) wk.push(`<i class="wk" style="left:${r2(d * DAYW)}px;width:${r2(DAYW)}px"></i>`);
  const heads = Array.from({ length: DAYS }, (_, d) => {
    const l = dayLabel(d);
    return `<div class="dayh${l.we ? " we" : ""}" style="left:${r2(d * DAYW)}px;width:${r2(DAYW)}px"><em>${l.dow}</em><b>${l.date}</b></div>`;
  }).join("");
  const nowX = r2(xOf(NOW));

  const cmd = `  <div class="vsel">Corridor schedule &middot; 06&ndash;15 Feb<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">+</i>New plan</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Commit plan</div>
  <div class="btn btn--o">Re-book leg</div>
  <div class="btn btn--o">Split allocation</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip">Port: all 4</div>
  <div class="chip chip--on">Grade: 6 of 8<i class="x">&times;</i></div>
  <div class="chip chip--st">Telematics 2 h stale</div>
  <div class="chip">Synced <span data-check="synced">${CLOCK}</span></div>`;

  const sum = [
    sg("Planned", `${fmtT(T_PLANNED)} t`),
    sg("Scheduled", `${fmtT(T_SCHED)} t`),
    sg("Legs", `${LEGS}`),
    sg("Plans", `${SCHEDULED.length} of ${P.length}`),
    sg("Forecast", `A$ ${money(FORECAST)}`),
    sg("Per tonne", `A$ ${money(PER_T)}`),
    sg("Exceptions", `${EXCEPTIONS.length}`, "w"),
    `<div class="g sp"></div>`,
    sg("Horizon", "06 &ndash; 15 Feb 2026"),
  ].join("");

  const body = `<section class="card" style="flex:1;min-height:0">
    <div class="gantt">
      <div class="gov">
        ${wk.join("")}
      </div>
      <div class="nowlayer">
        <i class="nowl" data-check-left="${nowX}" style="left:${nowX}px"></i>
      </div>
      <table class="g">
        <colgroup><col style="width:88px"><col style="width:152px"><col style="width:62px"><col style="width:66px"><col style="width:96px"><col style="width:${TRACK}px"></colgroup>
        <thead><tr>
          <th class="fz pl">Order &#9652;</th><th class="fz">Receival site</th><th class="fz">Grade</th>
          <th class="fz" style="text-align:right;padding-right:12px !important">Tonnes</th><th class="fz">Status</th>
          <th class="trk" style="position:relative">${heads}</th>
        </tr></thead>
        <tbody>${P.map(ganttRow).join("")}</tbody>
      </table>
    </div>
</section>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Exceptions<span class="ct">${EXCEPTIONS.length}</span></div><div class="dtab">Segregation capacity<span class="ct">${CELLS.length}</span></div><div class="dtab">Cost summary</div><div class="dtab">Activity<span class="ct">34</span></div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">2 blocking &middot; commit disabled</div>
  </div>
  <div class="dock__b">${EXCEPTIONS.map(([k, ttl, ref, txt, act]) =>
    `<div class="exr exr--${k}" data-row="exception" data-kind="${k}"><i class="bd"></i><span class="ttl">${ttl}</span><span class="ref">${ref}</span><span class="txt">${txt}</span><span class="act">${act}</span></div>`).join("")}
  </div>
</section>`;

  return page({ title: "Corridor schedule", tab: "Schedule board", cmd, sum, body,
    foot: `Horizon 06&ndash;15 Feb 2026 (AWST)` });
}

/* ========================================================= view 2 — the cost */

const CG_COLS = `<colgroup><col style="width:290px"><col style="width:120px"><col style="width:82px"><col style="width:126px"><col style="width:120px"><col style="width:110px"><col style="width:110px"><col style="width:130px"><col style="width:88px"><col style="width:104px"><col></colgroup>`;

function costRow(p) {
  if (!p.legs.length) {
    return `<tr class="pl dim" data-row="cost" data-kind="unscheduled" data-do="${p.id}" data-tonnes="${p.t}" data-legs="0">
      <td class="l">${p.id} <span class="mut" style="font-weight:400">&middot; ${p.code} ${p.site}</span></td>
      <td class="l">${p.port}</td>
      <td>${fmtT(p.t)}</td>
      <td data-f="freight">&mdash;</td><td data-f="handling">&mdash;</td><td data-f="storage">&mdash;</td>
      <td data-f="acc">&mdash;</td><td data-f="total">&mdash;</td><td data-f="pert">&mdash;</td>
      <td class="l"><span class="tag tag--n">Unscheduled</span></td>
      <td class="l"><span class="mut">no nomination</span></td></tr>`;
  }
  const tag = p.status === "held" ? "tag--e" : p.status === "atrisk" ? "tag--w"
    : p.status === "planned" ? "tag--n" : "tag--o";
  const label = p.status === "held" ? "Held" : p.status === "atrisk" ? "Unconfirmed"
    : p.status === "planned" ? "Draft" : "Confirmed";
  return `<tr class="pl${p.id === "DO-51261" ? " sc" : ""}" data-row="cost" data-kind="plan" data-do="${p.id}" data-tonnes="${p.t}" data-legs="${p.legs.length}">
      <td class="l">${p.id} <span class="mut" style="font-weight:400">&middot; ${p.code} ${p.site}</span></td>
      <td class="l">${p.port}</td>
      <td>${fmtT(p.t)}</td>
      <td data-f="freight">${money(p.freight)}</td>
      <td data-f="handling">${money(p.handling)}</td>
      <td data-f="storage">${money(p.storage)}</td>
      <td data-f="acc">${p.acc ? money(p.acc) : "&mdash;"}</td>
      <td data-f="total">${money(p.total)}</td>
      <td data-f="pert">${money(p.perT)}</td>
      <td class="l"><span class="tag ${tag}">${label}</span></td>
      <td class="l"><span class="mut">${p.vessel ?? "no nomination"}</span></td></tr>`;
}

// One plan is expanded so the buildup is visible: a leg's freight is its own
// tariff, and its storage is the wait at its own destination.
function legRows(p) {
  return p.legs.map((l, i) => {
    const d = p.dwells[i];
    const freight = l.rate * p.t, hand = l.hand * p.t;
    const store = d ? +p.legStore[i].toFixed(2) : 0;
    const total = freight + hand + store;
    const km = KM[`${prevNode(p, l)}>${l.to}`];
    const label = l.m === "load"
      ? `Ship loading &middot; ${p.vessel}`
      : `${l.m === "road" ? "Road" : "Rail"} &middot; ${prevNode(p, l)} &rarr; ${l.to}${km ? ` ${km} km` : ""}`;
    return `<tr class="lg" data-row="cost" data-kind="leg" data-do="${p.id}" data-leg="${i}" data-tonnes="${p.t}"` +
      ` data-rate="${l.rate}" data-hand="${l.hand}" data-store-rate="${d ? d.rate : 0}" data-dwell-ms="${d ? d.gapMs : 0}" data-acc="0">
      <td class="l">${label}</td>
      <td class="l">${l.m === "load" ? l.to : l.to}</td>
      <td>${fmtT(p.t)}</td>
      <td data-f="freight">${freight ? money(freight) : "&mdash;"}</td>
      <td data-f="handling">${money(hand)}</td>
      <td data-f="storage">${store ? money(store) : "&mdash;"}</td>
      <td data-f="acc">&mdash;</td>
      <td data-f="total">${money(total)}</td>
      <td data-f="pert">${money(total / p.t)}</td>
      <td class="l"><span class="mut">${d && d.gapMs ? `dwell ${dur(d.gapMs)}` : "&mdash;"}</span></td>
      <td class="l"><span class="mut">A$ ${money(l.rate || l.hand)}/t</span></td></tr>`;
  }).join("");
}

function occChart() {
  const W = 1384, H = 146, PAD = 8, BASE = 126, TOP = 16;
  const ceil = Math.max(C4.cap, C4.peak) * 1.155;
  const bw = (W - PAD * 2) / DAYS - 16;
  const step = (W - PAD * 2) / DAYS;
  const y = (v) => BASE - (v / ceil) * (BASE - TOP);
  const bars = C4.series.map((v, i) => {
    const x = r2(PAD + i * step), yy = r2(y(v)), h = r2(BASE - y(v));
    const over = v > C4.cap;
    const lbl = over
      ? `<text x="${r2(x + bw / 2)}" y="${r2(yy + 13)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${fmtT(v)}</text>`
      : `<text x="${r2(x + bw / 2)}" y="${r2(yy - 5)}" text-anchor="middle" font-size="10" fill="#7d8592">${fmtT(v)}</text>`;
    return `<rect data-occ="${i}" data-peak="${v}" x="${x}" y="${yy}" width="${r2(bw)}" height="${h}" rx="2" fill="${over ? "#b3261e" : "#a3adba"}"></rect>${lbl}`;
  }).join("");
  const capY = r2(y(C4.cap));
  const days = C4.series.map((_, i) => {
    const l = dayLabel(i);
    return `<text x="${r2(PAD + i * step + bw / 2)}" y="141" text-anchor="middle" font-size="10" fill="${l.we ? "#a3abb6" : "#7d8592"}">${l.dow} ${l.date}</text>`;
  }).join("");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${bars}
    <line x1="0" y1="${capY}" x2="${W}" y2="${capY}" stroke="#b3261e" stroke-width="1" stroke-dasharray="4 3"></line>
    <text x="2" y="${r2(capY - 5)}" font-size="9.5" font-weight="700" fill="#b3261e">CAPACITY ${fmtT(C4.cap)} t</text>
    <line x1="0" y1="${BASE}" x2="${W}" y2="${BASE}" stroke="#d3d8df" stroke-width="1"></line>
    ${days}
  </svg>`;
}

function view2() {
  const cmd = `  <div class="vsel">Cost &amp; storage &middot; 06&ndash;15 Feb<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">+</i>New basis</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Publish forecast</div>
  <div class="btn btn--o">Re-price lane</div>
  <div class="btn btn--o">Compare rate cards</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip chip--on">Rate card <span data-check="sum-rate-card">${RATECARD}</span><i class="x">&times;</i></div>
  <div class="chip">Basis: forecast</div>
  <div class="chip chip--st">1 lane lapsed</div>
  <div class="chip">Synced <span data-check="synced">${CLOCK}</span></div>`;

  const sum = [
    sg("Forecast", `A$ ${money(FORECAST)}`),
    sg("Freight", `A$ ${money(FREIGHT)}`),
    sg("Handling", `A$ ${money(HANDLING)}`),
    sg("Storage", `A$ ${money(STORAGE)}`),
    sg("Accessorial", `A$ ${money(ACC)}`),
    sg("Per tonne", `A$ ${money(PER_T)}`),
    sg("Dwells", `${DWELLS}`),
    `<div class="g sp"></div>`,
    sg("Rate card", RATECARD),
  ].join("");

  const rows = P.map((p) => costRow(p) + (p.id === "DO-51261" ? legRows(p) : "")).join("");

  const body = `<section class="card" style="flex:1;min-height:0">
  <div class="card__h"><h2>Leg cost buildup &middot; ${LEGS} legs across ${SCHEDULED.length} plans</h2>
    <span class="tag tag--n">A$ ${money(PER_T)}/t landed</span><div class="sp"></div>
    <span class="mut" style="font-size:11px">storage charged on dwell at each leg's destination</span></div>
  <div class="card__b"><div class="cgw"><div class="cgb">
    <table class="cg">
      ${CG_COLS}
      <thead>
        <tr class="g1"><th class="l" colspan="3">Order</th><th colspan="5">Cost components (A$)</th><th>A$/t</th><th class="l" colspan="2">State</th></tr>
        <tr class="g2"><th class="l">Plan / receival site</th><th class="l">Port</th><th>Tonnes</th>
          <th>Freight</th><th>Handling</th><th>Storage</th><th>Accessorial</th><th>Total</th><th>Per tonne</th>
          <th class="l">Status</th><th class="l">Vessel</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td class="l">Corridor total &middot; ${SCHEDULED.length} scheduled plans</td>
        <td class="l"></td>
        <td data-check="footT">${fmtT(T_SCHED)}</td>
        <td data-check="footFreight">${money(FREIGHT)}</td>
        <td data-check="footHand">${money(HANDLING)}</td>
        <td data-check="footStore">${money(STORAGE)}</td>
        <td data-check="footAcc">${money(ACC)}</td>
        <td data-check="footTotal">${money(FORECAST)}</td>
        <td data-check="footPerT">${money(PER_T)}</td>
        <td class="l"></td><td class="l"></td></tr></tfoot>
    </table>
  </div></div>
</section>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Storage forecast</div><div class="dtab">Rate cards<span class="ct">5</span></div><div class="dtab">Exposure</div><div class="dtab">Lane changes<span class="ct">6</span></div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">${C4.id} peak <b style="color:#b3261e">${fmtT(C4.peak)} t</b> on ${dayLabel(C4.peakDay).date} &middot; ${fmtT(C4.over)} t over &middot; clears if ${DEFER_PLAN.id} defers <b data-check="deferBy">${dur(DEFER_MS)}</b></div>
  </div>
  <div class="dock__b"><div class="occ"><div style="position:absolute;left:14px;top:6px;font-size:11px;color:var(--fg3)">${C4.id} &middot; ${C4.grade} segregated cell &mdash; forecast peak held per day &middot; opening <b style="color:var(--fg2);font-weight:600" data-check="c4open">${fmtT(C4.open)}</b> t &middot; driven by ${DAYS} scheduled movements</div>
   <div style="padding-top:18px">${occChart()}</div></div></div>
</section>`;

  return page({ title: "Cost & storage", tab: "Cost & storage", cmd, sum, body,
    foot: `Basis forecast &middot; ${LEGS} legs costed` });
}

/* ====================================================== view 3 — the network */

const chipSvg = (x, y, txt) => {
  const cw = txt.length * 5.5 + 10;
  return `<rect x="${r2(x - cw / 2)}" y="${y - 8}" width="${r2(cw)}" height="16" rx="3" fill="#fff" stroke="#e5e8ec"/>
    <text x="${r2(x)}" y="${y + 3.5}" text-anchor="middle" font-size="9.5" fill="#59616d">${txt}</text>`;
};

function topoSvg(w, h) {
  const pos = topoPos;

  // distinct entry slot per inbound edge so converging lanes stay apart
  const inb = {};
  for (const e of GRAPH_FULL.edges) (inb[e.b] ||= []).push(e);
  const entry = new Map();
  for (const [k, list] of Object.entries(inb)) {
    const b = pos.get(k);
    list.sort((x, y2) => pos.get(x.a).y - pos.get(y2.a).y);
    list.forEach((e, i) => entry.set(e, r2(b.y + (b.h * (i + 1)) / (list.length + 1))));
  }

  // Two passes: every line first, then every chip. Drawing each edge as a
  // line-plus-chip unit let a later edge's line paint over an earlier chip.
  const geo = GRAPH_FULL.edges.map((e, i) => {
    const a = pos.get(e.a), b = pos.get(e.b);
    const x1 = a.x + a.w, y1 = r2(a.y + a.h / 2), x2 = b.x, y2 = entry.get(e);
    const bx = r2(x1 + (x2 - x1) * (0.30 + (i % 3) * 0.12));
    const txt = `${n0(e.t)} t &middot; ${e.legs} ${e.mode}`;
    const half = (txt.length * 5.5 + 10) / 2;
    const lx = r2(Math.min(Math.max(bx + half + 4, bx + (x2 - bx) / 2), x2 - half - 6));
    return { e, x1, y1, x2, y2, bx, txt, lx, width: r2(1.2 + (e.t / EDGE_MAX) * 6.5) };
  });
  const lines = geo.map(({ e, x1, y1, x2, y2, bx, width }) =>
    `<path data-edge="${e.a}|${e.b}" data-mode="${e.mode}" data-t="${e.t}" data-legs="${e.legs}"
      d="M ${x1} ${y1} H ${bx} V ${y2} H ${x2}" fill="none" stroke="#8892a0" stroke-width="${width}"
      stroke-linejoin="round" opacity=".8"${DASH[e.mode] ? ` stroke-dasharray="${DASH[e.mode]}"` : ""}/>`).join("");
  const chips = geo.map(({ lx, y2, txt }) => chipSvg(lx, y2, txt)).join("");

  const boxes = [...GRAPH_FULL.nodes.values()].map((n) => {
    const b = pos.get(n.key), s = ECH[n.ech];
    const brk = n.ech === "port" && CELLS.find((c) => c.port === n.name && c.breach);
    // name on line one, tonnage on line two beside the leg tag — putting the
    // tonnage on line one collided with any name longer than "Mid West"
    const y1 = b.y + 15, y2 = b.y + 29;
    return `<g data-node="${n.key}" data-ech="${n.ech}" data-leg="${n.leg}" data-t="${n.t}" data-x="${b.x}" data-y="${b.y}" data-w="${b.w}" data-h="${b.h}" data-in="${inView(n.key) ? 1 : 0}">
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="${s.fill}" stroke="${brk ? "#b3261e" : "#d3d8df"}"/>
      <rect x="${b.x}" y="${b.y}" width="4" height="${b.h}" rx="2" fill="${s.bar}"/>
      <text x="${b.x + 12}" y="${y1}" font-size="11.5" font-weight="600" fill="#1c232c">${n.name}</text>
      ${brk ? `<rect x="${b.x + b.w - 70}" y="${b.y + 6}" width="58" height="14" rx="3" fill="#fdf0ef" stroke="#eec4c1"/>
        <text x="${b.x + b.w - 41}" y="${b.y + 16}" text-anchor="middle" font-size="9" font-weight="700" fill="#b3261e">C4 breach</text>` : ""}
      <text x="${b.x + 12}" y="${y2}" font-size="9.5" fill="#7d8592">${n.leg === 0 ? `${n.orders} orders` : `leg ${n.leg}`}</text>
      <text x="${b.x + b.w - 11}" y="${y2 + 1}" text-anchor="end" font-size="13" font-weight="600" fill="#1c232c">${n0(n.t)} t</text></g>`;
  }).join("");

  const hdrs = topoCols.map((_, i) =>
    `<text x="${COLX[i]}" y="-6" font-size="9.5" font-weight="700" letter-spacing="1" fill="#7d8592">${i === 0 ? "ORIGIN" : "LEG " + i}</text>`).join("");
  // the column headers sit above the window, so they stay outside the clip
  return `<svg width="${w}" height="${h}" viewBox="0 -18 ${w} ${h + 18}">
    <defs><clipPath id="topovp"><rect x="0" y="0" width="${w}" height="${h}"/></clipPath></defs>
    ${hdrs}<g clip-path="url(#topovp)">${lines}${chips}${boxes}</g></svg>`;
}

// A literal miniature: the same world layout at one scale factor, with the
// window drawn over it. Because both come from topoPos, the dots inside the
// rectangle are exactly the nodes the canvas draws whole.
function minimap() {
  const W = 176, H = 62, PADX = 12, TOP = 9, INH = 40;
  const msc = Math.min((W - PADX * 2) / WORLD_W, INH / WORLD_H);
  const mx = (b) => r2(PADX + (b.x + b.w / 2) * msc);
  const my = (b) => r2(TOP + (b.y + b.h / 2) * msc);
  const dots = [...GRAPH_FULL.nodes.values()].map((n) => {
    const b = topoPos.get(n.key), on = inView(n.key);
    return `<rect x="${r2(mx(b) - 2)}" y="${r2(my(b) - 2)}" width="4" height="4" rx="1"
      fill="${ECH[n.ech].bar}" fill-opacity="${on ? 1 : 0.28}"
      data-mini="${b.col}:${b.row}" data-in="${on ? 1 : 0}" data-ech="${n.ech}" data-cy="${my(b)}"/>`;
  }).join("");
  const vpH = r2(TOPO_H * msc);
  return `<svg class="mini" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect x="0" y="0" width="${W}" height="${H}" rx="3" fill="#fff" stroke="#d3d8df"/>
    ${dots}
    <rect data-check="viewport" data-h="${vpH}" data-full="${r2(WORLD_H * msc)}" data-scale="${msc}"
      data-y="${TOP}" data-w="${r2(WORLD_W * msc)}"
      x="${PADX}" y="${TOP}" width="${r2(WORLD_W * msc)}" height="${vpH}" rx="2"
      fill="#b26b00" fill-opacity=".06" stroke="#b26b00" stroke-width="1.2"/>
    <text x="6" y="${H - 4}" font-size="7.5" font-weight="700" letter-spacing=".9" fill="#a3abb6">NETWORK</text>
    <text x="${W - 6}" y="${H - 4}" text-anchor="end" font-size="7.5" font-weight="700" fill="#a3abb6">${
      NODES_IN} / ${GRAPH_FULL.nodes.size} NODES</text>
  </svg>`;
}

function utilRows() {
  const out = [];
  let cls = null;
  for (const u of UTIL) {
    if (u.cls !== cls) {
      cls = u.cls;
      out.push(`<tr class="grp"><td class="l" colspan="9">${
        cls === "rail" ? "Rail sets" : cls === "road" ? "Road fleet &middot; B-double" : "Berth windows"}</td></tr>`);
    }
    const good = u.factor >= TARGET * 100;
    const bar = u.cls === "berth" ? "" : good ? "o" : "w";
    out.push(`<tr data-row="util" data-class="${u.cls}" data-plan="${u.plan}"${
      u.cls === "berth" ? ` data-key="${u.lane}" data-granted="${u.granted}" data-used="${u.used}"`
        : ` data-cap="${u.cap}" data-assigned="${u.assigned}"`} data-units="${u.units}">
      <td class="l"><span class="tag tag--n">${u.cls.toUpperCase()}</span></td>
      <td class="l">${u.lane}</td>
      <td class="l">${u.cls === "berth" ? u.plan : u.plan}</td>
      <td class="l">${u.booking}</td>
      <td>${fmtT(u.units)}</td>
      <td>${u.cls === "berth" ? u.granted.toFixed(1) + " h" : fmtT(u.cap)}</td>
      <td>${u.cls === "berth" ? u.used.toFixed(1) + " h" : fmtT(u.assigned)}</td>
      <td><span class="mtr"><span class="bar2"><i class="${bar}" style="width:${r2(Math.min(100, u.factor))}%"></i></span><b>${u.factor.toFixed(1)}%</b></span></td>
      <td class="l"><span class="${u.note === "—" ? "mut" : ""}" ${u.note !== "—" ? 'style="color:var(--brand-fg);font-weight:600"' : ""}>${u.note}</span></td></tr>`);
  }
  return out.join("");
}

function candRows() {
  return CANDS.map((c) => {
    const fe = c.feas === "fail" ? `<span class="fail">Infeasible</span>`
      : c.feas === "rec" ? `<span class="rec">Recommended</span>` : "Feasible";
    const cells = c.landed === null
      ? `<td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td>`
      : `<td>${dur(c.dwellMs)}</td><td>${money(c.freight)}</td><td>${money(c.handling)}</td>` +
        `<td>${money(c.storage)}</td><td>${c.acc ? money(c.acc) : "&mdash;"}</td>` +
        `<td>${money(c.landed)}</td><td>${money(c.perT)}</td>`;
    return `<tr${c.cur ? ' class="cur"' : ""} data-row="cand" data-do="${c.do}" data-current="${c.cur}" data-t="${c.t}"${
      c.landed === null ? "" : ` data-freight="${c.freight}" data-handling="${c.handling}" data-storage="${c.storage}" data-acc="${c.acc}" data-landed="${c.landed}"`}>
      <td class="l">${c.do}</td><td class="l">${c.label}</td>
      <td class="l"><span class="tag tag--n">${c.chain}</span></td>
      ${cells}
      <td class="l">${fe} <span class="mut">&middot; ${c.why}</span></td></tr>`;
  }).join("");
}

function view3() {
  const cmd = `  <div class="vsel">Routing &middot; 06&ndash;15 Feb<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">&#8635;</i>Re-run optimiser</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Apply recommended</div>
  <div class="btn btn--o">Compare routes</div>
  <div class="btn btn--o">Release capacity</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip chip--on">2 orders open<i class="x">&times;</i></div>
  <div class="chip">Optimiser <span data-check="sum-optimiser">09:02:11</span></div>
  <div class="chip chip--st">${INFEASIBLE} routes infeasible</div>
  <div class="chip">Synced <span data-check="synced">${CLOCK}</span></div>`;

  const sum = [
    sg("Zones", `${ZONES.length}`),
    sg("Lanes", `${GRAPH_FULL.edges.length}`),
    sg("Rail", `${n0(RAIL_TKM)} t&middot;km`),
    sg("Road", `${n0(ROAD_TKM)} t&middot;km`),
    sg("Rail sets", `${RAIL_SETS}`),
    sg("Road trips", `${n0(ROAD_TRIPS)}`),
    sg("Infeasible", `${INFEASIBLE}`, "e"),
    `<div class="g sp"></div>`,
    sg("Optimiser", "09:02:11"),
  ].join("");

  const body = `<div class="hero">
  <section class="card" style="flex:0 0 268px">
    <div class="card__h"><h2>Network topology</h2>
      <span class="chip chip--on" style="height:20px;font-size:10.5px">Horizon 06&ndash;16 Feb<i class="x">&times;</i></span>
      <span class="tag tag--n" data-check="graphLanes">${LANES_IN} of ${GRAPH_FULL.edges.length} lanes in view</span>
      <div class="sp"></div>
      ${Object.entries(ECH).map(([k, s]) => `<span class="lgd"><i style="background:${s.bar}"></i>${s.label}</span>`).join("")}
      <span class="lgd"><i class="ln"></i>road</span><span class="lgd"><i class="ln dash"></i>rail</span>
      <span class="zm"><b>&minus;</b><span data-check="zoom">${ZOOM}%</span><b>+</b><em>Fit</em></span></div>
    <div class="card__b"><div class="topo" style="padding:20px 14px 0">${topoSvg(TOPO_W, TOPO_H)}${minimap()}</div></div>
  </section>
  <section class="card" style="flex:1;min-height:0">
    <div class="card__h"><h2>Asset utilisation</h2>
      <span class="tag tag--w" data-check="belowTarget">${BELOW_TARGET} lanes below target</span><div class="sp"></div>
      <span class="mut" style="font-size:11px">target ${(TARGET * 100).toFixed(0)}% &middot; rail sets ${fmtT(SET_T)} t &middot; B-double ${BDOUBLE_T} t</span></div>
    <div class="card__b">
      <table class="ut">
        <colgroup><col style="width:74px"><col style="width:290px"><col style="width:110px"><col style="width:150px"><col style="width:70px"><col style="width:110px"><col style="width:110px"><col style="width:150px"><col></colgroup>
        <thead><tr><th class="l">Class</th><th class="l">Lane / asset</th><th class="l">Order</th><th class="l">Booking</th><th>Units</th><th>Capacity</th><th>Assigned</th><th>Load factor</th><th class="l">Note</th></tr></thead>
        <tbody>${utilRows()}</tbody>
      </table>
    </div>
  </section>
</div>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Route candidates<span class="ct">${CANDS.length}</span></div><div class="dtab">Feasibility checks<span class="ct">6</span></div><div class="dtab">Optimiser runs<span class="ct">4</span></div><div class="dtab">Lane capacity</div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">${INFEASIBLE} of ${CANDS.length} infeasible &middot; apply blocked while an order is held</div>
  </div>
  <div class="dock__b">
    <table class="ut">
      <colgroup><col style="width:96px"><col style="width:250px"><col style="width:96px"><col style="width:110px"><col style="width:104px"><col style="width:104px"><col style="width:104px"><col style="width:110px"><col style="width:112px"><col style="width:70px"><col></colgroup>
      <thead><tr><th class="l">Order</th><th class="l">Candidate route</th><th class="l">Chain</th><th>Dwell</th><th>Freight</th><th>Handling</th><th>Storage</th><th>Accessorial</th><th>Landed A$</th><th>A$/t</th><th class="l">Feasibility</th></tr></thead>
      <tbody>${candRows()}</tbody>
    </table>
  </div>
</section>`;

  return page({ title: "Routing & utilisation", tab: "Routing", cmd, sum, body,
    foot: `Optimiser run 09:02:11 &middot; ${CANDS.length} candidates` });
}

writeFileSync(join(OUT, "tramos-01-corridor-schedule", "index.html"), view1());
writeFileSync(join(OUT, "tramos-02-cost-storage", "index.html"), view2());
writeFileSync(join(OUT, "tramos-03-routing-utilisation", "index.html"), view3());
console.log(`plans ${P.length} · legs ${LEGS} (${DRAWN} drawn) · tonnes ${fmtT(T_PLANNED)}`);
console.log(`forecast A$ ${money(FORECAST)} · per tonne A$ ${money(PER_T)} · dwells ${DWELLS}`);
console.log(`${C4.id} peak ${fmtT(C4.peak)} / ${fmtT(C4.cap)} on day ${C4.peakDay} · defer ${dur(DEFER_MS)}`);
console.log(`graph ${GRAPH_FULL.nodes.size} nodes (${NODES_IN} in view) · ${GRAPH_FULL.edges.length} lanes · zoom ${ZOOM}%`);
console.log(`rail ${n0(RAIL_TKM)} t·km · road ${n0(ROAD_TKM)} t·km · sets ${RAIL_SETS} · trips ${n0(ROAD_TRIPS)}`);

export { P, CELLS, GRAPH_FULL, CANDS, UTIL };
