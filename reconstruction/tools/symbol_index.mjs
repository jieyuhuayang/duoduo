// The authoritative answer to "where is symbol X, and is it still the same code".
//
// Docs cite evidence by line number. A line number is a coordinate in a build
// artifact: esbuild re-mangles and re-lays-out every release, so every anchor
// dies on every bump, and this repo has spent 25 of its 166 commits putting
// them back. The symbol NAME does not die — it comes verbatim from esbuild's
// own __export helper — and neither does the symbol's CODE.
//
// So this index records, per first-party symbol: its name, its current line,
// and a structural signature of its body (identifiers alpha-renamed, literals
// kept — see structural_signature.mjs). That makes line numbers a DERIVED
// quantity, regenerated from the bundle instead of hand-maintained in prose,
// and makes "did this mechanism actually change?" answerable across versions by
// comparing signatures rather than eyeballing a diff.
//
// Usage: node symbol_index.mjs <pretty.js> <rename.json> <out.json> [--version <v>]
import { parse } from "@babel/parser";
import { signature } from "./structural_signature.mjs";
import fs from "node:fs";

const argv = process.argv.slice(2);
let VERSION = "unrecorded";
const vi = argv.indexOf("--version");
if (vi !== -1) { VERSION = argv[vi + 1]; argv.splice(vi, 2); }
const [PRETTY, RENAME, OUT] = argv;
if (!PRETTY || !RENAME || !OUT) {
  console.error("usage: node symbol_index.mjs <pretty.js> <rename.json> <out.json> [--version <v>]");
  process.exit(2);
}

const src = fs.readFileSync(PRETTY, "utf8");
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8")); // mangled -> real
const ast = parse(src, { sourceType: "module", ranges: true });

// Top-level declarations only, first binding wins. The line of a `var` comes
// from the declarator identifier, matching extract_functions.mjs and
// verify_first_party.mjs — the first-party tree headers and the gate that
// checks them both use d.id, and a third convention here would desynchronise
// them for shared `var A, B, C` statements.
const decl = new Map(); // mangled -> { line, endLine, kind, node, stmt }
function put(name, anchorNode, valueNode, stmt, kind) {
  if (decl.has(name)) return;
  decl.set(name, {
    line: anchorNode.loc.start.line,
    endLine: stmt.loc.end.line,
    kind,
    node: valueNode,
    stmt,
  });
}
for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) {
    put(stmt.id.name, stmt.id, stmt, stmt, stmt.async ? "async function" : "function");
  } else if (stmt.type === "ClassDeclaration" && stmt.id) {
    put(stmt.id.name, stmt.id, stmt, stmt, "class");
  } else if (stmt.type === "VariableDeclaration") {
    for (const d of stmt.declarations) {
      if (d.id.type !== "Identifier") continue;
      const init = d.init;
      let kind = "var";
      if (init) {
        if (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") kind = init.async ? "async function-expr" : "function-expr";
        else if (init.type === "ClassExpression") kind = "class-expr";
        else if (init.type === "CallExpression") kind = "var = call";
        else kind = "var = " + init.type;
      } else kind = "var (uninitialised)";
      put(d.id.name, d.id, init || d.id, stmt, kind);
    }
  }
}

const symbols = {};
const missing = [];
for (const [mangled, real] of Object.entries(rename)) {
  const d = decl.get(mangled);
  if (!d) { missing.push(`${real} (${mangled})`); continue; }
  let sig = null;
  try { sig = signature(d.node); } catch { sig = null; }
  symbols[real] = {
    mangled,
    line: d.line,
    endLine: d.endLine,
    kind: d.kind,
    bytes: d.stmt.end - d.stmt.start,
    signature: sig,
  };
}

const report = {
  bundle: PRETTY.replace(/^.*\//, "").replace(/\.pretty\.js$/, ""),
  version: VERSION,
  source: PRETTY,
  symbolCount: Object.keys(symbols).length,
  notTopLevel: missing,
  symbols,
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");

console.error(`  symbol index: ${report.symbolCount} symbol(s) -> ${OUT}`);
if (missing.length) {
  // Not fatal: a renamed symbol can legitimately be a nested binding. It just
  // cannot be cited by line, so it cannot appear in the first-party tree either.
  console.error(`  note: ${missing.length} renamed symbol(s) are not top-level declarations: ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? ", ..." : ""}`);
}
