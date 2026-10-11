// Prove two files are semantically identical modulo an intended rename map.
//
// Parses both and walks the two ASTs in lockstep: every node type and every
// primitive field must be equal. Identifiers are NOT compared by spelling alone
// -- that accepted any pair (X, map[X]) wherever it appeared, so a reference
// left on the old name, a member property renamed like a variable
// (`process.on` -> `process.createSpineEvent`), or a rename captured by an inner
// or global binding all passed. Each identifier is classified by what it
// RESOLVES to, in its own file's scope analysis:
//
//   name     not a variable (property key, member property, label, public
//            import/export name): spelling must be identical
//   global   a variable bound nowhere: must stay a global of the same name
//   binding  a variable resolved to a declaration: the two declarations must
//            correspond ONE-TO-ONE across the whole file (so nothing moved to a
//            different binding and no two bindings were merged), and the
//            spelling must be map[name] for a mapped top-level binding, and
//            unchanged for everything else
//
// The classification deliberately uses Babel's reference/binding predicates,
// not rename.mjs's own rule for "is a variable occurrence", so a mistake in one
// is not silently shared by the other.
//
// One structural difference is legitimate: an object shorthand `{ X }` whose
// value is renamed must become `{ X: newName }`, so `shorthand` may flip from
// true to false exactly when the key and value no longer share a spelling.
//
// Not covered, by construction: behaviour that reads a function's own name
// (Function.prototype.name, class constructor.name, stack traces), and code run
// by a direct eval(), which sees module scope by name. rename.mjs reports the
// latter.
//
// Local names (--locals <applied.json>, written by name_locals.mjs apply): a
// local binding of a renamed top-level declaration may change its spelling to
// exactly the name the list gives it, identified the way name_locals.mjs
// identifies it -- the real name of its declaration and its ordinal among that
// declaration's locals (local_bindings.mjs), computed here on the ORIGINAL file
// through the rename map. Every other local keeps its spelling, and the
// one-to-one correspondence of declarations below covers locals as it covers
// top-level bindings, so a local name that captured or was captured by another
// binding fails exactly as a top-level one does. Renaming a local can also turn
// `{ key: x }` into the shorthand `{ key }`, so `shorthand` may flip from false
// to true exactly when the key and the renamed value share a spelling.
//
// Usage: node ast_equiv.mjs <original.js> <renamed.js> [rename.json] [--locals <applied.json>]
// Without rename.json the two files must be identical up to formatting (used to
// prove the beautifier preserved the shipped minified bundle).
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import { collectLocals } from "./local_bindings.mjs";

const argv = process.argv.slice(2);
const li = argv.indexOf("--locals");
const LOCALS = li >= 0 ? argv.splice(li, 2)[1] : null;
const [A, B, MAP] = argv;
if (!A || !B) { console.error("usage: node ast_equiv.mjs <original.js> <renamed.js> [rename.json] [--locals <applied.json>]"); process.exit(2); }
if (LOCALS && !MAP) { console.error("--locals needs rename.json: locals are identified by their declaration's real name"); process.exit(2); }
const renameMap = MAP ? JSON.parse(fs.readFileSync(MAP, "utf8")) : {}; // mangled -> newName

function analyse(file) {
  const text = fs.readFileSync(file, "utf8");
  const ast = parse(text, { sourceType: "module" });
  const cls = new WeakMap(); // Identifier node -> {kind, binding?, top?}
  let program;
  traverse(ast, {
    Program(p) { program = p.scope; },
    Identifier(p) {
      const n = p.node, par = p.parent;
      const publicName = (par.type === "ExportSpecifier" && par.exported === n && par.local !== n) ||
                         (par.type === "ImportSpecifier" && par.imported === n && par.local !== n);
      const isVar = !publicName && (p.isReferencedIdentifier() || p.isBindingIdentifier());
      if (!isVar) { cls.set(n, { kind: "name" }); return; }
      const b = p.scope.getBinding(n.name);
      if (!b) cls.set(n, { kind: "global" });
      else cls.set(n, { kind: "binding", binding: b, top: b.scope === program });
    },
  });
  return { ast, cls, text };
}

const a = analyse(A), b = analyse(B);

// binding of A -> the spelling its local name list requires
const localWant = new Map();
let localsListed = 0, localHits = 0;
if (LOCALS) {
  const applied = JSON.parse(fs.readFileSync(LOCALS, "utf8")).applied;
  const { decls } = collectLocals(a.ast, a.text, (n) => (Object.prototype.hasOwnProperty.call(renameMap, n) ? renameMap[n] : undefined));
  for (const [real, byOrdinal] of Object.entries(applied)) {
    const d = decls.get(real);
    if (!d) { console.log(`RESULT: NOT EQUIVALENT — local names listed for ${real}, which is not a renamed declaration of ${A}`); process.exit(1); }
    for (const [ord, r] of Object.entries(byOrdinal)) {
      const e = d.bindings[Number(ord)];
      if (!e || e.name !== r.from) { console.log(`RESULT: NOT EQUIVALENT — ${real} local #${ord} is ${e ? e.name : "missing"} in ${A}, the list says ${r.from}`); process.exit(1); }
      localWant.set(e.binding, r.to);
      localsListed++;
    }
  }
}

