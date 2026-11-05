// A naming benchmark with ground truth, for deciding how unnamed code is
// handed to a namer (docs/RECONSTRUCTION_EFFICIENCY_RESEARCH.md §8 建议 4).
//
// The repository knows the real names of 890 daemon symbols (esbuild's export
// blocks, upstream's published and historical spellings, the reviewed inferred
// names). Hiding some of them and asking a namer to recover them from the same
// context a bump offers for genuinely unnamed code measures the hand-off
// itself: no JS benchmark for name recovery exists, and every LLM naming
// tool's accuracy is self-reported (§5.3). Nothing here writes into maps/.
//
//   make   picks N named first-party symbols at random (seeded; stratified by
//          subsystem, with a per-kind quota: functions, module initialisers,
//          literal constants), HIDES their names and writes
//            <outdir>/answers.json     short -> { name, kind, subsystem }  (do not read before scoring)
//            <outdir>/rename.json      the rename map without the hidden names
//            <outdir>/xref.json        the cross-reference with the hidden symbols moved to `unnamed`
//            <outdir>/toplevel.md, toplevel.proposals.json, toplevel.tsv
//                                      the task in name_toplevel.mjs's current format, built from the two
//                                      maps above, so the namer sees exactly what a bump shows: every OTHER
//                                      known name applied, callers, strings, subsystem, vocabulary
//            <outdir>/rules.proposals.json
//                                      a deterministic baseline, one proposal per symbol from the literals,
//                                      property names and callers alone (no model); UnuglifyJS stands in
//                                      the research record for this role, this is the cheap local version
//          The derived maps also feed any other task format (an older
//          name_toplevel.mjs) for an A/B comparison. --exclude <file>... drops
//          symbols whose real name occurs in those files (the namer's own
//          context, e.g. CLAUDE.md), so a name already in front of the namer
//          is not scored as recovered. A hidden name must reach the task
//          through no channel: the derived maps leave it out, the CHANGELOG
//          pairing has its key dropped AND every mention of it in the text of
//          other symbols' entries replaced (the first run of this benchmark
//          leaked five answers through the "CHANGELOG words" line, which is
//          built from the entry text), the protocol vocabulary drops the
//          entries spelling a hidden name (a published name is exported by
//          @openduo/protocol under that very name), and after writing
//          toplevel.md `make` scans it for every answer as a whole word and
//          exits 1 on a hit. The summary line prints the pool per kind after
//          --exclude: with docs/*.md excluded the v0.8.7 pool holds 5 module
//          initialisers and 4 constants, because the analysis docs cite
//          nearly all of them; a benchmark free of names the namer may have
//          read in docs/ is therefore a benchmark of functions.
//   score  compares proposals with answers.json on three layers (REFORGE,
//          REBENCH, SymLM):
//            exact     equal after lowercasing and removing separators
//            tokenF1   F1 over the sub-token sets of camelCase/snake_case splits, after a small
//                      synonym table (get=read=fetch, build=create=make, ...) and plural stripping
//            embed     optional: --embed "<cmd>" runs a command that reads JSON lines {"a","b"} on
//                      stdin and prints one cosine per line (a bge-small wrapper plugs in here)
//          A proposal may list up to 3 candidates; `top1` scores the first,
//          `top3` the best of them (the oracle for "a person picks from the
//          list"). Reported per kind and per subsystem, with a one-line
//          summary; written to <outdir>/score.json and score.md. --skip
//          <short,...> leaves symbols out of the scoring (e.g. ones a later
//          check showed leaked into the task that was measured).
//
// Usage:
//   node naming_bench.mjs make <pretty.js> <rename.json> <xref.json> <subsys.json> <outdir>
//        --n <N> --seed <S> [--kind function|moduleInit|value] [--mix <functions,inits,values>]
//        [--changelog <changelog_daemon.json>] [--protocol <dir>] [--exclude <file>...] [--body-lines <N>]
//   node naming_bench.mjs score <answers.json> <proposals.json|.tsv> [--embed "<cmd>"] [--out <dir>] [--label <name>] [--skip <short,...>]
// Proposal formats: {short: {names: [..]}} (name_toplevel.mjs's proposals file),
// {short: "name"}, {short: ["a","b"]}, or a TSV `short<TAB>name` (the batch list).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "@babel/parser";
import { topLevelDeclarations, isFunctionLike } from "./verify_inferred.mjs";
import { buildTasks } from "./name_toplevel.mjs";
import { loadProtocolVocab, indexProtocolVocab, splitTokens, isStopToken, spanEvidence } from "./naming_context.mjs";

