// Rank the new declarations an inferred name may have moved to, and decide
// which of the top picks can be accepted without a person reading the body.
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
// graph and its strings. So each candidate is scored on three feature classes
// against the old declaration:
//   callers   the top-level declarations that reference it (Babel's
//             ReferencedIdentifier resolved to the program scope, so an
//             assignment to a top-level `var` inside a module initialiser is
//             not a reference: 721 (declaration, name) pairs fewer than a walk
//             over every Identifier on v0.8.4's daemon; esbuild gives no nested
//             binding a top-level name in v0.8.3-v0.8.7, so shadowing never
//             occurs there), the old ones mapped forward through the accepted pairs
//   callees   the top-level declarations it references, mapped the same way
//   literals  its string literals of 4+ characters
// Three mechanisms come from binary diffing and the Java mapping tools
// (docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md §3.1, §8 建议 2 and 3):
//
//   rarity weighting (Ghidra's reference correlators): a feature is weighted
//   by how rare it is in its bundle, w = ln(N / df), N the number of top-level
//   declarations, df the number of declarations referencing that symbol (for a
//   callee), referenced by that caller (its out-degree, for a caller) or
//   holding that literal. A utility called from 500 places is almost no
//   evidence; a symbol with two callers is strong evidence. A reference to a
//   symbol that no accepted pair maps yet is an unknown feature: it stays in
//   the union at half its weight and can never be shared. Each class is the
//   weighted Jaccard, sum of the weights of the shared features over the sum
//   over the union; the classes are combined 2 : 1 : 2 (callers : callees :
//   literals) over the classes that have any feature, so the score is in [0, 1].
//
//   propagation (BinDiff's neighbour pass): the accepted set starts as the
//   unique fingerprint matches, the anchored alignment pairs (align_releases.mjs)
//   and the positional pairs of changed declarations (pair_changes.mjs). Every
//   RE-ANCHOR / AMBIGUOUS name is scored; the ones that pass the thresholds join
//   the accepted set, their targets leave every other name's pool, the
//   references through them become known, and the names are scored again, to a
//   fixpoint (at most `rounds` rounds). The candidate pool of a name is: the
//   candidates the caller gives (an AMBIGUOUS name's fingerprint matches, the
//   positional and alignment suggestions), every new declaration with no old
//   counterpart (fingerprint unmatchedNew), and, through the accepted pairs,
//   the new-side callers of the images of its old callees and the callees of
//   the images of its old callers -- all of the old declaration's kind
//   (verify_inferred.mjs nameKind) and not yet claimed by an accepted pair.
//
//   thresholds and abstention (Matcher's checkRank): the top candidate is
//   accepted only when its score is at least ABS and the runner-up scores below
//   top * (1 - REL); a new declaration picked by two names in the same round is
//   accepted for neither (sanitizeMatches, many-to-one). An abstention carries
//   its reason: `no candidate`, `score below threshold`, `runner-up too close`,
//   `many-to-one`. An accepted pick is still confirmed by confirm_reanchor.mjs'
//   witnesses and by verify_inferred.mjs; it is never written on the score alone.
//
// ABS and REL were chosen by replaying the four fixture pairs (v0.8.3 -> v0.8.4
// … v0.8.6 -> v0.8.7, replay_bump.sh) and taking values that accept no wrong
// pick on any of them and the most correct ones (VERIFICATION.md 5.2 has the
// sweep; the constants below say where they sit in it). Matcher's own 0.85 /
// 0.085 would accept 37 of the 63 here: a rewritten body shares fewer features
// with its old self than a Java method shares bytecode with its obfuscated twin.
//
// Two more rules from the same sources: an unknown old reference and an unknown
// new one that the fingerprint or the alignment says may be the same declaration
// (an AMBIGUOUS match's twins, an unanchored alignment pair) are potentially
// equal (Matcher's checkPotentialEquality) and pair off for half the credit of a
// known shared reference; and a literal constant's canonical value is one of its
// literal features, so two constants read by the same function still differ when
// their values do.
//
// For a literal constant the value feature is what tells twins apart: v0.8.4's
// `Oct` (= 8, where IDLE_COMPACT_FIRE_CAP_PER_SWEEP moved) and `$ct` (= 60000)
// are both read by `gwe` alone, so their callers class is identical and only
// the `=8` literal separates them, 1.00 against 0.50.
//
// Library:
//   loadGraph(prettyPath) -> the per-declaration features of one bundle (cached by path)
//   rankAnchors(oldPretty, newPretty, fp, [{ short, candidates? }],
//               { pairs?, align?, top?, abs?, rel?, rounds?, exclude? }) ->
//     [{ short, kind, line, status: "accept"|"abstain", reason, accepted, score, margin, round,
//        pool, ranked: [{ name, score, callers, callees, literals, line }] }]
//   each class in `ranked` is { shared, of, w } -- shared and total feature counts,
//   and the weighted Jaccard w.
//   `exclude`: new declarations kept out of every pool, as if claimed (the
//   removed-declaration simulation below: a name scored with its truth absent).
// CLI: node anchor_candidates.mjs <old.pretty.js> <new.pretty.js> <fp.json> [--pairs <pairs.json>]
//        [--align <align.json>] [--abs <x>] [--rel <x>] [--rounds <n>] [--exclude <new>,<new>...]
//        [--json <out>] <oldShort>[=<cand>,<cand>...]...
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { topLevelDeclarations, nameKind } from "./verify_inferred.mjs";

