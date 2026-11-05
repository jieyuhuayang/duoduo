// Pair the top-level declarations of two consecutive releases, five layers deep.
//
// Shared by history_chain.mjs (which chains these pairings release by release
// back to the first one) and pair_releases.mjs (which bump.sh runs for the one
// step of a version bump). One implementation, so the chain that was checked
// against the hand-carried v0.8.3 map (125 of 125 agree; after the layered
// rewrite, 723 of 723 at v0.8.6 -> v0.8.7 and 481 of 481 at v0.8.3 -> v0.8.4
// against both releases' inferred maps, VERIFICATION.md 5.2) is the one the
// bump proposes from.
//
// The layers run in order, and each accepts only the pairs that are unique at
// that layer before the next one sees what is left (the drill-down order of
// BinDiff: the most exact matcher first, each later one confined to the
// declarations no earlier one claimed):
//
//   1. identical       fingerprint_match.mjs: the same structural signature,
//                      unique on both sides.
//   2. twin by order   a body several declarations share (`e => X.includes(e)`
//                      twins): the twin inside the window between the nearest
//                      settled neighbours (layer 1, layer 3, and the twins
//                      this layer accepted in an earlier round) wins when it
//                      is the only unclaimed one there; when several new twins
//                      have the same old one as their only candidate, the one
//                      with the narrowest window takes it if that window is
//                      unique, else none does. Accepted pairs shrink the other
//                      twins' candidate sets and narrow their windows, and the
//                      rule is repeated until nothing changes, so the result
//                      does not depend on the order the names are asked in.
//                      Two bodies with the same signature are never paired by
//                      a later layer: a twin layer 2 cannot settle stays
//                      unsettled.
//   3. positional      pair_changes.mjs: a changed declaration between the
//                      same two matched neighbours, when the counts agree.
//   4. assignment      among the old declarations no layer claimed and the
//                      new declarations of one window (the gap between the
//                      same two matched neighbours; a window whose neighbours
//                      are out of order is widened by 400 declarations on each
//                      side), a global minimum-cost assignment instead of a
//                      greedy best-per-name in bundle order: cost 1 - similarity
//                      for every comparable pair (not only the pairs above
//                      `min`), a dummy row and column per declaration at half
//                      the creation factor, solved with the Hungarian
//                      algorithm. So a removal plus an addition costs the
//                      whole factor and a pair is assigned only when its cost
//                      is below that, i.e. similarity above 1 - creation; the
//                      factor is the assignment's cutoff, borrowed from git
//                      range-diff's --creation-factor (which charges the full
//                      factor per dummy; here each dummy carries half so the
//                      factor is the price of one unpaired old plus one
//                      unpaired new declaration). Default 0.6, a parameter.
//                      At the defaults its cutoff 0.4 lies below `min` 0.5, so
//                      it decides which pairs occupy rows and columns in the
//                      assignment but not which are reported: a pair between
//                      the cutoff and `min` is assigned and then refused by
//                      the acceptance rule (abstention "below min"); set below
//                      1 - min it tightens the pairing. Similarity is the weighted
//                      Jaccard of decl_features.mjs over property names,
//                      strings, numbers and globals, or, when either side has
//                      fewer than three features and both carry a relaxed
//                      profile (decl_features.mjs `r`), the relaxed similarity of
//                      relaxed_signature.mjs (mean of the Weisfeiler-Lehman
//                      multiset Jaccard and the normalised-token LCS ratio).
//                      An assigned pair is accepted only when it also passes
//                      the acceptance rule: similarity at least `min`
//                      (`relaxedMin` for a relaxed pair) and leading the
//                      runner-up of both its row and its column by `lead`; a
//                      feature pair whose body grew a lot (Jaccard below `min`
//                      but at least 0.25, overlap coefficient at least 0.75:
//                      most of the smaller side is in the larger) is judged on
//                      the mean of Jaccard and overlap instead, inside a strict
//                      window only, and records the overlap. Family
//                      (code vs data) must agree, arity may differ by one; data
//                      declarations (constants, tables) are not followed.
//   5. moved           the same assignment once more over everything layer 4
//                      left unclaimed on both sides, with no window at all, for
//                      a declaration upstream moved to another module (its
//                      window then holds nothing comparable). Feature
//                      similarity only, at the stricter `movedMin` (default
//                      0.6), the lead rule against every leftover candidate of
//                      the bundle. It runs after every window is solved.
//
// makeStep().resolve(name) returns the old counterpart of a new name as
// { old, how, layer, score?, overlap?, basis?, wl?, lcs? } where how is
// "identical" | "identical (twin by order)" | "positional" | "similar" and
// layer is 1..5; basis is "features" or "relaxed" for a layer-4 or layer-5
// pair. { untraceable } says the walk must stop without meaning the name is
// new: a data declaration, a thin one with no relaxed profile, or a twin no
// layer settled. undefined means no counterpart was found (new code, or a
// rewrite below the thresholds); abstained(name) then gives the best
// candidate, its score and why it was not accepted.
import { declFeatures } from "./decl_features.mjs";
import { relaxedSimilarity } from "./relaxed_signature.mjs";
import fs from "node:fs";

