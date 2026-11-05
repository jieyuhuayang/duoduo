// The three enumerations of AGENT_INTERNALS_ANALYSIS.md Appendix B must equal
// the sets the daemon bundle holds.
//
// Every other doc check binds one citation to one declaration. An appendix
// that claims to list EVERY event type, EVERY RPC method or EVERY allowlisted
// method makes a claim about a set, and a set is refuted by one name the
// bundle has and the table lacks (a release added a method) or one the table
// has and the bundle lost. Nothing checked that: at v0.8.4 the three RPC
// methods added that release were counted ("36 methods") by hand. This tool
// derives each set from the bundle and compares it with the backticked names
// in the appendix (cog's check mode, research record §6: the generated part
// of a doc is regenerated and compared, never trusted):
//
//   B.1  event types written through createSpineEvent: the `type:` of the
//        object literal at every call of its mangled name. A string literal
//        counts as written; an identifier is resolved to the module-level
//        constant it names (`vA = "external.record"`); a member of a
//        parameter (`t.eventType`) is resolved through the enclosing
//        declaration's first-party callers (xref `refBy`): every
//        `<prop>: "<string>"` they write. Anything else fails the check.
//   B.2  RPC methods the dispatcher recognises: inside createDaemon, the
//        strings compared with `<v>.method === "…"`, for the `<v>` with the
//        most distinct names (the request parameter of the dispatcher; the
//        other variables are the WebSocket subscription and worker paths).
//   B.3  the read-only TCP allowlist: the Set that createDaemon tests with
//        `!<set>.has(<v>.method)` before rejecting a write method, read as
//        the `new Set([…])` literal that initialises it.
// Doc side: B.1 and B.2 are the backticked names in the first (B.1) or second
// (B.2) column of the subsection's table, several per cell allowed; B.3 is
// the backticked names of the subsection's first sentence, up to its first
// `；` (the sentence goes on to name methods the port refuses).
//
// --mutate: also runs the comparison on mutated copies of the doc (a name
// added to each table, a name removed from each, a B.3 name swapped for a
// B.2-only one) and requires every mutant to fail, as mutate_anchor_checks.mjs
// does for the anchor checkers; a checker that has never failed proves
// nothing.
//
// Usage: node check_appendix_sets.mjs --index <symbols_daemon.json> --xref <xref_daemon.json>
//          --bundle <daemon.pretty.js> [--mutate] [--json <o.json>] <AGENT_INTERNALS_ANALYSIS.md>
// Exit 0 when all three sets agree (and, with --mutate, every mutant fails);
// 1 listing every missing and extra name; 2 on a usage or derivation error.
import fs from "node:fs";
import { parse } from "@babel/parser";
import { assertBundleMatchesIndex } from "./bundle_guard.mjs";

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const INDEX = opt("--index"), XREF = opt("--xref"), BUNDLE = opt("--bundle"), JSON_OUT = opt("--json"), MUTATE = flag("--mutate");
const DOC = argv[0];
if (!INDEX || !XREF || !BUNDLE || !DOC) {
  console.error("usage: node check_appendix_sets.mjs --index <symbols_daemon.json> --xref <xref_daemon.json> --bundle <daemon.pretty.js> [--mutate] [--json <o.json>] <AGENT_INTERNALS_ANALYSIS.md>");
  process.exit(2);
}
const index = JSON.parse(fs.readFileSync(INDEX, "utf8"));
const xref = JSON.parse(fs.readFileSync(XREF, "utf8"));
const src = fs.readFileSync(BUNDLE, "utf8");
const lines = src.split("\n");
assertBundleMatchesIndex(lines, index, BUNDLE);
const sym = (real) => { const e = index.symbols[real]; if (!e) { console.error(`${real} is not in the index`); process.exit(2); } return e; };
const spanOf = (e) => lines.slice(e.line - 1, e.endLine).join("\n");
const enclosing = (line) => Object.entries(index.symbols).find(([, e]) => e.line <= line && line <= e.endLine);

