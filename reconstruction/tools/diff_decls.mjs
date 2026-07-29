// Emit per-declaration cross-version diff artifacts for a version bump.
//
// A raw `diff` between two minified-then-beautified bundles is worthless:
// esbuild re-mangles every identifier each build, so essentially every line
// differs. This tool makes the diff readable two ways:
//
//   1. ALPHA-NORMALIZED FORM (`.norm`) — every identifier is replaced by a
//      positional slot (#0, #1, ...) assigned in first-seen order, while string
//      and numeric literals and non-computed property names are kept verbatim.
//      Two versions of an unchanged function normalize to identical text, so
//      `diff -u a.old.norm a.new.norm` shows *only* real structural change.
//   2. LITERAL DELTA (`.delta.json`) — strings / property names / numbers added
//      and removed. This is usually the fastest route to "what did they build":
//      new error text, new config keys, new file names.
//
// The untouched source of both sides is written alongside (`.old.js` / `.new.js`)
// so the actual code is one Read away once the delta says where to look.
//
// Usage: node diff_decls.mjs <old.pretty.js> <new.pretty.js> <pairs.json> <outdir>
//                            <old_rename.json> <new_rename.json>
// where pairs.json is the output of pair_changes.mjs.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;

const [, , OLDP, NEWP, PAIRSJ, OUTDIR, OLDMAP, NEWMAP] = process.argv;
if (!OLDP || !NEWP || !PAIRSJ || !OUTDIR) {
  console.error("usage: node diff_decls.mjs <old.pretty.js> <new.pretty.js> <pairs.json> <outdir> [old_rename.json] [new_rename.json]");
  process.exit(2);
}
const oldSrc = fs.readFileSync(OLDP, "utf8");
const newSrc = fs.readFileSync(NEWP, "utf8");
const P = JSON.parse(fs.readFileSync(PAIRSJ, "utf8"));
const oldMap = OLDMAP && fs.existsSync(OLDMAP) ? JSON.parse(fs.readFileSync(OLDMAP, "utf8")) : {};
const newMap = NEWMAP && fs.existsSync(NEWMAP) ? JSON.parse(fs.readFileSync(NEWMAP, "utf8")) : {};
fs.mkdirSync(OUTDIR, { recursive: true });

function decls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  const lineAt = (o) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= o) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  const map = new Map();
  const put = (name, stmt) => map.set(name, { start: stmt.start, end: stmt.end, line: lineAt(stmt.start), endLine: lineAt(stmt.end) });
  for (const s of ast.program.body) {
    if (s.type === "FunctionDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "ClassDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, s);
  }
  return map;
}
const O = decls(oldSrc), N = decls(newSrc);

function tryParse(code) {
  try { return parse("(" + code + ")", { sourceType: "module", allowReturnOutsideFunction: true }); }
  catch { try { return parse(code, { sourceType: "module", allowReturnOutsideFunction: true }); } catch { return null; } }
}

// identifiers -> positional slots; literals and static property names kept verbatim
function normalize(code) {
  const ast = tryParse(code);
  if (!ast) return null;
  const slots = new Map();
  let n = 0;
  const lines = [];
  let cur = [];
  const push = (t) => { cur.push(t); if (cur.length >= 12) { lines.push(cur.join(" ")); cur = []; } };
  function walk(x) {
    if (x == null) return;
    if (Array.isArray(x)) { for (const e of x) walk(e); return; }
    if (typeof x !== "object" || !x.type) return;
    switch (x.type) {
      case "Identifier": { if (!slots.has(x.name)) slots.set(x.name, "#" + n++); push(slots.get(x.name)); return; }
      case "StringLiteral": push(JSON.stringify(x.value)); return;
      case "NumericLiteral": push(String(x.value)); return;
      case "BooleanLiteral": push(String(x.value)); return;
    }
    push(x.type);
    if (x.type === "MemberExpression" && !x.computed) { walk(x.object); push("." + (x.property.name || x.property.value)); return; }
    if ((x.type === "ObjectProperty" || x.type === "ObjectMethod" || x.type === "ClassMethod") && !x.computed) {
      push("key:" + (x.key.name ?? x.key.value)); walk(x.value ?? x.body); return;
    }
    for (const k of Object.keys(x)) {
      if (k === "loc" || k === "start" || k === "end" || k === "range" || k === "type" ||
          k === "leadingComments" || k === "trailingComments" || k === "extra") continue;
      walk(x[k]);
    }
  }
  walk(ast);
  if (cur.length) lines.push(cur.join(" "));
  return lines.join("\n") + "\n";
}

