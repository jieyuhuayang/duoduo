// Extract top-level named first-party bindings from the RENAMED daemon into a
// readable per-subsystem source tree. Each file contains the full declaration
// (function/const) sliced from the renamed source, plus a header noting its
// original mangled name and pretty-file line. These files are for READING; the
// runnable artifact is the whole daemon.recon.js.
// Usage: node extract_functions.mjs <daemon.recon.js> <rename.json> <subsys.json> <outdir> <origPretty.js>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import path from "node:path";

const [, , RECON, MAP, SUBSYS, OUTDIR, ORIG] = process.argv;
const src = fs.readFileSync(RECON, "utf8");
const renameMap = JSON.parse(fs.readFileSync(MAP, "utf8")); // mangled -> newName
const subsys = JSON.parse(fs.readFileSync(SUBSYS, "utf8")); // newName -> subsystem
const origSrc = fs.readFileSync(ORIG, "utf8");

// invert rename: newName -> mangled
const inv = {};
for (const [m, n] of Object.entries(renameMap)) inv[n] = m;

// Declaration line of every top-level binding in the ORIGINAL pretty file, so
// the header can cite a line a reader can jump to. Taken from the AST, not a
// regex: a text scan for `var NAME` mis-reports two whole classes of binding.
// It lands on the *preceding* newline (`(?:^|\n)\s*` makes m.index the \n, and
// \s* then swallows blank lines) — off by one or two on nearly every symbol —
// and it cannot see a name that is not the first declarator, so every symbol
// in a shared `var A, B, C = lazyInit(...)` block degraded to `?`.
const origDeclLine = new Map();
{
  const origAst = parse(origSrc, { sourceType: "module", ranges: true });
  const put = (name, node) => { if (!origDeclLine.has(name)) origDeclLine.set(name, node.loc.start.line); };
  for (const s of origAst.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) put(s.id.name, s);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") put(d.id.name, d.id);
  }
}

const ast = parse(src, { sourceType: "module", ranges: true });
let programScope;
traverse(ast, { Program(p) { programScope = p.scope; p.stop(); } });

// find original mangled-name line in ORIG (top-level declaration site)
function origLineOf(mangled) {
  return origDeclLine.get(mangled) ?? null;
}

const index = [];
let extracted = 0, missing = [];
for (const [newName, sub] of Object.entries(subsys)) {
  const binding = programScope.bindings[newName];
  if (!binding) { missing.push(newName); continue; }
  // enclosing statement
  let p = binding.path;
  if (p.isVariableDeclarator()) p = p.parentPath; // -> VariableDeclaration
  const node = p.node;
  const text = src.slice(node.start, node.end);
  const mangled = inv[newName] || "?";
  const origLine = origLineOf(mangled);
  const dir = path.join(OUTDIR, sub);
  fs.mkdirSync(dir, { recursive: true });
  const header = `// duoduo reconstruction — subsystem: ${sub}\n` +
    `// symbol: ${newName}  (minified: ${mangled}, daemon.pretty.js:${origLine ?? "?"})\n` +
    `// NOTE: readable extract from daemon.recon.js; references other top-level\n` +
    `// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).\n\n`;
  fs.writeFileSync(path.join(dir, `${newName}.js`), header + text + "\n");
  index.push({ subsystem: sub, symbol: newName, mangled, origLine, bytes: text.length });
  extracted++;
}

index.sort((a, b) => (a.subsystem + a.symbol).localeCompare(b.subsystem + b.symbol));
fs.writeFileSync(path.join(OUTDIR, "index.json"), JSON.stringify(index, null, 2));
console.log(`extracted ${extracted} first-party functions into ${OUTDIR}`);
if (missing.length) console.log(`not top-level (skipped): ${missing.join(", ")}`);
// per-subsystem counts
const bySub = {};
for (const e of index) bySub[e.subsystem] = (bySub[e.subsystem] || 0) + 1;
console.log("by subsystem:", JSON.stringify(bySub));
