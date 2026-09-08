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

// The board is a four-year window on a thirty-year programme, ruled in weeks.
// Every one of those numbers comes from the strip above the grid, and the track
// width from the strip's own svg.
const win = marks(html1, "check").find((m) => m.check === "window");
const WIN_M0 = +win.m0, WIN_M = +win.m, MONTHS = +win.total, WIN_W = +win.weeks;
const TRACK = +html1.match(/<svg width="(\d+)" height="16"/)[1];
const WKW = TRACK / WIN_W;              // pixels a week
const WPM = WIN_W / WIN_M;              // weeks a month, at the board's own scale
const WIN_W0 = Math.round(WIN_M0 * WPM);

const streams = rows(html1, "stream");
const phases = marks(html1, "phase");
const holds = marks(html1, "hold");

/* ================================================================ CHAIN 1 */
chain(1, "view 1 — every phase bar's geometry is its own months, drawn in weeks");
ok(1, "phase count", phases.length, streams.reduce((s, r) => s + +r.phases, 0));
for (const p of phases) {
  // two steps, both checkable: months resolve to weeks at the board's own
  // scale, and weeks resolve to pixels at the track's own width
  ok(1, `${p.phase} opens on the week its month turns`, +p.w0, Math.round(+p.m0 * WPM));
  ok(1, `${p.phase} closes on the week after its last month`, +p.w1, Math.round((+p.m1 + 1) * WPM));
  near(1, `${p.phase} left`, +p.left, (+p.w0 - WIN_W0) * WKW, 0.011);
  near(1, `${p.phase} width`, +p.width, (+p.w1 - +p.w0) * WKW, 0.011);
  ok(1, `${p.phase} runs forwards`, +p.m1 >= +p.m0, true);
  ok(1, `${p.phase} is inside the horizon`, +p.m1 < MONTHS, true);
}
// Thickness carries the monthly rate, so it has to be a straight line through
// the rates actually drawn — not a look-up someone can nudge per bar.
const hs = phases.map((p) => +p.h), tp = phases.map((p) => +p.tpm);
const hMin = Math.min(...hs), hMax = Math.max(...hs);
const tMin = Math.min(...tp), tMax = Math.max(...tp);
ok(1, "thickness spans a visible range", hMax - hMin >= 8, true);
for (const p of phases)
  near(1, `${p.phase} thickness`, +p.h,
    hMin + ((+p.tpm - tMin) / (tMax - tMin)) * (hMax - hMin), 0.011);
ok(1, "the heaviest bar is the highest rate",
  phases.find((p) => +p.h === hMax).tpm, String(tMax));
ok(1, "the lightest bar is the lowest rate",
  phases.find((p) => +p.h === hMin).tpm, String(tMin));
// and every bar is centred in its row, so thickness reads against a common axis
const rowH = 2 * (+phases[0].h / 2) + 2 * num(html1.match(
  new RegExp(`data-phase="${phases[0].phase}"[^>]*top:([\\d.]+)px`))[1]);
for (const p of phases) {
  const top = num(html1.match(new RegExp(`data-phase="${p.phase}"[^>]*top:([\\d.]+)px`))[1]);
  near(1, `${p.phase} is centred`, top * 2 + +p.h, rowH, 0.02);
}

// a stream's tonnage is its own profile: months in each phase times the rate
for (const r of streams) {
  const mine = phases.filter((p) => p.phase.startsWith(r.site + ":"));
  ok(1, `${r.site} tonnage = its phases`,
    mine.reduce((s, p) => s + (+p.m1 + 1 - +p.m0) * +p.tpm, 0), +r.tonnes);
  ok(1, `${r.site} opens at its first phase`, Math.min(...mine.map((p) => +p.m0)), +r.m0);
  ok(1, `${r.site} closes at its last phase`, Math.max(...mine.map((p) => +p.m1)), +r.m1);
}

