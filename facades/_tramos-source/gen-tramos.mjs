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

// A package is costed month by month over the life of the programme. Thirty
// years is 360 columns, which no grid can render legibly, so the board shows a
// window and the strip above it places that window in the horizon.
//
// The window is ruled in weeks. Six years at thirteen pixels a month drew a
// schedule nobody could read a date off: a phase turn landed a finger's width
// from where it happened, and a schedule that cannot say when is a picture of
// a schedule. Four years in weeks is the shortest window that still holds
// every stream's opening and the commissioning they wait on.
const Y0 = 2026, YN = 2055;
const MONTHS = (YN - Y0 + 1) * 12;      // 360
const WIN_Y = 4;                        // 2026–2029, the window on the board
const WIN_M0 = 0, WIN_M = WIN_Y * 12;   // …in the months the model costs in
const WIN_W0 = 0, WIN_W = WIN_Y * 52;   // …and in the weeks the grid rules in
const WPM = WIN_W / WIN_M;              // 4.33 weeks to a month
// The track is 832px because 832 / 208 is 4 exactly. A week has to be a whole
// number of pixels or the grid rules it against lands on fractional offsets and
// the columns come out visibly uneven; the frozen columns absorb the remainder.
const CARDW = 1410;                     // inner width of a full-width card at 1440
const FROZEN = 578;                     // frozen columns to the left of the track
const TRACK = CARDW - FROZEN;           // 832
const WKW = TRACK / WIN_W;              // 4 px per week
const QTRW = WKW * 13;                  // 52 px per quarter — 13 whole weeks
const YRW = WKW * 52;                   // 208 px per year — 4 whole quarters
const CLOCK = "09:14:52";
const RATECARD = "r-2026.02-a";
const RUN_AT = "09:02:11", RUN_SECS = 8.4;
const PACKAGE = "WA Grain Corridor Programme";
const COMMODITIES_IN_PACKAGE = 1248;
const NODES_IN_PACKAGE = 214;
const ROUTES_CACHED = 214;

const r2 = (n) => Math.round(n * 100) / 100;
// Demand resolves to a month; the board draws it on the week that month turns,
// so every bar edge lands on a ruled line rather than between two of them.
const wOfM = (m) => Math.round(m * WPM);
const xOfM = (m) => (wOfM(m) - WIN_W0) * WKW;
const inWindow = (m) => wOfM(m) >= WIN_W0 && wOfM(m) < WIN_W0 + WIN_W;

/* ================================================================ helpers */

