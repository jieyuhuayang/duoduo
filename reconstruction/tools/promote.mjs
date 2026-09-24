// Compare the artifacts a rebuild.sh run just generated against the committed
// copies under reconstruction/, or (write mode) replace the committed copies.
//
// Why this exists: rebuild.sh used to prove things about $OUT only. Nothing
// compared $OUT with recon/, maps/ or first-party/, and promoting them was a
// list of manual cp steps in CLAUDE.md. So a committed recon/ could be stale,
// or hand-edited, while every check in the pipeline stayed green -- the
// equivalence proof was about a file nobody reads.
//
// Compared (fresh in $OUT -> committed under reconstruction/):
//   daemon.recon.js                        -> recon/daemon.recon.js     (bytes)
//   {rename,symbols,blocks}_<b>.json       -> maps/                     (JSON, minus machine-local paths)
//   <b>.exports.json                       -> maps/                     (bytes)
//   RENAME_TABLE.md / RENAME_TABLE_<b>.md  -> maps/                     (bytes; daemon keeps the unsuffixed name)
//   pipeline_report.json                   -> maps/                     (JSON, minus environment/verdicts)
//   first-party/**                         -> first-party/              (bytes, whole tree, both directions)
//
// Write mode is the only way generated artifacts enter the repository, so it
// is also where "proven" is enforced. It refuses -- before writing anything --
// unless the fresh pipeline_report.json says every proof passed:
//   per bundle   lossless, beautifyEquivalent, syntax, astEquivalent, and
//                inferredNames wherever maps/inferred_<b>.json exists
//   whole run    firstPartyTree, citations, lineAnchors, anchorCheckers,
//                anchorTargetMatches
// each exactly `pass`; plus a release version and a shipped-bundle hash per
// bundle (both only exist when the run had PKG). `skipped` and a gate that never
// ran are refused like `fail`: the v0.8.3 promote committed
// beautifyEquivalent=skipped, and verdicts are left out of the artifact
// comparison below, so that comparison alone cannot notice one (check mode
// applies the rule separately, see below). `warn` from the
// inferred-name check is refused too. It means "nothing refuted, but a shape
// changed and needs a human re-read", and it is the only signal of an inferred
// name re-anchored onto a same-arity sibling that the SWAP check cannot tell
// apart. The re-read ends with `verify_inferred.mjs record`, after which the
// check passes -- so the review is on record before the promote, never implied.
//
// Check mode applies the same rule to the COMMITTED report, so a record that
// could not be promoted today (hand-edited, or from before this rule) fails the
// comparison even when every artifact matches.
//
// Usage: node promote.mjs check|write <OUT> <reconstruction-dir> <bundle...>
// check exits 1 if anything differs and prints what; write copies and exits 0,
// or exits 1 without writing when the fresh report is not promotable.
import fs from "node:fs";
import path from "node:path";

const [MODE, OUT, ROOT, ...BUNDLES] = process.argv.slice(2);
if (!["check", "write"].includes(MODE) || !OUT || !ROOT || !BUNDLES.length) {
  console.error("usage: node promote.mjs check|write <OUT> <reconstruction-dir> <bundle...>");
  process.exit(2);
}

// fields that legitimately differ between machines or runs
const LOCAL = new Set(["source", "input", "out", "environment", "verdicts"]);
const strip = v => Array.isArray(v) ? v.map(strip)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([k]) => !LOCAL.has(k)).map(([k, x]) => [k, strip(x)]))
  : v;
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const sameJson = (a, b) => JSON.stringify(strip(readJson(a))) === JSON.stringify(strip(readJson(b)));
const sameBytes = (a, b) => fs.readFileSync(a).equals(fs.readFileSync(b));

// The report is compared like any JSON artifact, with one exception: a run
// without PKG never read a shipped bundle, so its `sha256.<b>.shipped` is null
// -- not a different hash, no hash. That field is left out of the comparison
// for such a run (the pretty hash still counts); the run records
// beautifyEquivalent=skipped and cannot be promoted, so nothing is lost.
function sameReport(fresh, committed) {
  const f = strip(readJson(fresh)), c = strip(readJson(committed));
  for (const [b, h] of Object.entries(f.sha256 ?? {})) {
    if (h && h.shipped == null && c.sha256?.[b]) { delete h.shipped; delete c.sha256[b].shipped; }
  }
  return JSON.stringify(f) === JSON.stringify(c);
}

