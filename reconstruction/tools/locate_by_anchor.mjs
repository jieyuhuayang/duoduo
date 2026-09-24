// Locate the top-level declaration that CONTAINS a given string-literal anchor.
// Usage: node locate_by_anchor.mjs <pretty.js> <anchor1> [anchor2 ...]
// For each anchor, prints: <anchor> -> <topLevelMangledName> @ line <n>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import { topLevelDeclarations, isFunctionLike } from "./verify_inferred.mjs";

const [, , FILE, ...anchors] = process.argv;
const src = fs.readFileSync(FILE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });

// map each top-level declaration to its [start,end], name and KIND. The kind
// matters: a literal that was unique to a function body in the old release can
// be hoisted into a module-level constant in the new one, and then the hit is
// an esbuild module initialiser (`var X = __esm(() => { ... })`), not the
// function. That is how runGapLint was mislabelled at v0.7.1 -> v0.8.0. Kinds
// are verify_inferred.mjs's (topLevelDeclarations), so this tool and the gate
// that checks the result cannot disagree: a hit may be recorded only for a
// name of the same kind -- a function's name on a function, a module
// initialiser's (init...Module) on a module initialiser, a constant's on a
// constant. A mismatch is printed with a loud marker.
// Ranges are per DECLARATOR: in `var a, b, X = __esm(() => {...})` the body is
// X's, and the whole-statement range used to hand every literal in it to
// whichever declarator sorted last.
const kinds = topLevelDeclarations(ast);
const tops = [];
for (const stmt of ast.program.body) {
  if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id) tops.push({ name: stmt.id.name, start: stmt.start, end: stmt.end, kind: kinds.get(stmt.id.name).kind });
  else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) { if (d.id.type === "Identifier") tops.push({ name: d.id.name, start: d.start, end: d.end, kind: kinds.get(d.id.name).kind }); }
}
tops.sort((a, b) => a.start - b.start);
const nameableAs = (kind) => isFunctionLike({ kind }) ? "function" : kind === "moduleInit" ? "module initialiser" : kind === "value" ? "literal constant" : null;
function lineAt(off) { let l = 1; for (let i = 0; i < off && i < src.length; i++) if (src[i] === "\n") l++; return l; }
function enclosing(off) {
  // binary search the top-level decl whose range covers off
  let lo = 0, hi = tops.length - 1, ans = null;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (tops[m].start <= off) { if (off <= tops[m].end) ans = tops[m]; lo = m + 1; } else hi = m - 1; }
  return ans;
}

for (const anchor of anchors) {
  // find offset of first occurrence of the literal string content
  const idx = src.indexOf(anchor);
  if (idx < 0) { console.log(`${anchor} -> NOT FOUND`); continue; }
  const encl = enclosing(idx);
  const decLine = encl ? lineAt(encl.start) : "?";
  const kind = encl ? encl.kind : "?";
  const as = encl ? nameableAs(kind) : null;
  const n = (() => { let c = 0, i = 0; while ((i = src.indexOf(anchor, i)) !== -1) { c++; i += anchor.length; } return c; })();
  const note = !encl ? "" : as === "function" ? ""
    : as ? `\n    !! a ${as.toUpperCase()}, not a function: record it only for a ${as}'s name (verify_inferred.mjs refuses any other). A FUNCTION's literal found here was hoisted into a shared constant this release: anchor on a literal that is still inside the body, or use pair_changes.mjs / the bump.sh block hint.`
    : `\n    !! "${kind}": nothing name_symbol.mjs or verify_inferred.mjs accepts. Do not record this name; anchor on a literal that is still inside the body, or use pair_changes.mjs / the bump.sh block hint.`;
  console.log(`${JSON.stringify(anchor)} -> ${encl ? encl.name : "TOPLEVEL?"} @ line ${decLine} (anchor at ${lineAt(idx)}) [${kind}]${n > 1 ? ` (${n} occurrences in file; only the first is shown)` : ""}${note}`);
}
