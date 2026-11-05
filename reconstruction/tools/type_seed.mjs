// Type seeding: ask the TypeScript checker what it can infer about the
// reconstructed daemon once the bundle symbols that `@openduo/protocol` ships
// as TypeScript source carry the protocol's own signatures, and once those
// types have been carried along the call graph.
//
// Why: the naming passes (name_locals.mjs tasks, name_toplevel.mjs tasks) name
// a binding from how it is used; a type such as `SessionNotifyParams` or
// `MainSessionResolution` on a local says what flows through it better than
// the surrounding property accesses do, and the type name is the author's own
// vocabulary. TypeScript's JS inference (`allowJs` + `checkJs`) gives an
// unannotated parameter the type `any`, so by itself it says little about a
// minified bundle; but the protocol package publishes its `src/*.ts`, and
// maps/published_daemon.json records which bundle declarations are those
// published functions. Most of them are type guards (`isSessionNotifyParams
// (value: unknown): value is SessionNotifyParams`), and the checker narrows
// `any` through a type guard, so after `if (!isSessionNotifyParams(x)) throw`
// the checker knows `x`. The measurement is in VERIFICATION.md.
//
// How the signatures reach the bundle. A `.d.ts` overlay cannot retype a
// function the JS module itself declares (tried: a `declare function` in a
// sibling .d.ts leaves the bundle's declaration at `(e: any): any`; an ambient
// declaration never merges with a module's own binding). What works is a JSDoc
// `@type {typeof import("<protocol file>").<name>}` tag on the declaration in a
// TEMPORARY COPY of the recon bundle (`--seeded`, a build artifact under
// $OUT, never committed): the checker takes the tag as the declaration's
// type, parameters, return type and type predicate included, and the
// protocol's `.ts` files are in the same program so their aliases resolve. A
// published function that the bundle holds as `var x = <function>` gets the
// cast form `var x = /** @type {...} */ (<function>)` instead. The comment is
// inserted before the statement, outside the declaration's range, so the
// ordinal and ctx of every local (local_bindings.mjs) are the same as in
// `.build/daemon.recon.top.js`, the file name_locals.mjs reads; the tool
// shifts the binding offsets it computed on the original by the inserted
// text instead of re-parsing.
//
// Propagation. Seeding alone gains almost nothing (measured: locals with a
// known type 30.2% -> 30.6% at v0.8.7), for one reason: the checker never
// narrows a property access whose root is `any`, and the RPC router
// (`createDaemon`) validates `request.params` with `request` an unannotated
// parameter of the nested `handleRpcRequest`, then hands the object to a
// handler whose own parameter is unannotated too. Each round therefore looks
// at every identifier call the checker resolves to a function in the copy
// (top-level or nested function declaration, or a single-declarator `const f
// = function/arrow`) whose parameter is still `any`: when at least one call
// site passes an argument whose type is known (not any, unknown or never) and
// no site spreads its arguments, the parameter gets a `@param {<union of the
// site types>}` tag in the next copy, and the checker runs again, until a
// round adds nothing or --rounds is reached. `handleRpcRequest` thus receives
// `JsonRpcRequest` from the `isJsonRpcRequest` guard at its call site, the
// guards narrow `request.params`, and the handlers receive `Session*Params`.
// A site whose argument is `any` contributes nothing (it would make the
// union `any`), so a propagated type is what the typed callers pass, not
// necessarily everything the function ever receives; the output marks such a
// parameter `propagated`, counted apart from `typed`, and the return type of a
// function with a propagated parameter `propagated` as well (it was inferred
// under that union; a transitive dependency through a callee's propagated
// return is not traced). So that alias names print and resolve inside the
// copy, the copy starts with one `@typedef {import(...).T} T` per type the
// protocol exports. A printed type can contain `*/` (a string-literal type
// quoting a regular expression); it is written `*\/` so the comment does not
// end early, and every pass asserts that the copy has exactly the syntactic
// diagnostics of the original (none), else the tool stops with the first
// diagnostic's line: the checker's answers on an error-recovered file are
// not evidence.
//
// Which symbols are seeded: the published pairing (maps/published_daemon.json,
// evidence `published`; the protocol file the map names is used when it
// exports the name, else the first file that does, noted in the record), and
// with --same-name also every bundle symbol spelled exactly like a protocol
// export with the same arity (evidence `same-name`: inferred names that
// match_published_source.mjs confirmed before the published map existed, such
// as isJsonRpcRequest, without which the router's `request` stays `any`).
// Both classes are listed in the output.
//
// Output (--out), one JSON file:
//   { generatedBy, bundle, version, typescript, source, protocol: {dir, files:
//     {file: sha256}, exportedTypes}, seeding: {method, seededCopy, seeded:
//     [{name, file, publishedFile?, fileNote?, form, evidence}], notSeeded:
//     [{name, evidence, why}], rounds: [{round, propagated, declsAdded,
//     paramsAdded}], passes, syntacticDiagnostics: {original, copy}}, coverage:
//     {all, callsSeeded, protocolTyped, propagatedParams, propagatedReturns,
//     propagatedAll}, decls: {realName: {kind,
//     callsSeeded, seeded, params: [{name, type, kind}], returns: {type, kind},
//     locals: {"<ordinal>": {name, ctx, occ, type, kind}}}}, unnamed: {short:
//     {kind, params, returns}} }
//   `kind` of a type is `typed`, `propagated` (a parameter typed from its
//   call sites), `any`, `error` (the checker's error type, printed as any) or
//   `unknown`. `type` is typeToString with aliases kept and no truncation, cut
//   at 400 characters. `coverage` counts params, returns and locals that are
//   `typed` or `propagated`, overall and for the declarations that call a
//   seeded symbol, and how many of those name a protocol type alias.
// Readers: name_locals.mjs tasks --types (one line per pending local, matched
// by ordinal and checked by ctx), name_toplevel.mjs tasks --types (one
// `signature:` line per candidate, from `unnamed`), match_published_source.mjs
// --types (return-type class as an extra matching feature).
//
// Usage:
//   node type_seed.mjs <daemon.recon.js> <symbols_daemon.json> <published_daemon.json> \
//        --protocol <dir of the protocol src *.ts> --out <types_daemon.json> \
//        [--seeded <seeded copy.js>] [--same-name] [--no-seed] [--rounds <N, default 4>] [--heap <MB>]
// --no-seed runs the checker without the protocol signatures (the baseline the
// seeding is measured against; propagation still runs), --rounds 0 without
// propagation. The checker needs a large heap for a 4 MB module, so the tool
// re-executes itself with --max-old-space-size=<--heap, default 8192> unless
// the running node already has such a flag. Writes only --out and the copy.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { parse } from "@babel/parser";
import ts from "typescript";
import { collectLocals } from "./local_bindings.mjs";

