// Persistent, content-derived IDs for inferred names, so that the short-keyed
// map maps/inferred_<bundle>.json becomes a derived artifact instead of the
// thing a bump has to re-anchor.
//
// Why this exists: maps/inferred_<bundle>.json is keyed by esbuild's short
// names, and esbuild re-picks every short name on every build (the name is the
// rank of the symbol's use count, shuffled by the bundle's character
// frequencies), so every release puts every key on different code. bump.sh
// carries the names across by structural identity (remap_inferred.mjs), and
// that works, but the carried map is a new hand-reviewed artifact every time,
// the name is still *keyed* by something that means nothing across releases,
// and nothing in the repository says which declaration a name was assigned
// to in a form that outlives the release. This tool gives each inferred name a
// key that is a function of the declaration's content, in the way Quilt's
// Hashed Mojmap keys a member by the hash of its own description and adds a
// disambiguator only where that is not unique:
//
//   id = <kind>_<16 hex of the structural signature>[+<disambiguator>...]
//
//   kind       f_ function-like, m_ esbuild module initialiser, v_ literal
//              constant (the three kinds verify_inferred.mjs accepts; the
//              prefix is the kind's initial)
//   signature  structural_signature.mjs: bound identifiers and references to
//              other top-level symbols become positional slots, literals,
//              property names and globals are kept. The 16 hex characters are
//              the first 16 of the same sha256 symbols_<bundle>.json records
//              as `signature`, so the two can be compared by eye.
//   twins      several declarations of the bundle with one signature (zod's
//              locale stubs; isSupportedRuntime and isKnownRuntimeValue, which
//              differ only in which top-level constant they read). Only then
//              is a disambiguator appended, as few as needed:
//                c:<12 hex>     the sorted set of NAMED callees (real names of
//                               the top-level symbols the body refers to: an
//                               __export block name, an entry export, or an
//                               inferred name); for a constant, its named
//                               READERS, since a literal refers to nothing
//                               and verify_inferred.mjs tells twin constants
//                               apart by who reads them
//                p:<n>/<total>  the ordinal among the twins that share the
//                               callee set too, in bundle order, with the
//                               size of that group; the least stable, so last
//              The research record's design had a first disambiguator, the
//              rarest string literal of the body, before the callee set. It is
//              not implemented, with this reason: the structural signature
//              keeps every string literal verbatim, so two declarations with
//              one signature always have the same literals, and a literal can
//              never tell them apart.
//
// What stays and what changes: maps/inferred_<bundle>.json stays, every tool
// keeps reading it, but it is now reproducible from maps/ids_<bundle>.json
// plus the bundle (`resolve`), and rebuild.sh's gate <bundle>.idsResolve
// checks that it is (`check`). On a bump, `resolve` on the new bundle carries
// every name whose id still resolves -- unchanged bodies, and twins whose
// callee set or ordinal is unchanged -- and only the rest goes through
// remap_inferred.mjs, anchor_candidates.mjs and confirm_reanchor.mjs as
// RE-ANCHOR (bump.sh step 2). An id changes exactly when the hashed content
// changes, so a changed body is a changed id: this shrinks the alignment
// problem to the change set, it does not remove it (Quilt's RFC says the same
// of Hashed Mojmap).
//
// Resolution is a fixpoint, because a c: disambiguator depends on which
// callees are named: the known names start as the bundle's __export block and
// entry-export names, every resolved inferred name is added, ids are
// recomputed, and this repeats until nothing changes. A name is resolved only
// when its id matches exactly one declaration under the FINAL set of known
// names; a match that held only under a partial set is dropped again. Two
// entries that resolve to one declaration are both unresolved (conflict), and
// so is an entry resolving to a declaration an __export block now names (the
// name is upstream's now). Every unresolved name is reported with the reason:
//   no declaration with that signature   the body changed (RE-ANCHOR)
//   kind mismatch                        the signature exists under another kind
//   twins unresolved                     the twin group changed: no twin has
//                                        the recorded disambiguator, or the id
//                                        has none and the group grew
//   conflict / now exported              as above
//
// Usage (run from reconstruction/; --blocks <blocks_<bundle>.json> reuses an
// export_blocks.mjs result instead of recomputing it; --report <o.json> writes
// every per-name outcome):
//   node symbol_ids.mjs assign  <pretty.js> <inferred.json> <ids.json> --version v<X.Y.Z> [--rekey] [--carry <old>=<new>]...
//       adds an id for every name of the short-keyed map that the ids map
//       lacks (`since` = --version), keeps an entry whose id still matches,
//       REFUSES one whose recomputed id differs unless --rekey (a re-anchored
//       or rewritten declaration: the id is replaced and `since` updated),
//       removes entries whose name the short-keyed map no longer has, and
//       --carry moves an entry to a new spelling first (name_symbol.mjs on a
//       rename). Exit 0 written, 1 refused.
//   node symbol_ids.mjs resolve <pretty.js> <ids.json> <out inferred.json> [--order <inferred.json>]
//       computes the ids of every top-level declaration of the bundle and
//       writes the short-keyed map of the names that resolve (in the order
//       of --order's real names when given, else the ids map's). Exit 0; the
//       unresolved names are listed with their reason (and in --report).
//   node symbol_ids.mjs check   <pretty.js> <ids.json> <inferred.json>
//       resolve, then compare with the short-keyed map: exit 0 when they are
//       the same set of (short, real) pairs, 1 otherwise, printing every
//       difference (missing: in the map, unresolved; moved: resolved onto
//       another declaration than the map's; extra: resolved, not in the map;
//       no id: in the map, not in the ids map -- run assign). Against a
//       hand-reviewed map of the next release this is the fixture score:
//       moved + extra are resolved-wrong, missing is unresolved, no id is
//       that release's new registrations.
// Writes only the named output (assign: the ids map; resolve: the out map;
// --report). The ids map is { realName: { id, kind, disamb: null|{by, value},
// since } }, keys sorted. Exit 2 on a usage error.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { signature, signatureContext } from "./structural_signature.mjs";
import { topLevelDeclarations, isNameable, nameKind } from "./verify_inferred.mjs";
const traverse = _traverse.default || _traverse;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PREFIX = { function: "f", moduleInit: "m", value: "v" };
const KIND_OF_PREFIX = { f: "function", m: "moduleInit", v: "value" };
const hashOf = (text, n) => crypto.createHash("sha256").update(text).digest("hex").slice(0, n);

