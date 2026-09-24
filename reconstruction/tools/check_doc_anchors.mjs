// Assert that every `symbol`(`line`) citation in the docs still holds.
//
// This is the safety net for a version bump, and it catches a class of error
// nothing else does. Every other check — lossless split, AST equivalence, even
// booting the daemon — passes with flying colours while the DOCS point at the
// wrong functions, because renaming is scope-safe: mislabelling costs nothing
// at runtime.
//
// The docs write claims as `symbol`(`line`) / `symbol`（`line`）. That pairing is
// redundant information, and redundancy is checkable: if the cited short name
// does not literally appear at the cited line of the new bundle, one of the two
// is stale. Run this after any anchor/symbol migration.
//
// The hard case it exists for: a short name can be BOTH stale and correct in the
// same release. In v0.6.2 `eKe` / `rle` / `sle` are the right names for the
// playlist parser and the entity/node lints, while the v0.6.1 functions that
// bore those names moved elsewhere — so a blanket old→new substitution silently
// corrupts the correct ones. Only ground truth from the bundle settles it.
//
// Usage:
//   node check_doc_anchors.mjs [--resolve] [--index <symbols.json>[,...]] [--bundle <name>=<pretty.js>]...
//                              <daemon.pretty.js> <doc.md...>
// --resolve additionally reports the enclosing declaration's real name for each
// mismatch, which is the value the doc should almost always be corrected to.
// --index refuses a bundle its index (matched by the index's own "bundle"
// field) was not built from. --bundle adds a bundle that citations qualified
// with its name (`cli.pretty.js:N`) are checked against; the positional bundle
// is the one unqualified citations mean, named after its file.
import fs from "node:fs";
import { parse } from "@babel/parser";
import { f2Cites, identRe } from "./anchor_forms.mjs";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (name) => { const i = args.indexOf(name); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const RESOLVE = flag("--resolve");
const INDEX = opt("--index");
const extra = new Map();
for (let v; (v = opt("--bundle")); ) {
  const [n, p] = v.split("=");
  if (!n || !p) { console.error(`--bundle wants <name>=<pretty.js>, got ${v}`); process.exit(2); }
  extra.set(n, p);
}
const [BUNDLE, ...docs] = args;
if (!BUNDLE || !docs.length) {
  console.error("usage: node check_doc_anchors.mjs [--resolve] [--index <symbols.json>[,...]] [--bundle <name>=<pretty.js>]... <daemon.pretty.js> <doc.md...>");
  process.exit(2);
}

// A citation may name the bundle it points into (`cli.pretty.js:67762`). Line
// numbers are per-bundle, so such a citation is only meaningful against THAT
// bundle: checked against daemon it is guaranteed to "fail" while being
// perfectly correct. An unqualified citation means the positional bundle.
// Citations addressed to a bundle that was not passed in are skipped and
// counted; the cli ones used to be skipped unconditionally, which left seven
// cli short names in ARCHITECTURE_ANALYSIS.md checked by no tool at all.
const BUNDLE_NAME = (BUNDLE.split("/").pop() || "").replace(/\.pretty\.js$|\.js$/, "");
if (extra.has(BUNDLE_NAME) && extra.get(BUNDLE_NAME) !== BUNDLE) {
  console.error(`--bundle ${BUNDLE_NAME}=${extra.get(BUNDLE_NAME)} contradicts the positional ${BUNDLE}`);
  process.exit(2);
}
const paths = new Map([...extra, [BUNDLE_NAME, BUNDLE]]);
const indexes = new Map();
for (const p of (INDEX || "").split(",").filter(Boolean)) { const ix = loadIndex(p); indexes.set(ix.bundle, ix); }
// With --index, the positional bundle must be one of them: a guard that cannot
// run because the file is named differently would pass silently, and every
// "does not hold" below would then be about the wrong file.
if (indexes.size && !indexes.has(BUNDLE_NAME)) {
  console.error(`no --index given for bundle "${BUNDLE_NAME}" (from ${BUNDLE}); indexes: ${[...indexes.keys()].join(", ")}`);
  process.exit(2);
}

// Bundles are read on first use; each is checked against its index then, so a
// cli bundle nobody cites costs nothing. The positional one is read now: its
// guard runs even for a doc with no citations.
const loaded = new Map();
function bundle(name) {
  if (loaded.has(name)) return loaded.get(name);
  const path = paths.get(name);
  let b = null;
  if (path) {
    const src = fs.readFileSync(path, "utf8");
    const lines = src.split("\n");
    if (indexes.has(name)) assertBundleMatchesIndex(lines, indexes.get(name), path);
    b = { name, src, lines, declFor: null };
  }
  loaded.set(name, b);
  return b;
}
bundle(BUNDLE_NAME);

// enclosing top-level declaration per line, built on the first --resolve
// lookup: a citation whose name is on its line never needs the parse
function declFor(b, ln) {
  if (!b.declFor) {
    const ast = parse(b.src, { sourceType: "module", attachComment: false });
    const decls = [];
    const put = (name, stmt) => decls.push({ name, a: stmt.loc.start.line, b: stmt.loc.end.line });
    for (const s of ast.program.body) {
      if (s.type === "FunctionDeclaration" && s.id) put(s.id.name, s);
      else if (s.type === "ClassDeclaration" && s.id) put(s.id.name, s);
      else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, s);
    }
    b.declFor = (n) => {
      let best = null;
      for (const d of decls) if (d.a <= n && n <= d.b && (!best || d.a > best.a)) best = d;
      return best ? best.name : null;
    };
  }
  return b.declFor(ln);
}