// --- B.1: event types written through createSpineEvent ---------------------------
function eventTypesFromBundle() {
  const spine = sym("createSpineEvent");
  const ast = parse(src, { sourceType: "module" });
  const consts = new Map();
  for (const s of ast.program.body) if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier" && d.init?.type === "StringLiteral") consts.set(d.id.name, d.init.value);
  const types = new Set(), problems = [];
  const seen = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n.type === "CallExpression" && n.callee.type === "Identifier" && n.callee.name === spine.mangled) {
      const a = n.arguments[0], line = n.loc.start.line;
      const p = a?.type === "ObjectExpression" ? a.properties.find((x) => x.type === "ObjectProperty" && !x.computed && x.key.name === "type") : null;
      if (!p) problems.push(`line ${line}: createSpineEvent call without a literal \`type:\` property`);
      else if (p.value.type === "StringLiteral") types.add(p.value.value);
      else if (p.value.type === "Identifier" && consts.has(p.value.name)) types.add(consts.get(p.value.name));
      else if (p.value.type === "MemberExpression" && p.value.object.type === "Identifier" && p.value.property.type === "Identifier" && !p.value.computed) {
        // `t.eventType`: what the enclosing declaration's callers pass
        const prop = p.value.property.name;
        const [real] = enclosing(line) || [];
        const callers = real ? xref.symbols[real]?.refBy || [] : [];
        if (!callers.length) problems.push(`line ${line}: type is \`${p.value.object.name}.${prop}\` and the enclosing declaration has no first-party callers`);
        let found = 0;
        for (const c of callers) for (const m of spanOf(sym(c)).matchAll(new RegExp("\\b" + prop + "\\s*:\\s*\"([^\"]+)\"", "g"))) { types.add(m[1]); found++; }
        if (callers.length && !found) problems.push(`line ${line}: type is \`${p.value.object.name}.${prop}\`, and none of ${callers.join(", ")} writes \`${prop}: "…"\``);
      } else problems.push(`line ${line}: createSpineEvent type is a ${p.value.type}, which this check cannot resolve`);
    }
    for (const k in n) { const v = n[k]; if (v && typeof v === "object") walk(v); }
  })(ast.program);
  return { set: types, problems };
}

