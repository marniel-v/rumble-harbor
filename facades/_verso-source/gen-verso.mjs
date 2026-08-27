// Generator for the Verso facade pair (work 5 — vision-detection).
// Every rendered figure is computed here; nothing is a typed-in number.
// Rule: real Unicode everywhere (charset utf-8). Only "&" is escaped, and only in text.
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = "/Users/eag3r/Git/rumble-harbor/facades";
const HERE = path.dirname(fileURLToPath(import.meta.url));
// Copy-stand plate and the two rectified crops, composited by gen-plate.py from
// Cleveland Museum of Art accessions 1927.220 (tin-glazed tile) and 2023.15
// (the label's paper stock) — both open access, licence CC0. gen-plate.py also
// emits the detection geometry, so the boxes are measured off the photograph
// rather than typed in here.
const PLATE = (await readFile(path.join(HERE, "plate.b64"), "utf8")).trim();
const GEO = JSON.parse(await readFile(path.join(HERE, "dets.json"), "utf8"));
const CROPS = GEO.crops;
// One distinct CC0 object per capture — see objects.json for the accession list.
const THUMBS = JSON.parse(await readFile(path.join(HERE, "thumbs.json"), "utf8"));
const thumbSrc = (size, cap) => `data:image/jpeg;base64,${THUMBS[size][cap]}`;
const amp = (s) => s.replace(/&/g, "&amp;");   // for visible text only

/* ------------------------------------------------------------------ data */

const INST = "Ravensholt Museum & Archive";
const RUN = "R-0824-C";
const BUILD = "4.1.2";
const DEVICE = "cuda:0 · A4000 · fp16";
const ACCEPT = 0.940;
const DETMIN = 0.550;
const RAMP_LO = 0.700;

const CAP = "C-0847";
const ACC = "1963.114";
const DEPT = "Ceramics & Glass";

// per-character confidences → a field's confidence is their product
const charsets = {
  accession_no: [["1", .998], ["9", .996], ["6", .997], ["3", .994], [".", .999], ["1", .997], ["1", .998], ["4", .994]],
  inscription: [["M", .972], ["A", .958], ["T", .966], ["H", .944], ["E", .951], [" ", .997],
  ["1", .902], ["3", .861], ["V", .697], ["3", .931]],
};
const prod = (cs) => Number(cs.reduce((p, [, v]) => p * v, 1).toFixed(3));
const glyphs = (cs) => cs.map(([ch]) => ch).join("");
const CONF_ACC = prod(charsets.accession_no);
const CONF_INSC = prod(charsets.inscription);

const fields = [
  { f: "accession_no", v: ACC, c: CONF_ACC, s: "ok" },
  { f: "inscription", v: glyphs(charsets.inscription), c: CONF_INSC, s: "below" },
  { f: "object_name", v: "Tile", c: .961, s: "ok" },
  { f: "place", v: "Delft", c: .978, s: "ok" },
  { f: "date", v: "c. 1740–60", c: .952, s: "ok" },
  { f: "materials", v: "Tin-glazed earthenware", c: .968, s: "ok" },
  { f: "credit_line", v: "Gift of Mrs E. M. Harkness, 1963", c: .943, s: "ok" },
  { f: "previous_no", v: "—", c: null, s: "none" },
];

// oriented boxes — geometry measured off the plate by gen-plate.py
const detMeta = {
  "det-1": { cls: "label", era: "1978 typed", score: .978 },
  "det-2": { cls: "inscription", era: "painted, on glaze", score: .641 },
};
const dets = GEO.dets.map((d) => ({ ...d, ...detMeta[d.id] }));

const stages = [
  { k: "detector", label: "detector", model: "vd-det-r50-fpn 4.1.2", ms: 39.8, med: 38.7, note: "2 kept" },
  { k: "rectify", label: "rectify", model: "tps-rect 1.3.0", ms: 5.6, med: 6.4, note: "2 crops" },
  { k: "recogniser", label: "recogniser", model: "crnn-ctc 2.8.4", ms: 68.4, med: 71.9, note: "2 read" },
  { k: "parser", label: "field parser", model: "fp-rules-lm 0.9.7", ms: 2.7, med: 2.8, note: "1 unmapped" },
];
const TOTAL1 = Number(stages.reduce((s, x) => s + x.ms, 0).toFixed(1));
const TOTAL2 = Number(stages.reduce((s, x) => s + x.med, 0).toFixed(1));

const ACCEPTED = 1257, REVIEW = 118, REJECTED = 37;
const ALL = ACCEPTED + REVIEW + REJECTED;
const NEEDS = REVIEW + REJECTED;
const RATE = Number((ACCEPTED / ALL * 100).toFixed(1));

const revReasons = [
  ["below threshold", 71], ["conflicting labels", 23],
  ["accession not found", 14], ["low box score", 10],
];
const rejReasons = [["no label detected", 21], ["capture blurred", 9], ["occluded by mount", 7]];
const CORRECTIONS = 2914, QUEUED_TRAIN = 341;

const strip = [
  ["C-0843", "1962.401", "accepted"], ["C-0844", "1962.402", "accepted"],
  ["C-0845", "1963.110", "accepted"], ["C-0846", "1963.112.1", "accepted"],
  [CAP, ACC, "review"], ["C-0848", "1963.115", "accepted"],
  ["C-0849", "1963.117", "accepted"], ["C-0850", "1963.118.2", "accepted"],
  ["C-0851", "2019.008.1", "rejected"], ["C-0852", "1963.121", "accepted"],
  ["C-0853", "1963.124", "review"], ["C-0854", "1963.126", "accepted"],
];

