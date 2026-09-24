// Extract top-level named first-party bindings from the RENAMED daemon into a
// readable per-subsystem source tree. Each file contains the full declaration
// (function/const) sliced from the renamed source, plus a header noting its
// original mangled name and pretty-file line. These files are for READING; the
// runnable artifact is the whole daemon.recon.js.
//
// The tree must hold EVERY renamed symbol, so the rename map is what drives the
// loop, and maps/subsys_daemon.json (hand-made) must classify exactly that set.
// This loop used to iterate the subsystem map instead: a first-party name that
// build_rename.mjs recovered but nobody had filed under a subsystem was left
// out of first-party/ without a word, gen_rename_table.mjs filed it under
// "zz-unclassified", and verify_first_party.mjs never compared the file set with
// the rename map -- so a new upstream symbol could miss the readable tree
// indefinitely. Now either direction of disagreement stops the build here,
// before anything is written, with the names to fix.
// Usage: node extract_functions.mjs <daemon.recon.js> <rename.json> <subsys.json> <outdir> <origPretty.js> <inferred.json>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import path from "node:path";

const [, , RECON, MAP, SUBSYS, OUTDIR, ORIG, INFERRED] = process.argv;
if (!INFERRED) {
  console.error("usage: node extract_functions.mjs <daemon.recon.js> <rename.json> <subsys.json> <outdir> <origPretty.js> <inferred.json>");
  process.exit(2);
}
// mangled -> real, for the names RE-derived by hand rather than read from an
// esbuild __export block. The header says which kind each name is: a reader of
// the tree cannot otherwise tell an upstream author's name from our guess.
const inferred = JSON.parse(fs.readFileSync(INFERRED, "utf8"));
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

// Completeness, both directions. A subsystem is also a directory name, so it
// must look like the other twelve (`NN-name`): a typo would open a new one.
const renamed = Object.values(renameMap);
const renamedSet = new Set(renamed);
const unfiled = renamed.filter(n => !Object.hasOwn(subsys, n)).sort();
const stale = Object.keys(subsys).filter(n => !renamedSet.has(n)).sort();
const badDir = Object.entries(subsys).filter(([, s]) => !/^\d\d-[a-z][a-z0-9-]*$/.test(s)).map(([n, s]) => `${n} -> "${s}"`);
const notTopLevel = renamed.filter(n => !programScope.bindings[n]).sort();
if (unfiled.length || stale.length || badDir.length || notTopLevel.length) {
  console.error(`FIRST-PARTY TREE INCOMPLETE: ${path.basename(SUBSYS)} and ${path.basename(MAP)} disagree`);
  if (unfiled.length) {
    console.error(`  ${unfiled.length} renamed symbol(s) have no subsystem, so they would be missing from first-party/:`);
    for (const n of unfiled) console.error(`    ${n}  (${inv[n]})`);
    console.error(`  file each under one of the NN-* subsystems in ${path.basename(SUBSYS)} (name_symbol.mjs does this for inferred names).`);
  }
  if (stale.length) {
    console.error(`  ${stale.length} subsystem entries name no renamed symbol (dropped upstream, or a typo):`);
    for (const n of stale) console.error(`    ${n} -> ${subsys[n]}`);
  }
  if (badDir.length) console.error(`  subsystem not of the form NN-name: ${badDir.join(", ")}`);
  if (notTopLevel.length) console.error(`  renamed but not a top-level binding of ${path.basename(RECON)}: ${notTopLevel.join(", ")}`);
  process.exit(1);
}

const index = [];
let extracted = 0;
for (const newName of renamed) {
  const sub = subsys[newName];
  const binding = programScope.bindings[newName];
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
    (inferred[mangled] === newName
      ? `// name: INFERRED — hand-derived from the body, not upstream's name (maps/inferred_daemon.json)\n`
      : `// name: authoritative — upstream's own name, from an esbuild __export block or the bundle's export statement\n`) +
    `// NOTE: readable extract from daemon.recon.js; references other top-level\n` +
    `// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).\n\n`;
  fs.writeFileSync(path.join(dir, `${newName}.js`), header + text + "\n");
  index.push({ subsystem: sub, symbol: newName, mangled, origLine, inferred: inferred[mangled] === newName, bytes: text.length });
  extracted++;
}

index.sort((a, b) => (a.subsystem + a.symbol).localeCompare(b.subsystem + b.symbol));
fs.writeFileSync(path.join(OUTDIR, "index.json"), JSON.stringify(index, null, 2));
console.log(`extracted ${extracted} first-party functions into ${OUTDIR}`);
// per-subsystem counts
const bySub = {};
for (const e of index) bySub[e.subsystem] = (bySub[e.subsystem] || 0) + 1;
console.log("by subsystem:", JSON.stringify(bySub));