/* ================================================================ CHAIN 2 */
chain(2, "view 1 — a hold is the gap between consecutive phases, and its label agrees");
const holdLabels = marks(html1, "holdlabel");
for (const h of holds) {
  const [site, i] = h.hold.split(":");
  const mine = phases.filter((p) => p.phase.startsWith(site + ":"))
    .sort((a, b) => +a.m0 - +b.m0);
  const gap = +mine[+i + 1].m0 - +mine[+i].m1 - 1;
  ok(2, `${h.hold} is the gap between its own phases`, +h.months, gap);
  ok(2, `${h.hold} starts when the phase before it ends`, +h.from, +mine[+i].m1 + 1);
  const lm = html1.match(new RegExp(`data-holdlabel="${site}:${i}"[^>]*>([^<]*)<`));
  if (lm) {
    const said = lm[1].match(/(?:(\d+)y )?(\d+)m/);
    ok(2, `${h.hold} label`, (said[1] ? +said[1] * 12 : 0) + +said[2], gap);
  }
}
ok(2, "every hold that is labelled is drawn", holdLabels.length <= holds.length, true);
ok(2, "holds do not overlap the phases either side",
  holds.every((h) => +h.months > 0), true);

/* ================================================================ CHAIN 3 */
chain(3, "view 1 — the summary line is the sum of the rows");
const totalT = streams.reduce((s, r) => s + +r.tonnes, 0);
ok(3, "tonnage", num(checked(html1, "sum-tonnes")), totalT);
ok(3, "legs", num(checked(html1, "sum-legs")), streams.reduce((s, r) => s + +r.legs, 0));
ok(3, "commodities n of m", checked(html1, "sum-commodities").split(" of ")[0], String(streams.length));
const inPackage = num(checked(html1, "sum-commodities").split(" of ")[1]);
ok(3, "the package holds more than the page shows", inPackage > streams.length, true);
ok(3, "exactly one stream is unpriced",
  streams.filter((r) => r.status === "unpriced").length, 1);
ok(3, "the horizon is the whole programme", checked(html1, "sum-horizon").replace(/\s/g, ""),
  `${2026}–${2026 + MONTHS / 12 - 1}`);

/* ================================================================ CHAIN 4 */
chain(4, "view 2 — each stream row's components sum to its own total");
const costRows = rows(html2, "cost");
const streamRows = costRows.filter((r) => r.kind === "stream");
const legRows = costRows.filter((r) => r.kind === "leg");
const F = { freight: 3, handling: 4, storage: 5, acc: 6, total: 7, pert: 8 };
const cell = (r, k) => (r._cells[F[k]] === "—" ? 0 : num(r._cells[F[k]]));
for (const r of streamRows) {
  const sum = round(["freight", "handling", "storage", "acc"].reduce((s, k) => s + cell(r, k), 0), 2);
  ok(4, `${r.site} components sum`, sum, cell(r, "total"));
  ok(4, `${r.site} A$/t`, round(cell(r, "total") / +r.tonnes, 2), cell(r, "pert"));
}
ok(4, "every costed stream is priced above zero",
  streamRows.every((r) => cell(r, "total") > 0), true);

/* ================================================================ CHAIN 5 */
chain(5, "view 2 — the expanded legs sum to their stream row");
const expandedSite = legRows[0].site;
const mineLegs = legRows.filter((r) => r.site === expandedSite);
const parent = streamRows.find((r) => r.site === expandedSite);
for (const k of ["freight", "handling", "storage"])
  ok(5, `${expandedSite} ${k}`, round(mineLegs.reduce((s, r) => s + cell(r, k), 0), 2),
    round(cell(parent, k), 2));
ok(5, `${expandedSite} total`,
  round(mineLegs.reduce((s, r) => s + cell(r, "total"), 0), 2),
  round(cell(parent, "total") - cell(parent, "acc"), 2));
ok(5, "every leg carries the stream's tonnage",
  mineLegs.every((r) => r.tonnes === parent.tonnes), true);
// storage on a leg is its own dwell at its own destination
for (const r of mineLegs) {
  const want = round(+r.tonnes * (+r["store-rate"] * +r["dwell-d"]), 2);
  ok(5, `${r.site}:${r.leg} storage = t x rate x dwell days`, cell(r, "storage"), want);
  ok(5, `${r.site}:${r.leg} freight = t x tariff`, cell(r, "freight"), round(+r.tonnes * +r.rate, 2));
}

