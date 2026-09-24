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
//   1. KIND   the mangled name must resolve to one of three kinds of code, and a
//             kind never changes across a release:
//               function    a function/class declaration, or a variable whose
//                           initializer is a function, arrow or class
//               moduleInit  an esbuild lazy module initialiser, `var a, b,
//                           X = __esm(() => { a = 5; ... })`: the only place a
//                           module's constants are written, so the only thing
//                           a citation of `a = 5` can be bound to. `__esm` is
//                           recognised by what it does (esmHelpers), never by
//                           its short name: `O` is __esm in daemon.pretty.js
//                           and __commonJS in cli.pretty.js.
//               value       a top-level declarator whose initializer is a
//                           literal, or an array/object/unary/binary/template
//                           expression made of literals only (canonicalLiteral)
//             Everything else is refused -- any other call (a CommonJS wrapper,
//             a factory result), a non-literal expression, an uninitialised var
//             (its value is assigned inside its module's initialiser, and is
//             cited through that), and a module initialiser with no string
//             literal and no literal constant (nothing could ever refute a name
//             on the wrong one).
//             The name must also be SPELLED for its kind (NAME_SPELLING): a
//             function camelCase and not init…Module, a module initialiser
//             init<Name>Module, a value UPPER_SNAKE. This is what refuses a
//             function's name on a module initialiser -- exactly the runGapLint
//             failure mode -- and it needs no baseline. Before module
//             initialisers were nameable, "not function-like" refused that on
//             its own; once they were, the only thing left was the kind-change
//             rule of check 2, which needs a recorded shape under that name.
//             A hand-added name (CLAUDE.md: edit maps/inferred_daemon.json,
//             then `record`) has none, so `"Gve": "runScanGapLint"` -- the very
//             initialiser runGapLint was mis-anchored on at v0.8.0 -- was
//             recorded as a moduleInit without complaint and passed every
//             check after. name_symbol.mjs imports the same table.
//   2. SHAPE  compared against maps/inferred_<bundle>.shape.json, a sidecar
//             recorded from the last release where the mapping was trusted:
//             declaration kind must match. Then, per kind:
//               function    a parameter-count change, or a body that shares NO
//                           string literal with the recorded one, is reported
//                           as a warning to re-read by hand (a genuine rewrite
//                           looks like this too, so it does not fail the build
//                           on its own)
//               moduleInit  recorded like a function (the wrapped function's
//                           literals and member names), plus `values`: a hash
//                           of every literal constant it assigns. Its constants
//                           ARE its identity -- the rest of its body is calls to
//                           other initialisers, re-mangled every release. Three
//                           rules, in order:
//                           - one that shares no string literal and no constant
//                             with its record is FATAL. A default (TRIVIAL:
//                             null, 0, !0, "", [], {} ...) does not count as
//                             shared: many modules assign one.
//                           - RIVAL: the record is scored against EVERY module
//                             initialiser in the bundle (initialiserRivals). If
//                             another one fits it better than the one the name
//                             is on, the name is on the wrong one: FATAL. If
//                             another fits exactly as well (identical shapes:
//                             Wr and Dr at v0.8.3, both `x = null` and nothing
//                             else), nothing can tell which one the name is on:
//                             a warning, as for two constants with one literal.
//                             "Shares something" alone was the rule before, and
//                             moving initSessionDrainModule onto the Notify
//                             tool's initialiser, which shares one constant (5)
//                             and none of its 4 literals, only warned. Measured
//                             on v0.8.3, every move of a name between two of
//                             the 174 initialisers with a literal or constant
//                             is FATAL under these rules except the Wr/Dr twin;
//                             every one of the 23 initialisers whose v0.8.2
//                             record could be paired with its v0.8.3 module
//                             (through the real names declared in it) passes,
//                             except that twin. A module whose constants are a
//                             subset of another's needs no rule of its own:
//                             the one holding exactly the recorded constants
//                             outranks the superset, in either direction.
//                           - a changed constant is a warning (the citations
//                             bound to it need a re-read)
//               value       a hash of the canonical literal (canonicalLiteral:
//                           formatting and numeric spelling normalised, `1e3`
//                           is `1000`), which must match EXACTLY -- a constant
//                           whose literal changed is a different constant.
//                           Another top-level constant with the same literal is
//                           a warning: nothing could tell which one the name is
//                           on (name_symbol.mjs refuses to register such a one)
//   3. SWAP   each body is scored against EVERY recorded shape (Jaccard over
//             literals, member-property names, arity and kind, and a module
//             initialiser's constants). If some other inferred name's baseline
//             fits it clearly better than its own, the two names were exchanged
//             or re-anchored onto a sibling -- FATAL. Checks 1-2 cannot see
//             this: two same-kind, same-arity functions with few literals (most
//             of this map) look identical to them. Member-property names
//             survive re-mangling, so they carry the identity that short names
//             and arity do not. A value is left out: its exact hash already
//             refutes an exchange, and it has no body to score.
//
// Outcome, machine-readable (the last line is the summary):
//   exit 0  RESULT: pass   nothing refuted, nothing to re-read
//   exit 3  RESULT: WARN   nothing refuted, but a shape warning needs a human
//   exit 1  RESULT: FAIL   an inferred name is on the wrong declaration
//   exit 2  usage error
// Warnings used to exit 0 like a clean pass, and rebuild.sh recorded `pass`
// either way, so a parameter-count change on an inferred name reached
// pipeline_report.json looking exactly like a verified one. rebuild.sh maps
// exit 3 to the verdict `inferredNames=warn`.
//
// Usage:
//   node verify_inferred.mjs check  <pretty.js> <inferred.json> [shape.json]
//   node verify_inferred.mjs record <pretty.js> <inferred.json> <shape.json>
// `record` is run once per release, AFTER the inferred map has been reviewed,
// so the next bump is checked against a trusted baseline. It stamps
// $PKG_VERSION into the baseline when that is set.
//
// Also a library: name_symbol.mjs registers new inferred names and must apply
// the same KIND gate, the same spelling table and the same RIVAL scoring (it
// refuses an initialiser some other one ties), and record the same shape, so
// the helpers are exported and the CLI only runs when this file is executed
// directly. judgeInitialiser is the whole per-initialiser verdict of check 2,
// exported so that a measurement runs the rule itself, not a copy of it.
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const isFnExpr = (n) => !!n && (n.type === "ArrowFunctionExpression" || n.type === "FunctionExpression");

