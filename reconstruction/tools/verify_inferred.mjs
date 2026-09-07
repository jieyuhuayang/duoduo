// Assert that every RE-inferred name in maps/inferred_<bundle>.json still points
// at a declaration of the right SHAPE -- not merely at a declaration.
//
// Why this exists (v0.7.1 -> v0.8.0, `runGapLint`): the bump left that name
// RE-ANCHOR, so it was relocated with locate_by_anchor.mjs on the string
// literal "scan-gap.md.pending", which was unique to the old function body.
// In v0.8.0 upstream hoisted that literal into a module-level constant, so the
// anchor landed inside an esbuild lazy-init wrapper (`var b4 = N(() => { ...
// Att = "scan-gap.md.pending" })`) -- a declaration, but not a function, and
// not runGapLint. Every downstream check still passed: renaming is scope-safe
// (AST equivalence held), and verify_first_party.mjs only proves that
// first-party/, the rename map and recon/ agree with EACH OTHER, not that the
// name is on the right code. The mislabel would have shipped silently.
//
// Two checks, run at every rebuild (no old bundle needed):
//   1. KIND   the mangled name must resolve to function-like code: a function/
//             class declaration, or a variable whose initializer is a function,
//             arrow or class. A variable initialised by a CALL (`N(() => ...)`,
//             the esbuild `__esm` lazy-init wrapper) or by a constant is refused
//             outright -- that is exactly the runGapLint failure mode.
//   2. SHAPE  compared against maps/inferred_<bundle>.shape.json, a sidecar
//             recorded from the last release where the mapping was trusted:
//             declaration kind must match; a parameter-count change, or a body
//             that shares NO string literal with the recorded one, is reported
//             as a warning to re-read by hand (a genuine rewrite looks like this
//             too, so it does not fail the build on its own).
//
// Usage:
//   node verify_inferred.mjs check  <pretty.js> <inferred.json> [shape.json]
//   node verify_inferred.mjs record <pretty.js> <inferred.json> <shape.json>
// `record` is run once per release, AFTER the inferred map has been reviewed,
// so the next bump is checked against a trusted baseline.
import fs from "node:fs";
import { parse } from "@babel/parser";

const [, , MODE, PRETTY, INFERRED, SHAPE] = process.argv;
if (!["check", "record"].includes(MODE) || !PRETTY || !INFERRED || (MODE === "record" && !SHAPE)) {
  console.error("usage: node verify_inferred.mjs check|record <pretty.js> <inferred.json> [shape.json]");
  process.exit(2);
}

const src = fs.readFileSync(PRETTY, "utf8");
const inferred = JSON.parse(fs.readFileSync(INFERRED, "utf8")); // mangled -> real
const ast = parse(src, { sourceType: "module", ranges: true });

// top-level declarations: name -> { node (the whole statement or declarator), kind, params, line }
const decls = new Map();
function fnParams(n) { return n && Array.isArray(n.params) ? n.params.length : null; }
for (const s of ast.program.body) {
  if (s.type === "FunctionDeclaration" && s.id) {
    decls.set(s.id.name, { node: s, kind: s.async ? "async function" : "function", params: fnParams(s), line: s.loc.start.line });
  } else if (s.type === "ClassDeclaration" && s.id) {
    decls.set(s.id.name, { node: s, kind: "class", params: null, line: s.loc.start.line });
  } else if (s.type === "VariableDeclaration") {
    for (const d of s.declarations) {
      if (d.id.type !== "Identifier") continue;
      const init = d.init;
      let kind;
      if (!init) kind = "var (uninitialised)";
      else if (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") kind = (init.async ? "async " : "") + "function-expr";
      else if (init.type === "ClassExpression") kind = "class-expr";
      else if (init.type === "CallExpression") kind = "var = call (lazy-init wrapper)";
      else kind = `var = ${init.type}`;
      decls.set(d.id.name, { node: init ?? d, kind, params: fnParams(init), line: s.loc.start.line });
    }
  }
}
const FUNCTION_LIKE = /^(async )?(function|function-expr|class|class-expr)$/;

// string literals + template chunks inside a node (manual walk; no scope needed)
function literalsOf(node) {
  const out = new Set();
  const seen = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if (n.type === "StringLiteral" && n.value.length >= 4) out.add(n.value);
    else if (n.type === "TemplateElement") { const v = n.value.cooked ?? n.value.raw; if (v && v.trim().length >= 4) out.add(v); }
    for (const k of Object.keys(n)) if (k !== "loc" && k !== "range" && k !== "leadingComments" && k !== "trailingComments") walk(n[k]);
  })(node);
  return [...out].sort();
}

