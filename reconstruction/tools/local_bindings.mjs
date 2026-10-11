// The local bindings of first-party code, enumerated the same way by the tool
// that names them (name_locals.mjs) and the proof that checks them
// (ast_equiv.mjs --locals).
//
// esbuild renames every local of every function to one or two letters, and
// rename.mjs only renames top-level bindings, so inside each first-party
// declaration almost every name is still minified. A local has no stable name
// of its own to key a naming by: esbuild assigns `e`, `t`, `n`, ... per scope
// by frequency, and the same spelling occurs dozens of times in one
// declaration. So a local is identified by
//
//   decl      the real name of the top-level declaration that contains it
//             (rename map; vendored and unnamed declarations are never named)
//   ordinal   its position among that declaration's local bindings, ordered
//             by where the binding identifier starts
//   ctx       a hash of the source around the binding identifier, with every
//             local spelled `_`, every top-level binding without a real name
//             spelled `#`, and whitespace collapsed. Real names, globals,
//             property names and literals stay. It does not change when
//             esbuild re-mangles, and it changes only when code next to the
//             binding changes, so it locates the binding again in a later
//             release.
//
// The ordinal is what the proof uses (both files have the same structure, so
// the same ordinals); the ctx is what a stored name is keyed by
// (maps/locals_daemon.json), so a name survives a release in which its
// declaration changed elsewhere.
import _traverse from "@babel/traverse";
import crypto from "node:crypto";
const traverse = _traverse.default || _traverse;

// An Identifier that names a variable, as opposed to a property name, a label,
// or the public side of an import/export (the same rule as rename.mjs).
export function isVariableOccurrence(p) {
  const n = p.node, par = p.parent;
  if ((par.type === "MemberExpression" || par.type === "OptionalMemberExpression") && par.property === n && !par.computed) return false;
  if ((par.type === "ObjectProperty" || par.type === "ObjectMethod" || par.type === "ClassProperty" ||
       par.type === "ClassMethod" || par.type === "ClassAccessorProperty" || par.type === "ClassPrivateProperty") &&
      par.key === n && !par.computed) return false;
  if ((par.type === "LabeledStatement" || par.type === "BreakStatement" || par.type === "ContinueStatement") && par.label === n) return false;
  if (par.type === "ExportSpecifier" && par.exported === n) return false;
  if (par.type === "ExportNamespaceSpecifier" || par.type === "ExportDefaultSpecifier") return false;
  if (par.type === "ImportSpecifier" && par.imported === n) return false;
  if (par.type === "MetaProperty") return false;
  if (par.type === "PrivateName") return false;
  return true;
}

const CTX_RADIUS = 60; // normalised characters on each side of the binding identifier

// ast: parsed with ranges. realOf(topLevelName) -> real name or undefined.
// Returns { program, decls: Map(real -> decl) } where decl is
//   { real, path, start, end, bindings: [{ binding, ordinal, name, ctx, occ }], occurrences: [{ node, scope, binding }] }
// `occ` numbers bindings that share a ctx within one declaration, in order.
export function collectLocals(ast, src, realOf) {
  let program;
  const declOf = new Map(); // top-level declarator / declaration node -> decl
  const decls = new Map();
  traverse(ast, {
    Program(p) {
      program = p.scope;
      for (const st of p.get("body")) {
        const units = st.isVariableDeclaration() ? st.get("declarations")
          : (st.isFunctionDeclaration() || st.isClassDeclaration()) ? [st] : [];
        for (const u of units) {
          const id = u.node.id;
          if (id?.type !== "Identifier") continue;
          const real = realOf(id.name);
          if (!real) continue;
          const d = { real, path: u, start: u.node.start, end: u.node.end, bindings: [], occurrences: [] };
          declOf.set(u.node, d); decls.set(real, d);
        }
      }
    },
  });
  // which declaration a path lies in: the top-level unit that contains it
  const unitOf = (p) => {
    let q = p;
    while (q.parentPath && !q.parentPath.isProgram()) {
      if (declOf.has(q.node)) return declOf.get(q.node);
      q = q.parentPath;
    }
    return declOf.get(q.node);
  };
  const seen = new Set();
  traverse(ast, {
    Scope(p) {
      if (p.scope === program) return;
      const d = unitOf(p);
      if (!d) return;
      for (const b of Object.values(p.scope.bindings)) {
        if (seen.has(b)) continue;
        seen.add(b);
        d.bindings.push({ binding: b, name: b.identifier.name });
      }
    },
    Identifier(p) {
      if (!isVariableOccurrence(p)) return;
      const d = unitOf(p);
      if (!d) return;
      d.occurrences.push({ node: p.node, scope: p.scope, binding: p.scope.getBinding(p.node.name) || null, path: p });
    },
  });
  for (const d of decls.values()) {
    d.bindings.sort((x, y) => x.binding.identifier.start - y.binding.identifier.start);
    d.bindings.forEach((e, i) => { e.ordinal = i; });
    const local = new Set(d.bindings.map(e => e.binding));
    // normalised text of the declaration, with a map from source offsets
    const edits = [];
    for (const o of d.occurrences) {
      let text;
      if (o.binding && local.has(o.binding)) text = "_";
      else if (o.binding && o.binding.scope === program) text = realOf(o.node.name) ?? "#";
      else continue; // a global keeps its spelling
      edits.push({ start: o.node.start, end: o.node.end, text });
    }
    edits.sort((a, b) => a.start - b.start);
    let out = "", pos = d.start;
    const at = new Map(); // binding identifier start -> offset in `out`
    const idStarts = new Set(d.bindings.map(e => e.binding.identifier.start));
    for (const e of edits) {
      out += src.slice(pos, e.start).replace(/\s+/g, " ");
      if (idStarts.has(e.start)) at.set(e.start, out.length);
      out += e.text; pos = e.end;
    }
    out += src.slice(pos, d.end).replace(/\s+/g, " ");
    const count = new Map();
    for (const e of d.bindings) {
      const o = at.get(e.binding.identifier.start);
      const win = o === undefined ? `?${e.ordinal}` : out.slice(Math.max(0, o - CTX_RADIUS), o) + "@" + out.slice(o + 1, o + 1 + CTX_RADIUS);
      e.ctx = crypto.createHash("sha1").update(win).digest("hex").slice(0, 16);
      e.occ = count.get(e.ctx) ?? 0;
      count.set(e.ctx, e.occ + 1);
    }
  }
  return { program, decls };
}