const traverse = _traverse.default || _traverse;

// Defaults from two replays over the 63 re-anchored names of the four fixture
// pairs (VERIFICATION.md 5.2, 2026-11-05). With the truth present, no cell of
// the ABS x REL grid accepts a wrong pick, because every truth ranks first: that
// sweep fixes REL (0.30 drops two near-identical functions scoring 0.95 against
// a runner-up at 0.71) but cannot constrain ABS, which only trades abstentions.
// What ABS is for is the declaration upstream removed: scored with its truth
// excluded (`exclude`), a name is accepted for a wrong neighbour 14 times of 63
// at ABS 0.25, 10 at 0.40, 2 at 0.45, 1 at 0.50, 0 at 0.60, while the correct
// acceptances with the truth present are 63, 62, 61, 56, 52. The wrong
// neighbours score 0.25-0.50 and the thinnest truths 0.28-0.49, so no ABS
// separates them; 0.45 is where the two counts add up to the least (61 + 2),
// abstaining on isSessionSetAliasParams (0.28, a three-line predicate) and
// initGapSpanModule (0.43), both still ranked first for the reader.
export const DEFAULT_ABS = 0.45;
export const DEFAULT_REL = 0.15;
export const DEFAULT_ROUNDS = 8;
const CLASS_WEIGHT = { callers: 2, callees: 1, literals: 2 };
const UNKNOWN_FACTOR = 0.5;
const MIN_LITERAL = 4;

