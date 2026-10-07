// Emit per-declaration cross-version diff artifacts for a version bump.
//
// A raw `diff` between two minified-then-beautified bundles is worthless:
// esbuild re-mangles every identifier each build, so essentially every line
// differs. For every changed declaration pair_changes.mjs found, this tool
// writes three views:
//
//   1. READABLE DIFF (`.diff`) — a unified line diff of the code itself, the
//      view to read. Lines are aligned on a normalized copy in which every
//      local variable is `_` and every top-level name is spelled the same on
//      both sides; what is printed is the source, with each top-level name
//      written as its real name, else as the new release's short name of the
//      declaration the structural match paired it with (so `-` and `+` lines
//      use one vocabulary), and each local in its own spelling. A line that
//      differs only in esbuild's choice of local names is therefore context,
//      not change. Hunk headers carry pretty-bundle line numbers.
//      The price: a line whose only change is WHICH local it reads looks
//      unchanged. The declaration is still listed (the structural comparison
//      decides that), `localOnly` in `.delta.json` says when no line-level
//      change remains, and `.old.js` / `.new.js` hold both sides verbatim.
//   2. ALPHA-NORMALIZED FORM (`.norm`) — every identifier replaced by a
//      positional slot (#0, #1, ...) in first-seen order, literals and static
//      property names kept. Two versions of an unchanged function normalize to
//      identical text; `normIdentical` comes from here. It is not for reading:
//      one new local renumbers every later slot, so at v0.8.2 -> v0.8.3
//      drainSessionMailbox showed 844 of its 977 lines as changed, where the
//      readable diff shows 83.
//   3. LITERAL DELTA (`.delta.json`) — strings / property names / numbers added
//      and removed, the fastest route to "what did they build": new error text,
//      new config keys, new file names. It also records the readable diff's
//      hunks (pretty-bundle line ranges on each side) and the distinctive
//      tokens of the changed lines, which impact_report.mjs matches against the
//      docs.
//
// Usage: node diff_decls.mjs <old.pretty.js> <new.pretty.js> <pairs.json> <outdir>
//                            [old_rename.json] [new_rename.json]
//                            [--fp <fp.json>] [--old-label <v>] [--new-label <v>] [--context <n>]
// where pairs.json is the output of pair_changes.mjs and fp.json that of
// fingerprint_match.mjs. Without --fp, an unnamed top-level name can only be
// aligned by its real name, so every line that mentions one reads as changed.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";
import { snippetTokens } from "./anchor_forms.mjs";
import { topLevelDeclarations } from "./verify_inferred.mjs";
const traverse = _traverse.default || _traverse;

const pos = [], flags = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) flags[a.slice(2)] = process.argv[++i];
  else pos.push(a);
}
const [OLDP, NEWP, PAIRSJ, OUTDIR, OLDMAP, NEWMAP] = pos;
if (!OLDP || !NEWP || !PAIRSJ || !OUTDIR) {
  console.error("usage: node diff_decls.mjs <old.pretty.js> <new.pretty.js> <pairs.json> <outdir> [old_rename.json] [new_rename.json] [--fp <fp.json>] [--old-label <v>] [--new-label <v>] [--context <n>]");
  process.exit(2);
}
const oldSrc = fs.readFileSync(OLDP, "utf8");
const newSrc = fs.readFileSync(NEWP, "utf8");
const P = JSON.parse(fs.readFileSync(PAIRSJ, "utf8"));
const readMap = (p) => (p && fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {});
const oldMap = readMap(OLDMAP), newMap = readMap(NEWMAP);
const FP = flags.fp ? JSON.parse(fs.readFileSync(flags.fp, "utf8")) : null;
const OLD_LABEL = flags["old-label"] || "old", NEW_LABEL = flags["new-label"] || "new";
const CONTEXT = Number(flags.context ?? 3);
fs.mkdirSync(OUTDIR, { recursive: true });

function decls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  const lineAt = (o) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= o) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  const map = new Map();
  const top = new Set(); // every program-scope binding, patterns and imports included
  const put = (name, stmt) => map.set(name, { start: stmt.start, end: stmt.end, line: lineAt(stmt.start), endLine: lineAt(stmt.end) });
  for (const s of ast.program.body) {
    if (s.type === "FunctionDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "ClassDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, s);
    const decl = s.type === "ExportNamedDeclaration" ? s.declaration : s;
    if (decl && /^(?:Function|Class|Variable|Import)Declaration$/.test(decl.type))
      for (const n of Object.keys(t.getBindingIdentifiers(decl))) top.add(n);
  }
  return { ast, map, top };
}
const O = decls(oldSrc), N = decls(newSrc);

