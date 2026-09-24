// Structural signature of an AST node — the content identity of a declaration,
// stable across esbuild's per-build identifier re-mangling.
//
// What is normalised and what is kept follows one rule: normalise exactly the
// names the minifier re-picks on every build, keep every name it cannot touch.
//
//   normalised to a positional slot (#0, #1, ... by first-seen order):
//     - identifiers BOUND inside the node (params, locals, catch params, inner
//       function/class names)
//     - references to PROGRAM-LEVEL bindings (other top-level symbols, which
//       are mangled like everything else)
//     - private class names (`#e` — esbuild mangles them too) and labels
//   kept verbatim:
//     - literal VALUES (strings and numbers are the semantic anchors)
//     - non-computed property names: `.sessionId`, object keys `{ sessionId: }`,
//       class member keys — the API shape
//     - references to names bound NOWHERE in the program: globals such as
//       `setTimeout`, `process`, `JSON`. esbuild reserves every unbound name
//       before it mangles, so a global's spelling never collides with a
//       mangled binding and never changes between builds.
//   dropped: position, formatting, and `shorthand` (`{e}` vs `{e: t}` is only a
//   coincidence of what the minifier picked for the local).
//
// Two declarations with the same signature are the same code modulo
// minification renaming.
//
// This header used to promise all of the above while the code alpha-renamed
// EVERY identifier, property names and globals included: `e => e.sessionId`
// and `e => e.channelId`, or `setTimeout(e)` and `clearTimeout(e)`, hashed the
// same. That made structurally different functions look identical, so
// fingerprint_match reported spurious ambiguous matches (and could report a
// false UNIQUE one when the true twin had changed), and a changed signature in
// symbols_*.json could not tell a renamed field from no change at all. It also
// erred the other way: one slot table for every role meant a local spelled like
// a property key shifted the numbering, so unchanged code hashed differently
// across releases (zod's locale modules, the JSON-schema meta-schema module).
// Measured on the v0.8.3 daemon: 2228 -> 2254 distinct signatures over 2535
// top-level declarations (388 -> 348 in collision groups; what remains is code
// that really is identical modulo renaming, e.g. zod's 61 locale stubs), and
// v0.8.2 -> v0.8.3 fingerprint matching went from 2126 to 2170 unique pairs,
// none of them contradicting an earlier unique pair.
//
// Telling a global from a reference to another top-level symbol needs the
// program's top-level bindings, which a bare node does not carry. Callers pass
// a context — signatureContext(ast) — or get one implicitly for nodes that came
// from topLevelDecls(). Without either, references outside the node are
// normalised (globals included, the old behaviour for them) and a warning is
// printed once, because two tools hashing with and without a context produce
// signatures that cannot be compared with each other.
//
// This is the load-bearing primitive behind two very different jobs, which is
// why it lives in its own module:
//   - fingerprint_match.mjs — pair declarations ACROSS two bundle versions
//   - symbol_index.mjs      — give each symbol a version-stable content id, so
//                             a doc citation can be re-checked by identity
//                             rather than by line number
//
// Exports:
//   signatureContext(ast)      -> ctx       top-level bindings of a parsed File
//                                           or Program (cached per AST)
//   signatureTokens(node, ctx) -> string    the canonical token stream (debuggable)
//   signature(node, ctx)       -> string    sha256 of the token stream, first 20 hex
//   topLevelDecls(src)         -> { ast, decls, ctx }  Map<name, node> of
//                                           top-level declarations, initializer
//                                           for vars; each node carries ctx
import { parse } from "@babel/parser";
import crypto from "node:crypto";

const SKIP_KEYS = new Set([
  "type", "start", "end", "loc", "range",
  "leadingComments", "trailingComments", "innerComments", "extra",
  "shorthand",
]);

// Every identifier a binding pattern declares: `a`, `{ a, b: [c, ...d] }`,
// `e = 1`. Member expressions are assignment targets, not bindings.
function patternNames(p, out) {
  if (!p) return;
  switch (p.type) {
    case "Identifier": out.add(p.name); return;
    case "ObjectPattern": for (const pr of p.properties) patternNames(pr.type === "RestElement" ? pr.argument : pr.value, out); return;
    case "ArrayPattern": for (const el of p.elements) patternNames(el, out); return;
    case "AssignmentPattern": patternNames(p.left, out); return;
    case "RestElement": patternNames(p.argument, out); return;
  }
}

// Top-level bindings of a program: the names a free identifier in a top-level
// declaration can resolve to. Anything else it can reach is a global.
const contextCache = new WeakMap();
export function signatureContext(ast) {
  const program = ast.type === "File" ? ast.program : ast;
  if (contextCache.has(program)) return contextCache.get(program);
  const topLevel = new Set();
  for (const s of program.body) {
    const d = s.type === "ExportNamedDeclaration" || s.type === "ExportDefaultDeclaration" ? s.declaration : s;
    if (!d) continue;
    if ((d.type === "FunctionDeclaration" || d.type === "ClassDeclaration") && d.id) topLevel.add(d.id.name);
    else if (d.type === "VariableDeclaration") for (const v of d.declarations) patternNames(v.id, topLevel);
    else if (d.type === "ImportDeclaration") for (const sp of d.specifiers) topLevel.add(sp.local.name);
  }
  const ctx = { topLevel };
  contextCache.set(program, ctx);
  return ctx;
}

