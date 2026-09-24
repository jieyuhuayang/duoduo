// Assert that the readable first-party tree still tells the truth about the
// bundle it was extracted from.
//
// This covers a gap the other checks structurally cannot. Lossless split, AST
// equivalence and `node --check` all prove things about recon/*.recon.js; none
// of them looks at first-party/ at all. That tree is what a human actually
// reads, and every way it can be wrong is silent: renaming is scope-safe, so a
// body attributed to the wrong symbol, a stale line anchor, or a header that
// disagrees with the rename map all cost exactly nothing at runtime and every
// check still passes green.
//
// Six redundancies, each independently checkable:
//   1. body       - the extract IS the symbol's whole top-level declaration in
//                   daemon.recon.js, character for character. "Appears somewhere
//                   in recon" is not enough: a truncated body, a lone `}`, or
//                   another symbol's body all appear somewhere.
//   2. symbol     - header's mangled->real pair agrees with the rename map, and
//                   the file is named after that real name
//   3. anchor     - header's pretty.js line IS the symbol's declaration line
//   4. provenance - header's "name:" line says INFERRED exactly for the names in
//                   maps/inferred_daemon.json
//   5. index.json - agrees with what is on disk, and resolved every anchor
//   6. coverage   - the files are exactly the renamed symbols: one file per
//                   rename-map entry, none missing, none extra, none twice; with
//                   the subsystem map given, each file sits in the directory
//                   that map files it under
// Checks 1-5 only look at files that exist, so before 6 a renamed symbol that
// never got a file (no subsystem entry, a stale tree, a case-insensitive
// filesystem folding two names into one file) passed with every count green.
//
// Usage: node verify_first_party.mjs <first-party-dir> <recon.js> <rename.json> <pretty.js> <inferred.json> [subsys.json]
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const [, , FPDIR, RECON, RENAME, PRETTY, INFERRED, SUBSYS] = process.argv;
if (!FPDIR || !RECON || !RENAME || !PRETTY || !INFERRED) {
  console.error("usage: node verify_first_party.mjs <first-party-dir> <recon.js> <rename.json> <pretty.js> <inferred.json> [subsys.json]");
  process.exit(2);
}

const recon = fs.readFileSync(RECON, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8")); // mangled -> real
const pretty = fs.readFileSync(PRETTY, "utf8");
const inferred = JSON.parse(fs.readFileSync(INFERRED, "utf8")); // mangled -> real
const subsys = SUBSYS ? JSON.parse(fs.readFileSync(SUBSYS, "utf8")) : null; // real -> subsystem
const subOf = (real) => (subsys && Object.hasOwn(subsys, real) ? subsys[real] : undefined);

// source text of every top-level declaration in recon, keyed by bound name: the
// whole statement, as extract_functions.mjs slices it
const declText = new Map();
{
  const ast = parse(recon, { sourceType: "module", ranges: true });
  for (const s of ast.program.body) {
    const text = recon.slice(s.start, s.end);
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) declText.set(s.id.name, text);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier" && !declText.has(d.id.name)) declText.set(d.id.name, text);
  }
}

// declaration line of every top-level binding in the pretty bundle
const declLine = new Map();
{
  const ast = parse(pretty, { sourceType: "module", ranges: true });
  const put = (name, node) => { if (!declLine.has(name)) declLine.set(name, node.loc.start.line); };
  for (const s of ast.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, d.id);
  }
}

const files = [];
for (const d of fs.readdirSync(FPDIR)) {
  const p = path.join(FPDIR, d);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const f of fs.readdirSync(p)) if (f.endsWith(".js")) files.push(path.join(p, f));
}

const HEADER = /^\/\/ symbol: (\S+)\s+\(minified: (\S+), [^:]+:(\S+)\)/m;
const fail = [];
let okBody = 0, okSymbol = 0, okAnchor = 0, okProvenance = 0;
const filesOf = new Map(); // real name (from the header) -> [relative paths]

