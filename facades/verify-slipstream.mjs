// Coherence verifier for the Slipstream facade pair.
//
// It does NOT hold its own copy of the data. It reads the three index.html files,
// scrapes the values that are actually rendered, and asserts the arithmetic
// between them. A transcription slip in the markup fails the run; a slip in a
// duplicated data model could not.
//
//   node facades/verify-slipstream.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const V1 = path.join(here, "slipstream-01-rollout-console", "index.html");
const V2 = path.join(here, "slipstream-02-gates-policy", "index.html");
const V3 = path.join(here, "slipstream-03-edge-protection", "index.html");

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

// Every <tr data-row="kind"> becomes its data-attributes plus the visible text
// of each cell, so attributes and rendered text can be checked against each other.
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

// Text rendered inside the element carrying data-check="<name>".
function checked(html, name) {
  const m = html.match(new RegExp(`data-check="${name}"[^>]*>([^<]*)<`));
  if (!m) throw new Error(`no element with data-check="${name}"`);
  return squash(m[1]);
}

const num = (s) => Number(String(s).replace(/[^0-9.\-]/g, ""));
const round = (v, dp) => Number(v.toFixed(dp));
const secs = (s) => {
  const m = s.match(/(\d\d):(\d\d):(\d\d)/);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
};

const html1 = await readFile(V1, "utf8");
const html2 = await readFile(V2, "utf8");
const html3 = await readFile(V3, "utf8");

console.log("\x1b[1mSlipstream — numeric coherence\x1b[0m");

/* ------------------------------------------------------------------ */
/* View 1 — rollout console                                            */
/* ------------------------------------------------------------------ */

const regions = rows(html1, "region");
chain(0, "shape");
ok(0, "region rows present", regions.length, 8);

chain(1, "instance totals roll up to the headline rollout figure");

const totalInstances = regions.reduce((s, r) => s + Number(r.total), 0);
const newInstances = regions.reduce((s, r) => s + Number(r.new), 0);

ok(1, "Σ instances", totalInstances, num(checked(html1, "total-instances")));
ok(1, "Σ instances on the new version", newInstances, num(checked(html1, "new-instances")));
ok(
  1,
  "headline rollout % = new / total",
  round((newInstances / totalInstances) * 100, 1),
  num(checked(html1, "rollout-pct"))
);

chain(2, "each region's canary % reproduces its own instance fraction");

for (const r of regions) {
  const pct = Number(r.pct);
  ok(2, `${r.region} ${pct}% of ${r.total}`, Number(r.new), Math.round((pct / 100) * Number(r.total)));
  const cell = r._cells.find((c) => /^\d+\s*\/\s*\d+$/.test(c));
  ok(2, `${r.region} instances cell`, cell.replace(/\s/g, ""), `${r.new}/${r.total}`);
}

chain(3, "region status counts agree with the status tile");

const tally = {};
for (const r of regions) tally[r.status] = (tally[r.status] || 0) + 1;
const breakdown = checked(html1, "status-breakdown");
ok(3, "Σ status counts", Object.values(tally).reduce((a, b) => a + b, 0), regions.length);
for (const [k, v] of Object.entries(tally)) {
  const m = breakdown.match(new RegExp(`(\\d+) ${k}(?![a-z-])`));
  ok(3, `"${k}" in the breakdown line`, m ? Number(m[1]) : null, v);
}
ok(3, "promoted tile", tally.promoted || 0, num(checked(html1, "regions-promoted")));
ok(3, "region-count tile", regions.length, num(checked(html1, "regions-total")));

chain(4, "headline error rate = instance-weighted mean over fresh regions only");

const contributing = regions.filter((r) => r.err !== "" && r.stale !== "true" && Number(r.new) > 0);
const wSum = contributing.reduce((s, r) => s + Number(r.new) * Number(r.err), 0);
const wCount = contributing.reduce((s, r) => s + Number(r.new), 0);

