// Mutation test for the doc-anchor checkers.
//
// A checker that has never been seen to fail proves nothing: check_bare_anchors
// once had a vendor arm that could not fire, and its green runs meant nothing
// for versions. This builds a small synthetic doc whose citations are derived
// from the symbol index and the bundle itself (so it tracks every release with
// no fixture to maintain), confirms each checker PASSES on it, then injects one
// known error at a time and confirms the responsible checker FAILS.
//
// The checker runs are independent processes, each on its own copy of the doc,
// so they run concurrently (os.availableParallelism() - 1 at a time; JOBS=1
// runs them one at a time, as rebuild.sh's JOBS=1 does for bundles). Run one
// after another they were two thirds of the whole pipeline's wall time.
//
// verify_inferred.mjs gets the same treatment for the kinds a name can have
// besides a function: a module initialiser and a literal constant. It records
// a baseline for one of each (picked from the bundle by structure, so again no
// fixture), must pass it, and must refuse a constant whose literal changed (in
// a copy of the bundle), a module initialiser's name moved onto another
// initialiser, and an initialiser's name moved onto a function -- and, with no
// recorded shape to lean on, a name spelled for another kind; a name on one of
// two identical initialisers must never pass clean (the list is above the
// section below). Nothing else can see any of these: renaming is scope-safe,
// so a name on the wrong declaration passes every other gate.
//
// Usage: node mutate_anchor_checks.mjs <daemon.pretty.js> <cli.pretty.js> <maps-dir> [modules_daemon.json]
// Exit 1 if any mutant survives or the clean doc does not pass.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { parse } from "@babel/parser";
import { snippetTokens, identRe, codeTokens } from "./anchor_forms.mjs";
import { topLevelDeclarations, shapeOf, isFunctionLike, initialiserShapes, judgeInitialiser, TRIVIAL_VALUES } from "./verify_inferred.mjs";