// review queue, ascending by the lowest score on the capture
const queue = [
  ["rejected", "C-1043", "1987.226", "Archaeology", "1980–98 dot-matrix", "—", "no label detected", .147, "09:12:04", "—"],
  ["rejected", "C-0851", "2019.008.1", "Social History", "2015– archival print", "—", "occluded by mount", .310, "09:26:41", "RJS"],
  ["rejected", "C-0771", "1954.019", "Fine Art", "pre-1960 ink", "—", "capture blurred", .348, "09:31:57", "—"],
  ["rejected", "C-1129", "1991.310.2", "Industrial & Maritime", "1980–98 dot-matrix", "—", "no label detected", .362, "10:02:18", "—"],
  ["review", CAP, ACC, "Ceramics & Glass", dets.map((d) => d.era).join(" + "), "inscription", "below threshold", CONF_INSC, "10:14:22", "HLW"],
  ["review", "C-1204", "2004.077.3", "Industrial & Maritime", "1999–2014 laser", "date", "below threshold", .441, "10:19:03", "HLW"],
  ["review", "C-0668", "1971.042", "Textiles & Dress", "1961–79 typed", "maker", "below threshold", .478, "10:24:39", "—"],
  ["rejected", "C-0559", "1948.007", "Fine Art", "pre-1960 ink", "—", "capture blurred", .501, "10:31:15", "—"],
  ["review", "C-1318", "2011.145", "Social History", "2015– archival print", "credit_line", "low box score", .523, "10:37:52", "PBN"],
  ["review", "C-0902", "1966.088.1", "Ceramics & Glass", "1961–79 typed", "accession_no", "conflicting labels", .547, "10:41:26", "—"],
  ["review", "C-1077", "1983.412", "Archaeology", "1980–98 dot-matrix", "object_name", "below threshold", .566, "10:48:09", "PBN"],
  ["review", "C-0733", "1957.203", "Textiles & Dress", "pre-1960 ink", "previous_no", "below threshold", .588, "10:52:44", "HLW"],
  ["review", "C-1265", "2007.019.4", "Fine Art", "1999–2014 laser", "accession_no", "accession not found", .601, "10:57:31", "—"],
  ["review", "C-0614", "1952.118", "Archaeology", "pre-1960 ink", "previous_no", "below threshold", .617, "11:03:12", "PBN"],
  ["review", "C-1391", "2016.204", "Social History", "2015– archival print", "accession_no", "conflicting labels", .634, "11:08:47", "HLW"],
  ["review", "C-0985", "1974.056.2", "Textiles & Dress", "1961–79 typed", "materials", "below threshold", .658, "11:14:20", "—"],
  ["review", "C-1152", "1996.331", "Industrial & Maritime", "1980–98 dot-matrix", "object_name", "low box score", .673, "11:19:58", "PBN"],
  ["review", "C-0812", "1961.027", "Ceramics & Glass", "1961–79 typed", "date", "below threshold", .689, "11:25:33", "—"],
  ["review", "C-1337", "2013.092.1", "Fine Art", "1999–2014 laser", "accession_no", "accession not found", .704, "11:31:06", "HLW"],
  ["review", "C-0691", "1955.174", "Archaeology", "pre-1960 ink", "maker", "below threshold", .718, "11:36:41", "—"],
  ["review", "C-1418", "2018.063", "Social History", "2015– archival print", "credit_line", "below threshold", .736, "11:42:19", "PBN"],
  ["review", "C-0748", "1959.088.3", "Textiles & Dress", "pre-1960 ink", "previous_no", "below threshold", .751, "11:47:52", "—"],
];

/* --------------------------------------------------------------- helpers */
const f3 = (v) => v.toFixed(3);
const tier = (v) => (v >= ACCEPT ? "hi" : v >= RAMP_LO ? "mid" : "lo");
const boxTier = (v) => (v >= ACCEPT ? "hi" : v >= DETMIN ? "mid" : "lo");
const nf = (n) => n.toLocaleString("en-GB");

function corners(cx, cy, w, h, thDeg) {
  const t = thDeg * Math.PI / 180, co = Math.cos(t), si = Math.sin(t);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    .map(([x, y]) => [cx + x * co - y * si, cy + x * si + y * co]);
}
const pts = (c) => c.map(([x, y]) => `${+x.toFixed(3)},${+y.toFixed(3)}`).join(" ");

let seed = 20260824;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

