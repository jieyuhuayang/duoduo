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

// map each top-level declaration to its [start,end] and name
const tops = [];
for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) tops.push({ name: stmt.id.name, start: stmt.start, end: stmt.end });
  else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) { if (d.id.type === "Identifier") tops.push({ name: d.id.name, start: stmt.start, end: stmt.end }); }
  else if (stmt.type === "ClassDeclaration" && stmt.id) tops.push({ name: stmt.id.name, start: stmt.start, end: stmt.end });
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
  console.log(`${JSON.stringify(anchor)} -> ${encl ? encl.name : "TOPLEVEL?"} @ line ${decLine} (anchor at ${lineAt(idx)})`);
}
