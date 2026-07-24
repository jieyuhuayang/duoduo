// Remap daemon.pretty.js:LINE anchors and top-level mangled names from an old
// bundle version to a new one, using structural fingerprint matching.
// Emits: (1) name map old_mangled->new_mangled for all matched top-level decls,
//        (2) a function to remap any interior line.
// Usage: node anchor_remap.mjs <old.pretty.js> <new.pretty.js> <fpmatch.json> <lines_csv> <out.json>
import { parse } from "@babel/parser";
import fs from "node:fs";

const [, , OLD, NEW, FP, LINES, OUT] = process.argv;
const oldSrc = fs.readFileSync(OLD, "utf8");
const newSrc = fs.readFileSync(NEW, "utf8");
const fp = JSON.parse(fs.readFileSync(FP, "utf8"));

function decls(src) {
  const ast = parse(src, { sourceType: "module", ranges: true });
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  const lineAt = (off) => { let lo = 0, hi = starts.length - 1, a = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= off) { a = m; lo = m + 1; } else hi = m - 1; } return a + 1; };
  const list = []; // {name,startLine,endLine}
  for (const stmt of ast.program.body) {
    let name = null;
    if (stmt.type === "FunctionDeclaration" && stmt.id) name = stmt.id.name;
    else if (stmt.type === "ClassDeclaration" && stmt.id) name = stmt.id.name;
    else if (stmt.type === "VariableDeclaration") { for (const d of stmt.declarations) if (d.id.type === "Identifier") { list.push({ name: d.id.name, startLine: lineAt(stmt.start), endLine: lineAt(stmt.end) }); } continue; }
    if (name) list.push({ name, startLine: lineAt(stmt.start), endLine: lineAt(stmt.end) });
  }
  list.sort((a, b) => a.startLine - b.startLine);
  return { list, lineAt };
}
const O = decls(oldSrc), N = decls(newSrc);
const newByName = new Map(N.list.map(d => [d.name, d]));
const oldByName = new Map(O.list.map(d => [d.name, d]));

// name map old->new (unique matches only)
const nameMap = {};
for (const [oldN, m] of Object.entries(fp.matched)) if (m.unique) nameMap[oldN] = m.new;

function enclosingOld(line) {
  let ans = null;
  for (const d of O.list) { if (d.startLine <= line && line <= d.endLine) { if (!ans || d.startLine > ans.startLine) ans = d; } }
  return ans;
}
function remapLine(line) {
  const encl = enclosingOld(line);
  if (!encl) return { line, new: null, note: "no-enclosing-toplevel" };
  const newN = nameMap[encl.name];
  if (!newN) return { line, new: null, oldFn: encl.name, note: fp.changedOld.includes(encl.name) ? "CHANGED-fn" : "unmatched-fn" };
  const nd = newByName.get(newN);
  if (!nd) return { line, new: null, oldFn: encl.name, note: "new-decl-missing" };
  const offset = line - encl.startLine;
  return { line, new: nd.startLine + offset, oldFn: encl.name, newFn: newN, note: "ok" };
}

const inputLines = LINES && fs.existsSync(LINES) ? fs.readFileSync(LINES, "utf8").split(/\s+/).filter(Boolean).map(Number) : [];
const remaps = {};
for (const l of inputLines) remaps[l] = remapLine(l);

fs.writeFileSync(OUT, JSON.stringify({ nameMapCount: Object.keys(nameMap).length, nameMap, remaps }, null, 1));
// summary to stdout
const oks = Object.values(remaps).filter(r => r.note === "ok").length;
const chg = Object.values(remaps).filter(r => r.note === "CHANGED-fn").length;
const other = Object.values(remaps).length - oks - chg;
console.log(`nameMap=${Object.keys(nameMap).length} lines=${inputLines.length} ok=${oks} changed-fn=${chg} other=${other}`);