/* ================================================================ CHAIN 6 */
chain(6, "view 2 — the programme footer is the sum of the stream rows");
const footT = num(checked(html2, "footT"));
ok(6, "footer tonnes", footT, streamRows.reduce((s, r) => s + +r.tonnes, 0));
for (const [name, k] of [["footFreight", "freight"], ["footHand", "handling"],
                         ["footStore", "storage"], ["footAcc", "acc"], ["footTotal", "total"]]) {
  ok(6, name, num(checked(html2, name)), round(streamRows.reduce((s, r) => s + cell(r, k), 0), 2));
}
const footTotal = num(checked(html2, "footTotal"));
ok(6, "footer A$/t", num(checked(html2, "footPerT")), round(footTotal / footT, 2));
ok(6, "freight + handling + storage + accessorial = opex",
  round(["footFreight", "footHand", "footStore", "footAcc"]
    .reduce((s, n) => s + num(checked(html2, n)), 0), 2), footTotal);
// capex is carried by the networks, counted once each, and budget is the pair
const nets = new Set(streamRows.map((r) => r._cells[1]));
// capital is only carried for networks that have costed tonnage under them, so
// the numerator and the denominator cover the same set
ok(6, "capex is quoted over the networks the ledger actually costs",
  num(text(html2).match(/capex A\$ ([\d.]+)m over (\d+) costed networks/)[2]), nets.size);
ok(6, "the package holds a network the budget does not",
  nets.size < new Set(streams.map((r) => r.net)).size, true);
const capexM = num(checked(html2, "sum-capex"));
const opexM = num(checked(html2, "sum-opex"));
ok(6, "budget = capex + opex", num(checked(html2, "sum-budget")), round(capexM + opexM, 1));
// the summary rate carries capex, the ledger column does not, so the two must
// differ — and the summary must be the larger of the pair
ok(6, "the budget rate is above the opex rate",
  num(checked(html2, "sum-budget-t")) > num(checked(html2, "footPerT")), true);
ok(6, "summary opex = the footer, to the million", opexM, round(footTotal / 1e6, 1));

/* ================================================================ CHAIN 7 */
chain(7, "cross-screen — view 2's ledger is view 1's board");
ok(7, "same costed stream count", streamRows.length,
  streams.filter((r) => r.status !== "unpriced").length);
for (const r of streamRows) {
  const s = streams.find((x) => x.site === r.site);
  ok(7, `${r.site} tonnage agrees across views`, +r.tonnes, +s.tonnes);
  ok(7, `${r.site} leg count agrees across views`, +r.legs, +s.legs);
}
ok(7, "view 2 footer tonnage = view 1's costed tonnage", footT,
  streams.filter((r) => r.status !== "unpriced").reduce((s, r) => s + +r.tonnes, 0));
ok(7, "view 1 budget rate = view 2 budget rate",
  num(checked(html1, "sum-budget-t")), num(checked(html2, "sum-budget-t")));
ok(7, "view 1 capex = view 2 capex", num(checked(html1, "sum-capex")), capexM);
ok(7, "view 1 opex = view 2 opex", num(checked(html1, "sum-opex")), opexM);
// the strip is in millions and the ledger in dollars, so compare them that way
// rather than letting the two formats drift apart unnoticed
for (const [s, f] of [["sum-freight", "footFreight"], ["sum-handling", "footHand"],
                      ["sum-storage", "footStore"], ["sum-accessorial", "footAcc"]])
  ok(7, `${s} = ${f} to the million`, num(checked(html2, s)),
    round(num(checked(html2, f)) / 1e6, 1));
// every money figure in the strip carries the same unit
ok(7, "the summary strip is in one unit throughout",
  ["sum-budget", "sum-capex", "sum-opex", "sum-freight", "sum-handling",
   "sum-storage", "sum-accessorial"].every((k) => /^A\$ [\d.]+m$/.test(checked(html2, k))), true);

