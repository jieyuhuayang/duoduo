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
// The task file (naming_context.mjs holds the instruction text and the
// vocabulary code, shared with name_locals.mjs and naming_bench.mjs):
//   - candidates are ordered LEAF-FIRST (a candidate that calls no other
//     candidate comes before its callers, GenNm-style propagation: the name
//     given to a callee is context for the caller) and GROUPED by subsystem;
//     within a group, candidates sharing a caller sit together, and the groups
//     are in a topological order (a group after the groups holding its
//     callees; where groups call each other, the group the most call edges
//     lead into goes first and the callees still printed after their callers
//     are marked `(below, group X)`, counted in the file's first line)
//   - each group opens with the subsystem's VOCABULARY: the real names already
//     registered there (by verb), the CHANGELOG words paired to them
//     (--changelog maps/changelog_daemon.json) and the protocol package's type
//     and field names sharing a token with the group's code (--protocol <dir of
//     @openduo/protocol/src>)
//   - per candidate: its kind and the spelling that kind needs (function
//     camelCase, module initialiser init<Name>Module, literal constant
//     UPPER_SNAKE), the named declarations that use it (and their subsystems;
//     the most common one is the suggested subsystem), the candidates it calls,
//     the string literals in its body, the unnamed variables it shares with
//     named code, the registered names and protocol entries that share a token
//     with its property names and strings, the CHANGELOG entries of its callers
//     and callees, and the body with every known top-level name applied
//     (naming_context.renderSpan) so only candidates are still short names
//   - the instruction asks for ONE sentence describing what the code does,
//     then up to 3 candidate names in the registered spelling, length-capped
//     (`toplevel.proposals.json`); `tsv` turns that into the batch list,
//     keeping the first candidate.
// An uninitialised `var` cannot carry a name; it is listed under the module
// initialiser that assigns it, which can (with --only it can be listed itself,
// for the benchmark, with the assignment as its body).
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
//        [--new <fp_<bundle>.json>] [--limit <N>] [--min-users <k>]
//        [--changelog <changelog_daemon.json>] [--protocol <dir>] [--only <short,...|file.json>] [--body-lines <N>]
//        [--types <types_daemon.json>]
// --types (type_seed.mjs's output) adds a `signature:` line per candidate whose
// parameters or return type the TypeScript checker knows.
//   node name_toplevel.mjs tsv <toplevel.proposals.json> <toplevel.tsv>
// Writes <outdir>/toplevel.md (instructions, then one section per candidate),
// <outdir>/toplevel.proposals.json (a skeleton to fill: describe, names, subsystem)
// and <outdir>/toplevel.tsv (one line per candidate: short, empty name, suggested
// subsystem; `tsv` rewrites it from the filled proposals). Then:
//   node name_symbol.mjs --build <OUT> --dry-run <pretty.js> --batch <outdir>/toplevel.tsv
// and, when it reports every entry ok, the same without --dry-run.
import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import { topLevelDeclarations, isFunctionLike } from "./verify_inferred.mjs";
import { topLevelReferences, refsIn, renderSpan, spanEvidence, loadProtocolVocab, protocolMatches,
  subsystemVocabulary, relatedNames, changelogEntries, vocabularyBlockLines, TOPLEVEL_PROMPT } from "./naming_context.mjs";

const TRIVIAL = new Set(["null", "true", "false", "(!0)", "(!1)", "!0", "!1", "(void 0)", "void 0", "0", "1", "(-1)", "-1", '""', "[]", "{}"]);
const KINDS = { "function": "function", "module initialiser": "moduleInit", "literal constant": "value" };
const spelling = { "function": "camelCase (a class: PascalCase)", "module initialiser": "init<Name>Module", "literal constant": "UPPER_SNAKE with an underscore" };
const isInit = (x) => /^init[A-Z]\w*Module$/.test(x);

