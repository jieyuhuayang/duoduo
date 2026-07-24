// Extract esbuild __export(exportsObj, { name: () => localVar }) calls to recover
// original exported symbol names -> local mangled identifiers.
// Also captures `export { X as Y }` at top level.
// Usage: node exports_map.mjs <file.pretty.js> <exportHelper e.g. jn>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";

const [, , FILE, HELPER_ARG] = process.argv;
const src = fs.readFileSync(FILE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });

// Auto-detect the __export helper: the identifier most often called as
// HELPER(obj, { key: () => ident, ... }). Override with HELPER_ARG if given.
function looksLikeExportCall(node) {
  if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return false;
  if (node.arguments.length !== 2) return false;
  const o = node.arguments[1];
  if (o.type !== "ObjectExpression" || o.properties.length === 0) return false;
  let n = 0;
  for (const pr of o.properties) {
    if (pr.type !== "ObjectProperty") return false;
    if (pr.value.type === "ArrowFunctionExpression" && pr.value.body.type === "Identifier") n++;
    else return false;
  }
  return n > 0;
}
let HELPER = HELPER_ARG;
if (!HELPER) {
  const tally = new Map();
  traverse(ast, { CallExpression(p) { if (looksLikeExportCall(p.node)) tally.set(p.node.callee.name, (tally.get(p.node.callee.name) || 0) + 1); } });
  HELPER = [...tally].sort((a, b) => b[1] - a[1])[0]?.[0];
  console.error(`auto-detected export helper: ${HELPER} (candidates: ${[...tally].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([h,n])=>h+"="+n).join(" ")})`);
}

const map = {}; // originalName -> localVar
const exportStmts = [];

traverse(ast, {
  CallExpression(p) {
    const c = p.node.callee;
    if (c.type === "Identifier" && c.name === HELPER && p.node.arguments.length === 2) {
      const objArg = p.node.arguments[1];
      if (objArg.type === "ObjectExpression") {
        for (const prop of objArg.properties) {
          if (prop.type !== "ObjectProperty") continue;
          const key = prop.key.type === "Identifier" ? prop.key.name : (prop.key.type === "StringLiteral" ? prop.key.value : null);
          // value is `() => localVar`
          let local = null;
          if (prop.value.type === "ArrowFunctionExpression" && prop.value.body.type === "Identifier") local = prop.value.body.name;
          if (key && local) map[key] = local;
        }
      }
    }
  },
  ExportNamedDeclaration(p) {
    for (const spec of p.node.specifiers || []) {
      if (spec.type === "ExportSpecifier") {
        const exported = spec.exported.name || spec.exported.value;
        const localn = spec.local.name;
        exportStmts.push(`${localn} as ${exported}`);
        map[exported] = localn;
      }
    }
  },
});

console.log(JSON.stringify(map, null, 2));
console.error(`recovered ${Object.keys(map).length} export-name mappings`);
if (exportStmts.length) console.error("top-level exports: " + exportStmts.join(", "));
