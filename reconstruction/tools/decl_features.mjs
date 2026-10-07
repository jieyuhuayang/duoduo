// The minifier-proof features of every top-level declaration of a bundle:
// what history_chain.mjs falls back on when neither an identical body nor a
// positional pair carries a symbol into the previous release.
//
// esbuild --minify-syntax rewrites control flow and re-mangles every local,
// so two releases of one function may share no token sequence. What it
// cannot change: property names (`.sessionId`), string literals, numbers and
// the globals the code calls (`process`, `JSON`, `setTimeout`). Those, plus
// the arity and the position in the bundle, identify a function across a
// rewrite well enough to rank candidates (match_published_source.mjs uses the
// same idea between the protocol package's TypeScript and the bundle).
//
// Output: { version?, order: [mangled...], decls: { mangled: { i, kind, arity, p:[props], s:[strings], n:[numbers], g:[globals] } } }
// Usage: node decl_features.mjs <pretty.js> <out.json>
import { parse } from "@babel/parser";
import fs from "node:fs";

const [PRETTY, OUT] = process.argv.slice(2);
if (!PRETTY || !OUT) { console.error("usage: node decl_features.mjs <pretty.js> <out.json>"); process.exit(2); }
const src = fs.readFileSync(PRETTY, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });

const top = new Set();
const decls = []; // [name, node, kind]
for (const stmt of ast.program.body) {
  if (stmt.type === "FunctionDeclaration" && stmt.id) { top.add(stmt.id.name); decls.push([stmt.id.name, stmt, "function"]); }
  else if (stmt.type === "ClassDeclaration" && stmt.id) { top.add(stmt.id.name); decls.push([stmt.id.name, stmt, "class"]); }
  else if (stmt.type === "VariableDeclaration") for (const d of stmt.declarations) {
    if (d.id.type !== "Identifier") continue;
    top.add(d.id.name);
    const init = d.init;
    // esbuild's __esm/__commonJS helpers are mangled in the bundle, so a module
    // initialiser is recognised by its shape: a call whose argument is a function
    const kind = !init ? "var (uninitialised)" : /Function/.test(init.type) ? "function-expr" : init.type === "ClassExpression" ? "class-expr"
      : init.type === "CallExpression" && init.arguments.some(a => /Function/.test(a.type)) ? "module-init" : "var";
    decls.push([d.id.name, init ?? d, kind]);
  }
}

const SKIP = new Set(["loc", "range", "leadingComments", "trailingComments", "innerComments", "extra"]);
function featuresOf(node) {
  const p = new Set(), s = new Set(), n = new Set(), g = new Set();
  let arity = null;
  const fn = node.type === "FunctionDeclaration" || /Function/.test(node.type) ? node : null;
  if (fn) arity = fn.params.length;
  const walk = (x, parent, key) => {
    if (!x || typeof x.type !== "string") return;
    switch (x.type) {
      case "MemberExpression": case "OptionalMemberExpression":
        if (!x.computed && x.property.type === "Identifier") p.add(x.property.name); break;
      case "ObjectProperty": case "ObjectMethod": case "ClassMethod": case "ClassProperty":
        if (!x.computed && x.key.type === "Identifier") p.add(x.key.name); else if (x.key.type === "StringLiteral") p.add(x.key.value); break;
      case "StringLiteral": if (x.value.length >= 2) s.add(x.value.length > 80 ? x.value.slice(0, 80) : x.value); break;
      case "TemplateElement": { const v = (x.value.cooked ?? x.value.raw).trim(); if (v.length >= 3) s.add(v.length > 80 ? v.slice(0, 80) : v); break; }
      case "NumericLiteral": n.add(x.value); break;
      case "Identifier":
        // a reference (not a key, not a binding) to a name no top-level statement declares, 3+ chars: a global or an import
        if (parent && !(parent.type === "MemberExpression" && parent.property === x && !parent.computed) &&
            !(parent.type === "ObjectProperty" && parent.key === x && !parent.computed) &&
            !/^(VariableDeclarator|FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ClassDeclaration|ClassMethod|ObjectMethod|CatchClause|AssignmentPattern|RestElement|ObjectPattern|ArrayPattern)$/.test(parent.type) &&
            x.name.length >= 3 && !top.has(x.name)) g.add(x.name);
        break;
    }
    for (const k of Object.keys(x)) {
      if (SKIP.has(k)) continue;
      const v = x[k];
      if (Array.isArray(v)) for (const y of v) walk(y, x, k);
      else if (v && typeof v.type === "string") walk(v, x, k);
    }
  };
  walk(node, null, null);
  return { arity, p: [...p].sort(), s: [...s].sort(), n: [...n].sort((a, b) => a - b), g: [...g].sort() };
}

const out = { source: PRETTY, order: decls.map(d => d[0]), decls: {} };
decls.forEach(([name, node, kind], i) => { out.decls[name] = { i, kind, ...featuresOf(node) }; });
fs.writeFileSync(OUT, JSON.stringify(out) + "\n");
console.log(`features: ${decls.length} declarations -> ${OUT}`);
