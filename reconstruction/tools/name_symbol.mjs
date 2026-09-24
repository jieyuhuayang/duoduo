// Give an unnamed first-party daemon function, module initialiser or literal
// constant a hand-derived (INFERRED) name, with every check the pipeline would
// otherwise apply late, or not at all, done up front.
//
// Why this exists: docs cite about two hundred functions esbuild left without a
// real name, by bare short name (`jXe`). Nothing can check a bare short name,
// and every release re-mangles it onto different code -- v0.8.3 reused `AXe`,
// `UEe` and `WEe` for unrelated functions. CLAUDE.md's rule is to name such a
// function before citing it, which used to mean hand-editing two JSON maps, and
// each way of getting that wrong was silent or late:
//   - a name on a lazy-init wrapper or a constant instead of the function
//     (runGapLint, v0.8.0) -- caught only by verify_inferred at the next rebuild
//   - a name on VENDORED code -- caught by nothing: renaming is scope-safe, and
//     the name then sits in first-party/ as if it were duoduo's
//   - a name that collides with an identifier -- rename.mjs fails the rebuild
//   - an inferred name without a subsystem -- first-party/ silently lacked the
//     file until extract_functions.mjs made it fatal
//   - a subsystem typo -- a thirteenth directory
//
// Checks, all before anything is written (a batch is all-or-nothing):
//   1. BUNDLE  the bundle is the release maps/ describes: every indexed symbol
//              sits on its recorded line (bundle_guard.mjs). Takes the pretty
//              bundle or daemon.recon.js; rename preserves lines, and an unnamed
//              function has the same short name in both.
//   2. KIND    shortName is a top-level declaration of a kind verify_inferred.mjs
//              accepts at every rebuild (its header): function-like, an esbuild
//              module initialiser (`var a, b, X = __esm(() => {...})`), or a
//              value (a literal, or an expression of literals only). Docs cite
//              default constants -- `vH = 5, wH = 180 * 1e3` -- and a citation
//              `code`（`realName`） needs a named symbol whose span holds the
//              code; those constants are assigned inside a module initialiser.
//              Still refused: an uninitialised var (its value is assigned in
//              its module's initialiser: name that and cite through it), any
//              other call, any other expression. Two refusals per kind:
//                moduleInit  one with no string literal and no literal constant
//                            in its body: nothing tells it from any other
//                            initialiser, so verify_inferred.mjs could never
//                            refute a wrong pin (and nothing is citable in it);
//                            and one that some other initialiser ties on
//                            verify_inferred.mjs's RIVAL score, i.e. has
//                            exactly its shape (`Wr` and `Dr` at v0.8.3, each
//                            `x = null` and nothing else, 3000 lines apart):
//                            the name moved from one to the other passed
//                            verify_inferred.mjs with exit 0. One whose
//                            constants are a subset of another's is accepted:
//                            the RIVAL rule refutes a move either way
//                value       one whose literal another top-level constant has
//                            too (`var Dut = 6e4, Mut = 6e4`, the 27 empty `{}`
//                            export namespaces): the exact-hash check could not
//                            tell which one the name is on; and one that is
//                            reassigned or written through (`X = …`, `X.k = …`,
//                            `X++`) anywhere: that is state initialised with a
//                            literal, not a constant. A write through a call
//                            (`Object.assign(X, …)`) is not seen.
//   3. FRESH   shortName has no name yet (rename map / inferred map)
//   4. ORIGIN  shortName is first-party, by the strongest evidence available
//              (below); vendor evidence always refuses
//   5. NAME    realName is spelled for its kind -- a function camelCase (and
//              not init…Module, which reads as an initialiser), a module
//              initialiser init<Name>Module (initSessionDrainModule), a value
//              UPPER_SNAKE with at least one underscore (the spelling
//              verify_citations.mjs reads as a real name) -- at least 8
//              characters (the length verify_citations.mjs treats as "looks
//              real", so a citation of it stays checked even if the symbol
//              later leaves the index), a valid identifier, and used nowhere
//              yet: not as a variable anywhere in the bundle (binding or global
//              -- a superset of what rename.mjs refuses), not as any real name
//              in the maps or export blocks of ANY bundle, not twice in one
//              batch. A property of the same name is allowed: `.foo` cannot
//              collide with a variable `foo`.
//              Other bundles count because a real name both bundles have is
//              ambiguous to every citation that does not name its bundle
//              (verify_citations.mjs reads it as the daemon's); `main` is the
//              one upstream made, and a hand-made one is refused.
//              The spelling table is verify_inferred.mjs's NAME_SPELLING, which
//              enforces it at every rebuild too. While it lived only here, a
//              name added to the map by hand was never checked against it, and
//              a function's name on a module initialiser passed.
//   6. PLACE   subsystem is one of the NN-* directories subsys_daemon.json uses
//
// ORIGIN evidence. Vendored code never refers to duoduo's code by name (a
// library does not import the application), and that asymmetry is the only
// sound handle there is:
//   vendor export     exported by an export block build_rename.mjs classified as
//                     vendor (i.e. a block whose names are not in the rename map;
//                     the classification is read from its output, not repeated)
//   vendor use        referenced, directly or transitively, by such code
//   first-party use   refers, directly or transitively, to a symbol upstream
//                     itself named first-party (an export-block or entry-export
//                     name). Failing that, to an already INFERRED name, which is
//                     reported as such: those were placed by hand, and the spine
//                     code above the first export block reaches no upstream name
//                     at all, only inferred ones (createSpineEvent, ...)
// An inferred name that was itself registered allow-unproven (below) is NOT
// such a witness. It is recorded in inferred_daemon.asserted.json, and anything
// that reaches first-party code only through such a name is unproven too: it
// needs its own allow-unproven, and is recorded the same way. Before the
// assertion was recorded, one allow-unproven name on zod-to-json-schema's
// addErrorMessage turned 39 more functions of that library into "first-party
// (through an inferred name)" on the next run, none of them flagged -- a
// single wrong assertion laundered a whole library.
// "Refers" is resolved through Babel's scopes, and it is decided per esbuild
// MODULE where the bundle marks modules: every lazily initialised ESM module
// ends with `var init_x = __esm(() => ...)`, so the statements between two such
// wrappers are one module and share one verdict -- a leaf helper is judged with
// the module that holds it. Code before the first wrapper (runtime helpers,
// CommonJS wrappers) and after the last one (the flat entry module) has no such
// boundary and is judged statement by statement; so is every CommonJS wrapper.
// A module with both kinds of evidence is refused as inconsistent.
// A module initialiser IS its module's last statement, so its evidence is its
// module's own (the first one, with no module above it, is judged alone). A
// value's evidence is its statement's: its module's, or -- in the flat entry
// module -- only its own, and a literal refers to nothing, so a constant there
// always needs allow-unproven. __esm is found by what it does
// (verify_inferred.mjs esmHelpers), the same test that decides the moduleInit
// kind, so a module boundary and a nameable initialiser cannot disagree.
//
// Position alone never decides. The module REGION -- the nearest export block
// above the declaration, first-party or vendor -- is reported as a hint, but an
// entry with no reference evidence either way is refused unless it is marked
// allow-unproven: a human asserting, after reading the body, what no evidence
// shows. Both directions of the region rule were measured wrong on v0.8.3:
//   - zod-to-json-schema code (`e._zod?.def`, `anyOf`, `errorMessage`, around
//     line 76-78k) sits in the first-party region that starts at the
//     archiveLegacyRegistrySessionsDir block: the library has no export block
//     of its own, and nothing vendored refers to it, so only position spoke
//   - the Claude-runtime message helpers right after zod's last export block
//     (`parent_tool_use_id`, line ~54.7k) sit in a "vendor" region
// Sound vendor evidence (export, use, inconsistency) is never overridable.
//
// Writes, in each file's existing convention (refusing a file not already in
// it, rather than reformatting a hand edit):
//   inferred_daemon.json        appended, in order (insertion-ordered)
//   subsys_daemon.json          keys sorted
//   inferred_daemon.shape.json  one baseline entry per NEW name, the others
//                               untouched: re-recording the whole baseline would
//                               bless whatever drift the other names have
//   inferred_daemon.asserted.json  real name -> the verdict it was asserted
//                               over, for every allow-unproven name; keys
//                               sorted, created on the first one. Keyed by real
//                               name, so it needs no remapping on a bump.
// then prints the citation form `realName (shortName)`. The name reaches recon/,
// first-party/ and the symbol index on the next rebuild.sh (PROMOTE=1 after
// review).
//
// Usage:
//   node name_symbol.mjs [--maps <dir>] [--dry-run] [--allow-unproven] \
//        <daemon.pretty.js|daemon.recon.js> <shortName> <realName> <subsystem>
//   node name_symbol.mjs [--maps <dir>] [--dry-run] <bundle.js> --batch <list.tsv|list.json>
// A TSV line is `short<TAB>realName<TAB>subsystem[<TAB>allow-unproven]` (# comments
// and blank lines skipped); JSON is an array of {short, name, subsystem,
// allowUnproven?}. --maps defaults to ../maps. Exit: 0 written (or a clean dry
// run), 1 refused, 2 usage error or a bundle maps/ does not describe.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import * as t from "@babel/types";
import { assertBundleMatchesIndex, loadIndex } from "./bundle_guard.mjs";
import { topLevelDeclarations, isNameable, whyNotNameable, shapeOf, esmHelpers, isModuleInitCall, nameKind, spellingProblem, initialiserShapes, initialiserRivals } from "./verify_inferred.mjs";
const traverse = _traverse.default || _traverse;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const MAPS = opt("--maps") ?? path.join(HERE, "../maps");
const BATCH = opt("--batch");
const DRY = flag("--dry-run");
const ALLOW_UNPROVEN = flag("--allow-unproven");
const USAGE = "usage: node name_symbol.mjs [--maps <dir>] [--dry-run] [--allow-unproven] <bundle.js> <shortName> <realName> <subsystem>\n" +
              "       node name_symbol.mjs [--maps <dir>] [--dry-run] <bundle.js> --batch <list.tsv|list.json>";