// fields to ignore (positional/metadata)
const IGNORE = new Set(["start", "end", "loc", "range", "leadingComments", "trailingComments", "innerComments", "extra", "comments", "tokens", "errors"]);

let nodeCount = 0, idChecks = 0, renameHits = 0;
const problems = [];
const aToB = new Map(), bToA = new Map();

function checkIdentifier(x, y, path) {
  idChecks++;
  const cx = a.cls.get(x) || { kind: "name" }, cy = b.cls.get(y) || { kind: "name" };
  if (cx.kind !== cy.kind) { problems.push(`${path}: ${x.name} is a ${cx.kind}, ${y.name} is a ${cy.kind}`); return; }
  if (cx.kind !== "binding") {
    if (x.name !== y.name) problems.push(`${path}: ${cx.kind} ${x.name} vs ${y.name}`);
    return;
  }
  const mapped = cx.top && Object.prototype.hasOwnProperty.call(renameMap, x.name);
  const local = !cx.top && localWant.has(cx.binding);
  const want = mapped ? renameMap[x.name] : local ? localWant.get(cx.binding) : x.name;
  if (y.name !== want) { problems.push(`${path}: identifier ${x.name} vs ${y.name} (expected ${want})`); return; }
  if (cx.top !== cy.top) { problems.push(`${path}: ${x.name} is ${cx.top ? "" : "not "}top-level, ${y.name} is ${cy.top ? "" : "not"}`); return; }
  if (mapped && y.name !== x.name) renameHits++;
  if (local) localHits++;
  // one-to-one correspondence of declarations
  const prevB = aToB.get(cx.binding), prevA = bToA.get(cy.binding);
  if (prevB === undefined && prevA === undefined) { aToB.set(cx.binding, cy.binding); bToA.set(cy.binding, cx.binding); return; }
  if (prevB !== cy.binding || prevA !== cx.binding) problems.push(`${path}: ${x.name} -> ${y.name} resolves to a different declaration than its other occurrences`);
}

const valueName = v => v?.type === "Identifier" ? v.name : v?.type === "AssignmentPattern" && v.left.type === "Identifier" ? v.left.name : null;

function cmp(x, y, path) {
  if (problems.length > 20) return;
  if (x === y) return;
  if (x == null || y == null) { problems.push(`${path}: null mismatch (${x} vs ${y})`); return; }
  if (Array.isArray(x) || Array.isArray(y)) {
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) { problems.push(`${path}: array shape ${x?.length} vs ${y?.length}`); return; }
    for (let i = 0; i < x.length; i++) cmp(x[i], y[i], `${path}[${i}]`);
    return;
  }
  if (typeof x === "object" && typeof y === "object") {
    if (x.type !== y.type) { problems.push(`${path}: type ${x.type} vs ${y.type}`); return; }
    nodeCount++;
    if (x.type === "Identifier") checkIdentifier(x, y, path);
    else if (x.type === "JSXIdentifier" && x.name !== y.name) problems.push(`${path}: JSX name ${x.name} vs ${y.name}`);
    if (x.type === "ObjectProperty" && x.shorthand !== y.shorthand) {
      const legit = !y.computed && y.key.type === "Identifier" &&
        (x.shorthand ? valueName(y.value) !== y.key.name : valueName(y.value) === y.key.name);
      if (!legit) problems.push(`${path}: shorthand ${x.shorthand} vs ${y.shorthand}`);
    }
    const keys = new Set([...Object.keys(x), ...Object.keys(y)].filter(k => !IGNORE.has(k)));
    for (const k of keys) {
      if (k === "name" && (x.type === "Identifier" || x.type === "JSXIdentifier")) continue; // handled
      if (k === "shorthand" && x.type === "ObjectProperty") continue;                        // handled
      cmp(x[k], y[k], `${path}.${k}`);
    }
    return;
  }
  // primitives
  if (x !== y) problems.push(`${path}: primitive ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
}

cmp(a.ast.program, b.ast.program, "program");
if (a.ast.program.interpreter?.value !== b.ast.program.interpreter?.value) problems.push("program.interpreter differs");

console.log(`nodes compared: ${nodeCount}`);
console.log(`identifier checks: ${idChecks}, rename-map matches: ${renameHits}, declarations paired: ${aToB.size}`);
if (LOCALS) console.log(`local names: ${localWant.size} listed (${localsListed} entries), ${localHits} occurrences carry them`);
if (problems.length === 0) {
  console.log("RESULT: SEMANTICALLY EQUIVALENT (identical AST modulo intended renames)");
  process.exit(0);
} else {
  console.log(`RESULT: NOT EQUIVALENT — ${problems.length} divergence(s):`);
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
