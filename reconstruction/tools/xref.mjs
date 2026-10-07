// Cross-reference index of the first-party symbols: who refers to whom, and
// which literals each declaration carries.
//
// maps/symbols_<bundle>.json answers "where is symbol X". The questions that a
// reader of the docs actually starts from are the other way round -- "who reads
// ALADUO_PORT", "which function writes run/locks/", "where is session.notify
// dispatched", "what does drainSessionMailbox call" -- and until now each of
// them was a grep over a 90k-line bundle, by every session, every time. This
// index answers them from one JSON file.
//
// Per renamed symbol it records: the program-level bindings its declaration
// refers to (resolved through Babel's scopes, so a local `e` that happens to
// spell a top-level name is not counted), split into first-party symbols
// (`refs`, by real name) and still-unnamed top-level code (`refsUnnamed`, by
// mangled name); the inverse (`refBy`, `refByUnnamed`); the environment
// variables it reads (`process.env.X`, and the keys of a string literal passed
// where the bundle's env readers take one); and its string literals, with four
// derived views: log prefixes (`[session-manager]`), dotted names (`session.notify`,
// `agent.tool_use`: RPC methods and event types share this shape), paths (a
// `/` or a data-file extension) and the rest. Numbers are not indexed: the
// `NAME = <number>` form of a citation already covers them.
//
// The inverse indexes (`byEnv`, `byLogPrefix`, `byDotted`, `byPath`, `byString`)
// map each literal to the symbols that carry it. `byString` is limited to
// strings of 3+ characters carried by at most 25 symbols: a string every
// module uses ("string", "object") is not a locator.
//
// Each symbol also carries `inner`: the functions nested inside its
// declaration that have a name of their own (closure_names.mjs: the property
// key, variable or method they are assigned to, written `outer>name`), with
// their lines -- the outline of a factory such as createDaemon, under the same
// names instrument.mjs traces them. Anonymous closures are counted, not listed.
//
// Unnamed top-level code is listed under `unnamed` only when a first-party
// symbol refers to it, with how many do: that list, ordered by use, is the
// queue for name_symbol.mjs. Vendored code that nothing first-party touches is
// left out.
//
// Usage: node xref.mjs <pretty.js> <rename.json> <out.json> [--version <v>]
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import fs from "node:fs";
import { nestedFunctions } from "./closure_names.mjs";

const traverse = _traverse.default || _traverse;
const argv = process.argv.slice(2);
let VERSION = "unrecorded";
const vi = argv.indexOf("--version");
if (vi !== -1) { VERSION = argv[vi + 1]; argv.splice(vi, 2); }
const [PRETTY, RENAME, OUT] = argv;
if (!PRETTY || !RENAME || !OUT) {
  console.error("usage: node xref.mjs <pretty.js> <rename.json> <out.json> [--version <v>]");
  process.exit(2);
}