const shape = {};
const fail = [], warn = [];
let ok = 0;
for (const [mangled, real] of Object.entries(inferred)) {
  const d = decls.get(mangled);
  if (!d) { fail.push(`${real}: ${mangled} is not a top-level declaration in ${PRETTY}`); continue; }
  if (!FUNCTION_LIKE.test(d.kind)) {
    fail.push(`${real}: ${mangled} @${d.line} is "${d.kind}", not a function -- the anchor literal was probably hoisted into a shared constant; relocate on a literal that is still inside the function body, or via pair_changes.mjs / the block hint in bump.sh`);
    continue;
  }
  const lits = literalsOf(d.node);
  shape[real] = { kind: d.kind, params: d.params, literals: lits.slice(0, 24) };
  ok++;
}

if (MODE === "record") {
  if (fail.length) { for (const f of fail) console.error(`  ${f}`); console.error("refusing to record a baseline from a map with failures"); process.exit(1); }
  fs.writeFileSync(SHAPE, JSON.stringify({ source: PRETTY.split("/").pop(), recorded: new Date().toISOString().slice(0, 10), shapes: shape }, null, 2) + "\n");
  console.error(`recorded ${ok} inferred-name shape(s) -> ${SHAPE}`);
  process.exit(0);
}

// check mode: compare against the recorded baseline when one exists
if (SHAPE && fs.existsSync(SHAPE)) {
  const base = JSON.parse(fs.readFileSync(SHAPE, "utf8")).shapes ?? {};
  for (const [real, cur] of Object.entries(shape)) {
    const old = base[real];
    if (!old) { warn.push(`${real}: no recorded shape (new inferred name?) -- run \`record\` after review`); continue; }
    const norm = (k) => k.replace(/^async /, "").replace(/-expr$/, "");
    if (norm(old.kind) !== norm(cur.kind)) fail.push(`${real}: kind changed ${old.kind} -> ${cur.kind}; a function does not become a ${cur.kind} across a release -- wrong declaration`);
    if (old.params != null && cur.params != null && old.params !== cur.params) warn.push(`${real}: parameter count ${old.params} -> ${cur.params} (re-read: rewrite, or wrong function?)`);
    const shared = cur.literals.filter(l => old.literals.includes(l));
    if (old.literals.length >= 3 && cur.literals.length >= 3 && shared.length === 0) warn.push(`${real}: shares no string literal with the recorded body (${old.literals.length} vs ${cur.literals.length}) -- re-read by hand`);
  }
  for (const real of Object.keys(base)) if (!(real in shape) && Object.values(inferred).includes(real) === false) warn.push(`${real}: in shape baseline but no longer in the inferred map (dropped upstream? then re-record)`);
} else if (MODE === "check") {
  warn.push(`no shape baseline${SHAPE ? ` at ${SHAPE}` : ""}; only the KIND check ran -- record one after this map is reviewed`);
}

console.error(`inferred names: ${Object.keys(inferred).length}  function-like: ${ok}`);
for (const w of warn) console.error(`  warn: ${w}`);
if (!fail.length) { console.error("RESULT: every inferred name resolves to function-like code" + (SHAPE && fs.existsSync(SHAPE) ? " and matches the recorded shape baseline" : "")); process.exit(0); }
console.error(`\n${fail.length} inferred name(s) point at the WRONG declaration:`);
for (const f of fail) console.error(`  ${f}`);
process.exit(1);