const [DAEMON, CLI, MAPS, MODULES_ARG] = process.argv.slice(2);
if (!DAEMON || !CLI || !MAPS) { console.error("usage: node mutate_anchor_checks.mjs <daemon.pretty.js> <cli.pretty.js> <maps-dir> [modules_daemon.json]"); process.exit(2); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
// the module classification is hand-made and lives only in maps/, whichever
// directory the generated symbol/block files come from; rebuild.sh passes the
// one its MAPS names
const MODULES = MODULES_ARG ?? path.join(HERE, "..", "maps", "modules_daemon.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "anchor-mut-"));
const idxD = JSON.parse(fs.readFileSync(path.join(MAPS, "symbols_daemon.json"), "utf8"));
const idxC = JSON.parse(fs.readFileSync(path.join(MAPS, "symbols_cli.json"), "utf8"));
const dLines = fs.readFileSync(DAEMON, "utf8").split("\n");
const cLines = fs.readFileSync(CLI, "utf8").split("\n");

// Pick citations from the index: two function symbols with distinct mangled
// names, and a body line of each that has a string literal to quote.
const fnSyms = (idx) => Object.entries(idx.symbols).filter(([, e]) => /function/.test(e.kind) && e.endLine - e.line >= 3);
function literalLine(lines, e) {
  for (let ln = e.line + 1; ln < e.endLine; ln++) {
    const m = (lines[ln - 1] || "").match(/"([A-Za-z][^"\\]{5,40})"/);
    if (m && snippetTokens(`"${m[1]}"`).length) return { ln, code: `"${m[1]}"` };
  }
  return null;
}
const pickWithLiteral = (idx, lines) => { for (const [real, e] of fnSyms(idx)) { const l = literalLine(lines, e); if (l) return { real, e, ...l }; } throw new Error("no symbol with a quotable literal"); };
const A = pickWithLiteral(idxD, dLines);
const [otherReal, other] = fnSyms(idxD).find(([, e]) => e.mangled !== A.e.mangled && !dLines[A.e.line - 1].includes(e.mangled)
  && !dLines.slice(e.line - 1, e.endLine).some(l => l.includes(A.code.slice(1, -1))));
const C = pickWithLiteral(idxC, cLines);
// a second cli function whose short name is neither on C's line nor C's own
const [, otherC] = fnSyms(idxC).find(([, e]) => e.mangled !== C.e.mangled && !identRe(e.mangled).test(cLines[C.e.line - 1]));
// an indexed short name that is on some function's header line only inside a
// longer word (`on` in `function`): what a substring test used to accept
const inWord = (() => {
  const shorts = Object.values(idxD.symbols).map(e => e.mangled);
  for (const [, e] of fnSyms(idxD)) {
    const l = dLines[e.line - 1];
    const s = shorts.find(x => x !== e.mangled && l.includes(x) && !identRe(x).test(l));
    if (s) return { s, line: e.line };
  }
  throw new Error("no short name occurs inside a longer word on a function header");
})();

// A real name both bundles have (`main`), for the bundle-qualified pair; null
// when a release has none, and then its two mutants are reported as skipped.
const shared = (() => {
  for (const [real, e] of Object.entries(idxD.symbols)) {
    const c = idxC.symbols[real];
    if (c && c.mangled !== e.mangled) return { real, d: e.mangled, c: c.mangled };
  }
  return null;
})();
// short-name-shaped tokens no bundle uses, as a mangled name or as a real one:
// an all-lowercase one (what a stale short name usually looks like after a
// bump, when it lands on an unindexed declaration) and a mangled-shaped one
const used = new Set([idxD, idxC].flatMap(ix => Object.entries(ix.symbols).flatMap(([r, e]) => [r, e.mangled])));
const unused = (cands) => { const x = cands.find(c => !used.has(c)); if (!x) throw new Error(`every candidate in ${cands} is indexed`); return x; };
const lowerNowhere = unused(["zqx", "qzx", "xqz", "zxq", "qxz", "xzq"]);
const mangledNowhere = unused(["Zq9", "Qz9", "Xz9", "Zx9"]);

// A constant assigned inside an indexed symbol's span, `name = <number>`, for
// the N form's number rule (anchor_forms.mjs snippetHolds, strict): one whose
// name is 3+ characters (a distinctive token, so only the number rule can
// refute a wrong value) and one of 1-2 characters (no distinctive token: the
// whole token sequence must be there). A number the span does not contain
// stands in for a wrong value. null when a release has none; its mutants are
// then reported as skipped.
// `wrongInSpan` is the harder mutant: a number the span DOES hold, as some
// other constant's value. A rule that only asks "is this number anywhere in the
// span" passes it -- in initSessionDrainModule `Ydt = 5` held because `vH = 5`
// is two lines up -- and `wrong` was picked to avoid exactly that case.
function constantIn(minLen, maxLen) {
  const re = new RegExp(`(?<![A-Za-z0-9_$.])([A-Za-z_$][A-Za-z0-9_$]{${minLen - 1},${maxLen - 1}}) = (\\d+(?:e\\d+)?)(?![A-Za-z0-9_$.])`);
  for (const [real, e] of Object.entries(idxD.symbols)) {
    for (let ln = e.line; ln <= e.endLine; ln++) {
      const m = (dLines[ln - 1] || "").match(re);
      if (!m || snippetTokens(m[0]).length !== (minLen >= 3 ? 1 : 0)) continue;
      const spanTokens = codeTokens(dLines.slice(e.line - 1, e.endLine).join("\n"));
      const nums = new Set(spanTokens);
      let wrong = Number(m[2]) + 1;
      while (nums.has(String(wrong))) wrong++;
      // another number of the span, which the span never assigns to this name
      const assigns = (n) => spanTokens.some((t, i) => t === m[1] && spanTokens[i + 1] === "=" && spanTokens[i + 2] === n);
      const other = spanTokens.find(t => /^\d/.test(t) && t !== m[2] && !assigns(t));
      return { real, code: m[0], wrong: `${m[1]} = ${wrong}`, wrongInSpan: other ? `${m[1]} = ${other}` : null };
    }
  }
  return null;
}
const K3 = constantIn(3, 4), K2 = constantIn(1, 2);

const clean = [
  `F1 \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）`,
  `F2 \`${A.e.mangled}\`（\`${A.e.line}\`）`,
  `F3 \`${A.code}\`（\`${A.ln}\`）`,
  `F3cli \`${C.code}\`（\`cli.pretty.js:${C.ln}\`）`,
  `range \`${A.e.mangled}\`（\`${A.e.line}-${A.e.endLine}\`）`,
  // F2 addressed to the cli bundle: checked against cli, never skipped
  `F2cli \`${C.e.mangled}\`（\`cli.pretty.js:${C.e.line}\`）`,
  // P: the pairing alone, no line; and the real/short shorthand, in a span and
  // (below) in a fenced diagram
  `P \`${A.real} (${A.e.mangled})\` has no line`,
  `S \`${A.real}/${A.e.mangled}\` has no line either`,
  // a real name both bundles have: unqualified means the daemon's, `cli:` the cli's
  ...(shared ? [`Pd \`${shared.real} (${shared.d})\` and Pc \`cli:${shared.real} (${shared.c})\``] : []),
  // F2 needs no backticks on the number, so a parenthesis after a span is owned
  `F2bare \`${A.e.mangled}\`(${A.e.line})`,
  // N: evidence bound to the symbol by name, no line number at all
  `N \`${A.code}\`（\`${A.real}\`）`,
  `Ncli \`${C.code}\`（\`cli:${C.real}\`）`,
  // N for a constant: the number is the claim
  ...(K3 ? [`Nk3 \`${K3.code}\`（\`${K3.real}\`）`] : []),
  ...(K2 ? [`Nk2 \`${K2.code}\`（\`${K2.real}\`）`] : []),
  // numbers that are not line citations must stay invisible: a count in prose
  // (qualified or not), a port inside code, a date/error code/size/expression
  // in a fence
  `a 5-digit count in prose, 12345 ms, daemon 91616 lines, and a port in code \`PORT ?? 20233\``,
  "```\n2026-06-30.jsonl  -32601  10MB  3600*1e3\n" + `  ▼ drain ${A.real}/${A.e.mangled} → SDK` + "\n```",
].join("\n\n") + "\n";

// the bundle guard's mutant: same code, every line shifted by one
const shifted = path.join(tmp, "daemon.pretty.js");
fs.writeFileSync(shifted, "\n" + dLines.join("\n"));

const baseline = path.join(tmp, "baseline.json");
fs.writeFileSync(baseline, JSON.stringify({ unbound: {} }));
const IDX = `${MAPS}/symbols_daemon.json,${MAPS}/symbols_cli.json`;
const bareArgs = (doc, d, base = baseline) => [path.join(HERE, "check_bare_anchors.mjs"), "--index", IDX, "--bundle", `cli=${CLI}`, "--baseline", base, d, `${MAPS}/blocks_daemon.json`, MODULES, doc];
const checks = {
  verify_citations: (doc, d = DAEMON) => [path.join(HERE, "verify_citations.mjs"), IDX, "--bundle", `daemon=${d}`, "--bundle", `cli=${CLI}`, doc, "--quiet"],
  check_doc_anchors: (doc, d = DAEMON) => [path.join(HERE, "check_doc_anchors.mjs"), "--resolve", "--index", IDX, "--bundle", `cli=${CLI}`, d, doc],
  check_bare_anchors: (doc, d = DAEMON) => bareArgs(doc, d),
};

const mutants = [
  ["F1 short name swapped", "verify_citations", clean.replace(`${A.real} (${A.e.mangled})`, `${A.real} (${other.mangled})`)],
  ["F2 short name swapped", "check_doc_anchors", clean.replace(`F2 \`${A.e.mangled}\``, `F2 \`${other.mangled}\``)],
  ["F2 range end moved before start", "check_doc_anchors", clean.replace(`${A.e.line}-${A.e.endLine}`, `${A.e.line}-${A.e.line - 7}`)],
  ["F2 short name on the line only inside a longer word", "check_doc_anchors", clean + `\nsee \`${inWord.s}\`（\`${inWord.line}\`）\n`],
  // a cli citation used to be skipped whatever it said
  ["F2 cli short name swapped", "check_doc_anchors", clean.replace(`F2cli \`${C.e.mangled}\``, `F2cli \`${otherC.mangled}\``)],
  ["line-less pair: short name swapped", "verify_citations", clean.replace(`P \`${A.real} (${A.e.mangled})\``, `P \`${A.real} (${other.mangled})\``)],
  // was skipped as "not a citation" because the real name is not indexed
  ["line-less pair: real name exists nowhere", "verify_citations", clean.replace(`P \`${A.real} (`, "P `vanishedSymbolName (")],
  ["slash pair: short name swapped", "verify_citations", clean.replace(`S \`${A.real}/${A.e.mangled}\``, `S \`${A.real}/${other.mangled}\``)],
  ["slash pair: real name exists nowhere", "verify_citations", clean.replace(`S \`${A.real}/`, "S `vanishedSymbolName/")],
  ["slash pair in a fenced diagram: short name swapped", "verify_citations", clean.replace(`drain ${A.real}/${A.e.mangled}`, `drain ${A.real}/${other.mangled}`)],
  // each of these three passed while the line-less checks were narrower
  ["slash pair: stale all-lowercase short name that is indexed nowhere", "verify_citations", clean.replace(`S \`${A.real}/${A.e.mangled}\``, `S \`${A.real}/${lowerNowhere}\``)],
  ["slash pair: real and short name both indexed nowhere", "verify_citations", clean.replace(`S \`${A.real}/${A.e.mangled}\``, `S \`vanishedSymbolName/${mangledNowhere}\``)],
  ["line-less pair: PascalCase (class) real name exists nowhere", "verify_citations", clean.replace(`P \`${A.real} (`, "P `VanishedSymbolError (")],
  ...(shared ? [
    ["line-less pair: shared real name, unqualified, with the cli's short name", "verify_citations", clean.replace(`Pd \`${shared.real} (${shared.d})\``, `Pd \`${shared.real} (${shared.c})\``)],
    ["line-less pair: shared real name, cli-qualified, with the daemon's short name", "verify_citations", clean.replace(`Pc \`cli:${shared.real} (${shared.c})\``, `Pc \`cli:${shared.real} (${shared.d})\``)],
  ] : []),
  ["F3 line moved by 50", "check_bare_anchors", clean.replace(`\`${A.code}\`（\`${A.ln}\`）`, `\`${A.code}\`（\`${A.ln + 50}\`）`)],
  ["cli anchor loses its bundle prefix", "check_bare_anchors", clean.replace(`cli.pretty.js:${C.ln}`, `${C.ln}`)],
  ["a new bare line number", "check_bare_anchors", clean + `\nsee \`${A.ln}\`\n`],
  ["bare range runs backwards", "check_bare_anchors", clean + `\nsee \`${A.e.endLine}-${A.e.line}\`\n`],
  // the literal still matches, but the callee quoted with it is not on the line
  ["F3 snippet keeps its literal but calls a re-mangled name", "check_bare_anchors", clean.replace(`\`${A.code}\`（`, `\`Zq9(${A.code})\`（`)],
  // shaped like `real (short)` but indexed nowhere, so verify_citations skips it
  ["call-shaped snippet with a wrong line", "check_bare_anchors", clean + `\nsee \`zqxwvut(e)\`（\`${A.ln}\`）\n`],
  // written where lineSpan() cannot match: every one used to pass unexamined
  ["plain-text daemon:N in a table cell", "check_bare_anchors", clean + `\n| claim | \`${A.code}\` | daemon:${A.ln} | confirmed |\n`],
  ["plain-text daemon.pretty.js:N chained with / ", "check_bare_anchors", clean + `\nsee ${A.code} (daemon.pretty.js:${A.ln} / ${A.e.line})\n`],
  ["plain-text cli.pretty.js:N", "check_bare_anchors", clean + `\nsee cli.pretty.js:${C.ln}\n`],
  ["plain-text range runs backwards", "check_bare_anchors", clean + `\nsee daemon:${A.e.endLine}-${A.e.line}\n`],
  ["several lines in one code span", "check_bare_anchors", clean + `\nsee \`daemon.pretty.js:${A.ln}/${A.e.line}\`\n`],
  ["code span opening with a line number", "check_bare_anchors", clean + `\nsee \`${A.ln} ${A.code}\`\n`],
  ["line number inside a fenced diagram", "check_bare_anchors", clean + "\n```\n" + `step ① ${A.real}  [${A.ln}]` + "\n```\n"],
  ["space-qualified number in a table row", "check_bare_anchors", clean + `\n| claim | \`${A.code}\` | daemon ${A.ln} | confirmed |\n`],
  ["un-backticked number in a parenthesis after a snippet", "check_bare_anchors", clean + `\nsee \`${A.code}\`(${A.ln})\n`],
  ["N snippet bound to a symbol that does not contain it", "check_bare_anchors", clean.replace(`\`${A.code}\`（\`${A.real}\`）`, `\`${A.code}\`（\`${otherReal}\`）`)],
  ["N snippet bound to a real name that is not indexed", "check_bare_anchors", clean.replace(`\`${A.code}\`（\`${A.real}\`）`, `\`${A.code}\`（\`nonexistentSymbolName\`）`)],
  // UPPER_SNAKE has no lower-case letter, and looksReal alone read it as prose
  ["N snippet bound to an UPPER_SNAKE constant name that is not indexed", "check_bare_anchors", clean.replace(`\`${A.code}\`（\`${A.real}\`）`, `\`${A.code}\`（\`VANISHED_CONSTANT_NAME\`）`)],
  // the identifier still matches; only the number is wrong
  ...(K3 ? [["N constant keeps its name but cites a wrong number", "check_bare_anchors", clean.replace(`Nk3 \`${K3.code}\``, `Nk3 \`${K3.wrong}\``)]] : []),
  // ...and a wrong number the span does hold elsewhere
  ...(K3?.wrongInSpan ? [["N constant cites another number of the same span", "check_bare_anchors", clean.replace(`Nk3 \`${K3.code}\``, `Nk3 \`${K3.wrongInSpan}\``)]] : []),
  // no distinctive token at all: used to be uncheckable, now a token sequence
  ...(K2 ? [["N short-name constant cites a wrong number", "check_bare_anchors", clean.replace(`Nk2 \`${K2.code}\``, `Nk2 \`${K2.wrong}\``)]] : []),
  // line numbers are legacy: even a correct, well-formed one may not be added
  ["a new, correct F1 line number beyond the ratchet", "check_bare_anchors", clean + `\nagain \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）\n`],
];

// Every run gets its own directory holding a doc.md: the baseline is keyed by
// the doc's file name, and concurrent runs must not share a file.
let seq = 0;
const docAt = (text) => {
  const dir = path.join(tmp, String(++seq).padStart(2, "0"));
  fs.mkdirSync(dir);
  const p = path.join(dir, "doc.md");
  fs.writeFileSync(p, text);
  return p;
};
const run = (args) => new Promise((resolve) => {
  const child = spawn(process.execPath, args, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  child.stdout.on("data", (d) => { out += d; });
  child.stderr.on("data", (d) => { out += d; });
  child.on("close", (status) => resolve({ status, out }));
});
// {label, args, expect, after?} -> printed in this order, whatever order they finish in
async function runAll(jobs) {
  const width = process.env.JOBS === "1" ? 1 : Math.max(1, os.availableParallelism() - 1);
  const results = new Array(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(width, jobs.length) }, async () => {
    while (next < jobs.length) { const i = next++; results[i] = await run(jobs[i].args); }
  }));
  let failed = 0;
  jobs.forEach((j, i) => {
    const { status, out } = results[i];
    const extra = j.after ? j.after() : null;  // a further condition, checked once the run is over
    const ok = status === j.expect && !extra;
    console.log(`${ok ? "ok  " : "FAIL"}  ${j.label} (exit ${status}${extra ? `; ${extra}` : ""})`);
    if (!ok) { failed++; out.trim().split("\n").slice(-12).forEach((l) => console.log(`        | ${l}`)); }
  });
  return failed;
}