// What a report must say before it may be (or may have been) promoted.
const PER_BUNDLE = ["lossless", "beautifyEquivalent", "syntax", "astEquivalent"];
const WHOLE_RUN = ["firstPartyTree", "citations", "lineAnchors", "anchorCheckers", "anchorTargetMatches"];
function unpromotable(report) {
  const v = report.verdicts ?? {};
  const need = [];
  for (const b of BUNDLES) {
    for (const g of PER_BUNDLE) need.push(`${b}.${g}`);
    if (fs.existsSync(`${ROOT}/maps/inferred_${b}.json`)) need.push(`${b}.inferredNames`);
  }
  need.push(...WHOLE_RUN);
  const why = need.filter(g => v[g] !== "pass").map(g => `verdict ${g}=${v[g] ?? "(never ran)"}`);
  // duoduo publishes plain semver releases; a pre-release (v0.9.0-rc.1) or a
  // four-part version is not one, and neither is the "unrecorded" stamp
  if (!/^v\d+\.\d+\.\d+$/.test(report.package ?? "")) why.push(`package "${report.package}" is not a release version`);
  for (const b of BUNDLES) {
    if (!report.sha256?.[b]?.shipped) why.push(`no sha256 of the shipped ${b}.js (run without PKG)`);
    if (!report.sha256?.[b]?.pretty) why.push(`no sha256 of ${b}.pretty.js`);
  }
  return why;
}

const pairs = []; // [fresh, committed, kind]
if (BUNDLES.includes("daemon")) pairs.push([`${OUT}/daemon.recon.js`, `${ROOT}/recon/daemon.recon.js`, "bytes"]);
for (const b of BUNDLES) {
  for (const k of ["rename", "symbols", "blocks"]) pairs.push([`${OUT}/${k}_${b}.json`, `${ROOT}/maps/${k}_${b}.json`, "json"]);
  pairs.push([`${OUT}/${b}.exports.json`, `${ROOT}/maps/${b}.exports.json`, "bytes"]);
}
const table = b => (b === "daemon" ? "RENAME_TABLE.md" : `RENAME_TABLE_${b}.md`);
for (const b of BUNDLES) pairs.push([`${OUT}/${table(b)}`, `${ROOT}/maps/${table(b)}`, "bytes"]);
pairs.push([`${OUT}/pipeline_report.json`, `${ROOT}/maps/pipeline_report.json`, "report"]);

const walk = d => fs.existsSync(d) ? fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).sort() : [];
const freshFp = `${OUT}/first-party`, committedFp = `${ROOT}/first-party`;
const fpFiles = new Set([...walk(freshFp), ...walk(committedFp)]);
for (const f of fpFiles) pairs.push([path.join(freshFp, f), path.join(committedFp, f), "bytes"]);

const diffs = [];
for (const [fresh, committed, kind] of pairs) {
  const rel = path.relative(ROOT, committed);
  if (!fs.existsSync(fresh)) { diffs.push({ rel, what: "not generated by this run", fresh, committed, remove: true }); continue; }
  if (!fs.existsSync(committed)) { diffs.push({ rel, what: "new (not committed)", fresh, committed }); continue; }
  const same = kind === "report" ? sameReport(fresh, committed)
    : kind === "json" ? sameJson(fresh, committed) : sameBytes(fresh, committed);
  if (!same) diffs.push({ rel, what: "differs", fresh, committed });
}

if (MODE === "write") {
  const freshReport = `${OUT}/pipeline_report.json`;
  const why = fs.existsSync(freshReport) ? unpromotable(readJson(freshReport)) : [`${freshReport} does not exist`];
  if (why.length) {
    console.error(`  refusing to promote: the report of this run does not prove everything (${why.length}):`);
    for (const w of why) console.error(`    ${w}`);
    if (why.some(w => w.includes("inferredNames=warn"))) {
      console.error("  inferredNames=warn: re-read the names verify_inferred.mjs warned about, then record the");
      console.error("  reviewed shapes (verify_inferred.mjs record ...) and re-run.");
    }
    console.error("  nothing was written.");
    process.exit(1);
  }
  for (const d of diffs) {
    if (d.remove) { if (d.rel.startsWith("first-party")) fs.rmSync(d.committed); continue; }
    fs.mkdirSync(path.dirname(d.committed), { recursive: true });
    fs.copyFileSync(d.fresh, d.committed);
  }
  // prune directories the new tree no longer has
  for (const d of fs.existsSync(committedFp) ? fs.readdirSync(committedFp) : []) {
    const p = path.join(committedFp, d);
    if (fs.statSync(p).isDirectory() && fs.readdirSync(p).length === 0) fs.rmdirSync(p);
  }
  console.error(`  promoted ${diffs.length} changed artifact(s) into ${ROOT}`);
  for (const d of diffs.slice(0, 30)) console.error(`    ${d.remove ? "removed" : "wrote"}  ${d.rel}`);
  process.exit(0);
}

console.error(`  committed artifacts: ${pairs.length} compared, ${diffs.length} differ from this run`);
for (const d of diffs.slice(0, 30)) console.error(`    ${d.what.padEnd(26)} ${d.rel}`);
if (diffs.length > 30) console.error(`    ... and ${diffs.length - 30} more`);
const committedReport = `${ROOT}/maps/pipeline_report.json`;
const bad = fs.existsSync(committedReport) ? unpromotable(readJson(committedReport)) : [];
if (bad.length) {
  console.error(`  committed maps/pipeline_report.json could not be promoted today (${bad.length}):`);
  for (const w of bad) console.error(`    ${w}`);
}
process.exit(diffs.length || bad.length ? 1 : 0);
