// Police every line number in the docs that no other checker owns.
//
// A line number is only checkable when something next to it says what it is
// supposed to point at. anchor_forms.mjs lists the three shapes that do:
//
//   F1  `real (short)`（`N`）   owned by verify_citations.mjs
//   F2  `short`（`N`）          owned by check_doc_anchors.mjs
//   F3  `code`（`N`）           owned HERE: some distinctive token of the code
//                               (a string literal, or an identifier that is not
//                               a keyword) must be on line N, or within N-M, and
//                               so must every short mangled name it calls
//   N   `code`（`realName`）    owned HERE, no line number: the same test, run
//                               over the named symbol's current span (--index),
//                               strictly -- whole-word identifiers, every number
//                               the snippet writes, every `x = <number>` clause
//                               as a token sequence (`Ydt = 5` is refuted where
//                               the span assigns 5 to another constant), and a
//                               snippet of short names and numbers only
//                               (`vH = 5, wH = 180 * 1e3`) as a whole token
//                               sequence (anchor_forms.mjs snippetHolds);
//                               `cli:realName` for a cli symbol
//
// Every other backticked line number is UNBOUND, and so is one written where
// lineSpan() cannot match it — `daemon:N` in plain text, several lines in one
// span, a span opening with a line number (anchor_forms.mjs looseLineNumbers). At v0.8.2 there were ~680 of
// them, and sampling found them pointing into the wrong function as often as
// not — a bare number has no redundancy, so it rots without any signal. They
// are counted per doc against maps/bare_anchor_baseline.json, and the count may
// only go down: a new citation must be written in one of the three shapes.
//
// Also kept from the earlier, refute-only version of this tool, because they
// need no knowledge of what the number meant: a daemon anchor landing on a
// blank line or inside a vendor module's export, and a range that runs
// backwards, cannot be correct whatever the sentence claims.
//
// Usage:
//   node check_bare_anchors.mjs [options] <daemon.pretty.js> <blocks.json> <modules.json> <doc.md...>
// Options:
//   --index <symbols.json>[,...]   refuse a bundle the index was not built from;
//                                  also resolves real names in --list output
//   --bundle cli=<cli.pretty.js>   check anchors written `cli.pretty.js:N`; read
//                                  (and checked against its index) only when a
//                                  doc has a cli citation this tool must check
//   --baseline <path>              per-doc ceilings on unbound anchors and on
//                                  all line numbers
//   --write-baseline               record the current counts there and exit 0
//                                  (never above an existing ceiling...)
//   --allow-raise                  (...unless this is given)
//   --list <out.json>              every unbound / refuted anchor, with context
// Exit: 2 bundle/index mismatch, 1 anything refuted or a baseline exceeded.
import fs from "node:fs";
import { parse } from "@babel/parser";
import { f1Forward, f1Reversed, f2Cites, f3, nameBound, lineSpans, looseLineNumbers, snippetHolds, looksReal, looksRealName } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const INDEX = opt("--index");
const BASELINE = opt("--baseline");
const LIST = opt("--list");
// @babel/traverse only serves --list (see load()); importing it costs ~0.2 s
const traverse = LIST ? ((m) => m.default.default || m.default)(await import("@babel/traverse")) : null;
const WRITE_BASELINE = flag("--write-baseline");
const ALLOW_RAISE = flag("--allow-raise");
const extra = new Map();
for (let v; (v = opt("--bundle")); ) { const [n, p] = v.split("="); extra.set(n, p); }
const [BUNDLE, BLOCKS, MODULES, ...docs] = argv;
if (!BUNDLE || !BLOCKS || !MODULES || !docs.length || (WRITE_BASELINE && !BASELINE)) {
  console.error("usage: node check_bare_anchors.mjs [--index s.json[,...]] [--bundle cli=<p>] [--baseline b.json [--write-baseline]] [--list o.json] <daemon.pretty.js> <blocks.json> <modules.json> <doc.md...>");
  process.exit(2);
}

