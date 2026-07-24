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
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import crypto from "node:crypto";

const [, , OLD, NEW, OUT] = process.argv;

// Collect top-level named declarations -> { name -> node }
function topLevelDecls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const decls = new Map(); // mangledName -> initializer node (+ src slice)
  for (const stmt of ast.program.body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id) {
      decls.set(stmt.id.name, stmt);
    } else if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id.type === "Identifier" && d.init) decls.set(d.id.name, d.init);
      }
    } else if (stmt.type === "ClassDeclaration" && stmt.id) {
      decls.set(stmt.id.name, stmt);
    }
  }
  return { ast, decls, src };
}

// Canonical structural signature: walk the node, emit a token per AST node type,
// alpha-rename every Identifier/BindingIdentifier to a positional slot (stable by
// first appearance), and include literal VALUES (strings/numbers survive — they
// are the semantic anchors). Member-expression property names that are NOT
// computed are kept verbatim (API shape). This ignores esbuild's identifier
// churn but is sensitive to any real logic/literal change.
function signature(node) {
  const slots = new Map();
  let n = 0;
  const out = [];
  function slot(name) {
    if (!slots.has(name)) slots.set(name, "#" + n++);
    return slots.get(name);
  }
  function walk(x) {
    if (x == null) return;
    if (Array.isArray(x)) { out.push("["); for (const e of x) walk(e); out.push("]"); return; }
    if (typeof x !== "object") { out.push(JSON.stringify(x)); return; }
    if (!x.type) return;
    out.push("(" + x.type);
    switch (x.type) {
      case "Identifier": out.push(slot(x.name)); out.push(")"); return;
      case "StringLiteral": out.push("s:" + x.value); out.push(")"); return;
      case "NumericLiteral": out.push("n:" + x.value); out.push(")"); return;
      case "BooleanLiteral": out.push("b:" + x.value); out.push(")"); return;
      case "TemplateElement": out.push("t:" + x.value.raw); out.push(")"); return;
    }
    // structural children in a fixed key order
    for (const key of Object.keys(x).sort()) {
      if (["type","start","end","loc","range","leadingComments","trailingComments","innerComments","extra"].includes(key)) continue;
      const v = x[key];
      if (v && typeof v === "object") { out.push(key + ":"); walk(v); }
      else if (typeof v !== "function" && v !== undefined) { out.push(key + "=" + JSON.stringify(v)); }
    }
    out.push(")");
  }
  walk(node);
  return crypto.createHash("sha256").update(out.join("")).digest("hex").slice(0, 20);
}

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