// --- B.2: the dispatcher's method strings ------------------------------------------
function rpcMethodsFromBundle() {
  const span = spanOf(sym("createDaemon"));
  const byVar = new Map();
  for (const m of span.matchAll(/([A-Za-z_$][\w$]*)\.method === "([^"]+)"/g)) { if (!byVar.has(m[1])) byVar.set(m[1], new Set()); byVar.get(m[1]).add(m[2]); }
  const best = [...byVar.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  if (!best) return { set: new Set(), problems: ["createDaemon compares no `<v>.method === \"…\"`"] };
  return { set: best[1], problems: [], variable: best[0] };
}

// --- B.3: the read-only allowlist -------------------------------------------------------
function allowlistFromBundle() {
  // the test whose rejection names the read-only port; createDaemon also
  // tests the pi worker's four methods the same way
  const span = spanOf(sym("createDaemon"));
  const m = span.split("\n").map((l) => /read-only/.test(l) && l.match(/!([A-Za-z_$][\w$]*)\.has\(([A-Za-z_$][\w$]*)\.method\)/)).find(Boolean);
  if (!m) return { set: new Set(), problems: ["createDaemon has no `!<set>.has(<v>.method)` test on a line that mentions the read-only port"] };
  const lit = src.match(new RegExp("(?<![\\w$])" + m[1].replace(/\$/g, "\\$") + " = new Set\\(\\[([^\\]]*)\\]\\)"));
  if (!lit) return { set: new Set(), problems: [`the allowlist \`${m[1]}\` is not initialised with a \`new Set([…])\` literal`] };
  return { set: new Set([...lit[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])), problems: [], variable: m[1] };
}

// --- the doc ------------------------------------------------------------------------------------
function subsection(text, heading) {
  const i = text.indexOf(`\n### ${heading}`);
  if (i < 0) return null;
  const rest = text.slice(i + 1);
  const j = rest.search(/\n#{2,3} /);
  return j < 0 ? rest : rest.slice(0, j);
}
const backticked = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
function tableColumn(sec, col) {
  const out = new Set();
  const rows = sec.split("\n").filter((l) => /^\s*\|/.test(l));
  for (const row of rows.slice(2)) { // header and separator
    const cells = row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|");
    for (const n of backticked(cells[col] || "")) out.add(n);
  }
  return out;
}
function docSets(text) {
  const b1 = subsection(text, "B.1"), b2 = subsection(text, "B.2"), b3 = subsection(text, "B.3");
  const problems = [];
  if (!b1 || !b2 || !b3) problems.push("Appendix B must have subsections `### B.1`, `### B.2` and `### B.3`");
  const first = (b3 || "").split("\n").find((l) => l.trim() && !/^#/.test(l)) || "";
  const sentence = first.split("；")[0];
  const sets = {
    "B.1": b1 ? tableColumn(b1, 0) : new Set(),
    "B.2": b2 ? tableColumn(b2, 1) : new Set(),
    "B.3": new Set(backticked(sentence).filter((n) => /^[a-z_]+(?:\.[a-z_]+)+$/.test(n))),
  };
  if (!sets["B.3"].size) problems.push("B.3: no backticked dotted names before the first `；` of its first sentence");
  return { sets, problems };
}

// --- compare -------------------------------------------------------------------------------
const bundleSets = { "B.1": eventTypesFromBundle(), "B.2": rpcMethodsFromBundle(), "B.3": allowlistFromBundle() };
function compare(text) {
  const d = docSets(text);
  const report = { ok: true, sets: {} };
  for (const k of ["B.1", "B.2", "B.3"]) {
    const want = bundleSets[k].set, have = d.sets[k];
    const missing = [...want].filter((n) => !have.has(n)).sort(), extra = [...have].filter((n) => !want.has(n)).sort();
    const problems = [...bundleSets[k].problems, ...d.problems];
    report.sets[k] = { bundle: [...want].sort(), doc: [...have].sort(), missing, extra, problems };
    if (missing.length || extra.length || problems.length) report.ok = false;
  }
  return report;
}
const text = fs.readFileSync(DOC, "utf8");
const clean = compare(text);
for (const [k, r] of Object.entries(clean.sets)) {
  const status = r.missing.length || r.extra.length || r.problems.length ? "FAIL" : "ok";
  console.log(`${status.padEnd(5)} ${k}: bundle ${r.bundle.length}, doc ${r.doc.length}` +
    (r.missing.length ? `; missing from the doc: ${r.missing.join(", ")}` : "") + (r.extra.length ? `; in the doc but not the bundle: ${r.extra.join(", ")}` : ""));
  for (const p of r.problems) console.log(`      ${p}`);
}
let rc = clean.ok ? 0 : 1;

if (MUTATE) {
  // mutants: each must fail
  const b1 = subsection(text, "B.1"), b2 = subsection(text, "B.2"), b3 = subsection(text, "B.3");
  const firstRow = (sec) => sec.split("\n").filter((l) => /^\s*\|/.test(l))[2];
  const r1 = firstRow(b1), r2 = firstRow(b2);
  const b3First = b3.split("\n").find((l) => l.trim() && !/^#/.test(l));
  const b3Names = backticked(b3First.split("；")[0]).filter((n) => /^[a-z_]+\.[a-z_.]+$/.test(n));
  const b2Only = [...bundleSets["B.2"].set].find((n) => !bundleSets["B.3"].set.has(n));
  const mutants = [
    ["B.1 extra event type", text.replace(r1, r1 + "\n| `event.invented` | `rpc` | 否 | 5.2 |")],
    ["B.1 missing event type", text.replace(r1 + "\n", "")],
    ["B.2 extra method", text.replace(r2, r2 + "\n| system | `system.invented` | 内联 | 6.1 |")],
    ["B.2 missing method", text.replace(r2 + "\n", "")],
    ["B.3 name swapped for a B.2-only one", b2Only && b3Names[0] ? text.replace(b3First, b3First.replace("`" + b3Names[0] + "`", "`" + b2Only + "`")) : null],
    ["B.3 name dropped", b3Names[0] ? text.replace(b3First, b3First.replace("`" + b3Names[0] + "`、", "")) : null],
  ];
  for (const [label, mutated] of mutants) {
    if (!mutated || mutated === text) { console.log(`skip  mutant: ${label} (could not be built)`); continue; }
    const r = compare(mutated);
    const which = Object.entries(r.sets).filter(([, s]) => s.missing.length || s.extra.length).map(([k, s]) => `${k} -${s.missing.length}/+${s.extra.length}`).join(", ");
    if (r.ok) { console.log(`FAIL  mutant survived: ${label}`); rc = 1; }
    else console.log(`ok    mutant caught: ${label} (${which})`);
  }
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ doc: DOC, bundle: BUNDLE, ok: clean.ok, rpcVariable: bundleSets["B.2"].variable, allowlistVariable: bundleSets["B.3"].variable, sets: clean.sets }, null, 1) + "\n");
console.log(rc ? "appendix sets: FAIL" : "appendix sets: pass");
process.exit(rc);
