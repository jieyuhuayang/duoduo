// Extract top-level named first-party bindings from the RENAMED daemon into a
// readable per-subsystem source tree. Each file contains the full declaration
// (function/const) sliced from the renamed source, plus a header noting its
// original mangled name and pretty-file line. These files are for READING; the
// runnable artifact is the whole daemon.recon.js.
// Usage: node extract_functions.mjs <daemon.recon.js> <rename.json> <subsys.json> <outdir> <origPretty.js>
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default || _traverse;
import fs from "node:fs";
import path from "node:path";

const [, , RECON, MAP, SUBSYS, OUTDIR, ORIG] = process.argv;
const src = fs.readFileSync(RECON, "utf8");
const renameMap = JSON.parse(fs.readFileSync(MAP, "utf8")); // mangled -> newName
const subsys = JSON.parse(fs.readFileSync(SUBSYS, "utf8")); // newName -> subsystem
const origSrc = fs.readFileSync(ORIG, "utf8");

// invert rename: newName -> mangled
const inv = {};
for (const [m, n] of Object.entries(renameMap)) inv[n] = m;

// line index for ORIGINAL pretty file (to report original line numbers)
const origLineStarts = [0];
for (let i = 0; i < origSrc.length; i++) if (origSrc[i] === "\n") origLineStarts.push(i + 1);

const ast = parse(src, { sourceType: "module", ranges: true });
let programScope;
traverse(ast, { Program(p) { programScope = p.scope; p.stop(); } });

// find original mangled-name line in ORIG (first declaration occurrence)
function origLineOf(mangled) {
  // match `var MANGLED =` / `function MANGLED(` / `const MANGLED =`
  const re = new RegExp(`(?:^|\\n)\\s*(?:var|let|const|function|async function)\\s+${mangled.replace(/[$]/g, "\\$")}\\b`);
  const m = re.exec(origSrc);
  if (!m) return null;
  const off = m.index;
  let lo = 0, hi = origLineStarts.length - 1, ans = 0;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (origLineStarts[mid] <= off) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans + 1;
}

const index = [];
let extracted = 0, missing = [];
for (const [newName, sub] of Object.entries(subsys)) {
  const binding = programScope.bindings[newName];
  if (!binding) { missing.push(newName); continue; }
  // enclosing statement
  let p = binding.path;
  if (p.isVariableDeclarator()) p = p.parentPath; // -> VariableDeclaration
  const node = p.node;
  const text = src.slice(node.start, node.end);
  const mangled = inv[newName] || "?";
  const origLine = origLineOf(mangled);
  const dir = path.join(OUTDIR, sub);
  fs.mkdirSync(dir, { recursive: true });
  const header = `// duoduo reconstruction — subsystem: ${sub}\n` +
    `// symbol: ${newName}  (minified: ${mangled}, daemon.pretty.js:${origLine ?? "?"})\n` +
    `// NOTE: readable extract from daemon.recon.js; references other top-level\n` +
    `// symbols. The runnable artifact is recon/daemon.recon.js (provably equivalent).\n\n`;
  fs.writeFileSync(path.join(dir, `${newName}.js`), header + text + "\n");
  index.push({ subsystem: sub, symbol: newName, mangled, origLine, bytes: text.length });
  extracted++;
}

index.sort((a, b) => (a.subsystem + a.symbol).localeCompare(b.subsystem + b.symbol));
fs.writeFileSync(path.join(OUTDIR, "index.json"), JSON.stringify(index, null, 2));
console.log(`extracted ${extracted} first-party functions into ${OUTDIR}`);
if (missing.length) console.log(`not top-level (skipped): ${missing.join(", ")}`);
// per-subsystem counts
const bySub = {};
for (const e of index) bySub[e.subsystem] = (bySub[e.subsystem] || 0) + 1;
console.log("by subsystem:", JSON.stringify(bySub));