// --- one vocabulary for top-level names on both sides ------------------------
// old -> new on structural identity (unique fingerprint matches) and on the
// positional pairing of changed declarations; a name matched to several
// identical twins can only be aligned by the hash of its structure.
const fwd = new Map(), rev = new Map(), hashOld = new Map(), hashNew = new Map();
if (FP) for (const [o, m] of Object.entries(FP.matched || {})) {
  if (m.unique) { fwd.set(o, m.new); rev.set(m.new, o); }
  else { hashOld.set(o, m.hash); for (const n of m.new) hashNew.set(n, m.hash); }
}
for (const [o, n] of Object.entries(P.pairs || {})) { fwd.set(o, n); rev.set(n, o); }

// The fingerprint covers declarations with a body; the top-level names it
// cannot see -- an uninitialised `var` a module initialiser assigns (the drain
// merge-window defaults), an import alias -- are aligned through the code that
// uses them: two declarations with the same structure reference the same
// top-level names in the same order, so zipping their reference lists pairs
// the names. A name is paired only when its votes agree both ways.
// -> Map(unit name -> [top-level names referenced, in traversal order])
function topRefs(D) {
  const owner = new Map(), refs = new Map(), stack = [];
  for (const s of D.ast.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) owner.set(s, s.id.name);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier" && d.init) owner.set(d.init, d.id.name);
  }
  traverse(D.ast, {
    enter(p) {
      if (owner.has(p.node)) { stack.push(owner.get(p.node)); refs.set(owner.get(p.node), []); }
      if (!stack.length || !p.isIdentifier() || !isName(p)) return;
      const b = p.scope.getBinding(p.node.name);
      if (b && b.scope.block.type === "Program") refs.get(stack[stack.length - 1]).push(p.node.name);
    },
    exit(p) { if (owner.has(p.node)) stack.pop(); },
  });
  return refs;
}
if (FP) {
  const RO = topRefs(O), RN = topRefs(N);
  const votes = (m, a, b) => { const v = m.get(a) ?? new Map(); v.set(b, (v.get(b) ?? 0) + 1); m.set(a, v); };
  const byOld = new Map(), byNew = new Map();
  for (const [o, m] of Object.entries(FP.matched || {})) {
    if (!m.unique) continue;
    const a = RO.get(o), b = RN.get(m.new);
    if (!a || !b || a.length !== b.length) continue;
    a.forEach((x, i) => { votes(byOld, x, b[i]); votes(byNew, b[i], x); });
  }
  const best = (v) => [...v].sort((p, q) => q[1] - p[1])[0][0];
  let learned = 0;
  for (const [o, v] of byOld) {
    const n = best(v);
    if (fwd.has(o) || rev.has(n) || best(byNew.get(n)) !== o) continue;
    fwd.set(o, n); rev.set(n, o); learned++;
  }
  console.error(`  vocabulary: ${learned} top-level names outside the fingerprint aligned through the code that uses them`);
}
// {id: what alignment compares, show: what is printed}
function canonNew(n) {
  const real = newMap[n] ?? (rev.has(n) ? oldMap[rev.get(n)] : undefined);
  if (real) return { id: real, show: real };
  if (rev.has(n)) return { id: "\u0000" + n, show: n };
  if (hashNew.has(n)) return { id: "#" + hashNew.get(n), show: n };
  return { id: "new:" + n, show: n };
}
function canonOld(o) {
  if (fwd.has(o)) return canonNew(fwd.get(o));
  if (oldMap[o]) return { id: oldMap[o], show: oldMap[o] };
  if (hashOld.has(o)) return { id: "#" + hashOld.get(o), show: o };
  // printed with its release, so it cannot be read as the new name it may
  // coincide with (v0.8.2's `Rft` and v0.8.3's `Rft` are unrelated functions)
  return { id: "old:" + o, show: "old:" + o };
}

// Is this Identifier a name (binding or reference) rather than a property key,
// a member name or a label?
function isName(p) {
  const k = p.key, par = p.parent;
  if ((par.type === "MemberExpression" || par.type === "OptionalMemberExpression") && k === "property" && !par.computed) return false;
  if (k === "key" && !par.computed && /Property|Method/.test(par.type)) return false;
  if (k === "label" || par.type === "MetaProperty" || par.type === "PrivateName") return false;
  if (par.type === "ExportSpecifier" || (par.type === "ImportSpecifier" && k === "imported")) return false;
  return true;
}