// ---- bundles -------------------------------------------------------------
const bundles = new Map([["daemon", BUNDLE], ...extra]);
const indexes = new Map();
for (const p of (INDEX || "").split(",").filter(Boolean)) { const ix = loadIndex(p); indexes.set(ix.bundle, ix); }
// name -> { lines, realOf, top, all }. A bundle is read the first time a
// citation needs it, and parsed the first time a question needs its syntax, so
// the cost of a run follows what the docs cite. This tool used to parse and
// fully traverse every bundle up front (about 5 s a run), and the mutation test
// runs it twenty-odd times.
const B = new Map();
function load(name) {
  if (B.has(name)) return B.get(name);
  const path = bundles.get(name);
  if (!path) { B.set(name, null); return null; }
  const src = fs.readFileSync(path, "utf8");
  const lines = src.split("\n");
  const ix = indexes.get(name);
  if (ix) assertBundleMatchesIndex(lines, ix, path);
  let ast = null, top = null, all = null;
  const tree = () => (ast ??= parse(src, { sourceType: "module", attachComment: false }));
  const b = {
    lines,
    realOf: new Map(ix ? Object.entries(ix.symbols).map(([r, e]) => [e.mangled, r]) : []),
    // Top-level declarations, for the vendor test (and --list).
    get top() {
      if (top) return top;
      top = [];
      for (const s of tree().program.body) {
        const L = s.loc;
        if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) top.push({ name: s.id.name, a: L.start.line, b: L.end.line });
        else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") top.push({ name: d.id.name, a: L.start.line, b: L.end.line });
      }
      return top;
    },
    // Every named function-like declaration at any depth, for --list only:
    // esbuild wraps whole modules in a lazy initialiser thousands of lines
    // long, so "the enclosing top-level declaration" often says nothing about
    // what a line is. Nothing is checked against this.
    get all() {
      if (all) return all;
      all = [];
      const fnLike = new Set(["FunctionExpression", "ArrowFunctionExpression", "ClassExpression"]);
      traverse(tree(), {
        FunctionDeclaration(p) { if (p.node.id) all.push({ name: p.node.id.name, a: p.node.loc.start.line, b: p.node.loc.end.line, kind: "function" }); },
        ClassDeclaration(p) { if (p.node.id) all.push({ name: p.node.id.name, a: p.node.loc.start.line, b: p.node.loc.end.line, kind: "class" }); },
        VariableDeclarator(p) {
          const n = p.node;
          if (n.id.type === "Identifier" && n.init && fnLike.has(n.init.type)) all.push({ name: n.id.name, a: n.loc.start.line, b: n.loc.end.line, kind: "function-expr" });
        },
      });
      return all;
    },
  };
  B.set(name, b);
  return b;
}
const innermost = (decls, ln) => { let best = null; for (const d of decls) if (d.a <= ln && ln <= d.b && (!best || d.a > best.a || (d.a === best.a && d.b < best.b))) best = d; return best; };

const daemon = load("daemon");
const blocksReport = JSON.parse(fs.readFileSync(BLOCKS, "utf8"));
const modules = JSON.parse(fs.readFileSync(MODULES, "utf8"));
const matches = (block, record) => record.marker.filter(n => new Set(block.names).has(n)).length >= Math.min(2, record.marker.length);
const vendor = new Set();
for (const b of blocksReport.blocks) if ((modules.vendor || []).some(r => matches(b, r))) for (const m of b.mangled) vendor.add(m);

// Mirrors verify_citations.mjs's decision to check a `Real (short)` pairing:
// the first name is indexed, or is an indexed symbol's short name, or looks
// like a real name (then an unknown one is a FATAL "missing symbol" there).
// looksReal is the same function there (anchor_forms.mjs), not a copy of it.
// Without --index nothing can be decided, and every F1 shape counts as owned.
const indexedNames = new Set(), indexedShort = new Set();
for (const ix of indexes.values()) for (const [r, e] of Object.entries(ix.symbols)) { indexedNames.add(r); indexedShort.add(e.mangled); }
const f1Checked = (name) => !indexes.size || indexedNames.has(name) || indexedShort.has(name) || looksReal(name);

