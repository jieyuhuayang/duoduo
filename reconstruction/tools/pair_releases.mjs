// The three-layer pairing of two releases, for one version bump.
//
// bump.sh carries inferred names across on structural identity alone
// (remap_inferred.mjs) and reports the rest as RE-ANCHOR. This writes the
// full old -> new pairing of release_pairing.mjs (identical, twin by order,
// positional, feature similarity) so remap_inferred.mjs can propose a new
// short name for each RE-ANCHOR entry, with how it was paired. A proposal is
// a candidate for review, not a carried name: verify_inferred.mjs check still
// decides whether the name sits on code of its shape.
//
// Usage: node pair_releases.mjs <old.pretty.js> <new.pretty.js> <fp.json> <pairs.json> <out.json> [--min 0.5] [--lead 0.1]
// Output: { old: {<oldMangled>: {new, how, score?, overlap?}}, unpairedNew: [...], counts }
import fs from "node:fs";
import { loadFeatures, makeStep } from "./release_pairing.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const MIN = Number(opt("--min", 0.5)), LEAD = Number(opt("--lead", 0.1));
const [OLD, NEW, FP, PAIRS, OUT] = argv;
if (!OLD || !NEW || !FP || !PAIRS || !OUT) { console.error("usage: node pair_releases.mjs <old.pretty.js> <new.pretty.js> <fp.json> <pairs.json> <out.json> [--min 0.5] [--lead 0.1]"); process.exit(2); }

const fp = JSON.parse(fs.readFileSync(FP, "utf8"));
const pairs = JSON.parse(fs.readFileSync(PAIRS, "utf8"));
const FO = loadFeatures(OLD), FN = loadFeatures(NEW);
const step = makeStep({ fp, pairs, FO, FN, min: MIN, lead: LEAD });

const old = {}, unpairedNew = [];
const counts = { identical: 0, twin: 0, positional: 0, similar: 0, untraceable: 0, unpaired: 0 };
// resolve in bundle order so a twin or similar claim is made where the window is tightest
for (const name of FN.order) {
  const r = step.resolve(name);
  if (!r) { unpairedNew.push(name); counts.unpaired++; continue; }
  if (r.untraceable) { counts.untraceable++; continue; }
  old[r.old] = { new: name, how: r.how, ...(r.score != null ? { score: r.score } : {}), ...(r.overlap != null ? { overlap: r.overlap } : {}) };
  counts[r.how === "identical" ? "identical" : r.how.startsWith("identical") ? "twin" : r.how]++;
}
fs.writeFileSync(OUT, JSON.stringify({ generatedBy: "tools/pair_releases.mjs", old: OLD, new: NEW, counts, pairs: old, unpairedNew }, null, 1) + "\n");
console.log(`pairing: ${Object.keys(old).length} old declarations paired (identical ${counts.identical}, twin ${counts.twin}, positional ${counts.positional}, similar ${counts.similar}); new: ${counts.untraceable} untraceable, ${counts.unpaired} unpaired -> ${OUT}`);
