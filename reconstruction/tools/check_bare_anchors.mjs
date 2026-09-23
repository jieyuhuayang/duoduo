// Police every line number in the docs that no other checker owns.
//
// A line number is only checkable when something next to it says what it is
// supposed to point at. anchor_forms.mjs lists the three shapes that do:
//
//   F1  `real (short)`（`N`）   owned by verify_citations.mjs
//   F2  `short`（`N`）          owned by check_doc_anchors.mjs
//   F3  `code`（`N`）           owned HERE: some distinctive token of the code
//                               (a string literal, or an identifier that is not
//                               a keyword) must be on line N, or within N-M
//
// Every other backticked line number is UNBOUND. At v0.8.2 there were ~680 of
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
//   --bundle cli=<cli.pretty.js>   check anchors written `cli.pretty.js:N`
//   --baseline <path>              per-doc ceiling on unbound anchors
//   --write-baseline               record the current counts there and exit 0
//   --list <out.json>              every unbound / refuted anchor, with context
// Exit: 2 bundle/index mismatch, 1 anything refuted or a baseline exceeded.
import fs from "node:fs";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { f1Forward, f1Reversed, f2Cites, f3, lineSpan, snippetTokens } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";
const traverse = _traverse.default || _traverse;

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const INDEX = opt("--index");
const BASELINE = opt("--baseline");
const LIST = opt("--list");
const WRITE_BASELINE = flag("--write-baseline");
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
const B = new Map(); // name -> { lines, decls, realOf }
function load(name) {
  if (B.has(name)) return B.get(name);
  const path = bundles.get(name);
  if (!path) { B.set(name, null); return null; }
  const src = fs.readFileSync(path, "utf8");
  const lines = src.split("\n");
  const ix = indexes.get(name);
  if (ix) assertBundleMatchesIndex(lines, ix, path);
  // Top-level declarations for the vendor test, plus every named function-like
  // declaration at any depth for --list: esbuild wraps whole modules in a lazy
  // initialiser thousands of lines long, so "the enclosing top-level
  // declaration" often says nothing about what a line is.
  const ast = parse(src, { sourceType: "module" });
  const top = [], all = [];
  for (const s of ast.program.body) {
    const L = s.loc;
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) top.push({ name: s.id.name, a: L.start.line, b: L.end.line });
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") top.push({ name: d.id.name, a: L.start.line, b: L.end.line });
  }
  const fnLike = new Set(["FunctionExpression", "ArrowFunctionExpression", "ClassExpression"]);
  traverse(ast, {
    FunctionDeclaration(p) { if (p.node.id) all.push({ name: p.node.id.name, a: p.node.loc.start.line, b: p.node.loc.end.line, kind: "function" }); },
    ClassDeclaration(p) { if (p.node.id) all.push({ name: p.node.id.name, a: p.node.loc.start.line, b: p.node.loc.end.line, kind: "class" }); },
    VariableDeclarator(p) {
      const n = p.node;
      if (n.id.type === "Identifier" && n.init && fnLike.has(n.init.type)) all.push({ name: n.id.name, a: n.loc.start.line, b: n.loc.end.line, kind: "function-expr" });
    },
  });
  const realOf = new Map(ix ? Object.entries(ix.symbols).map(([r, e]) => [e.mangled, r]) : []);
  const b = { lines, top, all, realOf };
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

// ---- docs ----------------------------------------------------------------
const bundleOf = (q) => (q === "cli" || q === "stdio") ? q : "daemon";
const counts = { f3ok: 0, f3bad: 0, unbound: 0, blank: 0, vendor: 0, backwards: 0, owned: 0 };
const perDoc = {};
const listed = [];
const refuted = [];

for (const f of docs) {
  const t = fs.readFileSync(f, "utf8");
  const docName = f.split("/").pop();
  const docLineOf = (off) => t.slice(0, off).split("\n").length;
  const docLines = t.split("\n");
  perDoc[docName] = 0;

  // offsets of every line number F1/F2 already own
  const owned = [];
  for (const mk of [f1Forward, f1Reversed]) for (const m of t.matchAll(mk())) owned.push([m.index, m.index + m[0].length]);
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

  for (const m of t.matchAll(lineSpan())) {
    const [, qual, fromS, toS] = m;
    const from = Number(fromS), to = toS ? Number(toS) : null;
    const where = `${docName} L${docLineOf(m.index)}`;
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
      if (txt === "") { counts.blank++; refuted.push(`${where}: ${from} -> BLANK LINE`); listed.push({ ...entry(), status: "refuted: blank line" }); continue; }
      if (top && vendor.has(top.name)) { counts.vendor++; refuted.push(`${where}: ${from} -> inside VENDOR ${top.name}`); listed.push({ ...entry(), status: "refuted: vendor code" }); continue; }
    }

    const code = snippetAt.get(m.index);
    const toks = code ? snippetTokens(code) : [];
    // A snippet that is a single identifier binds by that identifier even when
    // it is short: `lg`（`63829`/`63900`） — F2 owns the first, this the rest.
    if (code && !toks.length && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(code.trim())) toks.push(code.trim());
    if (toks.length && bundle) {
      const span = bundle.lines.slice(from - 1, (to ?? from));
      const hit = toks.some(tk => span.some(l => l.includes(tk)));
      if (hit) { counts.f3ok++; continue; }
      counts.f3bad++;
      refuted.push(`${where}: \`${code.slice(0, 50)}\` not on ${bname} ${from}${to ? "-" + to : ""}`);
      listed.push({ ...entry(), status: "refuted: snippet not on line", snippet: code });
      continue;
    }
    counts.unbound++;
    perDoc[docName]++;
    listed.push({ ...entry(), status: code ? "unbound: snippet has no checkable token" : (bundle ? "unbound" : `unbound: no ${bname} bundle given`), snippet: code || null });
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
if (refuted.length) { console.log(`\nrefuted:`); refuted.slice(0, 20).forEach(e => console.log("  " + e)); if (refuted.length > 20) console.log(`  ... and ${refuted.length - 20} more (--list for all)`); }

let over = 0;
if (BASELINE) {
  if (WRITE_BASELINE) {
    fs.writeFileSync(BASELINE, JSON.stringify({
      note: "Per-doc ceiling on UNBOUND line numbers (check_bare_anchors.mjs). It may only go down: write new citations in an F1/F2/F3 shape (anchor_forms.mjs).",
      unbound: perDoc,
    }, null, 2) + "\n");
    console.log(`\nbaseline written: ${BASELINE}`);
    process.exit(0);
  }
  const base = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, "utf8")).unbound : {};
  for (const [d, n] of Object.entries(perDoc)) {
    const cap = base[d] ?? 0;
    if (n > cap) { over++; console.log(`  BASELINE EXCEEDED  ${d}: ${n} unbound, ceiling ${cap}`); }
    else if (n < cap) console.log(`  (${d}: ${n} unbound, below ceiling ${cap} — lower it with --write-baseline)`);
  }
}
process.exit(refuted.length + over > 0 ? 1 : 0);
