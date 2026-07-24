// Prove two files are semantically identical modulo an intended rename map.
// Parses both, walks the two ASTs in lockstep: every node type + primitive
// field must be equal; Identifier/label names must be equal OR related by the
// rename map (A.name -> B.name). Any structural divergence => NOT equivalent.
// Usage: node ast_equiv.mjs <original.js> <renamed.js> <rename.json>
import { parse } from "@babel/parser";
import fs from "node:fs";

const [, , A, B, MAP] = process.argv;
const renameMap = JSON.parse(fs.readFileSync(MAP, "utf8")); // mangled -> newName
const astA = parse(fs.readFileSync(A, "utf8"), { sourceType: "module" });
const astB = parse(fs.readFileSync(B, "utf8"), { sourceType: "module" });

// fields to ignore (positional/metadata)
const IGNORE = new Set(["start", "end", "loc", "range", "leadingComments", "trailingComments", "innerComments", "extra", "comments", "tokens", "errors"]);

let nodeCount = 0, idChecks = 0, renameHits = 0;
const problems = [];

function nameOK(an, bn) {
  if (an === bn) return true;
  if (renameMap[an] === bn) { renameHits++; return true; }
  return false;
}

function cmp(a, b, path) {
  if (problems.length > 20) return;
  if (a === b) return;
  if (a == null || b == null) { problems.push(`${path}: null mismatch (${a} vs ${b})`); return; }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) { problems.push(`${path}: array shape ${a?.length} vs ${b?.length}`); return; }
    for (let i = 0; i < a.length; i++) cmp(a[i], b[i], `${path}[${i}]`);
    return;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (a.type !== b.type) { problems.push(`${path}: type ${a.type} vs ${b.type}`); return; }
    nodeCount++;
    // identifier / label name comparison via rename map
    if ((a.type === "Identifier" || a.type === "JSXIdentifier") && typeof a.name === "string") {
      idChecks++;
      if (!nameOK(a.name, b.name)) problems.push(`${path}: identifier ${a.name} vs ${b.name}`);
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)].filter(k => !IGNORE.has(k)));
    for (const k of keys) {
      if (k === "name" && (a.type === "Identifier" || a.type === "JSXIdentifier")) continue; // handled
      cmp(a[k], b[k], `${path}.${k}`);
    }
    return;
  }
  // primitives
  if (a !== b) problems.push(`${path}: primitive ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
}

cmp(astA.program, astB.program, "program");

console.log(`nodes compared: ${nodeCount}`);
console.log(`identifier checks: ${idChecks}, rename-map matches: ${renameHits}`);
if (problems.length === 0) {
  console.log("RESULT: SEMANTICALLY EQUIVALENT (identical AST modulo intended renames)");
  process.exit(0);
} else {
  console.log(`RESULT: NOT EQUIVALENT — ${problems.length} divergence(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
