// Build a mangled->original rename map for FIRST-PARTY duoduo symbols only.
// Sources: (1) export-name map (authoritative, from esbuild __export), filtered
// to first-party by keyword; (2) RE-inferred internal (non-exported) functions.
// Usage: node build_rename.mjs <exports.json> <inferred.json> <out.json>
import fs from "node:fs";
const [, , EXPORTS, INFERRED, OUT] = process.argv;
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

fs.writeFileSync(OUT, JSON.stringify(finalMap, null, 2));
console.error(`first-party rename entries: ${Object.keys(finalMap).length} (exports=${Object.keys(finalMap).length - inferredAdded}, inferred=${inferredAdded})`);
if (collisions.length) console.error(`collisions (same mangled, multiple orig) skipped: ${collisions.length} e.g. ${collisions.slice(0,3).map(c=>c.join("->")).join("; ")}`);
console.error("sample:", Object.entries(finalMap).slice(0, 12).map(([m, o]) => `${m}=${o}`).join(" "));
