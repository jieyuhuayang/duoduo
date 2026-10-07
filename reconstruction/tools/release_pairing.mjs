// Pair the top-level declarations of two consecutive releases, three layers deep.
//
// Shared by history_chain.mjs (which chains these pairings release by release
// back to the first one) and pair_releases.mjs (which bump.sh runs for the one
// step of a version bump). One implementation, so the chain that was checked
// against the hand-carried v0.8.3 map (125 of 125 agree) is the one the bump
// proposes from.
//
//   1. identical body   fingerprint_match.mjs: the same structural signature,
//                       unique on both sides. A body several declarations share
//                       (`e => X.includes(e)` twins) is resolved by order: the
//                       twin inside the window wins when it is the only one there.
//   2. positional       pair_changes.mjs: a changed declaration between the
//                       same two matched neighbours, when the counts agree.
//   3. feature similarity  decl_features.mjs: among the old declarations no
//                       layer claimed, inside the window between the nearest
//                       matched neighbours, the best weighted Jaccard over
//                       property names, strings, numbers and globals wins when
//                       it reaches `min` and leads the runner-up by `lead`; a
//                       body that grew a lot is accepted on the overlap
//                       coefficient instead (most of the smaller side is in the
//                       larger), inside a strict window only. Arity may differ
//                       by one. Declarations with fewer than three features
//                       cannot be followed this way.
//
// pairStep() returns the pairing for one step as Map new -> { old, how, score?, overlap? }
// where how is "identical" | "identical (twin by order)" | "positional" | "similar".
import { declFeatures } from "./decl_features.mjs";
import fs from "node:fs";

export const W = { p: 1, s: 1.5, n: 0.5, g: 0.5 };
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

// A step: fp (fingerprint_match output), pairs (pair_changes output), FO/FN
// (decl_features of old and new). Builds the layer-1/2 maps once; layer 3 and
// the twin resolution run lazily per new name through resolve().
export function makeStep({ fp, pairs, FO, FN, min = 0.5, lead = 0.1 }) {
  const identical = new Map(), changed = new Map(), twins = new Map();
  for (const [old, m] of Object.entries(fp.matched ?? {})) {
    if (m.unique) identical.set(m.new, old);
    else for (const nu of m.new) (twins.get(nu) ?? twins.set(nu, []).get(nu)).push(old);
  }
  for (const [old, nu] of Object.entries(pairs?.pairs ?? {})) if (!identical.has(nu)) changed.set(nu, old);
  const claimedOld = new Set([...identical.values(), ...changed.values()]);
  const cache = new Map();

  function windowOf(name) {
    const f = FN.decls[name];
    if (!f) return null;
    const order = FN.order, idx = f.i;
    const oldIdx = n => { const o = identical.get(n) ?? changed.get(n); return o && FO.decls[o] ? FO.decls[o].i : null; };
    let lo = null, hi = null;
    for (let j = idx - 1; j >= 0 && lo === null; j--) lo = oldIdx(order[j]);
    for (let j = idx + 1; j < order.length && hi === null; j++) hi = oldIdx(order[j]);
    if (lo === null) lo = -1;
    if (hi === null) hi = FO.order.length;
    const strict = hi > lo;
    if (!strict) { lo = Math.max(-1, lo - 400); hi = Math.min(FO.order.length, hi + 400); }
    return { lo, hi, strict };
  }
  function twin(name) {
    const cands = twins.get(name);
    if (!cands) return undefined;
    const w = windowOf(name);
    if (!w) return undefined;
    const inside = cands.filter(o => !claimedOld.has(o) && FO.decls[o] && FO.decls[o].i > w.lo && FO.decls[o].i < w.hi);
    return inside.length === 1 ? inside[0] : undefined;
  }
  function similar(name) {
    const f = FN.decls[name];
    if (!f || thin(f) || family(f.kind) === "data") return undefined;
    const w = windowOf(name);
    const scored = [];
    for (let j = w.lo + 1; j < w.hi; j++) {
      const on = FO.order[j], of = FO.decls[on];
      if (claimedOld.has(on) || !of || thin(of)) continue;
      if (family(of.kind) !== family(f.kind)) continue;
      if (f.arity != null && of.arity != null && Math.abs(f.arity - of.arity) > 1) continue;
      scored.push([score(f, of), on, overlap(f, of)]);
    }
    scored.sort((x, y) => y[0] - x[0]);
    const leads = scored.length === 1 || (scored.length > 1 && scored[0][0] - scored[1][0] >= lead);
    if (scored.length && scored[0][0] >= min && leads) return { old: scored[0][1], score: +scored[0][0].toFixed(3) };
    if (scored.length && w.strict && scored[0][2] >= 0.75 && scored[0][0] >= 0.25 && leads) return { old: scored[0][1], score: +scored[0][0].toFixed(3), overlap: +scored[0][2].toFixed(3) };
    return undefined;
  }
  // the old counterpart of a new name, or undefined; `untraceable` says why a
  // walk may stop here without meaning the name is new
  function resolve(name) {
    if (cache.has(name)) return cache.get(name);
    let r;
    let old = identical.get(name);
    if (old !== undefined) r = { old, how: "identical" };
    else if ((old = changed.get(name)) !== undefined) r = { old, how: "positional" };
    else if ((old = twin(name)) !== undefined) { r = { old, how: "identical (twin by order)" }; claimedOld.add(old); }
    else {
      const f = FN.decls[name];
      if (!f || thin(f) || family(f.kind) === "data") r = { untraceable: `${f ? f.kind : "declaration"} with too few features to follow` };
      else { const s = similar(name); if (s) { r = { ...s, how: "similar" }; claimedOld.add(s.old); } }
    }
    cache.set(name, r);
    return r;
  }
  return { identical, changed, twins, claimedOld, resolve, windowOf };
}
