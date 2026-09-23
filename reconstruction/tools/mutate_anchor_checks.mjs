// Mutation test for the four doc-anchor checkers.
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
const other = fnSyms(idxD).find(([, e]) => e.mangled !== A.e.mangled && !dLines[A.e.line - 1].includes(e.mangled))[1];
const C = pickWithLiteral(idxC, cLines);

const clean = [
  `F1 \`${A.real} (${A.e.mangled})\`（\`${A.e.line}\`）`,
  `F2 \`${A.e.mangled}\`（\`${A.e.line}\`）`,
  `F3 \`${A.code}\`（\`${A.ln}\`）`,
  `F3cli \`${C.code}\`（\`cli.pretty.js:${C.ln}\`）`,
  `range \`${A.e.mangled}\`（\`${A.e.line}-${A.e.endLine}\`）`,
].join("\n\n") + "\n";

// the bundle guard's mutant: same code, every line shifted by one
const shifted = path.join(tmp, "daemon.pretty.js");
fs.writeFileSync(shifted, "\n" + dLines.join("\n"));

const baseline = path.join(tmp, "baseline.json");
fs.writeFileSync(baseline, JSON.stringify({ unbound: {} }));
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8" }).status;
const checks = {
  verify_citations: (doc, d = DAEMON) => node([path.join(HERE, "verify_citations.mjs"), `${MAPS}/symbols_daemon.json,${MAPS}/symbols_cli.json`, "--bundle", `daemon=${d}`, "--bundle", `cli=${CLI}`, doc, "--quiet"]),
  check_doc_anchors: (doc, d = DAEMON) => node([path.join(HERE, "check_doc_anchors.mjs"), "--resolve", "--index", `${MAPS}/symbols_daemon.json`, d, doc]),
  check_bare_anchors: (doc, d = DAEMON) => node([path.join(HERE, "check_bare_anchors.mjs"), "--index", `${MAPS}/symbols_daemon.json,${MAPS}/symbols_cli.json`, "--bundle", `cli=${CLI}`, "--baseline", baseline, d, `${MAPS}/blocks_daemon.json`, `${MAPS}/modules_daemon.json`, doc]),
};

const mutants = [
  ["F1 short name swapped", "verify_citations", clean.replace(`${A.real} (${A.e.mangled})`, `${A.real} (${other.mangled})`)],
  ["F2 short name swapped", "check_doc_anchors", clean.replace(`F2 \`${A.e.mangled}\``, `F2 \`${other.mangled}\``)],
  ["F2 range end moved before start", "check_doc_anchors", clean.replace(`${A.e.line}-${A.e.endLine}`, `${A.e.line}-${A.e.line - 7}`)],
  ["F3 line moved by 50", "check_bare_anchors", clean.replace(`\`${A.code}\`（\`${A.ln}\`）`, `\`${A.code}\`（\`${A.ln + 50}\`）`)],
  ["cli anchor loses its bundle prefix", "check_bare_anchors", clean.replace(`cli.pretty.js:${C.ln}`, `${C.ln}`)],
  ["a new bare line number", "check_bare_anchors", clean + `\nsee \`${A.ln}\`\n`],
  ["bare range runs backwards", "check_bare_anchors", clean + `\nsee \`${A.e.endLine}-${A.e.line}\`\n`],
];

let bad = 0;
const docPath = path.join(tmp, "doc.md");
fs.writeFileSync(docPath, clean);
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
fs.writeFileSync(docPath, clean);
for (const [name, run] of Object.entries(checks)) {
  const s = run(docPath, shifted);
  console.log(`${s === 2 ? "ok  " : "FAIL"}  bundle shifted by one line -> ${name} exit ${s}`);
  if (s !== 2) bad++;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(bad ? `\n${bad} mutant(s) survived` : `\nall mutants caught`);
process.exit(bad ? 1 : 0);
