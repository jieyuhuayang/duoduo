// Upstream names that an OLDER release exported and the current one no longer
// does, followed forward to the current release's code.
//
// esbuild emits an `__export` block only for a module whose export object is
// needed at run time, and a module can stop needing one: v0.2.0-v0.3.7 exported
// the session-registry module (`readStatus`, `writeStatus`, `updateStatus`, ...)
// and v0.4.0 inlined it, so the current bundle carries those functions without
// a name, and this repository had inferred names for five of them. The old
// export block is upstream's own spelling, as authoritative as a current one;
// what has to be shown is that the current declaration is the same code.
//
// That is what the release history already does (tools/history.sh): every
// consecutive pair of releases is paired declaration by declaration
// (fingerprint_match: identical body; pair_changes: position between matched
// neighbours; decl_features: feature similarity), and history_chain.mjs walks
// each current declaration back through those steps. This tool runs that walk
// for EVERY top-level declaration of the current release (not only the named
// ones), lists the export-block names of every release, and for each name that
// is first-party, absent from the current maps and absent from the current
// export blocks, looks up which current declaration's chain passes through the
// name's short name in the LAST release that exported it.
//
// Verdicts:
//   unique       the chain reaches it, no step from that release to the current
//                one is a "twin by order" pick (two identical bodies told apart
//                only by their order), and no other old name lands on the same
//                current declaration. name_symbol.mjs --historical accepts it.
//   twin         a step on the way is a twin-by-order pick: refused
//   shared       another old name lands on the same current declaration: refused
//   untraced     no current declaration's chain passes through it (the code was
//                removed, or rewritten past what the pairing follows)
// Each entry also says what the current declaration is called now: unnamed,
// an inferred name of this repository, or an upstream name (an old name whose
// code now carries a different upstream name was renamed by upstream and is
// reported, not adopted).
//
// Each old export block is classified, and the class is reported with every
// name: "vendor" when it matches a vendor record of maps/modules_daemon.json
// (the module gate's rule: min(2, markers) of the record's markers present;
// such names are dropped), "first-party" when it matches a first-party record,
// holds a current real name, or one of its short names chains to a current
// declaration with an upstream name; otherwise "unclassified". The class says
// whether the MODULE is duoduo's; it does not decide the name. A current
// declaration that already has an inferred name was accepted as first-party
// when that name was registered (with its evidence, or asserted by hand), and
// renaming it to upstream's spelling does not change that.
//
// Inputs: the history directory of tools/history.sh (versions.txt, pretty/,
// fp/, pairs/, features/); the newest release in it must be the release maps/
// describe. Writes <history>/exports/<v>.json and <history>/chain_all.json as
// caches.
//
// Usage: node match_historical_exports.mjs [--history <dir>] [--maps <dir>] --out <report.json>
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const HIST = opt("--history", path.join(HERE, "..", ".build", "history"));
const MAPS = opt("--maps", path.join(HERE, "..", "maps"));
const OUT = opt("--out");
if (!OUT || argv.length) { console.error("usage: node match_historical_exports.mjs [--history <dir>] [--maps <dir>] --out <report.json>"); process.exit(2); }

const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const versions = fs.readFileSync(path.join(HIST, "versions.txt"), "utf8").split("\n").filter(Boolean);
const current = versions[versions.length - 1];
const report = readJson(path.join(MAPS, "pipeline_report.json"));
if (report.package !== `v${current}`) { console.error(`the newest release in ${HIST} is ${current}, maps/ describe ${report.package}`); process.exit(1); }
const rename = readJson(path.join(MAPS, "rename_daemon.json"));     // mangled -> real
const inferred = readJson(path.join(MAPS, "inferred_daemon.json")); // mangled -> real
const realNames = new Set(Object.values(rename));
const modules = readJson(path.join(MAPS, "modules_daemon.json"));
const matchesRecord = (names, rec) => rec.marker.filter(m => names.includes(m)).length >= Math.min(2, rec.marker.length);

const node = (args) => {
  const r = spawnSync(process.execPath, ["--max-old-space-size=8192", ...args], { encoding: "utf8" });
  if (r.status !== 0) { console.error(`${path.basename(args[0])} failed (exit ${r.status}):\n${r.stderr}`); process.exit(1); }
};

// export blocks of every release
fs.mkdirSync(path.join(HIST, "exports"), { recursive: true });
const blocksOf = {};
for (const v of versions) {
  const f = path.join(HIST, "exports", `${v}.json`);
  if (!fs.existsSync(f)) node([path.join(HERE, "export_blocks.mjs"), path.join(HIST, "pretty", `${v}.pretty.js`), "--json", f]);
  blocksOf[v] = readJson(f).blocks;
}
const currentNames = new Set(blocksOf[current].flatMap(b => b.names));