const [BUNDLE, ...rest] = argv;
if (!BUNDLE || (BATCH ? rest.length : rest.length !== 3)) { console.error(USAGE); process.exit(2); }

// ---- the requested entries -------------------------------------------------
let entries;
if (BATCH) {
  const text = fs.readFileSync(BATCH, "utf8");
  if (BATCH.endsWith(".json")) {
    entries = JSON.parse(text).map((e, i) => Array.isArray(e)
      ? { short: e[0], name: e[1], subsystem: e[2], allowUnproven: false, where: `#${i + 1}` }
      : { short: e.short, name: e.name, subsystem: e.subsystem, allowUnproven: e.allowUnproven === true, where: `#${i + 1}` });
  } else {
    entries = [];
    text.split("\n").forEach((line, i) => {
      if (!line.trim() || line.trimStart().startsWith("#")) return;
      const [short, name, subsystem, extra] = line.split("\t").map(s => s.trim());
      entries.push({ short, name, subsystem, allowUnproven: extra === "allow-unproven", where: `line ${i + 1}`, bad: extra && extra !== "allow-unproven" ? `unknown 4th column "${extra}"` : null });
    });
  }
} else {
  entries = [{ short: rest[0], name: rest[1], subsystem: rest[2], allowUnproven: ALLOW_UNPROVEN, where: "argv" }];
}
if (!entries.length) { console.error("nothing to register"); process.exit(2); }

