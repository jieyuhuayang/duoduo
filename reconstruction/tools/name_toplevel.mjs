// Naming tasks for unnamed top-level code: the same hand-off as
// `name_locals.mjs tasks`, one level up.
//
// At v0.8.6 -> v0.8.7 seventeen new top-level declarations (the main-session
// helpers, the role-prompt selector, a cli module initialiser...) were named by
// reading each body by hand before a doc could cite them. The facts that choice
// rests on are already in the generated maps: xref_<bundle>.json lists every
// unnamed top-level declaration with the named declarations that use it, the
// rename map says what those are, the subsystem map where they live. This tool
// puts them next to the body, so an agent (or a person) can propose names in
// one pass, and name_symbol.mjs --batch --dry-run then checks every proposal
// against the same gates as a hand registration (kind, spelling, collisions,
// first-party evidence) before anything is written.
//
// Per candidate the task file gives: the short name, its kind and the spelling
// that kind needs (function camelCase, module initialiser init<Name>Module,
// literal constant UPPER_SNAKE), the named declarations that use it (and their
// subsystems; the most common one is the suggested subsystem), the string
// literals in its body, and the body itself (shortened). An uninitialised
// `var` cannot carry a name; it is listed under the module initialiser that
// assigns it, which can.
//
// Candidates are the unnamed declarations at least one named declaration uses,
// ranked by how many named functions (not module initialisers, which "use" every
// module they import) use them. With --new <fp.json> (bump.sh's
// fingerprint match), only declarations with no unchanged counterpart in the old
// release are kept: the code this release added or rewrote, which is where a bump
// leaves unnamed code a doc must cite.
//
// Usage:
//   node name_toplevel.mjs tasks <pretty.js> <xref.json> <rename.json> <subsys.json> <outdir>
//        [--new <fp_<bundle>.json>] [--limit <N>] [--min-users <k>] [--types <types_daemon.json>]
// --types (type_seed.mjs's output) adds a `signature:` line per candidate whose
// parameters or return type the TypeScript checker knows.
// Writes <outdir>/toplevel.md (instructions, then one section per candidate) and
// <outdir>/toplevel.tsv (one line per candidate: short, empty name, suggested
// subsystem). Fill in the names, delete the lines you leave unnamed, then:
//   node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch <outdir>/toplevel.tsv
// and, when it reports every entry ok, the same without --dry-run.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import { topLevelDeclarations, isFunctionLike } from "./verify_inferred.mjs";

const [CMD, PRETTY, XREF, RENAME, SUBSYS, OUTDIR, ...rest] = process.argv.slice(2);
const opt = (name) => { const i = rest.indexOf(name); return i < 0 ? undefined : rest[i + 1]; };
if (CMD !== "tasks" || !OUTDIR) {
  console.error("usage: node name_toplevel.mjs tasks <pretty.js> <xref.json> <rename.json> <subsys.json> <outdir> [--new <fp.json>] [--limit <N>] [--min-users <k>]");
  process.exit(2);
}
const LIMIT = Number(opt("--limit") ?? 60), MIN_USERS = Number(opt("--min-users") ?? 1), FP = opt("--new");
// ---- --types <types_daemon.json> (type_seed.mjs): read-only. One `signature:` line per candidate
// whose parameters or return the TypeScript checker knows (`unnamed` entries, keyed by short name).
const TYPES = opt("--types");
const typesUnnamed = TYPES ? (JSON.parse(fs.readFileSync(TYPES, "utf8")).unnamed ?? {}) : {};
const signatureLine = (short) => {
  const t = typesUnnamed[short];
  const known = (d) => d && (d.kind === "typed" || d.kind === "propagated");
  if (!t || !(t.params.some(known) || known(t.returns))) return [];
  const show = (d) => (known(d) ? `${d.type}${d.kind === "propagated" ? " (from call sites)" : ""}` : "any");
  const ps = t.params.map((p) => `${p.name}: ${show(p)}`).join(", ");
  return [`signature (TypeScript checker, type_seed.mjs): (${ps}) => ${show(t.returns)}`];
};
// ---- end --types ----

