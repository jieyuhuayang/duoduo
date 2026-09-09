// Apply a remap_doc_anchors.mjs OUT json to docs: rewrite `<bundle>.pretty.js:OLD`
// to `<bundle>.pretty.js:NEW` for every "exact"-confidence entry. Unresolved and
// non-exact entries are left untouched (report only).
// Usage: node apply_line_map.mjs <bundle> <line_map.json> <doc.md...>
import fs from "node:fs";

const [, , BUNDLE, MAPJSON, ...files] = process.argv;
if (!BUNDLE || !MAPJSON || !files.length) {
  console.error("usage: node apply_line_map.mjs <bundle> <line_map.json> <doc.md...>");
  process.exit(2);
}
const map = JSON.parse(fs.readFileSync(MAPJSON, "utf8"));

const repl = new Map();
for (const [oldLine, v] of Object.entries(map)) {
  if (v.confidence === "exact" && v.new != null) repl.set(oldLine, String(v.new));
}

let totalSubs = 0;
for (const f of files) {
  let text = fs.readFileSync(f, "utf8");
  let subs = 0;
  text = text.replace(new RegExp(`${BUNDLE}\\.pretty\\.js:(\\d+)`, "g"), (m, line) => {
    if (repl.has(line)) { subs++; return `${BUNDLE}.pretty.js:${repl.get(line)}`; }
    return m;
  });
  if (subs > 0) { fs.writeFileSync(f, text); console.log(`${f}: ${subs} anchors updated`); totalSubs += subs; }
}
console.log(`total: ${totalSubs} anchors updated across ${files.length} files`);