const [CMD, ...args] = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const opts = (name) => { const out = []; for (let i = 0; i < args.length; i++) if (args[i] === name) { for (let j = i + 1; j < args.length && !args[j].startsWith("--"); j++) out.push(args[j]); } return out; };
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
const usage = () => {
  console.error("usage: node naming_bench.mjs make <pretty.js> <rename.json> <xref.json> <subsys.json> <outdir> --n <N> --seed <S>\n" +
    "            [--kind function|moduleInit|value] [--mix <fn,init,value>] [--changelog <json>] [--protocol <dir>] [--exclude <file>...] [--body-lines <N>]\n" +
    "       node naming_bench.mjs score <answers.json> <proposals.json|.tsv> [--embed \"<cmd>\"] [--out <dir>] [--label <name>] [--skip <short,...>]");
  process.exit(2);
};

// ---- make ---------------------------------------------------------------------
// seeded PRNG (mulberry32), so a sample is reproducible from --seed
function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const UPPER = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;
const isInit = (x) => /^init[A-Z]\w*Module$/.test(x);

function make() {
  const [PRETTY, RENAME, XREF, SUBSYS, OUTDIR] = args;
  if (!OUTDIR || !opt("--n") || opt("--seed") === undefined) usage();
  const N = Number(opt("--n")), seed = Number(opt("--seed"));
  const src = fs.readFileSync(PRETTY, "utf8");
  const rename = readJson(RENAME), xref = readJson(XREF), subsys = readJson(SUBSYS);
  const ast = parse(src, { sourceType: "module", ranges: true });
  const decls = topLevelDeclarations(ast);
  const exclude = new Set();
  for (const f of opts("--exclude")) { const text = fs.readFileSync(f, "utf8"); for (const real of Object.values(rename)) if (text.includes(real)) exclude.add(real); }
  // the kind of each named symbol: function (function-like), moduleInit, value
  // (a literal constant, or an UPPER_SNAKE uninitialised var assigned in its
  // module initialiser: all but one of the daemon's constants are the latter)
  const kindOf = (short, real) => {
    const d = decls.get(short);
    if (!d) return null;
    if (isFunctionLike(d)) return "function";
    if (d.kind === "moduleInit") return "moduleInit";
    if ((d.kind === "value" || d.kind === "var (uninitialised)") && UPPER.test(real)) return "value";
    return null;
  };
  const pool = { function: [], moduleInit: [], value: [] };
  for (const [short, real] of Object.entries(rename)) {
    const k = kindOf(short, real);
    if (!k || exclude.has(real)) continue;
    // only symbols some named code uses: the candidates name_toplevel.mjs lists
    const refBy = (xref.symbols?.[real]?.refBy ?? []).filter((x) => x !== real);
    if (!refBy.length) continue;
    pool[k].push({ short, real, kind: k, subsystem: subsys[real] ?? "-", refBy });
  }
  const onlyKind = opt("--kind");
  let quota;
  if (onlyKind) quota = { [onlyKind]: N };
  else if (opt("--mix")) { const [a, b, c] = opt("--mix").split(",").map(Number); quota = { function: a, moduleInit: b, value: c }; }
  else quota = { function: Math.round(N * 2 / 3), moduleInit: Math.round(N / 6), value: N - Math.round(N * 2 / 3) - Math.round(N / 6) };
  const random = rng(seed);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // stratified: round-robin over subsystems in a seeded order, each subsystem's
  // pool shuffled, until the kind's quota is met
  const picked = [];
  for (const [k, n] of Object.entries(quota)) {
    if (!n) continue;
    const byDir = new Map();
    for (const x of shuffle([...pool[k]])) (byDir.get(x.subsystem) ?? byDir.set(x.subsystem, []).get(x.subsystem)).push(x);
    const dirs = shuffle([...byDir.keys()]);
    let got = 0;
    for (let round = 0; got < n && round < 1000; round++) {
      let any = false;
      for (const d of dirs) { const x = byDir.get(d).shift(); if (!x) continue; any = true; picked.push(x); if (++got >= n) break; }
      if (!any) break;
    }
    if (got < n) console.error(`naming_bench: only ${got} of ${n} ${k} symbols available (${pool[k].length} in the pool)`);
  }
  const hidden = new Set(picked.map((x) => x.short)), hiddenReal = new Set(picked.map((x) => x.real));
  // derived maps: the hidden names removed, and their symbols listed as unnamed
  const rename2 = Object.fromEntries(Object.entries(rename).filter(([s]) => !hidden.has(s)));
  // `unnamed` holds the hidden symbols only: the original unnamed entries would
  // be listed as candidates beside them (the `shares` lines fall back to
  // scanning the named bodies)
  const xref2 = { ...xref, symbols: {}, unnamed: {} };
  for (const [real, e] of Object.entries(xref.symbols ?? {})) {
    if (hiddenReal.has(real)) continue;
    xref2.symbols[real] = { ...e, refs: (e.refs ?? []).filter((x) => !hiddenReal.has(x)), refBy: (e.refBy ?? []).filter((x) => !hiddenReal.has(x)) };
  }
  for (const x of picked) {
    const e = xref.symbols[x.real];
    xref2.unnamed[x.short] = { line: e.line, kind: e.kind, usedBy: x.refBy.filter((r) => !hiddenReal.has(r)) };
  }
  // subsys without the hidden names: a hidden name must not appear in the vocabulary
  const subsys2 = Object.fromEntries(Object.entries(subsys).filter(([n]) => !hiddenReal.has(n)));
  // CHANGELOG pairing without the hidden names: the hidden symbols' own
  // entries go, and every mention of a hidden name inside another symbol's
  // entry text is replaced, because the vocabulary block quotes code-shaped
  // words from that text
  const changelog = opt("--changelog") ? scrubChangelog(readJson(opt("--changelog")), hiddenReal) : null;
  // protocol vocabulary without the hidden names: a symbol whose real name is
  // upstream's published spelling (maps/published_daemon.json) is exported by
  // the protocol package under that name, and the "protocol" lines would print
  // it (at v0.8.7 isChannelFileDownloadParams, in a run that excluded docs/).
  // --exclude <protocol src>/*.ts leaves such symbols out of the pool instead
  const protocol = scrubProtocol(loadProtocolVocab(opt("--protocol")), hiddenReal);
  fs.mkdirSync(OUTDIR, { recursive: true });
  writeJson(path.join(OUTDIR, "answers.json"), Object.fromEntries(picked.map((x) => [x.short, { name: x.real, kind: x.kind, subsystem: x.subsystem }])));
  writeJson(path.join(OUTDIR, "rename.json"), rename2);
  writeJson(path.join(OUTDIR, "xref.json"), xref2);
  writeJson(path.join(OUTDIR, "subsys.json"), subsys2);
  if (changelog) writeJson(path.join(OUTDIR, "changelog.json"), changelog);
  const res = buildTasks({ src, xref: xref2, rename: rename2, subsys: subsys2, changelog, protocol,
    limit: 1e9, minUsers: 0, only: hidden, bodyLines: Number(opt("--body-lines") ?? 60) });
  fs.writeFileSync(path.join(OUTDIR, "toplevel.md"), res.md);
  fs.writeFileSync(path.join(OUTDIR, "toplevel.tsv"), res.tsv);
  writeJson(path.join(OUTDIR, "toplevel.proposals.json"), res.proposals);
  const missing = picked.filter((x) => !res.rows.some((r) => r.short === x.short));
  if (missing.length) console.error(`naming_bench: ${missing.length} picked symbol(s) not in the task: ${missing.map((x) => x.short).join(", ")}`);
  const leaks = findLeaks(res.md, picked);
  if (leaks.length) {
    console.error(`naming_bench: ${leaks.length} hidden name(s) appear in ${OUTDIR}/toplevel.md; the task would score a name it shows:`);
    for (const l of leaks) console.error(`  ${l.short} ${l.name} at line ${l.line}: ${l.text}`);
    process.exit(1);
  }
  writeJson(path.join(OUTDIR, "rules.proposals.json"), ruleProposals(src, decls, res.rows, rename2, subsys2));
  const perKind = {}; for (const x of picked) perKind[x.kind] = (perKind[x.kind] || 0) + 1;
  const poolSizes = Object.entries(pool).map(([k, v]) => `${k} ${v.length}`).join(", ");
  console.log(`naming_bench: ${picked.length} symbols hidden (${Object.entries(perKind).map(([k, v]) => `${k} ${v}`).join(", ")}; pool ${poolSizes}; ${exclude.size} excluded by --exclude; seed ${seed}) -> ${OUTDIR}/answers.json, toplevel.md, rules.proposals.json`);
}

