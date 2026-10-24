// Evidence for the module gate: who owns an export block no record matches.
//
// build_rename.mjs stops the build on an export block that matches no record in
// maps/modules_<bundle>.json, and a person decides whether the module is
// duoduo's or a vendored library. The two kinds of evidence that decide it are
// mechanical, and this tool collects them; it decides nothing:
//
//   - the installed packages: a vendored module's export names are the export
//     names of an npm package installed with the release. Every .js/.mjs/.cjs
//     file under the given node_modules roots is searched for the block's names
//     as whole words, the bundles of @openduo/duoduo itself excluded (they
//     contain every name). A package with a file that holds all of them is
//     listed with that file; @openduo/* packages are duoduo's own (the daemon
//     inlines @openduo/protocol) and are marked so.
//   - the references: vendored code never refers to duoduo's code by name. The
//     top-level declarations the block exports are resolved through Babel
//     scopes, and every reference they make to a top-level binding that
//     build_rename.mjs already counts as first-party (a first-party block's
//     export, an entry export, an inferred name) is listed.
//
// At v0.8.5 -> v0.8.6 the block was parseCookie, parseSetCookie,
// stringifyCookie, stringifySetCookie: all four are the exports of cookie 2.0.1
// (light-my-request's dependency, which fastify uses for inject), already
// installed with v0.8.5, and the block refers to no first-party name. Finding
// that took a hand search of node_modules and a second bump.sh run.
//
// Usage: node module_owner_hint.mjs <unmatched.json> <pretty.js> <node_modules dir>...
//   <unmatched.json> is what build_rename.mjs --unmatched writes on a gate failure.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseMod from "@babel/traverse";
const traverse = traverseMod.default || traverseMod;

const [UNMATCHED, PRETTY, ...ROOTS] = process.argv.slice(2);
if (!UNMATCHED || !PRETTY) {
  console.error("usage: node module_owner_hint.mjs <unmatched.json> <pretty.js> <node_modules dir>...");
  process.exit(2);
}
const report = JSON.parse(fs.readFileSync(UNMATCHED, "utf8"));
const firstParty = new Map(Object.entries(report.firstParty || {}));  // mangled -> real
const blocks = report.blocks || [];
if (!blocks.length) process.exit(0);

// ---- references from the exported declarations to first-party bindings ----
const code = fs.readFileSync(PRETTY, "utf8");
const ast = parse(code, { sourceType: "unambiguous", errorRecovery: true, allowReturnOutsideFunction: true });
const declOf = new Map();  // top-level binding -> its statement node
for (const s of ast.program.body) {
  if (s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") { if (s.id) declOf.set(s.id.name, s); }
  else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") declOf.set(d.id.name, d);
}
const wanted = new Map();  // statement node -> [block index]
blocks.forEach((b, i) => {
  for (const m of b.mangled || []) {
    const n = declOf.get(m);
    if (!n) continue;
    if (!wanted.has(n)) wanted.set(n, new Set());
    wanted.get(n).add(i);
  }
});
const refs = blocks.map(() => new Map());  // per block: first-party mangled -> count
traverse(ast, {
  enter(p) {
    const owners = wanted.get(p.node);
    if (!owners) return;
    const own = new Set(blocks.flatMap((b, i) => (owners.has(i) ? b.mangled : [])));
    p.traverse({
      ReferencedIdentifier(q) {
        const name = q.node.name;
        if (!firstParty.has(name) || own.has(name)) return;
        const bind = q.scope.getBinding(name);
        if (!bind || bind.scope.block !== ast.program) return;  // a local that shares the spelling
        for (const i of owners) refs[i].set(name, (refs[i].get(name) || 0) + 1);
      },
    });
    p.skip();
  },
});

// ---- installed packages whose source holds every export name ----
const skipBundle = /[\\/]@openduo[\\/]duoduo[\\/]dist[\\/]/;
const pkgCache = new Map();
function packageOf(file) {
  for (let d = path.dirname(file); d !== path.dirname(d); d = path.dirname(d)) {
    if (pkgCache.has(d)) { const v = pkgCache.get(d); if (v) return v; continue; }
    let v = null;
    const pj = path.join(d, "package.json");
    if (fs.existsSync(pj)) {
      try { const j = JSON.parse(fs.readFileSync(pj, "utf8")); if (j.name) v = `${j.name}@${j.version}`; } catch {}
    }
    pkgCache.set(d, v);
    if (v) return v;
  }
  return "?";
}
const files = [];
const seen = new Set();
function walk(dir) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(?:c|m)?js$/.test(e.name) || skipBundle.test(p)) continue;
    const real = fs.realpathSync(p);
    if (seen.has(real)) continue;
    seen.add(real);
    files.push(p);
  }
}
for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rx = blocks.map((b) => b.names.map((n) => new RegExp(`(?<![\\w$])${esc(n)}(?![\\w$])`)));
const hits = blocks.map(() => new Map());  // per block: package -> { file, found }
for (const f of files) {
  let st;
  try { st = fs.statSync(f); } catch { continue; }
  if (st.size > 8 * 1024 * 1024) continue;
  const text = fs.readFileSync(f, "utf8");
  blocks.forEach((b, i) => {
    const found = rx[i].filter((r) => r.test(text)).length;
    if (!found) return;
    const pkg = packageOf(f), prev = hits[i].get(pkg);
    if (!prev || found > prev.found) hits[i].set(pkg, { file: f, found });
  });
}

console.log(`\nmodule owner evidence for ${blocks.length} unmatched block(s) in ${report.bundle} (searched ${files.length} files under ${ROOTS.length} node_modules root(s)):`);
blocks.forEach((b, i) => {
  console.log(`  block @ line ${b.line} (${b.names.length} names: ${b.names.slice(0, 6).join(", ")}${b.names.length > 6 ? ", ..." : ""})`);
  const all = [...hits[i]].filter(([, h]) => h.found === b.names.length);
  const part = [...hits[i]].filter(([, h]) => h.found < b.names.length && h.found >= Math.ceil(b.names.length * 0.75))
    .sort((x, y) => y[1].found - x[1].found);
  if (all.length) for (const [pkg, h] of all.slice(0, 5))
    console.log(`    all ${b.names.length} names in ${pkg}${/^@openduo\//.test(pkg) ? "  (duoduo's own package: first-party)" : ""}: ${path.relative(process.cwd(), h.file)}`);
  else if (part.length) for (const [pkg, h] of part.slice(0, 3)) console.log(`    ${h.found}/${b.names.length} names in ${pkg}: ${path.relative(process.cwd(), h.file)}`);
  else console.log("    no installed package holds these names");
  if (all.length > 5) console.log(`    ... and ${all.length - 5} more package(s)`);
  const r = [...refs[i]].sort((x, y) => y[1] - x[1]);
  console.log(r.length
    ? `    refers to ${r.length} first-party binding(s): ${r.slice(0, 8).map(([m, c]) => `${firstParty.get(m)} (${m}) x${c}`).join(", ")}  -> evidence it is first-party`
    : "    refers to no first-party binding");
  if (!r.length && !all.length) console.log("    no evidence either way: read the block's code before deciding");
});
console.log("  (evidence only: record the decision in maps/modules_<bundle>.json, then run bump.sh again)");
