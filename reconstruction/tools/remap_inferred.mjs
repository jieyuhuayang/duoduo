// Remap the RE-inferred name map (mangled -> real) across a version bump.
//
// Why this exists: esbuild re-mangles every build, so a v(N) inferred map keyed
// by short names is not just stale against v(N+1) — it is DANGEROUS. A short
// name usually still exists in the new bundle while pointing at a completely
// different function, so blindly reusing the map silently mislabels code.
// (Real case, v0.6.1 -> v0.6.2: `nX` was rehydrateSessionState in v0.6.1 and is
// the trace-level logger in v0.6.2.)
//
// Fix: structurally fingerprint both bundles (fingerprint_match.mjs), then carry
// each inferred name across on its function's structural identity, not its name.
// Entries whose function actually CHANGED have no fingerprint match and are
// reported for manual re-anchoring via locate_by_anchor.mjs.
//
// With --pairing <pair_releases.json> (the three-layer pairing of the two
// releases: twins resolved by order, positional pairs, feature similarity),
// every RE-ANCHOR and AMBIGUOUS entry gets a PROPOSED new short name, printed
// with how it was paired and written to <out>.proposed.json. Proposals are not
// carried: the reviewer merges them, and verify_inferred.mjs check then judges
// each by shape. On the v0.8.3 -> v0.8.4 replay the proposals agreed with the
// hand-made re-anchoring for every entry the pairing could reach (see
// reconstruction/README.md, 已实现).
//
// With --align <align_releases.json> (the in-order alignment of every top-level
// statement of the two releases), an AMBIGUOUS entry -- a body several
// declarations share -- is carried when the alignment pairs it, anchored, with
// one of its fingerprint candidates: twins pair by their position among their
// neighbours. A uniquely fingerprinted entry the alignment pairs, anchored,
// with a DIFFERENT declaration is a CONFLICT and is not carried; the two
// methods disagree and a person decides. A RE-ANCHOR entry the alignment
// still pairs (its normalised text is unchanged although its structural
// signature is not) gets that pair as a proposal. Replayed on v0.8.4 -> v0.8.5
// the alignment carried all 31 AMBIGUOUS entries as they were confirmed by
// hand; on v0.8.1 -> v0.8.2, v0.8.2 -> v0.8.3 and v0.8.3 -> v0.8.4 every
// anchored pair of an inferred name agreed with the committed map (505 names).
//
// Usage: node remap_inferred.mjs [--pairing <pair_releases.json>] [--align <align_releases.json>] <fpmatch.json> <old_inferred.json> <out.json>
import fs from "node:fs";

const argv = process.argv.slice(2);
const pi = argv.indexOf("--pairing");
let PAIRING = null;
if (pi !== -1) { PAIRING = argv[pi + 1]; argv.splice(pi, 2); }
const ai = argv.indexOf("--align");
let ALIGN = null;
if (ai !== -1) { ALIGN = argv[ai + 1]; argv.splice(ai, 2); }
const [FP, INF, OUT] = argv;
if (!FP || !INF || !OUT) {
  console.error("usage: node remap_inferred.mjs [--pairing <pair_releases.json>] [--align <align_releases.json>] <fpmatch.json> <old_inferred.json> <out.json>");
  process.exit(2);
}
const fp = JSON.parse(fs.readFileSync(FP, "utf8"));
const inferred = JSON.parse(fs.readFileSync(INF, "utf8"));
const pairing = PAIRING ? JSON.parse(fs.readFileSync(PAIRING, "utf8")).pairs : null;
const align = ALIGN ? JSON.parse(fs.readFileSync(ALIGN, "utf8")).pairs : null;
const anchoredPair = (o) => (align?.[o]?.anchored ? align[o].new : null);

// two old names carried onto one new declaration would silently drop one of them
const out = new Proxy({}, { set(o, k, v) { if (Object.hasOwn(o, k) && o[k] !== v) throw new Error(`${k} would carry both ${o[k]} and ${v}`); o[k] = v; return true; } });
const carried = [], renamed = [], needsAnchor = [], ambiguous = [], aligned = [], conflicts = [];
for (const [oldMangled, real] of Object.entries(inferred)) {
  const m = fp.matched[oldMangled];
  const al = anchoredPair(oldMangled);
  if (!m) { needsAnchor.push([oldMangled, real]); continue; }
  if (!m.unique) {
    if (al && m.new.includes(al)) { out[al] = real; aligned.push([oldMangled, al, real, m.new]); continue; }
    ambiguous.push([oldMangled, real, m.new]); continue;
  }
  if (al && al !== m.new) { conflicts.push([oldMangled, real, m.new, al]); continue; }
  out[m.new] = real;
  (m.new === oldMangled ? carried : renamed).push([oldMangled, m.new, real]);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

for (const [o, n, r] of renamed) console.error(`  remap    ${o} -> ${n}  (${r})`);
for (const [o, n, r, c] of aligned) console.error(`  aligned  ${o} -> ${n}  (${r}; twin body, candidates ${JSON.stringify(c)}, picked by statement alignment)`);
for (const [o, r, f, a] of conflicts) console.error(`  CONFLICT ${o} (${r}) -> fingerprint ${f}, statement alignment ${a} — not carried; read both bodies and pick one by hand`);
for (const [o, , r] of carried) console.error(`  unchanged ${o}          (${r})`);
const proposed = {};
const propose = (o, r) => {
  const p = pairing?.[o];
  if (!p) return "";
  proposed[p.new] = { real: r, old: o, how: p.how, ...(p.score != null ? { score: p.score } : {}), ...(p.overlap != null ? { overlap: p.overlap } : {}) };
  return ` PROPOSED -> ${p.new} (${p.how}${p.score != null ? ` ${p.score}` : ""}${p.overlap != null ? `, overlap ${p.overlap}` : ""})`;
};
for (const [o, r] of conflicts) propose(o, r);
for (const [o, r, cands] of ambiguous) console.error(`  AMBIGUOUS ${o} (${r}) -> ${JSON.stringify(cands)} — pick one by hand${propose(o, r)}`);
for (const [o, r] of needsAnchor) {
  const al = anchoredPair(o);
  console.error(`  RE-ANCHOR ${o} (${r}) — body changed this release; locate it with locate_by_anchor.mjs${propose(o, r)}${al ? ` ALIGNED -> ${al} (same normalised text)` : ""}`);
}
if (pairing) {
  const PROPOSED = OUT.replace(/\.json$/, "") + ".proposed.json";
  fs.writeFileSync(PROPOSED, JSON.stringify(proposed, null, 2) + "\n");
  console.error(`  proposals for ${Object.keys(proposed).length} of ${ambiguous.length + needsAnchor.length + conflicts.length} unresolved entries -> ${PROPOSED} (review each, then merge into ${OUT})`);
}
console.error(`remapped ${Object.keys(out).length}/${Object.keys(inferred).length}` +
  (aligned.length ? `  (${aligned.length} twin bodies by statement alignment)` : "") +
  (needsAnchor.length || ambiguous.length || conflicts.length ? `  (${needsAnchor.length} need re-anchoring, ${ambiguous.length} ambiguous, ${conflicts.length} conflicts)` : ""));