ok(4, "weighted denominator", wCount, num(checked(html1, "err-weight")));
ok(4, "instances excluded as stale", newInstances - wCount, num(checked(html1, "err-excluded")));
ok(4, "weighted error rate %", round(wSum / wCount, 3), num(checked(html1, "err-rate")));
ok(4, "exactly one region is stale", regions.filter((r) => r.stale === "true").length, 1);
ok(4, "headline sits under the halt limit", round(wSum / wCount, 3) < num(checked(html1, "gate-limit-5xx")), true);
ok(
  4,
  "the stale region is nonetheless still rolling out",
  regions.find((r) => r.stale === "true").status,
  "promoting"
);

chain(5, "the event log replays the region table");

const log = [...html1.matchAll(/<div class="log__ln"[^>]*data-log="([^"]*)"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => ({
  tag: m[1],
  line: text(m[2]),
}));

ok(5, "log lines present", log.length >= 14, true);

const stamps = log.map((l) => secs(l.line));
ok(5, "timestamps strictly descending", stamps.every((s, i) => i === 0 || s < stamps[i - 1]), true);
const now = secs(checked(html1, "clock"));
ok(5, "no log entry later than the clock", stamps.every((s) => s <= now), true);

for (const l of log) {
  const frac = l.line.match(/\((\d+)\/(\d+)\)/);
  const reg = l.line.match(/\b([a-z]{2}-[a-z]+-\d)\b/);
  if (!frac || !reg) continue;
  const row = regions.find((r) => r.region === reg[1]);
  ok(5, `${reg[1]} log fraction denominator`, Number(frac[2]), Number(row.total));
  const step = l.line.match(/(\d+)% → (\d+)%/);
  if (step) {
    ok(
      5,
      `${reg[1]} log ${step[2]}% ⇒ ${frac[1]}`,
      Number(frac[1]),
      Math.round((Number(step[2]) / 100) * Number(row.total))
    );
  }
}

const rb = regions.find((r) => r.status === "rolled-back");
const rbDone = log.find((l) => l.tag === "rollback:complete");
const rbStart = log.find((l) => l.tag === "rollback:start");
ok(5, "rollback line names the rolled-back region", rbDone.line.includes(rb.region), true);
ok(5, "rolled-back region shows 0 on the new version", Number(rb.new), 0);
ok(5, "rollback line restores the full fleet", rbDone.line.includes(`${rb.total}/${rb.total}`), true);
const dur = rbDone.line.match(/\((\d+)m (\d+)s\)/);
ok(5, "rollback duration = complete − start", secs(rbDone.line) - secs(rbStart.line), +dur[1] * 60 + +dur[2]);

chain(6, "elapsed = clock − release start");

const elapsed = checked(html1, "elapsed").match(/(\d+)m (\d+)s/);
ok(6, "elapsed", now - secs(log[log.length - 1].line), +elapsed[1] * 60 + +elapsed[2]);
ok(6, "start time caption", checked(html1, "started"), log[log.length - 1].line.slice(0, 8));

chain(7, "the gate panel is bound to the region that is actually blocked");

const gates = rows(html1, "gate");
const blocked = regions.find((r) => r.status === "holding");
ok(7, "panel region = the holding region", checked(html1, "gate-panel-region"), blocked.region);
ok(7, "gates passing", gates.filter((g) => g.verdict === "pass").length, num(checked(html1, "gates-passing")));
ok(7, "gates evaluated", gates.length, num(checked(html1, "gates-total")));
ok(7, "at least one gate fails", gates.some((g) => g.verdict === "fail"), true);
ok(7, "at least one gate warns", gates.some((g) => g.verdict === "warn"), true);

