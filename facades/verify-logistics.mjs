// Coherence verifier for the TRAMOS facade set (work 4 — logistics).
//
// Same contract as verify-slipstream.mjs and verify-erp.mjs: it holds NO copy of
// the data. It reads the three index.html files, scrapes what is actually
// rendered, and re-derives every total, ratio and cross-panel agreement from the
// markup. A transcription slip fails the run; a slip in a duplicated data model
// could not.
//
//   node facades/verify-logistics.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.join(here, "tramos-01-corridor-schedule", "index.html");
const V2 = path.join(here, "tramos-02-cost-storage", "index.html");
const V3 = path.join(here, "tramos-03-routing-utilisation", "index.html");

let pass = 0;
const failures = [];

function ok(chainNo, label, actual, expected) {
  const a = typeof actual === "number" ? +actual.toFixed(6) : actual;
  const e = typeof expected === "number" ? +expected.toFixed(6) : expected;
  if (a === e) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}  \x1b[2m${a}\x1b[0m`);
  } else {
    failures.push(`[chain ${chainNo}] ${label}: got ${a}, expected ${e}`);
    console.log(`  \x1b[31m✗\x1b[0m ${label}  got ${a}, expected ${e}`);
  }
}

function near(chainNo, label, actual, expected, tol) {
  if (Math.abs(actual - expected) <= tol) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}  \x1b[2m${+actual.toFixed(4)}\x1b[0m`);
  } else {
    failures.push(`[chain ${chainNo}] ${label}: got ${actual}, expected ${expected} ±${tol}`);
    console.log(`  \x1b[31m✗\x1b[0m ${label}  got ${actual}, expected ${expected} ±${tol}`);
  }
}

function chain(n, title) {
  console.log(`\n\x1b[1mChain ${n} — ${title}\x1b[0m`);
}

/* ------------------------------------------------------------- scraping */

const ENT = {
  "&mdash;": "—", "&ndash;": "–", "&rarr;": "→", "&larr;": "←", "&middot;": "·",
  "&times;": "×", "&nbsp;": " ", "&thinsp;": " ", "&gt;": ">", "&lt;": "<",
  "&amp;": "&", "&minus;": "−", "&prop;": "∝", "&#9652;": "▲", "&#9662;": "▾",
  "&#10003;": "✓", "&#8635;": "↻", "&#8943;": "⋯", "&#9;": " ",
};
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => (e in ENT ? ENT[e] : e));
const squash = (s) => s.replace(/\s+/g, " ").trim();
const text = (h) => squash(decode(h.replace(/<[^>]+>/g, " ")));