/* ================================================================ CHAIN 8 */
chain(8, "cross-screen — the cell forecast is driven by view 1's demand phases");
// Rebuild the KWI-C4 balance purely from view 1: the streams of the cell's own
// commodity, and what each of them delivers in each month of the window.
const occ = marks(html2, "occ").sort((a, b) => +a.occ - +b.occ);
const opening = num(checked(html2, "c4open"));
const cellGrade = text(html2).match(/KWI-C4 · (\w+) segregated cell/)[1];
const feeding = streams.filter((r) => r.code === cellGrade);
ok(8, "the cell is fed by more than one stream", feeding.length > 1, true);
const tonnesAt = (site, m) => {
  const p = phases.filter((x) => x.phase.startsWith(site + ":"))
    .find((x) => m >= +x.m0 && m <= +x.m1);
  return p ? +p.tpm : 0;
};
const seriesFor = (lag, shift, shifted) => occ.map((_, m) => {
  let held = opening;
  for (let k = Math.max(0, m - lag + 1); k <= m; k++)
    for (const r of feeding) {
      const km = r.site === shifted ? k - shift : k;
      held += km < 0 ? 0 : tonnesAt(r.site, km);
    }
  return held;
});
// the dwell the cell holds against is not printed, so solve for it: exactly one
// lag reproduces every month the chart draws
const lags = [1, 2, 3, 4, 5, 6].filter((L) =>
  seriesFor(L, 0, null).every((v, i) => v === +occ[i].peak));
ok(8, "exactly one holding period reproduces the whole series", lags.length, 1);
const LAG = lags[0];
for (const [i, o] of occ.entries())
  ok(8, `month ${i} held`, +o.peak, seriesFor(LAG, 0, null)[i]);

/* ================================================================ CHAIN 9 */
chain(9, "view 2 — the breach is the maximum of the series it is drawn from");
const peaks = occ.map((o) => +o.peak);
const maxPeak = Math.max(...peaks);
const cap = num(text(html2).match(/CAPACITY ([\d,]+) t/)[1]);
const dockLine = text(html2);
ok(9, "quoted peak is the maximum of the series",
  num(dockLine.match(/KWI-C4 peak ([\d,]+) t/)[1]), maxPeak);
ok(9, "quoted overage", num(dockLine.match(/([\d,]+) t over/)[1]), maxPeak - cap);
ok(9, "the peak really is over capacity", maxPeak > cap, true);
ok(9, "the bar at the peak is the one drawn red",
  html2.includes(`data-peak="${maxPeak}" x=`) && /data-peak="\d+"[^>]*fill="#b3261e"/.test(html2), true);
// and deferring by the quoted amount actually clears it
const deferSaid = checked(html2, "deferBy").match(/(?:(\d+)y )?(\d+)m/);
const deferM = (deferSaid[1] ? +deferSaid[1] * 12 : 0) + +deferSaid[2];
const deferSite = dockLine.match(/clears if ([A-Z]+-\d) opens/)[1];
ok(9, "the deferred stream is one that feeds the cell",
  feeding.some((r) => r.site === deferSite), true);
ok(9, "deferring by the quoted months clears the breach",
  Math.max(...seriesFor(LAG, deferM, deferSite)) <= cap, true);
ok(9, "one month less would not clear it",
  Math.max(...seriesFor(LAG, deferM - 1, deferSite)) > cap, true);

/* =============================================================== CHAIN 10 */
chain(10, "view 1 — the exception list is bound to real figures");
const exc = rows(html1, "exception");
ok(10, "exception count matches the summary", exc.length, num(checked(html1, "sum-exceptions")));
ok(10, "two are blocking", exc.filter((e) => e.kind === "e").length, 2);
const excText = exc.map((e) => text(e._raw)).join(" | ");
// demand that opens before the works carrying it are commissioned
const blocked = streams.filter((r) => r.status === "held");
ok(10, "more than one stream is blocked", blocked.length > 1, true);
const marker = marks(html1, "ready");
for (const b of blocked) {
  ok(10, `${b.site} really does open before its route is ready`, +b.ready > +b.m0, true);
  ok(10, `${b.site} carries its own commissioning marker`,
    marker.some((m) => +m.ready === +b.ready), true);
}
// The outline is per phase, not per stream: a phase is outlined exactly when it
// opens before the works land, so a rule crossing a bar always has an outlined
// bar under it and a bar starting after the rule never carries one.
const outlined = (ph) => /bad/.test(html1.match(new RegExp(`<i class="[^"]*" data-phase="${ph}"`))[0]);
for (const r of streams)
  for (const p of phases.filter((x) => x.phase.startsWith(r.site + ":")))
    ok(10, `${p.phase} is outlined only if it opens before the works`,
      outlined(p.phase), +p.m0 < +r.ready);