const g5xx = gates.find((g) => g.gate === "http-5xx");
ok(7, "failing gate observed = that region's error rate", Number(g5xx.observed), Number(blocked.err));
ok(7, "failing gate exceeds its limit", Number(g5xx.observed) > Number(g5xx.limit), true);
for (const g of gates) {
  if (g.verdict === "pass") ok(7, `${g.gate} passes inside its limit`, Number(g.observed) < Number(g.limit), true);
  if (g.verdict === "warn") ok(7, `${g.gate} sits exactly at its limit`, Number(g.observed), Number(g.limit));
}

chain(8, "the second, collapsed release is internally consistent");

ok(
  8,
  "secondary release %",
  round((num(checked(html1, "rel2-new")) / num(checked(html1, "rel2-total"))) * 100, 1),
  num(checked(html1, "rel2-pct"))
);

/* ------------------------------------------------------------------ */
/* View 2 — gates & policy                                             */
/* ------------------------------------------------------------------ */

chain(9, "gate policy: firings split by action and sum to total firings");

const policy = rows(html2, "policy");
const enforced = policy.filter((p) => p.state !== "draft");
ok(9, "policy rows", policy.length, num(checked(html2, "gates-defined")));
ok(9, "enforced gates", enforced.length, num(checked(html2, "gates-enforced")));
ok(9, "draft gates carry no limit", policy.filter((p) => p.state === "draft").every((p) => p.limit === ""), true);
ok(9, "draft gate has never fired", policy.filter((p) => p.state === "draft").every((p) => Number(p.fired) === 0), true);

const haltFirings = enforced.filter((p) => p.action === "halt").reduce((s, p) => s + Number(p.fired), 0);
const warnFirings = enforced.filter((p) => p.action === "warn").reduce((s, p) => s + Number(p.fired), 0);
ok(9, "Σ halt-gate firings", haltFirings, num(checked(html2, "halt-firings")));
ok(9, "Σ warn-gate firings", warnFirings, num(checked(html2, "warn-firings")));
ok(9, "Σ all firings", haltFirings + warnFirings, num(checked(html2, "total-firings")));

chain(10, "90-day outcomes partition, and precision/recall derive from them");

const clean = num(checked(html2, "out-clean"));
const halted = num(checked(html2, "out-halted"));
const rolledBack = num(checked(html2, "out-rolledback"));
const attempted = num(checked(html2, "out-attempted"));
ok(10, "clean + halted + rolled back = attempted", clean + halted + rolledBack, attempted);
ok(10, "gate actions = halt-gate firings", halted + rolledBack, haltFirings);

const confirmed = num(checked(html2, "out-confirmed"));
const falseHalt = num(checked(html2, "out-false"));
const missed = num(checked(html2, "out-missed"));
ok(10, "confirmed + false = gate actions", confirmed + falseHalt, halted + rolledBack);
ok(10, "missed ≤ clean rollouts", missed <= clean, true);

const shippedClean = num(checked(html2, "out-shipped-clean"));
ok(10, "shipped clean = completed − missed", clean - missed, shippedClean);
ok(10, "the four outcome rows partition the window", confirmed + falseHalt + missed + shippedClean, attempted);
ok(10, "precision = confirmed / actions", round((confirmed / (confirmed + falseHalt)) * 100, 1), num(checked(html2, "precision")));
ok(10, "recall = confirmed / all regressions", round((confirmed / (confirmed + missed)) * 100, 1), num(checked(html2, "recall")));
ok(10, "total regressions", confirmed + missed, num(checked(html2, "regressions")));

chain(11, "policy version history: each backtest precision matches its own counts");

const versions = rows(html2, "version");
ok(11, "version rows", versions.length >= 4, true);
for (const v of versions) {
  if (v.actions === "" || v.confirmed === "") continue;
  ok(11, `${v.version} precision`, round((Number(v.confirmed) / Number(v.actions)) * 100, 1), Number(v.precision));
}
ok(11, "exactly one live version", versions.filter((v) => v.state === "live").length, 1);
ok(11, "exactly one rolled-back version", versions.filter((v) => v.state === "rolled-back").length, 1);
ok(11, "one version has no backtest", versions.filter((v) => v.actions === "").length, 1);