// ---- docs ----------------------------------------------------------------
const bundleOf = (q) => (q === "cli" || q === "stdio") ? q : "daemon";
const counts = { f3ok: 0, f3bad: 0, unbound: 0, blank: 0, vendor: 0, backwards: 0, owned: 0 };
const named = { ok: 0, bad: 0 };
// "bundle:realName" -> entry; a real name can exist in both bundles (`main`)
const symbolOf = new Map();
for (const ix of indexes.values()) for (const [r, e] of Object.entries(ix.symbols)) symbolOf.set(`${ix.bundle}:${r}`, { bundle: ix.bundle, e });
// does a snippet hold on lines [a, b] of a bundle? (F3 and N share one rule:
// anchor_forms.mjs snippetHolds, which convert_line_citations.mjs imports too)
const perDoc = {};       // unbound line numbers
const linesPerDoc = {};  // every line number, whatever its shape
const listed = [];
const refuted = [];
// --list detail is built only when --list is given: resolving what encloses a
// line takes a full traversal of the bundle, and nothing is decided by it
const list = LIST ? (rec) => listed.push(rec()) : () => {};

for (const f of docs) {
  const t = fs.readFileSync(f, "utf8");
  const docName = f.split("/").pop();
  // offset -> 1-based doc line, by binary search over line starts (slicing and
  // splitting the doc once per number was quadratic)
  const starts = [0];
  for (let i = t.indexOf("\n"); i >= 0; i = t.indexOf("\n", i + 1)) starts.push(i + 1);
  const docLineOf = (off) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; } return lo + 1; };
  const docLines = t.split("\n");
  perDoc[docName] = 0;
  linesPerDoc[docName] = 0;

  // offsets of every line number F1/F2 already own
  const owned = [];
  // An F1 shape is owned only if verify_citations.mjs will really check it.
  // `oa(e)`（N） has the same shape as `real (short)`（N）, and that tool skips a
  // pair when neither name is indexed and the first does not look like a real
  // name — the number would then be owned by nobody. Such a span is a code
  // snippet, and falls through to F3 below.
  for (const m of t.matchAll(f1Forward())) if (f1Checked(m[1])) owned.push([m.index, m.index + m[0].length]);
  for (const m of t.matchAll(f1Reversed())) if (f1Checked(m[5])) owned.push([m.index, m.index + m[0].length]);
  for (const { re } of f2Cites()) for (const m of t.matchAll(re)) owned.push([m.index, m.index + m[0].length]);
  const isOwned = (off) => owned.some(([a, b]) => a <= off && off < b);

  // offset of a line span -> the snippet binding it (F3)
  const snippetAt = new Map();
  for (const m of t.matchAll(f3())) {
    const code = m[1];
    if (/^(?:(?:daemon|cli|stdio)(?:\.pretty)?(?:\.js)?:)?\d{4,6}(?:\s*[-–]\s*\d{4,6})?$/.test(code)) continue; // a line, not code
    const listStart = m.index + m[0].length - m[2].length;
    for (const s of m[2].matchAll(/`[^`]+`/g)) snippetAt.set(listStart + s.index, code);
  }

  // N: `code`（`realName`） — evidence bound to a symbol, not to a line
  if (indexes.size) for (const m of t.matchAll(nameBound())) {
    const [, code, qual, name] = m;
    const where = `${docName} L${docLineOf(m.index)}`;
    const sym = symbolOf.get(`${qual || "daemon"}:${name}`);
    if (!sym) {
      // `a`（`b`） is not a citation unless b looks like a real name. looksReal
      // wants a lower-case letter, so an UPPER_SNAKE constant (a value
      // name_symbol.mjs registers, or upstream's GROK_ACP_COMPACT) that left
      // the index was skipped as prose; looksRealName reads it as a name.
      if (looksReal(name) || looksRealName(name)) { named.bad++; refuted.push(`${where}: \`${code.slice(0, 50)}\` bound to \`${name}\`, which is no indexed symbol`); list(() => ({ doc: docName, docLine: docLineOf(m.index), snippet: code, symbol: name, status: "refuted: unknown symbol" })); }
      continue;
    }
    const bundle = load(sym.bundle);
    const r = bundle ? snippetHolds(code, bundle.lines, sym.e.line, sym.e.endLine, true) : { checkable: false };
    if (r.checkable && r.ok) { named.ok++; continue; }
    named.bad++;
    const why = !r.checkable ? "has no checkable token" : `not inside ${name} (${sym.e.mangled})${r.heads.length ? ` (callee ${r.heads.join(",")} is not there)` : ""}${r.numbers ? ` (number ${r.numbers.join(",")} is not there)` : ""}${r.assignments ? ` (assignment ${r.assignments.join("; ")} is not there)` : ""}`;
    refuted.push(`${where}: \`${code.slice(0, 50)}\` ${why}`);
    list(() => ({ doc: docName, docLine: docLineOf(m.index), snippet: code, symbol: name, span: `${sym.e.line}-${sym.e.endLine}`, status: `refuted: ${why}` }));
  }

  // outside fences only: looseLineNumbers() below owns every number in a fence
  // (anchor_forms.mjs lineSpans), so each is counted once
  for (const m of lineSpans(t)) {
    const [, qual, fromS, toS] = m;
    const from = Number(fromS), to = toS ? Number(toS) : null;
    const where = `${docName} L${docLineOf(m.index)}`;
    linesPerDoc[docName]++;
    if (to !== null && to < from) { counts.backwards++; refuted.push(`${where}: ${from}-${to} -> RANGE RUNS BACKWARDS`); }
    if (isOwned(m.index)) { counts.owned++; continue; }

    const bname = bundleOf(qual);
    const bundle = load(bname);
    const entry = () => {
      const d = bundle ? innermost(bundle.all, from) : null, top = bundle ? innermost(bundle.top, from) : null;
      return {
        doc: docName, docLine: docLineOf(m.index), anchor: m[0], bundle: bname, from, to,
        ...(to !== null && to < from ? { backwards: true } : {}),
        docText: docLines[docLineOf(m.index) - 1],
        code: bundle ? (bundle.lines[from - 1] ?? "").trim().slice(0, 200) : null,
        enclosing: d ? { mangled: d.name, real: bundle.realOf.get(d.name) || null, span: `${d.a}-${d.b}`, kind: d.kind } : null,
        topLevel: top ? { mangled: top.name, real: bundle.realOf.get(top.name) || null, span: `${top.a}-${top.b}` } : null,
      };
    };

    // Refutations that need no idea of what the number meant (daemon only: the
    // vendor list is the daemon's).
    if (bname === "daemon") {
      const txt = (daemon.lines[from - 1] ?? "").trim();
      const top = innermost(daemon.top, from);
      if (txt === "") { counts.blank++; refuted.push(`${where}: ${from} -> BLANK LINE`); list(() => ({ ...entry(), status: "refuted: blank line" })); continue; }
      if (top && vendor.has(top.name)) { counts.vendor++; refuted.push(`${where}: ${from} -> inside VENDOR ${top.name}`); list(() => ({ ...entry(), status: "refuted: vendor code" })); continue; }
    }

    const code = snippetAt.get(m.index);
    // A snippet binds by its literals and long identifiers; failing those, a
    // single identifier (`lg`) or a short call (`$e(w)`) binds by itself.
    const r = code && bundle ? snippetHolds(code, bundle.lines, from, to ?? from) : { checkable: false };
    if (r.checkable) {
      if (r.ok) { counts.f3ok++; continue; }
      counts.f3bad++;
      refuted.push(`${where}: \`${code.slice(0, 50)}\` not on ${bname} ${from}${to ? "-" + to : ""}${r.heads.length ? ` (callee ${r.heads.join(",")} is not there)` : ""}`);
      list(() => ({ ...entry(), status: "refuted: snippet not on line", snippet: code }));
      continue;
    }
    counts.unbound++;
    perDoc[docName]++;
    list(() => ({ ...entry(), status: code ? "unbound: snippet has no checkable token" : (bundle ? "unbound" : `unbound: no ${bname} bundle given`), snippet: code || null }));
  }

  // Numbers lineSpan() cannot see (anchor_forms.mjs looseLineNumbers): a
  // qualified number outside any code span, a span listing several lines, a
  // span opening with a line number, a number in a parenthesis after a span
  // without backticks of its own, a number inside a fence. Unless F1/F2 own it
  // (`Name`(12345) needs no backticks there), each is unbound.
  for (const n of looseLineNumbers(t)) {
    linesPerDoc[docName]++;
    if (isOwned(n.index)) { counts.owned++; continue; }
    const where = `${docName} L${docLineOf(n.index)}`;
    if (n.to !== null && n.to < n.from) { counts.backwards++; refuted.push(`${where}: ${n.from}-${n.to} -> RANGE RUNS BACKWARDS`); }
    counts.unbound++;
    perDoc[docName]++;
    list(() => ({ doc: docName, docLine: docLineOf(n.index), anchor: n.text, bundle: bundleOf(n.qual), from: n.from, to: n.to,
      docText: docLines[docLineOf(n.index) - 1], status: "unbound: not written as a single-line code span" }));
  }
}

