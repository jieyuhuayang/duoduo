// Formatting-preserving, scope-safe identifier renamer.
// Uses Babel scope analysis to find the exact reference ranges of a TOP-LEVEL
// binding, then splices the new name into the ORIGINAL source text (preserving
// all beautified formatting). Only renames a binding if the new name is not
// already bound at program scope (collision guard). Semantics-preserving.
// Usage: node rename.mjs <input.pretty.js> <rename.json> <out.js> [report.json]
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";

const [, , INPUT, MAP, OUT, REPORT] = process.argv;
const src = fs.readFileSync(INPUT, "utf8");
const renameMap = JSON.parse(fs.readFileSync(MAP, "utf8")); // mangled -> newName
const ast = parse(src, { sourceType: "module", ranges: true });

let programScope;
traverse(ast, { Program(p) { programScope = p.scope; p.stop(); } });

const edits = []; // {start, end, text}
const applied = [], skippedMissing = [], skippedCollision = [];
const existingTopLevel = new Set(Object.keys(programScope.bindings));

for (const [mangled, newName] of Object.entries(renameMap)) {
  const binding = programScope.bindings[mangled];
  if (!binding) { skippedMissing.push(mangled); continue; }
  // collision: another distinct top-level binding already owns newName
  if (existingTopLevel.has(newName) && newName !== mangled) { skippedCollision.push(`${mangled}->${newName}`); continue; }
  const nodes = new Set();
  nodes.add(binding.identifier);
  for (const rp of binding.referencePaths) nodes.add(rp.node);
  for (const cv of binding.constantViolations) {
    // reassignment target identifier
    if (cv.node && cv.node.left && cv.node.left.type === "Identifier") nodes.add(cv.node.left);
  }
  let count = 0;
  for (const id of nodes) {
    if (id && typeof id.start === "number" && id.name === mangled) {
      edits.push({ start: id.start, end: id.end, text: newName });
      count++;
    }
  }
  applied.push({ mangled, newName, refs: count });
  // reserve the new name so a later map entry can't collide onto it
  existingTopLevel.add(newName);
}

// apply edits descending by start (non-overlapping by construction)
edits.sort((a, b) => b.start - a.start);
let out = src;
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
fs.writeFileSync(OUT, out);

const report = {
  input: INPUT, out: OUT,
  appliedCount: applied.length, editCount: edits.length,
  skippedMissingCount: skippedMissing.length, skippedCollisionCount: skippedCollision.length,
  applied, skippedMissing, skippedCollision,
};
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`applied ${applied.length} renames (${edits.length} identifier occurrences), skipped ${skippedMissing.length} missing, ${skippedCollision.length} collisions`);
if (skippedMissing.length) console.log("  missing (not top-level bindings):", skippedMissing.join(", "));
if (skippedCollision.length) console.log("  collisions:", skippedCollision.join(", "));