const CACHE = new Map();
export function loadGraph(prettyPath) {
  const key = fs.realpathSync(prettyPath);
  if (CACHE.has(key)) return CACHE.get(key);
  const ast = parse(fs.readFileSync(prettyPath, "utf8"), { sourceType: "script", errorRecovery: true });
  const decls = topLevelDeclarations(ast);
  // every top-level binding with its source span, for attributing a node to the
  // declaration it sits in (a VariableDeclaration may hold several)
  const tops = [];
  for (const s of ast.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) tops.push({ name: s.id.name, start: s.start, end: s.end, line: s.loc.start.line });
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") tops.push({ name: d.id.name, start: d.start, end: d.end, line: s.loc.start.line });
  }
  tops.sort((a, b) => a.start - b.start);
  const enclosing = (off) => {
    let lo = 0, hi = tops.length - 1, ans = null;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (tops[m].start <= off) { if (off <= tops[m].end) ans = tops[m]; lo = m + 1; } else hi = m - 1; }
    return ans?.name ?? null;
  };
  const info = new Map(tops.map((t) => [t.name, { refs: new Set(), lits: new Set(), line: t.line }]));
  let programScope = null;
  traverse(ast, {
    Program(p) { programScope = p.scope; },
    ReferencedIdentifier(p) {
      const name = p.node.name;
      if (!decls.has(name)) return;
      const b = p.scope.getBinding(name);
      if (!b || b.scope !== programScope) return;
      const owner = enclosing(p.node.start);
      if (owner && owner !== name) info.get(owner).refs.add(name);
    },
    StringLiteral(p) {
      if (p.node.value.length < MIN_LITERAL) return;
      const owner = enclosing(p.node.start);
      if (owner) info.get(owner).lits.add(p.node.value);
    },
    TemplateElement(p) {
      const v = p.node.value.cooked ?? p.node.value.raw;
      if (v.length < MIN_LITERAL) return;
      const owner = enclosing(p.node.start);
      if (owner) info.get(owner).lits.add(v);
    },
  });
  // a literal constant is its literal: the canonical value (verify_inferred.mjs
  // canonicalLiteral, numbers included) is one of its literal features, so two
  // constants read by the same function still differ when their values do
  for (const [n, d] of decls) if (d.kind === "value" && info.has(n)) info.get(n).lits.add("=" + d.canonical);
  const callers = new Map(), litDf = new Map();
  for (const [n, i] of info) {
    for (const r of i.refs) { if (!callers.has(r)) callers.set(r, new Set()); callers.get(r).add(n); }
    for (const v of i.lits) litDf.set(v, (litDf.get(v) || 0) + 1);
  }
  const N = tops.length;
  const rarity = (df) => Math.log(N / Math.max(1, df));
  const g = {
    decls, info, callers, N,
    // weight of each feature, by class, in this bundle
    wCallee: (s) => rarity((callers.get(s) || { size: 0 }).size),
    wCaller: (x) => rarity((info.get(x) || { refs: { size: 0 } }).refs.size),
    wLiteral: (v) => rarity(litDf.get(v) || 0),
  };
  CACHE.set(key, g);
  return g;
}

// weighted Jaccard of one class: old features (mapped forward where known) vs
// the candidate's new features (known when some accepted pair targets them).
// An unknown old reference and an unknown new one that the fingerprint or the
// alignment says may be the same declaration (`pot`: an AMBIGUOUS match's
// twins, an unanchored alignment) are potentially equal (Matcher's
// checkPotentialEquality): they pair off for half the credit of a known
// shared reference. Any other unknown stays unique at half weight (Ghidra).
function classOverlap(oldSet, newSet, ctx, wOld, wNew, withUnknown) {
  const { fwd, bwd, pot } = ctx;
  const mapped = new Map(); // new name -> old source
  const unknownOld = [];
  let union = 0, shared = 0, sharedCount = 0;
  for (const o of oldSet) {
    const t = withUnknown ? fwd.get(o) : o;
    if (t !== undefined) mapped.set(t, o); else unknownOld.push(o);
  }
  for (const [t, o] of mapped) {
    const w = wOld(o);
    union += w;
    if (newSet.has(t)) { shared += w; sharedCount++; }
  }
  const used = new Set();
  for (const o of unknownOld) {
    const P = pot.get(o);
    let hit = null;
    if (P) for (const t of newSet) if (P.has(t) && !mapped.has(t) && !bwd.has(t) && !used.has(t)) { hit = t; break; }
    const w = wOld(o);
    if (hit) { used.add(hit); shared += UNKNOWN_FACTOR * w; union += w; sharedCount++; }
    else union += UNKNOWN_FACTOR * w;
  }
  for (const t of newSet) {
    if (mapped.has(t) || used.has(t)) continue;
    union += withUnknown && !bwd.has(t) ? UNKNOWN_FACTOR * wNew(t) : wNew(t);
  }
  return { shared: sharedCount, of: Math.max(oldSet.size, newSet.size), w: union > 0 ? shared / union : 0, union };
}

