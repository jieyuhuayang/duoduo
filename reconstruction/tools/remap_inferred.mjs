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
// Usage: node remap_inferred.mjs [--pairing <pair_releases.json>] <fpmatch.json> <old_inferred.json> <out.json>
import fs from "node:fs";

const argv = process.argv.slice(2);
const pi = argv.indexOf("--pairing");
let PAIRING = null;
if (pi !== -1) { PAIRING = argv[pi + 1]; argv.splice(pi, 2); }
const [FP, INF, OUT] = argv;
if (!FP || !INF || !OUT) {
  console.error("usage: node remap_inferred.mjs [--pairing <pair_releases.json>] <fpmatch.json> <old_inferred.json> <out.json>");
  process.exit(2);
}
const fp = JSON.parse(fs.readFileSync(FP, "utf8"));
const inferred = JSON.parse(fs.readFileSync(INF, "utf8"));
const pairing = PAIRING ? JSON.parse(fs.readFileSync(PAIRING, "utf8")).pairs : null;

const out = {};
const carried = [], renamed = [], needsAnchor = [], ambiguous = [];
for (const [oldMangled, real] of Object.entries(inferred)) {
  const m = fp.matched[oldMangled];
  if (!m) { needsAnchor.push([oldMangled, real]); continue; }
  if (!m.unique) { ambiguous.push([oldMangled, real, m.new]); continue; }
  out[m.new] = real;
  (m.new === oldMangled ? carried : renamed).push([oldMangled, m.new, real]);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");

for (const [o, n, r] of renamed) console.error(`  remap    ${o} -> ${n}  (${r})`);
for (const [o, , r] of carried) console.error(`  unchanged ${o}          (${r})`);
const proposed = {};
const propose = (o, r) => {
  const p = pairing?.[o];
  if (!p) return "";
  proposed[p.new] = { real: r, old: o, how: p.how, ...(p.score != null ? { score: p.score } : {}), ...(p.overlap != null ? { overlap: p.overlap } : {}) };
  return ` PROPOSED -> ${p.new} (${p.how}${p.score != null ? ` ${p.score}` : ""}${p.overlap != null ? `, overlap ${p.overlap}` : ""})`;
};
for (const [o, r, cands] of ambiguous) console.error(`  AMBIGUOUS ${o} (${r}) -> ${JSON.stringify(cands)} — pick one by hand${propose(o, r)}`);
for (const [o, r] of needsAnchor) console.error(`  RE-ANCHOR ${o} (${r}) — body changed this release; locate it with locate_by_anchor.mjs${propose(o, r)}`);
if (pairing) {
  const PROPOSED = OUT.replace(/\.json$/, "") + ".proposed.json";
  fs.writeFileSync(PROPOSED, JSON.stringify(proposed, null, 2) + "\n");
  console.error(`  proposals for ${Object.keys(proposed).length} of ${ambiguous.length + needsAnchor.length} unresolved entries -> ${PROPOSED} (review each, then merge into ${OUT})`);
}
console.error(`remapped ${Object.keys(out).length}/${Object.keys(inferred).length}` +
  (needsAnchor.length || ambiguous.length ? `  (${needsAnchor.length} need re-anchoring, ${ambiguous.length} ambiguous)` : ""));