// ---- maps --------------------------------------------------------------------
const mapPath = (f) => path.join(MAPS, f);
const readJson = (f) => JSON.parse(fs.readFileSync(mapPath(f), "utf8"));
const rename = readJson("rename_daemon.json");     // mangled -> real (generated)
const inferred = readJson("inferred_daemon.json"); // mangled -> real (hand-made)
const subsys = readJson("subsys_daemon.json");     // real -> NN-subsystem (hand-made)
const blocksReport = readJson("blocks_daemon.json");
const index = loadIndex(mapPath("symbols_daemon.json"));
const SHAPE = mapPath("inferred_daemon.shape.json");
const shapeFile = fs.existsSync(SHAPE) ? JSON.parse(fs.readFileSync(SHAPE, "utf8")) : null;
// real name -> the verdict an allow-unproven registration was made over
const ASSERTED = mapPath("inferred_daemon.asserted.json");
const assertedFile = fs.existsSync(ASSERTED) ? JSON.parse(fs.readFileSync(ASSERTED, "utf8")) : null;
const asserted = assertedFile ?? {};
// every real name another bundle already uses (its maps and export blocks)
const otherBundleNames = [];
for (const f of fs.readdirSync(MAPS)) {
  const m = f.match(/^(rename|symbols|blocks)_(\w+)\.json$/);
  if (!m || m[2] === "daemon") continue;
  const j = readJson(f);
  if (m[1] === "rename") otherBundleNames.push(...Object.values(j));
  else if (m[1] === "symbols") otherBundleNames.push(...Object.keys(j.symbols ?? {}));
  else otherBundleNames.push(...(j.blocks ?? []).flatMap(b => b.names), ...Object.keys(j.entryExports || {}));
}