if (LIST) fs.writeFileSync(LIST, JSON.stringify(listed, null, 1));
console.log(`line numbers examined             : ${Object.values(counts).reduce((a, b) => a + b, 0) - counts.backwards}`);
console.log(`  owned by F1/F2 (other checkers)  : ${counts.owned}`);
console.log(`  F3 snippet holds on the line     : ${counts.f3ok}`);
console.log(`  REFUTED - snippet not on line    : ${counts.f3bad}`);
console.log(`  REFUTED - lands on a blank line  : ${counts.blank}`);
console.log(`  REFUTED - lands in vendor code   : ${counts.vendor}`);
console.log(`  REFUTED - range runs backwards   : ${counts.backwards}`);
console.log(`  UNBOUND (nothing can check them) : ${counts.unbound}`);
console.log(`name-bound snippets (no line)     : ${named.ok + named.bad}`);
console.log(`  hold inside the named symbol     : ${named.ok}`);
console.log(`  REFUTED                          : ${named.bad}`);
const perDocLines = Object.entries(linesPerDoc).filter(([, n]) => n).map(([d, n]) => `${d} ${n}`).join(", ");
console.log(`line numbers per doc (legacy)     : ${perDocLines || "none"}`);
if (refuted.length) { console.log(`\nrefuted:`); refuted.slice(0, 20).forEach(e => console.log("  " + e)); if (refuted.length > 20) console.log(`  ... and ${refuted.length - 20} more (--list for all)`); }