const argv = process.argv.slice(2);
const opt = (name, dflt = null) => { const i = argv.indexOf(name); if (i < 0) return dflt; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const PROTOCOL = opt("--protocol"), OUT = opt("--out"), HEAP = Number(opt("--heap", "8192")), ROUNDS = Number(opt("--rounds", "4"));
const NO_SEED = flag("--no-seed"), SAME_NAME = flag("--same-name");
const SEEDED = opt("--seeded");
const [BUNDLE, SYMBOLS, PUBLISHED] = argv;
if (!BUNDLE || !SYMBOLS || !PUBLISHED || !PROTOCOL || !OUT) {
  console.error("usage: node type_seed.mjs <daemon.recon.js> <symbols_daemon.json> <published_daemon.json> --protocol <dir> --out <types.json> [--seeded <copy.js>] [--same-name] [--no-seed] [--rounds N] [--heap <MB>]");
  process.exit(2);
}
for (const [what, p, dir] of [["bundle", BUNDLE], ["symbols index", SYMBOLS], ["published map", PUBLISHED], ["--protocol directory", PROTOCOL, true]]) {
  if (!fs.existsSync(p) || (dir ? !fs.statSync(p).isDirectory() : !fs.statSync(p).isFile())) { console.error(`type_seed: ${what} ${p} is not an existing ${dir ? "directory" : "file"}`); process.exit(2); }
}
if (!process.execArgv.some((a) => a.startsWith("--max-old-space-size")) && !process.env.TYPE_SEED_CHILD) {
  const r = spawnSync(process.execPath, [`--max-old-space-size=${HEAP}`, ...process.execArgv, process.argv[1], ...process.argv.slice(2)], { stdio: "inherit", env: { ...process.env, TYPE_SEED_CHILD: "1" } });
  process.exit(r.status ?? 1);
}

const t0 = Date.now();
const secs = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;
const src = fs.readFileSync(BUNDLE, "utf8");
const symbols = JSON.parse(fs.readFileSync(SYMBOLS, "utf8"));
const symbolTable = symbols.symbols ?? symbols;
const published = JSON.parse(fs.readFileSync(PUBLISHED, "utf8"));
const realNames = new Set(Object.keys(symbolTable));
const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");

// ---- protocol side: exported declarations and type aliases per file ----------------
const protoFiles = fs.readdirSync(PROTOCOL).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts")).sort();
if (!protoFiles.length) { console.error(`type_seed: no .ts file in ${PROTOCOL}`); process.exit(2); }
const protoExports = new Map(); // name -> [{ file, form: "function" | "var", arity }], files in sort order
const protoTypes = new Map();   // exported type alias / interface name -> file
const protoHashes = {};
for (const file of protoFiles) {
  const text = fs.readFileSync(path.join(PROTOCOL, file), "utf8");
  protoHashes[file] = sha(text);
  const ast = parse(text, { sourceType: "module", plugins: ["typescript"], errorRecovery: true });
  const add = (name, rec) => { if (!protoExports.has(name)) protoExports.set(name, []); protoExports.get(name).push(rec); };
  for (const s of ast.program.body) {
    const decl = s.type === "ExportNamedDeclaration" ? s.declaration : s;
    if (!decl) continue;
    const exported = s.type === "ExportNamedDeclaration";
    if (decl.type === "TSTypeAliasDeclaration" || decl.type === "TSInterfaceDeclaration") { if (exported && !protoTypes.has(decl.id.name)) protoTypes.set(decl.id.name, file); continue; }
    if (!exported) continue;
    if (decl.type === "FunctionDeclaration" && decl.id) add(decl.id.name, { file, form: "function", arity: decl.params.length });
    else if (decl.type === "VariableDeclaration") for (const d of decl.declarations) if (d.id.type === "Identifier") add(d.id.name, { file, form: "var", arity: d.init && /Function/.test(d.init.type) ? d.init.params.length : null });
  }
}
const importPath = (file) => path.resolve(PROTOCOL, file.replace(/\.ts$/, "")).replace(/\\/g, "/");

// ---- bundle side: top-level statements, first-party locals ------------------------------
const ast = parse(src, { sourceType: "module", ranges: true, allowReturnOutsideFunction: true });
const topStatement = new Map(); // top-level binding name -> { statement, declarator|null, single }
for (const s of ast.program.body) {
  if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) topStatement.set(s.id.name, { statement: s, declarator: null, single: true });
  else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") topStatement.set(d.id.name, { statement: s, declarator: d, single: s.declarations.length === 1 });
}
const { program, decls } = collectLocals(ast, src, (n) => (realNames.has(n) ? n : undefined));

