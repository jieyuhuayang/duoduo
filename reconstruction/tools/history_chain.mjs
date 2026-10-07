// Where each first-party symbol of the current release first appeared, and in
// which releases its body changed -- walked back through every published
// release of @openduo/duoduo.
//
// esbuild re-mangles every identifier on every build, so a symbol's name does
// not survive a release; its body mostly does. fingerprint_match.mjs pairs two
// consecutive releases' top-level declarations by structural signature, and
// pair_changes.mjs pairs the changed ones by their position between matched
// neighbours. This tool chains those pairings, release by release, from the
// current bundle backwards: for each current mangled name it follows the
// unique reverse match (identical body, else the positional pair) into the
// previous release, until no release has a counterpart. The release where the
// walk ends is where the symbol first appeared; every release where the step
// was a positional pair rather than an identical body is one where it changed.
//
// The result is evidence of a kind the bundle alone does not carry: a symbol
// born in v0.6.1 is described by that release's CHANGELOG entry, which was
// written by the author. `changelog_pairs` (a later step) matches the entries
// to the births; this tool only records the chain.
//
// Inputs: a history directory holding versions.txt (ascending), fp/<a>__<b>.json
// (fingerprint_match) and pairs/<a>__<b>.json (pair_changes) for each
// consecutive pair, and the current rename map (mangled -> real).
//
// A third pairing, by features (decl_features.mjs: property names, strings,
// numbers, globals, arity), takes over when a release rewrote a function so
// much that the positional pairing gave up (unequal window counts): among the
// previous release's declarations that no identical match claimed, inside the
// window between the nearest identically-matched neighbours, the candidate
// with the best weighted Jaccard score wins when it scores at least --min
// and leads the runner-up by --lead. Each step records how it was made.
//
// Usage: node history_chain.mjs <history dir> <rename_daemon.json> <out.json> [--package @openduo/duoduo] [--min 0.5] [--lead 0.1] [--slim]
import fs from "node:fs";
import path from "node:path";
import { makeStep } from "./release_pairing.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i === -1) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const PACKAGE = opt("--package", "@openduo/duoduo");
const MIN = Number(opt("--min", 0.5)), LEAD = Number(opt("--lead", 0.1));
// --slim: the committed form (maps/history_daemon.json): no per-release mangled
// chain, only first release, changed releases and the steps made by similarity
const si = argv.indexOf("--slim"); const SLIM = si !== -1; if (SLIM) argv.splice(si, 1);
const [HIST, RENAME, OUT] = argv;
if (!HIST || !RENAME || !OUT) { console.error("usage: node history_chain.mjs <history dir> <rename_daemon.json> <out.json> [--package name]"); process.exit(2); }

const versions = fs.readFileSync(path.join(HIST, "versions.txt"), "utf8").split("\n").filter(Boolean);
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8"));
const current = versions[versions.length - 1];

const features = new Map(); // version -> decl_features output (loaded lazily)
const featuresOf = v => { if (!features.has(v)) { const f = path.join(HIST, "features", `${v}.json`); features.set(v, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); } return features.get(v); };

// per consecutive pair: the three-layer pairing of release_pairing.mjs
const steps = []; // index i: from versions[i] to versions[i+1]
for (let i = 0; i + 1 < versions.length; i++) {
  const a = versions[i], b = versions[i + 1];
  const fp = JSON.parse(fs.readFileSync(path.join(HIST, "fp", `${a}__${b}.json`), "utf8"));
  const pr = JSON.parse(fs.readFileSync(path.join(HIST, "pairs", `${a}__${b}.json`), "utf8"));
  const FO = featuresOf(a), FN = featuresOf(b);
  if (!FO || !FN) { console.error(`missing features/${a}.json or features/${b}.json (run decl_features.mjs)`); process.exit(1); }
  steps.push({ from: a, to: b, step: makeStep({ fp, pairs: pr, FO, FN, min: MIN, lead: LEAD }) });
}

const symbols = {};
const byVersion = {};
const untraceableList = [];
for (const v of versions) byVersion[v] = { born: [], changed: [] };
for (const [mangled, real] of Object.entries(rename)) {
  let name = mangled;
  const chain = { [current]: mangled };
  const changes = [];
  let firstSeen = current;
  const how = {};
  let untraceable = null;
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    const r = s.step.resolve(name);
    if (!r) break;
    if (r.untraceable) { untraceable = `${r.untraceable} past v${s.to}`; break; }
    how[s.to] = r.how === "similar" ? `similar ${r.score}${r.overlap ? ` (overlap ${r.overlap})` : ""}` : r.how;
    if (!r.how.startsWith("identical")) changes.push(s.to);
    name = r.old;
    chain[s.from] = r.old;
    firstSeen = s.from;
  }
  changes.reverse();
  const similarSteps = Object.entries(how).filter(([, k]) => k.startsWith("similar")).map(([v, k]) => `${v}:${k.slice(8)}`);
  symbols[real] = SLIM ? { mangled, firstSeen: untraceable ? null : firstSeen, changedIn: changes, ...(untraceable ? { untraceable } : {}), ...(similarSteps.length ? { similarSteps } : {}) }
    : { mangled, firstSeen: untraceable ? null : firstSeen, changedIn: changes, releases: Object.keys(chain).length, chain, how, ...(untraceable ? { untraceable } : {}) };
  if (untraceable) untraceableList.push(real); else byVersion[firstSeen].born.push(real);
  for (const c of changes) byVersion[c].changed.push(real);
}
for (const v of versions) { byVersion[v].born.sort(); byVersion[v].changed.sort(); }

const out = {
  generatedBy: "tools/history_chain.mjs (tools/history.sh)",
  method: "release to release: identical body (fingerprint_match.mjs), else positional pair (pair_changes.mjs), else feature similarity (decl_features.mjs, min " + MIN + ", lead " + LEAD + "); firstSeen is where the walk ends",
  package: PACKAGE,
  current,
  versions,
  symbolCount: Object.keys(symbols).length,
  symbols: Object.fromEntries(Object.keys(symbols).sort().map(k => [k, symbols[k]])),
  byVersion,
  untraceable: untraceableList.sort(),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
const born = versions.map(v => `${v}:${byVersion[v].born.length}`).filter(s => !s.endsWith(":0"));
console.log(`history: ${out.symbolCount} symbols over ${versions.length} releases, ${untraceableList.length} untraceable (no features); born per release: ${born.join(" ")}`);
