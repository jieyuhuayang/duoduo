// Pair a version bump's changed/added top-level declarations across bundles.
//
// fingerprint_match.mjs answers "which declarations are structurally identical".
// What it cannot answer is which NEW declaration corresponds to which CHANGED
// old one — the mangled names are unrelated, so there is nothing to join on.
//
// This tool joins them by ORDER. esbuild emits modules and their statements in a
// stable order, so a changed declaration sits between the same two structurally
// matched neighbours in both versions. For each changed old declaration we take
// the window bounded by its nearest matched neighbours, map that window into the
// new bundle, and collect the unmatched new declarations inside it:
//   - equal counts  -> pair them positionally (confident)
//   - unequal counts -> emit the whole window as a BLOCK (the module gained or
//     lost functions; a human/agent reads the block as a unit)
// New declarations in no changed-window at all are pure additions.
//
// Usage: node pair_changes.mjs <old.pretty.js> <new.pretty.js> <fpmatch.json> <out.json>
// Output: { pairs: {oldMangled: newMangled}, blocks: [{oldNames,newNames}], pureNew: [...] }
import fs from "node:fs";
import { parse } from "@babel/parser";

const [, , OLD, NEW, FPJ, OUT] = process.argv;
if (!OLD || !NEW || !FPJ || !OUT) {
  console.error("usage: node pair_changes.mjs <old.pretty.js> <new.pretty.js> <fpmatch.json> <out.json>");
  process.exit(2);
}
const fp = JSON.parse(fs.readFileSync(FPJ, "utf8"));

function topLevelOrder(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const list = [];
  for (const stmt of ast.program.body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id) list.push(stmt.id.name);
    else if (stmt.type === "ClassDeclaration" && stmt.id) list.push(stmt.id.name);
    else if (stmt.type === "VariableDeclaration")
      for (const d of stmt.declarations) if (d.id.type === "Identifier") list.push(d.id.name);
  }
  return list;
}
const O = topLevelOrder(fs.readFileSync(OLD, "utf8"));
const N = topLevelOrder(fs.readFileSync(NEW, "utf8"));
const oIdx = new Map(O.map((n, i) => [n, i]));
const nIdx = new Map(N.map((n, i) => [n, i]));
const newOnly = new Set(fp.unmatchedNew);
const matched = {};
for (const [o, v] of Object.entries(fp.matched)) if (v.unique) matched[o] = v.new;

// group the changed declarations into windows delimited by matched neighbours
const windows = new Map();
for (const changed of fp.changedOld) {
  const i = oIdx.get(changed);
  if (i == null) continue;
  let prev = null;
  for (let k = i - 1; k >= 0; k--) { const c = matched[O[k]]; if (c && nIdx.has(c)) { prev = nIdx.get(c); break; } }
  let next = null;
  for (let k = i + 1; k < O.length; k++) { const c = matched[O[k]]; if (c && nIdx.has(c)) { next = nIdx.get(c); break; } }
  const lo = prev == null ? 0 : prev + 1;
  const hi = next == null ? N.length : next;
  const key = `${lo}-${hi}`;
  if (!windows.has(key)) windows.set(key, { lo, hi, oldNames: [], newNames: [] });
  windows.get(key).oldNames.push(changed);
}
for (const w of windows.values()) {
  for (let k = w.lo; k < w.hi; k++) if (newOnly.has(N[k])) w.newNames.push(N[k]);
  w.oldNames.sort((a, b) => oIdx.get(a) - oIdx.get(b));
}

const pairs = {}, blocks = [];
for (const w of windows.values()) {
  if (w.oldNames.length === w.newNames.length) w.oldNames.forEach((o, i) => { pairs[o] = w.newNames[i]; });
  else blocks.push({ oldNames: w.oldNames, newNames: w.newNames });
}
const claimed = new Set([...Object.values(pairs), ...blocks.flatMap(b => b.newNames)]);
const pureNew = fp.unmatchedNew.filter(n => !claimed.has(n));

fs.writeFileSync(OUT, JSON.stringify({ pairs, blocks, pureNew }, null, 1) + "\n");
console.error(`pairs: ${Object.keys(pairs).length}  blocks: ${blocks.length}  pureNew: ${pureNew.length}`);
for (const b of blocks) console.error(`  block  [${b.oldNames.join(",")}] -> [${b.newNames.join(",")}]`);
if (pureNew.length) console.error(`  added  ${pureNew.join(", ")}`);