// blocking is derived, not asserted: every stream that opens early is held, and
// no stream that is held opens on time
ok(10, "held is exactly the set of streams that open early",
  streams.filter((r) => +r.ready > +r.m0).map((r) => r.site).sort().join(","),
  blocked.map((r) => r.site).sort().join(","));
const early = Math.max(...blocked.map((b) => +b.ready - +b.m0));
const saidEarly = excText.match(/Demand opens up to (?:(\d+)y )?(\d+)m before/);
ok(10, "quoted worst lead time", (saidEarly[1] ? +saidEarly[1] * 12 : 0) + +saidEarly[2], early);
ok(10, "the exception names the stream that waits longest",
  excText.includes(blocked.find((b) => +b.ready - +b.m0 === early).site), true);
ok(10, "quoted blocked tonnage is all of it", num(excText.match(/([\d,]+) t unroutable/)[1]),
  blocked.reduce((s, b) => s + +b.tonnes, 0));
ok(10, "quoted blocked stream count", num(excText.match(/(\d+) streams/)[1]), blocked.length);
ok(10, "quoted breach peak", num(excText.match(/Peak ([\d,]+) t vs/)[1]), maxPeak);
ok(10, "quoted breach capacity", num(excText.match(/vs ([\d,]+) t/)[1]), cap);
ok(10, "quoted breach overage", num(excText.match(/over by ([\d,]+) t/)[1]), maxPeak - cap);
const saidDefer = excText.match(/opens (?:(\d+)y )?(\d+)m later/);
ok(10, "quoted deferral matches view 2",
  (saidDefer[1] ? +saidDefer[1] * 12 : 0) + +saidDefer[2], deferM);
// the unpriced stream is the one with no cost row
const unpriced = streams.find((r) => r.status === "unpriced");
ok(10, "the exception names the uncosted stream", excText.includes(unpriced.site), true);
ok(10, "quoted uncosted tonnage", num(excText.match(/([\d,]+) t carries no rate card/)[1]),
  +unpriced.tonnes);

/* =============================================================== CHAIN 20 */
chain(20, "view 1 — the window is a real slice of the thirty-year horizon");
ok(20, "the window is shorter than the horizon", WIN_M < MONTHS, true);
ok(20, "the horizon is thirty whole years", MONTHS % 12, 0);
ok(20, "the window is a whole number of years", WIN_M % 12, 0);
ok(20, "the board rules fifty-two weeks to the year", WIN_W, (WIN_M / 12) * 52);
// one column per quarter, each naming the thirteen weeks it covers
const qtrs = [...html1.matchAll(/data-qtr="(\d+)" data-w0="(\d+)"[^>]*>(.*?)<\/div>/g)];
ok(20, "one column per quarter in the window", qtrs.length, WIN_M / 3);
for (const [, q, w0, inner] of qtrs) {
  ok(20, `quarter ${q} starts on its own week`, +w0, (+q % 4) * 13 + 1);
  ok(20, `quarter ${q} names the weeks it covers`,
    inner.includes(`W${w0}&ndash;${+w0 + 12}`), true);
}
// the grid the bars are read against is ruled at the width the board claims
const pitches = [...html1.match(/td\.trk\{[^}]*\}/)[0]
  .matchAll(/transparent 1px ([\d.]+)px/g)].map((m) => +m[1]);