// the protocol vocabulary with every entry spelling a hidden name removed
export function scrubProtocol(vocab, hiddenReal) {
  if (!vocab) return null;
  const keep = (list) => list.filter((x) => !hiddenReal.has(x.name));
  return indexProtocolVocab({ types: keep(vocab.types), funcs: keep(vocab.funcs), fields: keep(vocab.fields) });
}

// the pairing with every trace of the hidden names removed: their keys, and
// their spelling inside the `changelog` and `why` text of every other entry
function scrubChangelog(changelog, hiddenReal) {
  if (!changelog?.symbols) return changelog;
  const names = [...hiddenReal].sort((a, b) => b.length - a.length);
  const re = names.length ? new RegExp(`\\b(?:${names.map((n) => n.replace(/[$]/g, "\\$&")).join("|")})\\b`, "g") : null;
  const scrub = (t) => (typeof t === "string" && re ? t.replace(re, "<hidden>") : t);
  const symbols = {};
  for (const [n, list] of Object.entries(changelog.symbols)) {
    if (hiddenReal.has(n)) continue;
    symbols[n] = (list ?? []).map((e) => ({ ...e, changelog: scrub(e.changelog), why: scrub(e.why) }));
  }
  return { ...changelog, symbols, unexplained: Array.isArray(changelog.unexplained) ? changelog.unexplained.filter((n) => !hiddenReal.has(n)) : changelog.unexplained };
}
// every line of a task text that contains a hidden name as a whole word
export function findLeaks(text, picked) {
  const out = [];
  const lines = text.split("\n");
  for (const x of picked) {
    const re = new RegExp(`(?<![\\w$])${x.real.replace(/[$]/g, "\\$&")}(?![\\w$])`);
    lines.forEach((l, i) => { if (re.test(l)) out.push({ short: x.short, name: x.real, line: i + 1, text: l.length > 120 ? l.slice(0, 120) + " …" : l }); });
  }
  return out;
}