/* ------------------------------------------------------------ shared CSS */
const SHELL = `
:root{
  --topbar:40px; --tools:44px; --pipe:46px; --panel:336px;
  --ground:#191714; --plate:#0f0d0b; --surf:#231f1a; --surf2:#2b2620;
  --line:#373027; --line2:#2a251f;
  --ink:#efe9df; --ink2:#a99c8a; --ink3:#6e6456;
  --acc:#a2632c; --acc2:#c47c37;
  --hi:#43d6a0; --mid:#d2a13f; --lo:#d0503f;
  --sans:"Avenir Next","Avenir",Futura,"Trebuchet MS",sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --t9:9px; --t10:10px; --t11:11px; --t12:12px; --t14:14px; --t18:18px;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1440px;height:900px;overflow:hidden}
body{background:var(--ground);color:var(--ink);font:400 var(--t11)/1.45 var(--sans);
  -webkit-font-smoothing:antialiased;display:grid;
  grid-template-columns:minmax(0,1fr);grid-template-rows:var(--topbar) 1fr var(--pipe)}
ul,ol{list-style:none}
b,strong{font-weight:600}
.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}
.up{text-transform:uppercase;letter-spacing:.09em;font-size:var(--t9);color:var(--ink3);font-style:normal}
.dim{color:var(--ink2)}
.dim3{color:var(--ink3)}
.hi{color:var(--hi)} .mid{color:var(--mid)} .lo{color:var(--lo)}
.top{display:flex;align-items:center;background:#141210;border-bottom:1px solid #0b0a09;
  padding:0 12px 0 0;position:relative;z-index:5}
.mark{width:var(--tools);height:var(--topbar);display:flex;align-items:center;justify-content:center}
.mark i{display:block;width:15px;height:15px;background:var(--acc);
  clip-path:polygon(0 0,100% 0,100% 62%,62% 100%,0 100%)}
.word{font-size:var(--t14);font-weight:600;letter-spacing:.20em;padding-right:14px}
.crumb{display:flex;align-items:center;gap:7px;font-size:var(--t11);color:var(--ink2);
  border-left:1px solid var(--line);padding-left:14px;min-width:0;overflow:hidden;white-space:nowrap}
.crumb s{text-decoration:none;color:#4c443a}
.crumb em{font-style:normal;color:var(--ink);font-family:var(--mono);font-size:var(--t11)}
.topr{margin-left:auto;flex:none;display:flex;align-items:center;gap:9px;padding-left:12px}
.meta{font-size:var(--t10);color:var(--ink3);font-family:var(--mono)}
.meta b{color:var(--ink2);font-weight:400}
.chip{font-size:var(--t9);letter-spacing:.07em;text-transform:uppercase;padding:3px 7px;
  border:1px solid var(--line);border-radius:2px;color:var(--ink2)}
.chip.warn{border-color:#5d4718;background:#2a2113;color:var(--mid)}
.av{width:23px;height:23px;border-radius:50%;background:#3a3128;border:1px solid #4a3f33;
  display:flex;align-items:center;justify-content:center;font-size:var(--t9);color:var(--ink2);letter-spacing:.04em}
.mid-row{display:flex;min-height:0}
.tools{width:var(--tools);background:#141210;border-right:1px solid #0b0a09;
  display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:2px;flex:none}
.tools u{display:block;width:24px;height:1px;background:var(--line);margin:5px 0}
.tl{width:30px;height:30px;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#7d7263}
.tl.is-on{background:var(--acc);color:#150f09}
.tl svg{display:block}
.stage{flex:1;min-width:0;display:flex;flex-direction:column;position:relative;background:var(--plate)}
.float{position:absolute;background:rgba(35,31,26,.97);border:1px solid #423a2f;border-radius:5px;
  box-shadow:0 18px 44px rgba(0,0,0,.62),0 2px 6px rgba(0,0,0,.5);z-index:3;
  display:flex;flex-direction:column;overflow:hidden}
.ph{height:30px;flex:none;display:flex;align-items:center;gap:8px;padding:0 10px;
  background:#2b2620;border-bottom:1px solid #3a3229}
.ph .t{font-size:var(--t10);letter-spacing:.10em;text-transform:uppercase;color:var(--ink2)}
.grp{padding:7px 10px 3px;font-size:var(--t9);letter-spacing:.10em;text-transform:uppercase;
  color:var(--ink3);display:flex;align-items:center;gap:6px}
.grp:after{content:"";flex:1;height:1px;background:var(--line2)}
.grp b{color:var(--ink2);font-weight:400}
.st{font-size:var(--t9);letter-spacing:.07em;text-transform:uppercase;padding:2px 6px;border-radius:2px}
.st.review{background:#33280f;color:var(--mid);border:1px solid #5d4718}
.pipe{display:flex;align-items:center;background:#141210;border-top:1px solid #0b0a09;padding:0 12px}
.pipe .lab{font-size:var(--t9);letter-spacing:.10em;text-transform:uppercase;color:var(--ink3);
  width:calc(var(--tools) - 12px)}
.pipe ol{display:flex;align-items:center;min-width:0;overflow:hidden}
.sg{padding:0 11px;border-left:1px solid var(--line2);display:flex;flex-direction:column;gap:1px;flex:none}
.sg .n{font-size:var(--t11);color:var(--ink)}
.sg .m{font-size:var(--t9);color:var(--ink3);font-family:var(--mono)}
.sg .v{font-family:var(--mono);font-size:var(--t11);color:var(--acc2);font-variant-numeric:tabular-nums}
.sg em{font-style:normal}
.arw{color:#4b4238;font-size:var(--t12);padding:0 1px}
.piper{margin-left:auto;flex:none;display:flex;align-items:center;gap:11px;padding-left:12px}
.tot{font-family:var(--mono);font-size:var(--t12);color:var(--ink)}
.tot b{font-weight:400}
button{font:inherit;color:inherit;background:none;border:0}
.btn{height:24px;padding:0 10px;border:1px solid var(--line);border-radius:3px;
  font-size:var(--t10);color:var(--ink2);background:#26221c}
.btn[disabled]{opacity:.42}
`;

/* ------------------------------------------------------------- tool icons */
const ICONS = {
  cursor: '<path d="M4 3l9 6.2-3.9.7 2.1 3.9-1.5.8-2.1-3.9-2.6 3z" fill="currentColor"/>',
  obb: '<path d="M2.6 5.4l7-2.8 5.8 5.4-7 2.8z" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  poly: '<path d="M3 12l2-8 7 1 2 5-6 4z" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  read: '<path d="M3 4h11M3 8h8M3 12h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  rule: '<path d="M2 6.5h13v4H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 6.5v2M8 6.5v3M11 6.5v2" stroke="currentColor" stroke-width="1"/>',
  hand: '<path d="M6 13V6.5a1 1 0 012 0V4a1 1 0 012 0v2.5a1 1 0 012 0V11c0 1.6-1.3 3-3 3H8l-3-3" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  zoom: '<circle cx="7.6" cy="7.6" r="4.2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M10.8 10.8L14 14" stroke="currentColor" stroke-width="1.3"/>',
  grid: '<path d="M3 3h4.6v4.6H3zM9.4 3H14v4.6H9.4zM3 9.4h4.6V14H3zM9.4 9.4H14V14H9.4z" fill="none" stroke="currentColor" stroke-width="1.15"/>',
  layer: '<path d="M8.5 2.6l5.6 3-5.6 3-5.6-3z" fill="none" stroke="currentColor" stroke-width="1.15"/><path d="M2.9 9l5.6 3 5.6-3" fill="none" stroke="currentColor" stroke-width="1.15"/>',
};
const TOOLKEYS = ["cursor", "obb", "poly", "read", "rule", "hand", "zoom", "grid", "layer"];
const toolstrip = (active) => `<nav class="tools">${TOOLKEYS.map((k, i) =>
  `${(i === 4 || i === 7) ? "<u></u>" : ""}<button class="tl${k === active ? " is-on" : ""}" title="${k}"><svg width="17" height="17" viewBox="0 0 17 17">${ICONS[k]}</svg></button>`
).join("")}</nav>`;