// ---- 1. BUNDLE -----------------------------------------------------------------
const src = fs.readFileSync(BUNDLE, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });
const decls = topLevelDeclarations(ast);
// pretty or recon? In recon the renamed symbols carry their real names.
const has = (n) => decls.has(n);
const keysHere = Object.keys(rename).filter(has).length, realsHere = Object.values(rename).filter(has).length;
const isRecon = realsHere > keysHere;
const here = (mangled) => (isRecon ? rename[mangled] ?? mangled : mangled); // a symbol's name in THIS file
assertBundleMatchesIndex(src.split("\n"),
  isRecon ? { ...index, symbols: Object.fromEntries(Object.entries(index.symbols).map(([r, e]) => [r, { ...e, mangled: r }])) } : index,
  BUNDLE);

// ---- reference graph ----------------------------------------------------------
// One node per esbuild module where the bundle marks modules, else per
// top-level statement; an edge for every variable occurrence (read or write)
// that resolves to a top-level binding of another node.
const body = ast.program.body;
function helperOf(test) {
  const tally = new Map();
  for (const s of body) if (s.type === "VariableDeclaration") for (const d of s.declarations) {
    const i = d.init;
    if (i && i.type === "CallExpression" && i.callee.type === "Identifier" && i.arguments.length === 1 && test(i.arguments[0])) tally.set(i.callee.name, (tally.get(i.callee.name) || 0) + 1);
  }
  const [best] = [...tally].sort((a, b) => b[1] - a[1]);
  return best && best[1] >= 3 ? best[0] : null;
}
const isFn = (a) => a.type === "ArrowFunctionExpression" || a.type === "FunctionExpression";
// __esm by structure (header); __commonJS by use: the callee most often given a
// two-parameter function, `var require_x = CJS((exports, module) => {...})`.
// The __esm helper used to be found by use as well, and could then disagree
// with the moduleInit kind verify_inferred.mjs decides by structure.
const ESM = esmHelpers(ast);
const CJS = helperOf(a => isFn(a) && a.params.length === 2);
const callsHelper = (s, h) => h && s.type === "VariableDeclaration" && s.declarations.some(d => d.init?.type === "CallExpression" && d.init.callee.type === "Identifier" && d.init.callee.name === h);
const isWrapper = (s) => s.type === "VariableDeclaration" && s.declarations.some(d => isModuleInitCall(d.init, ESM));
const wrappers = body.map((s, i) => (isWrapper(s) ? i : -1)).filter(i => i >= 0);
const nodeOf = new Array(body.length);
const moduleSpan = new Map(); // node -> [firstLine, lastLine]
for (let i = 0; i < body.length; i++) {
  // module j = statements (wrappers[j-1], wrappers[j]]
  let j = -1;
  if (wrappers.length >= 2 && i > wrappers[0] && i <= wrappers[wrappers.length - 1] && !callsHelper(body[i], CJS)) {
    let lo = 1, hi = wrappers.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (wrappers[m] >= i) hi = m; else lo = m + 1; }
    j = lo;
  }
  nodeOf[i] = j >= 0 ? `M${j}` : `S${i}`;
  if (j >= 0) {
    const span = moduleSpan.get(nodeOf[i]) ?? [body[i].loc.start.line, 0];
    span[1] = body[i].loc.end.line;
    moduleSpan.set(nodeOf[i], span);
  }
}
const nodeOfName = new Map();
body.forEach((s, i) => {
  if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) nodeOfName.set(s.id.name, nodeOf[i]);
  else if (s.type === "VariableDeclaration") for (const d of s.declarations) for (const n of Object.keys(t.getBindingIdentifiers(d.id))) nodeOfName.set(n, nodeOf[i]);
});