// -> { show: [line], norm: [line] } with the same line count as `code`
function render(code, side) {
  let ast;
  try { ast = parse(code, { sourceType: "module", allowReturnOutsideFunction: true, allowImportExportEverywhere: true }); }
  catch { return null; }
  const top = side === "old" ? O.top : N.top, canon = side === "old" ? canonOld : canonNew;
  const reps = new Map(); // start -> replacement
  traverse(ast, {
    Identifier(p) {
      if (!isName(p)) return;
      const { node, parent } = p;
      const b = p.scope.getBinding(node.name);
      let show = node.name, norm;
      if (b && b.scope.block.type !== "Program") norm = "_";                   // a local
      else if (b || top.has(node.name)) ({ id: norm, show } = canon(node.name)); // top-level
      else norm = node.name;                                                     // a global
      if (parent.type === "ObjectProperty" && parent.shorthand && show !== node.name) show = `${node.name}: ${show}`;
      if (!reps.has(node.start)) reps.set(node.start, { end: node.end, show, norm });
    },
  });
  let show = "", norm = "", at = 0;
  for (const [start, r] of [...reps].sort((a, b) => a[0] - b[0])) {
    if (start < at) continue;
    show += code.slice(at, start) + r.show; norm += code.slice(at, start) + r.norm; at = r.end;
  }
  show += code.slice(at); norm += code.slice(at);
  return { show: show.split("\n"), norm: norm.split("\n").map((l) => l.replace(/\s+/g, " ").trim()) };
}

// --- Myers line diff -> [op, oldIndex, newIndex] ------------------------------
const MYERS_LIMIT = 4000; // edit distance beyond which the middle is one replacement
function myers(a, b) {
  const n = a.length, m = b.length, max = n + m, off = max + 1;
  const V = new Int32Array(2 * max + 3);
  const trace = [];
  let dEnd = -1;
  outer: for (let d = 0; d <= Math.min(max, MYERS_LIMIT); d++) {
    trace.push(V.slice(off - d - 1, off + d + 2)); // V after step d-1, k in [-d-1, d+1]
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && V[off + k - 1] < V[off + k + 1])) ? V[off + k + 1] : V[off + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) { x++; y++; }
      V[off + k] = x;
      if (x >= n && y >= m) { dEnd = d; break outer; }
    }
  }
  if (dEnd < 0) return [...a.map((_, i) => ["-", i, null]), ...b.map((_, j) => ["+", null, j])];
  const ops = [];
  let x = n, y = m;
  for (let d = dEnd; d > 0; d--) {
    const w = trace[d], get = (k) => w[k + d + 1];
    const k = x - y;
    const prevK = (k === -d || (k !== d && get(k - 1) < get(k + 1))) ? k + 1 : k - 1;
    const prevX = get(prevK), prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push(["=", --x, --y]); }
    if (x === prevX) ops.push(["+", null, --y]); else ops.push(["-", --x, null]);
  }
  while (x > 0 && y > 0) ops.push(["=", --x, --y]);
  return ops.reverse();
}
function diffOps(a, b) {
  let pre = 0; while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0; while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const mid = myers(a.slice(pre, a.length - suf), b.slice(pre, b.length - suf));
  const ops = [];
  for (let i = 0; i < pre; i++) ops.push(["=", i, i]);
  for (const [op, i, j] of mid) ops.push([op, i == null ? null : i + pre, j == null ? null : j + pre]);
  for (let k = suf; k > 0; k--) ops.push(["=", a.length - k, b.length - k]);
  return ops;
}

// the declarations' source, one statement once, and the pretty-bundle line of
// every line of it (null for the blank line between two statements)
function slice(names, D, src) {
  const seen = new Set(), parts = [], lines = [];
  for (const n of names) {
    const d = D.map.get(n);
    if (!d || seen.has(d.start)) continue;
    seen.add(d.start);
    if (parts.length) lines.push(null);
    parts.push(src.slice(d.start, d.end));
    for (let l = d.line; l <= d.endLine; l++) lines.push(l);
  }
  return { code: parts.join("\n\n"), lines };
}