function scoreCandidate(O, N, short, cand, ctx) {
  const oi = O.info.get(short), ni = N.info.get(cand);
  const callers = classOverlap(O.callers.get(short) || new Set(), N.callers.get(cand) || new Set(), ctx, O.wCaller, N.wCaller, true);
  const callees = classOverlap(oi.refs, ni.refs, ctx, O.wCallee, N.wCallee, true);
  const literals = classOverlap(oi.lits, ni.lits, ctx, O.wLiteral, N.wLiteral, false);
  let num = 0, den = 0;
  for (const [cls, r] of [["callers", callers], ["callees", callees], ["literals", literals]]) {
    if (r.union <= 0) continue;
    num += CLASS_WEIGHT[cls] * r.w; den += CLASS_WEIGHT[cls];
  }
  const strip = ({ shared, of, w }) => ({ shared, of, w: +w.toFixed(3) });
  return { name: cand, score: den ? +(num / den).toFixed(3) : 0, callers: strip(callers), callees: strip(callees), literals: strip(literals), line: ni.line };
}

export function rankAnchors(oldPretty, newPretty, fp, names, { pairs = {}, align = {}, top = 3, abs = DEFAULT_ABS, rel = DEFAULT_REL, rounds = DEFAULT_ROUNDS, exclude = [] } = {}) {
  const O = loadGraph(oldPretty), Nn = loadGraph(newPretty);
  const asking = new Set(names.map((n) => n.short));
  // the accepted set: unique fingerprint matches and anchored alignment pairs
  // (trusted: their targets are claimed), then the positional pairs of changed
  // declarations (context only); a pair whose old side is a name being scored
  // is the question, not an answer
  // `exclude`: new declarations kept out of every pool, as if already claimed
  // (the removed-declaration simulation: score a name with its truth absent)
  const fwd = new Map(), claimed = new Set(exclude);
  const trust = (o, n) => { if (asking.has(o) || fwd.has(o)) return; fwd.set(o, n); claimed.add(n); };
  for (const [o, m] of Object.entries(fp.matched || {})) if (m.unique && typeof m.new === "string") trust(o, m.new);
  for (const [o, a] of Object.entries(align)) if (a && a.anchored && typeof a.new === "string") trust(o, a.new);
  for (const [o, n] of Object.entries(pairs)) if (!asking.has(o) && !fwd.has(o)) fwd.set(o, n);
  const bwd = new Map();
  for (const [o, n] of fwd) if (!bwd.has(n)) bwd.set(n, o);
  // what an unmapped old declaration may be: its fingerprint twins, its
  // unanchored alignment
  const pot = new Map();
  const may = (o, n) => { if (fwd.has(o) || typeof n !== "string") return; if (!pot.has(o)) pot.set(o, new Set()); pot.get(o).add(n); };
  for (const [o, m] of Object.entries(fp.matched || {})) if (Array.isArray(m.new)) for (const n of m.new) may(o, n);
  for (const [o, a] of Object.entries(align)) if (a && typeof a.new === "string") may(o, a.new);
  const ctx = { fwd, bwd, pot };

  const state = new Map();
  for (const { short, candidates } of names) {
    const od = O.decls.get(short), oi = O.info.get(short);
    if (!od || !oi) { state.set(short, { short, kind: null, line: null, status: "abstain", reason: "not a top-level declaration", accepted: null, score: null, margin: null, round: null, pool: 0, ranked: [] }); continue; }
    state.set(short, { short, kind: nameKind(od), line: od.line, given: candidates || [], status: "abstain", reason: "no candidate", accepted: null, score: null, margin: null, round: null, pool: 0, ranked: [] });
  }
  const poolOf = (st) => {
    const pool = new Set([...st.given, ...(fp.unmatchedNew || [])]);
    // the neighbour pass: through every accepted pair, the new-side callees of
    // the image of an old caller and the callers of the image of an old callee
    for (const x of O.callers.get(st.short) || []) { const y = fwd.get(x); if (y && Nn.info.has(y)) for (const t of Nn.info.get(y).refs) pool.add(t); }
    for (const s of O.info.get(st.short).refs) { const t = fwd.get(s); if (t) for (const x of Nn.callers.get(t) || []) pool.add(x); }
    const out = [];
    for (const c of pool) {
      const nd = Nn.decls.get(c);
      if (!nd || !Nn.info.has(c) || nameKind(nd) !== st.kind || claimed.has(c)) continue;
      out.push(c);
    }
    return out;
  };

  for (let round = 1; round <= rounds; round++) {
    const open = [...state.values()].filter((st) => st.kind && st.status !== "accept");
    if (!open.length) break;
    const picks = new Map(); // candidate -> [names picking it this round]
    for (const st of open) {
      const pool = poolOf(st);
      const ranked = pool.map((c) => scoreCandidate(O, Nn, st.short, c, ctx)).sort((a, b) => b.score - a.score || a.line - b.line);
      st.pool = pool.length;
      st.ranked = ranked.slice(0, top);
      st.score = ranked[0]?.score ?? null;
      st.margin = ranked[0] ? +(ranked[0].score - (ranked[1]?.score ?? 0)).toFixed(3) : null;
      if (!ranked.length) { st.reason = "no candidate"; continue; }
      if (ranked[0].score < abs) { st.reason = "score below threshold"; continue; }
      if (ranked[1] && ranked[1].score >= ranked[0].score * (1 - rel)) { st.reason = "runner-up too close"; continue; }
      st.reason = null;
      if (!picks.has(ranked[0].name)) picks.set(ranked[0].name, []);
      picks.get(ranked[0].name).push(st);
    }
    let accepted = 0;
    for (const [cand, sts] of picks) {
      if (sts.length > 1) { for (const st of sts) st.reason = "many-to-one"; continue; }
      const st = sts[0];
      st.status = "accept"; st.accepted = cand; st.round = round; st.reason = null;
      fwd.set(st.short, cand); bwd.set(cand, st.short); claimed.add(cand);
      accepted++;
    }
    if (!accepted) break;
  }
  return names.map(({ short }) => { const { given, ...st } = state.get(short); return st; });
}