function attrs(open) {
  const a = {};
  for (const m of open.matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}

// every <tag ... data-row="kind" ...> ... </tag>, with cells if it is a <tr>
function rows(html, kind) {
  const out = [];
  const re = new RegExp(`<(tr|div|li)([^>]*\\bdata-row="${kind}"[^>]*)>([\\s\\S]*?)</\\1>`, "g");
  for (const m of html.matchAll(re)) {
    const a = attrs(m[2]);
    a._cells = m[1] === "tr"
      ? m[3].split(/<t[dh][^>]*>/).slice(1).map((c) => text(c.split(/<\/t[dh]>/)[0]))
      : [text(m[3])];
    a._raw = m[3];
    out.push(a);
  }
  return out;
}

// self-closing / void elements carrying data-* (bars, dwells, rects, edges)
function marks(html, key) {
  const out = [];
  const re = new RegExp(`<[a-z]+([^>]*\\bdata-${key}="[^"]*"[^>]*)>`, "g");
  for (const m of html.matchAll(re)) out.push(attrs(m[1]));
  return out;
}

function checked(html, name) {
  const m = html.match(new RegExp(`data-check="${name}"[^>]*>([\\s\\S]*?)<`));
  if (!m) throw new Error(`no element with data-check="${name}"`);
  return squash(decode(m[1]));
}

const num = (s) => Number(String(s).replace(/[^0-9.\-]/g, ""));
const round = (v, d) => Number(v.toFixed(d));
const t = (s) => Date.parse(s + ":00Z");

// "1d 5h 30m" / "14h 25m" / "45m" -> ms
function dur(s) {
  const d = /(\d+)\s*d/.exec(s), h = /(\d+)\s*h/.exec(s), m = /(\d+)\s*m/.exec(s);
  return ((d ? +d[1] * 1440 : 0) + (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0)) * 60000;
}

const html1 = await readFile(V1, "utf8");
const html2 = await readFile(V2, "utf8");
const html3 = await readFile(V3, "utf8");

/* ---- horizon geometry, read off the markup, not assumed --------------- */
const H0 = t("2026-02-06T00:00"), H1 = t("2026-02-16T00:00");
const TRACK = 946;
const SPAN = H1 - H0;

const plans = rows(html1, "plan");
const bars = marks(html1, "leg");
const dwells = marks(html1, "dwell");

/* ================================================================ CHAIN 1 */
chain(1, "view 1 — every bar's geometry is its own timestamps");
ok(1, "bar count", bars.length, plans.reduce((s, p) => s + +p.legs, 0));
for (const b of bars) {
  const L = ((t(b.start) - H0) / SPAN) * TRACK;
  const W = ((t(b.end) - t(b.start)) / SPAN) * TRACK;
  near(1, `${b.leg} left`, +b.left, L, 0.011);
  near(1, `${b.leg} width`, +b.width, W, 0.011);
  if (t(b.end) <= t(b.start)) failures.push(`[chain 1] ${b.leg} ends before it starts`);
}
ok(1, "no bar starts before the horizon", bars.every((b) => t(b.start) >= H0), true);
ok(1, "no bar ends after the horizon", bars.every((b) => t(b.end) <= H1), true);

/* ================================================================ CHAIN 2 */
chain(2, "view 1 — dwell is the gap between consecutive legs, and its label agrees");
const byPlan = {};
for (const b of bars) {
  const [id, i] = b.leg.split(":");
  (byPlan[id] ||= [])[+i] = b;
}
const dwLabels = [...html1.matchAll(/data-dwlabel="([^"]+)"[^>]*>([^<]*)</g)]
  .reduce((m, x) => ((m[x[1]] = squash(decode(x[2]))), m), {});
for (const d of dwells) {
  const [id, i] = d.dwell.split(":");
  const prev = byPlan[id][+i], next = byPlan[id][+i + 1];
  ok(2, `${d.dwell} from = leg ${i} end`, d.from, prev.end);
  ok(2, `${d.dwell} to = leg ${+i + 1} start`, d.to, next.start);
  const gap = t(d.to) - t(d.from);
  if (dwLabels[d.dwell]) ok(2, `${d.dwell} label`, dur(dwLabels[d.dwell]), gap);
}

/* ================================================================ CHAIN 3 */
chain(3, "view 1 — the summary line is the sum of the rows");
const totalT = plans.reduce((s, p) => s + +p.tonnes, 0);
const schedT = plans.filter((p) => +p.legs > 0).reduce((s, p) => s + +p.tonnes, 0);
const legCount = plans.reduce((s, p) => s + +p.legs, 0);
ok(3, "planned tonnage", num(checked(html1, "sum-planned")), totalT);
ok(3, "scheduled tonnage", num(checked(html1, "sum-scheduled")), schedT);
ok(3, "legs", num(checked(html1, "sum-legs")), legCount);
ok(3, "plans n of m", checked(html1, "sum-plans"),
  `${plans.filter((p) => +p.legs > 0).length} of ${plans.length}`);
ok(3, "exactly one plan is unscheduled", plans.filter((p) => +p.legs === 0).length, 1);
ok(3, "the unscheduled plan has no bars",
  bars.some((b) => b.leg.startsWith(plans.find((p) => +p.legs === 0).do)), false);

/* ================================================================ CHAIN 4 */
chain(4, "view 2 — each plan row's components sum to its own total");
const costRows = rows(html2, "cost");
const planRows = costRows.filter((r) => r.kind === "plan" && r.legs);
const legRows = costRows.filter((r) => r.kind === "leg");
const C = { freight: 3, handling: 4, storage: 5, acc: 6, total: 7, pert: 8 };
const cell = (r, k) => (r._cells[C[k]] === "—" ? 0 : num(r._cells[C[k]]));
for (const r of planRows) {
  const sum = round(cell(r, "freight") + cell(r, "handling") + cell(r, "storage") + cell(r, "acc"), 2);
  ok(4, `${r.do} components sum`, sum, cell(r, "total"));
  ok(4, `${r.do} A$/t`, round(cell(r, "total") / +r.tonnes, 2), cell(r, "pert"));
}

/* ================================================================ CHAIN 5 */
chain(5, "view 2 — the expanded legs sum to their plan row");
const expandedDo = legRows[0].do;
const parent = planRows.find((r) => r.do === expandedDo);
ok(5, "expanded leg count matches the plan's leg count", legRows.length, +parent.legs);
for (const k of ["freight", "handling", "storage", "acc", "total"]) {
  ok(5, `${expandedDo} ${k}`, round(legRows.reduce((s, r) => s + cell(r, k), 0), 2), cell(parent, k));
}
ok(5, "every leg carries the plan's tonnage",
  legRows.every((r) => r.tonnes === parent.tonnes), true);
ok(5, "the final leg is ship loading with no freight",
  cell(legRows.at(-1), "freight"), 0);

/* ================================================================ CHAIN 6 */
chain(6, "view 2 — the corridor footer is the sum of the plan rows");
const footT = num(checked(html2, "footT"));
ok(6, "footer tonnes", footT, planRows.reduce((s, r) => s + +r.tonnes, 0));
for (const [name, k] of [["footFreight", "freight"], ["footHand", "handling"],
                         ["footStore", "storage"], ["footAcc", "acc"], ["footTotal", "total"]]) {
  ok(6, name, num(checked(html2, name)), round(planRows.reduce((s, r) => s + cell(r, k), 0), 2));
}
const footTotal = num(checked(html2, "footTotal"));
ok(6, "footer A$/t", num(checked(html2, "footPerT")), round(footTotal / footT, 2));
ok(6, "freight + handling + storage + accessorial = total",
  round(["footFreight", "footHand", "footStore", "footAcc"]
    .reduce((s, n) => s + num(checked(html2, n)), 0), 2), footTotal);

/* ================================================================ CHAIN 7 */
chain(7, "cross-screen — view 2's ledger is view 1's board");
ok(7, "same scheduled plan count", planRows.length, plans.filter((p) => +p.legs > 0).length);
for (const r of planRows) {
  const p = plans.find((x) => x.do === r.do);
  ok(7, `${r.do} tonnage agrees across views`, r.tonnes, p.tonnes);
  ok(7, `${r.do} leg count agrees across views`, r.legs, p.legs);
}
ok(7, "view 2 footer tonnage = view 1 scheduled tonnage", footT, schedT);
ok(7, "view 2 total = view 1 forecast", footTotal, num(checked(html1, "sum-forecast")));
ok(7, "view 2 A$/t = view 1 A$/t",
  num(checked(html2, "footPerT")), num(checked(html1, "sum-per-tonne")));
ok(7, "view 2 summary forecast = its own footer", num(checked(html2, "sum-forecast")), footTotal);
for (const [s, f] of [["sum-freight", "footFreight"], ["sum-handling", "footHand"],
                      ["sum-storage", "footStore"], ["sum-accessorial", "footAcc"]])
  ok(7, `${s} = ${f}`, num(checked(html2, s)), num(checked(html2, f)));

/* ================================================================ CHAIN 8 */
chain(8, "cross-screen — the storage forecast is driven by view 1's leg timestamps");
// Rebuild the KWI-C4 balance purely from view 1's bars: APW1 plans bound for
// Kwinana, +tonnage when an inland leg arrives, -tonnage when loading finishes.
const opening = num(checked(html2, "c4open"));
const occ = marks(html2, "occ").sort((a, b) => +a.occ - +b.occ);
const c4Plans = plans.filter((p) => p.grade === "APW1" && p.port === "Kwinana" && +p.legs > 0);
const events = [];
for (const p of c4Plans) {
  const legs = byPlan[p.do];
  legs.forEach((b, i) => {
    if (b.mode === "load") events.push({ at: t(b.end), d: -(+p.tonnes) });
    else if (i === legs.length - 2 || (legs[i + 1] && legs[i + 1].mode === "load"))
      events.push({ at: t(b.end), d: +p.tonnes });
  });
}
events.sort((a, b) => a.at - b.at);
let bal = opening, k = 0;
const series = [];
for (let d = 0; d < occ.length; d++) {
  const dayEnd = H0 + (d + 1) * 86400000;
  let peak = bal;
  while (k < events.length && events[k].at < dayEnd) { bal += events[k].d; if (bal > peak) peak = bal; k++; }
  series.push(peak);
}
ok(8, "movement count", events.length, num(html2.match(/driven by (\d+) scheduled movements/)[1]));
for (let d = 0; d < occ.length; d++)
  ok(8, `day ${d} peak recomputed from view 1`, +occ[d].peak, series[d]);
ok(8, "the series closes back on its opening balance", series.at(-1), opening);

/* ================================================================ CHAIN 9 */
chain(9, "view 2 — the breach is the maximum of the series it is drawn from");
const peaks = occ.map((o) => +o.peak);
const maxPeak = Math.max(...peaks);
const cap = num(html2.match(/CAPACITY ([\d,]+) t/)[1]);
const dockFoot = text(html2.match(/KWI-C4 peak[\s\S]*?clears if DO-\d+ defers[\s\S]*?<\/div>/)[0]);
ok(9, "quoted peak is the real maximum", num(dockFoot.match(/peak ([\d,]+) t/)[1]), maxPeak);
ok(9, "the peak breaches capacity", maxPeak > cap, true);
ok(9, "quoted overage", num(dockFoot.match(/([\d,]+) t over/)[1]), maxPeak - cap);
ok(9, "exactly one day breaches", peaks.filter((p) => p > cap).length, 1);
ok(9, "the breaching bar is the one drawn red",
  html2.includes(`data-peak="${maxPeak}" x=`) &&
  new RegExp(`data-peak="${maxPeak}"[^>]*fill="#b3261e"`).test(html2), true);
// the quoted deferral is exactly the gap that clears the breach
const deferBy = dur(checked(html2, "deferBy"));
const breachPlan = dockFoot.match(/(DO-\d+) defers/)[1];
const arr = byPlan[breachPlan].find((b) => b.mode !== "load");
const shifted = events.map((e) => (e.at === t(arr.end) ? { ...e, at: e.at + deferBy } : e))
  .sort((a, b) => a.at - b.at);
let b2 = opening, worst = opening;
for (const e of shifted) { b2 += e.d; if (b2 > worst) worst = b2; }
ok(9, "deferring by the quoted amount clears the breach", worst <= cap, true);

/* =============================================================== CHAIN 10 */
chain(10, "view 1 — the exception list is bound to real figures");
const exc = rows(html1, "exception");
ok(10, "exception count matches the summary", exc.length, num(checked(html1, "sum-exceptions")));
ok(10, "two are blocking", exc.filter((e) => e.kind === "e").length, 2);
const excText = exc.map((e) => text(e._raw)).join(" | ");
// the missed connection: rail departs before the road leg finishes
const heldPlan = plans.find((p) => p.status === "held");
const hl = byPlan[heldPlan.do];
const overlap = t(hl[0].end) - t(hl[1].start);
ok(10, "the held plan really does overlap its own legs", overlap > 0, true);
ok(10, "quoted overlap", dur(excText.match(/Rail departs ([\dhm ]+) before/)[1]), overlap);
ok(10, "the exception names the held plan", excText.includes(heldPlan.do), true);
ok(10, "quoted breach peak", num(excText.match(/Peak ([\d,]+) t vs/)[1]), maxPeak);
ok(10, "quoted breach capacity", num(excText.match(/vs ([\d,]+) t/)[1]), cap);
ok(10, "quoted breach overage", num(excText.match(/over by ([\d,]+) t/)[1]), maxPeak - cap);
ok(10, "quoted deferral matches view 2", dur(excText.match(/defers ([\dhm ]+)\./)[1]), deferBy);

/* =============================================================== CHAIN 11 */
chain(11, "view 3 — the leg-ranked graph rolls up");
const gnodes = marks(html3, "node");
const gedges = marks(html3, "edge");
const laneTag = checked(html3, "graphLanes").match(/(\d+) of (\d+)/);
ok(11, "lane count in the header", +laneTag[2], gedges.length);
ok(11, "lanes in the summary line", num(checked(html3, "sum-lanes")), gedges.length);
const nodeT = Object.fromEntries(gnodes.map((n) => [n.node, +n.t]));
// every edge lands on a node that exists, and never spans more than one rank
for (const e of gedges) {
  const [a, b] = e.edge.split("|");
  ok(11, `${e.edge} endpoints exist`, a in nodeT && b in nodeT, true);
  ok(11, `${e.edge} spans exactly one leg`, +b.split("@")[1] - +a.split("@")[1], 1);
}
// each non-origin node equals the sum of the edges arriving at it
for (const n of gnodes.filter((x) => +x.leg > 0)) {
  const into = gedges.filter((e) => e.edge.split("|")[1] === n.node);
  ok(11, `${n.node} = sum of inbound lanes`, into.reduce((s, e) => s + +e.t, 0), +n.t);
}
// each origin node equals the sum of the edges leaving it — except an origin
// whose orders are all unrouted, which holds tonnage no lane carries yet
const unrouted = plans.filter((p) => +p.legs === 0).reduce((s, p) => s + +p.tonnes, 0);
const stranded = [];
for (const n of gnodes.filter((x) => +x.leg === 0)) {
  const out = gedges.filter((e) => e.edge.split("|")[0] === n.node);
  if (!out.length) { stranded.push(n); continue; }
  ok(11, `${n.node} = sum of outbound lanes`, out.reduce((s, e) => s + +e.t, 0), +n.t);
}
ok(11, "an origin with no outbound lane is view 1's unscheduled order",
  stranded.reduce((s, n) => s + +n.t, 0), unrouted);

/* =============================================================== CHAIN 12 */
chain(12, "cross-screen — the graph's port instances reconcile to view 1's tonnage");
const portNodes = gnodes.filter((n) => n.ech === "port");
const portNames = [...new Set(portNodes.map((n) => n.node.split("@")[0]))];
for (const name of portNames) {
  const instances = portNodes.filter((n) => n.node.split("@")[0] === name);
  const shown = instances.reduce((s, n) => s + +n.t, 0);
  const fromBoard = plans.filter((p) => p.port === name && +p.legs > 0)
    .reduce((s, p) => s + +p.tonnes, 0);
  ok(12, `${name}: ${instances.length} leg instances sum to view 1's tonnage`, shown, fromBoard);
}
ok(12, "at least one facility appears at more than one leg",
  portNodes.length > portNames.length, true);
// zone origins reconcile too
const zoneNodes = gnodes.filter((n) => n.ech === "zone");
ok(12, "zone tonnage = routed port tonnage + the unrouted order",
  zoneNodes.reduce((s, n) => s + +n.t, 0),
  portNames.reduce((s, n) => s + plans.filter((p) => p.port === n && +p.legs > 0)
    .reduce((a, p) => a + +p.tonnes, 0), 0) + unrouted);
// every echelon that is drawn has a colour token
for (const e of ["zone", "siding", "yard", "port"])
  ok(12, `echelon "${e}" is drawn`, gnodes.some((n) => n.ech === e), true);

/* =============================================================== CHAIN 13 */
chain(13, "view 3 — asset utilisation is arithmetic, not decoration");
const util = rows(html3, "util");
const U = { units: 4, cap: 5, assigned: 6, factor: 7 };
for (const r of util) {
  const f = num(r._cells[U.factor]);
  if (r.class === "berth") {
    ok(13, `${r.key} load factor`, round((+r.used / +r.granted) * 100, 1), f);
    ok(13, `${r.key} calls`, +r.units, num(r._cells[U.units]));
  } else {
    ok(13, `${r.plan} ${r.class} capacity = units × unit size`,
      +r.cap % +r.units, 0);
    ok(13, `${r.plan} ${r.class} load factor`,
      round((+r.assigned / +r.cap) * 100, 1), f);
    ok(13, `${r.plan} ${r.class} assigned ≤ capacity`, +r.assigned <= +r.cap, true);
  }
}
const target = num(html3.match(/target (\d+)%/)[1]) / 100;
const lanes = util.filter((r) => r.class !== "berth");
ok(13, "the below-target badge is derived from the lanes shown",
  num(checked(html3, "belowTarget")),
  lanes.filter((r) => +r.assigned / +r.cap < target).length);
// deadfreight is the shortfall on the one dedicated booking, priced per tonne
const dedicated = util.find((r) => /Dedicated/.test(r._cells[3]));
const dfT = num(text(dedicated._raw).match(/deadfreight ([\d,]+) t/)[1]);
ok(13, "deadfreight tonnage = set capacity − assigned", dfT, +dedicated.cap - +dedicated.assigned);
ok(13, "only one booking is dedicated", util.filter((r) => /Dedicated/.test(r._cells[3])).length, 1);
// and view 1 prices that same shortfall
const dfLine = excText.match(/([\d,]+) t short\. Deadfreight A\$ ([\d,.]+) at A\$ ([\d.]+)\/t/);
ok(13, "view 1 quotes the same shortfall", num(dfLine[1]), dfT);
ok(13, "deadfreight amount = shortfall × rate", num(dfLine[2]), round(dfT * num(dfLine[3]), 2));

/* =============================================================== CHAIN 14 */
chain(14, "view 3 — route candidates cost out, and the current one is view 2's row");
const cands = rows(html3, "cand");
const K = { dwell: 3, freight: 4, handling: 5, storage: 6, acc: 7, landed: 8, pert: 9 };
const kcell = (r, k) => (r._cells[K[k]] === "—" ? null : num(r._cells[K[k]]));
for (const r of cands) {
  if (kcell(r, "landed") === null) continue;
  const sum = round(["freight", "handling", "storage", "acc"]
    .reduce((s, k) => s + (kcell(r, k) || 0), 0), 2);
  ok(14, `${r.do} "${r._cells[1]}" components sum`, sum, kcell(r, "landed"));
  ok(14, `${r.do} "${r._cells[1]}" A$/t`, round(kcell(r, "landed") / +r.t, 2), kcell(r, "pert"));
}
const currents = cands.filter((r) => r.current === "1");
ok(14, "exactly one current route per order", currents.length,
  new Set(cands.map((r) => r.do)).size);
for (const c of currents) {
  const row = planRows.find((r) => r.do === c.do);
  ok(14, `${c.do} current candidate = view 2's landed cost`, kcell(c, "landed"), cell(row, "total"));
  ok(14, `${c.do} current candidate = view 2's A$/t`, kcell(c, "pert"), cell(row, "pert"));
  ok(14, `${c.do} current candidate = view 1's tonnage`,
    +c.t, +plans.find((p) => p.do === c.do).tonnes);
  ok(14, `${c.do} current route is the infeasible one`,
    /Infeasible/.test(c._cells[10]), true);
}
// every order with a rejected current route offers exactly one recommendation
for (const id of new Set(cands.map((r) => r.do))) {
  const set = cands.filter((r) => r.do === id);
  ok(14, `${id} has exactly one recommendation`,
    set.filter((r) => /Recommended/.test(r._cells[10])).length, 1);
  const rec = set.find((r) => /Recommended/.test(r._cells[10]));
  ok(14, `${id} recommendation is feasible`, /Infeasible/.test(rec._cells[10]), false);
}
ok(14, "infeasible count in the dock footer",
  num(text(html3).match(/(\d+) of \d+ infeasible/)[1]),
  cands.filter((r) => /Infeasible/.test(r._cells[10])).length);
ok(14, "infeasible count in the summary line",
  num(checked(html3, "sum-infeasible")),
  cands.filter((r) => /Infeasible/.test(r._cells[10])).length);
// the recommended deferral for the breaching order is cheaper than the current
const breachSet = cands.filter((r) => r.do === breachPlan);
const cur = breachSet.find((r) => r.current === "1");
const rec = breachSet.find((r) => /Recommended/.test(r._cells[10]));
ok(14, "the recommendation costs less than the current plan",
  kcell(rec, "landed") < kcell(cur, "landed"), true);
ok(14, "…because it holds less storage", kcell(rec, "storage") < kcell(cur, "storage"), true);
ok(14, "…and it holds it for exactly the deferred time",
  dur(rec._cells[K.dwell]), dur(cur._cells[K.dwell]) - deferBy);
ok(14, "the current plan's dwell is view 1's dwell",
  dur(cur._cells[K.dwell]),
  dwells.filter((d) => d.dwell.startsWith(breachPlan))
    .reduce((s, d) => s + (t(d.to) - t(d.from)), 0));

/* =============================================================== CHAIN 15 */
chain(15, "view 3 — the summary line is derived from the panels below it");
const railRows = util.filter((r) => r.class === "rail");
ok(15, "rail sets is a whole number", Number.isInteger(num(checked(html3, "sum-rail-sets"))), true);
ok(15, "road trips is a whole number", Number.isInteger(num(checked(html3, "sum-road-trips"))), true);
ok(15, "zones shown ≤ zones in the network",
  gnodes.filter((n) => n.ech === "zone").length <= num(checked(html3, "sum-zones")), true);
ok(15, "t·km are reported by mode, never tonnes",
  /t·km/.test(checked(html3, "sum-rail")) && /t·km/.test(checked(html3, "sum-road")), true);

/* =============================================================== CHAIN 18 */
chain(18, "view 3 — the minimap and the zoom level describe the actual viewport");
const mini = marks(html3, "mini");
const miniCols = {};
for (const m of mini) {
  const [c] = m.mini.split(":");
  (miniCols[c] ||= { all: 0, on: 0 });
  miniCols[c].all++;
  if (m.in === "1") miniCols[c].on++;
}
const cols = Object.values(miniCols);
ok(18, "the minimap has one column per leg rank", cols.length,
  new Set(gnodes.map((n) => n.leg)).size);
// The canvas draws the whole network and clips it, so every node has a dot and
// the two must agree on which side of the window each one falls.
ok(18, "one dot per node in the network", mini.length, gnodes.length);
const canvasIn = gnodes.filter((n) => n.in === "1");
ok(18, "enclosed dots total = nodes drawn whole on the canvas",
  mini.filter((m) => m.in === "1").length, canvasIn.length);
ok(18, "the window shows less than the whole network",
  canvasIn.length < gnodes.length, true);
const label = text(html3).match(/(\d+) \/ (\d+) NODES/);
ok(18, "minimap label — nodes in view", +label[1], canvasIn.length);
ok(18, "minimap label — nodes in the network", +label[2], mini.length);

// The window is a rectangle, so a single horizontal cut separates the nodes it
// contains from the ones it does not — whatever column they sit in.
const bottom = (n) => +n.y + +n.h;
const lastIn = Math.max(...canvasIn.map(bottom));
const firstOut = Math.min(...gnodes.filter((n) => n.in === "0").map(bottom));
ok(18, "one horizontal cut separates in from out", lastIn <= firstOut, true);

// world extent, measured off the boxes the canvas actually drew
const svg = html3.match(/<svg width="(\d+)" height="(\d+)" viewBox="0 -18/);
const [winW, winH] = [+svg[1], +svg[2]];
const worldW = Math.max(...gnodes.map((n) => +n.x + +n.w));
const worldH = Math.max(...gnodes.map(bottom));
ok(18, "the window is as wide as the network", winW, worldW);
ok(18, "the window is shorter than the network", winH < worldH, true);
ok(18, "the window's height is the cut", winH >= lastIn && winH < firstOut, true);
// and it lands inside the next row of boxes rather than clear above them, so
// the clipped row is visible along the bottom edge
ok(18, "the window edge cuts through a row of boxes",
  Math.min(...gnodes.filter((n) => n.in === "0").map((n) => +n.y)) < winH, true);

// The minimap is the same world at one scale factor: both rectangles and every
// dot come off that one number.
const vp = marks(html3, "check").find((m) => m.check === "viewport");
near(18, "viewport rectangle height", +vp.h, winH * +vp.scale, 0.011);
near(18, "network rectangle height", +vp.full, worldH * +vp.scale, 0.011);
near(18, "viewport rectangle width", +vp.w, worldW * +vp.scale, 0.011);
ok(18, "the viewport is shorter than the network", +vp.h < +vp.full, true);
for (const m of mini) {
  const [c, r] = m.mini.split(":").map(Number);
  const n = gnodes.filter((g) => +g.leg === c).sort((a, b) => +a.y - +b.y)[r];
  ok(18, `dot ${m.mini} sits at its node's centre`,
    Math.abs((+m.cy - +vp.y) - (+n.y + +n.h / 2) * +vp.scale) < 0.011, true);
}
// Fit would shrink the whole network into the window; the readout is how much
// closer in than Fit the canvas is drawn, and it cannot be 100%.
const fit = Math.min(winW / worldW, winH / worldH);
ok(18, "zoom level", num(checked(html3, "zoom")), Math.round(100 / fit / 5) * 5);
ok(18, "a partial viewport is never reported as 100%",
  num(checked(html3, "zoom")) > 100, true);

/* =============================================================== CHAIN 19 */
chain(19, "view 3 — the minimap reads down each column exactly as the canvas does");
const ECHC = { zone: "#3f5266", siding: "#96586a", yard: "#6f6a33", port: "#b07a12" };
const miniDots = [...html3.matchAll(/<rect[^>]*data-mini="(\d+):(\d+)"[^>]*data-ech="([a-z]+)"[^>]*\/>/g)]
  .map((m) => ({ col: +m[1], row: +m[2], ech: m[3] }));
ok(19, "every dot declares an echelon", miniDots.length, mini.length);
const fills = [...html3.matchAll(/<rect[^>]*fill="(#[0-9a-f]{6})"[^>]*data-mini="(\d+):(\d+)"[^>]*data-ech="([a-z]+)"/g)];
ok(19, "every dot's fill is its echelon's token",
  fills.every((m) => m[1] === ECHC[m[4]]), true);
ok(19, "the canvas uses the same four tokens",
  Object.values(ECHC).every((c) => html3.includes(`fill="${c}"`)), true);
for (let c = 0; c < cols.length; c++) {
  const canvasCol = gnodes.filter((n) => +n.leg === c).sort((a, b) => +a.y - +b.y).map((n) => n.ech);
  const miniCol = miniDots.filter((d) => d.col === c).sort((a, b) => a.row - b.row).map((d) => d.ech);
  ok(19, `leg ${c}: colour sequence matches the canvas`,
    miniCol.slice(0, canvasCol.length).join(","), canvasCol.join(","));
}

/* =============================================================== CHAIN 16 */
chain(16, "all three views are the same product");
const shell = [
  [/\.app\{flex:0 0 48px;/, "48px app bar"],
  [/\.cmd\{flex:0 0 44px;/, "44px command bar"],
  [/\.sum\{flex:0 0 32px;/, "32px summary line"],
  [/\.dock\{flex:0 0 208px;/, "208px dock"],
  [/\.dock__t\{flex:0 0 32px;/, "32px dock tab strip"],
  [/\.foot\{flex:0 0 26px;/, "26px footer"],
  [/--brand:#b26b00;/, "amber brand token"],
  [/--slate:#333d4a;/, "slate chrome token"],
  [/font:400 12px\/1\.4 "Segoe UI Variable Text"/, "type scale"],
  [/\.wm b\{font-size:14px;font-weight:600;letter-spacing:\.185em/, "wordmark"],
  [/\.main\{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:10px 14px\}/, "main padding"],
];
for (const [re, name] of shell) {
  ok(16, `${name} — view 1`, re.test(html1), true);
  ok(16, `${name} — view 2`, re.test(html2), true);
  ok(16, `${name} — view 3`, re.test(html3), true);
}
const navOf = (h) => [...h.matchAll(/<div class="tab[^"]*">([^<]+)<\/div>/g)].map((m) => decode(m[1]));
ok(16, "nav is identical on views 1 and 2", navOf(html1).join("|"), navOf(html2).join("|"));
ok(16, "nav is identical on views 1 and 3", navOf(html1).join("|"), navOf(html3).join("|"));
ok(16, "exactly one nav item is active per view",
  [html1, html2, html3].every((h) => (h.match(/class="tab on"/g) || []).length === 1), true);
// lookbehind so data-class="rail" (the utilisation table's asset class) is not
// mistaken for a rail element
ok(16, "no view has a left rail", /(?<![-\w])class="rail[" ]|\.rail\s*\{/.test(html1 + html2 + html3), false);
ok(16, "no view has a fixed-width side column", /\.w420|flex:0 0 420px/.test(html1 + html2 + html3), false);
ok(16, "no view has a KPI tile strip", /class="stats"|class="st"/.test(html1 + html2 + html3), false);
for (const [n, h] of [[1, html1], [2, html2], [3, html3]]) {
  ok(16, `view ${n} has exactly one dock`, (h.match(/class="card dock"/g) || []).length, 1);
  ok(16, `view ${n} clock is 09:14:52`, checked(h, "synced"), "09:14:52");
  ok(16, `view ${n} rate card is r-2026.02-a`, checked(h, "footRate"), "r-2026.02-a");
  ok(16, `view ${n} build string`, /TRAMOS <b[^>]*>4\.8\.2<\/b>/.test(h), true);
  ok(16, `view ${n} carries no disclaimer text`, /reference implementation|\bNDA\b|under embargo/.test(h), false);
}
ok(16, "the feed sync is earlier than the clock",
  checked(html1, "footSync") < checked(html1, "synced"), true);

/* =============================================================== CHAIN 17 */
chain(17, "non-happy states are actually present");
ok(17, "a plan is held", plans.some((p) => p.status === "held"), true);
ok(17, "a plan is at risk", plans.some((p) => p.status === "atrisk"), true);
ok(17, "a plan is unscheduled", plans.some((p) => p.status === "unscheduled"), true);
ok(17, "the unscheduled plan shows — for every cost",
  costRows.filter((r) => r.kind === "plan" && !r.legs)
    .every((r) => r._cells.slice(3, 9).every((c) => c === "—")), true);
ok(17, "a primary action is disabled on every view",
  [html1, html2, html3].every((h) => /btn--p" aria-disabled="true"/.test(h)), true);
ok(17, "a stale-feed chip is shown", /chip--st/.test(html1), true);
ok(17, "not every plan is confirmed",
  planRows.every((r) => /Confirmed/.test(r._cells[9])), false);
ok(17, "a berth window is under-used",
  util.some((r) => r.class === "berth" && +r.used / +r.granted < 0.6), true);
ok(17, "at least one string truncates in the frozen columns",
  plans.some((p) => p._cells[1].length > 24), true);

/* ------------------------------------------------------------------ */
console.log(
  failures.length
    ? `\n\x1b[31m${failures.length} FAILED\x1b[0m of ${pass + failures.length}\n` + failures.map((f) => "  " + f).join("\n")
    : `\n\x1b[32mAll ${pass} assertions pass.\x1b[0m`
);
process.exit(failures.length ? 1 : 0);