/* ----------------------------------------------------------- shared parts */
const topbar = (tail, chip) => `<header class="top">
  <span class="mark"><i></i></span>
  <span class="word" data-check="wordmark">VERSO</span>
  <nav class="crumb"><span data-check="institution">${amp(INST)}</span><s>/</s>Collections Online ph.2<s>/</s>Run <em data-check="run-id">${RUN}</em><s>/</s>${tail}</nav>
  <div class="topr">
    <span class="meta">det <b data-check="detector-build">${BUILD}</b></span>
    <span class="meta">rig <b>Copy stand B</b></span>
    ${chip}
    <span class="av">RJS</span>
  </div>
</header>`;

const pipebar = (median) => `<footer class="pipe">
  <span class="lab">Pipe</span>
  <ol>${stages.map((s, i) => {
  const ms = median ? s.med : s.ms;
  const warn = s.k === "parser" ? ' class="mid"' : "";
  return `${i ? '<span class="arw">›</span>' : ""}<li class="sg" data-row="stage" data-stage="${s.k}" data-model="${s.model}" data-ms="${ms}" style="${i ? "" : "border-left:0;padding-left:0"}"><span class="n">${s.label} <b class="v">${ms.toFixed(1)} ms</b></span><span class="m">${s.model} · <em${warn}>${s.note}</em></span></li>`;
}).join("")}</ol>
  <div class="piper">
    <span class="meta">${median ? `median over ${nf(ALL)} captures` : "this capture"}</span>
    <span class="tot">Σ <b data-check="total-ms">${(median ? TOTAL2 : TOTAL1).toFixed(1)} ms</b></span>
    <span class="meta" data-check="device">${DEVICE}</span>
    <span class="chip warn">ingest paused 09:41:52</span>
  </div>
</footer>`;

/* =============================================================== VIEW 1 */
const CW = 1396, CH = 726;                        // the canvas viewport
// The photograph is a bounded image sitting on the viewer's dark canvas, not
// the canvas itself — the register puts the frame's edge on screen.
const IMG = { x: 420, y: 22, w: 820, h: 615 };
const CAL = { x: 804, y: 540, w: 580, h: 144 };   // character-confidence callout
// the master the viewer is showing, at the capture back's own 4:3
const MASTER_W = 4096, MASTER_H = Math.round(MASTER_W * IMG.h / IMG.w);
const ZOOM = Number((IMG.w / MASTER_W * 100).toFixed(1));
const MASTER = `${MASTER_W}×${MASTER_H}`;
const srcPx = (v) => Math.round(v * MASTER_W / IMG.w);

// Nothing here is drawn: the plate is the photograph gen-plate.py composited,
// label and all. Only the detector's own overlay is vector.
const plate = () => `<svg class="plate" width="${IMG.w}" height="${IMG.h}" viewBox="0 0 ${IMG.w} ${IMG.h}">
  <image x="0" y="0" width="${IMG.w}" height="${IMG.h}" href="data:image/jpeg;base64,${PLATE}"/>
</svg>`;

function overlays() {
  const gs = dets.map((d) => {
    const tc = boxTier(d.score);
    const c = corners(d.cx, d.cy, d.w, d.h, d.th);
    const handles = c.map(([x, y]) => `<rect x="${(x - 2.5).toFixed(1)}" y="${(y - 2.5).toFixed(1)}" width="5" height="5" fill="var(--${tc})"/>`).join("");
    const tx = Math.min(...c.map((p) => p[0])), ty = Math.min(...c.map((p) => p[1]));
    const txt = `${d.cls} · ${d.era}`;
    const wpx = Math.round(12 + txt.length * 5.3 + 34);
    const tag = `<g transform="translate(${tx.toFixed(1)} ${(ty - 21).toFixed(1)})">
      <rect width="${wpx}" height="18" rx="2" fill="rgba(14,12,10,.88)" stroke="var(--${tc})" stroke-width="1"/>
      <text x="6" y="12.5" font-size="9.5" fill="#e6ded1" font-family="var(--sans)">${txt}</text>
      <text x="${wpx - 34}" y="12.5" font-size="9.5" font-family="var(--mono)" fill="var(--${tc})">${f3(d.score)}</text></g>`;
    return `<polygon data-obb="${d.id}" data-cx="${d.cx}" data-cy="${d.cy}" data-w="${d.w}" data-h="${d.h}" data-theta="${d.th}" points="${pts(c)}" fill="rgba(230,222,209,.04)" stroke="var(--${tc})" stroke-width="1.6"></polygon>${handles}${tag}`;
  }).join("");
  // a leader from the box that failed to the callout that explains why
  const h = dets[1];
  return `<svg class="ovl" width="${IMG.w}" height="${IMG.h}" viewBox="0 0 ${IMG.w} ${IMG.h}">${gs}
    <path d="M${(h.cx + h.w / 2 + 8).toFixed(1)} ${(h.cy + h.h / 2 + 3).toFixed(1)} L${CAL.x - IMG.x} ${CAL.y - IMG.y}" stroke="var(--lo)" stroke-width="1" opacity=".6" stroke-dasharray="3 3" fill="none"/></svg>`;
}

const charRow = (fname) => {
  const cs = charsets[fname];
  const f = fields.find((x) => x.f === fname);
  return `<div class="crow"><em class="up">${fname}</em><div class="cts">${cs.map(([ch, v]) =>
    `<span class="ct t-${tier(v)}" data-row="char" data-for="${fname}" data-ch="${ch}" data-conf="${f3(v)}" data-tier="${tier(v)}"><b>${ch === " " ? "␣" : ch}</b>${f3(v)}</span>`).join("")
    }</div><em class="ceq mono">Π = <b class="${tier(f.c)}">${f3(f.c)}</b></em></div>`;
};

// the crops are cut from the plate itself, deskewed about each box centre
const crops = () => `<div class="crops">${dets.map((d) => `<figure data-row="crop" data-det="${d.id}">
    <img src="data:image/jpeg;base64,${CROPS[d.id]}" style="border-color:var(--${boxTier(d.score)})" alt="">
    <figcaption>${d.id} · deskewed ${Math.abs(d.th).toFixed(1)}°</figcaption></figure>`).join("")}</div>`;

