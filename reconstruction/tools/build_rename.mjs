// Build a mangled->original rename map for FIRST-PARTY duoduo symbols only.
// Sources: (1) export-name map (authoritative, from esbuild __export), filtered
// to first-party by keyword; (2) RE-inferred internal (non-exported) functions.
//
// COVERAGE GATE. The keyword allowlist below is a heuristic, and a heuristic
// that fails *silently* is the dangerous kind: at the v0.7.1 bump it did not
// match the entire new Grok subsystem (19 symbols) or ALADUO_TOOL_NAMESPACE,
// so those symbols simply kept their mangled names and first-party/11-runtime-grok/
// never got written. Nothing failed; the gap was found by hand.
//
// So the heuristic is no longer trusted to be complete. Every recovered export
// name must be *accounted for* -- either it classifies as first-party, or it
// appears in the accepted-vendor baseline for this bundle. A name that is
// neither is NEW since the baseline was taken, and the build stops until a
// human says which it is. Baselines key on original export names (stable);
// mangled short names are re-mangled every build and cannot anchor anything.
//
// Usage: node build_rename.mjs <exports.json> <inferred.json> <out.json> [baseline.json] [--accept-vendor]
//   --accept-vendor  after eyeballing the reported names, record them all as
//                    vendor in baseline.json. Only meaningful with a baseline.
import fs from "node:fs";
const argv = process.argv.slice(2);
const ACCEPT = argv.includes("--accept-vendor");
const [EXPORTS, INFERRED, OUT, BASELINE] = argv.filter(a => a !== "--accept-vendor");
const exp = JSON.parse(fs.readFileSync(EXPORTS, "utf8")); // original -> mangled
const inferred = INFERRED && fs.existsSync(INFERRED) ? JSON.parse(fs.readFileSync(INFERRED, "utf8")) : {}; // mangled -> original

// First-party keyword allowlist (case-insensitive). Vendored libs (zod, locales,
// hashes, generic validators) are excluded because they aren't duoduo source.
const FP_KEYWORDS = [
  "daemon", "session", "cadence", "spine", "memory", "drain", "gateway",
  "channel", "codex", "agentsdk", "claude", "job", "outbox", "partition",
  "runtime", "metaprompt", "metasession", "prompt", "instruction", "mission",
  "host", "dotenv", "subconscious", "inbox", "board", "broadcast", "weaver",
  "skip", "notify", "tombstone", "registry", "sweep", "fingerprint", "usage",
  "envconfig", "symlink", "agentmarkdown", "agenttoml", "sandbox", "runmemory",
  "checkstatus", "memorycheck", "systemprompt", "developerinstructions",
  "baseinstructions", "jobmission", "adapter", "appserver", "hostmodel",
  "executable", "runtimepaths", "attachment", "image",
  // stdio/cli entrypoint public API
  "stdio", "chatbot", "ink", "timeline", "reply", "clioptions", "onboard",
  "probe", "install", "rootcli", "printhelp", "daemonchoice", "daemonurl",
  "grok", "toolnamespace", "loopback", "remotelistener", "aladuo_tool",
];
// explicit first-party names that don't contain a keyword
const FP_EXPLICIT = new Set([
  "resolveRuntimePaths", "SESSION_SCHEMA_VERSION", "initializeRuntime",
  "DEFAULT_DISALLOWED_TOOLS", "parsePositiveMsEnv",
]);
// vendor names that slip through keyword matching (zod string-formats/registry)
const VENDOR_DENY = new Set(["hostname", "$ZodRegistry", "globalRegistry", "registry"]);
function isFirstParty(orig) {
  if (VENDOR_DENY.has(orig)) return false;
  if (FP_EXPLICIT.has(orig)) return true;
  const l = orig.toLowerCase();
  return FP_KEYWORDS.some(k => l.includes(k));
}

const map = {}; // mangled -> original
const collisions = [];
// exports (invert). Skip if original is not first-party.
for (const [orig, mangled] of Object.entries(exp)) {
  if (!isFirstParty(orig)) continue;
  if (map[mangled] && map[mangled] !== orig) { collisions.push([mangled, map[mangled], orig]); continue; }
  map[mangled] = orig;
}
// inferred internal (mangled -> original). These override nothing already set by exports.
let inferredAdded = 0;
for (const [mangled, orig] of Object.entries(inferred)) {
  if (map[mangled]) continue;
  map[mangled] = orig; inferredAdded++;
}

// ensure target names are unique (esbuild sometimes exports one local under
// multiple names; and inferred could clash with an export). Suffix dups.
const usedTargets = new Map();
const finalMap = {};
for (const [mangled, orig] of Object.entries(map)) {
  let name = orig;
  const c = usedTargets.get(name) || 0;
  if (c > 0) name = `${orig}$${mangled}`;
  usedTargets.set(orig, c + 1);
  finalMap[mangled] = name;
}

// ---- coverage gate ---------------------------------------------------------
// Every recovered export name must be accounted for: first-party, or recorded
// as vendor in the baseline. Anything else is new since the baseline was taken.
if (BASELINE) {
  const base = fs.existsSync(BASELINE)
    ? JSON.parse(fs.readFileSync(BASELINE, "utf8"))
    : { version: "unrecorded", note: "", vendor: [] };
  const accepted = new Set(base.vendor || []);
  const unreviewed = Object.keys(exp).filter(o => !isFirstParty(o) && !accepted.has(o));

  if (ACCEPT && unreviewed.length) {
    base.vendor = [...new Set([...(base.vendor || []), ...unreviewed])].sort();
    fs.writeFileSync(BASELINE, JSON.stringify(base, null, 2) + "\n");
    console.error(`accepted ${unreviewed.length} name(s) as vendor -> ${BASELINE}`);
  } else if (unreviewed.length) {
    console.error(`\nCOVERAGE GATE FAILED: ${unreviewed.length} export name(s) are neither`);
    console.error(`classified first-party nor recorded as vendor in ${BASELINE}:\n`);
    for (const n of unreviewed.slice(0, 60)) console.error(`    ${n}`);
    if (unreviewed.length > 60) console.error(`    ... and ${unreviewed.length - 60} more`);
    console.error(`\nDecide what they are -- this is the check that a new upstream subsystem`);
    console.error(`trips, and skipping it is how a subsystem goes missing from the`);
    console.error(`reconstruction without anything failing:`);
    console.error(`  first-party -> add a keyword to FP_KEYWORDS (or a name to FP_EXPLICIT), re-run`);
    console.error(`  vendor      -> re-run with --accept-vendor to record them\n`);
    process.exit(1);
  }
  const stale = (base.vendor || []).filter(n => !(n in exp));
  if (stale.length) console.error(`note: ${stale.length} baseline name(s) no longer exported (vendor churn; harmless)`);
}

fs.writeFileSync(OUT, JSON.stringify(finalMap, null, 2));
console.error(`first-party rename entries: ${Object.keys(finalMap).length} (exports=${Object.keys(finalMap).length - inferredAdded}, inferred=${inferredAdded})`);
if (collisions.length) console.error(`collisions (same mangled, multiple orig) skipped: ${collisions.length} e.g. ${collisions.slice(0,3).map(c=>c.join("->")).join("; ")}`);
console.error("sample:", Object.entries(finalMap).slice(0, 12).map(([m, o]) => `${m}=${o}`).join(" "));