// Names bound anywhere inside the node. A name bound in one inner scope and
// used as a global in another cannot occur in esbuild output (unbound names are
// reserved file-wide), so one set per node is exact here, not an approximation
// that needs a scope tree.
function boundWithin(node) {
  const out = new Set();
  const seen = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    switch (n.type) {
      case "FunctionDeclaration": case "FunctionExpression": case "ArrowFunctionExpression":
      case "ObjectMethod": case "ClassMethod": case "ClassPrivateMethod":
        if (n.id) out.add(n.id.name);
        for (const p of n.params) patternNames(p, out);
        break;
      case "ClassDeclaration": case "ClassExpression": if (n.id) out.add(n.id.name); break;
      case "VariableDeclarator": patternNames(n.id, out); break;
      case "CatchClause": patternNames(n.param, out); break;
    }
    for (const k of Object.keys(n)) if (!SKIP_KEYS.has(k)) { const v = n[k]; if (v && typeof v === "object") walk(v); }
  })(node);
  return out;
}

// Parent types whose non-computed `key` is a property name, not a binding.
const KEYED = new Set([
  "ObjectProperty", "ObjectMethod", "ClassMethod", "ClassPrivateMethod",
  "ClassProperty", "ClassPrivateProperty", "ClassAccessorProperty",
]);

// The role an Identifier child plays, decided by its parent and the key it
// hangs off. Only "ref" goes through the bound-or-global decision.
function roleOf(parent, key) {
  switch (parent.type) {
    case "MemberExpression": case "OptionalMemberExpression":
      return key === "property" && !parent.computed ? "prop" : "ref";
    case "LabeledStatement": case "BreakStatement": case "ContinueStatement":
      return key === "label" ? "label" : "ref";
    case "MetaProperty": return "meta";                 // import.meta, new.target
    case "PrivateName": return "private";               // #e -- mangled
    case "ImportSpecifier": return key === "imported" ? "external" : "ref";
    case "ExportSpecifier": return key === "exported" ? "external" : "ref";
    case "ExportNamespaceSpecifier": return key === "exported" ? "external" : "ref";
  }
  if (KEYED.has(parent.type) && key === "key" && !parent.computed) return "prop";
  return "ref";
}

// nodes handed out by topLevelDecls(), so signature(node) needs no second
// argument there (fingerprint_match.mjs relies on this)
const nodeContext = new WeakMap();
let warnedNoContext = false;

export function signatureTokens(node, ctx) {
  ctx = ctx ?? nodeContext.get(node);
  if (!ctx && !warnedNoContext) {
    warnedNoContext = true;
    console.error("  warn: structural_signature: no program context -- globals are normalised like bindings; pass signatureContext(ast)");
  }
  const bound = boundWithin(node);
  const isBound = ctx ? (name) => bound.has(name) || ctx.topLevel.has(name) : () => true;
  const slots = new Map();
  let n = 0;
  const out = [];
  function slot(ns, name) {
    const k = ns + ":" + name;
    if (!slots.has(k)) slots.set(k, "#" + n++);
    return slots.get(k);
  }
  function ident(x, role) {
    switch (role) {
      case "prop": return "p:" + x.name;
      case "meta": case "external": return "k:" + x.name;
      case "label": return slot("label", x.name);
      case "private": return slot("private", x.name);
      default: return isBound(x.name) ? slot("id", x.name) : "g:" + x.name;
    }
  }
  function walk(x, role) {
    if (x == null) return;
    if (Array.isArray(x)) { out.push("["); for (const e of x) walk(e, role); out.push("]"); return; }
    if (typeof x !== "object") { out.push(JSON.stringify(x)); return; }
    if (!x.type) return;
    out.push("(" + x.type);
    switch (x.type) {
      case "Identifier": out.push(ident(x, role)); out.push(")"); return;
      case "StringLiteral": out.push("s:" + x.value); out.push(")"); return;
      case "NumericLiteral": out.push("n:" + x.value); out.push(")"); return;
      case "BooleanLiteral": out.push("b:" + x.value); out.push(")"); return;
      case "TemplateElement": out.push("t:" + x.value.raw); out.push(")"); return;
    }
    for (const key of Object.keys(x).sort()) {
      if (SKIP_KEYS.has(key)) continue;
      const v = x[key];
      if (v && typeof v === "object") { out.push(key + ":"); walk(v, roleOf(x, key)); }
      else if (typeof v !== "function" && v !== undefined) { out.push(key + "=" + JSON.stringify(v)); }
    }
    out.push(")");
  }
  walk(node, "ref");
  return out.join("");
}

export function signature(node, ctx) {
  return crypto.createHash("sha256").update(signatureTokens(node, ctx)).digest("hex").slice(0, 20);
}

// Top-level named declarations. For `var x = <init>` the INITIALIZER is the
// node of interest (that is where the code lives); for function/class
// declarations the statement itself is.
export function topLevelDecls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const ctx = signatureContext(ast);
  const decls = new Map();
  const put = (name, node) => { decls.set(name, node); nodeContext.set(node, ctx); };
  for (const stmt of ast.program.body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id) {
      put(stmt.id.name, stmt);
    } else if (stmt.type === "VariableDeclaration") {
      for (const d of stmt.declarations) {
        if (d.id.type === "Identifier" && d.init) put(d.id.name, d.init);
      }
    } else if (stmt.type === "ClassDeclaration" && stmt.id) {
      put(stmt.id.name, stmt);
    }
  }
  return { ast, decls, ctx };
}