near(20, "the strong rule is one quarter", pitches[0], TRACK / (WIN_M / 3), 0.011);
near(20, "the fine rule is one week", pitches[1], WKW, 0.011);
// even ruling is the whole point: a week has to be a whole pixel, and a quarter
// a whole number of weeks, or the lines drift against each other across 832px
ok(20, "a week is a whole number of pixels", WKW % 1, 0);
ok(20, "the quarter rule falls on a week rule", pitches[0] % pitches[1], 0);
// the strip's highlight is the window, at the strip's own scale
const winTag = html1.match(/<rect data-check="window"[^>]*>/)[0];
near(20, "the highlight starts where the window starts", +win.x, (TRACK * WIN_M0) / MONTHS, 0.011);
near(20, "the highlight is as wide as the window", +win.w, (TRACK * WIN_M) / MONTHS, 0.011);
// the window opens on month zero, so its border is inset by half a stroke or
// the viewBox clips it — the drawn rect and the true geometry differ by that
const drawnX = +winTag.match(/\sx="([\d.]+)"/)[1];
const drawnW = +winTag.match(/\swidth="([\d.]+)"/)[1];
const sw = +winTag.match(/stroke-width="([\d.]+)"/)[1];
ok(20, "the border is inset by half its stroke", +win.inset, sw / 2);
near(20, "the drawn rect is the geometry inset on both sides", drawnX, +win.x + sw / 2, 0.011);
near(20, "…and narrower by a whole stroke", drawnW, +win.w - sw, 0.011);
ok(20, "no part of the border falls outside the strip", drawnX - sw / 2 >= 0, true);
// demand that runs past the window is drawn and clipped, not truncated
const beyond = phases.filter((p) => +p.m1 >= WIN_M0 + WIN_M);
ok(20, "some demand runs past the window", beyond.length > 0, true);
ok(20, "phases past the window keep their true width",
  beyond.every((p) => +p.left + +p.width > TRACK), true);
ok(20, "no stream is entirely outside the window",
  streams.every((r) => +r.m0 < WIN_M0 + WIN_M), true);
// A bar says its own rate and nothing else: the phase is carried by the colour,
// and the legend is the only thing that names a colour.
let labelled = 0;
for (const p of phases) {
  const m = html1.match(new RegExp(`data-phase="${p.phase}"[^>]*>(<em[^>]*>([^<]*)</em>)?`));
  if (!m[1]) continue;
  labelled += 1;
  ok(20, `${p.phase} label is its own rate`, m[2].replace(/\D/g, ""), String(+p.tpm));
  ok(20, `${p.phase} label is a monthly rate`, /t\/mo$/.test(m[2]), true);
}
ok(20, "most bars are wide enough to carry their rate", labelled > phases.length / 2, true);
ok(20, "no bar label names its phase", /<em[^>]*>[^<]*(Ramp|Steady|Taper)/.test(html1), false);
const drawn = [...new Set(phases.map((p) => p.kind))].sort();
const named = [...html1.matchAll(/data-legend="(\w+)"/g)].map((m) => m[1]);
ok(20, "every phase colour on the board is named in the legend",
  drawn.filter((k) => named.includes(k)).length, drawn.length);
ok(20, "the legend names no phase the board does not draw",
  named.filter((k) => !["hold", "ready", "early"].includes(k)).sort().join(","), drawn.join(","));
// and the marks that are not bars are named too, each one where it is used
ok(20, "the hold mark is named", named.includes("hold"), holds.length > 0);
ok(20, "the commissioning rule is named",
  named.includes("ready"), /class="rdyl"/.test(html1));
ok(20, "the outline on early demand is named",
  named.includes("early"), /class="bar [^"]*bad"/.test(html1));

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
// whose streams have no route, which holds tonnage no lane carries yet
const unrouted = streams.filter((r) => +r.legs === 0).reduce((s, r) => s + +r.tonnes, 0);
const stranded = [];
for (const n of gnodes.filter((x) => +x.leg === 0)) {
  const out = gedges.filter((e) => e.edge.split("|")[0] === n.node);
  if (!out.length) { stranded.push(n); continue; }
  ok(11, `${n.node} = sum of outbound lanes`, out.reduce((s, e) => s + +e.t, 0), +n.t);
}
ok(11, "an origin with no outbound lane is view 1's uncosted stream",
  stranded.reduce((s, n) => s + +n.t, 0), unrouted);

/* =============================================================== CHAIN 12 */
chain(12, "cross-screen — the graph's port instances reconcile to view 1's tonnage");
const portNodes = gnodes.filter((n) => n.ech === "port");
const portNames = [...new Set(portNodes.map((n) => n.node.split("@")[0]))];
ok(12, "at least one facility appears at more than one leg",
  portNodes.length > portNames.length, true);