// "accept `Xe` 0.91 (callers 3/3, callees 2/4, literals 1/1), runner-up `Yq` 0.12"
export function describeRanking(r) {
  if (!r.ranked.length) return `${r.status} (${r.reason})`;
  const f = (x) => `\`${x.name}\` ${x.score.toFixed(2)} (callers ${x.callers.shared}/${x.callers.of}, callees ${x.callees.shared}/${x.callees.of}, literals ${x.literals.shared}/${x.literals.of})`;
  const [a, b] = r.ranked;
  const head = r.status === "accept" ? `accept (round ${r.round}) ` : `abstain (${r.reason}) `;
  return head + f(a) + (b ? `, runner-up \`${b.name}\` ${b.score.toFixed(2)}` : ", the only candidate of its kind") + ` [pool ${r.pool}]`;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const readJ = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const pairsFile = opt("--pairs"), alignFile = opt("--align"), jsonOut = opt("--json");
  const abs = opt("--abs"), rel = opt("--rel"), rounds = opt("--rounds"), excl = opt("--exclude");
  const [OLD, NEW, FP, ...specs] = argv;
  if (!OLD || !NEW || !FP || !specs.length) {
    console.error("usage: node anchor_candidates.mjs <old.pretty.js> <new.pretty.js> <fp.json> [--pairs <pairs.json>] [--align <align.json>]\n" +
                  "         [--abs <x>] [--rel <x>] [--rounds <n>] [--exclude <new>,<new>...] [--json <out>] <oldShort>[=<cand>,<cand>...]...");
    process.exit(2);
  }
  const fp = readJ(FP);
  const pairs = pairsFile ? readJ(pairsFile).pairs || {} : {};
  const align = alignFile ? readJ(alignFile).pairs || {} : {};
  const names = specs.map((s) => { const [short, c] = s.split("="); return { short, candidates: c ? c.split(",") : null }; });
  const out = rankAnchors(OLD, NEW, fp, names, { pairs, align, exclude: excl ? excl.split(",") : [],
    ...(abs !== undefined ? { abs: Number(abs) } : {}), ...(rel !== undefined ? { rel: Number(rel) } : {}), ...(rounds !== undefined ? { rounds: Number(rounds) } : {}) });
  for (const r of out) console.log(`${r.short} [${r.kind ?? "not a top-level declaration"}]: ${describeRanking(r)}`);
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 2) + "\n");
}
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