// ---- verify_inferred.mjs: module initialisers and literal constants ----------
// One of each, by structure: a string/regex/template constant whose literal no
// other top-level constant has (else the clean run only warns), and a module
// initialiser that assigns a literal constant and whose shape no other one has
// (else the clean run only warns); a second initialiser sharing no string
// literal and no constant with the first; a function. The constant's mutant
// bundle changes one letter or digit inside its literal, in place, so the file
// still parses and no line moves.
// Then the cases each of which once passed (verify_inferred.mjs header):
//   - a name spelled for another kind, with NO recorded shape under it: a
//     function's name on an initialiser (runGapLint) and a constant's name on
//     a function. Only the kind-change rule saw these, and only with a record
//     under the name, which a hand-added name does not have; `record` wrote
//     one without complaint. This test used to move a RECORDED name only.
//   - two initialisers with one shape (TW): a name on either passed clean
//   - a move onto an initialiser sharing exactly one constant and no literal
//     (SH): only warned, since "shares something" was the rule
//   - a record that shares only default values (null, 0, ...) with the
//     initialiser the name is on, its own module gone (DF): run in-process on
//     judgeInitialiser with that one initialiser in the bundle, because with
//     the whole bundle the RIVAL rule refutes it first and the default rule
//     would never be exercised
let bad = 0;
const dSrc = dLines.join("\n");
const decls = topLevelDeclarations(parse(dSrc, { sourceType: "module", ranges: true }));
const byCanonical = new Map();
for (const [n, d] of decls) if (d.kind === "value") byCanonical.set(d.canonical, [...(byCanonical.get(d.canonical) ?? []), n]);
const pick = (test) => { for (const [n, d] of decls) if (test(n, d)) return [n, d]; return null; };
const LITERAL = new Set(["StringLiteral", "RegExpLiteral", "TemplateLiteral"]);
const V = pick((n, d) => d.kind === "value" && LITERAL.has(d.node.type) && byCanonical.get(d.canonical).length === 1 &&
  /[a-z0-9]/.test(dSrc.slice(d.node.start + 1, d.node.end - 1)));