const live = versions.find((v) => v.state === "live");
ok(11, "live version actions = this window's gate actions", Number(live.actions), halted + rolledBack);
ok(11, "live version confirmed = this window's confirmed", Number(live.confirmed), confirmed);

const rolled = versions.find((v) => v.state === "rolled-back");
ok(11, "the rolled-back policy was tighter", Number(rolled.limit) < Number(live.limit), true);
ok(11, "… so it acted more often", Number(rolled.actions) > Number(live.actions), true);
ok(11, "… and was less precise", Number(rolled.precision) < Number(live.precision), true);

chain(12, "cross-screen — view 1's gate panel is view 2's policy, evaluated");

for (const g of gates) {
  const p = policy.find((p) => p.gate === g.gate);
  ok(12, `${g.gate} limit agrees across screens`, Number(g.limit), Number(p.limit));
  ok(12, `${g.gate} action agrees across screens`, g.action, p.action);
}
ok(12, "view 1 evaluates exactly the enforced gates", gates.length, enforced.length);

const p5xx = policy.find((p) => p.gate === "http-5xx");
ok(12, "view 1's quoted halt limit is view 2's 5xx limit", num(checked(html1, "gate-limit-5xx")), Number(p5xx.limit));
ok(12, "the rollback log line quotes that same limit", rbStart.line.includes(Number(p5xx.limit).toFixed(3)), true);
ok(12, "the rolled-back region peaked above that limit", Number(rb.peak) > Number(p5xx.limit), true);
ok(12, "both screens name the same release", checked(html1, "release"), checked(html2, "release"));
ok(12, "both screens name the same live policy", checked(html1, "policy-version"), live.version);

// View 2's audit trail must record, to the second, the two events view 1 shows live.
const audit = [...html2.matchAll(/<div class="log__ln"[^>]*data-log="([^"]*)"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => ({
  tag: m[1],
  line: text(m[2]),
}));
ok(12, "audit lines present", audit.length >= 12, true);
ok(
  12,
  "audit records view 1's halt — same timestamp, observed and limit",
  audit.some(
    (l) =>
      l.line.includes("14:14:08") && l.line.includes(blocked.err) && l.line.includes(Number(p5xx.limit).toFixed(3))
  ),
  true
);
ok(
  12,
  "audit records view 1's rollback — same timestamp and peak",
  audit.some((l) => l.line.includes("14:05:46") && l.line.includes(rb.peak)),
  true
);
ok(
  12,
  "audit records the policy revert that view 2's version table shows",
  audit.some((l) => l.tag === "policy:revert" && l.line.includes(rolled.version) && l.line.includes(rolled.actions)),
  true
);


/* ------------------------------------------------------------------ */
/* View 3 — edge protection                                            */
/* ------------------------------------------------------------------ */

chain(13, "rule groups roll up to every headline figure");

const groups = rows(html3, "group");
ok(13, "rule group rows", groups.length, 7);

const sum = (rs, k) => rs.reduce((a, r) => a + Number(r[k] || 0), 0);
ok(13, "Σ rules", sum(groups, "rules"), num(checked(html3, "rules-total")));
ok(13, "Σ hits", sum(groups, "hits"), num(checked(html3, "hits")));
ok(13, "Σ blocked", sum(groups, "blocked"), num(checked(html3, "blocked")));
ok(13, "Σ false positives", sum(groups, "fp"), num(checked(html3, "fp-total")));
ok(
  13,
  "block rate = blocked / requests",
  round((num(checked(html3, "blocked")) / num(checked(html3, "requests"))) * 100, 3),
  num(checked(html3, "block-pct"))
);
for (const g of groups) {
  const cell = g._cells.find((c) => /^\d+(\.\d+)?%$/.test(c));
  const expected = Number(g.hits) === 0 ? 0 : (Number(g.blocked) / Number(g.hits)) * 100;
  ok(13, `${g.group} block rate`, num(cell), round(expected, Number.isInteger(expected) ? 0 : 1));
}
ok(13, "hits are sorted descending", groups.every((g, i) => i === 0 || Number(g.hits) <= Number(groups[i - 1].hits)), true);