// opts: { src, xref, rename, subsys, changelog?, protocol? (loaded vocab), fp?, limit, minUsers, only?: Set, bodyLines,
//         types? (type_seed.mjs's `unnamed` map, keyed by short name) }
export function buildTasks(opts) {
  const { src, xref, rename, subsys, changelog, protocol, only } = opts;
  const limit = opts.limit ?? 60, minUsers = opts.minUsers ?? 1, bodyLines = opts.bodyLines ?? 60;
  // ---- --types <types_daemon.json> (type_seed.mjs): read-only. One `signature:` line per candidate
  // whose parameters or return the TypeScript checker knows (`unnamed` entries, keyed by short name).
  const typesUnnamed = opts.types ?? {};
  const signatureLine = (short) => {
    const t = typesUnnamed[short];
    const known = (d) => d && (d.kind === "typed" || d.kind === "propagated");
    if (!t || !(t.params.some(known) || known(t.returns))) return [];
    const show = (d) => (known(d) ? `${d.type}${d.kind === "propagated" ? " (from call sites)" : ""}` : "any");
    const ps = t.params.map((p) => `${p.name}: ${show(p)}`).join(", ");
    return [`signature (TypeScript checker, type_seed.mjs): (${ps}) => ${show(t.returns)}`];
  };
  // ---- end --types ----
  const ast = parse(src, { sourceType: "module", ranges: true });
  const decls = topLevelDeclarations(ast);
  const refs = topLevelReferences(ast);
  const unchanged = new Set();
  if (opts.fp) for (const m of Object.values(opts.fp.matched ?? {})) if (typeof m.new === "string") unchanged.add(m.new);

  // spans, for bodies and literals (per declarator, as locate_by_anchor.mjs)
  const span = new Map();
  for (const s of ast.program.body) {
    if ((s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") && s.id) span.set(s.id.name, [s.start, s.end]);
    else if (s.type === "VariableDeclaration") for (const d of s.declarations) if (d.id.type === "Identifier") span.set(d.id.name, [d.start, d.end]);
  }
  // uninitialised var -> the module initialiser that assigns it, and the assignment
  const assignedBy = new Map();
  for (const [name, d] of decls) {
    if (d.kind !== "moduleInit") continue;
    const stack = [d.node];
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { stack.push(...n); continue; }
      if (n.type === "AssignmentExpression" && n.left.type === "Identifier" && decls.get(n.left.name)?.kind === "var (uninitialised)" && !assignedBy.has(n.left.name)) assignedBy.set(n.left.name, { init: name, node: n });
      if (n !== d.node && /Function/.test(n.type)) continue;  // only the initialiser's own statements
      for (const k in n) if (k !== "loc" && n[k] && typeof n[k] === "object") stack.push(n[k]);
    }
  }
  const kindOf = (d) => isFunctionLike(d) ? "function" : d.kind === "moduleInit" ? "module initialiser" : d.kind === "value" ? "literal constant" : null;
  const named = new Set(Object.keys(rename));
  const realOf = (s) => rename[s] ?? s;
  const spanOf = (short) => {
    const a = assignedBy.get(short);
    if (a && decls.get(short)?.kind === "var (uninitialised)") return [a.node.start, a.node.end];
    return span.get(short) ?? [0, 0];
  };
  const literals = (short) => {
    const [a, b] = spanOf(short);
    const out = new Set();
    for (const m of src.slice(a, b).matchAll(/"((?:[^"\\]|\\.){6,120})"|`([^`$]{6,120})/g)) out.add((m[1] ?? m[2]).replace(/\s+/g, " "));
    return [...out].slice(0, 12);
  };
  // the unnamed top-level variables a body touches, with the NAMED code that also
  // uses them: a three-line body like `function Hue(e) { FU = e }` says nothing,
  // but "FU: also used by moveSessionDirToArchive" says it sets the archive
  // listener. At v0.8.7 a naming pass without this guessed "corrupt file quarantine"
  function sharedState(short) {
    const [a, b] = spanOf(short);
    const out = [];
    for (const id of new Set(refsIn(refs, a, b).map((r) => r.name))) {
      if (id === short || named.has(id)) continue;
      const d = decls.get(id);
      if (!d || !String(d.kind).startsWith("var")) continue;
      const u = xref.unnamed?.[id];
      const usedBy = u?.usedBy ?? [...span].filter(([n, [x, y]]) => n !== short && named.has(n) && refsIn(refs, x, y).some((r) => r.name === id)).map(([n]) => rename[n]);
      const users = usedBy.filter((x) => !isInit(x));
      if (users.length) out.push({ name: id, users: users.slice(0, 6) });
    }
    return out.slice(0, 6);
  }

  // candidates: unnamed, used by named code; an uninitialised var stands for its initialiser
  const cand = new Map();  // short -> { users: Set, via: [] }
  for (const [short, u] of Object.entries(xref.unnamed ?? {})) {
    let target = short, via = null;
    if (u.kind === "var (uninitialised)" && !(only?.has(short))) { target = assignedBy.get(short)?.init; via = short; if (!target) continue; }
    if (named.has(target)) continue;
    if (only && !only.has(target)) continue;
    const d = decls.get(target);
    if (!d || !(kindOf(d) || (only && d.kind === "var (uninitialised)" && assignedBy.has(target)))) continue;
    // `var kue = {}` is a module's export object (filled through esbuild's export
    // helper), and `!0`, `null`, `""` say nothing a name could: verify_inferred.mjs
    // treats these literals as trivial too
    if (d.kind === "value" && TRIVIAL.has(d.canonical)) continue;
    if (opts.fp && unchanged.has(target)) continue;
    const c = cand.get(target) ?? { users: new Set(), via: [] };
    for (const x of u.usedBy ?? []) c.users.add(x);
    if (via) c.via.push(via);
    cand.set(target, c);
  }
  let rows = [...cand].map(([short, c]) => {
    const users = [...c.users].sort();
    const dirs = new Map();
    for (const x of users) if (subsys[x]) dirs.set(subsys[x], (dirs.get(subsys[x]) || 0) + 1);
    const suggested = [...dirs].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    // a module initialiser "uses" every module it imports, so only users that are
    // not themselves initialisers say how much first-party code depends on this one
    const fnUsers = users.filter((x) => !isInit(x)).length;
    const d = decls.get(short);
    const kind = kindOf(d) ?? "literal constant";
    const [a, b] = spanOf(short);
    return { short, kind, line: d.kind === "var (uninitialised)" ? src.slice(0, a).split("\n").length : d.line, users, fnUsers, suggested, via: c.via,
      assignedIn: d.kind === "var (uninitialised)" ? realOf(assignedBy.get(short).init) : null, span: [a, b] };
  }).filter((r) => r.users.length >= minUsers)
    .sort((a, b) => b.fnUsers - a.fnUsers || b.users.length - a.users.length || a.line - b.line)
    .slice(0, limit);

  // leaf-first: a candidate that references another candidate comes after it
  const inSet = new Set(rows.map((r) => r.short));
  for (const r of rows) r.calls = [...new Set(refsIn(refs, r.span[0], r.span[1]).map((x) => x.name))].filter((n) => n !== r.short && inSet.has(n)).sort();
  const depth = new Map();
  const depthOf = (short, seen = new Set()) => {
    if (depth.has(short)) return depth.get(short);
    if (seen.has(short)) return 0;
    seen.add(short);
    const r = rows.find((x) => x.short === short);
    const d = r.calls.length ? 1 + Math.max(...r.calls.map((c) => depthOf(c, seen))) : 0;
    depth.set(short, d);
    return d;
  };
  for (const r of rows) r.depth = depthOf(r.short);
  // groups: subsystem; within a group depth, then shared users, then line
  const groups = new Map();
  for (const r of rows) (groups.get(r.suggested) ?? groups.set(r.suggested, []).get(r.suggested)).push(r);
  // a group comes after every group holding one of its callees (a topological
  // order over the groups; ties by the group's deepest member, "-" last, then
  // name), so a callee in another group is above its caller too. Only when
  // groups call each other is the order broken: then the group that the most
  // remaining call edges lead into, net of the edges leading out of it, goes
  // first (the fewest callees end up printed after their callers), and those
  // callees are marked "(below, group X)". Ordering by depth alone left
  // callees below their callers: at v0.8.7 one leaf in 08-cadence-subconscious
  // was called from three earlier groups (four edges) while two of its
  // candidates called 03-session-actor (two edges); this order leaves two
  const groupOf = new Map(rows.map((r) => [r.short, r.suggested]));
  const groupDepth = (g) => Math.max(...groups.get(g).map((r) => r.depth));
  const tie = (a, b) => groupDepth(a) - groupDepth(b) || (a === "-") - (b === "-") || a.localeCompare(b);
  const pending = new Map([...groups.keys()].map((g) => [g, new Map()]));  // group -> callee group -> call edges
  for (const r of rows) for (const c of r.calls) {
    const w = pending.get(r.suggested), cg = groupOf.get(c);
    if (cg !== r.suggested) w.set(cg, (w.get(cg) || 0) + 1);
  }
  const groupOrder = [];
  while (pending.size) {
    const ready = [...pending].filter(([, w]) => !w.size).map(([g]) => g).sort(tie);
    let g = ready[0];
    if (g === undefined) {  // every remaining group waits for another: a cycle
      const into = (x) => [...pending.values()].reduce((n, w) => n + (w.get(x) || 0), 0);
      const outOf = (x) => [...pending.get(x).values()].reduce((n, k) => n + k, 0);
      g = [...pending.keys()].sort((a, b) => (into(b) - outOf(b)) - (into(a) - outOf(a)) || tie(a, b))[0];
    }
    groupOrder.push(g);
    pending.delete(g);
    for (const w of pending.values()) w.delete(g);
  }
  for (const g of groups.values()) g.sort((a, b) => a.depth - b.depth || (a.users[0] ?? "").localeCompare(b.users[0] ?? "") || a.line - b.line);
  const ordered = groupOrder.flatMap((g) => groups.get(g));
  const position = new Map(ordered.map((r, i) => [r.short, i]));
  // a callee in a later group is still a candidate: say where it is
  const callNote = (r) => r.calls.map((c) => position.get(c) < position.get(r.short) ? `${c} (above)` : `${c} (below, group ${rows.find((x) => x.short === c).suggested})`).join(", ");
  // `main` and the module initialisers use everything; their CHANGELOG entries say nothing about one callee
  const informative = (n) => n !== "main" && !isInit(n);

  const below = ordered.filter((r) => r.calls.some((c) => position.get(c) > position.get(r.short))).length;
  const md = [...TOPLEVEL_PROMPT, `${rows.length} candidate(s)${opts.fp ? ", new or rewritten in this release" : ""} in ${groups.size} group(s), leaf-first${below ? ` except ${below} candidate(s) calling a candidate printed below them (marked)` : ""}.`, ""];
  const proposals = {};
  for (const g of groupOrder) {
    const list = groups.get(g);
    const voc = subsystemVocabulary(g, subsys, changelog);
    const groupTokens = new Set();
    for (const r of list) for (const t of spanEvidence(src, r.span[0], r.span[1]).tokens) groupTokens.add(t);
    md.push(`## group ${g} (${list.length} candidate${list.length === 1 ? "" : "s"})`, "", ...vocabularyBlockLines(g, voc, protocol, groupTokens));
    for (const r of list) {
      const ev = spanEvidence(src, r.span[0], r.span[1]);
      const neighbours = [...new Set([...r.users, ...refsIn(refs, r.span[0], r.span[1]).map((x) => rename[x.name]).filter(Boolean)])];
      const related = relatedNames(voc.names, ev.tokens, 10, new Set(neighbours));
      const proto = protocolMatches(protocol, ev.tokens, 8);
      const cl = changelogEntries(changelog, neighbours.filter(informative), 3);
      md.push(
        `### ${r.short} (${r.kind}, line ${r.line}${r.depth ? `, calls ${r.calls.length} candidate${r.calls.length === 1 ? "" : "s"}` : ", leaf"})`, "",
        `spell: ${spelling[r.kind]}; suggested subsystem: ${r.suggested}`,
        `used by: ${r.users.slice(0, 12).map((u) => `${u}${subsys[u] ? ` [${subsys[u]}]` : ""}`).join(", ")}${r.users.length > 12 ? ` (+${r.users.length - 12})` : ""}`,
        ...(r.calls.length ? [`calls candidates: ${callNote(r)} (use the names you give them)`] : []),
        ...(r.assignedIn ? [`assigned in: ${r.assignedIn} (the body below is that assignment)`] : []),
        ...(r.via.length ? [`assigns: ${r.via.join(", ")} (uninitialised vars the code reads; cite their values through this initialiser)`] : []),
        ...(literals(r.short).length ? [`strings: ${literals(r.short).map((s) => JSON.stringify(s)).join(", ")}`] : []),
        ...sharedState(r.short).map((x) => `shares ${x.name}: also used by ${x.users.join(", ")}`),
        ...signatureLine(r.short), // --types
        ...(related.length ? [`related registered names: ${related.join(", ")}`] : []),
        ...(proto.length ? [`protocol: ${proto.join(", ")}`] : []),
        ...cl.map((x) => `changelog: ${x}`),
        "", "```js", renderSpan(src, r.span[0], r.span[1], refs, rename, new Set(), bodyLines), "```", "");
      proposals[r.short] = { kind: KINDS[r.kind], subsystem: r.suggested, describe: "", names: [] };
    }
  }
  const tsv = ordered.map((r) => `${r.short}\t\t${r.suggested}`).join("\n") + "\n";
  return { rows: ordered, md: md.join("\n"), tsv, proposals };
}

