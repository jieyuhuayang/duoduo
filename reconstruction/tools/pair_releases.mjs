// The five-layer pairing of two releases, for one version bump.
//
// bump.sh carries inferred names across on structural identity alone
// (remap_inferred.mjs) and reports the rest as RE-ANCHOR. This writes the
// full old -> new pairing of release_pairing.mjs (1 identical, 2 twin by
// order, 3 positional, 4 global assignment per window on feature or relaxed
// similarity, 5 the same assignment without a window for moved code) so
// remap_inferred.mjs can propose a new short name for each RE-ANCHOR
// entry, with how it was paired. A proposal is a candidate for review, not a
// carried name: verify_inferred.mjs check still decides whether the name sits
// on code of its shape.
//
// Usage: node pair_releases.mjs <old.pretty.js> <new.pretty.js> <fp.json> <pairs.json> <out.json>
//        [--min 0.5] [--lead 0.1] [--creation 0.6] [--relaxed-min 0.6] [--moved-min 0.6]
// Output: { counts, pairs: {<oldMangled>: {new, how, layer, score?, overlap?, basis?, wl?, lcs?}},
//           abstained: {<newMangled>: {best?, score?, basis?, reason}}, unpairedNew: [...] }
// `abstained` lists every new code declaration layer 4 looked at and left
// unpaired, with the best candidate and why it was not accepted (runner-up
// too close, below min, assigned elsewhere, no comparable candidate).
import fs from "node:fs";
import { CREATION, MOVED_MIN, RELAXED_MIN, makeStep } from "./release_pairing.mjs";
import { declFeatures } from "./decl_features.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const MIN = Number(opt("--min", 0.5)), LEAD = Number(opt("--lead", 0.1));
const CREATE = Number(opt("--creation", CREATION)), RMIN = Number(opt("--relaxed-min", RELAXED_MIN)), MMIN = Number(opt("--moved-min", MOVED_MIN));
const [OLD, NEW, FP, PAIRS, OUT] = argv;
if (!OLD || !NEW || !FP || !PAIRS || !OUT) { console.error("usage: node pair_releases.mjs <old.pretty.js> <new.pretty.js> <fp.json> <pairs.json> <out.json> [--min 0.5] [--lead 0.1] [--creation 0.6] [--relaxed-min 0.6] [--moved-min 0.6]"); process.exit(2); }

// an unreadable input is a one-line error, exit 2, like a usage error
const read = (p, parse) => { try { const t = fs.readFileSync(p, "utf8"); return parse ? JSON.parse(t) : t; } catch (e) { console.error(`${p}: ${e.message}`); process.exit(2); } };
const fp = read(FP, true);
const pairs = read(PAIRS, true);
const FO = declFeatures(read(OLD)), FN = declFeatures(read(NEW));
const step = makeStep({ fp, pairs, FO, FN, min: MIN, lead: LEAD, creation: CREATE, relaxedMin: RMIN, movedMin: MMIN });

const old = {}, unpairedNew = [], abstained = {};
const counts = { identical: 0, twin: 0, positional: 0, similar: 0, relaxed: 0, moved: 0, untraceable: 0, unpaired: 0 };
// bundle order: layers 1 to 3 are fixed before any name is asked; layer 4 solves
// each window once, when its first name comes up, so a widened window that
// overlaps a later one is settled first
for (const name of FN.order) {
  const r = step.resolve(name);
  if (!r) { unpairedNew.push(name); counts.unpaired++; const a = step.abstained(name); if (a) abstained[name] = a; continue; }
  if (r.untraceable) { counts.untraceable++; continue; }
  const { old: o, ...rest } = r;
  old[o] = { new: name, ...rest };
  if (r.layer === 5) counts.moved++;
  else if (r.basis === "relaxed") counts.relaxed++;
  else counts[r.how === "identical" ? "identical" : r.how.startsWith("identical") ? "twin" : r.how]++;
}
fs.writeFileSync(OUT, JSON.stringify({ generatedBy: "tools/pair_releases.mjs", old: OLD, new: NEW, params: { min: MIN, lead: LEAD, creation: CREATE, relaxedMin: RMIN, movedMin: MMIN }, counts, pairs: old, abstained, unpairedNew }, null, 1) + "\n");
console.log(`pairing: ${Object.keys(old).length} old declarations paired (identical ${counts.identical}, twin ${counts.twin}, positional ${counts.positional}, similar ${counts.similar}, relaxed ${counts.relaxed}, moved ${counts.moved}); new: ${counts.untraceable} untraceable, ${counts.unpaired} unpaired (${Object.keys(abstained).length} with an abstention reason) -> ${OUT}`);