chain(14, "one group is held in monitor and blocks nothing");

const monitor = groups.filter((g) => g.mode === "monitor");
ok(14, "exactly one group in monitor", monitor.length, 1);
const mg = monitor[0];
ok(14, "it blocks nothing", Number(mg.blocked), 0);
ok(14, "…despite non-zero hits", Number(mg.hits) > 0, true);
ok(14, "…and reports no false positives", mg.fp, "");
ok(
  14,
  "enforcing rules = total − the monitored group",
  sum(groups, "rules") - Number(mg.rules),
  num(checked(html3, "rules-enforcing"))
);
ok(14, "the detail panel is bound to that group, not a healthy one", checked(html3, "panel-group"), "API schema validation");

chain(15, "the group panel decomposes exactly the group it is bound to");

const consumers = rows(html3, "consumer");
ok(15, "Σ consumer violations = the group's hits", sum(consumers, "hits"), Number(mg.hits));
ok(15, "at least one consumer is exempt", consumers.some((c) => c.block === "no"), true);
ok(15, "the rest would be blocked", consumers.filter((c) => c.block === "yes").length, consumers.length - 1);

const hours = [...html3.matchAll(/data-h="(\d+)"/g)].map((m) => Number(m[1]));
ok(15, "24 hourly buckets", hours.length, 24);
ok(15, "Σ hourly buckets = the group's hits", hours.reduce((a, b) => a + b, 0), Number(mg.hits));
ok(15, "the labelled peak is the real maximum", Math.max(...hours), num(checked(html3, "hour-peak")));

chain(16, "regional enforcement rolls up, and one region is a real gap");

const regionsP = rows(html3, "regionp");
ok(16, "region rows", regionsP.length, 8);
ok(16, "Σ nodes", sum(regionsP, "nodes"), num(checked(html3, "nodes-total")));
ok(16, "Σ blocked = the blocked headline", sum(regionsP, "blocked"), num(checked(html3, "blocked")));

const off = regionsP.filter((r) => r.mode !== "enforce");
ok(16, "exactly one region not enforcing", off.length, 1);
ok(16, "…and it blocked nothing", Number(off[0].blocked), 0);
ok(16, "enforcing regions", regionsP.length - off.length, num(checked(html3, "regions-enforcing")));
ok(16, "region count", regionsP.length, num(checked(html3, "regions-count")));
ok(
  16,
  "enforcing nodes = total − the unprotected region",
  sum(regionsP, "nodes") - Number(off[0].nodes),
  num(checked(html3, "nodes-enforcing"))
);

chain(17, "cross-screen — views 1 and 3 describe the same estate");

ok(17, "same region count", regionsP.length, regions.length);
for (const rp of regionsP) {
  const r1 = regions.find((r) => r.region === rp.region);
  ok(17, `${rp.region} exists in view 1`, Boolean(r1), true);
  ok(17, `${rp.region} node count matches view 1's instance count`, Number(rp.nodes), Number(r1.total));
}
ok(17, "Σ nodes = view 1's Σ instances", sum(regionsP, "nodes"), totalInstances);
ok(
  17,
  "the unprotected region is the one view 1 has queued last",
  off[0].region,
  regions[regions.length - 1].region
);

/* ------------------------------------------------------------------ */

console.log(
  failures.length
    ? `\n\x1b[31m${failures.length} FAILED\x1b[0m of ${pass + failures.length}\n` + failures.map((f) => "  " + f).join("\n")
    : `\n\x1b[32mAll ${pass} assertions pass.\x1b[0m`
);
process.exit(failures.length ? 1 : 0);