const initShapes = initialiserShapes(decls);
const shapeCount = new Map();
for (const sh of initShapes.values()) { const k = JSON.stringify(sh); shapeCount.set(k, (shapeCount.get(k) || 0) + 1); }
const unique = (n) => shapeCount.get(JSON.stringify(initShapes.get(n))) === 1;
const M = pick((n, d) => d.kind === "moduleInit" && d.values.length > 0 && unique(n));
const Mid = M && new Set([...shapeOf(M[1]).literals, ...M[1].values]);
// M2 has an identity of its own, so it is the "shares nothing" rule that
// refuses it, not the refusal of an initialiser with no identity at all (M0)
const identity = (d) => [...shapeOf(d).literals, ...d.values];
const M2 = M && pick((n, d) => d.kind === "moduleInit" && n !== M[0] && identity(d).length > 0 && !identity(d).some(x => Mid.has(x)));
const M0 = pick((n, d) => d.kind === "moduleInit" && identity(d).length === 0);
const F = pick((n, d) => isFunctionLike(d));
const inits = [...initShapes].map(([n, sh]) => ({ n, sh })).filter(x => x.sh.literals.length + x.sh.values.length > 0);
const TW = (() => {
  const seen = new Map();
  for (const x of inits) { const k = JSON.stringify(x.sh); if (seen.has(k)) return [seen.get(k), x.n]; seen.set(k, x.n); }
  return null;
})();
const SH = (() => {
  for (const a of inits) {
    if (a.n === M?.[0] || !unique(a.n)) continue;
    for (const b of inits) {
      if (b.n === a.n) continue;
      const vs = a.sh.values.filter(v => b.sh.values.includes(v));
      if (vs.length === 1 && !TRIVIAL_VALUES.has(vs[0]) && !a.sh.literals.some(l => b.sh.literals.includes(l))) return [a.n, b.n];
    }
  }
  return null;
})();
const DF = (() => {
  for (const a of inits) {
    if (!a.sh.literals.length && a.sh.values.every(v => TRIVIAL_VALUES.has(v))) continue;
    for (const b of inits) {
      if (b.n === a.n) continue;
      const vs = a.sh.values.filter(v => b.sh.values.includes(v));
      if (vs.length && vs.every(v => TRIVIAL_VALUES.has(v)) && !a.sh.literals.some(l => b.sh.literals.includes(l))) return [a, b];
    }
  }
  return null;
})();
const inferredJobs = [];
if (!V || !M || !M2 || !M0 || !F) console.log(`skip  verify_inferred cases: no ${[!V && "unique literal constant", !M && "module initialiser with a unique shape assigning a constant", !M2 && "second, unrelated initialiser", !M0 && "initialiser without literals", !F && "function"].filter(Boolean).join(", ")} in this release`);
else {
  const dir = path.join(tmp, "inferred");
  fs.mkdirSync(dir);
  const VI = path.join(HERE, "verify_inferred.mjs");
  let seqMap = 0;
  const map = (o) => { const f = path.join(dir, `inferred.${++seqMap}.json`); fs.writeFileSync(f, JSON.stringify(o)); return f; };
  const base = { [V[0]]: "MUTATION_TEST_CONSTANT", [M[0]]: "initMutationTestModule" };
  const cleanMap = map(base);
  // one `record` for every case, split into one baseline per case below: each
  // check must see only the names its map has, or it warns about the rest
  const recorded = path.join(dir, "shape.all.json");
  const rec = spawnSync(process.execPath, [VI, "record", DAEMON, map({ ...base,
    ...(TW ? { [TW[0]]: "initMutationTwinModule" } : {}), ...(SH ? { [SH[0]]: "initMutationShareModule" } : {}) }), recorded], { encoding: "utf8" });
  if (rec.status !== 0) { console.log(`FAIL  verify_inferred could not record the clean baseline (exit ${rec.status})\n${rec.stderr}`); bad++; }
  else {
    const all = JSON.parse(fs.readFileSync(recorded, "utf8"));
    const baselineOf = (file, names) => { const f = path.join(dir, file); fs.writeFileSync(f, JSON.stringify({ ...all, shapes: Object.fromEntries(names.map(n => [n, all.shapes[n]])) })); return f; };
    const shape = baselineOf("shape.json", Object.values(base));
    const v = V[1].node;
    const at = v.start + 1 + dSrc.slice(v.start + 1, v.end - 1).search(/[a-z0-9]/);
    const ch = dSrc[at];
    const next = /[0-9]/.test(ch) ? String((Number(ch) + 1) % 10) : ch === "z" ? "a" : String.fromCharCode(ch.charCodeAt(0) + 1);
    const literalBundle = path.join(dir, "daemon.literal-changed.pretty.js");
    fs.writeFileSync(literalBundle, dSrc.slice(0, at) + next + dSrc.slice(at + 1));
    const vi = (bundle, m, sh = shape) => [VI, "check", bundle, m, sh];
    const refusedRecord = path.join(dir, "shape.refused.json");
    inferredJobs.push(
      { label: `clean map passes verify_inferred (constant ${V[0]}, module initialiser ${M[0]})`, args: vi(DAEMON, cleanMap), expect: 0 },
      { label: `constant ${V[0]} whose literal changed (${JSON.stringify(ch)} -> ${JSON.stringify(next)}) -> verify_inferred`, args: vi(literalBundle, cleanMap), expect: 1 },
      { label: `module initialiser name moved ${M[0]} -> ${M2[0]} (shares no literal or constant) -> verify_inferred`, args: vi(DAEMON, map({ [V[0]]: "MUTATION_TEST_CONSTANT", [M2[0]]: "initMutationTestModule" })), expect: 1 },
      { label: `module initialiser name moved onto function ${F[0]} -> verify_inferred`, args: vi(DAEMON, map({ [V[0]]: "MUTATION_TEST_CONSTANT", [F[0]]: "initMutationTestModule" })), expect: 1 },
      { label: `module initialiser name moved onto ${M0[0]}, which holds no literal and no constant -> verify_inferred`, args: vi(DAEMON, map({ [V[0]]: "MUTATION_TEST_CONSTANT", [M0[0]]: "initMutationTestModule" })), expect: 1 },
      { label: `a function's (camelCase) name on module initialiser ${M[0]}, no recorded shape under it -> verify_inferred`, args: vi(DAEMON, map({ [V[0]]: "MUTATION_TEST_CONSTANT", [M[0]]: "runMutationTestFunction" })), expect: 1 },
      { label: `record refuses a function's (camelCase) name on module initialiser ${M[0]}`, args: [VI, "record", DAEMON, map({ [M[0]]: "runMutationTestFunction" }), refusedRecord], expect: 1,
        after: () => (fs.existsSync(refusedRecord) ? "but it wrote a baseline" : null) },
      { label: `a constant's (UPPER_SNAKE) name on function ${F[0]}, no recorded shape under it -> verify_inferred`, args: vi(DAEMON, map({ ...base, [F[0]]: "MUTATION_TEST_FUNCTION_NAME" })), expect: 1 },
    );
    if (TW) {
      const twinShape = baselineOf("shape.twin.json", ["initMutationTwinModule"]);
      inferredJobs.push(
        { label: `module initialiser name on ${TW[0]}, which has the shape of ${TW[1]} -> verify_inferred warns`, args: vi(DAEMON, map({ [TW[0]]: "initMutationTwinModule" }), twinShape), expect: 3 },
        { label: `module initialiser name moved ${TW[0]} -> ${TW[1]}, its twin -> verify_inferred warns`, args: vi(DAEMON, map({ [TW[1]]: "initMutationTwinModule" }), twinShape), expect: 3 },
      );
    }
    if (SH) {
      const shareShape = baselineOf("shape.share.json", ["initMutationShareModule"]);
      inferredJobs.push(
        { label: `module initialiser name on ${SH[0]} passes its own record`, args: vi(DAEMON, map({ [SH[0]]: "initMutationShareModule" }), shareShape), expect: 0 },
        { label: `module initialiser name moved ${SH[0]} -> ${SH[1]} (shares one constant, no literal) -> verify_inferred`, args: vi(DAEMON, map({ [SH[1]]: "initMutationShareModule" }), shareShape), expect: 1 },
      );
    }
  }
}
if (!TW) console.log("skip  no two module initialisers share one shape this release: the twin cases did not run");
if (!SH) console.log("skip  no two module initialisers share exactly one constant and no literal: that move did not run");
if (!DF) console.log("skip  no two module initialisers share only default values: the default-value case did not run");
else {
  const [a, b] = DF;
  const j = judgeInitialiser("initMutationDefaultModule", b.n, a.sh, b.sh, new Map([[b.n, b.sh]]));
  console.log(`${j.fail ? "ok  " : "FAIL"}  module initialiser name moved ${a.n} -> ${b.n} (shares only default values), ${a.n} gone -> judgeInitialiser${j.fail ? "" : ` passed it: ${j.warn.join(" | ") || "clean"}`}`);
  if (!j.fail) bad++;
}