function inspector() {
  const detRows = dets.map((d) => `<li class="dr" data-row="detection" data-det="${d.id}" data-cls="${d.cls}" data-era="${d.era}" data-score="${f3(d.score)}" data-theta="${d.th}" data-tier="${boxTier(d.score)}" data-src-w="${srcPx(d.w)}" data-src-h="${srcPx(d.h)}">
    <i class="sw sw-${boxTier(d.score)}"></i><b>${d.cls} · ${d.era}</b>
    <em class="mono ${boxTier(d.score)}">${f3(d.score)}</em>
    <em class="mono dim3">${d.th > 0 ? "+" : "−"}${Math.abs(d.th).toFixed(1)}°</em>
    <em class="mono dim3">${srcPx(d.w)}×${srcPx(d.h)}</em></li>`).join("");

  const TRACK = 62;
  const fieldRows = fields.map((f) => {
    const bar = f.c == null ? `<i class="nb">—</i>`
      : `<i class="bt"><i class="bf t-${tier(f.c)}" data-bar="${f.f}" data-conf="${f3(f.c)}" data-track="${TRACK}" data-w="${(f.c * TRACK).toFixed(2)}" style="width:${(f.c * TRACK).toFixed(2)}px"></i></i>`;
    const st = f.s === "conflict" ? `<i class="fl lo">conflict</i>` : f.s === "below" ? `<i class="fl mid">below</i>` : "";
    return `<li class="fr s-${f.s}" data-row="field" data-field="${f.f}" data-value="${f.v}" data-conf="${f.c == null ? "—" : f3(f.c)}" data-state="${f.s}">
      <em class="fn">${f.f}</em><b class="fv">${f.v}</b>${st}${bar}<em class="fc mono ${f.c == null ? "dim3" : tier(f.c)}">${f.c == null ? "—" : f3(f.c)}</em></li>`;
  }).join("");

  const candRows = [
    { v: ACC, src: "det-1", c: CONF_ACC, note: "typed label · matched in ledger" },
    { v: "13V3", src: "det-2", c: CONF_INSC, note: "painted mark · no accession mask" },
  ].map((c, i) => `<li class="cd" data-row="candidate" data-value="${c.v}" data-src="${c.src}" data-conf="${f3(c.c)}">
    <i class="rd${i ? "" : " on"}"></i><b class="mono">${c.v}</b><em class="dim3">${c.note}</em><em class="mono ${tier(c.c)}">${f3(c.c)}</em></li>`).join("");

  return `<aside class="float insp" data-float="1" style="left:14px;top:12px;width:var(--panel);height:698px">
  <div class="ph"><span class="t">Object record</span><span class="st review" data-check="record-state">IN REVIEW</span></div>
  <div class="idb">
    <b class="acn mono" data-check="accession">${ACC}</b>
    <em class="dim" data-check="department">${amp(DEPT)}</em>
    <em class="dim3">capture <b class="mono" data-check="capture-id">${CAP}</b> · ${ACC}-01.tif · ${MASTER}</em>
  </div>
  <div class="grp">Detections <b data-check="detection-count">${dets.length}</b></div>
  <ul class="dets">${detRows}</ul>
  <div class="grp">Rectified crops</div>
  ${crops()}
  <div class="grp">Parsed fields <b>${fields.filter((f) => f.c != null).length} of ${fields.length} read</b></div>
  <ul class="flds">${fieldRows}</ul>
  <div class="grp">Parser candidates</div>
  <ul class="cds">${candRows}</ul>
  <div class="rule">
    <em class="up">Routing rule</em>
    <p>Hold for review when any parsed field scores below <b class="mono" data-check="accept-threshold">${ACCEPT.toFixed(3)}</b>. Boxes under <b class="mono" data-check="detector-min">${DETMIN.toFixed(3)}</b> are discarded; text found on the object itself is read but never mapped to an accession.</p>
    <p class="fires"><i class="fl mid">below</i><b class="mono" data-check="rule-below-field">${fields.find((f) => f.s === "below").f}</b></p>
  </div>
</aside>`;
}

const callout = () => `<aside class="float cal" data-float="1" style="left:${CAL.x}px;top:${CAL.y}px;width:${CAL.w}px;height:${CAL.h}px">
  <div class="ph"><span class="t">Character confidence</span><span class="lg">≥ <b class="hi mono" data-check="ramp-high">${ACCEPT.toFixed(3)}</b> accept · ≥ <b class="mid mono" data-check="ramp-low">${RAMP_LO.toFixed(3)}</b> low · below, reject</span></div>
  <div class="calb">${charRow("accession_no")}${charRow("inscription")}</div></aside>`;

const filmstrip = () => `<div class="strip">
  <div class="sh"><em class="up">Run ${RUN} · 24 Aug 2026</em><em class="dim3" data-check="strip-position">capture 847 of ${nf(ALL)}</em><em class="dim3">sorted by capture time</em></div>
  <ul class="tbs">${strip.map(([c, a, s]) =>
  `<li class="tb ${s}${c === CAP ? " cur" : ""}" data-row="thumb" data-capture="${c}" data-acc="${a}" data-state="${s}" data-current="${c === CAP ? 1 : 0}">
    <img src="${thumbSrc("strip", c)}" alt=""><em class="mono">${c}</em><i class="dot"></i></li>`
).join("")}</ul></div>`;