// ---- seeding: which names, and the JSDoc text for each --------------------------------------
// Evidence classes: `published` (the pairing maps/published_daemon.json records)
// and, with --same-name, `same-name` (a bundle symbol spelled exactly like a
// protocol export and with the same arity: an inferred name confirmed by
// match_published_source.mjs before published_daemon.json existed, such as
// isJsonRpcRequest). Both are reported, so a reader can discount the second.
const seeded = [], notSeeded = [];
const seedInserts = []; // { at, text }
const typedefHeader = [...protoTypes].map(([name, file]) => `/** @typedef {import(${JSON.stringify(importPath(file))}).${name}} ${name} */`).join("\n") + "\n";
seedInserts.push({ at: 0, text: typedefHeader });
const seedOne = (name, evidence, publishedFile = null) => {
  // the published map names the protocol file; it is preferred when that file
  // exports the name, else the first file in sort order that does (and the
  // seeded record says which was used and which the map named)
  const pes = protoExports.get(name);
  if (!pes) { notSeeded.push({ name, evidence, why: `not an exported declaration of any file in ${PROTOCOL}` }); return; }
  const pe = pes.find((x) => x.file === publishedFile) ?? pes[0];
  const fileNote = publishedFile && pe.file !== publishedFile ? `published map names ${publishedFile}; the name is exported by ${pes.map((x) => x.file).join(", ")}` : undefined;
  const top = topStatement.get(name);
  if (!top) { notSeeded.push({ name, evidence, why: "not a top-level declaration of the bundle" }); return; }
  if (NO_SEED) { notSeeded.push({ name, evidence, why: "--no-seed" }); return; }
  const fnNode = top.declarator ? top.declarator.init : top.statement;
  const bundleArity = fnNode && /Function/.test(fnNode.type) ? fnNode.params.length : null;
  if (bundleArity === null) { notSeeded.push({ name, evidence, why: `bundle declaration is ${fnNode?.type ?? "uninitialised"}, not a function` }); return; }
  if (pe.arity !== null && pe.arity !== bundleArity) { notSeeded.push({ name, evidence, why: `arity ${bundleArity} in the bundle, ${pe.arity} in the protocol` }); return; }
  const tag = `/** @type {typeof import(${JSON.stringify(importPath(pe.file))}).${name}} */`;
  const rec = { name, file: pe.file, publishedFile: publishedFile ?? undefined, fileNote, evidence };
  if (!top.declarator) { seedInserts.push({ at: top.statement.start, text: tag + "\n" }); seeded.push({ ...rec, form: "declaration" }); }
  else { seedInserts.push({ at: top.declarator.init.start, text: tag + " (" }, { at: top.declarator.init.end, text: ")" }); seeded.push({ ...rec, form: "cast" }); }
};
for (const [name, rec] of Object.entries(published)) {
  if (rec.verdict === "initialiser") { notSeeded.push({ name, evidence: "published", why: "module initialiser, no protocol declaration" }); continue; }
  seedOne(name, "published", typeof rec.file === "string" ? rec.file : null);
}
if (SAME_NAME) for (const name of protoExports.keys()) if (!(name in published) && realNames.has(name)) seedOne(name, "same-name");
const seededSet = new Set(seeded.map((s) => s.name));
const seededPath = SEEDED ?? path.join(path.dirname(OUT), "daemon.recon.seeded.js");
console.error(`type_seed: ${seeded.length} seeded (${seeded.filter((s) => s.evidence === "same-name").length} by name only, ${seeded.filter((s) => s.form === "cast").length} as cast), ${notSeeded.length} not seeded, ${protoTypes.size} protocol type aliases (${secs()})`);