// the same test rename.mjs uses for "names a variable"
function isVariableOccurrence(p) {
  const n = p.node, par = p.parent;
  if ((par.type === "MemberExpression" || par.type === "OptionalMemberExpression") && par.property === n && !par.computed) return false;
  if ((par.type === "ObjectProperty" || par.type === "ObjectMethod" || par.type === "ClassProperty" ||
       par.type === "ClassMethod" || par.type === "ClassAccessorProperty" || par.type === "ClassPrivateProperty") &&
      par.key === n && !par.computed) return false;
  if ((par.type === "LabeledStatement" || par.type === "BreakStatement" || par.type === "ContinueStatement") && par.label === n) return false;
  if (par.type === "ExportSpecifier" && par.exported === n) return false;
  if (par.type === "ExportNamespaceSpecifier" || par.type === "ExportDefaultSpecifier") return false;
  if (par.type === "ImportSpecifier" && par.imported === n) return false;
  if (par.type === "MetaProperty") return false;
  if (par.type === "PrivateName") return false;
  return true;
}
const refs = new Map();              // node -> Set<node>
const variableNames = new Set();     // every name used as a variable anywhere (bound or free)
const propertyNames = new Set();     // names used as a property or key somewhere (never a collision)
const writtenThrough = new Map();    // top-level name -> first line of `X.k = …`, `X.k++`, `delete X.k`
let programScope = null;
traverse(ast, {
  Program(prog) {
    programScope = prog.scope;
    prog.get("body").forEach((stmt, i) => {
      const from = nodeOf[i];
      const visit = (p) => {
        const name = p.node.name;
        if (!isVariableOccurrence(p)) { propertyNames.add(name); return; }
        variableNames.add(name);
        const b = p.scope.getBinding(name);
        if (!b || b.scope !== programScope) return;
        // a value must not be state (KIND): record writes through its binding
        const mem = p.parentPath;
        if ((mem.node.type === "MemberExpression" || mem.node.type === "OptionalMemberExpression") && mem.node.object === p.node && !writtenThrough.has(name)) {
          const up = mem.parentPath?.node;
          if ((up?.type === "AssignmentExpression" && up.left === mem.node) || up?.type === "UpdateExpression" ||
              (up?.type === "UnaryExpression" && up.operator === "delete")) writtenThrough.set(name, p.node.loc.start.line);
        }
        const to = nodeOfName.get(name);
        if (!to || to === from) return;
        if (!refs.has(from)) refs.set(from, new Set());
        refs.get(from).add(to);
      };
      stmt.traverse({ Identifier: visit });
    });
    prog.stop();
  },
});

// ---- ORIGIN evidence ----------------------------------------------------------
// a node's label names a symbol in it when there is one, so a verdict reads as
// "refers to the module that holds rehydrateSessionState", not just lines
const knownIn = new Map();
for (const [m, real] of Object.entries(rename)) { const n = nodeOfName.get(here(m)); if (n && !knownIn.has(n)) knownIn.set(n, real); }
function labelOf(node) {
  if (node.startsWith("M")) { const [a, b] = moduleSpan.get(node); return `the module at lines ${a}-${b}${knownIn.has(node) ? ` (${knownIn.get(node)})` : ""}`; }
  const s = body[+node.slice(1)];
  const name = s.id?.name ?? s.declarations?.[0]?.id?.name;
  return name ? `${name} @${s.loc.start.line}` : `the statement @${s.loc.start.line}`;
}
const inferredKeys = new Set(Object.keys(inferred));
const authoritative = Object.keys(rename).filter(m => !inferredKeys.has(m)); // upstream's own names
const blockIsFirstParty = (b) => b.mangled.some(m => Object.hasOwn(rename, m));
const vendorExport = new Set();
for (const b of blocksReport.blocks) if (!blockIsFirstParty(b)) for (const m of b.mangled) vendorExport.add(m);

