// Re-assemble a split bundle from its manifest by concatenating segment files
// in order. Output must byte-match the original beautified source.
// Usage: node reassemble.mjs <splitdir> <out.js>
import fs from "node:fs";
import path from "node:path";

const [, , DIR, OUT] = process.argv;
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8"));
const parts = manifest.segments.map(s => fs.readFileSync(path.join(DIR, s.file)));
fs.writeFileSync(OUT, Buffer.concat(parts));
console.log(`reassembled ${manifest.segments.length} segments -> ${OUT} (${fs.statSync(OUT).size} bytes; expected ${manifest.totalBytes})`);