// esbuild's __esm helper(s), recognised by what the helper does, not by its
// short name. esbuild emits
//   var __esm = (fn, res) => function __init() { return fn && (res = (0, fn[...])(fn = 0)), res; };
// and minified: `var O = (e, t, n) => () => { ... return e && (t = e(e = 0)), t ... }`.
// The one act no other helper performs: call the first parameter with the
// argument `first = 0` (run the module body once, then drop it) and store the
// result in the second. __commonJS calls its first parameter too, but as
// `e((t = {exports: {}}).exports, t)`. The name cannot be used: `O` is __esm
// in daemon.pretty.js and __commonJS in cli.pretty.js (whose __esm is `Gt`),
// and every release re-picks both.
export function esmHelpers(ast) {
  const out = new Set();
  for (const s of ast.program.body) {
    if (s.type !== "VariableDeclaration") continue;
    for (const d of s.declarations) {
      const f = d.init;
      if (d.id.type !== "Identifier" || !isFnExpr(f) || f.params.length < 2 || f.params.slice(0, 2).some(p => p.type !== "Identifier")) continue;
      const [fn, res] = f.params.map(p => p.name);
      let hit = false;
      (function walk(n) {
        if (hit || !n || typeof n !== "object") return;
        if (Array.isArray(n)) { for (const x of n) walk(x); return; }
        if (n.type === "AssignmentExpression" && n.operator === "=" && n.left.type === "Identifier" && n.left.name === res &&
            n.right.type === "CallExpression" && n.right.arguments.length === 1) {
          const a = n.right.arguments[0];
          if (a.type === "AssignmentExpression" && a.operator === "=" && a.left.type === "Identifier" && a.left.name === fn &&
              a.right.type === "NumericLiteral" && a.right.value === 0) { hit = true; return; }
        }
        for (const k of Object.keys(n)) if (k !== "loc" && k !== "start" && k !== "end" && k !== "extra") walk(n[k]);
      })(f.body);
      if (hit) out.add(d.id.name);
    }
  }
  return out;
}