// ---- rule baseline ------------------------------------------------------------
// one deterministic proposal per candidate, from what survives minification:
//   value       the words of its string literal (UPPER_SNAKE), else nothing
//   moduleInit  init + the two rarest tokens of its string literals + Module
//   function    a verb from the body's shape (is/has for a boolean return, read/
//               write/list for fs calls, render for template output, parse for
//               JSON.parse, resolve/build otherwise) + the rarest property-name
//               tokens of the body; a caller's object noun when the body has none
const COMMON = new Set(["length", "push", "slice", "join", "map", "filter", "trim", "split", "replace", "includes", "startsWith", "endsWith",
  "toString", "then", "catch", "message", "error", "stack", "code", "name", "type", "value", "data", "result", "text", "utf8", "json", "stringify",
  "parse", "keys", "entries", "values", "assign", "from", "isArray", "now", "test", "exec", "match", "some", "every", "find", "indexOf", "size",
  "set", "get", "has", "add", "delete", "clear", "promise", "resolve", "reject", "all", "log", "warn", "info", "debug", "default", "env", "process"]);
export function ruleProposals(src, decls, rows, rename, subsys) {
  // document frequency of property tokens over all first-party declarations
  const df = new Map();
  const spanOfReal = new Map();
  for (const s of parse(src, { sourceType: "module", ranges: true }).program.body) {
    const units = s.type === "VariableDeclaration" ? s.declarations : (s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id ? [s] : [];
    for (const u of units) if (u.id?.type === "Identifier" && rename[u.id.name]) spanOfReal.set(rename[u.id.name], [u.start, u.end]);
  }
  for (const [a, b] of spanOfReal.values()) for (const t of spanEvidence(src, a, b).tokens) df.set(t, (df.get(t) || 0) + 1);
  const rare = (tokens) => [...tokens].filter((t) => !COMMON.has(t) && !/^\d+$/.test(t)).sort((x, y) => (df.get(x) || 0) - (df.get(y) || 0) || x.localeCompare(y));
  const pascal = (t) => t[0].toUpperCase() + t.slice(1);
  const out = {};
  for (const r of rows) {
    const [a, b] = r.span;
    const text = src.slice(a, b);
    const ev = spanEvidence(src, a, b);
    let name = null;
    if (r.kind === "literal constant") {
      const m = /"((?:[^"\\]|\\.){2,80})"/.exec(text);
      const words = m ? splitTokens(m[1]).filter((t) => !isStopToken(t) || /^[a-z]{2}$/.test(t)).slice(0, 4) : [];
      if (words.length >= 2) name = words.map((w) => w.toUpperCase()).join("_");
      else if (words.length === 1) name = `${words[0].toUpperCase()}_VALUE`;
    } else if (r.kind === "module initialiser") {
      const ws = rare(new Set(ev.strings.flatMap((s) => splitTokens(s).filter((t) => !isStopToken(t)))));
      if (ws.length) name = `init${ws.slice(0, 2).map(pascal).join("")}Module`;
    } else {
      const verb = /return\s+(!!|!\(|[^;]*(===|!==|instanceof)|!0|!1|true|false)/.test(text) ? "is"
        : /\.(readFile|readFileSync|readdir|readdirSync|existsSync)\b/.test(text) ? "read"
        : /\.(writeFile|writeFileSync|appendFile|appendFileSync|mkdir|mkdirSync|rename|renameSync)\b/.test(text) ? "write"
        : /JSON\.parse|\.parse\(/.test(text) ? "parse"
        : /`[^`]*\$\{/.test(text) && /\n/.test(text) ? "render"
        : /\bnew [A-Z]\w*\(|return \{/.test(text) ? "build"
        : /\bfor\b|\.map\(|\.filter\(/.test(text) ? "list" : "resolve";
      const ws = rare(new Set([...ev.props.flatMap((p) => splitTokens(p)), ...ev.strings.flatMap((s) => splitTokens(s))].filter((t) => !isStopToken(t) && !COMMON.has(t))));
      let nouns = ws.slice(0, 2);
      if (!nouns.length) { const u = r.users.find((x) => !isInit(x)); if (u) nouns = splitTokens(u).slice(1, 3); }
      if (nouns.length) name = verb + nouns.map(pascal).join("");
    }
    out[r.short] = { names: name ? [name] : [], subsystem: r.suggested, describe: "" };
  }
  return out;
}

// ---- score --------------------------------------------------------------------
// a small synonym table: each group maps to its first member. Extend it when a
// scoring pass shows a systematic miss; it is a reading aid, not a thesaurus
const SYNONYMS = [
  ["get", "read", "fetch", "load", "lookup"], ["build", "create", "make", "construct"], ["resolve", "determine", "derive", "compute", "calc", "calculate"],
  ["dir", "directory", "folder"], ["config", "configuration", "cfg", "settings"], ["msg", "message"], ["init", "initialize", "initialise", "setup"],
  ["id", "identifier"], ["err", "error"], ["fn", "func", "function"], ["idx", "index"], ["args", "arguments"], ["params", "parameters"],
  ["opts", "options"], ["str", "string"], ["num", "number"], ["prev", "previous"], ["cur", "curr", "current"], ["remove", "delete", "drop"],
  ["render", "format"], ["check", "validate", "verify", "assert"], ["list", "enumerate", "collect"], ["write", "save", "persist", "store"],
  ["ensure", "guarantee"], ["path", "file"], ["is", "has"], ["env", "environment"], ["spec", "specification"], ["ms", "millis", "milliseconds"],
  ["max", "maximum", "limit", "cap"], ["min", "minimum"], ["key", "name"], ["sdk", "agent"], ["max", "ceiling"], ["bytes", "size"],
];
const CANON = new Map();
for (const g of SYNONYMS) for (const w of g) if (!CANON.has(w)) CANON.set(w, g[0]);
export function canonTokens(name) {
  const out = new Set();
  for (let t of splitTokens(name)) {
    if (CANON.has(t)) t = CANON.get(t);
    else if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
    if (CANON.has(t)) t = CANON.get(t);
    out.add(t);
  }
  return out;
}
export const exactKey = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
export function tokenF1(a, b) {
  const A = canonTokens(a), B = canonTokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  const p = hit / A.size, r = hit / B.size;
  return p + r ? (2 * p * r) / (p + r) : 0;
}
function readProposals(file) {
  const out = {};
  if (file.endsWith(".tsv")) {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue;
      const [short, name] = line.split("\t");
      if (name) out[short] = [name];
    }
    return out;
  }
  for (const [short, p] of Object.entries(readJson(file))) {
    const names = Array.isArray(p) ? p : typeof p === "string" ? [p] : Array.isArray(p?.names) ? p.names : p?.name ? [p.name] : [];
    out[short] = names.filter((n) => typeof n === "string" && n.trim()).slice(0, 3);
  }
  return out;
}
function embedCosines(cmd, pairs) {
  if (!pairs.length) return [];
  const r = spawnSync("sh", ["-c", cmd], { input: pairs.map((p) => JSON.stringify(p)).join("\n") + "\n", encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`--embed command failed: ${r.stderr || r.status}`);
  const lines = r.stdout.trim().split("\n").map(Number);
  if (lines.length !== pairs.length || lines.some(Number.isNaN)) throw new Error(`--embed printed ${lines.length} value(s) for ${pairs.length} pair(s)`);
  return lines;
}
function score() {
  const [ANSWERS, PROPOSALS] = args;
  if (!ANSWERS || !PROPOSALS) usage();
  const proposals = readProposals(PROPOSALS);
  const skip = new Set((opt("--skip") ?? "").split(",").filter(Boolean));
  const answers = Object.fromEntries(Object.entries(readJson(ANSWERS)).filter(([s]) => !skip.has(s)));
  const embed = opt("--embed"), outDir = opt("--out") ?? path.dirname(PROPOSALS), label = opt("--label") ?? path.basename(PROPOSALS);
  const rows = [];
  for (const [short, a] of Object.entries(answers)) {
    const names = proposals[short] ?? [];
    const per = names.map((n) => ({ name: n, exact: exactKey(n) === exactKey(a.name) ? 1 : 0, f1: tokenF1(n, a.name) }));
    const best = (k) => per.length ? Math.max(...per.map((x) => x[k])) : 0;
    rows.push({ short, answer: a.name, kind: a.kind, subsystem: a.subsystem, proposals: names, answered: names.length > 0,
      exact1: per[0]?.exact ?? 0, f1_1: per[0]?.f1 ?? 0, exact3: best("exact"), f1_3: best("f1") });
  }
  if (embed) {
    const pairs = [];
    for (const r of rows) for (const n of r.proposals) pairs.push({ a: n, b: r.answer });
    let cos;
    try { cos = embedCosines(embed, pairs); } catch (e) { console.error(`naming_bench: ${e.message}`); process.exit(1); }
    let i = 0;
    for (const r of rows) { const c = r.proposals.map(() => cos[i++]); r.embed1 = c[0] ?? 0; r.embed3 = c.length ? Math.max(...c) : 0; }
  }
  const mean = (list, k) => list.length ? list.reduce((s, r) => s + (r[k] ?? 0), 0) / list.length : 0;
  const table = (groups) => groups.map(([g, list]) => ({ group: g, n: list.length, answered: list.filter((r) => r.answered).length,
    exact1: mean(list, "exact1"), f1_1: mean(list, "f1_1"), exact3: mean(list, "exact3"), f1_3: mean(list, "f1_3"),
    ...(embed ? { embed1: mean(list, "embed1"), embed3: mean(list, "embed3") } : {}) }));
  const by = (k) => { const m = new Map(); for (const r of rows) (m.get(r[k]) ?? m.set(r[k], []).get(r[k])).push(r); return [...m].sort((a, b) => a[0].localeCompare(b[0])); };
  const all = table([["all", rows]])[0], byKind = table(by("kind")), bySub = table(by("subsystem"));
  const pct = (x) => `${(100 * x).toFixed(1)}%`, f = (x) => x.toFixed(3);
  const line = (t) => `| ${t.group} | ${t.n} | ${t.answered} | ${pct(t.exact1)} | ${f(t.f1_1)} | ${pct(t.exact3)} | ${f(t.f1_3)} |${embed ? ` ${f(t.embed1)} | ${f(t.embed3)} |` : ""}`;
  const head = `| group | n | answered | exact@1 | tokenF1@1 | exact@3 | tokenF1@3 |${embed ? " embed@1 | embed@3 |" : ""}\n|---|---|---|---|---|---|---|${embed ? "---|---|" : ""}`;
  const summary = `${label}: n=${rows.length}${skip.size ? ` (${skip.size} skipped)` : ""} answered=${all.answered} exact@1=${pct(all.exact1)} tokenF1@1=${f(all.f1_1)} exact@3=${pct(all.exact3)} tokenF1@3=${f(all.f1_3)}${embed ? ` embed@1=${f(all.embed1)} embed@3=${f(all.embed3)}` : ""}`;
  const md = [`# naming benchmark score: ${label}`, "", summary, "", "## by kind", "", head, ...byKind.map(line), "", "## by subsystem", "", head, ...bySub.map(line), "",
    "## per symbol", "", "| short | answer | kind | proposals | exact@3 | tokenF1@3 |", "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.short} | ${r.answer} | ${r.kind} | ${r.proposals.join(", ") || "(none)"} | ${r.exact3} | ${f(r.f1_3)} |`), ""].join("\n");
  fs.mkdirSync(outDir, { recursive: true });
  const stem = label.replace(/[^\w.-]+/g, "_");
  writeJson(path.join(outDir, `score.${stem}.json`), { label, answers: ANSWERS, proposals: PROPOSALS, skip: [...skip], embed: embed ?? null, all, byKind, bySubsystem: bySub, rows });
  fs.writeFileSync(path.join(outDir, `score.${stem}.md`), md);
  console.log(summary);
  console.log(`  by kind: ${byKind.map((t) => `${t.group} exact@1=${pct(t.exact1)} F1@1=${f(t.f1_1)} exact@3=${pct(t.exact3)} F1@3=${f(t.f1_3)}`).join("; ")}`);
  console.log(`  -> ${path.join(outDir, `score.${stem}.md`)}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  if (CMD === "make") make();
  else if (CMD === "score") score();
  else usage();
}