// first-party: refers to a proven node (fixpoint); `fpWhy` keeps one witness,
// `tierOf` how strong it is. Seeds go in strongest first, and each tier is
// spread to its fixpoint before the next is seeded, so a node carries the
// strongest evidence that reaches it:
//   0  upstream's own names
//   1  reviewed inferred names (reported "through an inferred name")
//   2  inferred names registered allow-unproven: NOT evidence -- a node that
//      only they reach is unproven, exactly like one nothing reaches
const fpWhy = new Map(), tierOf = new Map();
function seed(n, why, tier) { if (n && !fpWhy.has(n)) { fpWhy.set(n, why); tierOf.set(n, tier); } }
function spreadFirstParty(tier) {
  for (let changed = true; changed;) {
    changed = false;
    for (const [n, out] of refs) {
      if (fpWhy.has(n)) continue;
      for (const x of out) if (fpWhy.has(x)) {
        fpWhy.set(n, `refers to ${labelOf(x)}`);
        tierOf.set(n, tier);
        changed = true; break;
      }
    }
  }
}
for (const m of authoritative) seed(nodeOfName.get(here(m)), `holds ${rename[m]}`, 0);
spreadFirstParty(0);
const isAsserted = (m) => Object.hasOwn(asserted, inferred[m]);
for (const m of inferredKeys) if (!isAsserted(m)) seed(nodeOfName.get(here(m)), `holds ${inferred[m]} (inferred)`, 1);
spreadFirstParty(1);
for (const m of inferredKeys) if (isAsserted(m)) seed(nodeOfName.get(here(m)), `holds ${inferred[m]} (asserted by hand, allow-unproven)`, 2);
spreadFirstParty(2);
// vendor: referenced by a vendor node (fixpoint)
const vendorWhy = new Map();
for (const m of vendorExport) { const n = nodeOfName.get(m); if (n && !vendorWhy.has(n)) vendorWhy.set(n, `holds vendor export ${m}`); }
for (let changed = true; changed;) {
  changed = false;
  for (const [n, out] of refs) {
    if (!vendorWhy.has(n)) continue;
    for (const x of out) if (!vendorWhy.has(x)) { vendorWhy.set(x, `referenced by vendor code in ${labelOf(n)}`); changed = true; }
  }
}
const blocks = [...blocksReport.blocks].sort((a, b) => a.line - b.line);
function origin(short, decl) {
  if (vendorExport.has(short)) return { ok: false, why: `vendor: exported by a vendor module's export block` };
  const node = nodeOfName.get(short);
  const scope = node.startsWith("M") ? `its module (lines ${moduleSpan.get(node).join("-")})` : "it";
  const fp = fpWhy.get(node), vd = vendorWhy.get(node);
  if (fp && vd) return { ok: false, why: `inconsistent: ${scope} ${fp}, but is ${vd}` };
  if (vd) return { ok: false, why: `vendor: ${scope} is ${vd}` };
  const tier = tierOf.get(node);
  if (fp && tier < 2) return { ok: true, why: `first-party${tier === 1 ? " (through an inferred name)" : ""}: ${scope} ${fp}` };
  if (fp) return { ok: false, unproven: true, why: `first-party only through a name asserted by hand, which is no evidence: ${scope} ${fp}` };
  let block = null;
  for (const b of blocks) if (b.line <= decl.line) block = b;
  const region = !block ? "above every export block"
    : `${blockIsFirstParty(block) ? "first-party" : "VENDOR"} region (nearest export block above: @${block.line} ${block.names.slice(0, 2).join(", ")})`;
  return { ok: false, unproven: true, why: `no reference evidence either way; position: ${region}` };
}