// `X = __esm(() => {...})`: the call's callee is an __esm helper and its one
// argument is the module body, a function of no parameters
export const isModuleInitCall = (init, helpers) => !!init && init.type === "CallExpression" &&
  init.callee.type === "Identifier" && helpers.has(init.callee.name) &&
  init.arguments.length === 1 && isFnExpr(init.arguments[0]) && init.arguments[0].params.length === 0;

// The canonical source of an initializer made of literals only, or null.
// Formatting is normalised and so is numeric spelling (`1e3` and `1000` are one
// value, `180 * 1e3` is `(180*1000)`); anything that is not a literal -- an
// identifier, a call, a member, a spread, a computed key, a method -- makes the
// whole expression not a value. `!0` / `void 0` are esbuild's true / undefined.
export function canonicalLiteral(n) {
  if (!n) return null;
  switch (n.type) {
    case "StringLiteral": return JSON.stringify(n.value);
    case "NumericLiteral": return String(n.value);
    case "BigIntLiteral": return `${n.value}n`;
    case "BooleanLiteral": return String(n.value);
    case "NullLiteral": return "null";
    case "RegExpLiteral": return `/${n.pattern}/${n.flags}`;
    case "TemplateLiteral": {
      const parts = [];
      for (let i = 0; i < n.quasis.length; i++) {
        parts.push(JSON.stringify(n.quasis[i].value.cooked ?? n.quasis[i].value.raw));
        if (i < n.expressions.length) { const e = canonicalLiteral(n.expressions[i]); if (e === null) return null; parts.push("${" + e + "}"); }
      }
      return "`" + parts.join("") + "`";
    }
    case "UnaryExpression": {
      const a = canonicalLiteral(n.argument);
      return a === null ? null : `(${n.operator}${/^[a-z]/.test(n.operator) ? " " : ""}${a})`;
    }
    case "BinaryExpression": {
      const a = canonicalLiteral(n.left), b = canonicalLiteral(n.right);
      return a === null || b === null ? null : `(${a}${n.operator}${b})`;
    }
    case "ArrayExpression": {
      const els = [];
      for (const e of n.elements) { if (e === null) { els.push(""); continue; } const c = canonicalLiteral(e); if (c === null) return null; els.push(c); }
      return `[${els.join(",")}]`;
    }
    case "ObjectExpression": {
      const props = [];
      for (const p of n.properties) {
        if (p.type !== "ObjectProperty" || p.computed) return null;
        const key = p.key.type === "Identifier" ? p.key.name : p.key.type === "StringLiteral" ? p.key.value
          : p.key.type === "NumericLiteral" ? String(p.key.value) : null;
        const v = canonicalLiteral(p.value);
        if (key === null || v === null) return null;
        props.push(`${JSON.stringify(key)}:${v}`);
      }
      return `{${props.join(",")}}`;
    }
    default: return null;
  }
}
const hashOf = (text) => crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
const preview = (text) => (text.length > 80 ? text.slice(0, 77) + "..." : text);

// The literal constants a module initialiser assigns at its top level: every
// `name = <literal>` statement, or one link of a `a = 1, b = 2` sequence.
// -> sorted, de-duplicated hashes (the assigned short names are re-mangled
// every release and are not part of the identity)
function assignedConstants(fn) {
  const out = new Set();
  const stmts = fn.body.type === "BlockStatement" ? fn.body.body : [{ type: "ExpressionStatement", expression: fn.body }];
  for (const st of stmts) {
    if (st.type !== "ExpressionStatement") continue;
    const ex = st.expression.type === "SequenceExpression" ? st.expression.expressions : [st.expression];
    for (const e of ex) {
      if (e.type !== "AssignmentExpression" || e.operator !== "=" || e.left.type !== "Identifier") continue;
      const c = canonicalLiteral(e.right);
      if (c !== null) out.add(hashOf(c));
    }
  }
  return [...out].sort();
}

