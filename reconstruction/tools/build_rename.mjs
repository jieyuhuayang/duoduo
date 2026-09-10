// Build a mangled->original rename map for FIRST-PARTY duoduo symbols only.
//
// Sources, in order of authority:
//   1. export blocks (export_blocks.mjs) — esbuild emits one __export block per
//      source module, so the block IS the module. A name is first-party iff its
//      module is ours.
//   2. the bundle's own top-level `export { local as Name }` — the entry
//      module's surface, first-party by construction.
//   3. RE-inferred internal (non-exported) function names, hand-derived.
//
// WHY THE MODULE, NOT THE NAME. This tool used to classify each name with a
// ~60-word keyword allowlist. A per-name heuristic cannot see module
// boundaries, and it failed in both directions on v0.8.1:
//   - missed 8 first-party symbols that live in our own modules but match no
//     keyword (diffStreamingConfigSignature, detectInProcessBreak,
//     mapItemCompletedToExecEvent, findDeadAllowedToolEntries, ...). They kept
//     mangled names, never reached first-party/, and — once swept into the
//     accepted-vendor baseline — could never trip the gate again.
//   - the failure mode is structural, not a missing word: the entire Grok
//     module exports only `GROK_ACP_*` constants (that is how v0.7.1 lost 19
//     symbols silently), and `pi` cannot be a substring rule because it matches
//     `pipeline` and `api`.
// Deciding per module also fixes cross-module duplicates: daemon has 1001 block
// names but 728 distinct ones (zod exports `bigint`/`date`/`string` from
// several modules), and a flat name->mangled map silently keeps the last
// writer.
//
// THE GATE. A block matching neither the vendor nor the first-party list stops
// the build. That is one decision per new upstream module instead of N unknown
// names, and it is the check a new subsystem trips.
//
// Usage: node build_rename.mjs <blocks.json> <modules.json> <inferred.json> <out.json>
import fs from "node:fs";

const [BLOCKS, MODULES, INFERRED, OUT] = process.argv.slice(2);
if (!BLOCKS || !MODULES || !OUT) {
  console.error("usage: node build_rename.mjs <blocks.json> <modules.json> <inferred.json> <out.json>");
  process.exit(2);
}

const blocksReport = JSON.parse(fs.readFileSync(BLOCKS, "utf8"));
const modules = JSON.parse(fs.readFileSync(MODULES, "utf8"));
const inferred = INFERRED && fs.existsSync(INFERRED) ? JSON.parse(fs.readFileSync(INFERRED, "utf8")) : {};

// A block matches a record when 2 of the record's 3 marker names are present.
// Markers are original export names, which survive re-mangling; block indexes
// and mangled names do not.
function matches(block, record) {
  const have = new Set(block.names);
  const hit = record.marker.filter(n => have.has(n)).length;
  return hit >= Math.min(2, record.marker.length);
}
function classify(block) {
  for (const r of modules.firstParty || []) if (matches(block, r)) return { kind: "firstParty", note: r.note };
  for (const r of modules.vendor || []) if (matches(block, r)) return { kind: "vendor", note: r.note };
  return { kind: "unknown" };
}

const unknown = [];
const fpBlocks = [], vendorBlocks = [];
for (const b of blocksReport.blocks) {
  const c = classify(b);
  if (c.kind === "firstParty") fpBlocks.push({ ...b, note: c.note });
  else if (c.kind === "vendor") vendorBlocks.push({ ...b, note: c.note });
  else unknown.push(b);
}

if (unknown.length) {
  console.error(`\nMODULE GATE FAILED: ${unknown.length} export block(s) in ${blocksReport.bundle} match no record in ${MODULES}.`);
  console.error(`Each block is one source module. Decide what it is, then add a record`);
  console.error(`(marker = 3 of its names) to "firstParty" or "vendor".\n`);
  for (const b of unknown) {
    console.error(`  block @ line ${b.line}  (${b.count} names)`);
    console.error(`    marker: ${JSON.stringify(b.marker)}`);
    console.error(`    names : ${b.names.slice(0, 20).join(", ")}${b.names.length > 20 ? `, ... +${b.names.length - 20}` : ""}`);
  }
  console.error(`\nThis is the check a new upstream subsystem trips. Skipping it is how a`);
  console.error(`subsystem goes missing from the reconstruction without anything failing.\n`);
  process.exit(1);
}

// A record that matches nothing is churn, not an error — but say so, because a
// silently-unused record is how a stale baseline hides a renamed module.
for (const [kind, list] of [["firstParty", modules.firstParty || []], ["vendor", modules.vendor || []]]) {
  for (const r of list) {
    if (!blocksReport.blocks.some(b => matches(b, r))) {
      console.error(`  note: ${kind} record ${JSON.stringify(r.marker)} ("${r.note}") matched no block (module churn)`);
    }
  }
}

const map = {};        // mangled -> original
const collisions = [];
function put(orig, mangled, src) {
  if (map[mangled] && map[mangled] !== orig) { collisions.push([mangled, map[mangled], orig, src]); return; }
  map[mangled] = orig;
}

let fromBlocks = 0;
for (const b of fpBlocks) {
  for (let i = 0; i < b.names.length; i++) { put(b.names[i], b.mangled[i], "block"); fromBlocks++; }
}
let fromEntry = 0;
for (const [orig, mangled] of Object.entries(blocksReport.entryExports || {})) {
  if (!map[mangled]) fromEntry++;
  put(orig, mangled, "entry");
}
// RE-inferred internal names never override an authoritative export name.
let inferredAdded = 0;
for (const [mangled, orig] of Object.entries(inferred)) {
  if (map[mangled]) continue;
  map[mangled] = orig; inferredAdded++;
}

// Target names must be unique: esbuild sometimes exports one local under
// several names, and an inferred name can clash with an export.
const usedTargets = new Map();
const finalMap = {};
for (const [mangled, orig] of Object.entries(map)) {
  const c = usedTargets.get(orig) || 0;
  finalMap[mangled] = c > 0 ? `${orig}$${mangled}` : orig;
  usedTargets.set(orig, c + 1);
}

fs.writeFileSync(OUT, JSON.stringify(finalMap, null, 2));

const stats = {
  bundle: blocksReport.bundle,
  blocks: blocksReport.blocks.length,
  firstPartyBlocks: fpBlocks.length,
  vendorBlocks: vendorBlocks.length,
  namesFromBlocks: fromBlocks,
  namesFromEntryExports: fromEntry,
  inferredAdded,
  renameEntries: Object.keys(finalMap).length,
  collisionsSkipped: collisions.length,
};
fs.writeFileSync(OUT.replace(/\.json$/, ".stats.json"), JSON.stringify(stats, null, 2) + "\n");

console.error(`  modules: ${fpBlocks.length} first-party / ${vendorBlocks.length} vendor (${blocksReport.blocks.length} total)`);
console.error(`  rename entries: ${stats.renameEntries} (blocks=${fromBlocks}, entry-exports=${fromEntry}, inferred=${inferredAdded})`);
if (collisions.length) {
  console.error(`  collisions (same mangled, multiple originals) skipped: ${collisions.length}`);
  for (const c of collisions.slice(0, 5)) console.error(`    ${c[0]}: ${c[1]} vs ${c[2]} (${c[3]})`);
}
