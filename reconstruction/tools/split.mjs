// Lossless AST de-bundler for esbuild-minified duoduo bundles.
// Splits top-level module wrappers (esbuild __commonJS `k(...)` / __esm `$(...)`)
// into per-module files by EXACT byte-offset slicing. Non-module top-level
// statements are grouped into ordered "shell" segments. The re-assembler
// concatenates all segment files in manifest order and MUST reproduce the
// original source byte-for-byte (verified separately with diff).
//
// Usage: node split.mjs <input.pretty.js> <outdir>

import { parse } from "@babel/parser";
import fs from "node:fs";
import path from "node:path";

const [, , INPUT, OUTDIR] = process.argv;
if (!INPUT || !OUTDIR) {
  console.error("usage: node split.mjs <input.js> <outdir>");
  process.exit(2);
}

const src = fs.readFileSync(INPUT, "utf8");
const ast = parse(src, {
  sourceType: "module",
  ranges: true,
  plugins: [], // plain JS + import.meta; no TS/JSX
  errorRecovery: false,
});

// Identify the esbuild helper identifiers used as module wrappers STRUCTURALLY
// (each bundle mangles __commonJS/__esm to different short names). A module
// wrapper is `var NAME = HELPER(FN[, FN2])` where HELPER is a bare identifier
// and arg0 is a function/arrow. esbuild helpers are invoked this way hundreds
// of times; incidental higher-order calls in app code are rare, so we treat an
// identifier as a wrapper-helper only if it appears in >= THRESHOLD such calls.
const body = ast.program.body;

function isFn(n) {
  return n && (n.type === "ArrowFunctionExpression" || n.type === "FunctionExpression");
}
function wrapperCandidate(node) {
  if (!node || node.type !== "CallExpression") return null;
  if (node.callee.type !== "Identifier") return null;
  if (!node.arguments.length || !isFn(node.arguments[0])) return null;
  return { helper: node.callee.name, arg0: node.arguments[0] };
}

// pass 1: tally helper-identifier frequency across top-level module-shaped decls
const HELPER_THRESHOLD = 10;
const freq = new Map();
for (const stmt of body) {
  if (stmt.type !== "VariableDeclaration") continue;
  for (const d of stmt.declarations) {
    const c = wrapperCandidate(d.init);
    if (c && d.id.type === "Identifier") freq.set(c.helper, (freq.get(c.helper) || 0) + 1);
  }
}
const HELPERS = new Set([...freq].filter(([, n]) => n >= HELPER_THRESHOLD).map(([h]) => h));
console.error(`wrapper helpers: ${[...HELPERS].join(", ") || "(none)"} ` +
  `(freqs: ${[...freq].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([h, n]) => h + "=" + n).join(" ")})`);

// wrapperKind from arg0 param count: CJS inner fn is (exports, module)=>...,
// ESM inner fn is ()=>... . 2+ params => cjs, else esm.
function classifyWrapper(node) {
  const c = wrapperCandidate(node);
  if (!c || !HELPERS.has(c.helper)) return null;
  return c.arg0.params.length >= 2 ? "cjs" : "esm";
}
const segments = []; // {kind:'module'|'shell', name?, wrapperKind?, start, end}
let shellStart = null;
let shellEndPrev = 0; // end offset of previous statement (to capture leading ws)

function flushShell(upto) {
  if (shellStart === null) return;
  segments.push({ kind: "shell", start: shellStart, end: upto });
  shellStart = null;
}

let prevEnd = 0;
for (let i = 0; i < body.length; i++) {
  const stmt = body[i];
  // A module statement: VariableDeclaration with >=1 declarator whose init is a wrapper call.
  let moduleInfo = null;
  if (stmt.type === "VariableDeclaration") {
    for (const d of stmt.declarations) {
      const wk = classifyWrapper(d.init);
      if (wk && d.id.type === "Identifier") {
        moduleInfo = { name: d.id.name, wrapperKind: wk };
        break;
      }
    }
  }
  if (moduleInfo) {
    // close any open shell run before this module (shell captures [prevEnd..stmt.start? ]
    // We slice statements as [prevEnd, stmt.end) so leading ws belongs to the stmt.
    flushShell(prevEnd);
    segments.push({
      kind: "module",
      name: moduleInfo.name,
      wrapperKind: moduleInfo.wrapperKind,
      start: prevEnd,
      end: stmt.end,
    });
  } else {
    if (shellStart === null) shellStart = prevEnd;
    // extend current shell run to stmt.end (done implicitly via flush upto)
  }
  prevEnd = stmt.end;
  if (!moduleInfo) {
    // keep shell open; will be flushed at next module or at EOF
  }
}
// trailing shell + any bytes after last statement
flushShell(prevEnd);
// capture EOF trailing bytes (e.g., final newline) as a shell tail
if (prevEnd < src.length) {
  segments.push({ kind: "shell", start: prevEnd, end: src.length });
}
// capture leading bytes before first statement (shebang/whitespace) — body[0].start>0 handled
// because our first slice starts at prevEnd=0.

fs.mkdirSync(path.join(OUTDIR, "modules"), { recursive: true });
fs.mkdirSync(path.join(OUTDIR, "shell"), { recursive: true });

const manifest = [];
let shellIdx = 0;
const seenNames = new Map();
for (const seg of segments) {
  const text = src.slice(seg.start, seg.end);
  if (seg.kind === "module") {
    let base = seg.name;
    // guard against duplicate declared names across scopes (shouldn't happen at top level)
    const n = (seenNames.get(base) || 0) + 1;
    seenNames.set(base, n);
    const fname = n > 1 ? `${base}__${n}.${seg.wrapperKind}.js` : `${base}.${seg.wrapperKind}.js`;
    fs.writeFileSync(path.join(OUTDIR, "modules", fname), text);
    manifest.push({ kind: "module", name: seg.name, wrapperKind: seg.wrapperKind, file: `modules/${fname}`, bytes: text.length, start: seg.start, end: seg.end });
  } else {
    const fname = `shell_${String(shellIdx).padStart(4, "0")}.js`;
    shellIdx++;
    fs.writeFileSync(path.join(OUTDIR, "shell", fname), text);
    manifest.push({ kind: "shell", file: `shell/${fname}`, bytes: text.length, start: seg.start, end: seg.end });
  }
}

fs.writeFileSync(
  path.join(OUTDIR, "manifest.json"),
  JSON.stringify({ input: path.resolve(INPUT), totalBytes: src.length, moduleCount: manifest.filter(s => s.kind === "module").length, shellCount: manifest.filter(s => s.kind === "shell").length, segments: manifest }, null, 2)
);

console.log(`parsed ${body.length} top-level statements`);
console.log(`modules: ${manifest.filter(s => s.kind === "module").length}, shell segments: ${manifest.filter(s => s.kind === "shell").length}`);
console.log(`manifest -> ${path.join(OUTDIR, "manifest.json")}`);
