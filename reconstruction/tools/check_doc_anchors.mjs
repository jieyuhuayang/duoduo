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
//   node check_doc_anchors.mjs <daemon.pretty.js> <doc.md...>
//   node check_doc_anchors.mjs --resolve <daemon.pretty.js> <doc.md...>
// --resolve additionally reports the enclosing declaration's real name for each
// mismatch, which is the value the doc should almost always be corrected to.
import fs from "node:fs";
import { parse } from "@babel/parser";

let args = process.argv.slice(2);
const RESOLVE = args[0] === "--resolve";
if (RESOLVE) args = args.slice(1);
const [BUNDLE, ...docs] = args;
if (!BUNDLE || !docs.length) {
  console.error("usage: node check_doc_anchors.mjs [--resolve] <daemon.pretty.js> <doc.md...>");
  process.exit(2);
}
const src = fs.readFileSync(BUNDLE, "utf8");
const lines = src.split("\n");

// enclosing top-level declaration per line, built only when --resolve is on
let declFor = null;
if (RESOLVE) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  const lineAt = (o) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= o) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  const decls = [];
  const put = (name, stmt) => decls.push({ name, a: lineAt(stmt.start), b: lineAt(stmt.end) });
  for (const s of ast.program.body) {
    if (s.type === "FunctionDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "ClassDeclaration" && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, s);
  }
  declFor = (ln) => {
    let best = null;
    for (const d of decls) if (d.a <= ln && ln <= d.b && (!best || d.a > best.a)) best = d;
    return best ? best.name : null;
  };
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
// A citation may name the bundle it points into (`stdio.pretty.js:63969`). Line
// numbers are per-bundle, so such a citation is only meaningful against THAT
// bundle: checked against daemon it is guaranteed to "fail" while being
// perfectly correct. Capture the qualifier and skip the ones addressed to
// another bundle — an unqualified citation still means the bundle passed in.
const BUNDLE_NAME = (BUNDLE.split("/").pop() || "").replace(/\.pretty\.js$|\.js$/, "");
const FILEQ = "(?:((?:daemon|cli|stdio))(?:\\.pretty)?\\.js:)?";
const LINESPEC = "`?" + FILEQ + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`?";
const NAME = "`([A-Za-z_$][A-Za-z0-9_$]{1,5})`";
const CITES = [
  { re: new RegExp(NAME + "\\s*[（(]\\s*" + LINESPEC + "\\s*[）)]", "g"), n: 1, f: 2, a: 3, b: 4 },
  { re: new RegExp(NAME + "\\s*@\\s*" + LINESPEC, "g"), n: 1, f: 2, a: 3, b: 4 },
  { re: new RegExp("`" + FILEQ + "(\\d{4,6})(?:\\s*[-–]\\s*(\\d{4,6}))?`\\s*[（(]\\s*([A-Za-z_$][A-Za-z0-9_$]{1,5})\\s*[）)]", "g"), n: 4, f: 1, a: 2, b: 3 },
];

// A cited line is good if the short name appears on it, or (with --resolve) if
// the declaration enclosing it bears that name — an anchor into a body is
// legitimate. A range's end line is almost never the header, so for ranges the
// enclosing-declaration test is the only meaningful one.
const holds = (name, ln) => {
  if ((lines[ln - 1] ?? "").includes(name)) return true;
  return RESOLVE && declFor(ln) === name;
};

let checked = 0;
let skipped = 0;
const bad = [];
const backwards = [];
for (const f of docs) {
  const text = fs.readFileSync(f, "utf8");
  const seen = new Set();
  for (const { re, n, f: fq, a, b } of CITES) {
    for (const m of text.matchAll(re)) {
      if (seen.has(m.index)) continue;
      seen.add(m.index);
      if (m[fq] && m[fq] !== BUNDLE_NAME) { skipped++; continue; }
      checked++;
      const name = m[n], from = Number(m[a]), to = m[b] ? Number(m[b]) : null;
      if (to !== null && to < from) backwards.push({ f, name, from, to });
      for (const ln of to === null ? [from] : [from, to]) {
        if (holds(name, ln)) continue;
        bad.push({ f, name, ln, line: (lines[ln - 1] ?? "").trim().slice(0, 70), real: RESOLVE ? declFor(ln) : null });
      }
    }
  }
}

console.error(`checked ${checked} symbol/anchor citations against ${BUNDLE_NAME} across ${docs.length} file(s)` +
  (skipped ? ` (${skipped} skipped: explicitly addressed to another bundle — re-run with that bundle to check them)` : ""));
if (backwards.length) {
  console.error(`${backwards.length} range(s) run backwards (end before start):`);
  for (const b of backwards) console.error(`  ${b.f}  \`${b.name}\` ${b.from}-${b.to}`);
}
if (!bad.length && !backwards.length) { console.error("all citations hold"); process.exit(0); }
if (bad.length) console.error(`${bad.length} do NOT hold:`);
for (const b of bad) {
  console.error(`  ${b.f}  \`${b.name}\`(${b.ln})`);
  console.error(`      line ${b.ln} is: ${b.line}`);
  if (b.real) console.error(`      enclosing declaration is: ${b.real}   <-- likely the correct name`);
}
// Prose words in backticks ("append", "SINK") can trip this; eyeball before mass-editing.
process.exit(1);
