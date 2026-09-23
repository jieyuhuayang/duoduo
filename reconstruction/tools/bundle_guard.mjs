// Refuse to check doc anchors against a bundle that is not the one the symbol
// index was built from.
//
// Every anchor check reads a *.pretty.js by path, and nothing tied that path to
// a version. .build/beautified/ is a leftover of whichever run last wrote it —
// at the v0.8.2 retarget it still held a v0.8.1 bundle (85592 lines against
// 91616) — and pointing verify_citations.mjs at it reported "wrong line" on
// correct citations with no hint that the input was the problem. With --fix it
// would have rewritten them.
//
// The index already carries what is needed: each symbol's mangled name and
// declaration line. If the bundle is the indexed one, every mangled name
// appears on its line. One miss is enough to know it is not.
import fs from "node:fs";

export function assertBundleMatchesIndex(lines, index, bundlePath) {
  const misses = [];
  for (const [real, e] of Object.entries(index.symbols)) {
    const re = new RegExp("(?<![A-Za-z0-9_$])" + e.mangled.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])");
    if (!re.test(lines[e.line - 1] ?? "")) misses.push(`${real} (${e.mangled}) @ ${e.line}`);
  }
  if (!misses.length) return;
  console.error(`bundle does not match the symbol index: ${bundlePath}`);
  console.error(`  index is ${index.bundle} ${index.version}; ${misses.length}/${Object.keys(index.symbols).length} indexed symbols are not on their recorded line, e.g.`);
  for (const m of misses.slice(0, 3)) console.error(`    ${m}`);
  console.error(`  every line check against this bundle would be meaningless. Pass the ${index.version} *.pretty.js.`);
  process.exit(2);
}

export function loadIndex(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}