// the same test rename.mjs and name_symbol.mjs use for "names a variable"
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

// Parse a bundle once: every nameable top-level declaration with its kind and
// base id (kind + signature), in bundle order, plus the reference graph over
// top-level bindings (refs: who a declaration refers to; readers: who refers
// to a declaration), resolved through Babel's scopes.
export function analyseBundle(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const ctx = signatureContext(ast);
  const decls = topLevelDeclarations(ast);
  const order = [];            // nameable names, bundle order
  const info = new Map();      // name -> { kind, line, base }
  const add = (name, node, line) => {
    const d = decls.get(name);
    if (!d || !isNameable(d) || info.has(name)) return;
    const kind = nameKind(d);
    // the statement for a function/class declaration, the initializer for a
    // var: the node symbol_index.mjs hashes, so the 16 hex are its prefix
    info.set(name, { kind, line, base: `${PREFIX[kind]}_${signature(node, ctx).slice(0, 16)}` });
    order.push(name);
  };
  for (const stmt of ast.program.body) {
    if ((stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") && stmt.id) add(stmt.id.name, stmt, stmt.loc.start.line);
    else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) if (d.id.type === "Identifier" && d.init) add(d.id.name, d.init, d.id.loc.start.line);
  }
  // reference graph, attributed per declarator so `var a = f1, b = f2` keeps
  // each initializer's references apart
  const refs = new Map(), readers = new Map();
  const edge = (from, to) => {
    if (!refs.has(from)) refs.set(from, new Set());
    refs.get(from).add(to);
    if (!readers.has(to)) readers.set(to, new Set());
    readers.get(to).add(from);
  };
  traverse(ast, {
    Program(prog) {
      const programScope = prog.scope;
      const visitFrom = (owner, p) => {
        const idp = p.node.id;
        p.traverse({
          Identifier(ip) {
            if (ip.node === idp || !isVariableOccurrence(ip)) return;
            const name = ip.node.name;
            if (name === owner) return;
            const b = ip.scope.getBinding(name);
            if (!b || b.scope !== programScope) return;
            edge(owner, name);
          },
        });
      };
      for (const sp of prog.get("body")) {
        const s = sp.node;
        if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) visitFrom(s.id.name, sp);
        else if (s.type === "VariableDeclaration") for (const dp of sp.get("declarations")) if (dp.node.id.type === "Identifier") visitFrom(dp.node.id.name, dp);
      }
      prog.stop();
    },
  });
  return { ast, decls, order, info, refs, readers };
}