const src = fs.readFileSync(PRETTY, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8")); // mangled -> real
const ast = parse(src, { sourceType: "module", ranges: true });

// top-level declarations, in program order: mangled -> { line, kind, stmt index, node }
const decl = new Map();
const order = [];
function put(name, node, kind, stmt, valueNode) {
  if (decl.has(name)) return;
  decl.set(name, { line: node.loc.start.line, kind, stmt, node: valueNode });
  order.push(name);
}
ast.program.body.forEach((stmt, i) => {
  if (stmt.type === "FunctionDeclaration" && stmt.id) put(stmt.id.name, stmt.id, stmt.async ? "async function" : "function", i, stmt);
  else if (stmt.type === "ClassDeclaration" && stmt.id) put(stmt.id.name, stmt.id, "class", i, stmt);
  else if (stmt.type === "VariableDeclaration") {
    for (const d of stmt.declarations) {
      if (d.id.type !== "Identifier") continue;
      const init = d.init;
      let kind = "var";
      if (init) {
        if (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") kind = init.async ? "async function-expr" : "function-expr";
        else if (init.type === "ClassExpression") kind = "class-expr";
        else if (init.type === "CallExpression" && init.callee.type === "Identifier" && init.callee.name === "__esm") kind = "module-init";
        else kind = "var";
      } else kind = "var (uninitialised)";
      put(d.id.name, d.id, kind, i, init ?? d);
    }
  }
});

// which top-level statement index each top-level binding's declaration lives in
// is `stmt`; a reference inside statement i belongs to every binding declared
// by statement i (a `var A = 1, B = () => A` statement declares two). To
// attribute a reference to ONE binding we use the declarator that encloses it,
// falling back to the statement's first binding.
const perStmtBindings = new Map(); // stmt index -> [mangled...]
for (const [name, d] of decl) {
  if (!perStmtBindings.has(d.stmt)) perStmtBindings.set(d.stmt, []);
  perStmtBindings.get(d.stmt).push(name);
}

const ENV_READERS = new Set(); // short names of functions whose first param is an env key: detected below
// A function whose body reads process.env[<first param>] is an env reader; a
// call `reader("ALADUO_X", …)` elsewhere then counts as a read of ALADUO_X.
for (const stmt of ast.program.body) {
  let fn = null, name = null;
  if (stmt.type === "FunctionDeclaration" && stmt.id) { fn = stmt; name = stmt.id.name; }
  else if (stmt.type === "VariableDeclaration" && stmt.declarations.length === 1 && stmt.declarations[0].init &&
           /Function/.test(stmt.declarations[0].init.type)) { fn = stmt.declarations[0].init; name = stmt.declarations[0].id.name; }
  if (!fn || !fn.params.length || fn.params[0].type !== "Identifier") continue;
  const p = fn.params[0].name;
  const text = src.slice(fn.range[0], fn.range[1]);
  if (text.length < 2000 && new RegExp(`process\\.env\\[${p}\\]`).test(text)) ENV_READERS.add(name);
}

const info = new Map(); // mangled -> { refs:Set, env:Set, strings:Set }
const get = n => { if (!info.has(n)) info.set(n, { refs: new Set(), env: new Set(), strings: new Set() }); return info.get(n); };

let programScope = null;
traverse(ast, {
  Program(p) { programScope = p.scope; },
  enter(p) {
    // find the enclosing top-level binding of this node
    const node = p.node;
    if (!node.loc) return;
    const stmtIdx = stmtIndexOf(p);
    if (stmtIdx < 0) return;
    const owners = perStmtBindings.get(stmtIdx);
    if (!owners) return;
    const owner = owners.length === 1 ? owners[0] : ownerByDeclarator(p, owners);
    if (!owner) return;
    const rec = get(owner);
    if (node.type === "Identifier") {
      if (!p.isReferencedIdentifier()) return;
      const b = p.scope.getBinding(node.name);
      if (!b || b.scope !== programScope) return;
      if (node.name === owner) return;
      if (!decl.has(node.name)) return;
      rec.refs.add(node.name);
      // reader("ALADUO_X") -> env read
      if (ENV_READERS.has(node.name) && p.parentPath.isCallExpression() && p.parentPath.node.callee === node) {
        const a0 = p.parentPath.node.arguments[0];
        if (a0 && a0.type === "StringLiteral" && /^[A-Z][A-Z0-9_]+$/.test(a0.value)) rec.env.add(a0.value);
      }
    } else if (node.type === "MemberExpression" && !node.computed && node.property.type === "Identifier" &&
               node.object.type === "MemberExpression" && !node.object.computed &&
               node.object.object.type === "Identifier" && node.object.object.name === "process" &&
               node.object.property.type === "Identifier" && node.object.property.name === "env") {
      const b = p.scope.getBinding("process");
      if (!b) rec.env.add(node.property.name);
    } else if (node.type === "StringLiteral") {
      if (node.value.length >= 2) rec.strings.add(node.value);
    } else if (node.type === "TemplateLiteral") {
      for (const q of node.quasis) {
        const v = q.value.cooked ?? q.value.raw;
        if (v && v.trim().length >= 3) rec.strings.add(v);
      }
    }
  },
});

function stmtIndexOf(p) {
  let q = p;
  while (q && q.parentPath && !q.parentPath.isProgram()) q = q.parentPath;
  if (!q || !q.parentPath) return -1;
  return q.key;
}
function ownerByDeclarator(p, owners) {
  let q = p;
  while (q && !q.isVariableDeclarator()) {
    if (q.parentPath && q.parentPath.isProgram()) break;
    q = q.parentPath;
  }
  if (q && q.isVariableDeclarator() && q.node.id.type === "Identifier" && owners.includes(q.node.id.name)) return q.node.id.name;
  return owners[0];
}

// ---- assemble ----------------------------------------------------------------
const realOf = m => rename[m];
const named = order.filter(m => rename[m]);
const symbols = {};
const refByReal = new Map(), refByUnnamed = new Map();
const unnamedUse = new Map(); // mangled -> Set(real)
// null-prototype objects: a string literal spelled "constructor" or "toString"
// must index like any other, not find Object.prototype's member
const byEnv = Object.create(null), byLogPrefix = Object.create(null), byDotted = Object.create(null), byPath = Object.create(null), byString = Object.create(null);
const add = (idx, k, real) => { (idx[k] ??= []).push(real); };

const isLogPrefix = s => /^\[[a-z][a-z0-9-]*\]/.test(s);
const isDotted = s => /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(s);
// a path is one token: no whitespace, at most 120 characters
const isPath = s => s.length <= 120 && !/\s/.test(s) && (/\//.test(s) || /\.(json|jsonl|md|lock|sock|log|txt|yaml|yml|html|pid|env)$/.test(s) || /^\.[a-z]/.test(s));
// long prompt text is indexed by its first 200 characters: enough to find it, small enough to store
const clip = s => s.length > 200 ? s.slice(0, 200) + "…" : s;

for (const m of named) {
  const real = realOf(m);
  const d = decl.get(m);
  const rec = info.get(m) ?? { refs: new Set(), env: new Set(), strings: new Set() };
  const refs = [], refsUnnamed = [];
  for (const r of rec.refs) {
    if (rename[r]) { refs.push(rename[r]); (refByReal.get(rename[r]) ?? refByReal.set(rename[r], new Set()).get(rename[r])).add(real); }
    else { refsUnnamed.push(r); (unnamedUse.get(r) ?? unnamedUse.set(r, new Set()).get(r)).add(real); }
  }
  const strings = [...rec.strings].sort();
  const logPrefixes = [], dotted = [], paths = [], other = [];
  for (const s of strings) {
    if (isLogPrefix(s)) { const k = s.match(/^\[[a-z][a-z0-9-]*\]/)[0]; if (!logPrefixes.includes(k)) logPrefixes.push(k); }
    else if (isDotted(s)) dotted.push(s);
    else if (isPath(s)) paths.push(s);
    else other.push(clip(s));
  }
  const env = [...rec.env].sort();
  const nested = d.node ? nestedFunctions(d.node, real) : [];
  symbols[real] = {
    mangled: m, line: d.line, kind: d.kind,
    inner: nested.filter(f => f.named).map(f => ({ name: f.name.slice(real.length + 1), line: f.line, endLine: f.endLine })),
    innerAnonymous: nested.filter(f => !f.named).length,
    refs: refs.sort(), refsUnnamed: refsUnnamed.sort(),
    refBy: [], refByUnnamed: [],
    env, logPrefixes, dotted, paths, strings: other,
  };
  for (const e of env) add(byEnv, e, real);
  for (const s of logPrefixes) add(byLogPrefix, s, real);
  for (const s of dotted) add(byDotted, s, real);
  for (const s of paths) add(byPath, s, real);
  for (const s of strings) if (s.length >= 3) add(byString, clip(s), real);
}
// references FROM unnamed top-level code INTO first-party symbols
for (const m of order) {
  if (rename[m]) continue;
  const rec = info.get(m);
  if (!rec) continue;
  for (const r of rec.refs) if (rename[r]) (refByUnnamed.get(rename[r]) ?? refByUnnamed.set(rename[r], new Set()).get(rename[r])).add(m);
}
for (const [real, s] of refByReal) symbols[real].refBy = [...s].sort();
for (const [real, s] of refByUnnamed) symbols[real].refByUnnamed = [...s].sort();
for (const k of Object.keys(byString)) if (byString[k].length > 25) delete byString[k];

const unnamed = Object.create(null);
for (const [m, users] of [...unnamedUse].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))) {
  const d = decl.get(m);
  unnamed[m] = { line: d.line, kind: d.kind, usedBy: [...users].sort() };
}

const sortKeys = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
const out = {
  bundle: /cli\.pretty/.test(PRETTY) ? "cli" : "daemon",
  version: VERSION,
  source: PRETTY,
  symbolCount: named.length,
  counts: {
    env: Object.keys(byEnv).length, logPrefixes: Object.keys(byLogPrefix).length, dotted: Object.keys(byDotted).length,
    paths: Object.keys(byPath).length, strings: Object.keys(byString).length, unnamedUsed: Object.keys(unnamed).length,
  },
  symbols: sortKeys(symbols),
  byEnv: sortKeys(byEnv), byLogPrefix: sortKeys(byLogPrefix), byDotted: sortKeys(byDotted), byPath: sortKeys(byPath), byString: sortKeys(byString),
  unnamed,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`xref: ${named.length} symbols, env=${out.counts.env} logPrefixes=${out.counts.logPrefixes} dotted=${out.counts.dotted} paths=${out.counts.paths} strings=${out.counts.strings} unnamedUsed=${out.counts.unnamedUsed} -> ${OUT}`);