// The docs cite anchors in FOUR interchangeable syntaxes. Checking only the
// first is how a retarget can report "all citations hold" over widespread rot:
// the unchecked forms keep whatever the previous release left behind, and
// nothing downstream looks at them (v0.8.1 shipped an Appendix A that
// contradicted its own body this way).
//
//   A  `Name`(12345)          `Name`（`12345`）      both bracket styles
//   B  `Name`@12345           the @ separator
//   C  `Name`(`daemon.pretty.js:12345`)             file-qualified
//   D  `daemon.pretty.js:12345-12399` (Name)        reversed, as in Appendix A
//
// Any of them may carry a RANGE (`12345-12399`). Both endpoints are checked:
// a retarget that remaps only the start silently leaves the end pointing into
// unrelated code, and when the end lands before the start the range is
// backwards on its face — reported separately since no bundle lookup is
// needed to know it is wrong.
//
// The shapes themselves are in anchor_forms.mjs (F2), shared with
// check_bare_anchors.mjs so that a number is never claimed by neither tool.
const CITES = f2Cites();

// A cited line is good if the short name appears on it as a whole identifier,
// or (with --resolve) if the declaration enclosing it bears that name — an
// anchor into a body is legitimate. A range's end line is almost never the
// header, so for ranges the enclosing-declaration test is the only meaningful
// one. Half the cited short names are two characters, and a substring test
// passed `rn` on any line with a `return` on it.
const holds = (b, name, ln) => {
  if (identRe(name).test(b.lines[ln - 1] ?? "")) return true;
  return RESOLVE && declFor(b, ln) === name;
};

const checkedIn = new Map(); // bundle -> citations checked against it
const skipped = new Map();   // bundle not passed in -> citations addressed to it
const bad = [];
const backwards = [];
for (const f of docs) {
  const text = fs.readFileSync(f, "utf8");
  const seen = new Set();
  for (const { re, n, f: fq, a, b: bq } of CITES) {
    for (const m of text.matchAll(re)) {
      if (seen.has(m.index)) continue;
      seen.add(m.index);
      const bname = m[fq] || BUNDLE_NAME;
      const b = bundle(bname);
      if (!b) { skipped.set(bname, (skipped.get(bname) || 0) + 1); continue; }
      checkedIn.set(bname, (checkedIn.get(bname) || 0) + 1);
      const name = m[n], from = Number(m[a]), to = m[bq] ? Number(m[bq]) : null;
      if (to !== null && to < from) backwards.push({ f, name, bname, from, to });
      for (const ln of to === null ? [from] : [from, to]) {
        if (holds(b, name, ln)) continue;
        bad.push({ f, name, bname, ln, line: (b.lines[ln - 1] ?? "").trim().slice(0, 70), real: RESOLVE ? declFor(b, ln) : null });
      }
    }
  }
}

const at = (bname, ln) => bname === BUNDLE_NAME ? `${ln}` : `${bname}:${ln}`;
const total = [...checkedIn.values()].reduce((x, y) => x + y, 0);
const per = [...checkedIn].map(([k, v]) => `${k} ${v}`).join(", ");
const skip = [...skipped].map(([k, v]) => `${v} addressed to ${k}`).join(", ");
console.error(`checked ${total} symbol/anchor citations (${per || "none"}) across ${docs.length} file(s)` +
  (skip ? ` (skipped ${skip}: pass --bundle <name>=<pretty.js> to check them)` : ""));
if (backwards.length) {
  console.error(`${backwards.length} range(s) run backwards (end before start):`);
  for (const b of backwards) console.error(`  ${b.f}  \`${b.name}\` ${at(b.bname, b.from)}-${b.to}`);
}
if (!bad.length && !backwards.length) { console.error("all citations hold"); process.exit(0); }
if (bad.length) console.error(`${bad.length} do NOT hold:`);
for (const b of bad) {
  console.error(`  ${b.f}  \`${b.name}\`(${at(b.bname, b.ln)})`);
  console.error(`      line ${b.ln} is: ${b.line}`);
  if (b.real) console.error(`      enclosing declaration is: ${b.real}   <-- likely the correct name`);
}
// Prose words in backticks ("append", "SINK") can trip this; eyeball before mass-editing.
process.exit(1);