for (const f of files) {
  const rel = path.relative(FPDIR, f);
  const txt = fs.readFileSync(f, "utf8");
  const m = txt.match(HEADER);
  if (!m) { fail.push(`${rel}: unparseable header`); continue; }
  const [, real, mangled, lineStr] = m;
  if (!filesOf.has(real)) filesOf.set(real, []);
  filesOf.get(real).push(rel);

  // header = the leading run of `//` lines, then one blank line; body = the rest
  const lines = txt.split("\n");
  let h = 0;
  while (h < lines.length && lines[h].startsWith("//")) h++;
  const header = lines.slice(0, h).join("\n");
  const body = lines[h] === "" ? lines.slice(h + 1).join("\n").replace(/\n$/, "") : null;
  const want = declText.get(real);
  if (body === null) fail.push(`${rel}: header is not followed by a blank line`);
  else if (want === undefined) fail.push(`${rel}: ${real} is not a top-level declaration in ${path.basename(RECON)}`);
  else if (body === want) okBody++;
  else fail.push(`${rel}: body is not exactly the declaration of ${real} in ${path.basename(RECON)} (${body.length} vs ${want.length} chars)`);

  const says = /^\/\/ name: INFERRED\b/m.test(header) ? "inferred" : /^\/\/ name: authoritative\b/m.test(header) ? "authoritative" : null;
  const is = inferred[mangled] === real ? "inferred" : "authoritative";
  if (says === is) okProvenance++;
  else fail.push(`${rel}: header says the name is ${says ?? "(no name: line)"}, maps/inferred_daemon.json says ${is}`);

  if (rename[mangled] !== real) fail.push(`${rel}: header says ${mangled}->${real}, rename map says ${mangled}->${rename[mangled] ?? "(absent)"}`);
  else if (path.basename(f, ".js") !== real) fail.push(`${rel}: file is named ${path.basename(f)} but holds ${real}`);
  else okSymbol++;

  const line = declLine.get(mangled);
  if (line === undefined) fail.push(`${rel}: ${mangled} is not a top-level declaration in ${path.basename(PRETTY)}`);
  else if (String(line) === lineStr) okAnchor++;
  else fail.push(`${rel}: anchor says line ${lineStr}, ${mangled} is declared at ${line}`);
}

// coverage: the tree holds exactly the renamed symbols, once each
let okCoverage = 0;
const renamed = Object.values(rename);
for (const real of renamed) {
  const at = filesOf.get(real) ?? [];
  if (!at.length) { fail.push(`coverage: renamed symbol ${real} has no file in the tree${subsys && !subOf(real) ? ` (and no subsystem in ${path.basename(SUBSYS)})` : ""}`); continue; }
  if (at.length > 1) { fail.push(`coverage: ${real} has ${at.length} files: ${at.join(", ")}`); continue; }
  if (subsys && subOf(real) !== path.dirname(at[0])) { fail.push(`coverage: ${at[0]} is filed under ${path.dirname(at[0])}, ${path.basename(SUBSYS)} says ${subOf(real) ?? "(no subsystem)"}`); continue; }
  okCoverage++;
}
const renamedSet = new Set(renamed);
for (const [real, at] of filesOf) if (!renamedSet.has(real)) fail.push(`coverage: ${at.join(", ")} hold ${real}, which is not in the rename map`);
if (subsys) for (const real of Object.keys(subsys)) if (!renamedSet.has(real)) fail.push(`coverage: ${path.basename(SUBSYS)} files ${real} under ${subsys[real]}, but no renamed symbol has that name`);

// index.json must describe exactly what is on disk
const idxPath = path.join(FPDIR, "index.json");
if (!fs.existsSync(idxPath)) fail.push("index.json missing");
else {
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  const onDisk = new Set(files.map(f => path.relative(FPDIR, f).replace(/\.js$/, "")));
  const inIdx = new Set(idx.map(e => `${e.subsystem}/${e.symbol}`));
  for (const x of onDisk) if (!inIdx.has(x)) fail.push(`index.json: missing entry for ${x}`);
  for (const x of inIdx) if (!onDisk.has(x)) fail.push(`index.json: entry ${x} has no file`);
  const unresolved = idx.filter(e => !e.origLine).map(e => e.symbol);
  if (unresolved.length) fail.push(`index.json: ${unresolved.length} unresolved line anchor(s): ${unresolved.join(", ")}`);
}

console.error(`first-party files: ${files.length}`);
console.error(`  body == declaration    : ${okBody}/${files.length}`);
console.error(`  header vs rename map   : ${okSymbol}/${files.length}`);
console.error(`  line anchor exact      : ${okAnchor}/${files.length}`);
console.error(`  name provenance        : ${okProvenance}/${files.length}`);
console.error(`  renamed symbols filed : ${okCoverage}/${renamed.length}${subsys ? " (in their subsystem's directory)" : ""}`);
if (!fail.length) { console.error("RESULT: first-party tree is consistent with the bundle"); process.exit(0); }
console.error(`\n${fail.length} problem(s):`);
for (const f of fail.slice(0, 40)) console.error(`  ${f}`);
if (fail.length > 40) console.error(`  ... and ${fail.length - 40} more`);
process.exit(1);