// proposals -> batch TSV: the first candidate of each entry that has one
export function proposalsToTsv(proposals) {
  const lines = [];
  for (const [short, p] of Object.entries(proposals)) {
    const name = Array.isArray(p?.names) ? p.names[0] : typeof p === "string" ? p : p?.name;
    if (!name) continue;
    lines.push(`${short}\t${name}\t${p?.subsystem ?? "-"}${p?.allowUnproven ? "\tallow-unproven" : ""}`);
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const [CMD, ...args] = process.argv.slice(2);
  const usage = () => {
    console.error("usage: node name_toplevel.mjs tasks <pretty.js> <xref.json> <rename.json> <subsys.json> <outdir> [--new <fp.json>] [--limit <N>] [--min-users <k>]\n" +
      "            [--changelog <changelog_daemon.json>] [--protocol <dir>] [--only <short,...|file.json>] [--body-lines <N>] [--types <types_daemon.json>]\n" +
      "       node name_toplevel.mjs tsv <toplevel.proposals.json> <toplevel.tsv>");
    process.exit(2);
  };
  if (CMD === "tsv") {
    const [IN, OUT] = args;
    if (!IN || !OUT) usage();
    const text = proposalsToTsv(JSON.parse(fs.readFileSync(IN, "utf8")));
    fs.writeFileSync(OUT, text);
    console.log(`name_toplevel: ${text.split("\n").filter(Boolean).length} line(s) -> ${OUT}`);
  } else if (CMD === "tasks") {
    const [PRETTY, XREF, RENAME, SUBSYS, OUTDIR, ...rest] = args;
    const opt = (name) => { const i = rest.indexOf(name); return i < 0 ? undefined : rest[i + 1]; };
    if (!OUTDIR) usage();
    const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
    let only;
    if (opt("--only")) {
      const v = opt("--only");
      only = new Set(v.endsWith(".json") ? Object.keys(readJson(v)) : v.split(","));
    }
    const changelogPath = opt("--changelog") ?? path.join(path.dirname(SUBSYS), "changelog_daemon.json");
    const res = buildTasks({
      src: fs.readFileSync(PRETTY, "utf8"), xref: readJson(XREF), rename: readJson(RENAME),
      subsys: fs.existsSync(SUBSYS) ? readJson(SUBSYS) : {},
      changelog: fs.existsSync(changelogPath) ? readJson(changelogPath) : null,
      protocol: loadProtocolVocab(opt("--protocol")),
      fp: opt("--new") ? readJson(opt("--new")) : null,
      limit: Number(opt("--limit") ?? 60), minUsers: Number(opt("--min-users") ?? 1), only,
      bodyLines: Number(opt("--body-lines") ?? 60),
      types: opt("--types") ? (readJson(opt("--types")).unnamed ?? {}) : undefined, // --types (type_seed.mjs)
    });
    fs.mkdirSync(OUTDIR, { recursive: true });
    fs.writeFileSync(path.join(OUTDIR, "toplevel.md"), res.md);
    fs.writeFileSync(path.join(OUTDIR, "toplevel.tsv"), res.tsv);
    fs.writeFileSync(path.join(OUTDIR, "toplevel.proposals.json"), JSON.stringify(res.proposals, null, 2) + "\n");
    console.log(`name_toplevel: ${res.rows.length} candidate(s) -> ${path.join(OUTDIR, "toplevel.md")}, toplevel.proposals.json, toplevel.tsv`);
  } else usage();
}
