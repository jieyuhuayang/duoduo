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

// `Name`(`12345`) and `Name`（`12345`) — both bracket styles, optional inner backticks
const CITE = /`([A-Za-z_$][A-Za-z0-9_$]{1,5})`\s*[（(]\s*`?(\d{4,6})`?\s*[）)]/g;

let checked = 0;
const bad = [];
for (const f of docs) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(CITE)) {
    checked++;
    const name = m[1], ln = Number(m[2]);
    const line = lines[ln - 1] ?? "";
    if (line.includes(name)) continue;
    // The anchor often points INTO a function body rather than at its header;
    // that is legitimate as long as the enclosing declaration bears the name.
    if (RESOLVE && declFor(ln) === name) continue;
    bad.push({ f, name, ln, line: line.trim().slice(0, 70), real: RESOLVE ? declFor(ln) : null });
  }
}

console.error(`checked ${checked} symbol/anchor citations across ${docs.length} file(s)`);
if (!bad.length) { console.error("all citations hold"); process.exit(0); }
console.error(`${bad.length} do NOT hold:`);
for (const b of bad) {
  console.error(`  ${b.f}  \`${b.name}\`(${b.ln})`);
  console.error(`      line ${b.ln} is: ${b.line}`);
  if (b.real) console.error(`      enclosing declaration is: ${b.real}   <-- likely the correct name`);
}
// Prose words in backticks ("append", "SINK") can trip this; eyeball before mass-editing.
process.exit(1);