function literals(code) {
  const set = { str: new Set(), prop: new Set(), num: new Set() };
  const ast = tryParse(code);
  if (!ast) return set;
  traverse(ast, {
    StringLiteral(p) { if (p.node.value.length > 1) set.str.add(p.node.value); },
    NumericLiteral(p) { set.num.add(String(p.node.value)); },
    MemberExpression(p) { if (!p.node.computed && p.node.property.type === "Identifier") set.prop.add(p.node.property.name); },
    ObjectProperty(p) { if (!p.node.computed && p.node.key.type === "Identifier") set.prop.add(p.node.key.name); },
    ObjectMethod(p) { if (!p.node.computed && p.node.key.type === "Identifier") set.prop.add(p.node.key.name); },
  });
  return set;
}

const index = [];
const added = (a, b) => [...b].filter((x) => !a.has(x));

function emit(base, oldNames, newNames) {
  const slice = (names, map, src) => names.map((n) => { const d = map.get(n); return d ? src.slice(d.start, d.end) : ""; }).join("\n\n");
  const oc = slice(oldNames, O, oldSrc), nc = slice(newNames, N, newSrc);
  fs.writeFileSync(path.join(OUTDIR, base + ".old.js"), oc);
  fs.writeFileSync(path.join(OUTDIR, base + ".new.js"), nc);
  const on = normalize(oc), nn = normalize(nc);
  if (on && nn) {
    fs.writeFileSync(path.join(OUTDIR, base + ".old.norm"), on);
    fs.writeFileSync(path.join(OUTDIR, base + ".new.norm"), nn);
  }
  const ol = literals(oc), nl = literals(nc);
  const first = (names, map) => (names.length ? map.get(names[0]) : null);
  const last = (names, map) => (names.length ? map.get(names[names.length - 1]) : null);
  const rep = {
    base, oldNames, newNames,
    realOld: oldNames.map((n) => oldMap[n] || null),
    realNew: newNames.map((n) => newMap[n] || null),
    oldLine: first(oldNames, O)?.line ?? null, oldEndLine: last(oldNames, O)?.endLine ?? null,
    newLine: first(newNames, N)?.line ?? null, newEndLine: last(newNames, N)?.endLine ?? null,
    oldBytes: oc.length, newBytes: nc.length,
    normIdentical: !!(on && nn && on === nn),
    strAdded: added(ol.str, nl.str), strRemoved: added(nl.str, ol.str),
    propAdded: added(ol.prop, nl.prop), propRemoved: added(nl.prop, ol.prop),
    numAdded: added(ol.num, nl.num), numRemoved: added(nl.num, ol.num),
  };
  fs.writeFileSync(path.join(OUTDIR, base + ".delta.json"), JSON.stringify(rep, null, 1));
  index.push(rep);
}

for (const [o, n] of Object.entries(P.pairs || {})) emit(`${o}__${n}`, [o], [n]);
(P.blocks || []).forEach((b, i) =>
  emit(`block${i}__${b.oldNames.join("-")}__${b.newNames.join("-")}`.slice(0, 80), b.oldNames, b.newNames));
if ((P.pureNew || []).length) emit("pureNew", [], P.pureNew);

fs.writeFileSync(path.join(OUTDIR, "_index.json"), JSON.stringify(index, null, 1));
const noop = index.filter((r) => r.normIdentical).length;
console.error(`wrote ${index.length} declaration diffs -> ${OUTDIR}  (${noop} normalize-identical = pure minifier churn)`);