// ---- one checker pass over a copy with the given inserts ------------------------------------
const options = {
  allowJs: true, checkJs: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, skipLibCheck: true, types: [], noErrorTruncation: true,
};
const FMT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const MAX_TYPE = 400, MAX_INJECT = 1500;
// A printed type can contain `*/` (a string-literal type quoting a regular
// expression source, as marked's attribute pattern does), which would end the
// JSDoc comment and leave the copy unparsable. `*\/` reads as `*/` inside a
// string literal and ends nothing. Every pass still asserts that the copy has
// exactly the syntactic diagnostics the original has (none, for a bundle
// esbuild wrote): the checker's answers on an error-recovered file are not
// evidence.
const jsdocSafe = (type) => type.replace(/\*\//g, "*\\/");
const originalParseDiagnostics = ts.createSourceFile(path.resolve(BUNDLE), src, options.target, true, ts.ScriptKind.JS).parseDiagnostics.length;
let passes = 0;
function pass(inserts) {
  inserts = [...inserts].sort((a, b) => a.at - b.at);
  let text = "", pos = 0;
  for (const ins of inserts) { text += src.slice(pos, ins.at) + ins.text; pos = ins.at; }
  text += src.slice(pos);
  fs.writeFileSync(seededPath, text);
  const shift = (offset) => { let delta = 0; for (const ins of inserts) { if (ins.at <= offset) delta += ins.text.length; else break; } return offset + delta; };
  const unshift = (seededOffset) => { let delta = 0; for (const ins of inserts) { if (ins.at + delta + ins.text.length <= seededOffset) delta += ins.text.length; else break; } return seededOffset - delta; };
  const roots = [path.resolve(seededPath), ...protoFiles.map((f) => path.resolve(PROTOCOL, f))];
  const tsProgram = ts.createProgram(roots, options);
  const checker = tsProgram.getTypeChecker();
  const sf = tsProgram.getSourceFile(path.resolve(seededPath));
  if (!sf) { console.error("type_seed: the checker did not load the seeded copy"); process.exit(1); }
  passes++;
  const diags = tsProgram.getSyntacticDiagnostics(sf);
  if (diags.length !== originalParseDiagnostics) {
    const d = diags[0], where = d ? sf.getLineAndCharacterOfPosition(d.start) : null;
    console.error(`type_seed: the seeded copy ${seededPath} has ${diags.length} syntactic diagnostic(s), the original ${originalParseDiagnostics}` +
      (d ? `; first at line ${where.line + 1}:${where.character + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}` : ""));
    process.exit(1);
  }
  const identAt = new Map();
  const calls = [];
  const walk = (n) => { if (ts.isIdentifier(n)) identAt.set(n.getStart(sf), n); else if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) calls.push(n); ts.forEachChild(n, walk); };
  walk(sf);
  const describe = (type, enclosing) => {
    if (!type) return { type: "any", kind: "error" };
    if (type.flags & ts.TypeFlags.Any) return { type: "any", kind: type.intrinsicName === "error" ? "error" : "any" };
    if (type.flags & ts.TypeFlags.Unknown) return { type: "unknown", kind: "unknown" };
    return { type: checker.typeToString(type, enclosing, FMT), kind: "typed" };
  };
  const typeAt = (node) => describe(checker.getTypeAtLocation(node), sf);
  const functionNodeOf = (idNode) => {
    const p = idNode.parent;
    if (ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p)) return p;
    if (ts.isVariableDeclaration(p) && p.initializer) {
      let init = p.initializer;
      while (ts.isParenthesizedExpression(init)) init = init.expression;
      if (ts.isFunctionExpression(init) || ts.isArrowFunction(init) || ts.isClassExpression(init)) return init;
    }
    return null;
  };
  const signatureOf = (fnNode) => {
    const sig = checker.getSignatureFromDeclaration(fnNode);
    if (!sig) return null;
    const params = fnNode.parameters.map((p) => ({ name: p.name.getText(sf), ...typeAt(p.name) }));
    return { params, returns: describe(checker.getReturnTypeOfSignature(sig), sf) };
  };
  return { checker, sf, identAt, calls, shift, unshift, typeAt, functionNodeOf, signatureOf, programFiles: tsProgram.getSourceFiles().length };
}