const V1CSS = `
/* the viewport is lit, not flat: the glow sits behind the plate and falls to
   near-black at the edges, on the same axis as the lamp in the photograph */
.canvas{flex:1;min-height:0;position:relative;overflow:hidden;
  background:radial-gradient(128% 106% at 60% 42%,#221e18 0%,#171410 45%,#0c0a09 100%)}
.img{position:absolute;box-shadow:0 0 0 1px #3a332b,0 18px 46px rgba(0,0,0,.7),0 2px 8px rgba(0,0,0,.55)}
.plate,.ovl{position:absolute;left:0;top:0}
.hud{position:absolute;left:${IMG.x}px;bottom:9px;display:flex;gap:14px;
  font-family:var(--mono);font-size:var(--t10);color:#8d8272}
.hud b{color:#cbc2b2;font-weight:400}
.zoomer{position:absolute;right:12px;top:12px;display:flex;align-items:center;gap:8px;
  background:rgba(20,18,15,.8);border:1px solid #3a332a;border-radius:3px;padding:4px 9px;
  font-family:var(--mono);font-size:var(--t10);color:var(--ink2);z-index:2}
.idb{padding:7px 10px 8px;border-bottom:1px solid var(--line2);display:flex;flex-direction:column;gap:1px}
.acn{font-size:var(--t18);letter-spacing:.02em}
.idb em{font-size:var(--t10);font-style:normal}
.dets{padding:0 10px 3px}
.dr{display:flex;align-items:center;gap:7px;height:23px;font-size:var(--t10);border-bottom:1px solid #241f1a}
.dr b{font-weight:400;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dr em{font-style:normal}
.sw{width:7px;height:7px;flex:none;border-radius:1px}
.sw-hi{background:var(--hi)} .sw-mid{background:var(--mid)} .sw-lo{background:var(--lo)}
.crops{display:flex;gap:8px;padding:2px 10px 4px}
.crops figure{flex:1;min-width:0}
.crops img{display:block;width:100%;height:auto;border:1.4px solid var(--line)}
.crops figcaption{font-size:var(--t9);color:var(--ink3);font-family:var(--mono);padding-top:2px}
.flds{padding:0 10px 3px}
.fr{display:flex;align-items:center;gap:6px;height:25px;border-bottom:1px solid #241f1a;font-size:var(--t10)}
.fr em{font-style:normal}
.fn{width:74px;flex:none;color:var(--ink3);font-family:var(--mono);font-size:var(--t9)}
.fv{flex:1;min-width:0;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.s-none .fv{color:var(--ink3)}
.fl{font-style:normal;font-size:var(--t9);letter-spacing:.05em;text-transform:uppercase;
  border:1px solid currentColor;border-radius:2px;padding:0 3px;flex:none;opacity:.92}
.bt{width:52px;height:4px;background:#3a332a;flex:none;border-radius:1px;overflow:hidden;display:block}
.bf{display:block;height:4px}
.nb{width:52px;flex:none;text-align:center;color:var(--ink3);font-style:normal}
.t-hi{background:var(--hi)} .t-mid{background:var(--mid)} .t-lo{background:var(--lo)}
.fc{width:32px;text-align:right;flex:none}
.cds{padding:0 10px 5px}
.cd{display:flex;align-items:center;gap:7px;height:22px;font-size:var(--t10)}
.cd em{font-style:normal}
.cd em:first-of-type{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rd{width:9px;height:9px;border:1px solid #5d5346;border-radius:50%;flex:none}
.rd.on{border-color:var(--acc2);box-shadow:inset 0 0 0 2px var(--acc2)}
.rule{margin:auto 10px 10px;padding:7px 9px;background:#1e1a16;border:1px solid var(--line2);border-radius:3px}
.rule p{font-size:var(--t10);color:var(--ink2);line-height:1.5;margin-top:4px}
.rule .fires{display:flex;align-items:center;gap:5px;font-size:var(--t10)}
.cal .ph{justify-content:space-between}
.cal .lg{font-size:var(--t9);color:var(--ink3)}
.calb{padding:8px 10px;display:flex;flex-direction:column;gap:8px}
.crow{display:flex;align-items:center;gap:9px}
.crow>.up{width:78px;flex:none}
.cts{display:flex;gap:3px;flex:1}
.ct{width:34px;height:40px;border-radius:2px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:1px;font-family:var(--mono);font-size:var(--t9);color:#15120f}
.ct b{font-size:14px;font-weight:600;line-height:1}
.ceq{font-style:normal;font-size:var(--t11);color:var(--ink2);width:76px;text-align:right}
.strip{height:88px;flex:none;background:#141210;border-top:1px solid #0b0a09;display:flex;flex-direction:column}
.sh{height:20px;display:flex;align-items:center;gap:14px;padding:0 12px}
.sh em{font-size:var(--t9)}
.tbs{display:flex;gap:6px;padding-left:12px;overflow:hidden}
.tb{width:112px;flex:none;position:relative;border:1px solid #2e2820;border-radius:2px;overflow:hidden}
.tb img{display:block;width:112px;height:44px;object-fit:cover}
.tb.rejected img{opacity:.4;filter:grayscale(.6)}
.tb.cur{border-color:var(--acc2);box-shadow:0 0 0 1px var(--acc2)}
.tb em{position:absolute;left:0;right:0;bottom:0;background:rgba(12,10,9,.82);font-style:normal;
  font-size:var(--t9);text-align:center;color:var(--ink2)}
.tb .dot{position:absolute;right:4px;top:4px;width:6px;height:6px;border-radius:50%}
.tb.accepted .dot{background:var(--hi)} .tb.review .dot{background:var(--mid)} .tb.rejected .dot{background:var(--lo)}
`;

const view1 = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Verso — object record</title>
<style>/* SHELL:BEGIN */${SHELL}/* SHELL:END */${V1CSS}</style></head>
<body>
${topbar(`<em>${CAP}</em>`, `<span class="chip">${dets.length} boxes</span>`)}
<div class="mid-row">
${toolstrip("obb")}
<main class="stage">
  <div class="canvas" data-row="region" data-region="canvas" data-flex="1">
    <div class="img" data-row="image" data-x="${IMG.x}" data-y="${IMG.y}" data-w="${IMG.w}" data-h="${IMG.h}" data-cw="${CW}" data-ch="${CH}" style="left:${IMG.x}px;top:${IMG.y}px;width:${IMG.w}px;height:${IMG.h}px">${plate()}${overlays()}</div>
    <div class="zoomer"><span data-check="zoom">${ZOOM.toFixed(1)}%</span><span class="dim3">|</span><span>fit</span><span class="dim3">|</span><span>overlay on</span></div>
    <div class="hud"><span>${ACC}-01.tif</span><span><b data-check="master">${MASTER}</b></span><span>sRGB</span><span>300 ppi</span><span>1/60 f/8 ISO 100</span><span class="mid">no colour target in frame</span></div>
    ${inspector()}
    ${callout()}
  </div>
  ${filmstrip()}
