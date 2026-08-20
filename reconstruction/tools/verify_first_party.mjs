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
// Four redundancies, each independently checkable:
//   1. body       - the extract is a verbatim slice of daemon.recon.js
//   2. symbol     - header's mangled->real pair agrees with the rename map
//   3. anchor     - header's pretty.js line IS the symbol's declaration line
//   4. index.json - agrees with what is on disk, and resolved every anchor
//
// Usage: node verify_first_party.mjs <first-party-dir> <recon.js> <rename.json> <pretty.js>
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const [, , FPDIR, RECON, RENAME, PRETTY] = process.argv;
if (!FPDIR || !RECON || !RENAME || !PRETTY) {
  console.error("usage: node verify_first_party.mjs <first-party-dir> <recon.js> <rename.json> <pretty.js>");
  process.exit(2);
}

const recon = fs.readFileSync(RECON, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8")); // mangled -> real
const pretty = fs.readFileSync(PRETTY, "utf8");

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
let okBody = 0, okSymbol = 0, okAnchor = 0;

for (const f of files) {
  const rel = path.relative(FPDIR, f);
  const txt = fs.readFileSync(f, "utf8");
  const m = txt.match(HEADER);
  if (!m) { fail.push(`${rel}: unparseable header`); continue; }
  const [, real, mangled, lineStr] = m;

  const body = txt.split("\n").filter(l => !l.startsWith("//")).join("\n").trim();
  if (recon.includes(body)) okBody++;
  else fail.push(`${rel}: body is not a verbatim slice of ${path.basename(RECON)}`);

  if (rename[mangled] === real) okSymbol++;
  else fail.push(`${rel}: header says ${mangled}->${real}, rename map says ${mangled}->${rename[mangled] ?? "(absent)"}`);

  const want = declLine.get(mangled);
  if (want === undefined) fail.push(`${rel}: ${mangled} is not a top-level declaration in ${path.basename(PRETTY)}`);
  else if (String(want) === lineStr) okAnchor++;
  else fail.push(`${rel}: anchor says line ${lineStr}, ${mangled} is declared at ${want}`);
}

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
console.error(`  body verbatim in recon : ${okBody}/${files.length}`);
console.error(`  header vs rename map   : ${okSymbol}/${files.length}`);
console.error(`  line anchor exact      : ${okAnchor}/${files.length}`);
if (!fail.length) { console.error("RESULT: first-party tree is consistent with the bundle"); process.exit(0); }
console.error(`\n${fail.length} problem(s):`);
for (const f of fail.slice(0, 40)) console.error(`  ${f}`);
if (fail.length > 40) console.error(`  ... and ${fail.length - 40} more`);
process.exit(1);