// ---- rounds: seed, then propagate parameter types from call sites --------------------------
// A callee is any function the checker resolves an identifier call to, in the
// bundle copy: a top-level or nested function declaration, or a `const f =
// function/arrow` with a single declarator (JSDoc on the variable statement
// reaches the initialiser). The router's `handleRpcRequest(request, ...)` is
// such a nested function, and the only way the guards' narrowing of
// `request.params` can happen at all: the checker never narrows a property
// access whose root is `any`, so `request` must first become JsonRpcRequest.
const propagated = new Map(); // original statement offset -> { name, tags: [{ index, type, name, idStart }] }
const propagatedIds = new Set(); // original offsets of parameter identifiers typed from call sites
const rounds = [];
const calleeOf = (decl) => { // TS declaration -> { fn, stmt } or null
  if (!decl) return null;
  if (ts.isFunctionDeclaration(decl)) return decl.body ? { fn: decl, stmt: decl } : null;
  if (ts.isVariableDeclaration(decl) && decl.initializer) {
    let init = decl.initializer;
    while (ts.isParenthesizedExpression(init)) init = init.expression;
    if (!(ts.isFunctionExpression(init) || ts.isArrowFunction(init))) return null;
    const list = decl.parent, stmt = list.parent;
    if (!ts.isVariableDeclarationList(list) || !ts.isVariableStatement(stmt) || list.declarations.length !== 1) return null;
    return { fn: init, stmt };
  }
  return null;
};
let inserts = seedInserts, P = null;
for (let round = 0; round <= ROUNDS; round++) {
  P = pass(inserts);
  const added = [];
  if (round < ROUNDS) {
    const byCallee = new Map(); // stmt original offset -> { name, fn, stmtStart, sites: [[type...]|null] }
    for (const call of P.calls) {
      const sym = P.checker.getSymbolAtLocation(call.expression);
      const decl = sym?.valueDeclaration;
      if (!decl || decl.getSourceFile() !== P.sf) continue;
      const c = calleeOf(decl);
      if (!c) continue;
      const name = call.expression.text;
      const topLevel = c.stmt.parent === P.sf;
      if (topLevel && seededSet.has(name)) continue;
      const key = P.unshift(c.stmt.getStart(P.sf));
      const rec = byCallee.get(key) ?? { name, fn: c.fn, topLevel, sites: [] };
      rec.sites.push(call.arguments.some((a) => ts.isSpreadElement(a)) ? null : call.arguments.map((a) => P.checker.getTypeAtLocation(a)));
      byCallee.set(key, rec);
    }
    for (const [key, rec] of byCallee) {
      if (rec.sites.some((s) => s === null)) continue;
      const have = propagated.get(key) ?? { name: rec.name, tags: [] };
      const before = have.tags.length;
      const haveIdx = new Set(have.tags.map((h) => h.index));
      rec.fn.parameters.forEach((p, i) => {
        if (haveIdx.has(i) || p.dotDotDotToken) return;
        const current = P.checker.getTypeAtLocation(p.name);
        if (!(current.flags & ts.TypeFlags.Any)) return;
        const parts = new Set();
        for (const s of rec.sites) {
          const t = s[i];
          if (!t || t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) continue;
          parts.add(P.checker.typeToString(t, P.sf, FMT));
        }
        if (!parts.size) return;
        const type = [...parts].join(" | ");
        if (type.length > MAX_INJECT) return;
        have.tags.push({ index: i, type, name: ts.isIdentifier(p.name) ? p.name.text : `param${i}`, idStart: P.unshift(p.name.getStart(P.sf)) });
      });
      if (have.tags.length > before) { propagated.set(key, have); added.push(rec.name); }
    }
    for (const [key, have] of propagated) {
      // one tag per parameter up to the last typed one: the checker matches a
      // tag to a destructured parameter by position among all @param tags
      const last = Math.max(...have.tags.map((t) => t.index));
      const lines = [];
      for (let i = 0; i <= last; i++) { const t = have.tags.find((x) => x.index === i); lines.push(t ? ` * @param {${jsdocSafe(t.type)}} ${t.name}` : ` * @param {*} param${i}`); }
      inserts = inserts.filter((x) => x.tag !== key).concat({ at: key, text: `/**\n${lines.join("\n")}\n */\n`, tag: key });
    }
  }
  // the last record is always declsAdded 0: either this round added nothing
  // (and P already reflects every tag), or round == ROUNDS checked the tags of
  // the previous round without propagating (`propagated: false`)
  rounds.push({ round, propagated: round < ROUNDS, declsAdded: added.length, paramsAdded: [...propagated.values()].reduce((n, h) => n + h.tags.length, 0) });
  console.error(`type_seed: round ${round}: program of ${P.programFiles} files, ${round < ROUNDS ? `${added.length} function(s) got call-site parameter types` : "check only (--rounds reached)"} (${secs()})`);
  if (!added.length) break;
}
for (const have of propagated.values()) for (const t of have.tags) propagatedIds.add(t.idStart);
const propagatedCount = [...propagated.values()].reduce((n, h) => n + h.tags.length, 0);
const propagatedTopLevel = [...propagated.keys()].filter((k) => [...topStatement.values()].some((t) => t.statement.start === k)).length;
console.error(`type_seed: ${propagatedCount} parameter(s) in ${propagated.size} function(s) (${propagatedTopLevel} top-level) typed from call sites (${secs()})`);
const markProp = (d, idStart) => (d.kind === "typed" && propagatedIds.has(idStart) ? { ...d, kind: "propagated" } : d);
// a return type inferred in a function whose parameter was typed from its call
// sites rests on that (possibly narrower than reality) union: `propagated` too,
// so a reader (match_published_source.mjs --types) can refuse to treat it as solid
const markReturn = (ret, params) => (ret.kind === "typed" && params.some((p) => p.kind === "propagated") ? { ...ret, kind: "propagated" } : ret);

