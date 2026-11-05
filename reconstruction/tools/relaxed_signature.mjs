// Relaxed structural similarity of two declarations: how much of one body is
// in the other, for the declarations the exact structural signature cannot
// pair.
//
// structural_signature.mjs hashes a declaration's normalised AST; two bodies
// either hash the same or they do not, and a body that changed in one token
// has no match. decl_features.mjs ranks candidates by the property names,
// strings, numbers and globals a body refers to, which works when a body
// carries at least three of them; a one-line predicate (`e => e.length > 0`),
// a module initialiser holding two strings or a small wrapper has too few and
// is left `untraceable`. This module gives those declarations two measures
// that need no features, both computed on the same normalised AST as the
// signature (identifiers the minifier re-picks erased, member names, literals
// and globals kept):
//
//   - a 1-dimensional Weisfeiler-Lehman label multiset: every node starts
//     with its own label (node type with its operator or kind, `p:name` for a
//     member name, `s:`/`n:`/`b:`/`t:` for a literal, `g:name` for a global,
//     `_` for a re-mangled identifier); each round relabels a node with the
//     hash of its label and the sorted labels of its children, so a label of
//     round k stands for a subtree of depth k. The multiset of every label of
//     every round (k rounds, default 2) is the profile; two profiles compare
//     by weighted Jaccard (sum of the smaller count over sum of the larger).
//     Its sha256 over the sorted multiset is the relaxed hash: equal for
//     bodies that differ only by renaming, like the exact signature, and
//     usable as a bucket key.
//   - a normalised-token LCS ratio, as NiCad computes clone distance after
//     blind renaming: the pre-order label sequence of the same normalised AST
//     is the token stream (so punctuation and operators are in it through
//     the node types and their operator fields), and the ratio is
//     2 * LCS / (|a| + |b|), 1 for identical streams, 0 for disjoint ones.
//     Streams are capped at MAX_TOKENS labels so the quadratic table stays
//     small; the cap is recorded in the profile.
//
// relaxedSimilarity() returns both and their mean, which release_pairing.mjs
// uses as the similarity of two declarations with too few features for the
// feature score (the mean, because the WL Jaccard is strict about structure
// at every depth while the LCS ratio forgives a moved statement; two tiny
// predicates that differ in one member name score 0.5 to 0.7 on both, two
// identical ones 1).
//
// Library:
//   relaxedProfile(node, ctx, { rounds = 2, maxTokens = MAX_TOKENS }) -> { t, w, h, n, capped }
//       t: token stream (array), w: { label: count } over all rounds, h: hash of w,
//       n: node count, capped: true when the stream was cut at maxTokens
//   wlSimilarity(wA, wB) -> weighted Jaccard of two label multisets
//   lcsRatio(tA, tB)     -> 2 * LCS / (|tA| + |tB|)
//   relaxedSimilarity(profileA, profileB) -> { wl, lcs, sim }
//   relaxedHash(w)       -> sha256 of the sorted multiset, first 20 hex
//   profilesOf(src, names?) -> Map<name, profile> for the top-level declarations of a bundle
//
// CLI: the measures between two named top-level declarations of two bundles
// (any two pretty bundles; the same file twice compares two of its declarations):
//   node relaxed_signature.mjs <a.pretty.js> <b.pretty.js> <nameInA> <nameInB> [--rounds 2] [--tokens]
// Prints wl, lcs and sim, the two stream lengths and the relaxed hashes;
// --tokens also prints both token streams. Exit 2 when a name is not a
// top-level declaration.
import crypto from "node:crypto";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { signatureContext, topLevelDecls } from "./structural_signature.mjs";

export const MAX_TOKENS = 2000;
export const ROUNDS = 2;

const SKIP_KEYS = new Set(["type", "start", "end", "loc", "range", "leadingComments", "trailingComments", "innerComments", "extra", "shorthand"]);
// scalar fields that distinguish otherwise equal node types (`a + b` vs `a - b`, `let` vs `const`)
const LABEL_FIELDS = ["operator", "kind", "prefix", "computed", "async", "generator", "static", "optional", "delegate", "await"];

