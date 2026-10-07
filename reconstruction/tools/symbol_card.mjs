// One card per symbol, and the reverse questions, from the generated maps.
//
// Writing or checking a doc section starts from questions the symbol index
// cannot answer: who reads an environment variable, which functions carry a
// log prefix, what a function calls and who calls it, which doc sections
// already cite it. Each used to be a grep over the 90k-line bundle. This tool
// answers them from maps/xref_daemon.json, maps/symbols_daemon.json,
// maps/subsys_daemon.json, the provenance maps and the docs, so an agent
// writing a section reads one card instead of the bundle.
//
// Usage:
//   node symbol_card.mjs [--maps <dir>] [--build <OUT>] [--docs <dir>] [--body] <query>...
//
//   <realName> | <shortName>   the card: kind, line, subsystem, name origin,
//                              (--inner: the named closures inside it, with lines)
//                              env vars, log prefixes, dotted names, paths,
//                              refs (first-party and unnamed), refBy, docs
//   env:<VAR>                  the symbols that read process.env.VAR
//   log:<prefix>               the symbols that log with "[prefix]"
//   dotted:<a.b>               the symbols that carry "a.b" (RPC method, event type)
//   path:<text>                the symbols whose path literals contain <text>
//   string:<text>              the symbols whose string literals contain <text> (case-insensitive)
//   unnamed[:N]                the N (default 30) unnamed top-level declarations most used by first-party code
//   uncited[:NN-dir]           the first-party symbols no doc mentions, optionally one subsystem
//
// --build <OUT> reads xref/symbols from a rebuild.sh run instead of maps/ (a
// name registered with name_symbol.mjs --build is visible there before PROMOTE).
// --body prints the declaration from first-party/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDocs } from "./doc_cites.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const argv = process.argv.slice(2);
const opt = (k, dflt) => { const i = argv.indexOf(k); if (i === -1) return dflt; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const flag = k => { const i = argv.indexOf(k); if (i === -1) return false; argv.splice(i, 1); return true; };
const MAPS = opt("--maps", path.join(ROOT, "maps"));
const BUILD = opt("--build", null);
const DOCS = opt("--docs", path.resolve(ROOT, "..", "docs"));
const BODY = flag("--body");
const INNER = flag("--inner");
if (!argv.length) { console.error(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter(l => l.startsWith("//")).join("\n")); process.exit(2); }

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const gen = f => fs.existsSync(path.join(BUILD ?? MAPS, f)) ? readJson(path.join(BUILD ?? MAPS, f)) : null;
const xref = gen("xref_daemon.json");
const symbols = gen("symbols_daemon.json");
if (!xref || !symbols) { console.error(`no xref_daemon.json / symbols_daemon.json in ${BUILD ?? MAPS} (run rebuild.sh, or pass --build <OUT>)`); process.exit(2); }
const subsys = fs.existsSync(path.join(MAPS, "subsys_daemon.json")) ? readJson(path.join(MAPS, "subsys_daemon.json")) : {};
const inferred = fs.existsSync(path.join(MAPS, "inferred_daemon.json")) ? readJson(path.join(MAPS, "inferred_daemon.json")) : {};
const published = fs.existsSync(path.join(MAPS, "published_daemon.json")) ? readJson(path.join(MAPS, "published_daemon.json")) : {};
const asserted = fs.existsSync(path.join(MAPS, "inferred_daemon.asserted.json")) ? readJson(path.join(MAPS, "inferred_daemon.asserted.json")) : {};
const history = fs.existsSync(path.join(MAPS, "history_daemon.json")) ? readJson(path.join(MAPS, "history_daemon.json")).symbols : {};
const changelog = fs.existsSync(path.join(MAPS, "changelog_daemon.json")) ? readJson(path.join(MAPS, "changelog_daemon.json")).symbols : {};
const docs = fs.existsSync(DOCS) ? fs.readdirSync(DOCS).filter(f => f.endsWith(".md")).map(f => path.join(DOCS, f)) : [];
const names = new Set(Object.keys(xref.symbols));
const cites = scanDocs(docs, names);
const shortToReal = Object.fromEntries(Object.entries(xref.symbols).map(([r, s]) => [s.mangled, r]));
const inferredReal = new Set(Object.values(inferred));
const assertedReal = new Set(Object.keys(asserted)); // real name -> the verdict it was asserted over

function origin(real) {
  if (published[real]) return `published source (${published[real].package} ${published[real].file}:${published[real].line}, ${published[real].verdict})`;
  if (inferredReal.has(real)) return assertedReal.has(real) ? "INFERRED, asserted with --allow-unproven" : "INFERRED by this repository";
  return "authoritative (esbuild __export table)";
}
function dir(real) { return subsys[real] ?? "(no subsystem)"; }
function bodyOf(real) {
  const d = subsys[real];
  if (!d) return null;
  const f = path.join(ROOT, "first-party", d, `${real}.js`);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}
const list = (label, arr, fmt = x => x) => { if (arr && arr.length) console.log(`  ${label} (${arr.length}): ${arr.map(fmt).join(", ")}`); };

function card(real) {
  const s = xref.symbols[real], i = symbols.symbols[real];
  console.log(`\n${real} (${s.mangled})  ${s.kind}  line ${s.line}${i ? `-${i.endLine}, ${i.bytes} bytes` : ""}  ${dir(real)}`);
  console.log(`  name: ${origin(real)}`);
  if (history[real] && history[real].untraceable) console.log(`  since: unknown (${history[real].untraceable})`);
  else if (history[real]) console.log(`  since: v${history[real].firstSeen}${history[real].changedIn.length ? `, changed in ${history[real].changedIn.map(v => "v" + v).join(", ")}` : ""}`);
  for (const c of changelog[real] ?? []) console.log(`  changelog v${c.version} (${c.confidence}): ${c.changelog.replace(/\s+/g, " ").slice(0, 200)}`);
  list("env", s.env);
  list("log prefixes", s.logPrefixes);
  list("dotted names", s.dotted);
  list("paths", s.paths);
  list("refs (first-party)", s.refs);
  list("refs (unnamed)", s.refsUnnamed, m => `${m}@${xref.unnamed[m]?.line ?? "?"}(used by ${xref.unnamed[m]?.usedBy.length ?? 0})`);
  list("refBy (first-party)", s.refBy);
  list("refBy (unnamed)", s.refByUnnamed);
  if (s.inner) {
    console.log(`  inner functions: ${s.inner.length} named, ${s.innerAnonymous} anonymous${INNER || !s.inner.length ? "" : " (--inner lists them)"}`);
    if (INNER) for (const f of s.inner) console.log(`    ${real}>${f.name}  lines ${f.line}-${f.endLine}`);
  }
  const c = cites.get(real);
  if (c) { console.log(`  docs (${c.reduce((n, x) => n + x.count, 0)} mentions):`); for (const x of c) console.log(`    ${x.doc}:${x.line}  ${x.section}  ×${x.count}`); }
  else console.log("  docs: none");
  if (BODY) { const b = bodyOf(real); console.log(b ? "\n" + b : "  (no first-party file)"); }
}
function symbolsList(label, arr) {
  if (!arr || !arr.length) { console.log(`${label}: none`); return; }
  console.log(`${label} (${arr.length}):`);
  for (const r of arr) console.log(`  ${r} (${xref.symbols[r].mangled})  ${dir(r)}  ${cites.has(r) ? "cited" : "uncited"}`);
}

for (const q of argv) {
  const m = q.match(/^(env|log|dotted|path|string|unnamed|uncited):?(.*)$/);
  if (!m) {
    const real = xref.symbols[q] ? q : shortToReal[q];
    if (!real) { console.log(`${q}: not a first-party symbol (real or short name)`); continue; }
    card(real);
    continue;
  }
  const [, kind, arg] = m;
  if (kind === "env") symbolsList(`env ${arg}`, xref.byEnv[arg]);
  else if (kind === "log") symbolsList(`log ${arg}`, xref.byLogPrefix[arg.startsWith("[") ? arg : `[${arg}]`]);
  else if (kind === "dotted") symbolsList(`dotted ${arg}`, xref.byDotted[arg]);
  else if (kind === "path") {
    const ks = Object.keys(xref.byPath).filter(k => k.includes(arg));
    for (const k of ks) symbolsList(`path ${k}`, xref.byPath[k]);
    if (!ks.length) console.log(`path ${arg}: no path literal contains it`);
  } else if (kind === "string") {
    const needle = arg.toLowerCase();
    const found = new Map();
    for (const idx of [xref.byString, xref.byDotted, xref.byPath, xref.byLogPrefix])
      for (const [k, v] of Object.entries(idx)) if (k.toLowerCase().includes(needle)) found.set(k, v);
    if (!found.size) console.log(`string ${arg}: no literal contains it`);
    for (const [k, v] of found) symbolsList(`string ${JSON.stringify(k)}`, v);
  } else if (kind === "unnamed") {
    const n = Number(arg) || 30;
    console.log(`unnamed top-level declarations most used by first-party code (${n} of ${Object.keys(xref.unnamed).length}):`);
    for (const [short, u] of Object.entries(xref.unnamed).slice(0, n))
      console.log(`  ${short}@${u.line} ${u.kind}  used by ${u.usedBy.length}: ${u.usedBy.slice(0, 6).join(", ")}${u.usedBy.length > 6 ? ", …" : ""}`);
  } else if (kind === "uncited") {
    const all = Object.keys(xref.symbols).filter(r => !cites.has(r) && (!arg || dir(r) === arg)).sort((a, b) => dir(a).localeCompare(dir(b)) || a.localeCompare(b));
    symbolsList(`uncited${arg ? ` in ${arg}` : ""}`, all);
  }
}