// ---- first-party declarations ---------------------------------------------------------------
const out = {};
const empty = () => ({ params: [0, 0], returns: [0, 0], locals: [0, 0] });
const cov = { all: empty(), callsSeeded: { ...empty(), decls: 0 }, protocolTyped: { locals: 0, params: 0, returns: 0 }, propagatedParams: 0, propagatedReturns: 0 };
const protoTypeRe = protoTypes.size ? new RegExp(`\\b(${[...protoTypes.keys()].join("|")})\\b`) : null;
const known = (d) => d.kind === "typed" || d.kind === "propagated";
const count = (bucket, field, d) => { bucket[field][1]++; if (known(d)) bucket[field][0]++; };
const isProto = (d) => known(d) && protoTypeRe && protoTypeRe.test(d.type);
const cut = (d) => (d.type.length > MAX_TYPE ? { ...d, type: d.type.slice(0, MAX_TYPE) + "…" } : d);
for (const [real, d] of decls) {
  const idNode = P.identAt.get(P.shift(d.path.node.id.start));
  if (!idNode) { console.error(`type_seed: ${real}: no identifier at its offset in the seeded copy`); continue; }
  const callsSeeded = d.occurrences.some((o) => o.binding && o.binding.scope === program && seededSet.has(o.node.name));
  const entry = { kind: symbolTable[real]?.kind ?? "?", callsSeeded, seeded: seededSet.has(real) };
  const fn = P.functionNodeOf(idNode);
  if (fn && !ts.isClassDeclaration(fn) && !ts.isClassExpression(fn)) {
    const sig = P.signatureOf(fn);
    if (sig) {
      entry.params = sig.params.map((p, i) => cut(markProp(p, P.unshift(fn.parameters[i].name.getStart(P.sf)))));
      entry.returns = cut(markReturn(sig.returns, entry.params));
    }
  } else entry.value = cut(P.typeAt(idNode));
  entry.locals = {};
  for (const e of d.bindings) {
    const node = P.identAt.get(P.shift(e.binding.identifier.start));
    const td = node ? P.typeAt(node) : { type: "any", kind: "error" };
    entry.locals[e.ordinal] = { name: e.name, ctx: e.ctx, occ: e.occ, ...cut(markProp(td, e.binding.identifier.start)) };
  }
  const buckets = [cov.all]; if (callsSeeded) { buckets.push(cov.callsSeeded); cov.callsSeeded.decls++; }
  for (const b of buckets) {
    for (const p of entry.params ?? []) count(b, "params", p);
    if (entry.returns) count(b, "returns", entry.returns);
    for (const l of Object.values(entry.locals)) count(b, "locals", l);
  }
  for (const p of entry.params ?? []) { if (isProto(p)) cov.protocolTyped.params++; if (p.kind === "propagated") cov.propagatedParams++; }
  if (entry.returns && isProto(entry.returns)) cov.protocolTyped.returns++;
  if (entry.returns?.kind === "propagated") cov.propagatedReturns++;
  for (const l of Object.values(entry.locals)) if (isProto(l)) cov.protocolTyped.locals++;
  out[real] = entry;
}
console.error(`type_seed: ${Object.keys(out).length} first-party declarations typed (${secs()})`);