const src = fs.readFileSync(PRETTY, "utf8");
const ast = parse(src, { sourceType: "module", ranges: true });
const decls = topLevelDeclarations(ast);
const xref = JSON.parse(fs.readFileSync(XREF, "utf8"));
const rename = JSON.parse(fs.readFileSync(RENAME, "utf8"));
const subsys = fs.existsSync(SUBSYS) ? JSON.parse(fs.readFileSync(SUBSYS, "utf8")) : {};
// declarations that kept an identical body: fp.json maps old short -> { new, unique }
const unchanged = new Set();
if (FP) for (const m of Object.values(JSON.parse(fs.readFileSync(FP, "utf8")).matched ?? {})) if (typeof m.new === "string") unchanged.add(m.new);

// spans, for bodies and literals (per declarator, as locate_by_anchor.mjs)
const span = new Map();
for (const s of ast.program.body) {
  if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) span.set(s.id.name, [s.start, s.end]);
  else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") span.set(d.id.name, [d.start, d.end]);
}
// uninitialised var -> the module initialiser that assigns it
const assignedBy = new Map();
for (const [name, d] of decls) {
  if (d.kind !== "moduleInit") continue;
  const stack = [d.node];
  while (stack.length) {
    const n = stack.pop();
    if (!n || typeof n !== "object") continue;
    if (Array.isArray(n)) { stack.push(...n); continue; }
    if (n.type === "AssignmentExpression" && n.left.type === "Identifier" && decls.get(n.left.name)?.kind === "var (uninitialised)" && !assignedBy.has(n.left.name)) assignedBy.set(n.left.name, name);
    if (n !== d.node && /Function/.test(n.type)) continue;  // only the initialiser's own statements
    for (const k in n) if (k !== "loc" && n[k] && typeof n[k] === "object") stack.push(n[k]);
  }
}

const TRIVIAL = new Set(["null", "true", "false", "(!0)", "(!1)", "!0", "!1", "(void 0)", "void 0", "0", "1", "(-1)", "-1", '""', "[]", "{}"]);
const kindOf = (d) => isFunctionLike(d) ? "function" : d.kind === "moduleInit" ? "module initialiser" : d.kind === "value" ? "literal constant" : null;
const spelling = { "function": "camelCase (a class: PascalCase)", "module initialiser": "init<Name>Module", "literal constant": "UPPER_SNAKE with an underscore" };
const literals = (name) => {
  const [a, b] = span.get(name) ?? [0, 0];
  const out = new Set();
  for (const m of src.slice(a, b).matchAll(/"((?:[^"\\]|\\.){6,120})"|`([^`$]{6,120})/g)) out.add((m[1] ?? m[2]).replace(/\s+/g, " "));
  return [...out].slice(0, 12);
};
const body = (name, lines = 40) => {
  const [a, b] = span.get(name) ?? [0, 0];
  const t = src.slice(a, b).split("\n");
  return t.slice(0, lines).map((l) => l.slice(0, 180)).join("\n") + (t.length > lines ? `\n… (${t.length} lines)` : "");
};
const named = new Set([...Object.keys(rename)]);
// the unnamed top-level variables a body touches, with the NAMED code that also
// uses them: a three-line body like \`function Hue(e) { FU = e }\` says nothing,
// but "FU: also used by moveSessionDirToArchive" says it sets the archive
// listener. At v0.8.7 a naming pass without this guessed "corrupt file quarantine"
function sharedState(short) {
  const [a, b] = span.get(short) ?? [0, 0];
  const out = [];
  for (const id of new Set(src.slice(a, b).match(/[A-Za-z_$][\w$]*/g) ?? [])) {
    if (id === short || named.has(id)) continue;
    const d = decls.get(id);
    if (!d || !String(d.kind).startsWith("var")) continue;
    // xref.unnamed does not list every unnamed var; then look in the named bodies
    const u = xref.unnamed?.[id];
    const re = new RegExp(`(?<![\\w$.])${id.replace(/\$/g, "\\$")}(?![\\w$])`);
    const usedBy = u?.usedBy ?? [...span].filter(([n, [x, y]]) => n !== short && named.has(n) && re.test(src.slice(x, y))).map(([n]) => rename[n]);
    const users = usedBy.filter((x) => !/^init[A-Z]\w*Module$/.test(x));
    if (users.length) out.push({ name: id, users: users.slice(0, 6) });
  }
  return out.slice(0, 6);
}

