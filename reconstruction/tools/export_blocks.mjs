// Recover export names GROUPED BY SOURCE MODULE.
//
// esbuild emits one `__export(exports, { RealName: () => mangled, ... })` call
// per ESM module that has exports. The call site therefore IS the module
// boundary — the one piece of first-party/vendor structure the minifier could
// not erase, because the runtime needs it.
//
// exports_map.mjs answers "what real names exist" by flattening every block
// into one object. That loses two things this tool keeps:
//
//   1. Module membership. Without it, first-party classification degenerates
//      into guessing from the name (build_rename.mjs's keyword allowlist),
//      which fails structurally: a module whose exports are all `GROK_ACP_*`
//      constants matches no keyword, and `pi` cannot be a substring rule
//      because it hits `pipeline` and `api`. With it, the question becomes
//      "is this module ours" — decided once per module, not once per name.
//   2. Cross-module duplicates. daemon v0.8.1 has 1001 names across 24 blocks
//      but only 728 distinct ones; zod exports `bigint`/`boolean`/`date`/
//      `string` from several modules. The flat map silently keeps the last
//      writer, so a name can be attributed to the wrong module.
//
// The bundle's own top-level `export { mangled as RealName }` statement is
// collected separately: an entry bundle's exports never go through __export.
// For daemon that statement is the only source of createDaemon, main and three
// others — they are first-party by construction and must not be missed.
//
// Usage: node export_blocks.mjs <file.pretty.js> [--json <out.json>] [exportHelper]
// Without --json the report goes to stdout as JSON.
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";

const argv = process.argv.slice(2);
let OUT = null;
const ji = argv.indexOf("--json");
if (ji !== -1) { OUT = argv[ji + 1]; argv.splice(ji, 2); }
const [FILE, HELPER_ARG] = argv;
if (!FILE) {
  console.error("usage: node export_blocks.mjs <file.pretty.js> [--json <out.json>] [exportHelper]");
  process.exit(2);
}

const src = fs.readFileSync(FILE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });

// Same shape predicate as exports_map.mjs: a two-argument call whose second
// argument is an object literal of `name: () => bareIdentifier` and nothing
// else. All-or-nothing per call site.
function looksLikeExportCall(node) {
  if (node.type !== "CallExpression" || node.callee.type !== "Identifier") return false;
  if (node.arguments.length !== 2) return false;
  const o = node.arguments[1];
  if (o.type !== "ObjectExpression" || o.properties.length === 0) return false;
  for (const pr of o.properties) {
    if (pr.type !== "ObjectProperty") return false;
    if (!(pr.value.type === "ArrowFunctionExpression" && pr.value.body.type === "Identifier")) return false;
  }
  return true;
}

const tally = new Map();
const sites = [];
traverse(ast, {
  CallExpression(p) {
    if (!looksLikeExportCall(p.node)) return;
    tally.set(p.node.callee.name, (tally.get(p.node.callee.name) || 0) + 1);
    sites.push(p.node);
  },
});

const ranked = [...tally].sort((a, b) => b[1] - a[1]);
const helper = HELPER_ARG || ranked[0]?.[0] || null;
// exports_map.mjs takes the top candidate with no threshold. Say so out loud
// when the winner is thin or contested, because a wrong helper yields a
// confidently empty result (feishu-gateway.js recovers exactly one name).
if (!HELPER_ARG && ranked.length) {
  const [, topCount] = ranked[0];
  if (topCount < 3) console.error(`  warn: export helper "${helper}" has only ${topCount} call site(s) — verify it is really the helper`);
  if (ranked.length > 1 && ranked[1][1] >= topCount) console.error(`  warn: export helper is contested: ${JSON.stringify(ranked.slice(0, 3))}`);
}

const blocks = [];
for (const node of sites) {
  if (helper && node.callee.name !== helper) continue;
  const names = [], mangled = [];
  for (const pr of node.arguments[1].properties) {
    names.push(pr.key.name ?? pr.key.value);
    mangled.push(pr.value.body.name);
  }
  blocks.push({
    index: blocks.length,
    line: node.loc?.start.line ?? null,
    count: names.length,
    // Marker: the three lexicographically-first names. Stable enough to
    // re-identify the module after a version bump (matched by 2-of-3 in
    // build_rename.mjs) without pinning a block index that shifts.
    marker: [...names].sort().slice(0, 3),
    names,
    mangled,
  });
}

// Bundle-level `export { local as Exported }` — the entry module's own surface.
const entryExports = {};
for (const stmt of ast.program.body) {
  if (stmt.type !== "ExportNamedDeclaration" || stmt.declaration) continue;
  for (const sp of stmt.specifiers || []) {
    if (sp.type !== "ExportSpecifier") continue;
    const exported = sp.exported.name ?? sp.exported.value;
    entryExports[exported] = sp.local.name;
  }
}

const distinct = new Set();
let total = 0;
for (const b of blocks) { total += b.count; for (const n of b.names) distinct.add(n); }

const report = {
  bundle: FILE.replace(/^.*\//, "").replace(/\.pretty\.js$|\.js$/, ""),
  source: FILE,
  helper,
  helperCandidates: Object.fromEntries(ranked),
  blockCount: blocks.length,
  namesInBlocks: total,
  distinctNamesInBlocks: distinct.size,
  entryExportCount: Object.keys(entryExports).length,
  blocks,
  entryExports,
};

const json = JSON.stringify(report, null, 2) + "\n";
if (OUT) {
  fs.writeFileSync(OUT, json);
  console.error(`  export blocks: ${blocks.length} module(s), ${total} name(s) (${distinct.size} distinct) + ${report.entryExportCount} entry export(s) -> ${OUT}`);
} else {
  process.stdout.write(json);
}