// Top-level declarations of a parsed program:
//   name -> { node, kind, params, line, ... }
// node is the whole statement for a function/class declaration, the initializer
// for a variable -- except a moduleInit, whose node is the module body (the
// function __esm is called with), so that shapeOf() records it exactly as it
// records a function. A moduleInit also carries `values` (assignedConstants), a
// value `canonical` (canonicalLiteral).
export function topLevelDeclarations(ast) {
  const decls = new Map();
  const helpers = esmHelpers(ast);
  const fnParams = (n) => (n && Array.isArray(n.params) ? n.params.length : null);
  for (const s of ast.program.body) {
    if (s.type === "FunctionDeclaration" && s.id) {
      decls.set(s.id.name, { node: s, kind: s.async ? "async function" : "function", params: fnParams(s), line: s.loc.start.line });
    } else if (s.type === "ClassDeclaration" && s.id) {
      decls.set(s.id.name, { node: s, kind: "class", params: null, line: s.loc.start.line });
    } else if (s.type === "VariableDeclaration") {
      for (const d of s.declarations) {
        if (d.id.type !== "Identifier") continue;
        const init = d.init;
        let kind, extra = {};
        if (!init) kind = "var (uninitialised)";
        else if (isFnExpr(init)) kind = (init.async ? "async " : "") + "function-expr";
        else if (init.type === "ClassExpression") kind = "class-expr";
        else if (isModuleInitCall(init, helpers)) {
          const body = init.arguments[0];
          kind = "moduleInit";
          extra = { node: body, params: fnParams(body), values: assignedConstants(body) };
        } else if (init.type === "CallExpression") kind = "var = call";
        else {
          const c = canonicalLiteral(init);
          if (c !== null) { kind = "value"; extra = { canonical: c }; }
          else kind = `var = ${init.type}`;
        }
        decls.set(d.id.name, { node: init ?? d, kind, params: fnParams(init), line: s.loc.start.line, ...extra });
      }
    }
  }
  return decls;
}
export const FUNCTION_LIKE = /^(async )?(function|function-expr|class|class-expr)$/;
export const isFunctionLike = (decl) => !!decl && FUNCTION_LIKE.test(decl.kind);
// every kind an inferred name may be on (KIND check, header)
export const isNameable = (decl) => isFunctionLike(decl) || decl?.kind === "moduleInit" || decl?.kind === "value";
// the three kinds a name is spelled for: function, moduleInit, value
export const nameKind = (decl) => (isFunctionLike(decl) ? "function" : decl.kind);

// The spelling each kind's name must have (KIND, header). Every inferred name
// in the history of maps/inferred_daemon.json is camelCase on function-like
// code, so the table refuses nothing that was ever accepted.
const CAMEL = /^[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/;
export const NAME_SPELLING = {
  function: [CAMEL, "not camelCase (lower-case start, letters and digits, at least one capital)"],
  moduleInit: [/^init[A-Z][A-Za-z0-9]*Module$/, "not of the form init<Name>Module (initSessionDrainModule): a module initialiser is named for the module it runs"],
  value: [/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/, "not UPPER_SNAKE with at least one underscore (MEMORY_BOARD_OVERRIDE_PREAMBLE): the spelling verify_citations.mjs reads as a constant's real name"],
};
const KIND_WORDS = { function: "function-like", moduleInit: "a module initialiser", value: "a literal constant" };
// -> null, or why `name` is misspelled for the kind of `decl`
export function spellingProblem(decl, name) {
  const kind = nameKind(decl);
  if (!NAME_SPELLING[kind][0].test(name)) {
    const hint = kind === "moduleInit" && CAMEL.test(name)
      ? ". A function's name on a module initialiser is the runGapLint failure (v0.8.0): the function's anchor literal was hoisted into its module's constants, and the relocation landed on the initialiser that assigns them. Relocate on a literal still inside the function body; if the module itself is meant, name it init<Name>Module"
      : "";
    return `${NAME_SPELLING[kind][1]}, and the declaration is ${KIND_WORDS[kind]}${hint}`;
  }
  if (kind === "function" && NAME_SPELLING.moduleInit[0].test(name)) return "reads as a module initialiser's name (init<Name>Module), and the declaration is function-like";
  return null;
}
// why a declaration of any other kind is refused, for both tools' messages
export function whyNotNameable(decl) {
  if (decl.kind === "var (uninitialised)") return "an uninitialised var: its value is assigned inside its module's initialiser, so name that initialiser (init...Module) and cite the assignment through it";
  if (decl.kind === "var = call") return "initialised by a call that is not an esbuild module initialiser (a CommonJS wrapper, a factory result): no function, module or literal to name";
  return `initialised by a ${decl.kind.replace(/^var = /, "")}, which is not made of literals only`;
}

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

// non-computed member-property names used in a node: `.eventsDir`, `.open`, ...
function propsOf(node) {
  const out = new Set();
  const seen = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if ((n.type === "MemberExpression" || n.type === "OptionalMemberExpression") && !n.computed && n.property.type === "Identifier") out.add(n.property.name);
    for (const k of Object.keys(n)) if (k !== "loc" && k !== "range" && k !== "leadingComments" && k !== "trailingComments") walk(n[k]);
  })(node);
  return [...out].sort();
}

