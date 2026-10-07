// Names for the functions nested inside a top-level declaration.
//
// A first-party factory such as createDaemon or createSessionManager is one
// top-level declaration holding hundreds of closures: the RPC dispatcher, the
// actor methods, the hook handlers. The rename map cannot reach them (it
// renames top-level bindings only, that is what the equivalence proof covers),
// but they have names of their own: the property key, variable or method they
// are assigned to. `outer>name` is that name, and `outer>anon@<line>` when
// nothing names the function. instrument.mjs traces calls under these names
// and xref.mjs records them per symbol, so a trace and a symbol card speak of
// the same closure.
const isFn = n => n && (n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression" || n.type === "FunctionDeclaration" || n.type === "ObjectMethod" || n.type === "ClassMethod" || n.type === "ClassPrivateMethod");
export function keyName(k) { return !k ? null : k.type === "Identifier" ? k.name : k.type === "StringLiteral" ? k.value : k.type === "PrivateName" ? "#" + k.id.name : null; }

// the name of a function node from what it is assigned to, or null
export function closureName(node, parent) {
  if (node.type === "FunctionDeclaration" && node.id) return node.id.name;
  if (node.type === "FunctionExpression" && node.id) return node.id.name;
  if (node.type === "ObjectMethod" || node.type === "ClassMethod" || node.type === "ClassPrivateMethod") return keyName(node.key);
  if (!parent) return null;
  if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier") return parent.id.name;
  if (parent.type === "ObjectProperty" && parent.value === node) return keyName(parent.key);
  if (parent.type === "AssignmentExpression" && parent.right === node) return parent.left.type === "Identifier" ? parent.left.name : parent.left.type === "MemberExpression" && !parent.left.computed ? keyName(parent.left.property) : null;
  if (parent.type === "ClassProperty" && parent.value === node) return keyName(parent.key);
  return null;
}

const SKIP = new Set(["loc", "range", "leadingComments", "trailingComments", "innerComments", "extra"]);
// every function nested in `root` (not root itself), in source order:
// [{ node, name: "<outer>><name>", line, endLine, named: boolean }]
export function nestedFunctions(root, outer) {
  const out = [];
  const walk = (node, parent) => {
    if (!node || typeof node.type !== "string") return;
    if (node !== root && isFn(node)) {
      const n = closureName(node, parent);
      out.push({ node, name: `${outer}>${n ?? `anon@${node.loc.start.line}`}`, line: node.loc.start.line, endLine: node.loc.end.line, named: !!n });
    }
    for (const k of Object.keys(node)) {
      if (SKIP.has(k)) continue;
      const v = node[k];
      if (Array.isArray(v)) for (const x of v) walk(x, node);
      else if (v && typeof v.type === "string") walk(v, node);
    }
  };
  walk(root, null);
  return out;
}