// ---- validate every entry -------------------------------------------------------
const takenReal = new Set([
  ...Object.values(rename), ...Object.values(inferred), ...Object.keys(subsys), ...Object.keys(index.symbols),
  ...blocksReport.blocks.flatMap(b => b.names), ...Object.keys(blocksReport.entryExports || {}),
]);
const takenElsewhere = new Set(otherBundleNames);
const subsystems = new Set(Object.values(subsys));
// top-level constants by their literal (KIND: a value must be the only one)
const valueHolders = new Map();
for (const [n, d] of decls) if (d.kind === "value") valueHolders.set(d.canonical, [...(valueHolders.get(d.canonical) ?? []), n]);
// every module initialiser's shape (KIND: an initialiser must not tie another)
let initShapes = null;
const seenShort = new Map(), seenName = new Map();
const problems = [], planned = [];
for (const e of entries) {
  const bad = (why) => problems.push(`${e.where}: ${e.short ?? "?"} -> ${e.name ?? "?"}: ${why}`);
  if (e.bad) { bad(e.bad); continue; }
  if (!e.short || !e.name || !e.subsystem) { bad("needs a short name, a real name and a subsystem"); continue; }
  // 2. KIND
  const d = decls.get(e.short);
  if (!d) { bad(`${e.short} is not a top-level declaration in ${path.basename(BUNDLE)}`); continue; }
  if (!isNameable(d)) { bad(`${e.short} @${d.line} is "${d.kind}" -- ${whyNotNameable(d)} (verify_inferred.mjs would refuse it)`); continue; }
  const kind = nameKind(d);
  if (kind === "moduleInit") {
    const sh = shapeOf(d);
    if (!sh.literals.length && !sh.values.length) { bad(`${e.short} @${d.line} is a module initialiser that holds no string literal and assigns no literal constant: nothing in it tells it from any other initialiser, so verify_inferred.mjs could never refute a wrong pin, and nothing in it is citable`); continue; }
    const { equal } = initialiserRivals(sh, e.short, initShapes ??= initialiserShapes(decls));
    if (equal.length) { bad(`${e.short} @${d.line} has exactly the shape of ${equal.length} other module initialiser(s) (${equal.slice(0, 4).map(n => `${n} @${decls.get(n).line}`).join(", ")}): verify_inferred.mjs checks an initialiser by its shape, and could not tell which one the name is on`); continue; }
  }
  if (kind === "value") {
    const twins = (valueHolders.get(d.canonical) ?? []).filter(n => n !== e.short);
    if (twins.length) { bad(`${e.short} @${d.line} holds \`${d.canonical.slice(0, 40)}\`, and so do ${twins.length} other top-level constant(s) (${twins.slice(0, 4).map(n => `${n} @${decls.get(n).line}`).join(", ")}): verify_inferred.mjs checks a constant by its literal, and could not tell which one the name is on`); continue; }
    const b = programScope.getBinding(here(e.short));
    const rebound = b?.constantViolations?.[0]?.node?.loc?.start.line;
    const through = writtenThrough.get(here(e.short));
    if (rebound || through) { bad(`${e.short} @${d.line} is ${rebound ? `reassigned at line ${rebound}` : `written through at line ${through}`}: that is state initialised with a literal, not a constant`); continue; }
  }
  // 3. FRESH
  if (Object.hasOwn(rename, e.short) || inferredKeys.has(e.short)) { bad(`${e.short} is already named ${rename[e.short] ?? inferred[e.short]}`); continue; }
  if (seenShort.has(e.short)) { bad(`${e.short} is also named at ${seenShort.get(e.short)}`); continue; }
  seenShort.set(e.short, e.where);
  // 5. NAME
  const nameProblems = [];
  const misspelled = spellingProblem(d, e.name);
  if (misspelled) nameProblems.push(misspelled);
  if (e.name.length < 8) nameProblems.push("shorter than 8 characters");
  if (!t.isValidIdentifier(e.name)) nameProblems.push("not a valid identifier");
  if (variableNames.has(e.name)) nameProblems.push(`already a variable or global in ${path.basename(BUNDLE)}`);
  if (takenReal.has(e.name)) nameProblems.push("already a real name in the rename/inferred/subsystem maps or an export block");
  else if (takenElsewhere.has(e.name)) nameProblems.push("already a real name in another bundle's maps (an unqualified citation of it would mean the daemon's)");
  if (seenName.has(e.name)) nameProblems.push(`also used at ${seenName.get(e.name)}`);
  seenName.set(e.name, e.where);
  // 6. PLACE
  if (!subsystems.has(e.subsystem) || !/^\d\d-/.test(e.subsystem)) nameProblems.push(`unknown subsystem "${e.subsystem}" (one of: ${[...subsystems].sort().join(", ")})`);
  // 4. ORIGIN
  const o = origin(e.short, d);
  if (!o.ok && !(o.unproven && e.allowUnproven)) nameProblems.push(o.why + (o.unproven ? " -- mark the entry allow-unproven only if you have read the body and know it is duoduo's" : ""));
  if (nameProblems.length) { for (const p of nameProblems) bad(p); continue; }
  planned.push({ ...e, decl: d, why: o.why, origin: o.ok ? o.why : `ASSERTED by hand (allow-unproven): ${o.why}`, weak: !o.ok, propertyToo: propertyNames.has(e.name) });
}

