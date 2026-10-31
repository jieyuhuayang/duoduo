// Names the local bindings of first-party code: the parameters and variables
// inside each renamed daemon declaration, which esbuild left as one or two
// letters and rename.mjs (top-level only) does not touch.
//
// A local gets its name from one of two sources:
//
//   rule    derived from the code at the binding, recomputed at every rebuild
//           and never stored:
//             destructure  `{ sessionKey: e }`         -> sessionKey
//             member       `const e = x.status`        -> status
//             new          `const e = new AbortController()` -> abortController
//             catch        `catch (e)`                  -> err
//             callee       `const e = readStatus(...)`  -> status (a first-party
//                          callee with a verb prefix), or a fixed table of
//                          builtins (`JSON.parse` -> parsed, `Date.now` -> now)
//   map     maps/locals_daemon.json: names proposed by reading the code (an
//           LLM pass over `tasks`, then `record`), keyed by declaration real
//           name and the binding's ctx (local_bindings.mjs), so a name follows
//           its binding into a later release as long as the code next to the
//           binding is unchanged. A map name wins over a rule name.
//
// A name is applied only where it cannot change what any identifier resolves
// to (same checks as rename.mjs, for nested scopes): not already bound in the
// binding's scope, not bound in a scope between any reference and the binding,
// and not a name that some identifier inside the binding's scope reads from an
// enclosing scope or the global object. A rule name that collides gets a
// numeric suffix (`status2`); a map name likewise, and the run reports it.
// ast_equiv.mjs --locals re-proves the result independently.
//
// Commands (TOP is the top-level-renamed bundle rebuild.sh writes as
// $OUT/daemon.recon.top.js; RENAME is that run's rename_daemon.json):
//   apply  TOP RENAME LOCALS OUT.js APPLIED.json
//            write the bundle with local names applied and the list of what
//            was renamed (ast_equiv.mjs --locals reads it). Exit 0; 3 when a
//            map entry no longer locates its binding (stale after a release:
//            re-name it with `tasks`/`record`, or drop it with `prune`); 1 on
//            error.
//   tasks  TOP RENAME LOCALS SUBSYS OUTDIR [--only NN-dir,...]
//            per subsystem, the declarations that still have unnamed locals,
//            with every unnamed local written as $<ordinal> and every named
//            one under its name: OUTDIR/<NN-dir>.md plus .json (the ordinals)
//   record TOP RENAME LOCALS ANSWERS.json...
//            merge answers {realName: {ordinal: name}} into LOCALS
//   prune  TOP RENAME LOCALS
//            drop the map entries that no longer locate their binding
//   rekey  TOP RENAME LOCALS
//            rewrite entries still keyed by the previous ctx scheme (ctx1,
//            local_bindings.mjs) to the current one. apply resolves both, so
//            this is housekeeping, not a precondition: it reports how many
//            entries still use ctx1.
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import fs from "node:fs";
import path from "node:path";
import { collectLocals } from "./local_bindings.mjs";

const [CMD, TOP, RENAME, LOCALS, ...rest] = process.argv.slice(2);
if (!["apply", "tasks", "record", "prune", "rekey"].includes(CMD) || !TOP || !RENAME || !LOCALS) {
  console.error("usage: node name_locals.mjs apply|tasks|record|prune|rekey <top.js> <rename.json> <locals.json> ...");
  process.exit(2);
}

const src = fs.readFileSync(TOP, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8"));
const realSet = new Set(Object.values(rename));
const localsMap = fs.existsSync(LOCALS) ? JSON.parse(fs.readFileSync(LOCALS, "utf8")) : {};
const ast = parse(src, { sourceType: "module" });
const { program, decls } = collectLocals(ast, src, (n) => (realSet.has(n) ? n : undefined));

const FORBIDDEN = new Set(["undefined", "NaN", "Infinity", "arguments", "eval", "let", "static", "yield", "await",
  "implements", "package", "protected", "interface", "private", "public", "async", "of", "get", "set"]);
export const validName = (n) => typeof n === "string" && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n) && t.isValidIdentifier(n, true) && !FORBIDDEN.has(n);

