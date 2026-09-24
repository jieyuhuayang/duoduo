// Mutation test for the doc-anchor checkers.
//
// A checker that has never been seen to fail proves nothing: check_bare_anchors
// once had a vendor arm that could not fire, and its green runs meant nothing
// for versions. This builds a small synthetic doc whose citations are derived
// from the symbol index and the bundle itself (so it tracks every release with
// no fixture to maintain), confirms each checker PASSES on it, then injects one
// known error at a time and confirms the responsible checker FAILS.
//
// Usage: node mutate_anchor_checks.mjs <daemon.pretty.js> <cli.pretty.js> <maps-dir>
// Exit 1 if any mutant survives or the clean doc does not pass.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { snippetTokens } from "./anchor_forms.mjs";

const [DAEMON, CLI, MAPS] = process.argv.slice(2);
if (!DAEMON || !CLI || !MAPS) { console.error("usage: node mutate_anchor_checks.mjs <daemon.pretty.js> <cli.pretty.js> <maps-dir>"); process.exit(2); }
const HERE = path.dirname(new URL(import.meta.url).pathname);
// the module classification is hand-made and lives only in maps/, whichever
// directory the generated symbol/block files come from
const MODULES = path.join(HERE, "..", "maps", "modules_daemon.json");
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

const clean = [
  `F1 \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）`,
  `F2 \`${A.e.mangled}\`（\`${A.e.line}\`）`,
  `F3 \`${A.code}\`（\`${A.ln}\`）`,
  `F3cli \`${C.code}\`（\`cli.pretty.js:${C.ln}\`）`,
  `range \`${A.e.mangled}\`（\`${A.e.line}-${A.e.endLine}\`）`,
  // F2 needs no backticks on the number, so a parenthesis after a span is owned
  `F2bare \`${A.e.mangled}\`(${A.e.line})`,
  // N: evidence bound to the symbol by name, no line number at all
  `N \`${A.code}\`（\`${A.real}\`）`,
  `Ncli \`${C.code}\`（\`cli:${C.real}\`）`,
  // numbers that are not line citations must stay invisible: a count in prose
  // (qualified or not), a port inside code, a date/error code/size/expression
  // in a fence
  `a 5-digit count in prose, 12345 ms, daemon 91616 lines, and a port in code \`PORT ?? 20233\``,
  "```\n2026-06-30.jsonl  -32601  10MB  3600*1e3\n```",
].join("\n\n") + "\n";

// the bundle guard's mutant: same code, every line shifted by one
const shifted = path.join(tmp, "daemon.pretty.js");
fs.writeFileSync(shifted, "\n" + dLines.join("\n"));

const baseline = path.join(tmp, "baseline.json");
fs.writeFileSync(baseline, JSON.stringify({ unbound: {} }));
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8" }).status;
const bareArgs = (doc, d) => [path.join(HERE, "check_bare_anchors.mjs"), "--index", `${MAPS}/symbols_daemon.json,${MAPS}/symbols_cli.json`, "--bundle", `cli=${CLI}`, "--baseline", baseline, d, `${MAPS}/blocks_daemon.json`, MODULES, doc];
const checks = {
  verify_citations: (doc, d = DAEMON) => node([path.join(HERE, "verify_citations.mjs"), `${MAPS}/symbols_daemon.json,${MAPS}/symbols_cli.json`, "--bundle", `daemon=${d}`, "--bundle", `cli=${CLI}`, doc, "--quiet"]),
  check_doc_anchors: (doc, d = DAEMON) => node([path.join(HERE, "check_doc_anchors.mjs"), "--resolve", "--index", `${MAPS}/symbols_daemon.json`, d, doc]),
  check_bare_anchors: (doc, d = DAEMON) => node(bareArgs(doc, d)),
};

const mutants = [
  ["F1 short name swapped", "verify_citations", clean.replace(`${A.real} (${A.e.mangled})`, `${A.real} (${other.mangled})`)],
  ["F2 short name swapped", "check_doc_anchors", clean.replace(`F2 \`${A.e.mangled}\``, `F2 \`${other.mangled}\``)],
  ["F2 range end moved before start", "check_doc_anchors", clean.replace(`${A.e.line}-${A.e.endLine}`, `${A.e.line}-${A.e.line - 7}`)],
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
  // line numbers are legacy: even a correct, well-formed one may not be added
  ["a new, correct F1 line number beyond the ratchet", "check_bare_anchors", clean + `\nagain \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）\n`],
];

let bad = 0;
const docPath = path.join(tmp, "doc.md");
fs.writeFileSync(docPath, clean);
// the clean doc's counts become the ceilings every mutant is measured against
const recorded = node([...bareArgs(docPath, DAEMON), "--write-baseline"]);
if (recorded !== 0) { console.log(`FAIL  could not record the clean doc's baseline (exit ${recorded})`); bad++; }
for (const [name, run] of Object.entries(checks)) {
  const s = run(docPath);
  console.log(`${s === 0 ? "ok  " : "FAIL"}  clean doc passes ${name} (exit ${s})`);
  if (s !== 0) bad++;
}
for (const [label, owner, text] of mutants) {
  if (text === clean) { console.log(`FAIL  mutant "${label}" did not change the doc`); bad++; continue; }
  fs.writeFileSync(docPath, text);
  const s = checks[owner](docPath);
  console.log(`${s === 1 ? "ok  " : "FAIL"}  ${label} -> ${owner} exit ${s}`);
  if (s !== 1) bad++;
}
// the ratchet cannot be dodged by re-recording: a raise needs --allow-raise
fs.writeFileSync(docPath, clean + `\nagain \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）\n`);
const raise = node([...bareArgs(docPath, DAEMON), "--write-baseline"]);
console.log(`${raise === 1 ? "ok  " : "FAIL"}  --write-baseline refuses to raise a ceiling (exit ${raise})`);
if (raise !== 1) bad++;
fs.writeFileSync(docPath, clean);
for (const [name, run] of Object.entries(checks)) {
  const s = run(docPath, shifted);
  console.log(`${s === 2 ? "ok  " : "FAIL"}  bundle shifted by one line -> ${name} exit ${s}`);
  if (s !== 2) bad++;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} mutant(s) survived` : `\nall mutants caught`);
process.exit(bad ? 1 : 0);