// the same binding rule as structural_signature.mjs: a name bound inside the
// node or at program level is a re-mangled identifier, anything else a global
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
function boundWithin(node) {
  const out = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object") return;
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
const KEYED = new Set(["ObjectProperty", "ObjectMethod", "ClassMethod", "ClassPrivateMethod", "ClassProperty", "ClassPrivateProperty", "ClassAccessorProperty"]);
function roleOf(parent, key) {
  switch (parent.type) {
    case "MemberExpression": case "OptionalMemberExpression": return key === "property" && !parent.computed ? "prop" : "ref";
    case "LabeledStatement": case "BreakStatement": case "ContinueStatement": return key === "label" ? "erased" : "ref";
    case "MetaProperty": return "keep";
    case "PrivateName": return "erased";
    case "ImportSpecifier": case "ExportSpecifier": case "ExportNamespaceSpecifier": return key === "imported" || key === "exported" ? "keep" : "ref";
  }
  if (KEYED.has(parent.type) && key === "key" && !parent.computed) return "prop";
  return "ref";
}

const cut = v => (v.length > 80 ? v.slice(0, 80) : v);
function labelOf(x, role, isBound) {
  switch (x.type) {
    case "Identifier":
      if (role === "prop") return "p:" + x.name;
      if (role === "keep") return "k:" + x.name;
      if (role === "erased") return "_";
      return isBound(x.name) ? "_" : "g:" + x.name;
    case "StringLiteral": return "s:" + cut(x.value);
    case "NumericLiteral": return "n:" + x.value;
    case "BooleanLiteral": return "b:" + x.value;
    case "TemplateElement": return "t:" + cut(x.value.raw);
    case "NullLiteral": return "null";
    case "RegExpLiteral": return "re:" + cut(x.pattern) + "/" + x.flags;
  }
  let l = x.type;
  for (const f of LABEL_FIELDS) if (x[f] !== undefined && x[f] !== null && typeof x[f] !== "object") l += `[${f}=${x[f]}]`;
  return l;
}

// cyrb53: a fast 53-bit string hash; labels of later rounds only need to be
// equal for equal subtrees, not cryptographic
function h53(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function relaxedHash(w) {
  const keys = Object.keys(w).sort();
  const h = crypto.createHash("sha256");
  for (const k of keys) h.update(k + "\u0001" + w[k] + "\u0002");
  return h.digest("hex").slice(0, 20);
}

// ctx: signatureContext(ast) of the program the node came from (nodes handed
// out by topLevelDecls() carry one; otherwise pass it, or every reference
// outside the node reads as a global)
export function relaxedProfile(node, ctx, { rounds = ROUNDS, maxTokens = MAX_TOKENS } = {}) {
  const bound = boundWithin(node);
  const isBound = ctx ? name => bound.has(name) || ctx.topLevel.has(name) : name => bound.has(name);
  // flatten to (label, children) in pre-order
  const labels = [], children = [];
  const visit = (x, role) => {
    if (!x || typeof x.type !== "string") return -1;
    const id = labels.length;
    labels.push(labelOf(x, role, isBound)); children.push([]);
    for (const k of Object.keys(x)) {
      if (SKIP_KEYS.has(k)) continue;
      const v = x[k];
      if (Array.isArray(v)) { for (const y of v) { const c = visit(y, roleOf(x, k)); if (c >= 0) children[id].push(c); } }
      else if (v && typeof v.type === "string") { const c = visit(v, roleOf(x, k)); if (c >= 0) children[id].push(c); }
    }
    return id;
  };
  visit(node, "ref");
  const n = labels.length;
  const w = Object.create(null);
  const add = l => { w[l] = (w[l] ?? 0) + 1; };
  let cur = labels;
  for (const l of cur) add(l);
  for (let r = 1; r <= rounds; r++) {
    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      const cl = children[i].map(c => cur[c]).sort();
      next[i] = r + ":" + h53(cur[i] + "|" + cl.join(","));
      add(next[i]);
    }
    cur = next;
  }
  const capped = n > maxTokens;
  return { t: capped ? labels.slice(0, maxTokens) : labels, w, h: relaxedHash(w), n, capped };
}

// weighted Jaccard of two label multisets: sum of min over sum of max
export function wlSimilarity(wA, wB) {
  let inter = 0, union = 0;
  for (const k in wA) { const a = wA[k], b = wB[k] ?? 0; inter += Math.min(a, b); union += Math.max(a, b); }
  for (const k in wB) if (!(k in wA)) union += wB[k];
  return union ? inter / union : 0;
}

// 2 * LCS / (|a| + |b|) over two token arrays; a two-row dynamic programme
export function lcsRatio(a, b) {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  if (a.length < b.length) [a, b] = [b, a];
  const m = b.length;
  let prev = new Uint32Array(m + 1), cur = new Uint32Array(m + 1);
  for (let i = 1; i <= a.length; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) cur[j] = ai === b[j - 1] ? prev[j - 1] + 1 : (prev[j] > cur[j - 1] ? prev[j] : cur[j - 1]);
    [prev, cur] = [cur, prev];
  }
  return (2 * prev[m]) / (a.length + b.length);
}

export function relaxedSimilarity(A, B) {
  const wl = wlSimilarity(A.w, B.w), lcs = lcsRatio(A.t, B.t);
  return { wl: +wl.toFixed(3), lcs: +lcs.toFixed(3), sim: +((wl + lcs) / 2).toFixed(3) };
}

// profiles of the top-level declarations of a bundle (all, or the names given)
export function profilesOf(src, names, opts) {
  const { ast, decls } = topLevelDecls(src);
  const ctx = signatureContext(ast);
  const out = new Map();
  for (const [name, node] of decls) if (!names || names.has(name)) out.set(name, relaxedProfile(node, ctx, opts));
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const rounds = Number(opt("--rounds", ROUNDS));
  const ti = argv.indexOf("--tokens"); const SHOW = ti !== -1; if (SHOW) argv.splice(ti, 1);
  const [A, B, NA, NB] = argv;
  if (!A || !B || !NA || !NB) { console.error("usage: node relaxed_signature.mjs <a.pretty.js> <b.pretty.js> <nameInA> <nameInB> [--rounds 2] [--tokens]"); process.exit(2); }
  const pa = profilesOf(fs.readFileSync(A, "utf8"), new Set([NA]), { rounds }).get(NA);
  const pb = profilesOf(fs.readFileSync(B, "utf8"), new Set([NB]), { rounds }).get(NB);
  if (!pa) { console.error(`${NA}: not a top-level declaration of ${A}`); process.exit(2); }
  if (!pb) { console.error(`${NB}: not a top-level declaration of ${B}`); process.exit(2); }
  const r = relaxedSimilarity(pa, pb);
  console.log(`${NA} (${pa.n} nodes${pa.capped ? ", capped" : ""}, wl ${pa.h}) vs ${NB} (${pb.n} nodes${pb.capped ? ", capped" : ""}, wl ${pb.h}): wl ${r.wl}  lcs ${r.lcs}  sim ${r.sim}`);
  if (SHOW) { console.log(`--- ${NA}\n${pa.t.join(" ")}\n--- ${NB}\n${pb.t.join(" ")}`); }
}