const lowerFirst = (s) => {
  const m = /^[A-Z]+/.exec(s);
  if (!m) return s;
  if (m[0].length === s.length) return s.toLowerCase();
  if (m[0].length === 1) return s[0].toLowerCase() + s.slice(1);
  return s.slice(0, m[0].length - 1).toLowerCase() + s.slice(m[0].length - 1);
};
const VERB = /^(get|read|load|resolve|build|create|compute|parse|fetch|make|find|ensure|normalize|collect|derive|render|format|select|lookup|list|acquire|extract|detect|determine|generate|prepare|merge|to)([A-Z][A-Za-z0-9]*)$/;
function fromCallee(name) {
  const m = VERB.exec(name);
  if (!m) return null;
  let rest = m[2];
  const or = /^Or(?:Create|Load|Init|Make)([A-Z][A-Za-z0-9]*)$/.exec(rest);
  if (or) rest = or[1];
  rest = rest.replace(/(?:SyncOrNull|OrNull|OrThrow|Sync|Safe|Cached)$/, "");
  if (!rest || /^(From|For|By|With|To|Of|And|Or|If)([A-Z]|$)/.test(rest)) return null;
  return lowerFirst(rest);
}
// property names are often snake_case wire fields (`session_key`); a local is camelCase
const camel = (n) => n && n.replace(/[_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[_-]+|[_-]+$/g, "");
const BUILTIN_CALL = {
  "JSON.parse": "parsed", "JSON.stringify": "serialized", "Date.now": "now",
  "Object.keys": "keys", "Object.entries": "entries", "Object.values": "values",
  ".readFileSync": "content", ".readFile": "content", ".existsSync": "exists",
  ".statSync": "stats", ".stat": "stats", ".lstatSync": "stats", ".lstat": "stats",
  ".readdirSync": "dirEntries", ".readdir": "dirEntries", ".split": "parts", ".trim": "trimmed",
};

const occPath = new Map(); // identifier node -> path
for (const d of decls.values()) for (const o of d.occurrences) occPath.set(o.node, o.path);

function ruleName(e) {
  const id = e.binding.identifier;
  const p = occPath.get(id);
  if (!p) return null;
  const par = p.parent, gp = p.parentPath?.parent;
  const keyName = (prop) => !prop.computed && (prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "StringLiteral" ? prop.key.value : null);
  if (par.type === "ObjectProperty" && par.value === id && p.parentPath.parentPath?.node.type === "ObjectPattern")
    return { name: keyName(par), rule: "destructure" };
  if (par.type === "AssignmentPattern" && par.left === id && gp?.type === "ObjectProperty" && gp.value === par &&
      p.parentPath.parentPath.parentPath?.node.type === "ObjectPattern")
    return { name: keyName(gp), rule: "destructure" };
  if (par.type === "CatchClause" && par.param === id) return { name: "err", rule: "catch" };
  if (par.type === "VariableDeclarator" && par.id === id && par.init) {
    let init = par.init;
    if (init.type === "AwaitExpression") init = init.argument;
    if (init.type === "MemberExpression" && !init.computed && init.property.type === "Identifier")
      return { name: init.property.name, rule: "member" };
    if (init.type === "NewExpression" && init.callee.type === "Identifier") {
      const c = init.callee.name;
      if (/^[A-Z]/.test(c) && c.length >= 3 && (realSet.has(c) || !p.scope.getBinding(c))) return { name: lowerFirst(c), rule: "new" };
    }
    if (init.type === "CallExpression") {
      const c = init.callee;
      if (c.type === "Identifier" && realSet.has(c.name) && p.scope.getBinding(c.name)?.scope === program) {
        const n = fromCallee(c.name);
        if (n) return { name: n, rule: "callee" };
      }
      if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") {
        const obj = c.object.type === "Identifier" && !p.scope.getBinding(c.object.name) ? c.object.name : null;
        const n = (obj && BUILTIN_CALL[`${obj}.${c.property.name}`]) || BUILTIN_CALL[`.${c.property.name}`];
        if (n) return { name: n, rule: "callee" };
      }
    }
  }
  return null;
}

