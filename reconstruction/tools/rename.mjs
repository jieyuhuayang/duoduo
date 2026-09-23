// Formatting-preserving, scope-safe identifier renamer.
// Splices each new name into the ORIGINAL source text (preserving all
// beautified formatting, hence every line number), for top-level bindings only.
//
// Which occurrences belong to a binding is decided by resolving EVERY
// identifier through Babel's scope chain, not by trusting
// binding.referencePaths / constantViolations: those miss write positions such
// as a second `var X` declarator, a destructuring target (`[X] = ...`) and a
// for-in/of head, and renaming the declaration while leaving such a write on the
// old name silently changes which variable the program assigns.
//
// Three rewrites need more than a plain splice, because one source token is two
// AST nodes and only one of them may change:
//   { X }            -> { X: newName }         object shorthand keeps its key
//   export { X }     -> export { newName as X } exported name is public API
//   import { X }     -> import { X as newName }  imported name belongs to the module
//
// A rename is REFUSED (and the run fails) when it could change what any
// identifier resolves to:
//   - newName is already a top-level binding, or the target of an earlier entry
//   - newName is a free (global) name the program uses, e.g. `setTimeout`
//   - at some occurrence, an enclosing non-top-level scope binds newName, so the
//     renamed reference would be captured by that inner binding
//   - newName is not a valid identifier
// ast_equiv.mjs re-checks all of this independently on the output.
//
// Usage: node rename.mjs <input.pretty.js> <rename.json> <out.js> [report.json]
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";

const [, , INPUT, MAP, OUT, REPORT] = process.argv;
const src = fs.readFileSync(INPUT, "utf8");
const renameMap = JSON.parse(fs.readFileSync(MAP, "utf8")); // mangled -> newName
const ast = parse(src, { sourceType: "module", ranges: true });

// An Identifier that names a variable (declares, reads or writes one), as
// opposed to a property name, a label, or the public side of an import/export.
function isVariableOccurrence(p) {
  const n = p.node, par = p.parent;
  if ((par.type === "MemberExpression" || par.type === "OptionalMemberExpression") && par.property === n && !par.computed) return false;
  if ((par.type === "ObjectProperty" || par.type === "ObjectMethod" || par.type === "ClassProperty" ||
       par.type === "ClassMethod" || par.type === "ClassAccessorProperty" || par.type === "ClassPrivateProperty") &&
      par.key === n && !par.computed) return false;
  if ((par.type === "LabeledStatement" || par.type === "BreakStatement" || par.type === "ContinueStatement") && par.label === n) return false;
  if (par.type === "ExportSpecifier" && par.exported === n) return false;
  if (par.type === "ExportNamespaceSpecifier" || par.type === "ExportDefaultSpecifier") return false;
  if (par.type === "ImportSpecifier" && par.imported === n) return false;
  if (par.type === "MetaProperty") return false;
  if (par.type === "PrivateName") return false;
  return true;
}

let programScope;
const occurrences = new Map(); // mangled -> [path]
const freeNames = new Set();   // names used but bound nowhere (globals)
let directEval = 0;
traverse(ast, {
  Program(p) { programScope = p.scope; },
  CallExpression(p) { if (p.node.callee.type === "Identifier" && p.node.callee.name === "eval" && !p.scope.getBinding("eval")) directEval++; },
  Identifier(p) {
    if (!isVariableOccurrence(p)) return;
    const name = p.node.name;
    const b = p.scope.getBinding(name);
    if (!b) { freeNames.add(name); return; }
    if (!(name in renameMap) || b !== programScope.bindings[name]) return;
    if (!occurrences.has(name)) occurrences.set(name, []);
    occurrences.get(name).push(p);
  },
});

const edits = []; // {start, end, text}
const applied = [], skippedMissing = [], skippedCollision = [];
const taken = new Set(Object.keys(programScope.bindings));

for (const [mangled, newName] of Object.entries(renameMap)) {
  const binding = programScope.bindings[mangled];
  if (!binding) { skippedMissing.push(mangled); continue; }
  const paths = occurrences.get(mangled) || [];
  const refuse = why => skippedCollision.push(`${mangled}->${newName} (${why})`);
  if (newName === mangled) { applied.push({ mangled, newName, refs: 0 }); continue; }
  if (!t.isValidIdentifier(newName)) { refuse("not a valid identifier"); continue; }
  if (taken.has(newName)) { refuse("already a top-level binding or an earlier rename target"); continue; }
  if (freeNames.has(newName)) { refuse("a global the program uses"); continue; }
  const captured = paths.find(p => p.scope.getBinding(newName));
  if (captured) { refuse(`captured by an inner binding at line ${captured.node.loc.start.line}`); continue; }

  for (const p of paths) {
    const n = p.node, par = p.parent;
    let text = newName;
    const inShorthand = par.type === "ObjectProperty" && par.shorthand && par.value === n;
    const inShorthandDefault = par.type === "AssignmentPattern" && par.left === n &&
      p.parentPath.parent.type === "ObjectProperty" && p.parentPath.parent.shorthand && p.parentPath.parent.value === par;
    if (inShorthand || inShorthandDefault) text = `${mangled}: ${newName}`;
    else if (par.type === "ExportSpecifier" && par.local === n && par.exported.start === n.start) text = `${newName} as ${mangled}`;
    else if (par.type === "ImportSpecifier" && par.local === n && par.imported.start === n.start) text = `${mangled} as ${newName}`;
    edits.push({ start: n.start, end: n.end, text });
  }
  applied.push({ mangled, newName, refs: paths.length });
  taken.add(newName); // a later map entry must not collide onto it
}

// apply edits descending by start (non-overlapping: one edit per identifier node)
edits.sort((a, b) => b.start - a.start);
for (let i = 1; i < edits.length; i++) {
  if (edits[i].end > edits[i - 1].start) { console.error(`overlapping edits at offset ${edits[i].start}`); process.exit(1); }
}
let out = src;
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
fs.writeFileSync(OUT, out);

const report = {
  input: INPUT, out: OUT,
  appliedCount: applied.length, editCount: edits.length,
  skippedMissingCount: skippedMissing.length, skippedCollisionCount: skippedCollision.length,
  directEvalCalls: directEval,
  applied, skippedMissing, skippedCollision,
};
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`applied ${applied.length} renames (${edits.length} identifier occurrences), skipped ${skippedMissing.length} missing, ${skippedCollision.length} collisions`);
if (directEval) console.log(`  note: ${directEval} direct eval() call(s) in the input; code evaluated there sees module scope, so equivalence holds modulo what that code names`);
if (skippedMissing.length) console.log("  missing (not top-level bindings):", skippedMissing.join(", "));
if (skippedCollision.length) console.log("  refused:", skippedCollision.join("; "));
// A skipped entry is never unsafe, but it is never intended either: the map
// promised a name the output does not carry. Fail rather than ship it quietly.
process.exit(skippedMissing.length + skippedCollision.length > 0 ? 1 : 0);