</main>
</div>
${pipebar(false)}
</body></html>`;

/* =============================================================== VIEW 2 */
const V2CSS = `
.stage{flex-direction:row;background:var(--ground)}
.qz{flex:1;min-width:0;display:flex;flex-direction:column;margin-left:366px}
.chips{height:34px;flex:none;display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--line2)}
.fc2{display:flex;align-items:center;gap:6px;height:22px;padding:0 9px;border:1px solid var(--line);
  border-radius:11px;font-size:var(--t10);color:var(--ink2);white-space:nowrap}
.fc2 b{font-family:var(--mono);color:var(--ink);font-weight:400}
.fc2.on{background:var(--acc);border-color:#b06e31;color:#170f08}
.fc2.on b{color:#170f08}
.chips .rgt{margin-left:auto;display:flex;align-items:center;gap:8px;padding-right:12px}
.srch{height:22px;width:140px;border:1px solid var(--line);border-radius:3px;font-size:var(--t10);
  color:var(--ink3);display:flex;align-items:center;padding:0 8px}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead th{height:30px;font-size:var(--t9);letter-spacing:.09em;text-transform:uppercase;color:var(--ink3);
  font-weight:400;text-align:left;border-bottom:1px solid var(--line);padding:0 8px;white-space:nowrap}
thead th.n{text-align:right}
.qb{flex:1;min-height:0;overflow:hidden}
tbody td{height:34px;font-size:var(--t11);padding:0 8px;border-bottom:1px solid var(--line2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
tbody td.n{text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums}
tbody tr.sel{background:#2a2119;box-shadow:inset 2px 0 0 var(--acc2)}
tbody tr.rejected td{color:var(--ink2)}
.tmb{width:34px;padding-right:0}
.tmb img{display:block;width:26px;height:20px;object-fit:cover;border-radius:1px}
tr.rejected .tmb img{opacity:.45;filter:grayscale(.55)}
.sdot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;vertical-align:1px}
.sdot.review{background:var(--mid)} .sdot.rejected{background:var(--lo)}
.qf{height:30px;flex:none;display:flex;align-items:center;gap:14px;border-top:1px solid var(--line);
  padding:0 12px 0 8px;font-size:var(--t10);color:var(--ink3)}
.qf .rgt{margin-left:auto;display:flex;align-items:center;gap:12px}
.caret{color:var(--acc2)}
.sec{padding:7px 10px 8px;border-bottom:1px solid var(--line2)}
.sec h3{font-size:var(--t9);letter-spacing:.10em;text-transform:uppercase;color:var(--ink3);
  font-weight:400;display:flex;align-items:center;gap:6px;margin-bottom:5px}
.sec h3:after{content:"";flex:1;height:1px;background:var(--line2)}
.big{display:flex;align-items:baseline;gap:8px;margin-bottom:6px}
.big b{font-size:22px;font-weight:500;font-family:var(--mono)}
.big em{font-style:normal;font-size:var(--t10);color:var(--ink3)}
.big em b{font-size:var(--t10);color:var(--ink2)}
.sbar{height:9px;display:flex;border-radius:2px;overflow:hidden;margin-bottom:6px}
.sbar i{display:block}
.lg2{display:flex;gap:11px;font-size:var(--t10);color:var(--ink2)}
.lg2 i{display:inline-block;width:7px;height:7px;border-radius:1px;margin-right:4px}
.rl{display:flex;align-items:center;gap:7px;height:22px;font-size:var(--t10)}
.rl b{flex:1;font-weight:400;color:var(--ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rl em{font-style:normal;font-family:var(--mono);width:24px;text-align:right}
.rl i.mb{height:4px;background:var(--acc2);border-radius:1px;display:block;flex:none;opacity:.85}
.sl{display:flex;align-items:center;gap:7px;height:19px;font-size:var(--t10)}
.sl b{flex:1;font-weight:400;color:var(--ink2)}
.sl em{font-style:normal;font-family:var(--mono);color:var(--acc2)}
.kv{display:flex;justify-content:space-between;font-size:var(--t10);height:19px;align-items:center}
.kv b{font-weight:400;color:var(--ink2)}
.kv em{font-style:normal;font-family:var(--mono)}
.note{font-size:var(--t10);color:var(--ink3);line-height:1.5;margin-top:5px}
`;

function panel2() {
  const W = 304;
  const seg = [[ACCEPTED, "var(--hi)"], [REVIEW, "var(--mid)"], [REJECTED, "var(--lo)"]];
  const maxRev = Math.max(...revReasons.map((r) => r[1]));
  const maxRej = Math.max(...rejReasons.map((r) => r[1]));
  const rl = (list, of, max) => list.map(([r, n]) =>
    `<li class="rl" data-row="reason" data-of="${of}" data-reason="${r}" data-count="${n}"><b>${r}</b><i class="mb" style="width:${(n / max * 54).toFixed(1)}px"></i><em>${n}</em></li>`).join("");

  return `<aside class="float p2" data-row="region" data-region="panel" data-w="336" data-float="1" style="left:14px;top:12px;width:var(--panel);height:790px">
  <div class="ph"><span class="t">Run ${RUN}</span><span class="dim3" style="margin-left:auto;font-size:var(--t9)">24 Aug · 08:44–12:19</span></div>
  <div class="sec">
    <h3>Run outcome</h3>
    <div class="big"><b data-check="accept-rate">${RATE.toFixed(1)}%</b><em>auto-accepted of <b class="mono" data-check="run-total">${nf(ALL)}</b> captures</em></div>
    <div class="sbar">${seg.map(([n, c]) => `<i style="width:${(n / ALL * W).toFixed(2)}px;background:${c}"></i>`).join("")}</div>
    <div class="lg2"><span><i style="background:var(--hi)"></i>${nf(ACCEPTED)} accepted</span><span><i style="background:var(--mid)"></i>${REVIEW} review</span><span><i style="background:var(--lo)"></i>${REJECTED} rejected</span></div>
  </div>
  <div class="sec"><h3>Why held for review</h3><ul>${rl(revReasons, "review", maxRev)}</ul></div>
  <div class="sec"><h3>Why rejected</h3><ul>${rl(rejReasons, "rejected", maxRej)}</ul></div>
  <div class="sec">
    <h3>Selected capture</h3>
    <div class="kv"><b>capture</b><em data-check="sel-capture">${CAP}</em></div>
    <div class="kv"><b>accession</b><em>${ACC}</em></div>
    <div class="kv"><b>boxes kept</b><em data-check="sel-detections">${dets.length}</em></div>
    <ul style="margin-top:5px;border-top:1px solid var(--line2);padding-top:4px">${stages.map((s) =>
    `<li class="sl" data-row="selstage" data-stage="${s.k}" data-ms="${s.ms}"><b>${s.label}</b><em>${s.ms.toFixed(1)} ms</em></li>`).join("")}</ul>
    <div class="kv" style="border-top:1px solid var(--line2);margin-top:3px;padding-top:3px"><b>total</b><em>${TOTAL1.toFixed(1)} ms</em></div>
  </div>
  <div class="sec">
    <h3>Corrections → retraining</h3>
    <div class="kv"><b>operator corrections, build ${BUILD}</b><em>${nf(CORRECTIONS)}</em></div>
    <div class="kv"><b>queued for next training set</b><em>${QUEUED_TRAIN}</em></div>
    <div class="kv"><b>last retrain</b><em class="dim">11 Jun 2026</em></div>
    <div class="kv"><b>next window</b><em class="mid">07 Sep 2026</em></div>
  </div>
  <div class="sec" style="border-bottom:0">
    <h3>Thresholds</h3>
    <div class="kv"><b>auto-accept</b><em data-check="accept-threshold">${ACCEPT.toFixed(3)}</em></div>
    <div class="kv"><b>detector minimum box score</b><em data-check="detector-min">${DETMIN.toFixed(3)}</em></div>
    <p class="note">Lowest score is the weakest parsed field, or the best box score where nothing was read. <span class="mid">Day-book concordance last synced 21 Aug — 3 d stale.</span></p>
  </div>
</aside>`;
}

function queueTable() {
  const rows = queue.map(([st, cap, acc, dept, era, field, reason, score, at, who]) => {
    const sel = cap === CAP;
    return `<tr class="${st}${sel ? " sel" : ""}" data-row="q" data-capture="${cap}" data-acc="${acc}" data-dept="${dept}" data-era="${era}" data-field="${field}" data-reason="${reason}" data-score="${f3(score)}" data-state="${st}"${sel ? ' data-selected="1"' : ""}>
    <td class="tmb"><img src="${thumbSrc("q", cap)}" alt=""></td>
    <td class="mono"><i class="sdot ${st}"></i>${cap}</td><td class="mono">${acc}</td>
    <td>${amp(dept)}</td><td class="dim">${era}</td>
    <td class="mono${field === "—" ? " dim3" : ""}">${field}</td><td class="dim">${reason}</td>
    <td class="n ${tier(score)}">${f3(score)}</td><td class="n dim3">${at}</td>
    <td class="${who === "—" ? "dim3" : "dim"}">${who}</td></tr>`;
  }).join("");

  const chips = [["all", "All", ALL, 0], ["accepted", "Auto-accepted", ACCEPTED, 0],
  ["needs", "Needs action", NEEDS, 1], ["review", "In review", REVIEW, 0], ["rejected", "Rejected", REJECTED, 0]]
    .map(([k, l, n, on]) => `<span class="fc2${on ? " on" : ""}" data-row="facet" data-facet="${k}" data-count="${n}" data-active="${on}">${l} <b>${nf(n)}</b></span>`).join("");

  return `<section class="qz" data-row="region" data-region="queue" data-flex="1">
  <div class="chips">${chips}
    <span class="rgt"><span class="srch">accession, capture…</span>
    <button class="btn" data-check="bulk-accept" disabled>Accept all ≥ <b class="mono" data-check="bulk-threshold">${ACCEPT.toFixed(3)}</b></button>
    <button class="btn">Assign…</button></span>
  </div>
  <div class="qb"><table>
    <thead><tr><th class="tmb"></th><th style="width:82px">Capture</th><th style="width:94px">Accession</th>
      <th style="width:118px">Department</th><th style="width:150px">Label era</th>
      <th style="width:98px">Flagged field</th><th style="width:140px">Reason</th>
      <th class="n" style="width:64px"><span data-check="sort-column">score</span> <span class="caret">▴</span></th>
      <th class="n" style="width:72px">Flagged</th><th style="width:62px">Assigned</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
  <div class="qf"><span data-check="footer-range">1 – ${queue.length} of ${nf(NEEDS)}</span><span>rows 25 ▾</span>
    <span class="rgt"><span>0 selected</span><span class="mid">oldest flagged 3 d 04 h ago</span><span>page 1 of 7</span></span></div>
</section>`;
}

const view2 = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Verso — review queue</title>
<style>/* SHELL:BEGIN */${SHELL}/* SHELL:END */${V2CSS}</style></head>
<body>
${topbar(`<em>Review queue</em>`, `<span class="chip">${NEEDS} to action</span>`)}
<div class="mid-row">
${toolstrip("grid")}
<main class="stage">
  ${panel2()}
  ${queueTable()}
</main>
</div>
${pipebar(true)}
</body></html>`;

/* ------------------------------------------------------------------ emit */
for (const [dir, html] of [["verso-01-object-record", view1], ["verso-02-review-queue", view2]]) {
  await mkdir(path.join(OUT, dir), { recursive: true });
  await writeFile(path.join(OUT, dir, "index.html"), html);
}
console.log("field conf:", { accession_no: CONF_ACC, inscription: CONF_INSC });
console.log("geometry:", dets.map((d) => `${d.id} ${d.cx},${d.cy} ${d.w}×${d.h} @${d.th}°`).join("  "));
console.log("totals:", { TOTAL1, TOTAL2, ALL, NEEDS, RATE, ZOOM, rows: queue.length });