function readable(base, o, n, oldNames, newNames, notes = []) {
  const ro = o.code ? render(o.code, "old") : { show: [], norm: [] };
  const rn = n.code ? render(n.code, "new") : { show: [], norm: [] };
  if (!ro || !rn) return { file: null, error: `${!ro ? "old" : "new"} side does not parse on its own` };
  const ops = diffOps(ro.norm, rn.norm);
  const changed = ops.map((op, i) => (op[0] === "=" ? -1 : i)).filter((i) => i >= 0);
  const groups = [];
  for (const i of changed) {
    const g = groups[groups.length - 1];
    if (g && i - g.e <= 2 * CONTEXT + 1) g.e = i; else groups.push({ s: i, e: i });
  }
  const label = (names, map, side) => names.map((x) => {
    const c = side === "old" ? canonOld(x) : canonNew(x);
    const real = map[x] || (c.id === c.show && !c.id.startsWith("old:") ? c.show : null); // id === show only for a real name
    return real ? `${real} (${x})` : x;
  }).join(", ") || "(nothing)";
  const range = (names, D) => { const ls = names.map((x) => D.map.get(x)).filter(Boolean); return ls.length ? `${Math.min(...ls.map((d) => d.line))}-${Math.max(...ls.map((d) => d.endLine))}` : "-"; };
  const out = [
    `# top-level names: the real name where known, else the ${NEW_LABEL} short name of the same declaration;`,
    `# old:X is a ${OLD_LABEL} short name with no ${NEW_LABEL} counterpart. Lines that differ only in`,
    `# local-variable names are shown as unchanged context (from ${NEW_LABEL}).`,
    ...notes.map((x) => `# ${x}`),
    `--- ${OLD_LABEL} ${label(oldNames, oldMap, "old")}  pretty:${range(oldNames, O)}`,
    `+++ ${NEW_LABEL} ${label(newNames, newMap, "new")}  pretty:${range(newNames, N)}`,
  ];
  const hunks = [];
  const tokens = new Set();
  for (const g of groups) {
    const from = Math.max(0, g.s - CONTEXT), to = Math.min(ops.length - 1, g.e + CONTEXT);
    const seg = ops.slice(from, to + 1);
    const oldIdx = seg.filter((op) => op[1] != null).map((op) => op[1]);
    const newIdx = seg.filter((op) => op[2] != null).map((op) => op[2]);
    const firstAbs = (idx, lines) => { for (const i of idx) if (lines[i] != null) return lines[i]; return 0; };
    out.push(`@@ -${firstAbs(oldIdx, o.lines)},${oldIdx.length} +${firstAbs(newIdx, n.lines)},${newIdx.length} @@`);
    for (const [op, i, j] of seg) out.push(op === "=" ? " " + rn.show[j] : op === "-" ? "-" + ro.show[i] : "+" + rn.show[j]);
    // the changed lines' pretty-bundle lines on each side; a pure insertion or
    // deletion is located by the lines around it on the side it does not touch
    const core = ops.slice(g.s, g.e + 1);
    const span = (k, lines) => {
      const abs = core.filter((op) => op[0] !== "=" && op[k] != null).map((op) => lines[op[k]]).filter((l) => l != null);
      if (abs.length) return [Math.min(...abs), Math.max(...abs)];
      const before = ops.slice(0, g.s).reverse().find((op) => op[k] != null), after = ops.slice(g.e + 1).find((op) => op[k] != null);
      const a = before ? lines[before[k]] : null, b = after ? lines[after[k]] : null;
      return [a ?? b ?? 0, b ?? a ?? 0];
    };
    hunks.push({ old: span(1, o.lines), new: span(2, n.lines), removed: core.filter((op) => op[0] === "-").length, added: core.filter((op) => op[0] === "+").length });
    for (const [op, i, j] of core) if (op !== "=") for (const tok of snippetTokens(op === "-" ? ro.show[i] : rn.show[j])) tokens.add(tok);
  }
  const file = base + ".diff";
  fs.writeFileSync(path.join(OUTDIR, file), out.join("\n") + "\n");
  return { file, changedLines: changed.length, hunks, tokens: [...tokens].sort() };
}

// --- the positional form and the literal delta ---------------------------------
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
  const push = (tk) => { cur.push(tk); if (cur.length >= 12) { lines.push(cur.join(" ")); cur = []; } };
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

