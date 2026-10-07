// Turn a trace written by an instrument.mjs daemon into a readable report.
//
// The trace is one JSON line per event (enter / exit / fail, plus `mark` lines
// a scenario script appends between its steps). This tool rebuilds the call
// tree from the parent ids, splits it at the marks into phases, and writes
// Markdown: per phase, the functions that ran in order of first entry, the
// tree (consecutive identical siblings collapsed as ×n), and every failure;
// then a table of all functions with call counts and total time.
//
// Usage: node trace_report.mjs <trace.jsonl> [--depth <N>] [--filter <regex>] [--out <report.md>] [--json <o.json>]
//   --depth   how deep the tree is printed (default 6)
//   --filter  print only subtrees whose root name matches
import fs from "node:fs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const DEPTH = Number(opt("--depth", 6));
const FILTER = opt("--filter", null);
const OUT = opt("--out", null);
const JSON_OUT = opt("--json", null);
const TRACE = argv[0];
if (!TRACE) { console.error("usage: node trace_report.mjs <trace.jsonl> [--depth N] [--filter regex] [--out report.md] [--json o.json]"); process.exit(2); }

const events = fs.readFileSync(TRACE, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const nodes = new Map(); // id -> { id, name, a, parent, children, dur, err, seq, t }
const phases = [{ name: "(before first mark)", roots: [], from: 0 }];
for (const e of events) {
  if (e.ev === "mark") { phases.push({ name: e.name, roots: [], from: e.seq ?? 0, t: e.t }); continue; }
  if (e.ev === "enter") {
    // a call belongs to the phase current when it was entered; a call whose
    // parent was entered in an earlier phase (an RPC handler running under the
    // long-lived main(), say) is a root of its own phase
    const phase = phases.length - 1;
    const n = { id: e.id, name: e.name, a: e.a, parent: e.parent, children: [], dur: null, err: null, seq: e.seq, t: e.t, phase };
    nodes.set(e.id, n);
    const p = nodes.get(e.parent);
    if (p && p.phase === phase) p.children.push(n); else phases[phase].roots.push(n);
  } else if (e.ev === "exit") { const n = nodes.get(e.id); if (n) n.dur = e.dur; }
  else if (e.ev === "fail") { const n = nodes.get(e.id); if (n) n.err = e.err; }
}

const re = FILTER ? new RegExp(FILTER) : null;
const lines = [];
const fmtArgs = a => !a || !a.length ? "" : " " + a.map(x => typeof x === "string" ? JSON.stringify(x) : typeof x === "object" && x ? "{" + Object.keys(x).slice(0, 5).join(",") + "}" : String(x)).join(", ").slice(0, 160);
function printTree(list, depth, indent) {
  if (depth > DEPTH) { if (list.length) lines.push(`${indent}… (${list.length} deeper calls)`); return; }
  // collapse runs of the same name
  let i = 0;
  while (i < list.length) {
    let j = i;
    while (j + 1 < list.length && list[j + 1].name === list[i].name && !list[j + 1].children.length && !list[i].children.length) j++;
    const n = list[i], run = j - i + 1;
    lines.push(`${indent}${n.name}${run > 1 ? ` ×${run}` : fmtArgs(n.a)}${n.dur != null && run === 1 ? ` [${n.dur}ms]` : ""}${n.err ? `  ✗ ${n.err}` : ""}`);
    if (run === 1) printTree(n.children, depth + 1, indent + "  ");
    i = j + 1;
  }
}
function firstOrder(roots) {
  const seen = new Set(), order = [];
  const walk = n => { if (!seen.has(n.name)) { seen.add(n.name); order.push(n.name); } n.children.forEach(walk); };
  roots.forEach(walk);
  return order;
}
function fails(roots) { const out = []; const walk = n => { if (n.err) out.push(n); n.children.forEach(walk); }; roots.forEach(walk); return out; }
const totals = new Map();
for (const n of nodes.values()) { const t = totals.get(n.name) ?? totals.set(n.name, { calls: 0, ms: 0, fails: 0 }).get(n.name); t.calls++; t.ms += n.dur ?? 0; if (n.err) t.fails++; }

lines.push(`# Trace report: ${TRACE}`, "", `${events.length} events, ${nodes.size} calls, ${totals.size} distinct functions, ${phases.length - 1} marks.`, "");
const summary = [];
for (const ph of phases) {
  if (!ph.roots.length && ph.name === "(before first mark)") continue;
  const roots = re ? ph.roots.filter(r => re.test(r.name)) : ph.roots;
  lines.push(`## ${ph.name}`, "");
  const order = firstOrder(roots);
  lines.push(`Functions in order of first entry (${order.length}): ${order.join(", ")}`, "");
  const f = fails(roots);
  if (f.length) { lines.push(`Failures (${f.length}):`); for (const n of f) lines.push(`- ${n.name}: ${n.err}`); lines.push(""); }
  lines.push("```", ...(() => { const save = lines.length; printTree(roots, 1, ""); return lines.splice(save); })(), "```", "");
  summary.push({ phase: ph.name, functions: order, failures: f.map(n => ({ name: n.name, err: n.err })) });
}
lines.push(`## All functions`, "", `| function | calls | total ms | fails |`, `|---|---|---|---|`);
for (const [name, t] of [...totals].sort((a, b) => b[1].calls - a[1].calls)) lines.push(`| ${name} | ${t.calls} | ${t.ms} | ${t.fails} |`);
const md = lines.join("\n") + "\n";
if (OUT) fs.writeFileSync(OUT, md); else process.stdout.write(md);
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ trace: TRACE, events: events.length, calls: nodes.size, phases: summary, totals: Object.fromEntries(totals) }, null, 1) + "\n");
