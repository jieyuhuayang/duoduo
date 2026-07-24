// Classify split modules as first-party (duoduo) vs vendored (node_modules),
// attach line ranges, score by first-party anchors, and map known
// reverse-engineered functions (by pretty-file line) to their enclosing module.
// Usage: node classify.mjs <splitdir> <original.pretty.js> [known.json]
import fs from "node:fs";
import path from "node:path";

const [, , DIR, ORIG, KNOWN] = process.argv;
const src = fs.readFileSync(ORIG, "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));

// byte-offset -> 1-based line. Build cumulative newline index.
const lineStarts = [0];
for (let i = 0; i < src.length; i++) if (src[i] === "\n") lineStarts.push(i + 1);
function offsetToLine(off) {
  // binary search largest lineStart <= off
  let lo = 0, hi = lineStarts.length - 1, ans = 0;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (lineStarts[m] <= off) { ans = m; lo = m + 1; } else hi = m - 1; }
  return ans + 1;
}
// NOTE: manifest offsets are UTF-16 char indices (String.slice), lineStarts too. Consistent.

// First-party anchors (duoduo-specific string literals / identifiers).
const FP_ANCHORS = [
  "[pid0]", "aladuo:", "spine.event", "spine.tail", "channel.message",
  "subconscious", "cadence", "meta-prompt", "memory-weaver", "broadcast",
  "[[", "@evt(", "queue_offsets", "byte_offset", "deduplicated",
  "createDaemon", "sessionManager", "bootstrap", "duoduo", "ALADUO_",
  "DUODUO_", "permissionMode", "claude_code", "developerInstructions",
  "routing_hint", "meta:subconscious", "sdk_session_id", "drain",
  "Contents of", "<aladuo:system-context>", "effectiveness", "orphan",
];
// Vendor signals.
const VENDOR = [
  '__esModule', 'Object.defineProperty(exports', 'License', 'Copyright (c)',
  'MIT License', 'https://github.com', 'node_modules', 'sourceMappingURL',
];

const known = KNOWN && fs.existsSync(KNOWN) ? JSON.parse(fs.readFileSync(KNOWN, "utf8")) : {};
// known: { "WT": 57186, ... }  (line numbers in ORIG)

const mods = manifest.segments.filter(s => s.kind === "module");
const results = [];
for (const m of mods) {
  const text = fs.readFileSync(path.join(DIR, m.file), "utf8");
  const startLine = offsetToLine(m.start);
  const endLine = offsetToLine(m.end);
  let fp = 0, ven = 0;
  const hits = [];
  for (const a of FP_ANCHORS) { const c = text.split(a).length - 1; if (c) { fp += c; hits.push(`${a}:${c}`); } }
  for (const v of VENDOR) { const c = text.split(v).length - 1; if (c) ven += c; }
  // map known functions into this module
  const knownHere = Object.entries(known).filter(([, ln]) => ln >= startLine && ln <= endLine).map(([n, ln]) => `${n}@${ln}`);
  results.push({
    name: m.name, wrapperKind: m.wrapperKind, file: m.file,
    startLine, endLine, lines: endLine - startLine + 1, bytes: m.bytes,
    fpScore: fp, venScore: ven, knownHere, hits: hits.slice(0, 8),
  });
}

// classification verdict
for (const r of results) {
  if (r.knownHere.length) r.verdict = "first-party (known-fn)";
  else if (r.fpScore >= 3 && r.fpScore > r.venScore) r.verdict = "first-party (anchors)";
  else if (r.fpScore > 0 && r.venScore === 0 && r.wrapperKind === "esm") r.verdict = "first-party? (weak)";
  else r.verdict = "vendor";
}

const fpMods = results.filter(r => r.verdict.startsWith("first-party"));
fpMods.sort((a, b) => a.startLine - b.startLine);

fs.writeFileSync(path.join(DIR, "classification.json"), JSON.stringify(results, null, 2));
console.log(`total modules: ${results.length}`);
const byV = {};
for (const r of results) byV[r.verdict] = (byV[r.verdict] || 0) + 1;
console.log("verdicts:", JSON.stringify(byV, null, 0));
console.log(`\nFIRST-PARTY modules (${fpMods.length}), by line:`);
for (const r of fpMods) {
  console.log(`  ${r.wrapperKind} ${r.name.padEnd(6)} L${r.startLine}-${r.endLine} (${r.lines}L, ${(r.bytes/1024).toFixed(0)}KB) fp=${r.fpScore} ven=${r.venScore} ${r.knownHere.length ? "KNOWN[" + r.knownHere.join(",") + "]" : ""}`);
}
