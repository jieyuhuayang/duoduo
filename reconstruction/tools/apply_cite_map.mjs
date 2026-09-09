// Fix `Name`(`OLDLINE`) / `Name`(OLDLINE) citations using a remap_doc_anchors.mjs
// line map: rewrite both the short name and the line number to their v-next
// equivalents for every "exact"-confidence entry. Leaves everything else
// (including the bracket style/backtick style already in the doc) untouched.
// Usage: node apply_cite_map.mjs <line_map.json> <doc.md...>
import fs from "node:fs";

const [, , MAPJSON, ...files] = process.argv;
if (!MAPJSON || !files.length) {
  console.error("usage: node apply_cite_map.mjs <line_map.json> <doc.md...>");
  process.exit(2);
}
const map = JSON.parse(fs.readFileSync(MAPJSON, "utf8"));
const byOldLine = new Map();
for (const [oldLine, v] of Object.entries(map)) {
  if (v.confidence === "exact" && v.new != null && v.newFn) byOldLine.set(oldLine, v);
}

const CITE = /`([A-Za-z_$][A-Za-z0-9_$]{1,5})`(\s*)([（(])(\s*)(`?)(\d{4,6})(`?)(\s*)([）)])/g;

let totalSubs = 0;
for (const f of files) {
  let text = fs.readFileSync(f, "utf8");
  let subs = 0;
  text = text.replace(CITE, (whole, name, s1, open, s2, tick1, lineStr, tick2, s3, close) => {
    const v = byOldLine.get(lineStr);
    if (!v) return whole;
    subs++;
    return `\`${v.newFn}\`${s1}${open}${s2}${tick1}${v.new}${tick2}${s3}${close}`;
  });
  if (subs > 0) { fs.writeFileSync(f, text); console.log(`${f}: ${subs} citations updated`); totalSubs += subs; }
}
console.log(`total: ${totalSubs} citations updated across ${files.length} files`);