if (!shared) console.log("skip  no real name is in both bundles this release: the bundle-qualified pair mutants did not run");
if (!K3) console.log("skip  no `name = <number>` with a 3-4 character name inside an indexed symbol: the N number mutant did not run");
if (!K2) console.log("skip  no `name = <number>` with a 1-2 character name inside an indexed symbol: the N token-sequence mutant did not run");
if (K3 && !K3.wrongInSpan) console.log("skip  the constant's span holds no other number: the N same-span wrong-number mutant did not run");
// the clean doc's counts become the ceilings every mutant is measured against;
// this one run has to finish before any other starts
const recorded = spawnSync(process.execPath, [...bareArgs(docAt(clean), DAEMON), "--write-baseline"], { encoding: "utf8" });
if (recorded.status !== 0) { console.log(`FAIL  could not record the clean doc's baseline (exit ${recorded.status})\n${recorded.stdout}${recorded.stderr}`); bad++; }

const jobs = [];
for (const [name, args] of Object.entries(checks)) jobs.push({ label: `clean doc passes ${name}`, args: args(docAt(clean)), expect: 0 });
for (const [label, owner, text] of mutants) {
  if (text === clean) { console.log(`FAIL  mutant "${label}" did not change the doc`); bad++; continue; }
  jobs.push({ label: `${label} -> ${owner}`, args: checks[owner](docAt(text)), expect: 1 });
}
// the ratchet cannot be dodged by re-recording: a raise needs --allow-raise.
// It runs on its own copy of the baseline, which it must leave as it was.
const raiseBase = path.join(tmp, "baseline.raise.json");
fs.copyFileSync(baseline, raiseBase);
const recordedText = fs.readFileSync(baseline, "utf8");
jobs.push({
  label: "--write-baseline refuses to raise a ceiling",
  args: [...bareArgs(docAt(clean + `\nagain \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）\n`), DAEMON, raiseBase), "--write-baseline"],
  expect: 1,
  after: () => fs.readFileSync(raiseBase, "utf8") === recordedText ? null : "but it rewrote the baseline",
});
for (const [name, args] of Object.entries(checks)) jobs.push({ label: `bundle shifted by one line -> ${name}`, args: args(docAt(clean), shifted), expect: 2 });
jobs.push(...inferredJobs);

bad += await runAll(jobs);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} mutant(s) survived` : `\nall mutants caught`);
process.exit(bad ? 1 : 0);
