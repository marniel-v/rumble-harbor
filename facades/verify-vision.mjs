// Coherence verifier for the Verso facade set (work 5 — vision-detection).
//
// Same contract as verify-slipstream.mjs, verify-erp.mjs and verify-logistics.mjs:
// it holds NO copy of the data. It reads the two index.html files, scrapes what is
// actually rendered, and re-derives every product, sum, partition and cross-panel
// agreement from the markup. A transcription slip fails the run; a slip in a
// duplicated data model could not.
//
//   node facades/verify-vision.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.join(here, "verso-01-object-record", "index.html");
const V2 = path.join(here, "verso-02-review-queue", "index.html");

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
  "&amp;": "&", "&minus;": "−", "&deg;": "°", "&hellip;": "…", "&rsquo;": "’",
  "&#8203;": "", "&#9662;": "▾", "&#9652;": "▴", "&#8203;": "",
};
const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, (e) => (e in ENT ? ENT[e] : e));
const squash = (s) => s.replace(/\s+/g, " ").trim();
const text = (h) => squash(decode(h.replace(/<[^>]+>/g, " ")));

function attrs(open) {
  const a = {};
  for (const m of open.matchAll(/data-([a-z0-9-]+)="([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}

function rows(html, kind) {
  const out = [];
  const re = new RegExp(`<(tr|div|li|span|g|aside|section|figure)([^>]*\\bdata-row="${kind}"[^>]*)>([\\s\\S]*?)</\\1>`, "g");
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

function marks(html, key) {
  const out = [];
  const re = new RegExp(`<[a-z]+([^>]*\\bdata-${key}="[^"]*"[^>]*)/?>`, "g");
  for (const m of html.matchAll(re)) out.push(attrs(m[1]));
  return out;
}

function checked(html, name) {
  const m = html.match(new RegExp(`data-check="${name}"[^>]*>([\\s\\S]*?)</`));
  if (!m) throw new Error(`no element with data-check="${name}"`);
  return squash(decode(m[1].replace(/<[^>]+>/g, " ")));
}

const num = (s) => Number(String(s).replace(/[^0-9.\-]/g, ""));
const round = (v, d) => Number(v.toFixed(d));

const h1 = await readFile(V1, "utf8");
const h2 = await readFile(V2, "utf8");

/* thresholds are read off the markup, never assumed */
const ACCEPT = num(checked(h1, "accept-threshold"));
const DETMIN = num(checked(h1, "detector-min"));

/* ================================================================ CHAIN 1 */
chain(1, "view 1 — a field's confidence is the product of its per-character confidences");

const chars = rows(h1, "char");
const fields = rows(h1, "field");
const fieldByName = Object.fromEntries(fields.map((f) => [f.field, f]));
const charFields = [...new Set(chars.map((c) => c.for))];

ok(1, "two fields carry a character-level read-out", charFields.length, 2);
for (const fname of charFields) {
  const cs = chars.filter((c) => c.for === fname);
  const prod = cs.reduce((p, c) => p * num(c.conf), 1);
  const f = fieldByName[fname];
  if (!f) throw new Error(`character read-out for unknown field ${fname}`);
  ok(1, `${fname}: Π of ${cs.length} chars = field confidence`, round(prod, 3), num(f.conf));
  // the rendered glyph sequence must reconstruct the rendered field value
  ok(1, `${fname}: glyphs reconstruct the value`,
    cs.map((c) => c.ch).join(""), f.value);
  // every character's rendered value equals its own attribute
  for (const c of cs) ok(1, `${fname} '${c.ch}' label = attribute`, num(text(c._raw).split(" ").pop()), num(c.conf));
}

/* ================================================================ CHAIN 2 */
chain(2, "view 1 — the tint tier of every character follows the stated ramp");

const brkHi = num(checked(h1, "ramp-high"));
const brkLo = num(checked(h1, "ramp-low"));
ok(2, "ramp upper break is the auto-accept threshold", brkHi, ACCEPT);
for (const c of chars) {
  const v = num(c.conf);
  const want = v >= brkHi ? "hi" : v >= brkLo ? "mid" : "lo";
  ok(2, `'${c.ch}' ${v} → ${want}`, c.tier, want);
}
ok(2, "at least one character sits in the lowest tier",
  chars.some((c) => c.tier === "lo"), true);

/* ================================================================ CHAIN 3 */
chain(3, "view 1 — stage latencies sum to the rendered total");

const stages1 = rows(h1, "stage");
ok(3, "four pipeline stages", stages1.length, 4);
const sum1 = stages1.reduce((s, x) => s + num(x.ms), 0);
ok(3, "Σ stage ms = rendered total", round(sum1, 1), num(checked(h1, "total-ms")));
for (const s of stages1) {
  ok(3, `${s.stage} prints its own ms`, num(text(s._raw).match(/([\d.]+)\s*ms/)[1]), num(s.ms));
  ok(3, `${s.stage} names a model build`, /\d+\.\d+\.\d+/.test(s.model), true);
}
ok(3, "every stage model id is distinct",
  new Set(stages1.map((s) => s.model)).size, 4);

/* ================================================================ CHAIN 4 */
chain(4, "view 1 — every oriented box polygon is its own centre, size and angle");

const obbs = marks(h1, "obb");
const dets = rows(h1, "detection");
ok(4, "one polygon per detection row", obbs.length, dets.length);

const polys = [...h1.matchAll(/<polygon([^>]*\bdata-obb="[^"]*"[^>]*)>/g)].map((m) => {
  const a = attrs(m[1]);
  a._points = /points="([^"]*)"/.exec(m[1])[1].trim().split(/\s+/).map((p) => p.split(",").map(Number));
  return a;
});
for (const p of polys) {
  const cx = num(p.cx), cy = num(p.cy), w = num(p.w), h = num(p.h), th = num(p.theta) * Math.PI / 180;
  const co = Math.cos(th), si = Math.sin(th);
  const want = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    .map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]);
  ok(4, `${p.obb}: 4 vertices`, p._points.length, 4);
  for (let i = 0; i < 4; i++) {
    near(4, `${p.obb} v${i} x`, p._points[i][0], want[i][0], 0.01);
    near(4, `${p.obb} v${i} y`, p._points[i][1], want[i][1], 0.01);
  }
  const d = dets.find((x) => x.det === p.obb);
  ok(4, `${p.obb} angle matches its detection row`, num(p.theta), num(d.theta));
}
ok(4, "not every box is axis-aligned",
  polys.filter((p) => Math.abs(num(p.theta)) > 1).length >= 2, true);