// ---- collision-safe assignment ------------------------------------------------
function assign(d, wants) {
  // wants: [{ e, name, source }] in priority order. Returns [{ e, from, to, source, wanted }].
  const local = new Set(d.bindings.map(e => e.binding));
  const finalName = new Map(d.bindings.map(e => [e.binding, e.name]));
  const scopeNames = new Map(); // scope -> Map(name -> binding)
  const namesIn = (s) => {
    if (!scopeNames.has(s)) scopeNames.set(s, new Map(Object.entries(s.bindings).map(([n, b]) => [n, b])));
    return scopeNames.get(s);
  };
  const occOf = new Map();
  for (const o of d.occurrences) if (o.binding && local.has(o.binding)) {
    if (!occOf.has(o.binding)) occOf.set(o.binding, []);
    occOf.get(o.binding).push(o);
  }
  const within = (s, anc) => { for (let q = s; q; q = q.parent) if (q === anc) return true; return false; };
  const nameOf = (o) => (o.binding ? (finalName.get(o.binding) ?? o.node.name) : o.node.name);
  function ok(b, y) {
    if (!validName(y)) return false;
    const own = namesIn(b.scope).get(y);
    if (own && own !== b) return false;
    for (const o of occOf.get(b) || []) {
      for (let s = o.scope; s && s !== b.scope; s = s.parent) if (namesIn(s).has(y)) return false;
    }
    for (const o of d.occurrences) {
      if (o.binding === b || nameOf(o) !== y || !within(o.scope, b.scope)) continue;
      if (!o.binding) return false;                                   // a global read inside
      if (o.binding.scope !== b.scope && within(b.scope, o.binding.scope)) return false; // an outer binding read inside
    }
    return true;
  }
  const done = [];
  const taken = new Set();
  for (const w of wants) {
    const b = w.e.binding;
    if (taken.has(b) || !w.name || w.name === w.e.name) continue;
    let y = null;
    for (let i = 1; i <= 9 && !y; i++) { const c = i === 1 ? w.name : `${w.name}${i}`; if (ok(b, c)) y = c; }
    if (!y) continue;
    const from = finalName.get(b);
    namesIn(b.scope).delete(from);
    namesIn(b.scope).set(y, b);
    finalName.set(b, y);
    taken.add(b);
    done.push({ e: w.e, from, to: y, source: w.source, wanted: w.name });
  }
  return { done, occOf };
}

// the binding a map entry names: by the current ctx, else by the previous
// scheme (an entry written before it; `legacy`)
const keysOf = new Map();
function locate(d, m) {
  if (!keysOf.has(d)) keysOf.set(d, {
    v2: new Map(d.bindings.map(e => [`${e.ctx}/${e.occ}`, e])),
    v1: new Map(d.bindings.map(e => [`${e.ctx1}/${e.occ1}`, e])),
  });
  const k = keysOf.get(d), key = `${m.ctx}/${m.occ}`;
  if (k.v2.has(key)) return { e: k.v2.get(key), legacy: false };
  if (k.v1.has(key)) return { e: k.v1.get(key), legacy: true };
  return null;
}
let legacyCount = 0;

function plan() {
  const all = [];
  const unresolved = [];
  legacyCount = 0;
  for (const d of decls.values()) {
    const wants = [];
    for (const m of localsMap[d.real] || []) {
      const hit = locate(d, m);
      if (!hit) { unresolved.push({ decl: d.real, ...m }); continue; }
      const e = hit.e;
      if (hit.legacy) legacyCount++;
      wants.push({ e, name: m.name, source: m.src || "map" });
    }
    for (const e of d.bindings) {
      const r = ruleName(e);
      const n = r && camel(r.name);
      if (n && validName(n)) wants.push({ e, name: n, source: `rule:${r.rule}` });
    }
    const { done, occOf } = assign(d, wants);
    all.push({ d, done, occOf });
  }
  for (const real of Object.keys(localsMap)) if (!decls.has(real))
    for (const m of localsMap[real]) unresolved.push({ decl: real, ...m, why: "declaration not found" });
  return { all, unresolved };
}

function edits(all) {
  const out = [];
  for (const { done, occOf } of all) for (const r of done) {
    for (const o of occOf.get(r.e.binding) || []) {
      const n = o.node, par = o.path.parent, pp = o.path.parentPath.parent;
      const inShorthand = par.type === "ObjectProperty" && par.shorthand && par.value === n;
      const inShorthandDefault = par.type === "AssignmentPattern" && par.left === n && pp?.type === "ObjectProperty" && pp.shorthand && pp.value === par;
      const keyOf = (prop) => !prop.computed && !prop.shorthand && prop.key.type === "Identifier" ? prop.key : null;
      if (inShorthand || inShorthandDefault) { out.push({ start: n.start, end: n.end, text: `${r.from}: ${r.to}` }); continue; }
      if (par.type === "ObjectProperty" && par.value === n && keyOf(par)?.name === r.to) {
        out.push({ start: par.key.start, end: n.end, text: r.to }); continue;
      }
      if (par.type === "AssignmentPattern" && par.left === n && pp?.type === "ObjectProperty" && pp.value === par && keyOf(pp)?.name === r.to) {
        out.push({ start: pp.key.start, end: n.end, text: r.to }); continue;
      }
      out.push({ start: n.start, end: n.end, text: r.to });
    }
  }
  out.sort((a, b) => b.start - a.start);
  for (let i = 1; i < out.length; i++) if (out[i].end > out[i - 1].start) throw new Error(`overlapping edits at offset ${out[i].start}`);
  return out;
}