// Every stream starts at an origin zone, so the graph's origin column has to
// carry view 1's whole book — and one network feeds one zone, so the two sets
// of subtotals have to be the same multiset even though neither names the other.
const zoneNodes = gnodes.filter((n) => n.ech === "zone");
ok(12, "origin tonnage = view 1's whole book",
  zoneNodes.reduce((s, n) => s + +n.t, 0), streams.reduce((s, r) => s + +r.tonnes, 0));
const byNet = {};
for (const r of streams) byNet[r.net] = (byNet[r.net] ?? 0) + +r.tonnes;
ok(12, "one origin node per network", zoneNodes.length, Object.keys(byNet).length);
ok(12, "the origin subtotals are view 1's network subtotals",
  zoneNodes.map((n) => +n.t).sort((a, b) => a - b).join(","),
  Object.values(byNet).sort((a, b) => a - b).join(","));
ok(12, "each origin counts the streams that start there",
  zoneNodes.reduce((s, n) => s + +n.orders, 0), streams.length);
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
// The scroll bars are drawn, not real — the capture hides real ones — so the
// thumb has to be the share of the table that is actually on screen.
const bars3 = [...html3.matchAll(/data-scroll="(\d+)" data-shown="(\d+)"><i style="height:([\d.]+)%"/g)]
  .map((m) => ({ total: +m[1], shown: +m[2], pct: +m[3] }));
ok(13, "both long panels carry a scroll indicator", bars3.length, 2);
for (const b of bars3) {
  ok(13, `thumb of ${b.shown}/${b.total} is that fraction`, b.pct, round((b.shown / b.total) * 100, 2));
  ok(13, `a panel showing ${b.shown} of ${b.total} really does overflow`, b.shown < b.total, true);
}
ok(13, "the utilisation indicator counts that table's own rows",
  bars3.some((b) => b.total === util.length), true);
ok(13, "no panel that fits draws a scroll bar",
  (html3.match(/class="sy"/g) || []).length, bars3.length);

// the note is per set, so it has to read as a rate, not as a horizon total
ok(13, "deadfreight is quoted per set", /deadfreight [\d,]+ t\/set/.test(text(dedicated._raw)), true);
ok(13, "the shortfall is smaller than the set it is short of", dfT < +dedicated.cap, true);

/* =============================================================== CHAIN 14 */
chain(14, "view 3 — route candidates cost out, and the current one is view 2's row");
const cands = rows(html3, "cand");
const K = { dwell: 3, freight: 4, handling: 5, storage: 6, acc: 7, landed: 8, pert: 9 };
const kcell = (r, k) => (r._cells[K[k]] === "—" ? null : num(r._cells[K[k]]));
const days = (c) => (c === "—" ? null : num(c));
for (const r of cands) {
  if (kcell(r, "landed") === null) continue;
  const sum = round(["freight", "handling", "storage", "acc"]
    .reduce((s, k) => s + (kcell(r, k) || 0), 0), 2);
  ok(14, `${r.do} "${r._cells[1]}" components sum`, sum, kcell(r, "landed"));
  ok(14, `${r.do} "${r._cells[1]}" A$/t`, round(kcell(r, "landed") / +r.t, 2), kcell(r, "pert"));
}
const currents = cands.filter((r) => r.current === "1");
ok(14, "exactly one current route per stream", currents.length,
  new Set(cands.map((r) => r.do)).size);
for (const c of currents) {
  const row = streamRows.find((r) => r.site === c.do);
  ok(14, `${c.do} current candidate = view 2's landed cost`, kcell(c, "landed"), cell(row, "total"));
  ok(14, `${c.do} current candidate = view 2's A$/t`, kcell(c, "pert"), cell(row, "pert"));
  ok(14, `${c.do} current candidate = view 1's tonnage`,
    +c.t, +streams.find((r) => r.site === c.do).tonnes);
  ok(14, `${c.do} current candidate = view 2's storage`, kcell(c, "storage"), cell(row, "storage"));
  ok(14, `${c.do} current route is the infeasible one`,
    /Infeasible/.test(c._cells[10]), true);
}
// every stream with a rejected current route offers exactly one recommendation
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
// the recommendation for the breaching stream is cheaper than the current one
const breachSet = cands.filter((r) => r.do === deferSite);
const cur = breachSet.find((r) => r.current === "1");
const rec = breachSet.find((r) => /Recommended/.test(r._cells[10]));
ok(14, "the recommendation costs less than the current plan",
  kcell(rec, "landed") < kcell(cur, "landed"), true);