// the chain of every current top-level declaration
const chainFile = path.join(HIST, "chain_all.json");
const features = readJson(path.join(HIST, "features", `${current}.json`));
const stamp = `${current}:${features.order.length}`;
let chains = fs.existsSync(chainFile) ? readJson(chainFile) : null;
if (!chains || chains.stamp !== stamp) {
  const all = path.join(HIST, "all_decls_rename.json");
  fs.writeFileSync(all, JSON.stringify(Object.fromEntries(features.order.map(n => [n, n]))));
  node([path.join(HERE, "history_chain.mjs"), HIST, all, chainFile]);
  chains = { stamp, ...readJson(chainFile) };
  fs.writeFileSync(chainFile, JSON.stringify(chains));
}
const symbols = chains.symbols ?? chains;
// release -> short name in that release -> current short name
const back = {};
for (const [cur, s] of Object.entries(symbols)) {
  if (!s || !s.chain) continue;
  for (const [v, m] of Object.entries(s.chain)) (back[v] ??= {})[m] = cur;
}

// old export-block names, per release
const old = new Map(); // name -> { seen: [{v, short}], marker, blockClass }
const RANK = { unclassified: 0, "first-party": 1, vendor: 2 };
for (const v of versions) {
  for (const b of blocksOf[v]) {
    const blockClass = modules.vendor.some(r => matchesRecord(b.names, r)) ? "vendor"
      : modules.firstParty.some(r => matchesRecord(b.names, r)) || b.names.some(n => realNames.has(n)) ||
        b.mangled.some(m => { const c = back[v]?.[m]; return c && Object.hasOwn(rename, c) && !Object.hasOwn(inferred, c); }) ? "first-party"
      : "unclassified";
    b.names.forEach((n, i) => {
      if (realNames.has(n) || currentNames.has(n)) return;
      const e = old.get(n) ?? { seen: [], marker: b.marker, blockClass };
      e.seen.push({ v, short: b.mangled[i] });
      if (RANK[blockClass] > RANK[e.blockClass]) e.blockClass = blockClass;
      old.set(n, e);
    });
  }
}

const vIndex = new Map(versions.map((v, i) => [v, i]));
const entries = [];
for (const [name, e] of old) {
  if (e.blockClass === "vendor") continue;
  const last = e.seen[e.seen.length - 1];
  const cur = back[last.v]?.[last.short] ?? null;
  const entry = { name, exportedFirst: `v${e.seen[0].v}`, exportedLast: `v${last.v}`, lastShort: last.short, block: e.marker, blockClass: e.blockClass, current: cur };
  if (!cur) { entries.push({ ...entry, verdict: "untraced" }); continue; }
  const how = symbols[cur].how ?? {};
  const after = Object.entries(how).filter(([v]) => vIndex.get(v) > vIndex.get(last.v));
  entry.steps = Object.fromEntries(after.map(([v, h]) => [`v${v}`, h]));
  entry.changedSince = after.filter(([, h]) => h !== "identical").map(([v]) => `v${v}`);
  entry.currentName = rename[cur] ?? null;
  entry.currentNameKind = !rename[cur] ? "unnamed" : Object.hasOwn(inferred, cur) ? "inferred" : "upstream";
  entry.verdict = after.some(([, h]) => /twin/.test(h)) ? "twin" : "unique";
  entries.push(entry);
}
// two old names on one current declaration: neither is adopted
const byCur = new Map();
for (const e of entries) if (e.current) byCur.set(e.current, [...(byCur.get(e.current) ?? []), e]);
for (const list of byCur.values()) if (list.length > 1) for (const e of list) if (e.verdict === "unique") { e.verdict = "shared"; e.sharedWith = list.filter(x => x !== e).map(x => x.name); }
entries.sort((a, b) => a.name.localeCompare(b.name));

const out = { generatedBy: "tools/match_historical_exports.mjs", package: report.package, history: path.relative(process.cwd(), HIST), entries };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
for (const e of entries) {
  const now = e.current ? `${e.current} (${e.currentNameKind}${e.currentName ? ` ${e.currentName}` : ""})` : "-";
  console.log(`${e.verdict.padEnd(9)} ${e.name.padEnd(28)} ${e.blockClass.padEnd(12)} ${e.exportedFirst}..${e.exportedLast}  -> ${now}${e.changedSince?.length ? `  changed in ${e.changedSince.join(", ")}` : ""}`);
}
console.error(`${entries.length} non-vendor names exported by an older release only; ${entries.filter(e => e.verdict === "unique").length} unique -> ${OUT}`);