function fmtT(n) { return Math.round(n).toLocaleString("en-AU"); }
function money(n) { return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const n0 = (n) => Math.round(n).toLocaleString("en-AU");
// Whole millions read better than eleven digits in a summary strip, but the
// ledger below still carries the cents.
const m1 = (n) => Math.round(n / 1e5) / 10;
const mAUD = (n) => `A$ ${m1(n).toFixed(1)}m`;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const yearOf = (m) => Y0 + Math.floor(m / 12);
const monLabel = (m) => `${MON[m % 12]} ${yearOf(m)}`;
const shortMon = (m) => `${MON[m % 12]} ${String(yearOf(m)).slice(2)}`;
function months(n) {
  const y = Math.floor(n / 12), mm = n % 12;
  return (y ? `${y}y ` : "") + (mm || !y ? `${mm}m` : "").trim();
}

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

// Storage is charged at the destination of each leg, per tonne per day of
// average dwell. Port terminals cost more than an inland siding or yard.
const STORE = { siding: 0.42, yard: 0.42, port: 0.68 };
const echelonOf = (n) => (n.includes("siding") ? "siding" : n.includes("yard") ? "yard"
  : PORTS.includes(n) ? "port" : "zone");
const storeRate = (dest) => STORE[echelonOf(dest)] ?? 0;

// Lane kilometres, used for the tonne-kilometre split on view 3.
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

/* ============================================================== the networks */

// A network is designed once and applied to as many commodities as need it, so
// its capital cost is carried by the network and counted once no matter how
// many streams route over it. Each item completes in a given month of the
// programme, which is what demand has to wait for.
// Each item commissions one node in a given month of the programme, so only
// the streams whose route crosses that node have to wait for it.
const NETWORKS = [
  { id: "EWB-4", name: "EWB Spine v4", zone: "EWB", capex: [
    ["Merredin siding extension", "Merredin siding", 14, 12400000, 0],
    ["Northam yard loop", "Northam yard", 26, 8600000, 1]] },
  { id: "NWB-2", name: "Avon Feeder v2", zone: "NWB", capex: [
    ["Avon siding, new", "Avon siding", 19, 6900000, 1]] },
  { id: "MDW-3", name: "Mullewa v3", zone: "MDW", capex: [
    ["Mullewa siding rebuild", "Mullewa siding", 22, 9750000, 0],
    ["Mingenew yard loader", "Mingenew yard", 44, 4300000, 1]] },
  { id: "GSO-5", name: "GSO Road v5", zone: "GSO", capex: [
    ["Albany receival apron", "Albany", 17, 5200000, 0]] },
  { id: "ESZ-1", name: "Esperance v1", zone: "ESZ", capex: [
    ["Salmon Gums hardstand", "SGM-1", 12, 2150000, 1]] },
];
const READY = {};
for (const n of NETWORKS) {
  n.capexTotal = n.capex.reduce((s, c) => s + c[3], 0);
  n.ready = Math.max(...n.capex.map((c) => c[2]));
  // index 4 marks a wholly new node: demand cannot move over it before it
  // lands, where an upgrade to an existing node merely improves the lane
  for (const c of n.capex) if (c[4]) READY[c[1]] = c[2];
}
// the month every node on a route is commissioned, and the item that gates it
const routeReady = (c) => c.legs.reduce((a, l) => Math.max(a, READY[l.to] ?? 0), 0);
const netOf = (code) => NETWORKS.find((n) => n.id === NET_OF[code]);
const NET_OF = {
  "NUN-1": "EWB-4", "KLB-1": "EWB-4", "CDN-2": "EWB-4", "MUK-2": "EWB-4", "BRK-2": "EWB-4", "BEN-1": "EWB-4",
  "WGN-4": "NWB-2", "DAL-1": "NWB-2", "WUB-1": "NWB-2",
  "MLW-1": "MDW-3", "YUN-3": "MDW-3", "PJR-1": "MDW-3",
  "CRG-2": "GSO-5", "LKG-1": "GSO-5", "KAT-5": "GSO-5", "NYB-1": "GSO-5",
  "SGM-1": "ESZ-1",
};

/* ========================================================= the demand streams */

// One row per commodity stream. `ph` is the demand profile — [first month, last
// month, tonnes per month] — and the gaps between phases are holds, where
// standing stock still costs storage. `legs` is the route the network moves it
// over; `dwellD` is the average days it rests at each leg's destination.
const C = [
  { code: "APW1", group: "Wheat", site: "NUN-1", name: "Nungarin", status: "priced",
    rate: 23.1, hand: 10.35, acc: 0,
    ph: [[0, 17, 1500], [18, 33, 2100], [38, 89, 1200]], legs: [
      { m: "road", to: "Merredin siding", dwellD: 1.4 },
      { m: "rail", to: "Kwinana", dwellD: 3.1 }, { m: "load", to: "Berth 4", dwellD: 0 }] },
  { code: "APW1", group: "Wheat", site: "KLB-1", name: "Kellerberrin", status: "priced",
    rate: 12.4, hand: 8, acc: 148000,
    ph: [[4, 15, 900], [16, 31, 1650], [35, 83, 1050]], legs: [
      { m: "rail", to: "Kwinana", dwellD: 3.6 }, { m: "load", to: "Berth 4", dwellD: 0 }] },
  { code: "APW1", group: "Wheat", site: "CDN-2", name: "Cunderdin", status: "priced",
    rate: 10.05, hand: 8, acc: 0,
    ph: [[10, 21, 1800], [22, 37, 2250], [41, 95, 1500]], legs: [
      { m: "rail", to: "Kwinana", dwellD: 4.2 }, { m: "load", to: "Berth 2", dwellD: 0 }] },
  { code: "APW1", group: "Wheat", site: "WGN-4", name: "Wongan Hills", status: "priced",
    rate: 21.95, hand: 10.35, acc: 0,
    ph: [[2, 13, 750], [14, 29, 1650], [34, 83, 1050]], legs: [
      { m: "road", to: "Avon siding", dwellD: 1.1 },
      { m: "rail", to: "Kwinana", dwellD: 2.8 }, { m: "load", to: "Berth 2", dwellD: 0 }] },
  { code: "APW1", group: "Wheat", site: "DAL-1", name: "Dalwallinu", status: "review",
    rate: 14.75, hand: 8, acc: 264000,
    ph: [[12, 23, 1350], [24, 39, 1980], [43, 89, 1200]], legs: [
      { m: "rail", to: "Kwinana", dwellD: 5.4 }, { m: "load", to: "Berth 2", dwellD: 0 }] },
  { code: "H2", group: "Wheat", site: "MUK-2", name: "Mukinbudin–Bonnie Rock", status: "draft",
    rate: 28.05, hand: 10.35, acc: 0,
    ph: [[24, 35, 1200], [39, 59, 1440], [64, 119, 900]], legs: [
      { m: "road", to: "Merredin siding", dwellD: 1.8 },
      { m: "rail", to: "Kwinana", dwellD: 3.3 }, { m: "load", to: "Berth 2", dwellD: 0 }] },
  { code: "H2", group: "Wheat", site: "BRK-2", name: "Bruce Rock", status: "draft",
    rate: 14.3, hand: 8, acc: 0,
    ph: [[8, 19, 1500], [23, 35, 1800], [39, 83, 1100]], legs: [
      { m: "rail", to: "Kwinana", dwellD: 3.9 }, { m: "load", to: "Berth 2", dwellD: 0 }] },
  { code: "MALT1", group: "Barley", site: "CRG-2", name: "Corrigin", status: "priced",
    rate: 29.4, hand: 8.6, acc: 0,
    ph: [[3, 18, 975], [22, 35, 1170], [39, 89, 780]], legs: [
      { m: "road", to: "Albany", dwellD: 2.9 }, { m: "load", to: "Berth 1", dwellD: 0 }] },
  { code: "F1", group: "Barley", site: "LKG-1", name: "Lake Grace", status: "priced",
    rate: 22.15, hand: 8.6, acc: 0,
    ph: [[15, 26, 825], [30, 39, 990], [43, 95, 660]], legs: [
      { m: "road", to: "Albany", dwellD: 2.2 }, { m: "load", to: "Berth 1", dwellD: 0 }] },
  { code: "CAN1", group: "Canola", site: "KAT-5", name: "Katanning", status: "expired",
    rate: 19.8, hand: 3.4, acc: 0,
    ph: [[6, 17, 590], [18, 29, 708], [33, 65, 590]], legs: [
      { m: "road", to: "Albany", dwellD: 1.6 }] },
  { code: "ASW1", group: "Wheat", site: "MLW-1", name: "Mullewa", status: "priced",
    rate: 7.6, hand: 7.65, acc: 0,
    ph: [[0, 23, 1800], [24, 37, 2160], [42, 113, 1440]], legs: [
      { m: "rail", to: "Geraldton", dwellD: 3.4 }, { m: "load", to: "Berth 3", dwellD: 0 }] },
  { code: "ASW1", group: "Wheat", site: "YUN-3", name: "Yuna", status: "priced",
    rate: 17.25, hand: 10, acc: 509000,
    ph: [[20, 29, 1150], [33, 41, 1380], [45, 107, 920]], legs: [
      { m: "road", to: "Mullewa siding", dwellD: 1.3 },
      { m: "rail", to: "Geraldton", dwellD: 4.1 }, { m: "load", to: "Berth 3", dwellD: 0 }] },
  // No rate card reaches this stream, so it carries tonnage and no cost.
  { code: "LUP1", group: "Pulses", site: "SGM-1", name: "Salmon Gums", status: "unpriced",
    rate: null, hand: null, acc: 0,
    ph: [[30, 89, 738]], legs: [] },
  { code: "H2", group: "Wheat", site: "WUB-1", name: "Wubin", status: "priced",
    rate: 16.1, hand: 8, acc: 0,
    ph: [[0, 11, 600], [16, 33, 1080], [38, 89, 720]], legs: [
      { m: "rail", to: "Kwinana", dwellD: 4.7 }, { m: "load", to: "Berth 4", dwellD: 0 }] },
  { code: "MALT1", group: "Barley", site: "NYB-1", name: "Nyabing", status: "priced",
    rate: 24.3, hand: 8.6, acc: 0,
    ph: [[0, 17, 870], [21, 36, 1044], [40, 89, 700]], legs: [
      { m: "road", to: "Albany", dwellD: 2.4 }, { m: "load", to: "Berth 1", dwellD: 0 }] },
  // Demand opens before the yard loop this route depends on is commissioned.
  { code: "H2", group: "Wheat", site: "BEN-1", name: "Bencubbin", status: "held",
    rate: 27.35, hand: 12.7, acc: 0,
    ph: [[8, 23, 1050], [27, 41, 1260], [45, 113, 900]], legs: [
      { m: "road", to: "Merredin siding", dwellD: 1.5, rate: 10.2, hand: 2.35 },
      { m: "rail", to: "Northam yard", dwellD: 2.1, rate: 9.8, hand: 2.35 },
      { m: "rail", to: "Kwinana", dwellD: 4.4, rate: 7.35, hand: 3.15 },
      { m: "load", to: "Berth 4", dwellD: 0, rate: 0, hand: 4.85 }] },
  { code: "ASW1", group: "Wheat", site: "PJR-1", name: "Perenjori", status: "priced",
    rate: 26.1, hand: 12.35, acc: 0,
    ph: [[36, 47, 960], [52, 71, 1150], [76, 119, 780]], legs: [
      { m: "road", to: "Mullewa siding", dwellD: 1.2 },
      { m: "rail", to: "Mingenew yard", dwellD: 1.9 },
      { m: "rail", to: "Geraldton", dwellD: 4.6 }, { m: "load", to: "Berth 3", dwellD: 0 }] },
];

/* ======================================================== derived: the cost */

function prevNode(c, leg) {
  const i = c.legs.indexOf(leg);
  return i === 0 ? c.site : c.legs[i - 1].to;
}
// Tonnes per month, so the cell forecast and the ledger read the same profile.
function tonnesAt(c, m) {
  for (const [a, b, tpm] of c.ph) if (m >= a && m <= b) return tpm;
  return 0;
}

for (const c of C) {
  c.zone = zoneOf(c.site);
  c.net = NETWORKS.find((n) => n.id === NET_OF[c.site]);
  c.t = c.ph.reduce((s, [a, b, tpm]) => s + (b - a + 1) * tpm, 0);
  c.m0 = Math.min(...c.ph.map((p) => p[0]));
  c.m1 = Math.max(...c.ph.map((p) => p[1]));
  // a hold is the gap between two phases: demand stops, standing stock does not
  c.holds = [];
  for (let i = 0; i + 1 < c.ph.length; i++) {
    const gap = c.ph[i + 1][0] - c.ph[i][1] - 1;
    if (gap > 0) c.holds.push({ i, from: c.ph[i][1] + 1, months: gap, tpm: c.ph[i][2] });
  }
  // Tonnes times the per-tonne charge for the wait. Grouping it the other way
  // moves an exact half-cent onto the far side of the tie and the printed
  // column stops tallying, so keep the parentheses.
  c.legStore = c.legs.map((l) => c.t * (storeRate(l.to) * l.dwellD));
  c.storage = +c.legStore.reduce((s, v) => s + +v.toFixed(2), 0).toFixed(2);
  c.freight = c.rate === null ? null : c.t * c.rate;
  c.handling = c.hand === null ? null : c.t * c.hand;
  c.opex = c.rate === null ? null : c.freight + c.handling + c.storage + c.acc;
  c.perT = c.opex === null ? null : c.opex / c.t;
  c.km = c.legs.reduce((s, l) => s + (KM[`${prevNode(c, l)}>${l.to}`] ?? 0), 0);
  c.ready = routeReady(c);
  c.gate = c.legs.map((l) => l.to).find((n) => READY[n] === c.ready) ?? c.site;
  // Blocked is not a state anyone types on a stream: it is what being open
  // before your own route exists amounts to. Derive it, so a re-phase or a
  // moved commissioning date changes the status without anyone remembering to.
  if (c.m0 < c.ready) c.status = "held";
}

// Bar length is duration; thickness is the monthly rate, so the board reads as
// a volume profile rather than seventeen bars of identical weight.
const TPM_MIN = Math.min(...C.flatMap((c) => c.ph.map((p) => p[2])));
const TPM_MAX = Math.max(...C.flatMap((c) => c.ph.map((p) => p[2])));
// the floor is set by the label, not by taste: a bar thinner than 13px
// cannot hold 10px text, and a bar nobody can label is a bar nobody can read
// 27px rows, not 28: the legend under the grid costs a row's worth of height,
// and seventeen streams have to fit above it without the last one being cut.
const BAR_MIN = 13, BAR_MAX = 22, ROWH = 26;
const barH = (tpm) => r2(BAR_MIN + ((tpm - TPM_MIN) / (TPM_MAX - TPM_MIN)) * (BAR_MAX - BAR_MIN));

const COSTED = C.filter((c) => c.opex !== null);
const T_TOTAL = C.reduce((s, c) => s + c.t, 0);
const T_COSTED = COSTED.reduce((s, c) => s + c.t, 0);
const LEGS = C.reduce((s, c) => s + c.legs.length, 0);
const FREIGHT = COSTED.reduce((s, c) => s + c.freight, 0);
const HANDLING = COSTED.reduce((s, c) => s + c.handling, 0);
const STORAGE = +COSTED.reduce((s, c) => s + c.storage, 0).toFixed(2);
const ACC = COSTED.reduce((s, c) => s + c.acc, 0);
const OPEX = COSTED.reduce((s, c) => s + c.opex, 0);
// Capex is carried by the network, so a network shared by six streams is paid
// for once — which is the whole point of designing them to be reusable. A
// network whose only stream is still unpriced is held out of the budget
// entirely: charging its works against tonnage nobody has costed would
// overstate the rate against a denominator that never included it.
const NETS_USED = [...new Set(COSTED.map((c) => c.net))];
const CAPEX = NETS_USED.reduce((s, n) => s + n.capexTotal, 0);
const NETS_HELD = [...new Set(C.map((c) => c.net))].filter((n) => !NETS_USED.includes(n));
const CAPEX_HELD = NETS_HELD.reduce((s, n) => s + n.capexTotal, 0);
const BUDGET = CAPEX + OPEX;
// the strip prints capex and opex beside the budget, so the budget it prints
// has to be their sum as shown — rounding the true total instead lands a
// tenth away from what a reader adding the two visible figures gets
const BUDGET_SHOWN = `A$ ${(m1(CAPEX) + m1(OPEX)).toFixed(1)}m`;
const PER_T = BUDGET / T_COSTED;
const HOLDS = C.reduce((s, c) => s + c.holds.length, 0);

/* =============================================== derived: cell occupancy */

// Segregated cells at each port. A month's arrivals sit in the cell until the
// vessel programme draws them down, so the balance is the tonnage that landed
// over the last `lag` months and the peak follows the demand ramp.
const CELLS = [
  { id: "KWI-C4", port: "Kwinana", grade: "APW1", cap: 30500, open: 5400, lag: 3 },
  { id: "KWI-C2", port: "Kwinana", grade: "H2", cap: 17000, open: 3200, lag: 3 },
  { id: "GER-C3", port: "Geraldton", grade: "ASW1", cap: 15500, open: 4100, lag: 3 },
  { id: "ALB-C1", port: "Albany", grade: "MALT1", cap: 7200, open: 2200, lag: 2 },
  { id: "ALB-C3", port: "Albany", grade: "F1", cap: 4500, open: 1900, lag: 2 },
  { id: "ALB-C7", port: "Albany", grade: "CAN1", cap: 3800, open: 1500, lag: 2 },
  { id: "ESP-C5", port: "Esperance", grade: "LUP1", cap: 6000, open: 1860, lag: 2 },
];
const OCC_M = 24;   // the cell forecast charts the first two years in detail

const portOf = (c) => {
  const last = [...c.legs].reverse().find((l) => PORTS.includes(l.to));
  return last ? last.to : null;
};
function cellSeries(cell) {
  const streams = C.filter((c) => c.code === cell.grade && portOf(c) === cell.port);
  return Array.from({ length: OCC_M }, (_, m) => {
    let held = cell.open;
    for (let k = Math.max(0, m - cell.lag + 1); k <= m; k++)
      for (const c of streams) held += tonnesAt(c, k);
    return held;
  });
}
for (const c of CELLS) {
  c.series = cellSeries(c);
  c.peak = Math.max(...c.series);
  c.breach = c.peak > c.cap;
  c.over = c.breach ? c.peak - c.cap : 0;
  c.peakMonth = c.series.indexOf(c.peak);
}
const C4 = CELLS[0];

// The breach clears once the stream that tips it opens later than the ramp it
// collides with. Deferring by the months it overlaps is what draws the peak
// back under the cap.
const DEFER_STREAM = C.find((c) => c.site === "DAL-1");
const DEFER_M = (() => {
  for (let d = 1; d <= 24; d++) {
    const shifted = { ...DEFER_STREAM, ph: DEFER_STREAM.ph.map(([a, b, t]) => [a + d, b + d, t]) };
    const streams = C.filter((c) => c.code === C4.grade && portOf(c) === C4.port)
      .map((c) => (c === DEFER_STREAM ? shifted : c));
    const peak = Math.max(...Array.from({ length: OCC_M }, (_, m) => {
      let held = C4.open;
      for (let k = Math.max(0, m - C4.lag + 1); k <= m; k++)
        for (const c of streams) held += tonnesAt(c, k);
      return held;
    }));
    if (peak <= C4.cap) return d;
  }
  return null;
})();

// Demand that opens before the infrastructure carrying it is commissioned.
// Three streams do, on three different networks, so the exception is stated as
// the whole tonnage held and named by the one that waits longest.
const BLOCKED = C.filter((c) => c.status === "held")
  .sort((a, b) => b.ready - b.m0 - (a.ready - a.m0));
const WORST = BLOCKED[0];
const EARLY_M = WORST.ready - WORST.m0;
const BLOCKED_T = BLOCKED.reduce((s, c) => s + c.t, 0);
const BLOCKED_NETS = [...new Set(BLOCKED.map((c) => c.net))].length;
const LATE_ITEM = NETWORKS.flatMap((n) => n.capex).find((x) => x[1] === WORST.gate);

// The lapsed rate card, and the split that does not close.
const EXPIRED = C.find((c) => c.status === "expired");
const UNPRICED = C.find((c) => c.status === "unpriced");
const SPLIT_ZONE = ZONES.find((z) => z.id === "MDW");
const SPLIT_PCT = 98.5;

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
  for (const c of C) {
    const z = node(c.zone.name, 0);
    z.t += c.t; z.orders += 1;
    let prev = z, leg = 0;
    for (const gl of c.legs) {
      if (gl.m === "load") continue;
      leg += 1;
      const n = node(gl.to, leg);
      n.t += c.t; n.orders += 1;
      gedge(prev, n, gl.m, c.t);
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
const railLegs = C.flatMap((c) => c.legs.filter((l) => l.m === "rail").map((l) => ({ c, l })));
const roadLegs = C.flatMap((c) => c.legs.filter((l) => l.m === "road").map((l) => ({ c, l })));
const RAIL_TKM = railLegs.reduce((s, { c, l }) => s + c.t * (KM[`${prevNode(c, l)}>${l.to}`] ?? 0), 0);
const ROAD_TKM = roadLegs.reduce((s, { c, l }) => s + c.t * (KM[`${prevNode(c, l)}>${l.to}`] ?? 0), 0);
const RAIL_SETS = railLegs.reduce((s, { c }) => s + Math.ceil(c.t / SET_T), 0);
const ROAD_TRIPS = roadLegs.reduce((s, { c }) => s + Math.ceil(c.t / BDOUBLE_T), 0);

// Utilisation is a design property of the network here, not a day's dispatch:
// how full a set or a truck runs on each lane at the modelled flow.
const uc = (site) => C.find((c) => c.site === site);
const UTIL = [
  { cls: "rail", lane: "KLB-1 → Kwinana", plan: uc("KLB-1").code, booking: "Dedicated set", units: 1, cap: SET_T, assigned: 3240, note: "deadfreight 360 t/set" },
  { cls: "rail", lane: "Northam yard → Kwinana", plan: uc("BEN-1").code, booking: "Per-tonne tariff", units: 1, cap: SET_T, assigned: 2520, note: "—" },
  { cls: "rail", lane: "Merredin siding → Kwinana", plan: uc("NUN-1").code, booking: "Per-tonne tariff", units: 2, cap: 2 * SET_T, assigned: 6960, note: "—" },
  { cls: "rail", lane: "Mullewa siding → Geraldton", plan: uc("YUN-3").code, booking: "Per-tonne tariff", units: 1, cap: SET_T, assigned: 3450, note: "—" },
  { cls: "rail", lane: "Avon siding → Kwinana", plan: uc("WGN-4").code, booking: "Per-tonne tariff", units: 1, cap: SET_T, assigned: 2880, note: "—" },
  { cls: "road", lane: "WGN-4 → Avon siding", plan: uc("WGN-4").code, booking: "B-double 42 t", units: 138, cap: 138 * BDOUBLE_T, assigned: 5760, note: "last trip 6 t" },
  { cls: "road", lane: "CRG-2 → Albany", plan: uc("CRG-2").code, booking: "B-double 42 t", units: 56, cap: 56 * BDOUBLE_T, assigned: 2340, note: "last trip 30 t" },
  { cls: "road", lane: "NUN-1 → Merredin siding", plan: uc("NUN-1").code, booking: "B-double 42 t", units: 43, cap: 43 * BDOUBLE_T, assigned: 1800, note: "last trip 6 t" },
  { cls: "road", lane: "MUK-2 → Merredin siding", plan: uc("MUK-2").code, booking: "B-double 42 t", units: 29, cap: 29 * BDOUBLE_T, assigned: 1200, note: "last trip 18 t" },
  { cls: "berth", lane: "Kwinana Berth 4", plan: "4 calls/mo", booking: "Window modelled", units: 4, granted: 30, used: 26.9, note: "—" },
  { cls: "berth", lane: "Geraldton Berth 3", plan: "3 calls/mo", booking: "Window modelled", units: 3, granted: 36, used: 31, note: "—" },
  { cls: "berth", lane: "Kwinana Berth 2", plan: "5 calls/mo", booking: "Window modelled", units: 5, granted: 64, used: 54.7, note: "—" },
  { cls: "berth", lane: "Albany Berth 1", plan: "3 calls/mo", booking: "Window modelled", units: 3, granted: 32, used: 17.2, note: "window over-modelled" },
];
for (const u of UTIL) {
  u.factor = u.cls === "berth" ? (u.used / u.granted) * 100 : (u.assigned / u.cap) * 100;
}
// Berth windows are modelled in blocks and routinely carry slack, so the
// below-target count is about the moving assets, not the quay.
const BELOW_TARGET = UTIL.filter((u) => u.cls !== "berth" && u.factor < TARGET * 100).length;

/* ============================================ derived: route candidates */

// Alternatives the optimiser costed for the two streams that are not clean.
// Each is priced with the same rate card as the stream it would replace.
const CANDS = [
  { do: "DAL-1", label: "Rail direct, as designed", chain: "RAIL", cur: 1, feas: "fail",
    why: `${C4.id} peaks ${fmtT(C4.peak)} t in ${monLabel(C4.peakMonth)} against ${fmtT(C4.cap)} t` },
  { do: "DAL-1", label: "Rail direct, opening deferred", chain: "RAIL", cur: 0, dwellD: 4.1,
    freightR: 14.75, handR: 8, acc: 264000, feas: "rec",
    why: `Opens after the ${uc("CDN-2").code} ramp; peak drops under cap` },
  { do: "DAL-1", label: "Road direct to Kwinana", chain: "ROAD", cur: 0, dwellD: 1.9,
    freightR: 28.5, handR: 8, acc: 0, feas: "ok",
    why: "Feasible but road tariff is 93% above the rail lane" },
  { do: "DAL-1", label: "Rail to Geraldton, tranship", chain: "RAIL+SEA", cur: 0, feas: "fail",
    why: "Shipping programme is committed to Kwinana" },
  { do: "DAL-1", label: "Road + rail via Avon siding", chain: "ROAD+RAIL", cur: 0, dwellD: 6.8,
    freightR: 21.95, handR: 10.35, acc: 264000, feas: "ok",
    why: "Adds a transfer and eight days of standing stock" },
  { do: "BEN-1", label: "Road + rail via Northam yard", chain: "ROAD+RAIL", cur: 1, feas: "fail",
    why: `Demand opens ${months(EARLY_M)} before ${LATE_ITEM[0]} commissions` },
  { do: "BEN-1", label: "Road direct to Kwinana", chain: "ROAD", cur: 0, dwellD: 3.1,
    freightR: 34.2, handR: 8, acc: 0, feas: "rec",
    why: "Single leg, needs no yard loop" },
  { do: "BEN-1", label: "Rail via Merredin only", chain: "ROAD+RAIL", cur: 0, dwellD: 6.2,
    freightR: 27.35, handR: 12.7, acc: 325000, feas: "ok",
    why: "Commissions in time but holds stock six days" },
  { do: "BEN-1", label: "Rail via Northam, opening deferred", chain: "ROAD+RAIL", cur: 0, dwellD: 8.0,
    freightR: 27.35, handR: 12.7, acc: 0, feas: "ok",
    why: "Waits for the yard loop; eighteen months of demand unserved" },
];
// The route a stream is already on is not re-costed here — it *is* the plan, so
// it carries view 2's own figures and the two screens cannot drift apart.
for (const c of CANDS) {
  const s = C.find((x) => x.site === c.do);
  c.t = s.t;
  if (c.cur) {
    c.dwellD = s.legs.reduce((a, l) => a + l.dwellD, 0);
    c.freight = s.freight; c.handling = s.handling; c.storage = s.storage; c.acc = s.acc;
  } else if (c.freightR !== undefined) {
    c.freight = s.t * c.freightR;
    c.handling = s.t * c.handR;
    c.storage = +(s.t * (STORE.port * c.dwellD)).toFixed(2);
  }
  c.landed = c.freight == null ? null : c.freight + c.handling + c.storage + c.acc;
  c.perT = c.landed === null ? null : c.landed / c.t;
}
const INFEASIBLE = CANDS.filter((c) => c.feas === "fail").length;

const STATUS = { priced: "Priced", review: "In review", draft: "Draft",
  held: "Blocked", expired: "Expired", unpriced: "Unpriced" };
// reuse the shell's dot tokens rather than adding new ones to the shared CSS
const STATCLASS = { priced: "committed", review: "loading", draft: "planned",
  held: "held", expired: "atrisk", unpriced: "unscheduled" };

/* ================================================================== shell */

const NAVS = ["Demand schedule", "Cost & storage", "Routing", "Networks", "Rate cards", "Packages"];

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
    <div class="qf"><i class="g"></i>Search commodities, nodes</div>
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
  <span>Package <b style="font-weight:600;color:var(--fg2)">${PACKAGE}</b></span><i class="d"></i>
  <span>Rate card <span data-check="footRate">${RATECARD}</span></span><i class="d"></i>
  <span>Costing run <span data-check="footRun">${RUN_AT}</span> &middot; ${RUN_SECS.toFixed(1)} s &middot; <span data-check="footCached">${n0(ROUTES_CACHED)}</span> of ${n0(COMMODITIES_IN_PACKAGE)} routes cached</span><i class="d"></i>
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

const LAB_H = 13;
const labW = (txt) => 12 + txt.length * 5.6;
// A bar carries its rate and nothing else. The phase name was the half of the
// old label that said nothing a reader could not see — the colour already
// carries it, and now the legend names the colours. The rate is the half only
// the text can carry, so it stays wherever the bar has room to hold it.
const PHASE = ["ramp", "steady", "taper"];
const PHASE_LABEL = { ramp: "Ramp", steady: "Steady", taper: "Taper", run: "Run" };

function phaseRow(c) {
  const bars = c.ph.map(([m0, m1, tpm], i) => {
    const w0 = wOfM(m0), w1 = wOfM(m1 + 1);
    const x = xOfM(m0), w = xOfM(m1 + 1) - x, h = barH(tpm);
    const kind = PHASE[i] ?? "run";
    const txt = `${fmtT(tpm)} t/mo`;
    // measure against what is on screen, not the whole bar: a phase running out
    // of the window is drawn at full width, and a label sized to that width
    // gets cut in half by the track edge
    const vis = Math.min(x + w, TRACK) - x;
    const lab = h >= LAB_H && vis >= labW(txt) ? txt : "";
    // Demand that opens before the infrastructure carrying it is commissioned.
    // Any phase that starts before the works land is early, not just the first
    // — WGN-4's siding arrives mid-steady, so its steady bar opens early too,
    // and the commissioning rule crossing that bar says where it stops being.
    const early = m0 < c.ready;
    return `<i class="bar bar--${kind}${early ? " bad" : ""}" data-phase="${c.site}:${i}" data-kind="${kind}"` +
      ` data-m0="${m0}" data-m1="${m1}" data-w0="${w0}" data-w1="${w1}" data-tpm="${tpm}"` +
      ` data-left="${r2(x)}" data-width="${r2(w)}" data-h="${h}"` +
      ` style="left:${r2(x)}px;width:${r2(w)}px;top:${r2((ROWH - h) / 2)}px;height:${h}px;line-height:${h}px">${
        lab ? `<em style="line-height:${h}px">${lab}</em>` : ""}</i>`;
  }).join("");

  const holds = c.holds.map((h) => {
    const x = xOfM(h.from), w = xOfM(h.from + h.months) - x;
    const txt = months(h.months);
    // a two-month hold still has room for "2m"; measure the words, not the gap
    const lbl = w >= labW(txt)
      ? `<span class="dwl" data-holdlabel="${c.site}:${h.i}" style="left:${r2(x)}px;width:${r2(w)}px;text-align:center">${txt}</span>`
      : "";
    return `<i class="dw" data-hold="${c.site}:${h.i}" data-from="${h.from}" data-months="${h.months}"` +
      ` style="left:${r2(x)}px;width:${r2(w)}px"></i>${lbl}`;
  }).join("");

  // the commissioning marker is drawn only where demand opens ahead of it,
  // which is the one row the exception list is about
  const ready = c.m0 < c.ready && inWindow(c.ready)
    ? `<i class="rdyl" data-ready="${c.ready}" style="left:${r2(xOfM(c.ready))}px"></i>` : "";

  // The tail names the network's last commissioning, and is drawn only where
  // the whole of it fits after the bar. Truncating it to the track edge left
  // one row carrying "EWB Spin…", which reads as a fault rather than a label.
  const tx = xOfM(c.m1 + 1) + 7;
  const ttxt = c.status === "unpriced" ? "no rate card reaches this stream"
    : `${c.net.name} · ready ${shortMon(c.ready)}`;
  const tail = tx + labW(ttxt) <= TRACK
    ? `<span class="vlbl${c.status === "unpriced" ? " mut" : ""}" data-tail="${c.site}"` +
      ` style="left:${r2(tx)}px">${ttxt.replace(" · ", " &middot; ")}</span>` : "";

  return `<tr data-row="stream" data-site="${c.site}" data-code="${c.code}" data-group="${c.group}"` +
    ` data-tonnes="${c.t}" data-net="${c.net.id}" data-status="${c.status}" data-phases="${c.ph.length}"` +
    ` data-legs="${c.legs.length}" data-m0="${c.m0}" data-m1="${c.m1}" data-ready="${c.ready}">
  <td class="fz pl"><b style="font-weight:600">${c.code}</b></td>
  <td class="fz">${c.group}</td>
  <td class="fz">${c.site} <span class="mut">&middot;</span> ${c.name}</td>
  <td class="fz"><span class="mut">${c.net.name}</span></td>
  <td class="fz" style="text-align:right;padding-right:12px !important">${fmtT(c.t)}</td>
  <td class="fz"><span class="stat"><i class="dot d-${STATCLASS[c.status]}"></i>${STATUS[c.status]}</span></td>
  <td class="trk">${bars}${holds}${ready}${tail}</td>
</tr>`;
}

// The window is 48 of 360 months, so the strip above the grid says where in the
// programme the four years on screen actually sit.
function horizonStrip() {
  // The window starts at month 0, so half its stroke would fall outside the
  // viewBox and be clipped. Inset the drawn border by that half and keep the
  // true geometry on the element, where the verifier reads it.
  const H = 16, y = 5, h = 6, SW = 1.2;
  const wx = (TRACK * WIN_M0) / MONTHS, ww = (TRACK * WIN_M) / MONTHS;
  const ticks = [];
  for (let yr = 5; yr < YN - Y0 + 1; yr += 5)
    ticks.push(`<rect x="${r2((TRACK * yr * 12) / MONTHS)}" y="${y - 2}" width="1" height="${h + 4}" fill="#d3d8df"/>`);
  return `<svg width="${TRACK}" height="${H}" viewBox="0 0 ${TRACK} ${H}" style="position:absolute;left:0;top:1px">
    <rect x="0" y="${y}" width="${TRACK}" height="${h}" rx="3" fill="#eef0f3"/>
    ${ticks.join("")}
    <rect data-check="window" data-m0="${WIN_M0}" data-m="${WIN_M}" data-total="${MONTHS}"
      data-weeks="${WIN_W}" data-x="${r2(wx)}" data-w="${r2(ww)}" data-inset="${SW / 2}"
      x="${r2(wx + SW / 2)}" y="${y - 3 + SW / 2}" width="${r2(ww - SW)}" height="${h + 6 - SW}" rx="2"
      fill="#b26b00" fill-opacity=".10" stroke="#b26b00" stroke-width="${SW}"/>
    <text x="${TRACK - 2}" y="${y + h + 1}" text-anchor="end" font-size="8" font-weight="700" fill="#a3abb6">${YN}</text>
  </svg>`;
}

const EXCEPTIONS = [
  ["e", "Demand ahead of works", `${BLOCKED.length} streams &middot; ${BLOCKED_NETS} networks`,
    `Demand opens up to <b>${months(EARLY_M)}</b> before the works carrying it. Blocked &mdash; ${fmtT(BLOCKED_T)} t unroutable, longest ${WORST.site} until ${LATE_ITEM[0]} commissions ${monLabel(LATE_ITEM[2])}.`,
    "Re-phase"],
  ["e", "Cell over capacity", `${C4.id} ${C4.grade} &middot; ${monLabel(C4.peakMonth)}`,
    `Peak <b>${fmtT(C4.peak)} t</b> vs ${fmtT(C4.cap)} t, over by ${fmtT(C4.over)} t. Clears if ${DEFER_STREAM.site} opens <b>${months(DEFER_M)}</b> later.`,
    `Defer ${DEFER_STREAM.site}`],
  ["w", "Rate card lapsed", `${EXPIRED.site} &rarr; Albany`,
    `Expired ${monLabel(11)}, not indexed. ${fmtT(EXPIRED.t)} t costed at A$ ${money(EXPIRED.rate)}/t for the full horizon.`,
    "Index lane"],
  ["w", "Demand split short", `${SPLIT_ZONE.name} &middot; 3 streams`,
    `Origin splits total ${SPLIT_PCT}%, not 100%. ${fmtT(Math.round(C.filter((c) => c.zone === SPLIT_ZONE).reduce((s, c) => s + c.t, 0) * (100 - SPLIT_PCT) / 100))} t of demand is unassigned.`,
    "Rebalance"],
  ["w", "Stream not costed", `${UNPRICED.site} &middot; ${UNPRICED.code}`,
    `${fmtT(UNPRICED.t)} t carries no rate card, so ${UNPRICED.net.name}'s ${mAUD(CAPEX_HELD)} of works sits outside the budget. ${CELLS[6].id} holds ${fmtT(CELLS[6].open)} t, no movement modelled.`,
    "Assign rates"],
];

// The colours are the only thing naming a phase now, so the board has to say
// what they mean, and the marks that are not bars — the hold, the commissioning
// rule, the outline on demand that runs ahead of it — belong in the same line.
const LEGEND = [
  ...PHASE.map((k) => `<span class="lgk" data-legend="${k}"><i class="sw bar--${k}"></i>${PHASE_LABEL[k]}</span>`),
  `<span class="lgk" data-legend="hold"><i class="hd"></i>Hold &middot; stock still charged</span>`,
  `<span class="lgk" data-legend="ready"><i class="rl"></i>Works commission</span>`,
  `<span class="lgk" data-legend="early"><i class="ob"></i>Demand ahead of works</span>`,
].join("");

function view1() {
  const bands = [];
  for (let yr = 0; yr < WIN_Y; yr += 2)
    bands.push(`<i class="wk" style="left:${r2(yr * YRW)}px;width:${r2(YRW)}px"></i>`);
  // One column per quarter, labelled by the weeks it covers. The year takes the
  // first quarter's slot rather than repeating four times across the strip.
  const heads = Array.from({ length: WIN_M / 3 }, (_, q) => {
    const yr = Math.floor(q / 4), qi = q % 4, w0 = qi * 13 + 1;
    return `<div class="dayh" data-qtr="${q}" data-w0="${w0}" style="left:${r2(q * QTRW)}px;width:${
      r2(QTRW)}px;top:18px;height:28px;padding-left:6px"><em>${
      qi === 0 ? Y0 + yr : `Q${qi + 1}`}</em><b style="font-size:10px">W${w0}&ndash;${w0 + 12}</b></div>`;
  }).join("");

  const cmd = `  <div class="vsel">${PACKAGE} &middot; ${Y0}&ndash;${YN}<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">+</i>New scenario</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Generate budget</div>
  <div class="btn btn--o">Re-cost</div>
  <div class="btn btn--o">Compare scenarios</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip">Group: all 4</div>
  <div class="chip chip--on">Window ${Y0}&ndash;${Y0 + WIN_Y - 1} &middot; weekly<i class="x">&times;</i></div>
  <div class="chip chip--st">Approver role</div>
  <div class="chip">Run <span data-check="runAt">${RUN_AT}</span> &middot; <span data-check="runSecs">${RUN_SECS.toFixed(1)}s</span></div>`;

  const sum = [
    sg("Commodities", `${C.length} of ${n0(COMMODITIES_IN_PACKAGE)}`),
    sg("Nodes", `${n0(NODES_IN_PACKAGE)}`),
    sg("Legs", `${LEGS}`),
    sg("Tonnes", `${fmtT(T_TOTAL)}`),
    sg("Capex", mAUD(CAPEX)),
    sg("Opex", mAUD(OPEX)),
    sg("Budget/t", `A$ ${money(PER_T)}`),
    sg("Exceptions", `${EXCEPTIONS.length}`, "w"),
    `<div class="g sp"></div>`,
    sg("Horizon", `${Y0} &ndash; ${YN}`),
  ].join("");

  const body = `<section class="card" style="flex:1;min-height:0">
    <div class="gantt">
      <div class="gov">
        ${bands.join("")}
      </div>
      <table class="g">
        <colgroup><col style="width:106px"><col style="width:62px"><col style="width:146px"><col style="width:118px"><col style="width:70px"><col style="width:76px"><col style="width:${TRACK}px"></colgroup>
        <thead><tr>
          <th class="fz pl">Commodity &#9652;</th><th class="fz">Group</th><th class="fz">Origin</th>
          <th class="fz">Network</th>
          <th class="fz" style="text-align:right;padding-right:12px !important">Tonnes</th><th class="fz">Status</th>
          <th class="trk" style="position:relative">${horizonStrip()}${heads}</th>
        </tr></thead>
        <tbody>${C.map(phaseRow).join("")}</tbody>
      </table>
    </div>
    <div class="card__f" style="gap:17px">${LEGEND}<div style="flex:1"></div>
      <span>Bar thickness is the monthly tonnage rate &middot; demand past ${
        Y0 + WIN_Y - 1} is drawn and clipped</span></div>
</section>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Exceptions<span class="ct">${EXCEPTIONS.length}</span></div><div class="dtab">Approvals<span class="ct">3</span></div><div class="dtab">Cost summary</div><div class="dtab">Activity<span class="ct">34</span></div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">2 blocking &middot; budget generation needs the Estimation Approver role</div>
  </div>
  <div class="dock__b">${EXCEPTIONS.map(([k, ttl, ref, txt, act]) =>
    `<div class="exr exr--${k}" data-row="exception" data-kind="${k}"><i class="bd"></i><span class="ttl">${ttl}</span><span class="ref">${ref}</span><span class="txt">${txt}</span><span class="act">${act}</span></div>`).join("")}
  </div>
</section>`;

  return page({ title: "Demand schedule", tab: "Demand schedule", cmd, sum, body,
    foot: `Horizon ${Y0}&ndash;${YN} &middot; ${MONTHS} months costed &middot; board rules the first ${WIN_Y} years in weeks` });
}

/* ========================================================= view 2 — the cost */

const CG_COLS = `<colgroup><col style="width:260px"><col style="width:150px"><col style="width:92px"><col style="width:118px"><col style="width:114px"><col style="width:114px"><col style="width:122px"><col style="width:132px"><col style="width:88px"><col style="width:106px"><col></colgroup>`;

const COST_TAG = { priced: "tag--o", review: "tag--b", draft: "tag--n",
  held: "tag--e", expired: "tag--w", unpriced: "tag--n" };

function costRow(c) {
  if (c.opex === null) {
    return `<tr class="pl dim" data-row="cost" data-kind="unpriced" data-site="${c.site}" data-tonnes="${c.t}" data-legs="0">
      <td class="l">${c.code} <span class="mut" style="font-weight:400">&middot; ${c.site} ${c.name}</span></td>
      <td class="l">${c.net.name}</td>
      <td>${fmtT(c.t)}</td>
      <td data-f="freight">&mdash;</td><td data-f="handling">&mdash;</td><td data-f="storage">&mdash;</td>
      <td data-f="acc">&mdash;</td><td data-f="total">&mdash;</td><td data-f="pert">&mdash;</td>
      <td class="l"><span class="tag tag--n">${STATUS[c.status]}</span></td>
      <td class="l"><span class="mut">${c.group}</span></td></tr>`;
  }
  return `<tr class="pl${c.site === "BEN-1" ? " sc" : ""}" data-row="cost" data-kind="stream" data-site="${c.site}" data-tonnes="${c.t}" data-legs="${c.legs.length}">
      <td class="l">${c.code} <span class="mut" style="font-weight:400">&middot; ${c.site} ${c.name}</span></td>
      <td class="l">${c.net.name}</td>
      <td>${fmtT(c.t)}</td>
      <td data-f="freight">${money(c.freight)}</td>
      <td data-f="handling">${money(c.handling)}</td>
      <td data-f="storage">${money(c.storage)}</td>
      <td data-f="acc">${c.acc ? money(c.acc) : "&mdash;"}</td>
      <td data-f="total">${money(c.opex)}</td>
      <td data-f="pert">${money(c.perT)}</td>
      <td class="l"><span class="tag ${COST_TAG[c.status]}">${STATUS[c.status]}</span></td>
      <td class="l"><span class="mut">${c.group}</span></td></tr>`;
}

// One stream is expanded so the buildup is visible: a leg's freight is its own
// tariff over the horizon tonnage, and its storage is the average dwell at its
// own destination.
function legRows(c) {
  return c.legs.map((l, i) => {
    const freight = l.rate * c.t, hand = l.hand * c.t;
    const store = +c.legStore[i].toFixed(2);
    const total = freight + hand + store;
    const km = KM[`${prevNode(c, l)}>${l.to}`];
    const label = l.m === "load"
      ? `Ship loading &middot; ${l.to}`
      : `${l.m === "road" ? "Road" : "Rail"} &middot; ${prevNode(c, l)} &rarr; ${l.to}${km ? ` ${km} km` : ""}`;
    return `<tr class="lg" data-row="cost" data-kind="leg" data-site="${c.site}" data-leg="${i}" data-tonnes="${c.t}"` +
      ` data-rate="${l.rate}" data-hand="${l.hand}" data-store-rate="${storeRate(l.to)}" data-dwell-d="${l.dwellD}" data-acc="0">
      <td class="l">${label}</td>
      <td class="l">${l.to}</td>
      <td>${fmtT(c.t)}</td>
      <td data-f="freight">${freight ? money(freight) : "&mdash;"}</td>
      <td data-f="handling">${money(hand)}</td>
      <td data-f="storage">${store ? money(store) : "&mdash;"}</td>
      <td data-f="acc">&mdash;</td>
      <td data-f="total">${money(total)}</td>
      <td data-f="pert">${money(total / c.t)}</td>
      <td class="l"><span class="mut">${l.dwellD ? `dwell ${l.dwellD.toFixed(1)} d` : "&mdash;"}</span></td>
      <td class="l"><span class="mut">A$ ${money(l.rate || l.hand)}/t</span></td></tr>`;
  }).join("");
}

// The cell holds what landed over the last few months, so the balance tracks
// the demand ramp and the breach is where the ramp peaks.
function occChart() {
  const W = 1384, H = 146, PAD = 8, BASE = 126, TOP = 16;
  const ceil = Math.max(C4.cap, C4.peak) * 1.155;
  const step = (W - PAD * 2) / OCC_M;
  const bw = step - 10;
  const y = (v) => BASE - (v / ceil) * (BASE - TOP);
  const capY = r2(y(C4.cap));
  const bars = C4.series.map((v, i) => {
    const x = r2(PAD + i * step), yy = r2(y(v)), h = r2(BASE - y(v));
    const over = v > C4.cap;
    // a label sitting just under the capacity line collides with it, so any bar
    // that close carries its figure inside instead of above
    const tight = over || yy - 4 < capY + 8;
    const lbl = i % 2 && v !== C4.peak ? "" : (tight
      ? `<text x="${r2(x + bw / 2)}" y="${r2(yy + 12)}" text-anchor="middle" font-size="9" font-weight="700" fill="${over ? "#fff" : "#59616d"}">${fmtT(v)}</text>`
      : `<text x="${r2(x + bw / 2)}" y="${r2(yy - 4)}" text-anchor="middle" font-size="9" fill="#7d8592">${fmtT(v)}</text>`);
    return `<rect data-occ="${i}" data-peak="${v}" x="${x}" y="${yy}" width="${r2(bw)}" height="${h}" rx="2" fill="${over ? "#b3261e" : "#a3adba"}"></rect>${lbl}`;
  }).join("");
  const labels = C4.series.map((_, i) => (i % 3 ? "" :
    `<text x="${r2(PAD + i * step + bw / 2)}" y="141" text-anchor="middle" font-size="9.5" fill="${
      i % 12 === 0 ? "#7d8592" : "#a3abb6"}">${shortMon(i)}</text>`)).join("");
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${bars}
    <line x1="0" y1="${capY}" x2="${W}" y2="${capY}" stroke="#b3261e" stroke-width="1" stroke-dasharray="4 3"></line>
    <text x="2" y="${r2(capY - 5)}" font-size="9.5" font-weight="700" fill="#b3261e">CAPACITY ${fmtT(C4.cap)} t</text>
    <line x1="0" y1="${BASE}" x2="${W}" y2="${BASE}" stroke="#d3d8df" stroke-width="1"></line>
    ${labels}
  </svg>`;
}

function view2() {
  const cmd = `  <div class="vsel">Cost &amp; storage &middot; ${Y0}&ndash;${YN}<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">+</i>New basis</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Publish budget</div>
  <div class="btn btn--o">Re-price lane</div>
  <div class="btn btn--o">Compare rate cards</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip chip--on">Rate card <span data-check="sum-rate-card">${RATECARD}</span><i class="x">&times;</i></div>
  <div class="chip">Basis: forecast</div>
  <div class="chip chip--st">1 lane lapsed</div>
  <div class="chip">Run <span data-check="runAt">${RUN_AT}</span> &middot; <span data-check="runSecs">${RUN_SECS.toFixed(1)}s</span></div>`;

  const sum = [
    sg("Budget", BUDGET_SHOWN),
    sg("Capex", mAUD(CAPEX)),
    sg("Opex", mAUD(OPEX)),
    sg("Freight", mAUD(FREIGHT)),
    sg("Handling", mAUD(HANDLING)),
    sg("Storage", mAUD(STORAGE)),
    sg("Accessorial", mAUD(ACC)),
    sg("Budget/t", `A$ ${money(PER_T)}`),
    `<div class="g sp"></div>`,
    sg("Rate card", RATECARD),
  ].join("");

  const rows = C.map((c) => costRow(c) + (c.site === "BEN-1" ? legRows(c) : "")).join("");

  const body = `<section class="card" style="flex:1;min-height:0">
  <div class="card__h"><h2>Leg cost buildup &middot; ${LEGS} legs across ${COSTED.length} streams</h2>
    <span class="tag tag--n">A$ ${money(PER_T)}/t including capex</span>
    <span class="tag tag--b">capex ${mAUD(CAPEX)} over ${NETS_USED.length} costed networks</span><div class="sp"></div>
    <span class="mut" style="font-size:11px">storage charged on average dwell at each leg's destination</span></div>
  <div class="card__b"><div class="cgw"><div class="cgb">
    <table class="cg">
      ${CG_COLS}
      <thead>
        <tr class="g1"><th class="l" colspan="3">Demand stream</th><th colspan="5">Operating cost over the horizon (A$)</th><th>A$/t</th><th class="l" colspan="2">State</th></tr>
        <tr class="g2"><th class="l">Commodity / origin</th><th class="l">Network</th><th>Tonnes</th>
          <th>Freight</th><th>Handling</th><th>Storage</th><th>Accessorial</th><th>Opex total</th><th>Per tonne</th>
          <th class="l">Status</th><th class="l">Material group</th></tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td class="l">Programme opex &middot; ${COSTED.length} costed streams</td>
        <td class="l"></td>
        <td data-check="footT">${fmtT(T_COSTED)}</td>
        <td data-check="footFreight">${money(FREIGHT)}</td>
        <td data-check="footHand">${money(HANDLING)}</td>
        <td data-check="footStore">${money(STORAGE)}</td>
        <td data-check="footAcc">${money(ACC)}</td>
        <td data-check="footTotal">${money(OPEX)}</td>
        <td data-check="footPerT">${money(OPEX / T_COSTED)}</td>
        <td class="l"></td><td class="l"></td></tr></tfoot>
    </table>
  </div></div>
</section>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Storage forecast</div><div class="dtab">Rate cards<span class="ct">5</span></div><div class="dtab">Capex schedule<span class="ct">${NETS_USED.reduce((s, n) => s + n.capex.length, 0)}</span></div><div class="dtab">Lane changes<span class="ct">6</span></div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">${C4.id} peak <b style="color:#b3261e">${fmtT(C4.peak)} t</b> in ${monLabel(C4.peakMonth)} &middot; ${fmtT(C4.over)} t over &middot; clears if ${DEFER_STREAM.site} opens <b data-check="deferBy">${months(DEFER_M)}</b> later</div>
  </div>
  <div class="dock__b"><div class="occ"><div style="position:absolute;left:14px;top:6px;font-size:11px;color:var(--fg3)">${C4.id} &middot; ${C4.grade} segregated cell &mdash; forecast peak held per month &middot; opening <b style="color:var(--fg2);font-weight:600" data-check="c4open">${fmtT(C4.open)}</b> t &middot; first ${OCC_M} months of ${MONTHS}</div>
   <div style="padding-top:18px">${occChart()}</div></div></div>
</section>`;

  return page({ title: "Cost & storage", tab: "Cost & storage", cmd, sum, body,
    foot: `Basis forecast &middot; ${LEGS} legs costed over ${MONTHS} months` });
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
    const brk = n.ech === "port" ? CELLS.find((c) => c.port === n.name && c.breach) : null;
    // name on line one, tonnage on line two beside the leg tag — putting the
    // tonnage on line one collided with any name longer than "Mid West"
    const y1 = b.y + 15, y2 = b.y + 29;
    return `<g data-node="${n.key}" data-ech="${n.ech}" data-leg="${n.leg}" data-t="${n.t}" data-orders="${n.orders}" data-x="${b.x}" data-y="${b.y}" data-w="${b.w}" data-h="${b.h}" data-in="${inView(n.key) ? 1 : 0}">
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="${s.fill}" stroke="${brk ? "#b3261e" : "#d3d8df"}"/>
      <rect x="${b.x}" y="${b.y}" width="4" height="${b.h}" rx="2" fill="${s.bar}"/>
      <text x="${b.x + 12}" y="${y1}" font-size="11.5" font-weight="600" fill="#1c232c">${n.name}</text>
      ${brk ? `<rect x="${b.x + b.w - 64}" y="${b.y + 4}" width="58" height="13" rx="3" fill="#fdf0ef" stroke="#eec4c1"/>
        <text x="${b.x + b.w - 35}" y="${b.y + 13.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#b3261e">${brk.id} over</text>` : ""}
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

// Both these panels hold more rows than their frame, and the capture hides real
// scrollbars, so the bar is drawn: its thumb is the fraction on screen.
const UT_ROWH = 21, UT_HEAD = 24;
const UTIL_BODY = 210, CAND_BODY = 176;
const shownIn = (bodyH, n) => Math.min(n, Math.floor((bodyH - UT_HEAD) / UT_ROWH));
function scrollY(bodyH, total) {
  const shown = shownIn(bodyH, total);
  if (shown >= total) return "";
  return `<i class="sy" data-scroll="${total}" data-shown="${shown}"><i style="height:${
    r2((shown / total) * 100)}%"></i></i>`;
}

function utilRows() {
  const out = [];
  for (const u of UTIL) {
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
      : `<td>${c.dwellD.toFixed(1)} d</td><td>${money(c.freight)}</td><td>${money(c.handling)}</td>` +
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
  const cmd = `  <div class="vsel">Routing &middot; ${Y0}&ndash;${YN}<i class="cv"></i></div>
  <div class="dv"></div>
  <div class="btn"><i class="gl">&#8635;</i>Re-run optimiser</div>
  <div class="btn btn--p" aria-disabled="true"><i class="gl">&#10003;</i>Apply recommended</div>
  <div class="btn btn--o">Compare routes</div>
  <div class="btn btn--o">Release capacity</div>
  <div class="btn">Export<i class="gl">&#9662;</i></div>
  <div class="btn"><i class="gl">&#8943;</i></div>
  <div class="sp"></div>
  <div class="chip chip--on">2 streams open<i class="x">&times;</i></div>
  <div class="chip">Optimiser <span data-check="sum-optimiser">${RUN_AT}</span></div>
  <div class="chip chip--st">${INFEASIBLE} routes infeasible</div>
  <div class="chip">Run <span data-check="runAt">${RUN_AT}</span> &middot; <span data-check="runSecs">${RUN_SECS.toFixed(1)}s</span></div>`;

  const sum = [
    sg("Zones", `${ZONES.length}`),
    sg("Lanes", `${GRAPH_FULL.edges.length}`),
    sg("Rail", `${n0(RAIL_TKM)} t&middot;km`),
    sg("Road", `${n0(ROAD_TKM)} t&middot;km`),
    sg("Rail sets", `${RAIL_SETS}`),
    sg("Road trips", `${n0(ROAD_TRIPS)}`),
    sg("Infeasible", `${INFEASIBLE}`, "e"),
    `<div class="g sp"></div>`,
    sg("Optimiser", RUN_AT),
  ].join("");

  const body = `<div class="hero">
  <section class="card" style="flex:0 0 268px">
    <div class="card__h"><h2>Network topology</h2>
      <span class="chip chip--on" style="height:20px;font-size:10.5px">Horizon ${Y0}&ndash;${YN}<i class="x">&times;</i></span>
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
      <span class="mut" style="font-size:11px">modelled monthly flow &middot; target ${(TARGET * 100).toFixed(0)}% &middot; rail sets ${fmtT(SET_T)} t &middot; B-double ${BDOUBLE_T} t</span></div>
    <div class="card__b scy">${scrollY(UTIL_BODY, UTIL.length)}
      <table class="ut">
        <colgroup><col style="width:74px"><col style="width:290px"><col style="width:110px"><col style="width:150px"><col style="width:70px"><col style="width:110px"><col style="width:110px"><col style="width:150px"><col></colgroup>
        <thead><tr><th class="l">Class</th><th class="l">Lane / asset</th><th class="l">Commodity</th><th class="l">Booking</th><th>Units</th><th>Capacity</th><th>Assigned</th><th>Load factor</th><th class="l">Note</th></tr></thead>
        <tbody>${utilRows()}</tbody>
      </table>
    </div>
  </section>
</div>

<section class="card dock">
  <div class="dock__t"><div class="dtab on">Route candidates<span class="ct">${CANDS.length}</span></div><div class="dtab">Feasibility checks<span class="ct">6</span></div><div class="dtab">Optimiser runs<span class="ct">4</span></div><div class="dtab">Lane capacity</div>
    <div style="flex:1"></div>
    <div class="dtab" style="color:var(--fg3)">${INFEASIBLE} of ${CANDS.length} infeasible &middot; apply blocked while a stream is held</div>
  </div>
  <div class="dock__b scy">${scrollY(CAND_BODY, CANDS.length)}
    <table class="ut">
      <colgroup><col style="width:96px"><col style="width:250px"><col style="width:96px"><col style="width:110px"><col style="width:104px"><col style="width:104px"><col style="width:104px"><col style="width:110px"><col style="width:112px"><col style="width:70px"><col></colgroup>
      <thead><tr><th class="l">Stream</th><th class="l">Candidate route</th><th class="l">Chain</th><th>Dwell</th><th>Freight</th><th>Handling</th><th>Storage</th><th>Accessorial</th><th>Landed A$</th><th>A$/t</th><th class="l">Feasibility</th></tr></thead>
      <tbody>${candRows()}</tbody>
    </table>
  </div>
</section>`;

  return page({ title: "Routing & utilisation", tab: "Routing", cmd, sum, body,
    foot: `${CANDS.length} candidates across ${new Set(CANDS.map((c) => c.do)).size} open streams` });
}

writeFileSync(join(OUT, "tramos-01-corridor-schedule", "index.html"), view1());
writeFileSync(join(OUT, "tramos-02-cost-storage", "index.html"), view2());
writeFileSync(join(OUT, "tramos-03-routing-utilisation", "index.html"), view3());
console.log(`streams ${C.length} of ${n0(COMMODITIES_IN_PACKAGE)} · legs ${LEGS} · tonnes ${fmtT(T_TOTAL)} over ${MONTHS} months`);
console.log(`capex ${mAUD(CAPEX)} · opex A$ ${money(OPEX)} · budget ${mAUD(BUDGET)} · per tonne A$ ${money(PER_T)}`);
console.log(`${C4.id} peak ${fmtT(C4.peak)} / ${fmtT(C4.cap)} in ${monLabel(C4.peakMonth)} · defer ${months(DEFER_M)} · holds ${HOLDS}`);
console.log(`graph ${GRAPH_FULL.nodes.size} nodes (${NODES_IN} in view) · ${GRAPH_FULL.edges.length} lanes · zoom ${ZOOM}%`);
console.log(`rail ${n0(RAIL_TKM)} t·km · road ${n0(ROAD_TKM)} t·km · sets ${RAIL_SETS} · trips ${n0(ROAD_TRIPS)}`);