/* ================================================================ CHAIN 5 */
chain(5, "view 1 — detections obey the detector minimum and the colour tiers");

for (const d of dets) {
  const s = num(d.score);
  ok(5, `${d.det} clears the detector minimum`, s >= DETMIN, true);
  const want = s >= ACCEPT ? "hi" : s >= DETMIN ? "mid" : "lo";
  ok(5, `${d.det} tier ${s}`, d.tier, want);
  ok(5, `${d.det} prints its own score`, num(text(d._raw).match(/0\.\d{3}/)[0]), s);
}
ok(5, "detection count matches the rendered header", dets.length, num(checked(h1, "detection-count")));
ok(5, "exactly one detection is above auto-accept",
  dets.filter((d) => num(d.score) >= ACCEPT).length, 1);
ok(5, "the detections carry distinct classes",
  new Set(dets.map((d) => d.cls)).size, dets.length);
ok(5, "exactly one detection is a museum label",
  dets.filter((d) => d.cls === "label").length, 1);
ok(5, "text found on the object itself scores below auto-accept",
  dets.filter((d) => d.cls !== "label").every((d) => num(d.score) < ACCEPT), true);
const cropImgs = rows(h1, "crop");
ok(5, "one rectified crop per detection", cropImgs.length, dets.length);
for (const c of cropImgs) {
  ok(5, `${c.det} crop cites a real detection`, dets.some((d) => d.det === c.det), true);
  ok(5, `${c.det} crop carries embedded image data`, /src="data:image\/[a-z]+;base64,/.test(c._raw), true);
}
ok(5, "the crops are cut from different parts of the plate",
  new Set(cropImgs.map((c) => /src="([^"]+)"/.exec(c._raw)[1])).size, cropImgs.length);

/* ================================================================ CHAIN 6 */
chain(6, "view 1 — confidence bars are drawn to their own values");

const bars = marks(h1, "bar");
ok(6, "one bar per scored field", bars.length, fields.filter((f) => f.conf !== "—").length);
for (const b of bars) {
  const f = fieldByName[b.bar];
  near(6, `${b.bar} bar width = conf × track`, num(b.w), num(b.conf) * num(b.track), 0.01);
  ok(6, `${b.bar} bar value = field value`, num(b.conf), num(f.conf));
}

/* ================================================================ CHAIN 7 */
chain(7, "view 1 — the routing rule names exactly the fields that are actually in breach");

const below = fields.filter((f) => f.conf !== "—" && num(f.conf) < ACCEPT);
ok(7, "exactly one field is below the auto-accept threshold", below.length, 1);
ok(7, "the rule's threshold arm names that field", checked(h1, "rule-below-field"), below[0].field);
ok(7, "that field is flagged in the list", below[0].state, "below");
ok(7, "no field is left in an unrecognised state",
  fields.every((f) => ["ok", "below", "none"].includes(f.state)), true);

const cands = rows(h1, "candidate");
ok(7, "the parser renders two candidate values", cands.length, 2);
ok(7, "candidate values differ", cands[0].value === cands[1].value, false);
ok(7, "the accepted candidate is the record's accession", cands[0].value, checked(h1, "accession"));
ok(7, "the rejected candidate is text lifted out of the breached field",
  below[0].value.includes(cands[1].value) && cands[1].value !== below[0].value, true);
ok(7, "the rejected candidate carries the breached field's confidence",
  num(cands[1].conf), num(below[0].conf));
ok(7, "each candidate is sourced from a distinct detection",
  new Set(cands.map((c) => c.src)).size, 2);
for (const c of cands) {
  ok(7, `candidate ${c.value} cites a real detection`, dets.some((d) => d.det === c.src), true);
}
ok(7, "the record is in review, not accepted", checked(h1, "record-state"), "IN REVIEW");
ok(7, "min field confidence = the breached field",
  Math.min(...fields.filter((f) => f.conf !== "—").map((f) => num(f.conf))), num(below[0].conf));

/* ================================================================ CHAIN 8 */
chain(8, "view 1 — the filmstrip is a real slice of the run");

const thumbs = rows(h1, "thumb");
ok(8, "twelve captures in the strip", thumbs.length, 12);
ok(8, "exactly one is the current capture", thumbs.filter((t) => t.current === "1").length, 1);
ok(8, "the current thumb is the record on screen",
  thumbs.find((t) => t.current === "1").capture, checked(h1, "capture-id"));
const VOCAB = new Set(["accepted", "review", "rejected"]);
for (const t of thumbs) ok(8, `${t.capture} state in vocabulary`, VOCAB.has(t.state), true);
ok(8, "the strip is not all-green", thumbs.every((t) => t.state === "accepted"), false);
ok(8, "the strip contains a rejected capture",
  thumbs.filter((t) => t.state === "rejected").length >= 1, true);
ok(8, "capture ids are unique", new Set(thumbs.map((t) => t.capture)).size, 12);
const imgSrc = (r) => (/src="([^"]+)"/.exec(r._raw) || [, ""])[1];
ok(8, "every frame carries embedded image data",
  thumbs.every((t) => imgSrc(t).startsWith("data:image/")), true);
ok(8, "no two frames are the same photograph",
  new Set(thumbs.map(imgSrc)).size, thumbs.length);
const strip = checked(h1, "strip-position").match(/([\d,]+)\s*of\s*([\d,]+)/);
ok(8, "the strip position is inside the run", num(strip[1]) <= num(strip[2]), true);

/* ================================================================ CHAIN 9 */
chain(9, "view 2 — the run partitions into exactly three terminal states");

const facets = rows(h2, "facet");
const facet = Object.fromEntries(facets.map((f) => [f.facet, num(f.count)]));
ok(9, "accepted + review + rejected = all",
  facet.accepted + facet.review + facet.rejected, facet.all);
ok(9, "needs-action = review + rejected", facet.review + facet.rejected, facet.needs);
ok(9, "exactly one facet is active", facets.filter((f) => f.active === "1").length, 1);
ok(9, "the active facet is needs-action", facets.find((f) => f.active === "1").facet, "needs");
for (const f of facets) ok(9, `${f.facet} prints its own count`, num(f._cells[0].match(/[\d,]+$/)[0]), num(f.count));
ok(9, "auto-accept rate = accepted / all",
  round(facet.accepted / facet.all * 100, 1), num(checked(h2, "accept-rate")));
ok(9, "the run total is stated once and agrees with the facet",
  num(checked(h2, "run-total")), facet.all);

/* =============================================================== CHAIN 10 */
chain(10, "view 2 — every reason breakdown partitions its own state");

const rr = rows(h2, "reason");
const revSum = rr.filter((r) => r.of === "review").reduce((s, r) => s + num(r.count), 0);
const rejSum = rr.filter((r) => r.of === "rejected").reduce((s, r) => s + num(r.count), 0);
ok(10, "review reasons sum to the review facet", revSum, facet.review);
ok(10, "rejected reasons sum to the rejected facet", rejSum, facet.rejected);
ok(10, "review has more than one reason", rr.filter((r) => r.of === "review").length >= 3, true);
for (const r of rr) ok(10, `${r.reason} prints its own count`, num(r._cells[0].match(/\d+$/)[0]), num(r.count));

/* =============================================================== CHAIN 11 */
chain(11, "view 2 — the queue page is sorted, bounded and honestly counted");

const q = rows(h2, "q");
const scores = q.map((r) => num(r.score));
for (let i = 1; i < scores.length; i++) {
  ok(11, `row ${i + 1} ≥ row ${i}`, scores[i] >= scores[i - 1], true);
}
for (const r of q) ok(11, `${r.capture} is below the auto-accept threshold`, num(r.score) < ACCEPT, true);
const foot = checked(h2, "footer-range").match(/(\d+)\s*–\s*(\d+)\s+of\s+([\d,]+)/);
ok(11, "footer lower bound", num(foot[1]), 1);
ok(11, "footer upper bound = rendered rows", num(foot[2]), q.length);
ok(11, "footer total = the active facet", num(foot[3]), facet.needs);
ok(11, "capture ids are unique", new Set(q.map((r) => r.capture)).size, q.length);
ok(11, "no two queued captures show the same photograph",
  new Set(q.map(imgSrc)).size, q.length);
ok(11, "the sort caret sits on the score column", checked(h2, "sort-column"), "score");
ok(11, "row states come from the terminal vocabulary",
  q.every((r) => r.state === "review" || r.state === "rejected"), true);
ok(11, "both terminal states appear on the page",
  new Set(q.map((r) => r.state)).size, 2);

/* =============================================================== CHAIN 12 */
chain(12, "view 2 — the disabled action is disabled for the reason it states");

ok(12, "the bulk-accept action is disabled", /data-check="bulk-accept"[^>]*\bdisabled\b/.test(h2), true);
ok(12, "no row on the page is above the threshold it names",
  q.filter((r) => num(r.score) >= num(checked(h2, "bulk-threshold"))).length, 0);
ok(12, "the stated threshold is the auto-accept threshold", num(checked(h2, "bulk-threshold")), ACCEPT);

/* =============================================================== CHAIN 13 */
chain(13, "view 2 — run-median stage latencies sum to their own total");

const stages2 = rows(h2, "stage");
ok(13, "four pipeline stages", stages2.length, 4);
ok(13, "Σ median ms = rendered total",
  round(stages2.reduce((s, x) => s + num(x.ms), 0), 1), num(checked(h2, "total-ms")));
ok(13, "the two views name the same four stages",
  stages2.map((s) => s.stage).join("|"), stages1.map((s) => s.stage).join("|"));
ok(13, "the two views name the same four model builds",
  stages2.map((s) => s.model).join("|"), stages1.map((s) => s.model).join("|"));
const sum2 = round(stages2.reduce((s, x) => s + num(x.ms), 0), 1);
ok(13, "this capture and the run median are not the same number", sum1 === sum2, false);
ok(13, "the stages that scale with crop count beat the median on this capture",
  ["rectify", "recogniser"].every((k) =>
    num(stages1.find((s) => s.stage === k).ms) < num(stages2.find((s) => s.stage === k).ms)), true);

/* =============================================================== CHAIN 14 */
chain(14, "view 2 — rejected rows have nothing downstream to show");

for (const r of q) {
  if (r.state === "rejected") {
    ok(14, `${r.capture} names no flagged field`, r.field, "—");
    ok(14, `${r.capture} shows an em dash in the field cell`, r._cells.includes("—"), true);
  } else {
    ok(14, `${r.capture} names a flagged field`, r.field !== "—", true);
  }
}
ok(14, "at least one rejected row is on the page",
  q.filter((r) => r.state === "rejected").length >= 1, true);

/* =============================================================== CHAIN 15 */
chain(15, "cross-screen — the record on view 1 is a row on view 2");

const cap = checked(h1, "capture-id");
const row = q.find((r) => r.capture === cap);
ok(15, "view 1's capture is on view 2's first page", !!row, true);
ok(15, "accession agrees", row.acc, checked(h1, "accession"));
ok(15, "department agrees", row.dept, checked(h1, "department"));
ok(15, "the queue's low score is view 1's lowest field confidence", num(row.score), num(below[0].conf));
ok(15, "the queue's flagged field is the field view 1 flags", row.field, below[0].field);
ok(15, "the row is the selected one", row.selected, "1");
ok(15, "state agrees with view 1's record state",
  row.state, checked(h1, "record-state").toLowerCase().replace("in ", ""));
ok(15, "the era cell names every text region the detector found, in order",
  row.era, dets.map((d) => d.era).join(" + "));

/* =============================================================== CHAIN 16 */
chain(16, "cross-screen — view 2's selected-capture panel replays view 1's pipeline exactly");

const sel = rows(h2, "selstage");
ok(16, "four stages in the panel", sel.length, 4);
for (let i = 0; i < 4; i++) {
  ok(16, `${sel[i].stage} ms equals view 1`, num(sel[i].ms), num(stages1[i].ms));
  ok(16, `${sel[i].stage} order equals view 1`, sel[i].stage, stages1[i].stage);
}
ok(16, "the panel's total equals view 1's total",
  round(sel.reduce((s, x) => s + num(x.ms), 0), 1), num(checked(h1, "total-ms")));
ok(16, "the panel is bound to the capture view 1 shows", checked(h2, "sel-capture"), cap);
ok(16, "the panel repeats view 1's detection count", num(checked(h2, "sel-detections")), dets.length);

/* =============================================================== CHAIN 17 */
chain(17, "cross-screen — the rejected capture is the same capture on both screens");

const rej1 = thumbs.filter((t) => t.state === "rejected");
ok(17, "exactly one rejected capture in the strip", rej1.length, 1);
const rej2 = q.find((r) => r.capture === rej1[0].capture);
ok(17, "it is a row on view 2", !!rej2, true);
ok(17, "state agrees", rej2.state, "rejected");
ok(17, "accession agrees", rej2.acc, rej1[0].acc);
ok(17, "its score is below the detector minimum", num(rej2.score) < DETMIN, true);
ok(17, "its reason is one of the rejected reasons",
  rr.filter((r) => r.of === "rejected").some((r) => r.reason === rej2.reason), true);
ok(17, "the strip flags it as not accepted", rej1[0].current !== "1", true);

/* =============================================================== CHAIN 18 */
chain(18, "the two files declare the same model, thresholds and run");

for (const [k, label] of [
  ["accept-threshold", "auto-accept threshold"],
  ["detector-min", "detector minimum box score"],
  ["run-id", "run id"],
  ["detector-build", "detector build"],
  ["device", "inference device"],
  ["institution", "institution"],
]) {
  ok(18, `${label} identical across both files`, checked(h1, k), checked(h2, k));
}
ok(18, "the auto-accept threshold is a real cut, not 1.0", ACCEPT < 1 && ACCEPT > 0.5, true);
ok(18, "the detector minimum is below the auto-accept threshold", DETMIN < ACCEPT, true);

/* =============================================================== CHAIN 19 */
chain(19, "the shared shell is byte-identical, not merely similar");

const shellOf = (h) => {
  const m = h.match(/\/\* SHELL:BEGIN \*\/([\s\S]*?)\/\* SHELL:END \*\//);
  if (!m) throw new Error("no SHELL block");
  return m[1];
};
const s1 = shellOf(h1), s2 = shellOf(h2);
ok(19, "shell CSS block is byte-identical", s1 === s2, true);
ok(19, "shell block is substantial", s1.length > 2000, true);
for (const tok of ["--topbar:40px", "--tools:44px", "--pipe:46px", "--panel:336px"]) {
  ok(19, `both files declare ${tok}`, s1.includes(tok) && s2.includes(tok), true);
}
const wordmark = (h) => /data-check="wordmark"[^>]*>([\s\S]*?)<\//.exec(h)[1];
ok(19, "wordmark markup identical", wordmark(h1), wordmark(h2));
const toolstrip = (h) => /<nav class="tools"[\s\S]*?<\/nav>/.exec(h)[0];
ok(19, "tool strip differs only by which tool is active",
  toolstrip(h1).replace(/ is-on/g, ""), toolstrip(h2).replace(/ is-on/g, ""));
ok(19, "each view lights exactly one tool",
  (toolstrip(h1).match(/is-on/g) || []).length, 1);
ok(19, "view 2 lights exactly one tool",
  (toolstrip(h2).match(/is-on/g) || []).length, 1);
ok(19, "the two views light different tools", toolstrip(h1) === toolstrip(h2), false);

/* =============================================================== CHAIN 20 */
chain(20, "the shell shape the first three products share is not reinstated");

for (const [name, h] of [["view 1", h1], ["view 2", h2]]) {
  const regions = rows(h, "region");
  ok(20, `${name} declares its main regions`, regions.length >= 1, true);
  ok(20, `${name} last main region is the flexible one`, regions[regions.length - 1].flex, "1");
  ok(20, `${name} has no fixed trailing column`,
    regions.filter((r, i) => i === regions.length - 1 && r.w).length, 0);
  ok(20, `${name} has no KPI tile strip`, /data-row="kpi"/.test(h), false);
  ok(20, `${name} has no labelled nav rail`, /class="[^"]*\brail\b/.test(h), false);
  ok(20, `${name} panels float rather than dock`, /data-float="1"/.test(h), true);
}

/* =============================================================== CHAIN 21 */
chain(21, "view 1 — the stated zoom, the master image and the box dimensions agree");

const master = checked(h1, "master").split("×").map(Number);
const zoom = num(checked(h1, "zoom")) / 100;
const img = rows(h1, "image")[0];
const plateSvg = /<svg class="plate" width="(\d+)" height="(\d+)"/.exec(h1);
ok(21, "the canvas states a master size and a zoom", master.length === 2 && zoom > 0, true);
ok(21, "the plate is drawn at the declared image size",
  `${plateSvg[1]}×${plateSvg[2]}`, `${img.w}×${img.h}`);
near(21, "zoom = image width ÷ master width", zoom, num(img.w) / master[0], 0.0005);
near(21, "the master carries the image's aspect ratio",
  master[0] / master[1], num(img.w) / num(img.h), 0.002);
ok(21, "the view is a reduction, not an enlargement", zoom < 1, true);
// the photograph is framed by the canvas rather than bleeding to its edges
for (const [side, v] of [["left", num(img.x)], ["top", num(img.y)],
["right", num(img.cw) - num(img.x) - num(img.w)],
["bottom", num(img.ch) - num(img.y) - num(img.h)]]) {
  ok(21, `canvas shows through on the ${side}`, v > 0, true);
}
ok(21, "the overlay is registered to the plate, not the viewport",
  /<svg class="ovl" width="(\d+)" height="(\d+)"/.exec(h1).slice(1, 3).join("×"),
  `${img.w}×${img.h}`);
// the zoom is rendered to 0.1%, so allow exactly the slack that rounding buys
const zoomTol = (drawn) => drawn / (zoom * zoom) * 0.0005 + 0.6;
for (const d of dets) {
  const p = polys.find((x) => x.obb === d.det);
  near(21, `${d.det} source width = drawn width ÷ zoom`,
    num(d["src-w"]), num(p.w) / zoom, zoomTol(num(p.w)));
  near(21, `${d.det} source height = drawn height ÷ zoom`,
    num(d["src-h"]), num(p.h) / zoom, zoomTol(num(p.h)));
  ok(21, `${d.det} prints those source pixels`,
    text(d._raw).includes(`${d["src-w"]}×${d["src-h"]}`), true);
}

/* --------------------------------------------------------------- summary */
console.log(`\n\x1b[1m${pass} assertions passed\x1b[0m across 21 chains.`);
if (failures.length) {
  console.log(`\x1b[31m${failures.length} FAILED\x1b[0m`);
  for (const f of failures) console.log("  " + f);
  process.exit(1);
}
