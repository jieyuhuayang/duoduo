// Make first-party functions of the reconstructed daemon callable on their own.
//
// Some claims can only be settled by running the code on a few inputs, and a
// whole-daemon scenario (scenarios/) is far more than they need. At v0.8.5 the
// CHANGELOG said a job `cwd_rel` given as an absolute path is refused; the
// code strips the leading `/` first, so it is not. That was found by copying
// four functions out of the bundle by hand and calling them. This tool does
// the copying properly.
//
// It writes a copy of recon/daemon.recon.js into the package's dist/release
// (where Node resolves the bundle's dependencies, as for running the daemon:
// CLAUDE.md, "Running / verifying the actual runtime") with one more export
// statement: the requested real names, and `prepare`, which runs the esbuild
// module initialisers that assign the module state those functions read
// (`var a, b, X = O(() => { a = ...; b = ... })`: until X() has run, a and b
// are undefined). The initialisers are found statically: every uninitialised
// top-level `var` a requested function reaches, through the top-level
// functions it calls, is mapped to the initialiser whose body assigns it.
// Importing the copy runs the bundle's top-level statements but not main():
// the bundle starts the daemon only when it is the entry script.
//
// The copy is a run artifact, like scenarios/' instrumented file: it is not
// the reconstruction and is outside the equivalence proof (one appended export
// statement; nothing else changes).
//
// Usage: node extract_decl.mjs --pkg <dist/release> [--recon <daemon.recon.js>] [--out <file name>] <realName...>
// then, from any script:
//   const m = await import("<pkg>/daemon.harness.mjs"); m.prepare();
//   m.resolveJobCwdRel({ workDir: "/w" }, "/etc/x")
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const traverse = _traverse.default || _traverse;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const PKG = opt("--pkg");
const RECON = opt("--recon", path.join(HERE, "../recon/daemon.recon.js"));
const OUTNAME = opt("--out", "daemon.harness.mjs");
const NAMES = argv;
if (!PKG || !NAMES.length) {
  console.error("usage: node extract_decl.mjs --pkg <dist/release> [--recon <daemon.recon.js>] [--out <file name>] <realName...>");
  process.exit(2);
}
if (!fs.existsSync(path.join(PKG, "daemon.js"))) { console.error(`${PKG} has no daemon.js: pass the dist/release dir of an installed @openduo/duoduo`); process.exit(2); }

const src = fs.readFileSync(RECON, "utf8");
const ast = parse(src, { sourceType: "module" });

// top-level bindings: name -> { kind: "function"|"init"|"var"|"other", node }
const top = new Map();
const isInit = (init) => init?.type === "CallExpression" && init.arguments.length === 1 && init.arguments[0].type === "ArrowFunctionExpression" &&
  init.callee.type === "Identifier" && init.arguments[0].body.type === "BlockStatement";
for (const st of ast.program.body) {
  if (st.type === "FunctionDeclaration" && st.id) top.set(st.id.name, { kind: "function", node: st });
  else if (st.type === "ClassDeclaration" && st.id) top.set(st.id.name, { kind: "other", node: st });
  else if (st.type === "VariableDeclaration") for (const d of st.declarations) {
    if (d.id.type !== "Identifier") continue;
    top.set(d.id.name, { kind: isInit(d.init) ? "init" : d.init ? (/Function/.test(d.init.type) ? "function" : "other") : "var", node: d });
  }
}
for (const n of NAMES) if (!top.has(n)) { console.error(`${n} is not a top-level binding of ${RECON}`); process.exit(2); }

// per top-level function or initialiser: the top-level names it refers to, and
// for an initialiser the uninitialised vars it assigns
const refsOf = new Map(), assigns = new Map();
let programScope;
traverse(ast, {
  Program(p) { programScope = p.scope; },
  Identifier(p) {
    if (!p.isReferencedIdentifier() && !p.parentPath.isAssignmentExpression({ left: p.node })) return;
    const b = p.scope.getBinding(p.node.name);
    if (!b || b.scope !== programScope) return;
    let q = p;
    while (q.parentPath && !q.parentPath.isProgram() && !(q.isVariableDeclarator() && q.parentPath.parentPath?.isProgram())) q = q.parentPath;
    const owner = q.isVariableDeclarator() ? q.node.id.name : q.node.id?.name;
    if (!owner || owner === p.node.name) return;
    (refsOf.get(owner) ?? refsOf.set(owner, new Set()).get(owner)).add(p.node.name);
    if (p.parentPath.isAssignmentExpression({ left: p.node }) && top.get(owner)?.kind === "init" && top.get(p.node.name)?.kind === "var")
      (assigns.get(p.node.name) ?? assigns.set(p.node.name, new Set()).get(p.node.name)).add(owner);
  },
});

// walk the functions the requested ones reach; collect the initialisers of the vars they read
const seen = new Set(), inits = new Set(), unassigned = new Set();
const walk = (n) => {
  if (seen.has(n)) return;
  seen.add(n);
  const t = top.get(n);
  if (!t) return;
  if (t.kind === "var") { const a = assigns.get(n); if (a) a.forEach((i) => inits.add(i)); else unassigned.add(n); return; }
  if (t.kind === "init") { inits.add(n); return; }
  for (const r of refsOf.get(n) || []) walk(r);
};
NAMES.forEach(walk);

const exported = new Set();
for (const m of src.matchAll(/^export \{([\s\S]*?)\};?\s*$/gm)) for (const part of m[1].split(",")) { const as = part.trim().split(/\s+as\s+/).pop(); if (as) exported.add(as); }
const extra = NAMES.filter((n) => !exported.has(n));
const initList = [...inits].sort();
const harness = `${src}
// ---- extract_decl.mjs: not part of the reconstruction ----
function prepare() {
${initList.map((i) => `    ${i}();`).join("\n")}
}
export { ${[...extra, "prepare"].join(", ")} };
`;
const out = path.join(PKG, OUTNAME);
fs.writeFileSync(out, harness);
console.log(`wrote ${out}`);
console.log(`  exports: ${[...NAMES, "prepare"].join(", ")}`);
console.log(`  prepare() runs ${initList.length} module initialiser(s): ${initList.join(", ") || "(none)"}`);
if (unassigned.size) console.log(`  read but assigned by no initialiser (set elsewhere at run time, or never): ${[...unassigned].sort().join(", ")}`);
console.log(`  use: const m = await import(${JSON.stringify(out)}); m.prepare(); m.${NAMES[0]}(...)`);