export const W = { p: 1, s: 1.5, n: 0.5, g: 0.5 };
export const CREATION = 0.6;
export const RELAXED_MIN = 0.6;
export const MOVED_MIN = 0.6;
export function score(x, y) {
  let inter = 0, union = 0;
  for (const k of Object.keys(W)) {
    const A = new Set(x[k]), B = new Set(y[k]);
    for (const t of A) { union += W[k]; if (B.has(t)) inter += W[k]; }
    for (const t of B) if (!A.has(t)) union += W[k];
  }
  return union ? inter / union : 0;
}
export function overlap(x, y) {
  let inter = 0, a = 0, b = 0;
  for (const k of Object.keys(W)) {
    const A = new Set(x[k]), B = new Set(y[k]);
    a += A.size * W[k]; b += B.size * W[k];
    for (const t of A) if (B.has(t)) inter += W[k];
  }
  const m = Math.min(a, b);
  return m ? inter / m : 0;
}
export const thin = f => (f.p.length + f.s.length + f.n.length + f.g.length) < 3;
export const family = k => /function|class|module-init/.test(k) ? "code" : "data";

export function loadFeatures(prettyPath) { return declFeatures(fs.readFileSync(prettyPath, "utf8")); }

// Minimum-cost assignment of a square matrix (Hungarian algorithm with
// potentials, O(n^3)); returns rowToCol. Exported for tests.
export function hungarian(cost) {
  const n = cost.length;
  if (!n) return [];
  const INF = Number.POSITIVE_INFINITY;
  const u = new Float64Array(n + 1), v = new Float64Array(n + 1);
  const p = new Int32Array(n + 1), way = new Int32Array(n + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(n + 1).fill(INF);
    const used = new Uint8Array(n + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = INF, j1 = 0;
      for (let j = 1; j <= n; j++) if (!used[j]) {
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const rowToCol = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j]) rowToCol[p[j] - 1] = j - 1;
  return rowToCol;
}

// A step: fp (fingerprint_match output), pairs (pair_changes output), FO/FN
// (decl_features of old and new). Layers 1 to 3 are built once; layer 4 runs
// per window the first time a name of that window is resolved.
export function makeStep({ fp, pairs, FO, FN, min = 0.5, lead = 0.1, creation = CREATION, relaxedMin = RELAXED_MIN, movedMin = MOVED_MIN }) {
  const identical = new Map(), changed = new Map(), twins = new Map();
  for (const [old, m] of Object.entries(fp.matched ?? {})) {
    if (m.unique) identical.set(m.new, old);
    else for (const nu of m.new) (twins.get(nu) ?? twins.set(nu, []).get(nu)).push(old);
  }
  for (const [old, nu] of Object.entries(pairs?.pairs ?? {})) if (!identical.has(nu)) changed.set(nu, old);
  const claimedOld = new Set([...identical.values(), ...changed.values()]);
  const cache = new Map();
  const abstain = new Map();

  function windowOf(name) {
    const f = FN.decls[name];
    if (!f) return null;
    const order = FN.order, idx = f.i;
    const oldIdx = n => { const o = identical.get(n) ?? changed.get(n) ?? twinOf.get(n); return o && FO.decls[o] ? FO.decls[o].i : null; };
    let lo = null, hi = null;
    for (let j = idx - 1; j >= 0 && lo === null; j--) lo = oldIdx(order[j]);
    for (let j = idx + 1; j < order.length && hi === null; j++) hi = oldIdx(order[j]);
    if (lo === null) lo = -1;
    if (hi === null) hi = FO.order.length;
    const strict = hi > lo;
    if (!strict) { lo = Math.max(-1, lo - 400); hi = Math.min(FO.order.length, hi + 400); }
    return { lo, hi, strict };
  }

  // layer 2, to a fixpoint: a twin is accepted when it is the only unclaimed
  // candidate inside its window; when several new twins have the same old one
  // as their only candidate, the one whose window is the narrowest takes it
  // (a unique narrowest window: the best-anchored position), else none does
  const twinOf = new Map();
  {
    const windows = new Map();
    let progress = true;
    while (progress) {
      progress = false;
      // the windows of the twins still open, between the nearest neighbours
      // any layer settled so far (layer 1, layer 3, and the twins accepted in
      // the earlier rounds): a settled twin narrows its neighbours' windows
      for (const name of twins.keys()) if (!twinOf.has(name)) { const w = windowOf(name); if (w) windows.set(name, w); }
      const want = new Map(); // old -> [new...]
      for (const [name, w] of windows) {
        if (twinOf.has(name)) continue;
        const inside = twins.get(name).filter(o => !claimedOld.has(o) && FO.decls[o] && FO.decls[o].i > w.lo && FO.decls[o].i < w.hi);
        if (inside.length === 1) (want.get(inside[0]) ?? want.set(inside[0], []).get(inside[0])).push(name);
      }
      for (const [old, names] of want) {
        let pick = names[0];
        if (names.length > 1) {
          const width = n => { const w = windows.get(n); return (w.strict ? 0 : 1e6) + (w.hi - w.lo); };
          names.sort((x, y) => width(x) - width(y));
          if (width(names[0]) === width(names[1])) continue;
          pick = names[0];
        }
        twinOf.set(pick, old); claimedOld.add(old); progress = true;
      }
    }
  }

  // layer 4: one assignment per window
  const solved = new Map(); // window key -> true
  const assigned = new Map(); // new -> result
  const comparable = (f, of) => family(of.kind) === family(f.kind) && !(f.arity != null && of.arity != null && Math.abs(f.arity - of.arity) > 1);
  const sameBody = (n, o) => twins.get(n)?.includes(o);
  function similarity(f, of) {
    if (thin(f) || thin(of)) {
      if (!f.r || !of.r) return null;
      const r = relaxedSimilarity(f.r, of.r);
      return { sim: r.sim, basis: "relaxed", wl: r.wl, lcs: r.lcs };
    }
    return { sim: score(f, of), overlap: overlap(f, of), basis: "features" };
  }
  // the assignment of `rows` (old names) to `cols` (new names); `w.strict`
  // enables the overlap rule, `floor` is the minimum of a feature pair, and
  // `basisOnly` restricts the basis (layer 5: features only)
  function assign(rows, cols, { strict, floor, layer, basisOnly }) {
    const R = rows.length, C = cols.length;
    if (!R || !C) { for (const n of cols) abstain.set(n, { reason: "no comparable candidate" }); return; }
    const S = Array.from({ length: R }, () => new Array(C).fill(null));
    for (let i = 0; i < R; i++) {
      const of = FO.decls[rows[i]];
      for (let j = 0; j < C; j++) {
        const f = FN.decls[cols[j]];
        if (!comparable(f, of) || sameBody(cols[j], rows[i])) continue;
        const s = similarity(f, of);
        if (s && (!basisOnly || s.basis === basisOnly)) S[i][j] = s;
      }
    }
    // the score a pair is judged by: the feature Jaccard, or, for a feature
    // pair below `floor` whose overlap coefficient qualifies it (strict window,
    // overlap >= 0.75, Jaccard >= 0.25), the mean of Jaccard and overlap; a
    // relaxed pair's relaxed similarity
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
      const s = S[i][j];
      if (!s) continue;
      s.eff = s.basis === "features" && s.sim < floor && strict && s.overlap >= 0.75 && s.sim >= 0.25 ? (s.sim + s.overlap) / 2 : s.sim;
      s.byOverlap = s.eff !== s.sim;
    }
    const feasible = s => s && s.eff >= (s.basis === "relaxed" ? relaxedMin : floor);
    // the cost matrix holds every comparable pair, not only the feasible ones:
    // cost 1 - score, and a dummy per declaration at creation / 2, so a
    // removal plus an addition costs `creation` and a pair is assigned only
    // when its cost is below that (score above 1 - creation; the creation
    // factor is the assignment's cutoff, min and lead decide acceptance below)
    const BIG = 1e6, N = R + C;
    const cost = Array.from({ length: N }, () => new Array(N).fill(BIG));
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (S[i][j]) cost[i][j] = 1 - S[i][j].eff;
    for (let i = 0; i < R; i++) cost[i][C + i] = creation / 2;
    for (let j = 0; j < C; j++) cost[R + j][j] = creation / 2;
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) cost[R + j][C + i] = 0;
    const rowToCol = hungarian(cost);
    // the acceptance rule: the score reaches the floor and leads the runner-up
    // of its row and of its column by `lead` (or has none)
    const rowRunner = (i, j) => { let b = null; for (let jj = 0; jj < C; jj++) if (jj !== j && S[i][jj] && (b === null || S[i][jj].eff > b)) b = S[i][jj].eff; return b; };
    const colRunner = (i, j) => { let b = null; for (let ii = 0; ii < R; ii++) if (ii !== i && S[ii][j] && (b === null || S[ii][j].eff > b)) b = S[ii][j].eff; return b; };
    const colBest = new Array(C).fill(null);
    for (let j = 0; j < C; j++) for (let i = 0; i < R; i++) if (S[i][j] && (colBest[j] === null || S[i][j].eff > colBest[j].eff)) colBest[j] = { i, ...S[i][j] };
    const record = s => ({ score: +s.sim.toFixed(3), basis: s.basis, ...(s.byOverlap ? { overlap: +s.overlap.toFixed(3) } : {}), ...(s.basis === "relaxed" ? { wl: s.wl, lcs: s.lcs } : {}) });
    for (let i = 0; i < R; i++) {
      const j = rowToCol[i];
      if (j < 0 || j >= C) continue;
      const s = S[i][j];
      if (!feasible(s)) { abstain.set(cols[j], { best: rows[i], ...record(s), layer, reason: "below min" }); continue; }
      const runner = Math.max(rowRunner(i, j) ?? -1, colRunner(i, j) ?? -1);
      const leads = runner < 0 || s.eff - runner >= lead;
      if (leads) { assigned.set(cols[j], { old: rows[i], how: "similar", layer, ...record(s) }); claimedOld.add(rows[i]); abstain.delete(cols[j]); }
      else abstain.set(cols[j], { best: rows[i], ...record(s), layer, reason: `runner-up too close (${(+runner).toFixed(3)})` });
    }
    for (let j = 0; j < C; j++) if (!assigned.has(cols[j]) && !abstain.has(cols[j])) {
      const b = colBest[j];
      abstain.set(cols[j], b ? { best: rows[b.i], ...record(b), layer, reason: feasible(b) ? "assigned elsewhere" : "below min" } : { layer, reason: "no comparable candidate" });
    }
  }
  const followable = n => { const f = FN.decls[n]; return f && family(f.kind) !== "data" && !(thin(f) && !f.r); };
  const unclaimedNew = n => !identical.has(n) && !changed.has(n) && !twinOf.has(n) && !assigned.has(n);
  function solveWindow(name) {
    const w = windowOf(name);
    if (!w) return;
    const key = `${w.lo}:${w.hi}:${w.strict}`;
    if (solved.has(key)) return;
    solved.set(key, true);
    // the new names of this window still unclaimed, in bundle order
    const cols = [];
    for (const n of FN.order) {
      if (!unclaimedNew(n) || !followable(n)) continue;
      const wn = windowOf(n);
      if (wn && wn.lo === w.lo && wn.hi === w.hi && wn.strict === w.strict) cols.push(n);
    }
    const rows = [];
    for (let j = w.lo + 1; j < w.hi; j++) {
      const on = FO.order[j], of = FO.decls[on];
      if (claimedOld.has(on) || !of || family(of.kind) === "data") continue;
      rows.push(on);
    }
    assign(rows, cols, { strict: w.strict, floor: min, layer: 4 });
  }
  let movedDone = false;
  function solveMoved() {
    if (movedDone) return;
    movedDone = true;
    for (const n of FN.order) if (unclaimedNew(n) && followable(n)) solveWindow(n);
    const cols = FN.order.filter(n => unclaimedNew(n) && followable(n) && !thin(FN.decls[n]));
    const rows = FO.order.filter(o => !claimedOld.has(o) && FO.decls[o] && family(FO.decls[o].kind) !== "data" && !thin(FO.decls[o]));
    const before = new Map(cols.map(n => [n, abstain.get(n)]));
    assign(rows, cols, { strict: false, floor: movedMin, layer: 5, basisOnly: "features" });
    // the window's reason stays when it named a candidate and layer 5 did not
    for (const [n, a] of before) if (a?.best && !assigned.has(n) && !abstain.get(n)?.best) abstain.set(n, a);
  }

  // the old counterpart of a new name, or undefined; `untraceable` says why a
  // walk may stop here without meaning the name is new
  function resolve(name) {
    if (cache.has(name)) return cache.get(name);
    let r;
    let old = identical.get(name);
    if (old !== undefined) r = { old, how: "identical", layer: 1 };
    else if ((old = twinOf.get(name)) !== undefined) r = { old, how: "identical (twin by order)", layer: 2 };
    else if ((old = changed.get(name)) !== undefined) r = { old, how: "positional", layer: 3 };
    else {
      const f = FN.decls[name];
      if (!f || family(f.kind) === "data" || (thin(f) && !f.r)) r = { untraceable: `${f ? f.kind : "declaration"} with too few features to follow` };
      else {
        solveWindow(name);
        if (!assigned.has(name)) solveMoved();
        r = assigned.get(name);
        // a twin no layer settled is not new code: the walk stops without a birth
        if (!r && twins.has(name)) r = { untraceable: `a body shared with ${twins.get(name).length} old declaration${twins.get(name).length > 1 ? "s" : ""}, none settled by position` };
      }
    }
    cache.set(name, r);
    return r;
  }
  const abstained = name => abstain.get(name);
  return { identical, changed, twins, twinOf, claimedOld, resolve, windowOf, abstained };
}