// the baseline record for one declaration (what `record` writes per name).
// A function's record is unchanged from before module initialisers and values
// were accepted: same keys, same order, so the committed baseline still checks.
export function shapeOf(decl) {
  if (decl.kind === "value") return { kind: "value", params: null, value: hashOf(decl.canonical), preview: preview(decl.canonical) };
  const sh = { kind: decl.kind, params: decl.params, literals: literalsOf(decl.node).slice(0, 24), props: propsOf(decl.node).slice(0, 60) };
  if (decl.kind === "moduleInit") sh.values = decl.values;
  return sh;
}

const features = sh => new Set([
  `kind:${sh.kind.replace(/^async /, "").replace(/-expr$/, "")}`, `params:${sh.params}`,
  ...(sh.literals || []).map(l => `lit:${l}`), ...(sh.props || []).map(p => `prop:${p}`),
  ...(sh.values || []).map(v => `val:${v}`)]);
function similarity(x, y) {
  const a = features(x), b = features(y);
  let inter = 0;
  for (const f of a) if (b.has(f)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

// Constants esbuild writes for an empty or default state. Many modules assign
// one, so sharing one with a record says nothing about which module this is.
export const TRIVIAL_VALUES = new Set(["null", "true", "false", "(!0)", "(!1)", "(void 0)", "0", "1", "(-1)", '""', "[]", "{}"].map(hashOf));

// Every module initialiser's shape, by short name: the RIVAL rule scores a
// record against all of them (292 in daemon.pretty.js at v0.8.3).
export function initialiserShapes(decls) {
  const out = new Map();
  for (const [n, d] of decls) if (d.kind === "moduleInit") out.set(n, shapeOf(d));
  return out;
}
// How well `record` fits the initialiser `name` is on (`own`), and every other
// initialiser that fits it better (best first) or exactly as well. Scored with
// similarity(), the SWAP check's measure.
// -> { own, better: [[short, score], ...], equal: [short, ...] }
export function initialiserRivals(record, name, shapes) {
  const own = similarity(record, shapes.get(name));
  const better = [], equal = [];
  for (const [n, sh] of shapes) {
    if (n === name) continue;
    const s = similarity(record, sh);
    if (s > own) better.push([n, s]);
    else if (s === own) equal.push(n);
  }
  better.sort((a, b) => b[1] - a[1]);
  return { own, better, equal };
}
// Check 2 for a name on a module initialiser (header): `old` is its record,
// `cur` the shape of the initialiser `mangled` it is on now, `shapes` every
// initialiser's (initialiserShapes). -> { fail: string|null, warn: [string] }
export function judgeInitialiser(real, mangled, old, cur, shapes) {
  const warn = [];
  const oldVals = old.values ?? [], curVals = new Set(cur.values);
  const sharedLits = cur.literals.filter(l => old.literals.includes(l));
  const telling = oldVals.filter(v => !TRIVIAL_VALUES.has(v));
  const sharedTelling = telling.filter(v => curVals.has(v));
  if (old.literals.length + telling.length > 0 && sharedLits.length + sharedTelling.length === 0) {
    const defaults = oldVals.length - telling.length;
    return { fail: `${real}: this module initialiser shares no string literal and no assigned constant with the recorded one (${old.literals.length} literal(s), ${telling.length} constant(s)${defaults ? `; ${defaults} default value(s) such as null or 0 do not count` : ""}) -- a module is its constants, so this is another module's initialiser`, warn };
  }
  const { own, better, equal } = initialiserRivals(old, mangled, shapes);
  if (better.length) {
    const [n, s] = better[0];
    return { fail: `${real}: the recorded shape fits module initialiser ${n} better (${s.toFixed(2)}) than ${mangled}, the one the name is on (${own.toFixed(2)})${better.length > 1 ? `, and ${better.length - 1} more fit it better too` : ""} -- the name is on the wrong initialiser; re-point it, or, if upstream really rewrote this module, re-read it and re-record`, warn };
  }
  if (equal.length) warn.push(`${real}: ${equal.length} other module initialiser(s) fit its recorded shape exactly as well as ${mangled} (${equal.slice(0, 4).join(", ")}): nothing can tell which one this name is on -- re-read by hand`);
  const sharedVals = oldVals.filter(v => curVals.has(v));
  if (sharedVals.length !== oldVals.length || curVals.size !== oldVals.length)
    warn.push(`${real}: the constants it assigns changed (${oldVals.length - sharedVals.length} gone, ${curVals.size - sharedVals.length} new) -- re-read the citations bound to it`);
  return { fail: null, warn };
}

function main() {
  const [, , MODE, PRETTY, INFERRED, SHAPE] = process.argv;
  if (!["check", "record"].includes(MODE) || !PRETTY || !INFERRED || (MODE === "record" && !SHAPE)) {
    console.error("usage: node verify_inferred.mjs check|record <pretty.js> <inferred.json> [shape.json]");
    process.exit(2);
  }

  const src = fs.readFileSync(PRETTY, "utf8");
  const inferred = JSON.parse(fs.readFileSync(INFERRED, "utf8")); // mangled -> real
  const decls = topLevelDeclarations(parse(src, { sourceType: "module", ranges: true }));

  const shape = {};
  const mangledOf = {}; // real -> the short name it is on
  const fail = [], warn = [];
  const byKind = { function: 0, moduleInit: 0, value: 0 };
  for (const [mangled, real] of Object.entries(inferred)) {
    const d = decls.get(mangled);
    if (!d) { fail.push(`${real}: ${mangled} is not a top-level declaration in ${PRETTY}`); continue; }
    if (!isNameable(d)) {
      fail.push(`${real}: ${mangled} @${d.line} is "${d.kind}" -- ${whyNotNameable(d)}. If this was a function, the anchor literal was probably hoisted into a shared constant; relocate on a literal that is still inside the function body, or via pair_changes.mjs / the block hint in bump.sh`);
      continue;
    }
    const misspelled = spellingProblem(d, real);
    if (misspelled) { fail.push(`${real}: ${mangled} @${d.line}: the name is ${misspelled}`); continue; }
    mangledOf[real] = mangled;
    const sh = shapeOf(d);
    // name_symbol.mjs refuses to register one; a hand edit, or a release that
    // moved every constant out, must not leave a name nothing can refute
    if (d.kind === "moduleInit" && !sh.literals.length && !sh.values.length) {
      fail.push(`${real}: ${mangled} @${d.line} is a module initialiser with no string literal and no literal constant: nothing in it can tell it from any other initialiser, so this name cannot be verified (and nothing in it is citable)`);
      continue;
    }
    shape[real] = sh;
    byKind[nameKind(d)]++;
  }
  const ok = byKind.function + byKind.moduleInit + byKind.value;

  if (MODE === "record") {
    if (fail.length) { for (const f of fail) console.error(`  ${f}`); console.error("refusing to record a baseline from a map with failures"); process.exit(1); }
    const stamp = { source: PRETTY.split("/").pop(), recorded: new Date().toISOString().slice(0, 10) };
    if (process.env.PKG_VERSION) stamp.package = process.env.PKG_VERSION;
    fs.writeFileSync(SHAPE, JSON.stringify({ ...stamp, shapes: shape }, null, 2) + "\n");
    console.error(`recorded ${ok} inferred-name shape(s) -> ${SHAPE}`);
    process.exit(0);
  }

  // check mode: compare against the recorded baseline when one exists
  if (SHAPE && fs.existsSync(SHAPE)) {
    const base = JSON.parse(fs.readFileSync(SHAPE, "utf8")).shapes ?? {};
    // every top-level constant's literal, for the ambiguity warning below
    const valueHolders = new Map(); // hash -> [short names]
    for (const [n, d] of decls) if (d.kind === "value") { const h = hashOf(d.canonical); valueHolders.set(h, [...(valueHolders.get(h) ?? []), n]); }
    // every module initialiser's shape, for the RIVAL rule; only when one is named
    let initShapes = null;
    for (const [real, cur] of Object.entries(shape)) {
      const old = base[real];
      if (!old) { warn.push(`${real}: no recorded shape (new inferred name?) -- run \`record\` after review`); continue; }
      const norm = (k) => k.replace(/^async /, "").replace(/-expr$/, "");
      if (norm(old.kind) !== norm(cur.kind)) { fail.push(`${real}: kind changed ${old.kind} -> ${cur.kind}; a ${old.kind} does not become a ${cur.kind} across a release -- wrong declaration`); continue; }
      if (cur.kind === "value") {
        if (old.value !== cur.value) fail.push(`${real}: the constant's literal changed: was ${old.preview}, is ${cur.preview}. A constant whose literal changed is a different constant: re-point the name, or, if upstream really changed this constant, re-read every citation of it and re-record`);
        const others = (valueHolders.get(cur.value) ?? []).filter(n => inferred[n] !== real);
        if (others.length) warn.push(`${real}: ${others.length} other top-level constant(s) have the same literal (${others.slice(0, 4).join(", ")}): nothing can tell which one this name is on -- re-read by hand`);
        continue;
      }
      if (old.params != null && cur.params != null && old.params !== cur.params) warn.push(`${real}: parameter count ${old.params} -> ${cur.params} (re-read: rewrite, or wrong function?)`);
      if (cur.kind === "moduleInit") {
        const j = judgeInitialiser(real, mangledOf[real], old, cur, initShapes ??= initialiserShapes(decls));
        if (j.fail) fail.push(j.fail);
        warn.push(...j.warn);
        continue;
      }
      const shared = cur.literals.filter(l => old.literals.includes(l));
      if (old.literals.length >= 3 && cur.literals.length >= 3 && shared.length === 0) warn.push(`${real}: shares no string literal with the recorded body (${old.literals.length} vs ${cur.literals.length}) -- re-read by hand`);
    }
    // swap detection: needs a baseline that recorded props (older baselines did
    // not). Values have no body to score (header) and never recorded props.
    const scorable = Object.entries(base).filter(([, v]) => v.kind !== "value" && Array.isArray(v.props));
    if (scorable.length < Object.values(base).filter(v => v.kind !== "value").length) warn.push("shape baseline predates member-property recording; the SWAP check is off until `record` is re-run");
    else for (const [real, cur] of Object.entries(shape)) {
      if (!base[real] || cur.kind === "value" || base[real].kind === "value") continue;
      const own = similarity(cur, base[real]);
      let best = null, bestScore = -1;
      for (const [other, sh] of scorable) {
        if (other === real) continue;
        const sc = similarity(cur, sh);
        if (sc > bestScore) { best = other; bestScore = sc; }
      }
      if (best && bestScore > own + 0.15 && bestScore >= 0.4) fail.push(`${real}: this body matches the recorded shape of ${best} (${bestScore.toFixed(2)}) better than its own (${own.toFixed(2)}) -- names exchanged, or re-anchored onto the wrong declaration`);
      else if (own < 0.25) warn.push(`${real}: body resembles its recorded shape only weakly (${own.toFixed(2)}) -- re-read by hand`);
    }
    for (const real of Object.keys(base)) if (!(real in shape) && Object.values(inferred).includes(real) === false) warn.push(`${real}: in shape baseline but no longer in the inferred map (dropped upstream? then re-record)`);
  } else {
    warn.push(`no shape baseline${SHAPE ? ` at ${SHAPE}` : ""}; only the KIND check ran -- record one after this map is reviewed`);
  }

  console.error(`inferred names: ${Object.keys(inferred).length}  function-like: ${byKind.function}  module initialisers: ${byKind.moduleInit}  constants: ${byKind.value}`);
  for (const w of warn) console.error(`  warn: ${w}`);
  if (fail.length) {
    console.error(`\n${fail.length} inferred name(s) point at the WRONG declaration:`);
    for (const f of fail) console.error(`  ${f}`);
    console.error(`RESULT: FAIL ${fail.length} refuted, ${warn.length} warning(s)`);
    process.exit(1);
  }
  if (warn.length) {
    console.error(`RESULT: WARN nothing refuted, but ${warn.length} warning(s) above need a human re-read`);
    process.exit(3);
  }
  console.error("RESULT: pass every inferred name resolves to function-like code, a module initialiser or a literal constant, spelled for its kind" + (SHAPE && fs.existsSync(SHAPE) ? ", and matches the recorded shape baseline" : ""));
  process.exit(0);
}

// run as a CLI only when executed directly, not when imported by name_symbol.mjs
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