// ---- unnamed top-level functions: signature only (name_toplevel.mjs tasks --types) -------------
const unnamed = {};
for (const [short, top] of topStatement) {
  if (realNames.has(short)) continue;
  const idNode = P.identAt.get(P.shift(top.declarator ? top.declarator.id.start : top.statement.id.start));
  if (!idNode) continue;
  const fn = P.functionNodeOf(idNode);
  if (!fn || ts.isClassDeclaration(fn) || ts.isClassExpression(fn)) continue;
  const sig = P.signatureOf(fn);
  if (sig) {
    const params = sig.params.map((p, i) => cut(markProp(p, P.unshift(fn.parameters[i].name.getStart(P.sf)))));
    unnamed[short] = { kind: "function", params, returns: cut(markReturn(sig.returns, params)) };
  }
}
console.error(`type_seed: ${Object.keys(unnamed).length} unnamed top-level functions (${secs()})`);

const pct = ([n, d]) => (d ? `${((100 * n) / d).toFixed(1)}% (${n}/${d})` : "n/a");
const coverage = {
  all: cov.all,
  callsSeeded: cov.callsSeeded,
  protocolTyped: cov.protocolTyped,
  propagatedParams: cov.propagatedParams,
  propagatedReturns: cov.propagatedReturns,
  propagatedAll: { params: propagatedCount, functions: propagated.size, topLevel: propagatedTopLevel },
};
fs.writeFileSync(OUT, JSON.stringify({
  generatedBy: "type_seed.mjs", bundle: symbols.bundle ?? "daemon", version: symbols.version ?? null, typescript: ts.version,
  source: path.basename(BUNDLE), protocol: { dir: path.resolve(PROTOCOL), files: protoHashes, exportedTypes: protoTypes.size },
  seeding: { method: NO_SEED ? "none (--no-seed)" : "jsdoc @type {typeof import(...).name} in a temporary copy", seededCopy: seededPath, seeded, notSeeded, rounds, passes, syntacticDiagnostics: { original: originalParseDiagnostics, copy: originalParseDiagnostics } },
  coverage, decls: out, unnamed,
}, null, 1) + "\n");
console.log(`type_seed: ${seeded.length} seeded symbol(s), ${rounds.length - 1} propagation round(s); known (typed or propagated) overall: params ${pct(cov.all.params)}, returns ${pct(cov.all.returns)}, locals ${pct(cov.all.locals)}`);
console.log(`type_seed: in the ${cov.callsSeeded.decls} declaration(s) that call a seeded symbol: params ${pct(cov.callsSeeded.params)}, returns ${pct(cov.callsSeeded.returns)}, locals ${pct(cov.callsSeeded.locals)}`);
console.log(`type_seed: naming a protocol type: locals ${cov.protocolTyped.locals}, params ${cov.protocolTyped.params}, returns ${cov.protocolTyped.returns}; parameters typed from call sites ${cov.propagatedParams}, returns resting on them ${cov.propagatedReturns} -> ${OUT} (${secs()})`);
