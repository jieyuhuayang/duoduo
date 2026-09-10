// Structural-fingerprint matcher across two bundle versions.
// For every top-level declaration (function/var/const/let/class) in each pretty
// bundle, compute a canonical structural hash: parse the initializer, alpha-
// rename ALL identifiers (locals, params, and references) to positional
// placeholders keyed by first-seen order, drop literal-irrelevant formatting,
// and hash the resulting token stream. Two declarations with identical hashes
// are the same function modulo minification renaming.
//
// Output: JSON { matched: {oldMangled:{new,hash}}, changedOld:[...], unmatchedNew:[...] }
// Usage: node fingerprint_match.mjs <old.pretty.js> <new.pretty.js> <out.json>
import { signature, topLevelDecls } from "./structural_signature.mjs";
import fs from "node:fs";

const [, , OLD, NEW, OUT] = process.argv;

// topLevelDecls() and signature() now live in structural_signature.mjs —
// symbol_index.mjs needs the identical notion of "same code modulo renaming",
// and two copies of a hash function silently diverge.


const A = topLevelDecls(fs.readFileSync(OLD, "utf8"));
const B = topLevelDecls(fs.readFileSync(NEW, "utf8"));

// hash -> list of names, for each side
function hashIndex(decls) {
  const byHash = new Map();
  const byName = new Map();
  for (const [name, node] of decls) {
    let h;
    try { h = signature(node); } catch { h = "ERR:" + name; }
    byName.set(name, h);
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(name);
  }
  return { byHash, byName };
}
const AI = hashIndex(A.decls);
const BI = hashIndex(B.decls);

// Match: for each old name, find new name(s) with same hash. Prefer unique matches.
const matched = {};   // oldMangled -> { new, hash, unique }
const changedOld = []; // old names with no structural twin in new
for (const [oldName, h] of AI.byName) {
  const cands = (BI.byHash.get(h) || []);
  if (cands.length === 0) { changedOld.push(oldName); continue; }
  matched[oldName] = { new: cands.length === 1 ? cands[0] : cands, hash: h, unique: cands.length === 1 };
}
const matchedNewSet = new Set(Object.values(matched).flatMap(m => Array.isArray(m.new) ? m.new : [m.new]));
const unmatchedNew = [...B.decls.keys()].filter(n => !matchedNewSet.has(n));

fs.writeFileSync(OUT, JSON.stringify({
  stats: { old: A.decls.size, new: B.decls.size, matched: Object.keys(matched).length, changedOld: changedOld.length, unmatchedNew: unmatchedNew.length },
  matched, changedOld, unmatchedNew,
}, null, 1));
console.log(`old=${A.decls.size} new=${B.decls.size} matched=${Object.keys(matched).length} changedOld=${changedOld.length} unmatchedNew=${unmatchedNew.length}`);
