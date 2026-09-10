// Structural signature of an AST node — the content identity of a declaration,
// stable across esbuild's per-build identifier re-mangling.
//
// Alpha-renames every identifier (locals, params, references) to a positional
// placeholder keyed by first-seen order, keeps literal VALUES verbatim (strings
// and numbers are the semantic anchors), keeps non-computed member property
// names (API shape), and drops position/formatting. Two declarations with the
// same signature are the same code modulo minification renaming.
//
// This is the load-bearing primitive behind two very different jobs, which is
// why it lives in its own module:
//   - fingerprint_match.mjs — pair declarations ACROSS two bundle versions
//   - symbol_index.mjs      — give each symbol a version-stable content id, so
//                             a doc citation can be re-checked by identity
//                             rather than by line number
//
// Exports:
//   signatureTokens(node) -> string   the canonical token stream (debuggable)
//   signature(node)       -> string   sha256 of the token stream, first 20 hex
//   topLevelDecls(src)    -> { ast, decls }  Map<name, node> of top-level
//                                            declarations, initializer for vars
import { parse } from "@babel/parser";
import crypto from "node:crypto";

const SKIP_KEYS = [
  "type", "start", "end", "loc", "range",
  "leadingComments", "trailingComments", "innerComments", "extra",
];

export function signatureTokens(node) {
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
    for (const key of Object.keys(x).sort()) {
      if (SKIP_KEYS.includes(key)) continue;
      const v = x[key];
      if (v && typeof v === "object") { out.push(key + ":"); walk(v); }
      else if (typeof v !== "function" && v !== undefined) { out.push(key + "=" + JSON.stringify(v)); }
    }
    out.push(")");
  }
  walk(node);
  return out.join("");
}

export function signature(node) {
  return crypto.createHash("sha256").update(signatureTokens(node)).digest("hex").slice(0, 20);
}

// Top-level named declarations. For `var x = <init>` the INITIALIZER is the
// node of interest (that is where the code lives); for function/class
// declarations the statement itself is.
export function topLevelDecls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const decls = new Map();
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
  return { ast, decls };
}