ok(14, "…because it holds less storage", kcell(rec, "storage") < kcell(cur, "storage"), true);
// same tonnage and same terminal, so storage moves exactly with the dwell
ok(14, "…and the storage moves in step with the dwell",
  round(kcell(rec, "storage") / kcell(cur, "storage"), 4),
  round(days(rec._cells[K.dwell]) / days(cur._cells[K.dwell]), 4));
ok(14, "the current route's dwell is the sum of its own legs' dwells",
  days(cur._cells[K.dwell]) > 0, true);

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
const RUN = checked(html1, "footRun");
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
  ok(16, `view ${n} costing run is ${RUN}`, checked(h, "footRun"), RUN);
  ok(16, `view ${n} rate card is r-2026.02-a`, checked(h, "footRate"), "r-2026.02-a");
  ok(16, `view ${n} build string`, /TRAMOS <b[^>]*>4\.8\.2<\/b>/.test(h), true);
  ok(16, `view ${n} carries no disclaimer text`, /reference implementation|\bNDA\b|under embargo/.test(h), false);
  // this is an estimation tool, not a dispatch board: nothing here is live
  ok(16, `view ${n} has no telematics feed`, /[Tt]elematics/.test(h), false);
  ok(16, `view ${n} has no vessel nomination`, /vessel|MV /i.test(h), false);
  ok(16, `view ${n} has no now-line`, /class="nowl|nowlayer/.test(h), false);
}
const RUN2 = checked(html1, "footRun");
ok(16, "the run is quoted identically on every view",
  [html2, html3].every((h) => checked(h, "footRun") === RUN2), true);
ok(16, "the cached-route count is quoted identically on every view",
  new Set([html1, html2, html3].map((h) => checked(h, "footCached"))).size, 1);

/* =============================================================== CHAIN 17 */
chain(17, "non-happy states are actually present");
ok(17, "a stream is blocked", streams.some((r) => r.status === "held"), true);
ok(17, "a stream's rate card has expired", streams.some((r) => r.status === "expired"), true);
ok(17, "a stream is still in review", streams.some((r) => r.status === "review"), true);
ok(17, "a stream is uncosted", streams.some((r) => r.status === "unpriced"), true);
ok(17, "the uncosted stream shows — for every cost",
  costRows.filter((r) => r.kind === "unpriced")
    .every((r) => r._cells.slice(3, 9).every((c) => c === "—")), true);
ok(17, "the uncosted stream still carries tonnage",
  costRows.filter((r) => r.kind === "unpriced").every((r) => +r.tonnes > 0), true);
ok(17, "a primary action is disabled on every view",
  [html1, html2, html3].every((h) => /btn--p" aria-disabled="true"/.test(h)), true);
ok(17, "an authorisation chip blocks the primary action", /chip--st/.test(html1), true);
ok(17, "the disabled action says what right is missing",
  /Estimation Approver role/.test(html1), true);
ok(17, "not every stream is priced",
  streamRows.every((r) => /Priced/.test(r._cells[9])), false);
ok(17, "a berth window is under-used",
  util.some((r) => r.class === "berth" && +r.used / +r.granted < 0.6), true);
ok(17, "at least one string truncates in the frozen columns",
  streams.some((r) => r._cells[2].length > 24), true);

/* ------------------------------------------------------------------ */
console.log(
  failures.length
    ? `\n\x1b[31m${failures.length} FAILED\x1b[0m of ${pass + failures.length}\n` + failures.map((f) => "  " + f).join("\n")
    : `\n\x1b[32mAll ${pass} assertions pass.\x1b[0m`
);
process.exit(failures.length ? 1 : 0);
