// Merge the per-release CHANGELOG pairings into maps/changelog_daemon.json.
//
// A pairing file (one per release, written after reading the release's
// CHANGELOG entry against the symbols history_chain.mjs says were born or
// changed in it) has the shape
//   { version, pairs: [{symbol, changelog, confidence, why}],
//     changedExplained: [{symbol, changelog, confidence, why}], unexplained: [...], suspectChain: [...] }
// This tool folds them into one map keyed by real name, keeps only symbols the
// current rename map knows, and records per entry whether the symbol was born
// or changed in that release. The pairing is a reading, not a proof: the
// `confidence` and `why` fields travel with each entry so a reader can weigh it.
//
// Usage: node changelog_merge.mjs <pairs dir> <rename_daemon.json> <out.json>
import fs from "node:fs";
import path from "node:path";

const [DIR, RENAME, OUT] = process.argv.slice(2);
if (!DIR || !RENAME || !OUT) { console.error("usage: node changelog_merge.mjs <pairs dir> <rename_daemon.json> <out.json>"); process.exit(2); }
const known = new Set(Object.values(JSON.parse(fs.readFileSync(RENAME, "utf8"))));
const files = fs.readdirSync(DIR).filter(f => f.endsWith(".json")).sort((a, b) => cmp(a, b));
function cmp(a, b) { const pa = a.replace(/\.json$/, "").split(".").map(Number), pb = b.replace(/\.json$/, "").split(".").map(Number); for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]; return 0; }

const symbols = {};
const counts = { born: 0, changed: 0, high: 0, medium: 0, low: 0, unknownSymbol: 0 };
const unexplained = {};
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  const v = d.version;
  const suspect = new Set(d.suspectChain ?? []);
  for (const [kind, list] of [["born", d.pairs ?? []], ["changed", d.changedExplained ?? []]]) {
    for (const p of list) {
      if (!known.has(p.symbol)) { counts.unknownSymbol++; continue; }
      const e = { version: v, kind, confidence: p.confidence, changelog: p.changelog.replace(/\s+/g, " ").trim(), why: p.why };
      if (kind === "born" && suspect.has(p.symbol)) e.note = "the release chain may have lost an older body of this symbol; the entry describes a change, not its first appearance";
      (symbols[p.symbol] ??= []).push(e);
      counts[kind]++; counts[p.confidence] = (counts[p.confidence] ?? 0) + 1;
    }
  }
  if (d.unexplained?.length) unexplained[v] = d.unexplained.filter(s => known.has(s)).sort();
}
const out = {
  generatedBy: "tools/changelog_merge.mjs",
  source: "CHANGELOG.md of openduo/duoduo, read per release against maps/history_daemon.json",
  counts,
  symbols: Object.fromEntries(Object.keys(symbols).sort().map(k => [k, symbols[k]])),
  unexplained,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`changelog: ${Object.keys(symbols).length} symbols with entries (${counts.born} born, ${counts.changed} changed; ${counts.high} high, ${counts.medium} medium, ${counts.low} low), ${Object.values(unexplained).flat().length} born symbols unexplained -> ${OUT}`);