let over = 0;
if (BASELINE) {
  const NOTE = "Per-doc ceilings (check_bare_anchors.mjs); neither may go up. unbound: line numbers in none of the F1/F2/F3 shapes. lineNumbers: every line number, whatever its shape. Line numbers are legacy: cite by real name (`real (short)`, no line) or by a string literal inside a named function, and lower these with --write-baseline when citations are removed.";
  const prev = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")) : {};
  const ceilings = { unbound: prev.unbound || {}, lineNumbers: prev.lineNumbers || {} };
  const measured = { unbound: perDoc, lineNumbers: linesPerDoc };
  if (WRITE_BASELINE) {
    const raised = [];
    for (const kind of ["unbound", "lineNumbers"])
      for (const [d, n] of Object.entries(measured[kind])) {
        const cap = ceilings[kind][d];
        // an unrecorded doc starts at 0, so recording it with any count is a raise
        if (n > (cap ?? 0) && !(kind === "lineNumbers" && !prev.lineNumbers)) raised.push(`${d} ${kind}: ${cap ?? 0} -> ${n}`);
      }
    if (raised.length && !ALLOW_RAISE) {
      console.log(`\nrefusing to raise a ceiling (pass --allow-raise if this is really intended):`);
      raised.forEach(r => console.log("  " + r));
      process.exit(1);
    }
    fs.writeFileSync(BASELINE, JSON.stringify({ note: NOTE, unbound: measured.unbound, lineNumbers: measured.lineNumbers }, null, 2) + "\n");
    console.log(`\nbaseline written: ${BASELINE}`);
    process.exit(0);
  }
  for (const kind of ["unbound", "lineNumbers"])
    for (const [d, n] of Object.entries(measured[kind])) {
      const cap = ceilings[kind][d] ?? 0;
      if (n > cap) { over++; console.log(`  BASELINE EXCEEDED  ${d}: ${n} ${kind}, ceiling ${cap}${kind === "lineNumbers" ? " — cite by name instead of adding a line number" : ""}`); }
      else if (n < cap) console.log(`  (${d}: ${n} ${kind}, below ceiling ${cap} — lower it with --write-baseline)`);
    }
}
process.exit(refuted.length + over > 0 ? 1 : 0);