function emit(base, oldNames, newNames, notes = []) {
  const o = slice(oldNames, O, oldSrc), n = slice(newNames, N, newSrc);
  const oc = o.code, nc = n.code;
  fs.writeFileSync(path.join(OUTDIR, base + ".old.js"), oc);
  fs.writeFileSync(path.join(OUTDIR, base + ".new.js"), nc);
  const on = normalize(oc), nn = normalize(nc);
  if (on && nn) {
    fs.writeFileSync(path.join(OUTDIR, base + ".old.norm"), on);
    fs.writeFileSync(path.join(OUTDIR, base + ".new.norm"), nn);
  }
  const ol = literals(oc), nl = literals(nc);
  const ranges = (names, D) => Object.fromEntries(names.filter((x) => D.map.has(x)).map((x) => [x, [D.map.get(x).line, D.map.get(x).endLine]]));
  const first = (names, D) => (names.length ? D.map.get(names[0]) : null);
  const last = (names, D) => (names.length ? D.map.get(names[names.length - 1]) : null);
  const diff = readable(base, o, n, oldNames, newNames, notes);
  const normIdentical = !!(on && nn && on === nn);
  const rep = {
    base, oldNames, newNames,
    realOld: oldNames.map((x) => oldMap[x] || null),
    realNew: newNames.map((x) => newMap[x] || null),
    // a changed declaration the pairing ties to an old one keeps that one's
    // real name when NEW's map lacks it (an inferred name pending RE-ANCHOR)
    realByPairing: newNames.map((x) => newMap[x] || (rev.has(x) ? oldMap[rev.get(x)] || null : null)),
    oldLine: first(oldNames, O)?.line ?? null, oldEndLine: last(oldNames, O)?.endLine ?? null,
    newLine: first(newNames, N)?.line ?? null, newEndLine: last(newNames, N)?.endLine ?? null,
    oldRanges: ranges(oldNames, O), newRanges: ranges(newNames, N),
    oldBytes: oc.length, newBytes: nc.length,
    normIdentical,
    diff: diff.file ? { file: diff.file, changedLines: diff.changedLines, hunks: diff.hunks } : { file: null, error: diff.error },
    localOnly: !!diff.file && !normIdentical && diff.changedLines === 0,
    changedTokens: diff.tokens ?? [],
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
// Declarations with no old counterpart, one diff per run of them that sits
// together in the bundle (esbuild emits a module's declarations in one run), each
// headed by the existing declarations that use it. At v0.8.4 they were one
// 1123-line diff of 120 declarations from ~37k to ~91k, three new features
// (void, spine.record, the caller-session env) interleaved in reading order.
// A run also ends after a module initialiser (`var X = __esm(() => {...})`),
// which esbuild emits last in its module.
function pureNewRuns(names) {
  const pos = new Map([...N.map.keys()].map((x, i) => [x, i]));
  const kinds = topLevelDeclarations(N.ast);
  const sorted = names.filter((x) => pos.has(x)).sort((a, b) => pos.get(a) - pos.get(b));
  const runs = [];
  for (const x of sorted) {
    const r = runs[runs.length - 1];
    const prev = r?.[r.length - 1];
    if (r && pos.get(x) - pos.get(prev) === 1 && kinds.get(prev)?.kind !== "moduleInit") r.push(x); else runs.push([x]);
  }
  return runs;
}
function usersOf(run, changedNew) {
  const inRun = new Set(run);
  const re = new RegExp(`(?<![\\w$.])(?:${run.map((x) => x.replace(/\$/g, "\\$")).join("|")})(?![\\w$])`);
  const tops = [...N.map].sort((a, b) => a[1].start - b[1].start);
  const users = new Set();
  for (const [name, d] of tops) {
    if (inRun.has(name)) continue;
    if (re.test(newSrc.slice(d.start, d.end))) users.add(name);
  }
  // changed declarations first, then named ones: those are where a reader starts
  const rank = (x) => (changedNew.has(x) ? 0 : newMap[x] ? 1 : 2);
  return [...users].sort((a, b) => rank(a) - rank(b))
    .map((x) => `${newMap[x] ? `${newMap[x]} (${x})` : x}${changedNew.has(x) ? " [changed]" : ""}`);
}
if ((P.pureNew || []).length) {
  const changedNew = new Set([...Object.values(P.pairs || {}), ...(P.blocks || []).flatMap((b) => b.newNames)]);
  for (const [k, run] of pureNewRuns(P.pureNew).entries()) {
    const users = usersOf(run, changedNew);
    emit(`pureNew${String(k).padStart(2, "0")}__${run[0]}`.slice(0, 80), [], run,
      [`used by: ${users.length ? users.slice(0, 12).join(", ") + (users.length > 12 ? `, and ${users.length - 12} more` : "") : "(nothing outside this run)"}`]);
  }
}

fs.writeFileSync(path.join(OUTDIR, "_index.json"), JSON.stringify(index, null, 1));
const noop = index.filter((r) => r.normIdentical).length;
const lines = index.reduce((s, r) => s + (r.diff.changedLines || 0), 0);
const hunks = index.reduce((s, r) => s + (r.diff.hunks?.length || 0), 0);
const unreadable = index.filter((r) => !r.diff.file).map((r) => r.base);
console.error(`wrote ${index.length} declaration diffs -> ${OUTDIR}  (${noop} normalize-identical = pure minifier churn)`);
console.error(`  readable diffs: ${lines} changed lines in ${hunks} hunks` +
  (FP ? "" : "  (no --fp: unnamed top-level names cannot be aligned)") +
  (unreadable.length ? `; no readable diff for ${unreadable.join(", ")}` : ""));
