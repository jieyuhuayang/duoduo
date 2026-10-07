// Rank the new declarations an inferred name may have moved to.
//
// remap_inferred.mjs carries an inferred name across a bump only on a unique
// structural fingerprint match. A name whose body changed (RE-ANCHOR) or whose
// fingerprint several new declarations share (AMBIGUOUS) is left for a person,
// and impact_report.mjs used to suggest only the declaration the positional
// pairing put there, or every declaration of the reshaped block -- at v0.8.4,
// 18 of the 47 names had no suggestion at all, and positional pairs are wrong
// whenever esbuild reorders a module.
//
// What does survive a change of body is the declaration's place in the call
// graph and its strings. So each candidate is scored on three overlaps with the
// old declaration, each |A ∩ B| / max(|A|, |B|):
//   callers   the top-level declarations that reference it, the old ones
//             mapped forward through the unique fingerprint matches and the
//             positional pairs of changed declarations (x2)
//   callees   the top-level declarations it references, mapped the same way
//   literals  its string literals of 4+ characters (x2)
// Only a candidate of the old declaration's kind (function, module
// initialiser, literal constant: verify_inferred.mjs nameKind) is scored. The
// candidates are the ones the caller gives (an AMBIGUOUS name's fingerprint
// matches, the positional suggestion) and every new declaration with no old
// counterpart (fingerprint unmatchedNew), where a changed body lands. The margin to the runner-up says
// how much the top pick can be trusted; the pick is still confirmed by hand and
// by verify_inferred.mjs.
//
// For a literal constant the callers are usually everything: two constants
// with the same value (v0.8.4's IDLE_COMPACT_FIRE_CAP_PER_SWEEP and another 8)
// differ only in who reads them.
//
// Library: rankAnchors(oldPretty, newPretty, fp, [{ short, candidates? }], { pairs?, top? }) ->
//   [{ short, kind, ranked: [{ name, score, callers, callees, literals, line }] }]
// CLI: node anchor_candidates.mjs <old.pretty.js> <new.pretty.js> <fp.json> [--pairs <pairs.json>] <oldShort>[=<cand>,<cand>...]...
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { topLevelDeclarations, nameKind } from "./verify_inferred.mjs";

const SKIP = new Set(["loc", "start", "end", "extra", "leadingComments", "trailingComments", "innerComments"]);

function load(prettyPath) {
  const ast = parse(fs.readFileSync(prettyPath, "utf8"), { sourceType: "script", errorRecovery: true });
  const decls = topLevelDeclarations(ast);
  const info = new Map();
  for (const s of ast.program.body) {
    const owners = [];
    if (s.type === "VariableDeclaration") { for (const d of s.declarations) if (d.id.type === "Identifier") owners.push([d.id.name, d]); }
    else if (s.id) owners.push([s.id.name, s]);
    for (const [name, node] of owners) {
      const refs = new Set(), lits = new Set();
      (function walk(n, key, parent) {
        if (!n || typeof n !== "object") return;
        if (Array.isArray(n)) { for (const x of n) walk(x, key, parent); return; }
        if (n.type === "Identifier" && n.name !== name && decls.has(n.name) &&
            !(key === "property" && !parent.computed) && !(key === "key" && !parent.computed)) refs.add(n.name);
        if (n.type === "StringLiteral" && n.value.length >= 4) lits.add(n.value);
        if (n.type === "TemplateElement" && (n.value.cooked ?? n.value.raw).length >= 4) lits.add(n.value.cooked ?? n.value.raw);
        for (const k of Object.keys(n)) if (!SKIP.has(k)) walk(n[k], k, n);
      })(node);
      info.set(name, { refs, lits, line: node.loc?.start.line });
    }
  }
  const callers = new Map();
  for (const [n, i] of info) for (const r of i.refs) { if (!callers.has(r)) callers.set(r, new Set()); callers.get(r).add(n); }
  return { decls, info, callers };
}

const overlap = (a, b) => {
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return { shared: i, of: Math.max(a.size, b.size) };
};
const ratio = (o) => (o.of ? o.shared / o.of : 0);

export function rankAnchors(oldPretty, newPretty, fp, names, { pairs = {}, top = 3 } = {}) {
  const O = load(oldPretty), N = load(newPretty);
  // old -> new for the context: unique fingerprint matches, then the positional
  // pairs of changed declarations (pair_changes.mjs), so a caller whose own
  // body changed still counts
  const fwd = new Map(Object.entries(pairs));
  for (const [o, m] of Object.entries(fp.matched || {})) if (m.unique && typeof m.new === "string") fwd.set(o, m.new);
  const mapSet = (set) => new Set([...set].map((x) => fwd.get(x)).filter(Boolean));
  const out = [];
  for (const { short, candidates } of names) {
    const od = O.decls.get(short), oi = O.info.get(short);
    if (!od || !oi) { out.push({ short, kind: null, ranked: [] }); continue; }
    const kind = nameKind(od);
    const oCallers = mapSet(O.callers.get(short) || new Set()), oCallees = mapSet(oi.refs);
    const pool = [...(candidates || []), ...(fp.unmatchedNew || [])];
    const ranked = [];
    for (const c of new Set(pool)) {
      const nd = N.decls.get(c), ni = N.info.get(c);
      if (!nd || !ni || nameKind(nd) !== kind) continue;
      const callers = overlap(oCallers, N.callers.get(c) || new Set());
      const callees = overlap(oCallees, ni.refs);
      const literals = overlap(oi.lits, ni.lits);
      const score = +(2 * ratio(callers) + ratio(callees) + 2 * ratio(literals)).toFixed(3);
      ranked.push({ name: c, score, callers, callees, literals, line: nd.line });
    }
    ranked.sort((a, b) => b.score - a.score || a.line - b.line);
    out.push({ short, kind, line: od.line, ranked: ranked.slice(0, top) });
  }
  return out;
}

// "`Xe` 2.71 (callers 3/3, callees 2/4, literals 1/1), runner-up `Yq` 0.40"
export function describeRanking(r) {
  if (!r.ranked.length) return "no candidate of its kind";
  const f = (x) => `\`${x.name}\` ${x.score.toFixed(2)} (callers ${x.callers.shared}/${x.callers.of}, callees ${x.callees.shared}/${x.callees.of}, literals ${x.literals.shared}/${x.literals.of})`;
  const [a, b] = r.ranked;
  return f(a) + (b ? `, runner-up \`${b.name}\` ${b.score.toFixed(2)}` : ", the only candidate of its kind");
}

function main() {
  const argv = process.argv.slice(2);
  const pi = argv.indexOf("--pairs");
  const pairs = pi >= 0 ? JSON.parse(fs.readFileSync(argv.splice(pi, 2)[1], "utf8")).pairs : {};
  const [OLD, NEW, FP, ...specs] = argv;
  if (!OLD || !NEW || !FP || !specs.length) {
    console.error("usage: node anchor_candidates.mjs <old.pretty.js> <new.pretty.js> <fp.json> [--pairs <pairs.json>] <oldShort>[=<cand>,<cand>...]...");
    process.exit(2);
  }
  const fp = JSON.parse(fs.readFileSync(FP, "utf8"));
  const names = specs.map((s) => { const [short, c] = s.split("="); return { short, candidates: c ? c.split(",") : null }; });
  for (const r of rankAnchors(OLD, NEW, fp, names, { pairs })) console.log(`${r.short} [${r.kind ?? "not a top-level declaration"}]: ${describeRanking(r)}`);
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