const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
// entries in the order of their bindings in the current code (an entry that no
// longer finds its binding goes last); no ordinal or short name is stored,
// because both change with every release while the entry stays valid
const ordinalOf = (real, m) => { const d = decls.get(real); return (d && locate(d, m)?.e.ordinal) ?? Infinity; };
const sortMap = (m) => Object.fromEntries(Object.keys(m).sort().map(k => [k,
  m[k].map(x => ({ ctx: x.ctx, occ: x.occ, name: x.name, src: x.src })).sort((a, b) => ordinalOf(k, a) - ordinalOf(k, b) || a.ctx.localeCompare(b.ctx) || a.occ - b.occ)]));

if (CMD === "apply") {
  const [OUT, APPLIED] = rest;
  const { all, unresolved } = plan();
  // edits() is sorted by descending start and non-overlapping; join the pieces
  // once instead of copying the whole bundle per edit (26k edits on 6 MB)
  const lines = src.split("\n").length;
  const parts = [];
  let end = src.length;
  for (const e of edits(all)) { parts.push(src.slice(e.end, end), e.text); end = e.start; }
  parts.push(src.slice(0, end));
  const text = parts.reverse().join("");
  if (text.split("\n").length !== lines) throw new Error("line count changed");
  fs.writeFileSync(OUT, text);
  const applied = {};
  const stats = { declarations: decls.size, locals: 0, named: 0, bySource: {}, suffixed: 0, unnamed: 0 };
  for (const { d, done } of all) {
    stats.locals += d.bindings.length;
    if (done.length) applied[d.real] = Object.fromEntries(done.map(r => [r.e.ordinal, { from: r.from, to: r.to, source: r.source }]));
    for (const r of done) { stats.named++; stats.bySource[r.source] = (stats.bySource[r.source] || 0) + 1; if (r.to !== r.wanted) stats.suffixed++; }
  }
  stats.unnamed = stats.locals - stats.named;
  writeJson(APPLIED, { stats, unresolved, applied });
  console.log(`local names: ${stats.named} of ${stats.locals} locals in ${stats.declarations} declarations (${Object.entries(stats.bySource).map(([k, v]) => `${k} ${v}`).join(", ")}; ${stats.suffixed} suffixed)`);
  if (legacyCount) console.log(`  ${legacyCount} entr${legacyCount === 1 ? "y" : "ies"} of ${LOCALS} still keyed by the previous ctx scheme (resolved; name_locals.mjs rekey rewrites them)`);
  if (unresolved.length) {
    console.log(`  ${unresolved.length} entr${unresolved.length === 1 ? "y" : "ies"} of ${LOCALS} no longer locate a binding (code next to it changed):`);
    for (const u of unresolved.slice(0, 20)) console.log(`    ${u.decl} ${u.name} (ctx ${u.ctx}/${u.occ}${u.why ? `, ${u.why}` : ""})`);
    console.log("  re-name them (name_locals.mjs tasks/record) or drop them (name_locals.mjs prune)");
    process.exit(3);
  }
} else if (CMD === "tasks") {
  const [SUBSYS, OUTDIR, ...flags] = rest;
  const only = flags[0] === "--only" ? new Set(flags[1].split(",")) : null;
  const subsys = JSON.parse(fs.readFileSync(SUBSYS, "utf8"));
  const { all, unresolved } = plan();
  // the names a declaration's locals had before the code next to them changed:
  // the entries that no longer locate a binding. Printed with the task so the
  // reader reuses the code's own vocabulary (at v0.8.7 one of two naming passes
  // never opened locals_daemon.json, where these were, and named from scratch)
  const before = new Map();
  for (const u of unresolved) { if (!before.has(u.decl)) before.set(u.decl, []); before.get(u.decl).push(u.name); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  const groups = {};
  for (const { d, done, occOf } of all) {
    const named = new Map(done.map(r => [r.e.binding, r.to]));
    const pending = d.bindings.filter(e => !named.has(e.binding));
    if (!pending.length) continue;
    const dir = subsys[d.real] || "unassigned";
    if (only && !only.has(dir)) continue;
    const ed = [];
    for (const e of d.bindings) {
      const to = named.get(e.binding) ?? `$${e.ordinal}`;
      for (const o of occOf.get(e.binding) || []) ed.push({ start: o.node.start, end: o.node.end, text: to });
    }
    ed.sort((a, b) => b.start - a.start);
    const parts = [];
    let end = d.end;
    for (const x of ed) { parts.push(src.slice(x.end, end), x.text); end = x.start; }
    parts.push(src.slice(d.start, end));
    const body = parts.reverse().join("");
    (groups[dir] ??= []).push({ real: d.real, pending: pending.map(e => e.ordinal), body, before: [...new Set(before.get(d.real) || [])] });
  }
  for (const [dir, list] of Object.entries(groups)) {
    const head = "Name every `$<ordinal>` listed under `name:` with a short descriptive lowerCamelCase identifier, from how the binding is used\n" +
      "(property names, string literals, the real names of callees), in the convention of the locals already named in the same code\n" +
      "(`paths` for the runtime paths object, `sessionKey`, ...). `previously:` lists names this declaration's locals had before the\n" +
      "code next to them changed: reuse one when the binding plays the same role. Answer with one JSON file of the form\n" +
      "{\"<realName>\": {\"<ordinal>\": \"<name>\"}} covering every ordinal in the .json next to this file, then run name_locals.mjs record.\n\n";
    const md = head + list.map(x => `### ${x.real}\n\nname: ${x.pending.map(o => `$${o}`).join(" ")}\n` +
      (x.before.length ? `previously: ${x.before.join(", ")}\n` : "") + `\n\`\`\`js\n${x.body}\n\`\`\`\n`).join("\n");
    fs.writeFileSync(path.join(OUTDIR, `${dir}.md`), md);
    writeJson(path.join(OUTDIR, `${dir}.json`), Object.fromEntries(list.map(x => [x.real, x.pending])));
    console.log(`${dir}: ${list.length} declarations, ${list.reduce((n, x) => n + x.pending.length, 0)} locals to name`);
  }
} else if (CMD === "record") {
  let added = 0, replaced = 0;
  const problems = [];
  for (const f of rest) {
    const ans = JSON.parse(fs.readFileSync(f, "utf8"));
    for (const [real, names] of Object.entries(ans)) {
      const d = decls.get(real);
      if (!d) { problems.push(`${f}: ${real} is not a renamed declaration`); continue; }
      for (const [ord, name] of Object.entries(names)) {
        const e = d.bindings[Number(ord)];
        if (!e) { problems.push(`${f}: ${real} has no local #${ord}`); continue; }
        if (!validName(name)) { problems.push(`${f}: ${real} #${ord}: "${name}" is not a usable identifier`); continue; }
        const list = (localsMap[real] ??= []);
        const i = list.findIndex(m => locate(d, m)?.e === e);
        const entry = { ctx: e.ctx, occ: e.occ, name, src: "llm" };
        if (i >= 0) { list[i] = entry; replaced++; } else { list.push(entry); added++; }
      }
    }
  }
  writeJson(LOCALS, sortMap(localsMap));
  console.log(`recorded ${added} new, ${replaced} replaced -> ${LOCALS}`);
  if (problems.length) { console.log(`${problems.length} refused:`); for (const p of problems) console.log("  " + p); process.exit(1); }
} else if (CMD === "prune") {
  const { unresolved } = plan();
  const drop = new Set(unresolved.map(u => `${u.decl}/${u.ctx}/${u.occ}`));
  for (const real of Object.keys(localsMap)) {
    localsMap[real] = localsMap[real].filter(m => !drop.has(`${real}/${m.ctx}/${m.occ}`));
    if (!localsMap[real].length) delete localsMap[real];
  }
  writeJson(LOCALS, sortMap(localsMap));
  console.log(`dropped ${drop.size} entries`);
} else if (CMD === "rekey") {
  let moved = 0, kept = 0, lost = 0;
  for (const [real, list] of Object.entries(localsMap)) {
    const d = decls.get(real);
    for (const m of list) {
      const hit = d && locate(d, m);
      if (!hit) { lost++; continue; }
      if (hit.legacy) { m.ctx = hit.e.ctx; m.occ = hit.e.occ; moved++; } else kept++;
    }
  }
  writeJson(LOCALS, sortMap(localsMap));
  console.log(`rekeyed ${moved} entries to the current ctx, ${kept} already current, ${lost} locate nothing (prune drops those) -> ${LOCALS}`);
}
