// Collect what a rebuild.sh run actually measured into one machine-readable
// file, so prose can cite it instead of restating it.
//
// Every count in this repo's docs used to be hand-copied, and they drifted into
// mutually contradictory values: the number of recovered export names appears
// as 712, 733 and 739 in four different files, and the first-party symbol count
// as both 133 and 139. Neither disagreement was detectable by any check,
// because nothing generated either number.
//
// Usage: node pipeline_report.mjs <buildDir> <out.json> <bundle...>
import fs from "node:fs";

const [BUILD, OUT, ...BUNDLES] = process.argv.slice(2);
if (!BUILD || !OUT || !BUNDLES.length) {
  console.error("usage: node pipeline_report.mjs <buildDir> <out.json> <bundle...>");
  process.exit(2);
}

const readJson = p => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);

const bundles = {};
for (const b of BUNDLES) {
  const blocks = readJson(`${BUILD}/blocks_${b}.json`);
  const stats = readJson(`${BUILD}/rename_${b}.stats.json`);
  const rep = readJson(`${BUILD}/rename_${b}.report.json`);
  const syms = readJson(`${BUILD}/symbols_${b}.json`);
  const pretty = `${BUILD}/beautified/${b}.pretty.js`;
  bundles[b] = {
    prettyLines: fs.existsSync(pretty) ? fs.readFileSync(pretty, "utf8").split("\n").length - 1 : null,
    exportBlocks: blocks?.blockCount ?? null,
    firstPartyBlocks: stats?.firstPartyBlocks ?? null,
    vendorBlocks: stats?.vendorBlocks ?? null,
    namesInBlocks: blocks?.namesInBlocks ?? null,
    distinctNamesInBlocks: blocks?.distinctNamesInBlocks ?? null,
    firstPartyNamesFromBlocks: stats?.namesFromBlocks ?? null,
    namesFromEntryExports: stats?.namesFromEntryExports ?? null,
    inferredNames: stats?.inferredAdded ?? null,
    renameEntries: stats?.renameEntries ?? null,
    renamesApplied: rep?.appliedCount ?? null,
    referencesRewritten: rep?.editCount ?? null,
    renamesSkippedMissing: rep?.skippedMissingCount ?? null,
    renamesSkippedCollision: rep?.skippedCollisionCount ?? null,
    indexedSymbols: syms?.symbolCount ?? null,
  };
}

// first-party tree, if present
const fpIndex = readJson(new URL("../first-party/index.json", import.meta.url).pathname);
const bySubsystem = {};
if (Array.isArray(fpIndex)) for (const e of fpIndex) bySubsystem[e.subsystem] = (bySubsystem[e.subsystem] || 0) + 1;

const report = {
  generatedBy: "reconstruction/tools/rebuild.sh",
  package: process.env.PKG_VERSION || "unrecorded",
  note: "Generated. Do not hand-edit, and do not restate these numbers in prose — cite this file.",
  bundles,
  firstPartyTree: Array.isArray(fpIndex)
    ? { files: fpIndex.length, subsystems: Object.keys(bySubsystem).length, bySubsystem }
    : null,
  totals: {
    coveredBundles: BUNDLES.length,
    firstPartySymbols: Object.values(bundles).reduce((a, b) => a + (b.renameEntries || 0), 0),
  },
};

fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
for (const [b, v] of Object.entries(bundles)) {
  console.error(`  ${b}: ${v.exportBlocks} blocks (${v.firstPartyBlocks} ours / ${v.vendorBlocks} vendor), `
    + `${v.renameEntries} rename entries, ${v.renamesApplied} applied / ${v.referencesRewritten} refs`);
}
if (report.firstPartyTree) console.error(`  first-party tree: ${report.firstPartyTree.files} files in ${report.firstPartyTree.subsystems} subsystems`);
console.error(`  -> ${OUT}`);
