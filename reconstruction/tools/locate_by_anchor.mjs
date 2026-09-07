// Locate the top-level declaration that CONTAINS a given string-literal anchor.
// Usage: node locate_by_anchor.mjs <pretty.js> <anchor1> [anchor2 ...]
// For each anchor, prints: <anchor> -> <topLevelMangledName> @ line <n>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";

const [, , FILE, ...anchors] = process.argv;
const src = fs.readFileSync(FILE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });

// map each top-level declaration to its [start,end], name and KIND. The kind
// matters: a literal that was unique to a function body in the old release can
// be hoisted into a module-level constant in the new one, and then the hit is
// an esbuild lazy-init wrapper (`var X = N(() => { ... })`), not the function.
// That is how runGapLint was mislabelled at v0.7.1 -> v0.8.0. A hit that is not
// function-like is printed with a loud marker; do not copy it into inferred_*.json.
const tops = [];
const kindOf = (init) => {
  if (!init) return "var (uninitialised)";
  if (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") return "function-expr";
  if (init.type === "ClassExpression") return "class-expr";
  if (init.type === "CallExpression") return "var = call (LAZY-INIT WRAPPER, not a function)";
  return `var = ${init.type} (NOT a function)`;
};
for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) tops.push({ name: stmt.id.name, start: stmt.start, end: stmt.end, kind: "function" });
  else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) { if (d.id.type === "Identifier") tops.push({ name: d.id.name, start: stmt.start, end: stmt.end, kind: kindOf(d.init) }); }
  else if (stmt.type === "ClassDeclaration" && stmt.id) tops.push({ name: stmt.id.name, start: stmt.start, end: stmt.end, kind: "class" });
}
tops.sort((a, b) => a.start - b.start);
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
  const bad = encl && !/^(function|function-expr|class|class-expr)$/.test(kind);
  const n = (() => { let c = 0, i = 0; while ((i = src.indexOf(anchor, i)) !== -1) { c++; i += anchor.length; } return c; })();
  console.log(`${JSON.stringify(anchor)} -> ${encl ? encl.name : "TOPLEVEL?"} @ line ${decLine} (anchor at ${lineAt(idx)}) [${kind}]${n > 1 ? ` (${n} occurrences in file; only the first is shown)` : ""}${bad ? "\n    !! NOT a function: the literal was probably hoisted into a shared constant in this release. Do not record this name; anchor on a literal that is still inside the body, or use pair_changes.mjs / the bump.sh block hint." : ""}`);
}