// candidates: unnamed, used by named code; an uninitialised var stands for its initialiser
const cand = new Map();  // short -> { users: Set, via: [] }
for (const [short, u] of Object.entries(xref.unnamed ?? {})) {
  let target = short, via = null;
  if (u.kind === "var (uninitialised)") { target = assignedBy.get(short); via = short; if (!target) continue; }
  if (named.has(target)) continue;
  const d = decls.get(target);
  if (!d || !kindOf(d)) continue;
  // `var kue = {}` is a module's export object (filled through esbuild's export
  // helper), and `!0`, `null`, `""` say nothing a name could: verify_inferred.mjs
  // treats these literals as trivial too
  if (d.kind === "value" && TRIVIAL.has(d.canonical)) continue;
  if (FP && unchanged.has(target)) continue;
  const c = cand.get(target) ?? { users: new Set(), via: [] };
  for (const x of u.usedBy ?? []) c.users.add(x);
  if (via) c.via.push(via);
  cand.set(target, c);
}
const rows = [...cand].map(([short, c]) => {
  const users = [...c.users].sort();
  const dirs = new Map();
  for (const x of users) if (subsys[x]) dirs.set(subsys[x], (dirs.get(subsys[x]) || 0) + 1);
  const suggested = [...dirs].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  // a module initialiser "uses" every module it imports, so only users that are
  // not themselves initialisers say how much first-party code depends on this one
  const fnUsers = users.filter((x) => !/^init[A-Z]\w*Module$/.test(x)).length;
  return { short, kind: kindOf(decls.get(short)), line: decls.get(short).line, users, fnUsers, suggested, via: c.via };
}).filter((r) => r.users.length >= MIN_USERS)
  .sort((a, b) => b.fnUsers - a.fnUsers || b.users.length - a.users.length || a.line - b.line)
  .slice(0, LIMIT);

fs.mkdirSync(OUTDIR, { recursive: true });
const head = [
  "# Naming tasks: unnamed top-level code",
  "",
  "For each section, read the body and how the named code below uses it, and write a name into `toplevel.tsv`",
  "(second column; keep or change the suggested subsystem in the third). Spell it for its kind: a function in",
  "camelCase, a module initialiser as `init<Name>Module`, a literal constant in UPPER_SNAKE; at least 8 characters;",
  "say what the code does, from its string literals, property names and callers -- never from a local's name.",
  "Delete the line of anything you cannot name with confidence. Then check every proposal before writing it:",
  "",
  "    node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch toplevel.tsv",
  "",
  `${rows.length} candidate(s)${FP ? ", new or rewritten in this release" : ""}, most used first.`, ""];
const md = head.concat(rows.flatMap((r) => [
  `## ${r.short} (${r.kind}, line ${r.line})`, "",
  `spell: ${spelling[r.kind]}; suggested subsystem: ${r.suggested}`,
  `used by: ${r.users.slice(0, 12).map((u) => `${u}${subsys[u] ? ` [${subsys[u]}]` : ""}`).join(", ")}${r.users.length > 12 ? ` (+${r.users.length - 12})` : ""}`,
  ...(r.via.length ? [`assigns: ${r.via.join(", ")} (uninitialised vars the code reads; cite their values through this initialiser)`] : []),
  ...(literals(r.short).length ? [`strings: ${literals(r.short).map((s) => JSON.stringify(s)).join(", ")}`] : []),
  ...sharedState(r.short).map((x) => `shares ${x.name}: also used by ${x.users.join(", ")}`),
  ...signatureLine(r.short), // --types
  "", "```js", body(r.short), "```", ""]));
fs.writeFileSync(path.join(OUTDIR, "toplevel.md"), md.join("\n"));
fs.writeFileSync(path.join(OUTDIR, "toplevel.tsv"), rows.map((r) => `${r.short}\t\t${r.suggested}`).join("\n") + "\n");
console.log(`name_toplevel: ${rows.length} candidate(s) -> ${path.join(OUTDIR, "toplevel.md")}, ${path.join(OUTDIR, "toplevel.tsv")}`);