// The names upstream's bundle itself carries: __export block names and the
// entry exports, mangled -> real (export_blocks.mjs, run here unless a result
// is given). Vendor blocks count too: the question is whether a callee has a
// stable spelling, not whose code it is.
export function exportNames(prettyPath, blocksJson) {
  let blocks;
  if (blocksJson) blocks = JSON.parse(fs.readFileSync(blocksJson, "utf8"));
  else {
    const r = spawnSync(process.execPath, ["--max-old-space-size=8192", path.join(HERE, "export_blocks.mjs"), prettyPath], { encoding: "utf8", maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`export_blocks.mjs failed on ${prettyPath}:\n${r.stderr}`);
    blocks = JSON.parse(r.stdout);
  }
  const out = new Map();
  for (const b of blocks.blocks ?? []) b.mangled.forEach((m, i) => { if (!out.has(m)) out.set(m, b.names[i]); });
  for (const [real, m] of Object.entries(blocks.entryExports ?? {})) if (!out.has(m)) out.set(m, real);
  return out;
}

// the callee-set hash of one declaration under a set of known names
function calleeHash(A, name, known) {
  const set = A.info.get(name).kind === "value" ? A.readers.get(name) : A.refs.get(name);
  const names = [...new Set([...(set ?? [])].map(x => known.get(x)).filter(Boolean))].sort();
  return hashOf(JSON.stringify(names), 12);
}

// name -> { id, kind, disamb } for every nameable declaration, under `known`
// (mangled -> real). Ids are unique by construction.
export function computeIds(A, known) {
  const groups = new Map();
  for (const n of A.order) { const b = A.info.get(n).base; if (!groups.has(b)) groups.set(b, []); groups.get(b).push(n); }
  const out = new Map();
  for (const [base, members] of groups) {
    const kind = A.info.get(members[0]).kind;
    if (members.length === 1) { out.set(members[0], { id: base, kind, disamb: null }); continue; }
    const ch = new Map(members.map(m => [m, calleeHash(A, m, known)]));
    const sub = new Map();
    for (const m of members) { const c = ch.get(m); if (!sub.has(c)) sub.set(c, []); sub.get(c).push(m); }
    for (const m of members) {
      const c = ch.get(m), peers = sub.get(c);
      if (peers.length === 1) out.set(m, { id: `${base}+c:${c}`, kind, disamb: { by: "c", value: `c:${c}` } });
      else { const v = `c:${c}+p:${peers.indexOf(m) + 1}/${peers.length}`; out.set(m, { id: `${base}+${v}`, kind, disamb: { by: "p", value: v } }); }
    }
  }
  return out;
}

// Resolve an ids map against a bundle (header: fixpoint over the known names).
// -> { resolved: Map real -> short, reasons: Map real -> why, iterations, ids }
export function resolveIds(A, exported, idsMap) {
  const known = new Map(exported);
  const exportedShort = new Set(exported.keys());
  const resolved = new Map();
  const reasons = new Map();
  let iterations = 0, cur = null;
  for (let changed = true; changed;) {
    changed = false; iterations++;
    cur = computeIds(A, known);
    const byId = new Map(), byBase = new Map(), kindsOfHash = new Map();
    for (const [n, r] of cur) {
      byId.set(r.id, n);
      const base = A.info.get(n).base;
      if (!byBase.has(base)) byBase.set(base, []);
      byBase.get(base).push(n);
      const h = base.slice(2);
      if (!kindsOfHash.has(h)) kindsOfHash.set(h, new Set());
      kindsOfHash.get(h).add(r.kind);
    }
    // a resolution must hold under the current names; one that no longer does is dropped
    for (const [real, short] of [...resolved]) {
      if (byId.get(idsMap[real].id) === short) continue;
      resolved.delete(real); known.delete(short); changed = true;
      reasons.set(real, "resolution did not hold under the final set of known names");
    }
    const hits = new Map(); // short -> [reals]
    for (const [real, e] of Object.entries(idsMap)) {
      if (resolved.has(real)) continue;
      const hit = byId.get(e.id);
      if (hit) { if (!hits.has(hit)) hits.set(hit, []); hits.get(hit).push(real); continue; }
      const base = e.id.split("+")[0], members = byBase.get(base) ?? [];
      let why;
      if (!members.length) {
        const kinds = kindsOfHash.get(base.slice(2));
        why = kinds ? `kind mismatch: the signature is on ${[...kinds].join("/")} code, the id says ${KIND_OF_PREFIX[base[0]] ?? e.kind}` : "no declaration with that signature";
      } else if (!e.id.includes("+")) why = `twins unresolved: ${members.length} declarations share the signature and the id has no disambiguator`;
      else why = `twins unresolved: ${members.length} declarations share the signature, none has ${e.id.slice(base.length + 1)} (they have ${members.map(m => cur.get(m).id.slice(base.length + 1) || "no disambiguator").join(", ")})`;
      reasons.set(real, why);
    }
    for (const [short, reals] of hits) {
      // a hand-edited ids map can hold one id twice: never two names on one declaration
      const holder = [...resolved].find(([, s]) => s === short)?.[0];
      if (holder) reals.push(holder);
      if (reals.length > 1) { for (const r of reals) reasons.set(r, `conflict: ${reals.join(", ")} all resolve to ${short}`); if (holder) { resolved.delete(holder); known.delete(short); changed = true; } continue; }
      if (exportedShort.has(short)) { reasons.set(reals[0], `now exported: ${short} is named ${exported.get(short)} by an __export block or entry export`); continue; }
      resolved.set(reals[0], short); known.set(short, reals[0]); reasons.delete(reals[0]); changed = true;
    }
  }
  return { resolved, reasons, iterations, ids: cur };
}

// ---- CLI --------------------------------------------------------------------------
function usage() {
  console.error("usage: node symbol_ids.mjs assign  <pretty.js> <inferred.json> <ids.json> --version v<X.Y.Z> [--rekey] [--carry <old>=<new>]... [--blocks <b.json>] [--report <o.json>]\n" +
                "       node symbol_ids.mjs resolve <pretty.js> <ids.json> <out inferred.json> [--order <inferred.json>] [--blocks <b.json>] [--report <o.json>]\n" +
                "       node symbol_ids.mjs check   <pretty.js> <ids.json> <inferred.json> [--blocks <b.json>] [--report <o.json>]");
  process.exit(2);
}
function main() {
  const argv = process.argv.slice(2);
  const opt = (name) => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v; };
  const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
  const VERSION = opt("--version"), BLOCKS = opt("--blocks"), REPORT = opt("--report"), ORDER = opt("--order");
  const REKEY = flag("--rekey");
  const carries = [];
  for (let v; (v = opt("--carry")) !== null;) { const m = v.match(/^([^=]+)=([^=]+)$/); if (!m) usage(); carries.push([m[1], m[2]]); }
  const [MODE, PRETTY, A1, A2] = argv;
  if (!["assign", "resolve", "check"].includes(MODE) || !PRETTY || !A1 || !A2 || argv.length !== 4) usage();
  if (MODE === "assign" && !VERSION) { console.error("assign needs --version v<X.Y.Z> (the release the new ids are assigned on)"); process.exit(2); }
  const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  const canonical = (obj) => JSON.stringify(obj, null, 2) + "\n";
  const sortedKeys = (obj) => Object.fromEntries(Object.keys(obj).sort().map(k => [k, obj[k]]));
  const counts = (ids) => { const c = { none: 0, c: 0, p: 0 }; for (const e of ids) c[e.disamb ? e.disamb.by : "none"]++; return c; };

  const A = analyseBundle(fs.readFileSync(PRETTY, "utf8"));
  const exported = exportNames(PRETTY, BLOCKS);
  const label = path.basename(PRETTY);

  if (MODE === "assign") {
    const [INF, IDS] = [A1, A2];
    const inferred = readJson(INF);
    const ids = fs.existsSync(IDS) ? readJson(IDS) : {};
    for (const [from, to] of carries) {
      if (!Object.hasOwn(ids, from)) { console.error(`--carry ${from}=${to}: ${from} is not in ${IDS}`); process.exit(1); }
      if (Object.hasOwn(ids, to)) { console.error(`--carry ${from}=${to}: ${to} is already in ${IDS}`); process.exit(1); }
      ids[to] = ids[from]; delete ids[from];
    }
    const known = new Map(exported);
    for (const [short, real] of Object.entries(inferred)) known.set(short, real);
    const cur = computeIds(A, known);
    const problems = [], added = [], kept = [], rekeyed = [], removed = [], refused = [];
    const next = {};
    const seenId = new Map();
    for (const [short, real] of Object.entries(inferred)) {
      const r = cur.get(short);
      if (!r) { problems.push(`${real}: ${short} is not a nameable top-level declaration of ${label} (verify_inferred.mjs would refuse it)`); continue; }
      if (seenId.has(r.id)) { problems.push(`${real} and ${seenId.get(r.id)} have one id ${r.id} (the short-keyed map names one declaration twice?)`); continue; }
      seenId.set(r.id, real);
      const entry = { id: r.id, kind: r.kind, disamb: r.disamb, since: VERSION };
      const old = ids[real];
      if (!old) { next[real] = entry; added.push(real); }
      else if (old.id === r.id) { next[real] = { ...old, kind: r.kind, disamb: r.disamb }; kept.push(real); }
      else if (REKEY) { next[real] = entry; rekeyed.push([real, old.id, r.id]); }
      else { next[real] = old; refused.push([real, old.id, r.id]); }
    }
    for (const real of Object.keys(ids)) if (!Object.hasOwn(next, real)) removed.push(real);
    if (problems.length) { for (const p of problems) console.error(`  ${p}`); console.error(`REFUSED -- nothing written (${problems.length} problem(s))`); process.exit(1); }
    if (refused.length) {
      for (const [real, was, is] of refused) console.error(`  ${real}: id ${was} -> ${is} (the declaration changed, or the name was re-anchored)`);
      console.error(`REFUSED -- nothing written: ${refused.length} existing id(s) would change; pass --rekey after reviewing the names above`);
      process.exit(1);
    }
    fs.writeFileSync(IDS, canonical(sortedKeys(next)));
    const c = counts(Object.values(next));
    console.error(`${label}: ${Object.keys(next).length} id(s) -> ${IDS}: ${added.length} added, ${kept.length} kept, ${rekeyed.length} rekeyed, ${removed.length} removed (no longer in ${path.basename(INF)}); disambiguators: none ${c.none}, c: ${c.c}, p: ${c.p}`);
    for (const [real, was, is] of rekeyed) console.error(`  rekeyed ${real}: ${was} -> ${is}`);
    for (const real of removed) console.error(`  removed ${real}`);
    if (REPORT) fs.writeFileSync(REPORT, canonical({ generatedBy: "tools/symbol_ids.mjs assign", bundle: label, version: VERSION, added, kept, rekeyed, removed, disambiguators: c }));
    process.exit(0);
  }

  const IDS = A1;
  const idsMap = readJson(IDS);
  const { resolved, reasons, iterations, ids } = resolveIds(A, exported, idsMap);
  const c = counts(Object.values(idsMap));
  const reportObj = {
    generatedBy: `tools/symbol_ids.mjs ${MODE}`, bundle: label, iterations,
    counts: { ids: Object.keys(idsMap).length, resolved: resolved.size, unresolved: reasons.size },
    disambiguators: c,
    resolved: Object.fromEntries([...resolved].map(([real, short]) => [real, { short, id: idsMap[real].id }])),
    unresolved: Object.fromEntries([...reasons].sort()),
  };
  const say = (s) => console.error(s);
  say(`${label}: ${Object.keys(idsMap).length} id(s), ${resolved.size} resolved, ${reasons.size} unresolved (${iterations} iteration(s); disambiguators: none ${c.none}, c: ${c.c}, p: ${c.p})`);
  for (const [real, why] of [...reasons].sort()) say(`  unresolved ${real}: ${why}`);

  if (MODE === "resolve") {
    const OUT = A2;
    const orderMap = ORDER ? readJson(ORDER) : null;
    const orderOf = new Map();
    if (orderMap) Object.values(orderMap).forEach((real, i) => orderOf.set(real, i));
    const reals = [...resolved.keys()].sort((a, b) => {
      const ia = orderOf.has(a) ? orderOf.get(a) : Infinity, ib = orderOf.has(b) ? orderOf.get(b) : Infinity;
      return ia !== ib ? ia - ib : Object.keys(idsMap).indexOf(a) - Object.keys(idsMap).indexOf(b);
    });
    const out = {};
    for (const real of reals) out[resolved.get(real)] = real;
    fs.writeFileSync(OUT, canonical(out));
    say(`  -> ${OUT} (${reals.length} name(s))`);
    if (REPORT) fs.writeFileSync(REPORT, canonical(reportObj));
    process.exit(0);
  }

  // check: compare with the short-keyed map
  const inferred = readJson(A2);
  const mapByReal = new Map(Object.entries(inferred).map(([s, r]) => [r, s]));
  // missing splits in two: `unresolved` has an id that did not resolve (the
  // fixture score's unresolved), `no id` is a name the ids map never had (a
  // registration the map is missing; against a next release's map, its
  // truth-only names)
  const same = [], moved = [], extra = [], missing = [], noId = [];
  for (const [real, short] of resolved) {
    const s = mapByReal.get(real);
    if (s === undefined) extra.push([real, short, inferred[short] ? `the map names ${short} ${inferred[short]}` : "the map does not name it"]);
    else if (s === short) same.push(real);
    else moved.push([real, short, s]);
  }
  for (const [real, short] of mapByReal) {
    if (resolved.has(real)) continue;
    if (Object.hasOwn(idsMap, real)) missing.push([real, short, reasons.get(real)]); else noId.push([real, short]);
  }
  for (const [real, short, s] of moved) say(`  moved   ${real}: resolved to ${short}, the map has it on ${s}${inferred[short] ? ` (the map names ${short} ${inferred[short]})` : ""}`);
  for (const [real, short, note] of extra) say(`  extra   ${real}: resolved to ${short}, ${note}`);
  for (const [real, short, why] of missing) say(`  missing ${real} (${short} in the map): ${why}`);
  if (noId.length) say(`  no id   ${noId.length} name(s) of the map are not in ${path.basename(IDS)}: ${noId.map(([r]) => r).join(", ")}`);
  reportObj.compare = { same: same.length, moved: moved.length, extra: extra.length, missing: missing.length, noId: noId.length,
    movedNames: moved.map(([r, s, m]) => ({ real: r, resolved: s, map: m })), extraNames: extra.map(([r, s, n]) => ({ real: r, resolved: s, note: n })),
    missingNames: missing.map(([r, s, w]) => ({ real: r, map: s, why: w })), noIdNames: noId.map(([r, s]) => ({ real: r, map: s })) };
  if (REPORT) fs.writeFileSync(REPORT, canonical(reportObj));
  const ok = !moved.length && !extra.length && !missing.length && !noId.length;
  say(`RESULT: ${ok ? "pass" : "FAIL"} ${same.length} same, ${moved.length} moved, ${extra.length} extra, ${missing.length} missing (unresolved), ${noId.length} without an id` +
      (ok ? ` -- resolve reproduces ${path.basename(A2)} exactly` : ` -- ${path.basename(A2)} is not what the ids resolve to${noId.length && !moved.length && !extra.length && !missing.length ? " (run assign for the names without an id)" : ""}`));
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main();