// ---- file conventions -------------------------------------------------------------
const canonical = (obj) => JSON.stringify(obj, null, 2) + "\n";
const sortedKeys = (obj) => Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k]]));
const conventions = [
  ["inferred_daemon.json", inferred, x => x],
  ["subsys_daemon.json", subsys, sortedKeys],
  ...(shapeFile ? [["inferred_daemon.shape.json", shapeFile, x => x]] : []),
  ...(assertedFile ? [["inferred_daemon.asserted.json", assertedFile, sortedKeys]] : []),
];
for (const [f, obj, norm] of conventions) {
  if (fs.readFileSync(mapPath(f), "utf8") !== canonical(norm(obj))) problems.push(`${f} is not in its usual layout (2-space JSON${norm === sortedKeys ? ", sorted keys" : ""}); normalise it by hand first rather than have this tool reformat it`);
}

console.error(`bundle: ${path.basename(BUNDLE)} (${isRecon ? "renamed recon" : "pretty"}), ${index.version}; maps: ${MAPS}`);
console.error(`module boundaries: ${wrappers.length ? `${wrappers.length} lazy-init wrappers (${[...ESM].join(", ")}), CommonJS wrappers (${CJS ?? "none"}) judged alone` : "none found; every statement judged alone"}`);
for (const p of planned) {
  console.error(`  ok   ${p.name} (${p.short}) -> ${p.subsystem}   [${p.decl.kind} @${p.decl.line}]`);
  console.error(`       ${p.weak ? "UNPROVEN " : ""}evidence: ${p.origin}${p.propertyToo ? `; note: "${p.name}" is also a property name somewhere (no collision)` : ""}`);
}
if (problems.length) {
  console.error(`\nREFUSED -- nothing written. ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

// ---- write ------------------------------------------------------------------------
const nextInferred = { ...inferred };
const nextSubsys = { ...subsys };
const nextShape = shapeFile ? { ...shapeFile, shapes: { ...shapeFile.shapes } } : null;
const nextAsserted = { ...asserted };
for (const p of planned) {
  nextInferred[p.short] = p.name;
  nextSubsys[p.name] = p.subsystem;
  if (nextShape) nextShape.shapes[p.name] = shapeOf(p.decl);
  if (p.weak) nextAsserted[p.name] = p.why;
}
const writes = [
  ["inferred_daemon.json", canonical(nextInferred)],
  ["subsys_daemon.json", canonical(sortedKeys(nextSubsys))],
  ...(nextShape ? [["inferred_daemon.shape.json", canonical(nextShape)]] : []),
  ...(planned.some(p => p.weak) ? [["inferred_daemon.asserted.json", canonical(sortedKeys(nextAsserted))]] : []),
];
if (DRY) console.error(`\ndry run: would register ${planned.length} name(s) in ${writes.map(w => w[0]).join(", ")}`);
else {
  for (const [f, text] of writes) fs.writeFileSync(mapPath(f), text);
  console.error(`\nregistered ${planned.length} name(s) in ${writes.map(w => w[0]).join(", ")}`);
  if (!nextShape) console.error("  no shape baseline in this maps dir: run `verify_inferred.mjs record` after review");
  console.error("  next: rebuild.sh (PKG=...) regenerates recon/, first-party/ and the symbol index; PROMOTE=1 after review");
}
// the citation form, one per line on stdout
for (const p of planned) console.log(`${p.name} (${p.short})`);
