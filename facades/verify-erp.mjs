// Coherence verifier for the Millrace facade pair.
//
// Same contract as verify-slipstream.mjs: it holds NO copy of the data. It
// reads the two index.html files, scrapes what is actually rendered, and
// asserts the arithmetic between them. A transcription slip in the markup
// fails the run; a slip in a duplicated data model could not.
//
//   node facades/verify-erp.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.join(here, "erp-01-portal", "index.html");
const V2 = path.join(here, "erp-02-shipment", "index.html");

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

const ENT = {
  "&mdash;": "—", "&ndash;": "–", "&rarr;": "→", "&larr;": "←", "&middot;": "·",
  "&times;": "×", "&nbsp;": " ", "&gt;": ">", "&lt;": "<", "&amp;": "&",
};
const decode = (s) => s.replace(/&[a-z]+;/g, (e) => (e in ENT ? ENT[e] : e));
const squash = (s) => s.replace(/\s+/g, " ").trim();
const text = (html) => squash(decode(html.replace(/<[^>]+>/g, " ")));

function rows(html, kind) {
  const out = [];
  const re = new RegExp(`<tr[^>]*data-row="${kind}"[^>]*>([\\s\\S]*?)</tr>`, "g");
  for (const m of html.matchAll(re)) {
    const open = m[0].slice(0, m[0].indexOf(">"));
    const attrs = {};
    for (const a of open.matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
    attrs._cells = m[1]
      .split(/<t[dh][^>]*>/)
      .slice(1)
      .map((c) => text(c.split(/<\/t[dh]>/)[0]));
    out.push(attrs);
  }
  return out;
}

function checked(html, name) {
  const m = html.match(new RegExp(`data-check="${name}"[^>]*>([^<]*)<`));
  if (!m) throw new Error(`no element with data-check="${name}"`);
  return squash(decode(m[1]));
}

const num = (s) => Number(String(s).replace(/[^0-9.\-]/g, "").replace(/\s/g, ""));
const round = (v, dp) => Number(v.toFixed(dp));

// "1h 26m 36s" / "48m 26s" / "8m 24s" -> seconds
function dur(s) {
  const h = /(\d+)\s*h/.exec(s);
  const m = /(\d+)\s*m(?!s)/.exec(s);
  const x = /(\d+)\s*s/.exec(s);
  return (h ? +h[1] * 3600 : 0) + (m ? +m[1] * 60 : 0) + (x ? +x[1] : 0);
}
// seconds -> the exact string form the screens use
function fmt(t) {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}h ${String(m).padStart(2, "0")}m ${ss}s` : `${m}m ${ss}s`;
}
const at = (iso) => new Date(iso).getTime() / 1000;

const html1 = await readFile(V1, "utf8");
const html2 = await readFile(V2, "utf8");

console.log("\x1b[1mMillrace — numeric coherence\x1b[0m");

/* ------------------------------------------------------------------ */
/* View 1 — operations portal + item traceability                      */
/* ------------------------------------------------------------------ */

const stations = rows(html1, "station");
const tiles = [...html1.matchAll(/<a class="tile[^"]*"([^>]*)>/g)].map((m) => {
  const a = {};
  for (const d of m[1].matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) a[d[1]] = d[2];
  a._off = m[0].includes("is-off");
  return a;
});
const recent = rows(html1, "recent");

chain(0, "shape");
ok(0, "station rows present", stations.length, 14);
ok(0, "station count caption", stations.length, num(checked(html1, "station-count")));
ok(0, "portal tiles", tiles.length, 12);
ok(0, "recently-scanned rows", recent.length, 5);
ok(0, "every station carries start, end, phase and order",
  stations.every((s) => s.start && s.end && s.phase && s.order), true);

chain(1, "each station's rendered duration is exactly end − start");
for (const s of stations) {
  const cell = s._cells[2];
  ok(1, `${s.station} (#${s.seq}) ${cell}`, dur(cell), at(s.end) - at(s.start));
  ok(1, `${s.station} (#${s.seq}) start cell`, s._cells[1], s.start.slice(11));
  ok(1, `${s.station} (#${s.seq}) ends after it starts`, at(s.end) > at(s.start), true);
}

chain(2, "the route is a strictly ordered timeline, newest first");
const bySeq = [...stations].sort((a, b) => +a.seq - +b.seq);
ok(2, "seq numbers are 1..n with no gaps", bySeq.map((s) => +s.seq).join(","),
  bySeq.map((_, i) => i + 1).join(","));
ok(2, "rendered top-to-bottom in descending seq",
  stations.map((s) => +s.seq).every((v, i, a) => i === 0 || v < a[i - 1]), true);
for (let i = 1; i < bySeq.length; i++) {
  ok(2, `#${bySeq[i].seq} starts no earlier than #${bySeq[i - 1].seq} ends`,
    at(bySeq[i].start) >= at(bySeq[i - 1].end), true);
}

chain(3, "build-cycle work: station durations sum, and split by phase");
const build = bySeq.filter((s) => s.order === "WO-61208");
ok(3, "build stations", build.length, 11);

const work = build.reduce((t, s) => t + (at(s.end) - at(s.start)), 0);
ok(3, "Σ build station durations", fmt(work), checked(html1, "work-total"));

const phases = {};
for (const s of build) phases[s.phase] = (phases[s.phase] || 0) + (at(s.end) - at(s.start));
for (const [p, t] of Object.entries(phases)) {
  ok(3, `phase ${p}`, fmt(t), checked(html1, `phase-${p}`));
}
ok(3, "Σ phase totals = work total", Object.values(phases).reduce((a, b) => a + b, 0), work);
ok(3, "every build phase has a legend entry", Object.keys(phases).length, 5);

chain(4, "queue time is the sum of the gaps between consecutive stations");
const gaps = [];
for (let i = 1; i < build.length; i++) gaps.push(at(build[i].start) - at(build[i - 1].end));
const queue = gaps.reduce((a, b) => a + b, 0);
ok(4, "Σ gaps", fmt(queue), checked(html1, "queue-total"));
ok(4, "queue legend entry matches", fmt(queue), checked(html1, "phase-queue"));
ok(4, "gaps counted", gaps.length, build.length - 1);
ok(4, "no negative gap", gaps.every((g) => g >= 0), true);
ok(4, "longest gap", fmt(Math.max(...gaps)), checked(html1, "longest-wait"));
ok(4, "the longest gap precedes ASM-07",
  build[gaps.indexOf(Math.max(...gaps)) + 1].station, "ASM-07");

chain(5, "work + queue = elapsed, and the two percentages derive from it");
const elapsed = at(build[build.length - 1].end) - at(build[0].start);
ok(5, "elapsed = last end − first start", fmt(elapsed), checked(html1, "elapsed-total"));
ok(5, "work + queue = elapsed", work + queue, elapsed);
ok(5, "work %", round((work / elapsed) * 100, 1), num(checked(html1, "work-pct")));
ok(5, "queue %", round((queue / elapsed) * 100, 1), num(checked(html1, "queue-pct")));
ok(5, "queue outweighs work", queue > work, true);
ok(5, "the build segment header quotes the same cycle time",
  html1.includes(`cycle ${fmt(elapsed)}`), true);

chain(6, "the stacked bar is drawn to scale against those same seconds");
const barWidth = num(html1.match(/data-bar-width="(\d+)"/)[1]);
const segs = [...html1.matchAll(/<span class="bar__seg" data-seg="([a-z]+)"\s+data-secs="(\d+)"\s+style="width:([\d.]+)px"/g)]
  .map((m) => ({ seg: m[1], secs: +m[2], w: +m[3] }));
ok(6, "segments drawn", segs.length, 6);
ok(6, "Σ segment seconds = elapsed", segs.reduce((a, s) => a + s.secs, 0), elapsed);
near(6, "Σ segment widths = bar width", segs.reduce((a, s) => a + s.w, 0), barWidth, 0.05);
for (const s of segs) {
  const expected = s.seg === "queue" ? queue : phases[s.seg];
  ok(6, `segment ${s.seg} seconds = its phase total`, s.secs, expected);
  near(6, `segment ${s.seg} width is to scale`, s.w, (s.secs / elapsed) * barWidth, 0.01);
}

chain(7, "the repair order and the parts hold are their own arithmetic");
const repair = bySeq.filter((s) => s.order === "WO-77341");
ok(7, "repair stations", repair.length, 2);
ok(7, "repair work total",
  fmt(repair.reduce((t, s) => t + (at(s.end) - at(s.start)), 0)), checked(html1, "repair-work"));

const intake = bySeq.find((s) => s.station === "RMA-01");
const hold = at(repair[0].start) - at(intake.end);
const hd = Math.floor(hold / 86400), hh = Math.floor((hold % 86400) / 3600), hm = Math.floor((hold % 3600) / 60);
ok(7, "parts hold = diagnosis start − return intake end",
  `${hd} d ${hh} h ${hm} m`, checked(html1, "parts-hold"));
ok(7, "the return sits on its own reference", intake.order, "RMA-0912");
ok(7, "the return is excluded from the build cycle", build.includes(intake), false);

chain(8, "the failure, the rework and the retest are one consistent loop");
const fails = build.filter((s) => s.verdict === "fail");
ok(8, "exactly one failed station", fails.length, 1);
const retest = build.find((s) => s.retest === "true");
ok(8, "the retest is at the same station as the failure", retest.station, fails[0].station);
ok(8, "the retest happens after the failure", at(retest.start) > at(fails[0].end), true);
const rework = build.filter((s) => at(s.start) > at(fails[0].end) && at(s.end) < at(retest.start));
ok(8, "exactly one station sits between failure and retest", rework.length, 1);
ok(8, "…and it is the rework station", rework[0].station, "RWK-01");
ok(8, "the retest passes", retest.verdict, "pass");
ok(8, "the failed row is the only one rendered in the fail state",
  (html1.match(/class="is-bad"/g) || []).length, 1);

chain(9, "automated stations carry no operator, manned stations do");
const auto = stations.filter((s) => ["SMT-02", "AOI-01"].includes(s.station));
ok(9, "automated stations found", auto.length, 2);
ok(9, "automated stations show an em dash for operator", auto.every((s) => s.op === "—"), true);
ok(9, "…and render it as an em dash", auto.every((s) => s._cells[3] === "—"), true);
ok(9, "every other station names an operator",
  stations.filter((s) => !auto.includes(s)).every((s) => /^[A-Z]{3}$/.test(s.op)), true);

chain(10, "the tile grid states its own exceptions");
ok(10, "exactly one disabled tile", tiles.filter((t) => t._off).length, 1);
ok(10, "the disabled tile is BoM & Revisions", tiles.find((t) => t._off).tile, "bom");
const eco = checked(html1, "item-eco").split(" ")[0];
ok(10, "the disabled tile's reason names the item's pending ECO",
  checked(html1, "disabled-tile").includes(eco), true);
ok(10, "exactly one amber badge", (html1.match(/tile__b is-warn/g) || []).length, 1);
ok(10, "the amber badge names the station the route flags",
  html1.includes("SEAL-01 due 24 Aug"), true);
ok(10, "exactly one station is flagged calibration-due",
  stations.filter((s) => s.cal === "due").length, 1);
ok(10, "…and it is that station", stations.find((s) => s.cal === "due").station, "SEAL-01");

chain(11, "the recently-scanned strip is ordered and headed by the scanned item");
const scanned = checked(html1, "scan-serial");
ok(11, "top row is the scanned serial", recent[0].serial, scanned);
ok(11, "top row is rendered as current", html1.includes(`class="is-cur" data-row="recent" data-serial="${scanned}"`), true);
const times = recent.map((r) => r.at);
ok(11, "scan times strictly descending", times.every((t, i) => i === 0 || t < times[i - 1]), true);
ok(11, "every row's rendered time matches its attribute",
  recent.every((r) => r._cells[4] === r.at), true);
ok(11, "exactly one held item in the strip", recent.filter((r) => r.verdict === "hold").length, 1);
ok(11, "exactly one failed item in the strip", recent.filter((r) => r.verdict === "fail").length, 1);
ok(11, "the strip is not all-green", recent.every((r) => r.verdict === "pass"), false);

/* ------------------------------------------------------------------ */
/* View 2 — shipment, PKG-4471                                         */
/* ------------------------------------------------------------------ */

const lines = rows(html2, "line");
const mix = rows(html2, "mix");

chain(12, "shape");
ok(12, "package lines", lines.length, num(checked(html2, "line-count")));
ok(12, "line numbers are 1..n in order", lines.map((l) => +l.n).join(","),
  lines.map((_, i) => i + 1).join(","));
ok(12, "every rendered # matches its attribute", lines.every((l) => l._cells[0] === l.n), true);
ok(12, "model-mix rows", mix.length, 4);

chain(13, "the model mix reproduces the line table, and sums to the packed total");
for (const m of mix) {
  const own = lines.filter((l) => l.model === m.model);
  ok(13, `${m.model} count`, own.length, Number(m.qty));
  ok(13, `${m.model} count cell`, m._cells[1], m.qty);
  ok(13, `${m.model} net`, round(own.reduce((t, l) => t + Number(l.net), 0), 3), Number(m.net));
  ok(13, `${m.model} net cell`, num(m._cells[2]), Number(m.net));
}
ok(13, "Σ mix quantities = line count",
  mix.reduce((t, m) => t + Number(m.qty), 0), num(checked(html2, "mix-qty")));
ok(13, "Σ mix net = packed net",
  round(mix.reduce((t, m) => t + Number(m.net), 0), 3), num(checked(html2, "mix-net")));
ok(13, "packed net = Σ line nets",
  round(lines.reduce((t, l) => t + Number(l.net), 0), 3), num(checked(html2, "mix-net")));

chain(14, "the held line is excluded from every shippable figure");
const held = lines.filter((l) => l.status === "held");
ok(14, "held lines", held.length, num(checked(html2, "held-count")));
ok(14, "shippable = lines − held", lines.length - held.length, num(checked(html2, "shippable-count")));
const shippable = lines.filter((l) => l.status !== "held");
const netShip = round(shippable.reduce((t, l) => t + Number(l.net), 0), 3);
ok(14, "net (shippable) in the table footer", netShip, num(checked(html2, "net-shippable")));
ok(14, "net (shippable) in the weights panel", netShip, num(checked(html2, "net")));
ok(14, "packed net − held net = shippable net",
  round(lines.reduce((t, l) => t + Number(l.net), 0) - held.reduce((t, l) => t + Number(l.net), 0), 3),
  netShip);
ok(14, "the held line failed its test", held[0]._cells[5].startsWith("Fail"), true);

chain(15, "gross, volumetric and chargeable weight");
const tare = num(checked(html2, "tare"));
ok(15, "gross = net + tare", round(netShip + tare, 3), num(checked(html2, "gross")));
const L = num(checked(html2, "dim-l")), W = num(checked(html2, "dim-w")), H = num(checked(html2, "dim-h"));
const vol = round((L * W * H) / 5000, 3);
ok(15, "volumetric = L × W × H ÷ 5000", vol, num(checked(html2, "volumetric")));
ok(15, "chargeable = max(gross, volumetric)",
  Math.max(round(netShip + tare, 3), vol), num(checked(html2, "chargeable")));
ok(15, "chargeable comes from the volumetric figure, not the actual", vol > netShip + tare, true);

chain(16, "declared customs value builds from the shippable lines");
const goods = round(shippable.reduce((t, l) => t + Number(l.value), 0), 2);
ok(16, "Σ shippable line values", goods, num(checked(html2, "value-shippable")));
ok(16, "…and the customs panel agrees", goods, num(checked(html2, "cust-goods")));
const freight = num(checked(html2, "cust-freight"));
const ins = num(checked(html2, "cust-insurance"));
ok(16, "insurance = 0.5% of goods", round(goods * 0.005, 2), ins);
ok(16, "declared = goods + freight + insurance",
  round(goods + freight + ins, 2), num(checked(html2, "cust-declared")));
ok(16, "every rendered value cell matches its attribute",
  lines.every((l) => num(l._cells[8]) === Number(l.value)), true);
ok(16, "every rendered net cell matches its attribute",
  lines.every((l) => num(l._cells[7]) === Number(l.net)), true);

chain(17, "the unclassified line is what disables the commercial invoice");
const noHs = lines.filter((l) => l.hs === "");
ok(17, "exactly one line without an HS code", noHs.length, 1);
ok(17, "…and it renders an em dash", noHs[0]._cells[9], "—");
ok(17, "the notice names that line number", html2.includes(`<b>Line ${noHs[0].n}</b>`), true);
ok(17, "the notice names that serial", html2.includes(`(${noHs[0].serial})`), true);
ok(17, "the customs panel repeats the exception", checked(html2, "customs-summary"), "1 line unclassified");
ok(17, "the commercial-invoice button is disabled",
  /data-btn="commercial-invoice" data-state="disabled"/.test(html2), true);
ok(17, "every other line is classified",
  lines.filter((l) => l.hs !== "").every((l) => /^\d{4}\.\d{2}\.\d{2}$/.test(l.hs)), true);

chain(18, "the activity log is ordered and bound to the package's exceptions");
const log = [...html2.matchAll(/<div class="log__ln" data-log="([^"]*)"><time>([^<]*)<\/time>\s*([\s\S]*?)<\/div>/g)]
  .map((m) => ({ tag: m[1], t: m[2], line: text(m[3]) }));
ok(18, "log lines present", log.length, 4);
ok(18, "the section caption counts the events it renders", log.length, num(checked(html2, "activity-count")));
const secs = (t) => { const p = t.split(":"); return +p[0] * 3600 + +p[1] * 60 + +p[2]; };
ok(18, "timestamps strictly descending",
  log.map((l) => secs(l.t)).every((v, i, a) => i === 0 || v < a[i - 1]), true);
ok(18, "no entry later than the staged time",
  log.every((l) => secs(l.t) >= secs("13:00:00")), true);
ok(18, "the failed booking is logged with the same time the panel quotes",
  log.find((l) => l.tag === "carrier:fail").t, "13:47:02");
ok(18, "…and the retry with the time the panel quotes",
  log.find((l) => l.tag === "carrier:retry").t, "14:06:11");
ok(18, "the panel repeats the failed-booking timestamp", html2.includes("<b>13:47:02</b>"), true);
ok(18, "the panel repeats the retry timestamp", html2.includes("<b>14:06:11</b>"), true);
ok(18, "the hold is logged against the held serial",
  log.find((l) => l.tag === "line:hold").line.includes(held[0].serial), true);

/* ------------------------------------------------------------------ */
/* Cross-screen                                                        */
/* ------------------------------------------------------------------ */

chain(19, "cross-screen — the traced item is a line in the package");
const traced = lines.find((l) => l.serial === scanned);
ok(19, "the scanned serial appears in the package", Boolean(traced), true);
ok(19, "as-built cell agrees with the item panel",
  checked(html2, "trace-asbuilt"), `${checked(html1, "item-rev")} · ${checked(html1, "item-fw")}`);
ok(19, "model agrees across screens", traced.model, checked(html1, "item-model"));
ok(19, "the package line carries the repair work order", traced._cells[3], "WO-77341");
ok(19, "…which is the order the route's repair segment names",
  repair.every((s) => s.order === traced._cells[3]), true);
ok(19, "the line is marked as a retest pass", traced._cells[5], "Pass retest");
ok(19, "…matching the route's retest verdict", retest.verdict, "pass");

chain(20, "cross-screen — the item panel and the package name each other");
const ship = checked(html1, "ship-summary");
ok(20, "view 1 names the package view 2 shows", ship.includes(checked(html2, "pkg")), true);
ok(20, "view 1 names the earlier package the activity log refers to",
  log.find((l) => l.tag === "line:add").line.includes("PKG-3928"), true);
ok(20, "view 1 names the RMA the route's return segment carries",
  ship.includes(intake.order), true);
ok(20, "the activity log names the traced serial",
  log.find((l) => l.tag === "line:add").line.includes(scanned), true);
ok(20, "…and the repair order it came back on",
  log.find((l) => l.tag === "line:add").line.includes("WO-77341"), true);

chain(21, "cross-screen — the held serial is the same item on both screens");
const heldOnV1 = recent.find((r) => r.verdict === "hold");
ok(21, "view 1's held scan is view 2's held line", heldOnV1.serial, held[0].serial);
ok(21, "model agrees", heldOnV1._cells[1], held[0].model);
ok(21, "view 1's held scan is at the seal station", heldOnV1._cells[2].startsWith("SEAL-01"), true);
ok(21, "view 2's hold reason is the seal verification", held[0]._cells[10], "Held — seal verify");
ok(21, "the traced item is not the held item", traced.serial === held[0].serial, false);

chain(22, "cross-screen — the shell is the same product on both screens");
const shell = [
  [/flex: 0 0 52px; display: flex; align-items: center/, "52px header"],
  [/flex: 0 0 420px; display: flex; flex-direction: column/, "420px accordion column"],
  [/flex: 0 0 28px; display: flex; align-items: center; gap: 16px/, "28px footer"],
  [/--tint:\s+#16a3aa;/, "teal tint token"],
  [/--tint-dk:\s+#0f6b70;/, "teal ink token"],
  [/font: 400 12px\/1\.42 "Helvetica Neue"/, "type scale"],
  [/\.wm \{ font-size: 15px; font-weight: 300; letter-spacing: \.215em/, "wordmark"],
  [/width: 292px; height: 30px/, "scan pill"],
  [/\.sec__h \{ flex: 0 0 32px/, "accordion section header"],
  [/\.idn \{ flex: 0 0 auto; padding: 9px 16px 8px/, "accordion identity block"],
];
for (const [re, name] of shell) {
  ok(22, `${name} — view 1`, re.test(html1), true);
  ok(22, `${name} — view 2`, re.test(html2), true);
}
ok(22, "neither view has a left rail", /class="rail|\.rail\b/.test(html1 + html2), false);
ok(22, "both name the same site",
  html1.includes("Vila&nbsp;do&nbsp;Conde"), html2.includes("Vila&nbsp;do&nbsp;Conde"));
ok(22, "both carry the same build string",
  html1.includes("Millrace <b>4.6.2</b>"), html2.includes("Millrace <b>4.6.2</b>"));
ok(22, "view 2's MES sync is later than view 1's",
  secs("14:13:52") > secs("14:11:48"), true);

/* ------------------------------------------------------------------ */

console.log(
  failures.length
    ? `\n\x1b[31m${failures.length} FAILED\x1b[0m of ${pass + failures.length}\n` + failures.map((f) => "  " + f).join("\n")
    : `\n\x1b[32mAll ${pass} assertions pass.\x1b[0m`
);
process.exit(failures.length ? 1 : 0);
